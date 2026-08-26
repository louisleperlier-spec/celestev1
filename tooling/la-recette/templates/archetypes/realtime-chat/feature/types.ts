// Archétype realtime-chat — types.
// ADAPTER : un `Message` peut porter plus qu'un texte (image, pièce jointe) — reflète-le
// alors dans la table `messages`, le repository et la bulle d'affichage.

/** Une conversation résumée pour la LISTE (renvoyée par la RPC `list_my_conversations`). */
export type ConversationSummary = {
  conversation_id: string;
  other_user_id: string | null;
  /** Email de l'autre participant (identité lisible ; adapte à un pseudo/nom si tu en as un). */
  other_email: string | null;
  last_body: string | null;
  last_at: string;
};

/** Un message d'un fil (table `messages`). Les deux derniers champs sont LOCAUX (jamais en
 *  base) : ils suivent l'état d'un envoi optimiste avant confirmation serveur. */
export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  /** Vrai tant que l'insert serveur n'est pas confirmé (bulle atténuée). */
  pending?: boolean;
  /** Vrai si l'envoi a échoué (bulle « non envoyé — toucher pour réessayer »). */
  failed?: boolean;
};
