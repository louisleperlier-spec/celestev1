/**
 * Mode « Axel Enragé » (hors cahier des charges, demandé par l'utilisateur, oct. 2026) : notifications satiriques qui poussent à bouger.
 * Activé par défaut depuis le 6 nov. 2026 (demande de l'utilisateur : tous les jours, plusieurs fois par jour), 3 niveaux. Le ton vise la paresse et les excuses, jamais le corps ni le poids ; pas de gros mots.
 * Il se calme tout seul quand le cœur demande du repos (bilan de la nuit en surcharge). Fonctions pures.
 * `{p}` = prénom, `{s}` = titre de la séance, `{n}` = nombre (jours de série ou d'absence).
 */
import { tr } from './langue';

export type NiveauEnrage = 'taquin' | 'venere' | 'sanspitie';
/** Expressions de la mascotte (`MASCOTTE_IMAGES` de @/data). */
export type ExpressionMascotte = 'face' | 'motive' | 'fatigue' | 'fier' | 'boude';
export type MomentEnrage = 'matin' | 'midi' | 'aprem' | 'seance' | 'relance' | 'serie' | 'absent' | 'repos' | 'retour' | 'jourOff';

/** Axel Enragé est actif tant qu'on ne l'a pas coupé (absent = activé). */
export const enrageActif = (nset: { enrage?: boolean }) => nset.enrage !== false;

export const NIVEAUX_ENRAGE: Record<NiveauEnrage, { nom: string; desc: string }> = {
  taquin: { nom: 'Taquin 😏', desc: 'Il te charrie gentiment' },
  venere: { nom: 'Vénère 😤', desc: 'Il perd patience' },
  sanspitie: { nom: 'Sans pitié 💀', desc: 'Plus aucune limite (sauf la politesse)' },
};

export const TITRES_ENRAGE: Record<NiveauEnrage, string> = { taquin: 'Axel 😏', venere: 'Axel Enragé 😤', sanspitie: 'Axel Sans pitié 💀' };

type Banque = Record<NiveauEnrage, readonly string[]>;

const SEANCE: Banque = {
  taquin: [
    '{s} t’attend. Elle commence à se poser des questions sur votre relation. 🤔',
    'Petit rappel amical : {s}, c’est aujourd’hui. Pas demain. Aujourd’hui. 😏',
    '{p}, ta séance est prête. Toi, je sais pas encore.',
    'Tes haltères m’ont dit qu’ils s’ennuyaient. Je dis ça, je dis rien. 🏋️',
    'J’ai réchauffé {s} pour toi. Faudrait pas que ça refroidisse.',
    'Spoiler : tu vas te sentir mieux après {s}. Promis. 😌',
    'Ton futur toi te remercie d’avance pour {s}.',
    'C’est l’heure. Enfin… c’était l’heure il y a 1 h 30. 👀',
  ],
  venere: [
    '{s}. Maintenant. Je compte jusqu’à 3. 😤',
    'Ton canapé a déposé plainte pour harcèlement. Lève-toi. 🛋️',
    '{p}, j’ai vu que t’as ouvert ton téléphone. Donc t’as des bras. Donc tu peux faire {s}.',
    'Tes baskets m’ont écrit. Elles pensent que tu les as quittées pour quelqu’un d’autre. 💔',
    'Petite question : {s}, c’est pour aujourd’hui ou pour ta prochaine vie ?',
    'J’ai vu ton historique de séries Netflix. Moi aussi je peux te regarder 45 minutes. 👀',
    'Ton excuse du jour ? Laisse-moi deviner : « trop fatigué ». Lève-toi. 🙄',
    'Je suis pas fâché. Je suis déçu. Bon, un peu fâché aussi. {s}. Go.',
    'Même ton frigo a plus bougé que toi aujourd’hui. Et il est branché au mur. 🧊',
    '{s} a été prévue avec amour. Ne m’oblige pas à devenir méchant.',
  ],
  sanspitie: [
    '{p}. {s}. Maintenant. Je ne le répéterai pas. (Si, je le répéterai.) 💀',
    'Ta séance pleure dans un coin. Tu es fier de toi ? 😢',
    'J’ai prévenu Kai et Nova. Ils sont très déçus. Très.',
    'Je t’ai préparé {s}. Toi, tu m’as préparé une déception. 💀',
    'Les escargots du quartier ont fait plus de kilomètres que toi cette semaine. 🐌',
    'Ton tapis de sport a demandé l’asile chez le voisin.',
    'Tu sais qui ne fait pas sa séance ? Les gens qui ne finissent pas leurs rêves. Allez. 🔥',
    '{s} ou je change ton fond d’écran en photo de moi qui te fixe. 👁️👁️',
    'Le canapé t’a pas épousé. Lève-toi, c’est pas un mariage.',
    'Je compte jusqu’à 3. 1… 2… J’ai pas besoin d’aller à 3, hein ? 😤',
  ],
};

