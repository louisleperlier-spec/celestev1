-- Archétype ai-feed — `creations` (résultats gardés) + `generation_events` (compteur de
-- quota / rate-limit, écrit UNIQUEMENT côté serveur par l'edge function `generate`).
--
-- ADAPTER : renomme `creations`, remplace `prompt` / `result` par tes champs, et adapte
-- le SYSTEM_PROMPT de l'edge function. NE change PAS la logique `generation_events`
-- (c'est ce qui protège ton budget IA contre l'abus).

create table if not exists public.creations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt text not null,
  result text not null,
  favorite boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.creations enable row level security;

drop policy if exists "creations_owner" on public.creations;
create policy "creations_owner" on public.creations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists creations_user_created_idx on public.creations (user_id, created_at desc);

-- Journal des TENTATIVES de génération (une ligne par appel, réussi ou non) → sert au
-- rate-limit. RLS activée SANS policy « owner » : aucun accès client. Seul le service
-- role de l'edge function (qui bypasse la RLS) lit/écrit cette table.
create table if not exists public.generation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  ip text,
  created_at timestamptz not null default now()
);

alter table public.generation_events enable row level security;
-- (Volontairement aucune policy → table verrouillée côté client.)

create index if not exists generation_events_user_idx on public.generation_events (user_id, created_at desc);
create index if not exists generation_events_ip_idx on public.generation_events (ip, created_at desc);
