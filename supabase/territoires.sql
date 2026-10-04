-- NÉA : Territoires (vélo et course) : la ville découpée en hexagones d'environ 150 m ; chaque case traversée devient à toi.
-- À coller dans Supabase > SQL Editor > New query, puis « Run » (après schema.sql et ligue.sql). Le script peut être relancé sans risque.
--
-- Règles : une case libre, à moi, ou abandonnée (personne n'y est passé depuis 14 jours) est prise tout de suite ;
-- la case d'un autre joueur est volée, sauf si elle a été prise il y a moins de 24 h (bouclier).
-- Grille : coordonnées axiales (q, r) d'hexagones calculés dans l'app (src/lib/territoires.ts) ; le serveur ne stocke que (q, r).
--
-- Sécurité : table fermée (RLS sans règle) ; tout passe par les fonctions ci-dessous, réservées aux comptes connectés
-- qui ont un joueur de la Ligue. Des autres joueurs, seuls le prénom et le coach sont renvoyés.

-- 1. Table
create table if not exists public.territoires (
  q integer not null,
  r integer not null,
  proprio uuid not null references public.joueurs (id) on delete cascade,
  pris timestamptz not null default now(),
  vu timestamptz not null default now(),
  primary key (q, r)
);
create index if not exists territoires_proprio on public.territoires (proprio);

alter table public.territoires enable row level security;
revoke all on public.territoires from anon, authenticated;

-- 2. Conquête : cases traversées pendant une sortie (au plus 3 000 par appel).
--    Renvoie les cases prises (libres ou abandonnées), volées, gardées (déjà à moi) et protégées (bouclier d'un autre).
create or replace function public.conquerir(p_q integer[], p_r integer[])
returns table (prises integer, volees integer, gardees integer, protegees integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  moi uuid := auth.uid();
  n integer := coalesce(array_length(p_q, 1), 0);
begin
  if moi is null then raise exception 'Non connecté'; end if;
  if not exists (select 1 from public.joueurs where id = moi) then raise exception 'Joueur inconnu'; end if;
  if n <> coalesce(array_length(p_r, 1), 0) or n > 3000 then raise exception 'Trop de cases'; end if;

  return query
  with c as (
    select distinct t.q, t.r from unnest(p_q, p_r) as t (q, r)
  ),
  avant as (
    select c.q, c.r, x.proprio, x.pris, x.vu
    from c left join public.territoires x on x.q = c.q and x.r = c.r
  ),
  bilan as (
    select a.q, a.r,
      case
        when a.proprio is null or a.vu < now() - interval '14 days' then 'prise'
        when a.proprio = moi then 'gardee'
        when a.pris > now() - interval '24 hours' then 'protegee'
        else 'volee'
      end as sort
    from avant a
  ),
  ecrit as (
    insert into public.territoires as t (q, r, proprio, pris, vu)
    select b.q, b.r, moi, now(), now() from bilan b where b.sort <> 'protegee'
    on conflict (q, r) do update
      set proprio = excluded.proprio,
          pris = case when t.proprio = excluded.proprio and t.vu >= now() - interval '14 days' then t.pris else now() end,
          vu = now()
    returning 1
  )
  select
    (count(*) filter (where sort = 'prise'))::integer,
    (count(*) filter (where sort = 'volee'))::integer,
    (count(*) filter (where sort = 'gardee'))::integer,
    (count(*) filter (where sort = 'protegee'))::integer
  from bilan, (select count(*) from ecrit) e;
end;
$$;
revoke execute on function public.conquerir(integer[], integer[]) from public, anon;
grant execute on function public.conquerir(integer[], integer[]) to authenticated;

-- 3. Carte : cases d'une zone (au plus 4 000), avec leur propriétaire. `lien` : moi, ami, equipe ou autre.
create or replace function public.territoires_zone(p_q0 integer, p_q1 integer, p_r0 integer, p_r1 integer)
returns table (q integer, r integer, proprio uuid, prenom text, coach text, lien text, bouclier boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select t.q, t.r, t.proprio, j.prenom, j.coach,
    case
      when t.proprio = auth.uid() then 'moi'
      when exists (select 1 from public.amities a where a.a = auth.uid() and a.b = t.proprio) then 'ami'
      when j.equipe_id is not null and j.equipe_id = (select m.equipe_id from public.joueurs m where m.id = auth.uid()) then 'equipe'
      else 'autre'
    end,
    t.pris > now() - interval '24 hours'
  from public.territoires t
  join public.joueurs j on j.id = t.proprio
  where auth.uid() is not null
    and t.q between p_q0 and p_q1 and t.r between p_r0 and p_r1
    and t.vu >= now() - interval '14 days'
  limit 4000;
$$;
revoke execute on function public.territoires_zone(integer, integer, integer, integer) from public, anon;
grant execute on function public.territoires_zone(integer, integer, integer, integer) to authenticated;

-- 4. Classement autour d'une case (quartier : rayon ~20 cases, ville : ~100) : 20 premiers + mon rang et mes cases.
create or replace function public.territoires_classement(p_q integer, p_r integer, p_rayon integer)
returns table (rang integer, proprio uuid, prenom text, coach text, cases integer, moi boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with zone as (
    select t.proprio, count(*)::integer as n
    from public.territoires t
    where auth.uid() is not null
      and t.vu >= now() - interval '14 days'
      and t.q between p_q - least(p_rayon, 150) and p_q + least(p_rayon, 150)
      and t.r between p_r - least(p_rayon, 150) and p_r + least(p_rayon, 150)
    group by t.proprio
  ),
  classe as (
    select (rank() over (order by z.n desc))::integer as rang, z.proprio, j.prenom, j.coach, z.n, z.proprio = auth.uid() as moi
    from zone z join public.joueurs j on j.id = z.proprio
  )
  select * from classe where rang <= 20 or moi order by rang limit 21;
$$;
revoke execute on function public.territoires_classement(integer, integer, integer) from public, anon;
grant execute on function public.territoires_classement(integer, integer, integer) to authenticated;
