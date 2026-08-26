-- Archétype list-crud — table `items` (RLS : chaque utilisateur ne voit que ses lignes).
--
-- ADAPTER : renomme `items` en ta table (recipes, notes, contacts, tasks…) et remplace
-- les colonnes métier `title` / `note` / `done` par TES champs. Garde tels quels :
--   • `user_id` (+ la clause `references auth.users`),
--   • `created_at`,
--   • le bloc `enable row level security` + la policy `..._owner`.
-- Sans la RLS activée, Apple ET Supabase considèrent les données exposées → bloquant.

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  note text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;

drop policy if exists "items_owner" on public.items;
create policy "items_owner" on public.items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index de tri de la liste (les plus récents d'abord).
create index if not exists items_user_created_idx on public.items (user_id, created_at desc);
