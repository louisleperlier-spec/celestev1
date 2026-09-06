export interface EmotionFamily {
  id: string;
  name: string;
  color: string;
  glow: string;
  angle: number;
  description: string;
  nuances: { low: string; mid: string; high: string };
}

export const emotionFamilies: EmotionFamily[] = [
  {
    id: "joie",
    name: "Joie",
    color: "#f5d48a",
    glow: "#fff3d0",
    angle: 0,
    description: "Légèreté, plaisir, élan vers ce qui nous fait du bien.",
    nuances: { low: "Sereine", mid: "Joyeuse", high: "Exaltée" },
  },
  {
    id: "confiance",
    name: "Confiance",
    color: "#8fe3c0",
    glow: "#d7fbea",
    angle: 45,
    description: "Sécurité intérieure, foi en soi et dans les autres.",
    nuances: { low: "Acceptation", mid: "Confiante", high: "Admirative" },
  },
  {
    id: "peur",
    name: "Peur",
    color: "#7fb3e0",
    glow: "#dbebff",
    angle: 90,
    description: "Alerte face à une menace perçue, besoin de sécurité.",
    nuances: { low: "Inquiète", mid: "Craintive", high: "Terrifiée" },
  },
  {
    id: "surprise",
    name: "Surprise",
    color: "#c9a8ff",
    glow: "#efe4ff",
    angle: 135,
    description: "Un imprévu vient bousculer ce que l'on attendait.",
    nuances: { low: "Distraite", mid: "Surprise", high: "Sidérée" },
  },
  {
    id: "tristesse",
    name: "Tristesse",
    color: "#7b8fc9",
    glow: "#e1e6f7",
    angle: 180,
    description: "Perte, manque, besoin de retrait et de réconfort.",
    nuances: { low: "Pensive", mid: "Triste", high: "Chagrinée" },
  },
  {
    id: "degout",
    name: "Dégoût",
    color: "#9bc27a",
    glow: "#eaf6de",
    angle: 225,
    description: "Rejet de ce qui va à l'encontre de nos valeurs.",
    nuances: { low: "Réticente", mid: "Dégoûtée", high: "Révulsée" },
  },
  {
    id: "colere",
    name: "Colère",
    color: "#e08a72",
    glow: "#ffe3d8",
    angle: 270,
    description: "Une limite a été franchie, besoin de la faire respecter.",
    nuances: { low: "Agacée", mid: "En colère", high: "Furieuse" },
  },
  {
    id: "anticipation",
    name: "Anticipation",
    color: "#f0a8bf",
    glow: "#ffe4ed",
    angle: 315,
    description: "Tournée vers ce qui vient, curiosité et attente.",
    nuances: { low: "Intéressée", mid: "Impatiente", high: "Vigilante" },
  },
];

export interface EmotionEntry {
  id: string;
  familyId: string;
  intensity: 1 | 2 | 3;
  note: string;
  createdAt: string;
}

export function familyById(id: string): EmotionFamily | undefined {
  return emotionFamilies.find((f) => f.id === id);
}

export function nuanceLabel(family: EmotionFamily, intensity: 1 | 2 | 3): string {
  if (intensity === 1) return family.nuances.low;
  if (intensity === 2) return family.nuances.mid;
  return family.nuances.high;
}
