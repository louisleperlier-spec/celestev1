-- Archétype realtime-chat — messagerie temps réel.
-- Tables : `conversations`, `conversation_participants` (qui est dans quelle conversation),
-- `messages`. Plus la MODÉRATION (obligatoire côté Apple 1.2, voir le README) : `reports`
-- et `blocks`. La visibilité repose sur « suis-je participant ? » — testé par une fonction
-- SECURITY DEFINER pour éviter la récursion RLS sur `conversation_participants`.
--
-- ADAPTER : renomme si besoin, enrichis `messages` (image, pièce jointe). NE retire pas la
-- RLS, la fonction `is_participant`, ni la MODÉRATION (report/block) — Apple rejette une
-- messagerie sans signalement/blocage.

-- ── Tables ────────────────────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_created_idx on public.messages (conversation_id, created_at);

-- Modération (Apple 1.2) : signalements + utilisateurs bloqués.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- ── Helper anti-récursion ─────────────────────────────────────────────────────────────
-- SECURITY DEFINER → contourne la RLS de `conversation_participants` : sans ça, une policy
-- sur cette table qui interroge la même table boucle à l'infini.
create or replace function public.is_participant(conv uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants p
    where p.conversation_id = conv and p.user_id = auth.uid()
  );
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────────────
alter table public.conversations enable row level security;
drop policy if exists "conversations_participant" on public.conversations;
create policy "conversations_participant" on public.conversations
  for select using (public.is_participant(id));

alter table public.conversation_participants enable row level security;
drop policy if exists "participants_visible" on public.conversation_participants;
create policy "participants_visible" on public.conversation_participants
  for select using (public.is_participant(conversation_id));

alter table public.messages enable row level security;
-- Lecture : participant de la conversation ET l'expéditeur n'est pas bloqué par moi.
drop policy if exists "messages_read" on public.messages;
create policy "messages_read" on public.messages
  for select using (
    public.is_participant(conversation_id)
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = messages.sender_id
    )
  );
-- Écriture : je suis participant ET j'écris en mon nom (sender_id = moi).
drop policy if exists "messages_write" on public.messages;
create policy "messages_write" on public.messages
  for insert with check (sender_id = auth.uid() and public.is_participant(conversation_id));

alter table public.reports enable row level security;
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (reporter_id = auth.uid());

alter table public.blocks enable row level security;
drop policy if exists "blocks_own" on public.blocks;
create policy "blocks_own" on public.blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ── Realtime ──────────────────────────────────────────────────────────────────────────
-- Nécessaire pour recevoir les INSERT de `messages` en direct (souscription côté client).
-- La RLS ci-dessus s'applique AUSSI au flux realtime → on ne reçoit que ce qu'on a le droit
-- de lire (et rien d'un utilisateur bloqué).
alter publication supabase_realtime add table public.messages;

-- ── RPC : démarrer / lister (SECURITY DEFINER : accès contrôlé à auth.users) ───────────
-- Trouve-ou-crée une conversation 1:1 avec un autre utilisateur (par email).
create or replace function public.start_conversation(other_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  other uuid;
  conv uuid;
begin
  if me is null then raise exception 'not_authenticated'; end if;

  select id into other from auth.users where lower(email) = lower(trim(other_email)) limit 1;
  if other is null then raise exception 'user_not_found'; end if;
  if other = me then raise exception 'cannot_message_self'; end if;

  -- Conversation 1:1 déjà existante entre les deux ?
  select c.id into conv
  from public.conversations c
  join public.conversation_participants p1 on p1.conversation_id = c.id and p1.user_id = me
  join public.conversation_participants p2 on p2.conversation_id = c.id and p2.user_id = other
  where (select count(*) from public.conversation_participants p where p.conversation_id = c.id) = 2
  limit 1;
  if conv is not null then return conv; end if;

  insert into public.conversations default values returning id into conv;
  insert into public.conversation_participants (conversation_id, user_id)
    values (conv, me), (conv, other);
  return conv;
end;
$$;

-- Liste MES conversations : l'autre participant + le dernier message, triées par récence.
create or replace function public.list_my_conversations()
returns table (
  conversation_id uuid,
  other_user_id uuid,
  other_email text,
  last_body text,
  last_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    other.user_id,
    au.email::text,
    lm.body,
    coalesce(lm.created_at, c.created_at)
  from public.conversations c
  join public.conversation_participants me
    on me.conversation_id = c.id and me.user_id = auth.uid()
  left join lateral (
    select p.user_id from public.conversation_participants p
    where p.conversation_id = c.id and p.user_id <> auth.uid()
    limit 1
  ) other on true
  left join auth.users au on au.id = other.user_id
  left join lateral (
    select m.body, m.created_at from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc limit 1
  ) lm on true
  order by coalesce(lm.created_at, c.created_at) desc;
$$;

grant execute on function public.start_conversation(text) to authenticated;
grant execute on function public.list_my_conversations() to authenticated;
