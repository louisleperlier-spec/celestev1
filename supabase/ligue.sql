-- NÉA : Ligue (étape 10) : amis, équipes, classements.
-- À coller dans Supabase > SQL Editor > New query, puis « Run » (après schema.sql). Le script peut être relancé sans risque.
--
-- Sécurité : les tables ne sont lisibles par personne directement (RLS activée, aucune règle).
-- Tout passe par les fonctions ci-dessous, qui n'agissent que pour le compte connecté (auth.uid())
-- et ne renvoient des autres joueurs que le prénom, le coach et l'XP de ses amis et coéquipiers.

-- 1. Tables
create table if not exists public.equipes (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (char_length(nom) between 1 and 24),
  cree timestamptz not null default now()
);

create table if not exists public.joueurs (
  id uuid primary key references auth.users (id) on delete cascade,
  code text not null unique,
  prenom text not null default '',
  coach text not null default 'axel',
  xp integer not null default 0 check (xp >= 0),
  -- XP gagnée et séance faite pendant la semaine qui commence le lundi `semaine`
  semaine date,
  xp_semaine integer not null default 0 check (xp_semaine >= 0),
  actif boolean not null default false,
  equipe_id uuid references public.equipes (id) on delete set null,
  maj timestamptz not null default now()
);
create index if not exists joueurs_equipe on public.joueurs (equipe_id);

-- Amitié mutuelle : une ligne dans chaque sens.
create table if not exists public.amities (
  a uuid not null references public.joueurs (id) on delete cascade,
  b uuid not null references public.joueurs (id) on delete cascade,
  primary key (a, b),
  check (a <> b)
);

alter table public.equipes enable row level security;
alter table public.joueurs enable row level security;
alter table public.amities enable row level security;
revoke all on public.equipes, public.joueurs, public.amities from anon, authenticated;

-- Une équipe sans membre disparaît (départ du dernier membre ou suppression de son compte).
create or replace function public.ligue_nettoyer_equipes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.equipes e where e.id = old.equipe_id
    and not exists (select 1 from public.joueurs j where j.equipe_id = e.id);
  return null;
end;
$$;
revoke execute on function public.ligue_nettoyer_equipes() from public, anon, authenticated;

drop trigger if exists joueurs_nettoyer_equipes on public.joueurs;
create trigger joueurs_nettoyer_equipes
  after delete or update of equipe_id on public.joueurs
  for each row when (old.equipe_id is not null)
  execute function public.ligue_nettoyer_equipes();

-- 2. Mon joueur : créé ou mis à jour avec mon prénom, mon coach et mon XP ; renvoie mon code ami.
create or replace function public.ligue_maj(
  p_prenom text, p_coach text, p_xp integer, p_semaine date, p_xp_semaine integer, p_actif boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  moi uuid := auth.uid();
  c text;
  lettres constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if moi is null then raise exception 'Non connecté'; end if;
  select code into c from public.joueurs where id = moi;
  if c is null then
    loop
      c := 'NEA-';
      for i in 1..6 loop
        c := c || substr(lettres, 1 + floor(random() * 32)::int, 1);
      end loop;
      exit when not exists (select 1 from public.joueurs where code = c);
    end loop;
  end if;
  insert into public.joueurs as j (id, code, prenom, coach, xp, semaine, xp_semaine, actif, maj)
  values (moi, c, left(coalesce(p_prenom, ''), 40), left(coalesce(p_coach, 'axel'), 20),
          greatest(0, coalesce(p_xp, 0)), p_semaine, greatest(0, coalesce(p_xp_semaine, 0)), coalesce(p_actif, false), now())
  on conflict (id) do update set
    prenom = excluded.prenom, coach = excluded.coach, xp = excluded.xp,
    semaine = excluded.semaine, xp_semaine = excluded.xp_semaine, actif = excluded.actif, maj = now();
  return c;
end;
$$;

-- 3. Tout l'écran Ligue en un appel : mon code, mes amis, mon équipe, les équipes de mes amis, le classement des équipes.
--    p_lundi : lundi de la semaine en cours (l'XP de la semaine d'un joueur ne compte que si elle est de cette semaine).
create or replace function public.ligue_etat(p_lundi date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  moi uuid := auth.uid();
  eq uuid;
begin
  if moi is null then raise exception 'Non connecté'; end if;
  select equipe_id into eq from public.joueurs where id = moi;
  return jsonb_build_object(
    'code', (select code from public.joueurs where id = moi),
    'amis', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', j.id, 'prenom', j.prenom, 'coach', j.coach, 'xp', j.xp,
        'xp_semaine', case when j.semaine = p_lundi then j.xp_semaine else 0 end) order by j.prenom)
      from public.amities a join public.joueurs j on j.id = a.b
      where a.a = moi), '[]'::jsonb),
    'equipe', (select jsonb_build_object('id', e.id, 'nom', e.nom) from public.equipes e where e.id = eq),
    'membres', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', j.id, 'prenom', j.prenom, 'coach', j.coach, 'xp', j.xp,
        'xp_semaine', case when j.semaine = p_lundi then j.xp_semaine else 0 end,
        'actif', j.semaine = p_lundi and j.actif) order by j.prenom)
      from public.joueurs j
      where eq is not null and j.equipe_id = eq and j.id <> moi), '[]'::jsonb),
    -- Équipes que je peux rejoindre : celles de mes amis qui ont encore de la place.
    'equipes_amis', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'nom', e.nom, 'n', (select count(*) from public.joueurs m where m.equipe_id = e.id)))
      from public.equipes e
      where e.id is distinct from eq
        and exists (select 1 from public.amities a join public.joueurs j on j.id = a.b where a.a = moi and j.equipe_id = e.id)
        and (select count(*) from public.joueurs m where m.equipe_id = e.id) < 5), '[]'::jsonb),
    -- Toutes les équipes de NÉA : nom et XP seulement (les 50 premières au total et les 50 premières de la semaine).
    'classement', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'nom', t.nom, 'xp', t.xp, 'xp_semaine', t.xp_semaine))
      from (
        select e.id, e.nom, sum(j.xp)::int as xp,
               sum(case when j.semaine = p_lundi then j.xp_semaine else 0 end)::int as xp_semaine
        from public.equipes e join public.joueurs j on j.equipe_id = e.id
        group by e.id, e.nom
      ) t
      where t.id in (
        select id from (
          select e.id from public.equipes e join public.joueurs j on j.equipe_id = e.id
          group by e.id order by sum(j.xp) desc limit 50) a
        union
        select id from (
          select e.id from public.equipes e join public.joueurs j on j.equipe_id = e.id
          group by e.id order by sum(case when j.semaine = p_lundi then j.xp_semaine else 0 end) desc limit 50) b
      ) or t.id = eq), '[]'::jsonb)
  );
