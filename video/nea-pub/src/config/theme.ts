/** Identité visuelle de la vidéo NÉA. */
export const COULEURS = {
  graphite: '#1D1E23',
  graphiteClair: '#2A2C33',
  orange: '#FF6B1A',
  orangeFonce: '#E85A0C',
  creme: '#F6F3ED',
  noir: '#111114',
  blanc: '#FFFFFF',
  gris: '#9A9AA3',
} as const;

export const POLICE = 'Inter, system-ui, sans-serif';

export const FORMAT = { largeur: 1080, hauteur: 1920, fps: 30 } as const;

/** Marges laissées libres pour l'interface des réseaux sociaux. */
export const SURE = { haut: 120, bas: 260, droite: 100, gauche: 60 } as const;

/** Zone utile (entre les marges). */
export const ZONE = {
  x: SURE.gauche,
  y: SURE.haut,
  largeur: FORMAT.largeur - SURE.gauche - SURE.droite,
  hauteur: FORMAT.hauteur - SURE.haut - SURE.bas,
} as const;

export const OMBRE = '0 24px 60px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.25)';
export const OMBRE_DOUCE = '0 14px 34px rgba(0,0,0,0.22)';

/** Ressorts courts et maîtrisés. */
export const RESSORT = { damping: 16, stiffness: 170, mass: 0.7 } as const;
export const RESSORT_DOUX = { damping: 22, stiffness: 120, mass: 0.9 } as const;

/** Durée des transitions entre scènes (images). */
export const TRANSITION = 9;