const RELANCE: Banque = {
  taquin: [
    'Toujours pas ? Bon. Je vais faire semblant de pas avoir vu. 🙈',
    'Il reste un peu de soirée. Et {s} tient en {n} minutes.',
    'Dernière chance pour aujourd’hui, {p}. Je dis ça gentiment. 😇',
    'Même 15 minutes, ça compte. Je te jure.',
  ],
  venere: [
    '21 h. Toujours rien. Je commence à prendre ça personnellement. 😤',
    'Tu m’ignores ? Moi qui t’ai fait un programme sur mesure… 💔',
    'Il est encore temps. Pas pour longtemps. Bouge.',
    '{n} minutes, {p}. Moins qu’un épisode. Sans le générique.',
    'Ton futur toi vient de m’appeler. Il est pas content du tout. 📞',
  ],
  sanspitie: [
    'C’est mon dernier message de la soirée. Après, je vais pleurer sous la douche. 🚿',
    '21 h. Toujours rien. J’écris déjà le discours aux funérailles de ta motivation. ⚰️',
    'Je t’ai laissé 3 heures. 3. Même une tortue aurait fini sa séance. 🐢',
    '{n} minutes. C’est tout ce que je demande. Ou je reviens demain. Et après-demain. Et…',
    'Sois honnête : tu lis ça allongé, hein ? 💀',
  ],
};

const SERIE: Banque = {
  taquin: [
    'Ta série de {n} jours se termine à minuit. Ce serait dommage, non ? 🔥',
    '{n} jours d’affilée ! Ce serait bête de s’arrêter là, {p}.',
    'Ta série de {n} jours te regarde avec des yeux de chiot. 🐶',
  ],
  venere: [
    'Ta série de {n} jours meurt dans 3 h. Tu vas vraiment la laisser tomber ? 😤',
    '{n} jours. Tu as construit ça. Et tu vas tout jeter pour un canapé ?',
    'ALERTE : ta série de {n} jours est en danger critique. Une activité. N’importe laquelle. 🚨',
  ],
  sanspitie: [
    'Ta série de {n} jours meurt à minuit. Je prépare déjà le discours aux funérailles. ⚰️',
    '{n} jours de série. Et tu vas la tuer. Comme ça. De sang-froid. 💀',
    'Si ta série de {n} jours meurt ce soir, je la ferai encadrer avec écrit « Ici repose ta motivation ».',
  ],
};

const ABSENT: Banque = {
  taquin: [
    '{n} jours sans te voir. Tu me manques un peu. Juste un peu. 🥺',
    'Coucou {p} ! Ça fait {n} jours. On reprend doucement ?',
    'Hé, {p}. {n} jours. Une petite marche, ça compte aussi. 🚶',
  ],
  venere: [
    '{n} jours. {n}. J’ai cru que tu avais déménagé. 😤',
    'Avis de recherche : {p}, vu(e) pour la dernière fois il y a {n} jours en tenue de sport. 🔎',
    '{n} jours sans bouger. Tes muscles ont créé un groupe de soutien.',
  ],
  sanspitie: [
    '{n} jours. J’ai déjà prévenu la police. Et ta mère. 💀',
    'Après {n} jours, tes baskets ont officiellement porté plainte pour abandon.',
    '{n} jours sans séance. J’ai commencé à parler aux haltères. Ils m’écoutent, eux.',
  ],
};

