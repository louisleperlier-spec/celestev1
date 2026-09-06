export interface Resource {
  id: string;
  category: "Méditation" | "Article" | "Exercice" | "Son apaisant";
  title: string;
  description: string;
  duration: string;
  isNew?: boolean;
  color: string;
}

export const resources: Resource[] = [
  {
    id: "meditation-ancrage",
    category: "Méditation",
    title: "Ancrage sous les étoiles",
    description: "Une méditation guidée de pleine conscience pour se reconnecter au moment présent.",
    duration: "10 min",
    isNew: true,
    color: "var(--color-aurora-violet)",
  },
  {
    id: "respiration-4-7-8",
    category: "Exercice",
    title: "Respiration 4-7-8",
    description: "Un exercice de respiration guidé pour apaiser le système nerveux en moins de 5 minutes.",
    duration: "5 min",
    isNew: true,
    color: "var(--color-aurora-teal)",
  },
  {
    id: "article-plutchik",
    category: "Article",
    title: "Comprendre la roue de Plutchik",
    description: "D'où vient notre carte des émotions et comment elle éclaire les émotions complexes.",
    duration: "7 min de lecture",
    color: "var(--color-gold-400)",
  },
  {
    id: "son-pluie",
    category: "Son apaisant",
    title: "Pluie sur un toit de nuit",
    description: "Une ambiance sonore continue pour accompagner l'endormissement ou la concentration.",
    duration: "45 min",
    color: "var(--color-peur)",
  },
  {
    id: "exercice-gratitude",
    category: "Exercice",
    title: "Trois étoiles de gratitude",
    description: "Un rituel du soir en trois questions pour clore la journée avec douceur.",
    duration: "3 min",
    isNew: true,
    color: "var(--color-joie)",
  },
  {
    id: "article-colere",
    category: "Article",
    title: "La colère, une boussole",
    description: "Pourquoi la colère signale une limite franchie et comment l'écouter sans la subir.",
    duration: "6 min de lecture",
    color: "var(--color-colere)",
  },
  {
    id: "meditation-corps",
    category: "Méditation",
    title: "Scan corporel du soir",
    description: "Relâcher les tensions accumulées, zone par zone, avant de sombrer dans le sommeil.",
    duration: "15 min",
    color: "var(--color-tristesse)",
  },
  {
    id: "son-vagues",
    category: "Son apaisant",
    title: "Vagues sur la baie",
    description: "Le rythme régulier des vagues pour un fond sonore relaxant.",
    duration: "60 min",
    color: "var(--color-confiance)",
  },
];
