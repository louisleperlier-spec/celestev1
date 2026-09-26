-- NÉA : schéma Supabase (étape 5)
-- À coller dans Supabase > SQL Editor > New query, puis « Run ». Le script peut être relancé sans risque.

-- 1. Sauvegarde de l'état de l'utilisateur (profil, programme, séances, poids, XP…)
--    Une ligne par compte ; elle disparaît avec le compte (on delete cascade).
create table if not exists public.etats (
  id uuid primary key references auth.users (id) on delete cascade,
  etat jsonb not null,
  maj timestamptz not null default now()
);

-- 2. Row Level Security : chaque utilisateur ne voit et ne modifie que SA ligne.
alter table public.etats enable row level security;

drop policy if exists "etats : lecture de sa ligne" on public.etats;
create policy "etats : lecture de sa ligne" on public.etats
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "etats : création de sa ligne" on public.etats;
create policy "etats : création de sa ligne" on public.etats
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "etats : mise à jour de sa ligne" on public.etats;
create policy "etats : mise à jour de sa ligne" on public.etats
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "etats : suppression de sa ligne" on public.etats;
create policy "etats : suppression de sa ligne" on public.etats
  for delete to authenticated using ((select auth.uid()) = id);

revoke all on public.etats from anon;
grant select, insert, update, delete on public.etats to authenticated;

-- 3. « Supprimer mon compte » : efface le compte et, par cascade, toutes ses données.
--    security definer : la fonction a le droit de supprimer dans auth.users, mais seulement le compte connecté.
create or replace function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Non connecté';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