/** Quand le cœur demande du repos : Axel se calme, quel que soit le niveau. */
const MATIN: Banque = {
  taquin: [
    'Bonjour {p} ☀️ Aujourd’hui, il y a {s} au programme. Je te laisse ton café d’abord.',
    'Debout, champion. {s} t’attend ce soir, prépare-toi mentalement. 😏',
    'Nouvelle journée, nouvelle chance de ne pas m’ignorer. {s} ce soir. 👋',
    'Petit-déj, douche, {s}. Dans cet ordre. Tu peux le faire.',
    'Je dis ça comme ça : {s} aujourd’hui. Je te le redirai. Souvent. 😇',
    'Le soleil est levé. Toi aussi, j’espère. {s} au menu du jour.',
  ],
  venere: [
    'Réveil. {s} aujourd’hui. Je te préviens maintenant pour que tu n’aies AUCUNE excuse ce soir. 😤',
    'Bonjour {p}. Je vais te parler de {s} toute la journée. Autant la faire tôt.',
    '{s} aujourd’hui. Je le note. Tu le notes. On le note tous. 📝',
    'Debout. Ta séance ne va pas se faire toute seule, j’ai vérifié. 😒',
    'J’ai mis {s} dans ton agenda. Et dans ta tête. Bonne journée. 😤',
    'Café ? Bien. Maintenant pense à {s}. Toute la journée. Je t’aiderai.',
  ],
  sanspitie: [
    '{p}. {s}. Aujourd’hui. Je ne lâcherai pas. Jamais. 💀',
    'Tu croyais que la nuit m’avait calmé ? Non. {s} aujourd’hui.',
    'Bonjour. Je serai là à midi, à 16 h, à 19 h 30 et à 21 h. Fais {s} et je disparais. 👻',
    'Ta séance du jour : {s}. Ta mission : me faire taire. Bonne chance. 💀',
    'Je n’ai pas dormi. J’ai pensé à {s} toute la nuit. À toi de jouer.',
    'Rappel du matin, le premier d’une longue série : {s}. 😈',
  ],
};

const MIDI: Banque = {
  taquin: [
    'Bonne pause midi ! {s} ce soir, garde un peu d’énergie. 🍽️',
    'Mange bien, {p}. Tes muscles ont rendez-vous avec {s}. 💪',
    'Midi pile. Il reste quelques heures avant {s}. Je dis ça… 😏',
    'Pense à boire de l’eau. Et à {s}. Surtout à {s}.',
  ],
  venere: [
    'Midi. Toujours pas de séance. Je patiente. Mal. 😤',
    'Tu manges ? Parfait. Ce sera du carburant pour {s}. Pas une excuse.',
    'La moitié de la journée est passée. {s} non. 😒',
    '{p}, je te vois scroller pendant ta pause. Tu pourrais lire ta séance à la place. 👀',
  ],
  sanspitie: [
    'Midi. Ma patience fond plus vite que ton excuse de ce soir. 💀',
    'Je ne dis rien. Je regarde. Je compte. {s}. 👁️',
    'Une pause déj, c’est bien. Une pause dans ta vie sportive, non.',
    'Je prépare déjà le message de 21 h. Il est méchant. Évite-le. 😈',
  ],
};

const APREM: Banque = {
  taquin: [
    'Fin d’aprèm en vue ! Et tu sais ce qu’il y a après ? {s}. 😏',
    'Tu tiens le coup ? Garde-en un peu pour {s}.',
    'Petit coup de mou ? 10 squats et ça repart. Et {s} ce soir. 😉',
    '16 h, l’heure du goûter. Et de penser à {s}.',
  ],
  venere: [
    '16 h. Si tu fais {s} maintenant, ta soirée est libre. Réfléchis. 😤',
    'Tu as tenu toute la journée sans bouger. Impressionnant. Dans le mauvais sens.',
    'Je recompte : il te reste quelques heures pour {s}. Le temps file. ⏳',
    'Ton canapé t’attend. Moi aussi. Choisis bien.',
  ],
  sanspitie: [
    '16 h. Dernier avertissement avant le mode 19 h 30. 💀',
    'J’ai déjà écrit trois messages pour ce soir. Ils sont tous pires. Fais {s}.',
    'Le compte à rebours a commencé. {s} ou les représailles. 😈',
    'Je t’ai à l’œil depuis ce matin. Toujours rien. Intéressant.',
  ],
};

