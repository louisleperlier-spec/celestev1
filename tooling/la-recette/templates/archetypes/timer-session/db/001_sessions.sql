-- Archétype timer-session — historique des séances terminées (table `sessions`).
-- Une ligne est écrite à la FIN d'une séance (durée réellement écoulée + libellé optionnel).
--
-- ADAPTER : renomme `sessions`, ajoute des champs (type de séance, ressenti, notes, cycles…).

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text,
  duration_seconds int not null,
  completed_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

drop policy if exists "sessions_owner" on public.sessions;
create policy "sessions_owner" on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists sessions_user_completed_idx on public.sessions (user_id, completed_at desc);
