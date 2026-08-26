-- Archétype tracker-streak — `habits` (les choses à suivre) + `habit_entries` (une coche
-- par jour et par habitude). La contrainte UNIQUE (habit_id, day) garantit UNE seule coche
-- par jour → cocher deux fois est idempotent (le streak ne se dédouble jamais).
--
-- ADAPTER : renomme `habits`, ajoute des champs (couleur, objectif/jour, icône…). Le
-- « jour » est stocké en `date` (résolu côté client dans le fuseau de l'utilisateur).

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;

drop policy if exists "habits_owner" on public.habits;
create policy "habits_owner" on public.habits
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.habit_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, day)
);

alter table public.habit_entries enable row level security;

drop policy if exists "habit_entries_owner" on public.habit_entries;
create policy "habit_entries_owner" on public.habit_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists habit_entries_habit_day_idx on public.habit_entries (habit_id, day desc);
