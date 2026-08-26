// Archétype list-crud — types de l'entité `Item`.
// ADAPTER : renomme `Item` → ton entité (Recipe, Note, Contact…) et remplace les champs
// par les tiens. Garde `id` et `created_at` (fournis par la base).

/** Une entité stockée en base (table `items`). */
export type Item = {
  id: string;
  title: string;
  note: string | null;
  done: boolean;
  created_at: string;
};

/** Champs éditables par l'utilisateur (création / mise à jour). */
export type ItemInput = {
  title: string;
  note?: string | null;
  done?: boolean;
};