const JOUR_OFF: Banque = {
  taquin: [
    'Pas de séance aujourd’hui ! Mais une petite marche de 20 min, ça te dit ? 🚶',
    'Jour de repos, {p}. Repos ne veut pas dire canapé toute la journée. 😏',
    'Profite du repos. Étire-toi 5 min, ton dos te dira merci.',
    'Aujourd’hui on récupère. Bois de l’eau, dors bien, bouge un peu.',
  ],
  venere: [
    'C’est ton jour off. Pas ton jour « je ne fais rien de ma vie ». 20 min de marche. 😤',
    'Repos, oui. Hibernation, non. Va prendre l’air.',
    'Je te laisse tranquille aujourd’hui. Enfin… presque. Marche un peu. 😒',
    'Jour sans séance. Mais tes jambes, elles, marchent toujours, non ?',
  ],
  sanspitie: [
    'Jour de repos. Je surveille quand même. Toujours. 💀',
    'Même au repos, je compte tes pas. Ne me déçois pas.',
    'Profite. Demain, je reviens. Et je serai d’humeur. 😈',
    'Repos aujourd’hui. Mais je prépare déjà demain matin. Tu vas adorer.',
  ],
};

const REPOS: readonly string[] = [
  'Ton cœur a eu une nuit chargée. Même moi, je te laisse tranquille ce soir. Repos. 😌',
  'Pas de séance forcée aujourd’hui : ton corps récupère. Je range mes menaces. 🛌',
  'Récupération d’abord. Je reviendrai te hurler dessus demain, promis. 💤',
];

const RETOUR: Banque = {
  taquin: ['Te revoilà ! Je savais que tu reviendrais. 😏', 'Bien joué, {p}. On continue comme ça ?'],
  venere: ['Ah. T’es vivant. Bon. Bien joué, je suppose. 😒', 'Enfin ! J’allais lancer un avis de recherche.'],
  sanspitie: ['Ah. T’es vivant. Bon. Bien joué, je suppose. 😒', 'Je ne pleure pas. C’est la sueur. Bon retour. 🥲'],
};

const BANQUES: Record<Exclude<MomentEnrage, 'repos'>, Banque> = { matin: MATIN, midi: MIDI, aprem: APREM, jourOff: JOUR_OFF, seance: SEANCE, relance: RELANCE, serie: SERIE, absent: ABSENT, retour: RETOUR };

/** Index stable pour un jour : un message différent chaque jour, sans tirage au hasard. */
const numJour = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);

export function messageEnrage(
  moment: MomentEnrage,
  niveau: NiveauEnrage,
  v: { prenom?: string; seance?: string; n?: number; date?: Date },
): { title: string; body: string } {
  const liste = moment === 'repos' ? REPOS : BANQUES[moment][niveau];
  const sel = { matin: 17, midi: 19, aprem: 23, jourOff: 29, seance: 1, relance: 3, serie: 5, absent: 7, retour: 11, repos: 13 }[moment];
  const t = liste[(numJour(v.date ?? new Date()) * 7 + sel) % liste.length];
  const body = tr(t)
    .replaceAll('{p}', v.prenom?.trim() || tr('toi'))
    .replaceAll('{s}', tr(v.seance ?? 'Ta séance'))
    .replaceAll('{n}', String(v.n ?? ''));
  return { title: tr(moment === 'repos' ? 'Axel (calmé) 😌' : TITRES_ENRAGE[niveau]), body };
}

/** Nombre de messages (pour l'écran de réglage). */
export const NB_MESSAGES_ENRAGE =
  REPOS.length + Object.values(BANQUES).reduce((a, b) => a + b.taquin.length + b.venere.length + b.sanspitie.length, 0);

/** Expression de la mascotte pour un message : fière (Taquin), bras croisés (Vénère, Sans pitié), motivée (série, retour), fatiguée (repos). */
export function expressionEnrage(moment: MomentEnrage, niveau: NiveauEnrage): ExpressionMascotte {
  if (moment === 'repos') return 'fatigue';
  if (moment === 'retour' || moment === 'serie' || moment === 'matin') return 'motive';
  if (moment === 'jourOff') return 'face';
  return niveau === 'taquin' ? 'fier' : 'boude';
}
