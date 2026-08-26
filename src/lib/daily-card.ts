/**
 * Carte du jour — tirage déterministe par date (même carte toute la journée pour tout le
 * monde qui l'ouvre, sans backend). Le jeu de cartes est un jeu d'intentions/affirmations,
 * pas un tarot divinatoire à proprement parler — reste dans un cadre bien-être, pas prédictif.
 */

export type DailyCard = { title: string; message: string; symbol: string };

const DECK: DailyCard[] = [
  { title: 'Ancrage', message: "Aujourd'hui, prends le temps de sentir tes pieds au sol.", symbol: '🜃' },
  { title: 'Abondance', message: 'La vie te donne déjà plus que tu ne le remarques.', symbol: '✦' },
  { title: 'Clarté', message: 'Une réponse que tu cherches est plus simple que tu ne le crois.', symbol: '◈' },
  { title: 'Douceur', message: "Sois aussi indulgent·e envers toi qu'envers un ami.", symbol: '❋' },
  { title: 'Courage', message: 'Le premier pas compte plus que le chemin entier.', symbol: '▲' },
  { title: 'Lâcher-prise', message: "Ce que tu ne peux contrôler n'a pas besoin de ton énergie.", symbol: '〜' },
  { title: 'Gratitude', message: "Nomme trois choses simples qui t'ont fait sourire hier.", symbol: '✧' },
  { title: 'Renouveau', message: 'Un cycle se termine pour en laisser naître un autre.', symbol: '☾' },
  { title: 'Confiance', message: "Tu n'as pas besoin de toutes les réponses pour avancer.", symbol: '◆' },
  { title: 'Écoute', message: 'Ton corps te parle avant ton mental — prends une pause.', symbol: '〰' },
  { title: 'Alignement', message: 'Fais aujourd’hui une chose qui te ressemble vraiment.', symbol: '✶' },
  { title: 'Patience', message: 'Ce qui pousse lentement pousse solidement.', symbol: '❁' },
  { title: 'Énergie', message: "Un excès d'agitation cache souvent un besoin de repos.", symbol: '⚡' },
  { title: 'Connexion', message: "Tends la main à quelqu'un aujourd'hui, même un simple mot.", symbol: '♥' },
  { title: 'Créativité', message: "Une idée mise de côté mérite d'être ressortie.", symbol: '❉' },
  { title: 'Protection', message: 'Pose une limite douce mais claire aujourd’hui.', symbol: '🛡' },
  { title: 'Guérison', message: "Une blessure ancienne demande juste d'être reconnue.", symbol: '✚' },
  { title: 'Lumière', message: "Ce que tu traverses t'apprend plus que tu ne le vois encore.", symbol: '☀' },
  { title: 'Intuition', message: 'Ton premier ressenti était le bon.', symbol: '👁' },
  { title: 'Simplicité', message: "Retire une chose de ta journée plutôt que d'en ajouter une.", symbol: '○' },
  { title: 'Chemin', message: "Tu n'as pas besoin de voir toute la route pour faire le premier pas.", symbol: '➳' },
  { title: 'Sérénité', message: "Trois respirations lentes suffisent à changer ton état.", symbol: '༄' },
  { title: 'Éveil', message: 'Une habitude discrète mérite ton attention aujourd’hui.', symbol: '✺' },
  { title: 'Harmonie', message: 'Cherche l’équilibre plutôt que la perfection, aujourd’hui.', symbol: '☯' },
];

function dayIndex(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const diff = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start;
  return Math.floor(diff / 86_400_000);
}

export function getDailyCard(date: Date = new Date()): DailyCard {
  const index = dayIndex(date) % DECK.length;
  return DECK[index];
}
