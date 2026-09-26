/**
 * Brouillons des Conditions d'utilisation et de la Politique de confidentialité (vLegal du prototype).
 * À faire valider par un juriste et à compléter (champs entre crochets), puis à publier en ligne (URL exigée par Apple).
 * Seul changement : l'hébergement est connu (Supabase, Canada Central à Montréal).
 */
export type SectionLegale = readonly [titre: string, texte: string];

export const CONDITIONS: readonly SectionLegale[] = [
  ['Objet', "NÉA propose des programmes d'entraînement, un coach virtuel et un suivi de progression à titre informatif et de bien-être."],
  [
    'Avertissement santé',
    "NÉA ne fournit pas de conseil médical et ne remplace pas un professionnel de la santé. Consulte un médecin avant de commencer un programme, surtout si tu as un problème de santé. Arrête immédiatement en cas de douleur, de malaise ou d'essoufflement anormal. Tu utilises les exercices sous ta propre responsabilité.",
  ],
  ['Âge minimum', "L'application est réservée aux personnes de 14 ans et plus."],
  ['Estimations', 'Les charges, calories, fréquences cardiaques, VFC et scores sont des estimations et peuvent être inexactes.'],
  ['Coach IA', 'Les réponses du coach sont générées automatiquement et peuvent contenir des erreurs. Ne suis jamais un conseil qui te semble dangereux.'],
  [
    'Abonnement NÉA Plus',
    "Les abonnements se renouvellent automatiquement sauf annulation au moins 24 h avant la fin de la période en cours. L'essai gratuit se convertit en abonnement payant à la fin de l'essai. La gestion et les remboursements passent par l'App Store ou Google Play.",
  ],
  ['Compte', 'Tu peux supprimer ton compte à tout moment depuis le Profil. La suppression efface tes données de façon définitive.'],
  ['Contact', "[Nom de l'entreprise], [adresse], [courriel de contact]"],
];

export const CONFIDENTIALITE: readonly SectionLegale[] = [
  [
    'Données collectées',
    'Profil (prénom, âge, poids, objectifs, niveau), activité (séances, sorties vélo, XP), santé (fréquence cardiaque, VFC, sommeil, réponses au questionnaire santé), position GPS pendant une sortie vélo seulement, et email si tu crées un compte.',
  ],
  [
    'Pourquoi',
    'Uniquement pour personnaliser ton programme, calculer tes charges, tes calories et ta récupération, et faire fonctionner le coach. Aucune revente, aucune publicité ciblée.',
  ],
  [
    'Données de santé',
    "Elles sont sensibles au sens de la Loi 25 : elles ne sont collectées qu'avec ton consentement explicite et ne sont jamais partagées sans ton accord.",
  ],
  ['Coach IA', "Tes messages et un résumé de ton profil sont envoyés à notre fournisseur d'IA pour générer les réponses, sans ton email."],
  ['Conservation', 'Tant que ton compte existe. À la suppression du compte, tout est effacé.'],
  [
    'Tes droits',
    'Accès, rectification, suppression et retrait du consentement à tout moment, en écrivant au responsable de la protection des renseignements personnels : [nom], [courriel].',
  ],
  ['Hébergement', 'Canada (Montréal), chez notre hébergeur Supabase.'],
];
