-- NÉA : limite quotidienne du coach IA (étape 9).
-- À coller dans Supabase > SQL Editor > New query, puis « Run ». Le script peut être relancé sans risque.
-- Le compteur n'est lisible et modifiable que par la fonction Edge `coach` (rôle service_role) : l'app ne peut pas le remettre à zéro.

create table if not exists public.coach_quota (
  id uuid primary key references auth.users (id) on delete cascade,
  jour date not null,
  n integer not null default 0
);
alter table public.coach_quota enable row level security;
revoke all on public.coach_quota from anon, authenticated;

-- Compte un message si la limite du jour n'est pas atteinte ; renvoie les messages restants, ou -1 si la limite est atteinte.
create or replace function public.coach_consommer(p_user uuid, p_jour date, p_max integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deja integer;
begin
  insert into public.coach_quota as q (id, jour, n) values (p_user, p_jour, 0)
  on conflict (id) do update set n = case when q.jour = p_jour then q.n else 0 end, jour = p_jour
  returning n into deja;
  if deja >= p_max then return -1; end if;
  update public.coach_quota set n = n + 1 where id = p_user;
  return p_max - deja - 1;
end;
$$;

-- Rend un message si le modèle n'a pas pu répondre.
create or replace function public.coach_rendre(p_user uuid, p_jour date)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.coach_quota set n = greatest(0, n - 1) where id = p_user and jour = p_jour;
$$;

revoke execute on function public.coach_consommer(uuid, date, integer) from public, anon, authenticated;
revoke execute on function public.coach_rendre(uuid, date) from public, anon, authenticated;
grant execute on function public.coach_consommer(uuid, date, integer) to service_role;
grant execute on function public.coach_rendre(uuid, date) to service_role;