end;
$$;

-- 4. Ajouter un ami avec son code (amitié mutuelle et immédiate) ; renvoie son prénom.
create or replace function public.ajouter_ami(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  moi uuid := auth.uid();
  ami public.joueurs;
begin
  if moi is null then raise exception 'Non connecté'; end if;
  if not exists (select 1 from public.joueurs where id = moi) then raise exception 'Joueur inconnu'; end if;
  select * into ami from public.joueurs where code = upper(trim(p_code));
  if ami.id is null then raise exception 'Code inconnu'; end if;
  if ami.id = moi then raise exception 'C''est ton code'; end if;
  insert into public.amities (a, b) values (moi, ami.id), (ami.id, moi) on conflict do nothing;
  return ami.prenom;
end;
$$;

-- 5. Équipes : une par personne, 5 membres au plus.
create or replace function public.creer_equipe(p_nom text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  moi uuid := auth.uid();
  n text := left(trim(coalesce(p_nom, '')), 24);
  eq uuid;
begin
  if moi is null then raise exception 'Non connecté'; end if;
  if n = '' then raise exception 'Nom vide'; end if;
  if exists (select 1 from public.joueurs where id = moi and equipe_id is not null) then raise exception 'Déjà dans une équipe'; end if;
  if not exists (select 1 from public.joueurs where id = moi) then raise exception 'Joueur inconnu'; end if;
  insert into public.equipes (nom) values (n) returning id into eq;
  update public.joueurs set equipe_id = eq where id = moi;
  return eq;
end;
$$;

-- On rejoint seulement l'équipe d'un ami.
create or replace function public.rejoindre_equipe(p_equipe uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  moi uuid := auth.uid();
begin
  if moi is null then raise exception 'Non connecté'; end if;
  if exists (select 1 from public.joueurs where id = moi and equipe_id is not null) then raise exception 'Déjà dans une équipe'; end if;
  -- verrou : deux personnes ne peuvent pas prendre la 5e place en même temps
  perform 1 from public.equipes where id = p_equipe for update;
  if not found then raise exception 'Équipe introuvable'; end if;
  if not exists (select 1 from public.amities a join public.joueurs j on j.id = a.b where a.a = moi and j.equipe_id = p_equipe) then
    raise exception 'Pas une équipe d''ami';
  end if;
  if (select count(*) from public.joueurs where equipe_id = p_equipe) >= 5 then raise exception 'Équipe complète'; end if;
  update public.joueurs set equipe_id = p_equipe where id = moi;
end;
$$;

create or replace function public.quitter_equipe()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  update public.joueurs set equipe_id = null where id = auth.uid();
end;
$$;

create or replace function public.renommer_equipe(p_nom text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  n text := left(trim(coalesce(p_nom, '')), 24);
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  if n = '' then raise exception 'Nom vide'; end if;
  update public.equipes set nom = n where id = (select equipe_id from public.joueurs where id = auth.uid());
end;
$$;

-- 6. Droits : seulement les comptes connectés.
revoke execute on function public.ligue_maj(text, text, integer, date, integer, boolean) from public, anon;
revoke execute on function public.ligue_etat(date) from public, anon;
revoke execute on function public.ajouter_ami(text) from public, anon;
revoke execute on function public.creer_equipe(text) from public, anon;
revoke execute on function public.rejoindre_equipe(uuid) from public, anon;
revoke execute on function public.quitter_equipe() from public, anon;
revoke execute on function public.renommer_equipe(text) from public, anon;
grant execute on function public.ligue_maj(text, text, integer, date, integer, boolean) to authenticated;
grant execute on function public.ligue_etat(date) to authenticated;
grant execute on function public.ajouter_ami(text) to authenticated;
grant execute on function public.creer_equipe(text) to authenticated;
grant execute on function public.rejoindre_equipe(uuid) to authenticated;
grant execute on function public.quitter_equipe() to authenticated;
grant execute on function public.renommer_equipe(text) to authenticated;
