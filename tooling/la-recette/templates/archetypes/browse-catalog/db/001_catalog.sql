-- Archétype browse-catalog — `catalog_items` (le catalogue, lecture PUBLIQUE aux connectés)
-- + `favorites` (les favoris de chaque utilisateur, privés, RLS).
--
-- ADAPTER : renomme `catalog_items` selon ton domaine (recipes, workouts, products, places),
-- remplace les colonnes, et remplace les lignes semées ci-dessous par TON contenu (ou
-- alimente-le via un import/CSV). NE change PAS le bloc RLS des favoris.

-- ── Catalogue (lecture publique) ──────────────────────────────────────────────────────
create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  category text not null,
  tags text[] not null default '{}',
  description text,
  created_at timestamptz not null default now()
);

alter table public.catalog_items enable row level security;

-- Tout le monde de connecté peut LIRE le catalogue (contenu non privé), personne ne l'écrit
-- depuis l'app (le contenu est semé/administré côté serveur).
drop policy if exists "catalog_read" on public.catalog_items;
create policy "catalog_read" on public.catalog_items
  for select to authenticated using (true);

create index if not exists catalog_items_category_idx on public.catalog_items (category);
-- Tri/préfixe insensible à la casse sur le titre. NB : `ilike '%…%'` (joker en tête) ne peut
-- pas utiliser un index btree — pour une vraie recherche plein-texte, active `pg_trgm` et pose
-- un index GIN `gin (title gin_trgm_ops)`. Suffisant tel quel pour un catalogue modeste.
create index if not exists catalog_items_title_idx on public.catalog_items (lower(title));

-- ── Favoris (privés) ──────────────────────────────────────────────────────────────────
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.catalog_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_owner" on public.favorites;
create policy "favorites_owner" on public.favorites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Données de départ (à REMPLACER par ton vrai catalogue) ────────────────────────────
-- `where not exists` → le seed est idempotent (rejouer la migration ne duplique rien).
insert into public.catalog_items (title, subtitle, category, tags, description)
select * from (values
  ('Alpha',   'Un incontournable pour bien démarrer', 'featured', array['découverte','facile'], 'Description longue de la fiche Alpha, affichée sur l’écran de détail.'),
  ('Bravo',   'Le préféré de la communauté',          'featured', array['populaire'],           'Description longue de la fiche Bravo.'),
  ('Charlie', 'Ça monte en ce moment',                'trending', array['nouveau','populaire'], 'Description longue de la fiche Charlie.'),
  ('Delta',   'À découvrir cette semaine',            'trending', array['nouveau'],             'Description longue de la fiche Delta.'),
  ('Echo',    'Une valeur sûre',                      'classics', array['facile'],              'Description longue de la fiche Echo.'),
  ('Foxtrot', 'Un classique qui plaît toujours',      'classics', array['populaire','facile'], 'Description longue de la fiche Foxtrot.')
) as seed(title, subtitle, category, tags, description)
where not exists (select 1 from public.catalog_items limit 1);
