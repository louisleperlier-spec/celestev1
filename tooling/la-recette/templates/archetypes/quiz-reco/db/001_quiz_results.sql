-- Archétype quiz-reco — table `quiz_results` (le résultat/reco de chaque utilisateur).
-- RLS : chacun ne voit que SES résultats. On garde l'historique (une ligne par passage) ;
-- l'app affiche le plus récent.
--
-- ADAPTER : `outcome_id` est une string libre (l'id de reco défini dans `questions.ts`).
-- `answers` est un JSONB (questionId → choiceId) gardé pour audit / re-calcul éventuel.
-- NE change PAS le bloc RLS.

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  outcome_id text not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.quiz_results enable row level security;

drop policy if exists "quiz_results_owner" on public.quiz_results;
create policy "quiz_results_owner" on public.quiz_results
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index pour récupérer vite le DERNIER résultat de l'utilisateur.
create index if not exists quiz_results_user_created_idx
  on public.quiz_results (user_id, created_at desc);
