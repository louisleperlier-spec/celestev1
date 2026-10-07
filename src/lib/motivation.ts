/**
 * Messages de motivation (hors prototype, demandés par l'utilisateur, oct. 2026) : 123 messages, un par jour, sans répétition.
 * Ordre mélangé par personne et par cycle de 123 jours (compté depuis son premier jour) (mélange déterministe), donc jamais deux fois le même avant d'avoir vu les 120.
 * `{p}` est remplacé par le prénom (ou retiré s'il est vide).
 */
import { hash } from './xp';

export const MOTIVATIONS: readonly string[] = [
  'Chaque rep compte. Même celles que personne ne voit 💪',
  'Le plus dur, c’est de lacer tes chaussures. Le reste suit 👟',
  '{p}, ton futur toi te remercie déjà pour la séance d’aujourd’hui 🙌',
  'Pas besoin d’être parfait, juste d’être là 🔥',
  'Une petite séance vaut mieux que zéro grosse séance ✅',
  'La motivation te lance, l’habitude te garde. Garde le rythme 🔁',
  'Tu n’as pas à aimer chaque séance. Tu dois juste la commencer 😉',
  'Ton corps entend tout ce que tu lui dis. Dis-lui « on y va » 🗣️',
  'Aujourd’hui, bats juste celui que tu étais hier 🏁',
  'La sueur, c’est ta graisse qui pleure. Laisse-la pleurer 😅',
  'Dix minutes. Juste dix. Après, tu verras 😏',
  'Les résultats aiment la régularité, pas l’intensité d’un seul jour 📈',
  '{p}, chaque goutte de sueur est un dépôt sur ton compte santé 🏦',
  'Fatigué ? Normal. Abandonner ? Pas aujourd’hui 💥',
  'Tu es plus fort que ton excuse préférée 🧠',
  'Le canapé sera encore là après ta séance, promis 🛋️',
  'Un pas, puis un autre : c’est comme ça qu’on monte les sommets 🏔️',
  'Ne compte pas les jours, fais que les jours comptent 📅',
  'Ce que tu fais aujourd’hui, ton cœur s’en souviendra demain ❤️',
  'Discipline > motivation. Et tu as les deux 😎',
  'Ton seul adversaire, c’est le bouton « plus tard » ⏰',
  '{p}, la version de toi qui finit la séance est plus fière que celle qui la saute 🏆',
  'Respire, souris, pousse. Dans cet ordre 😤',
  'Petits progrès = gros résultats. Patience 🌱',
  'Tu ne regretteras jamais une séance faite. Jamais 🙅',
  'Allez, on transforme l’énergie du café en énergie de champion ☕',
  'Ton corps peut le faire. C’est ta tête qu’il faut convaincre 🧩',
  'Chaque jour actif est une victoire. Collectionne-les 🎖️',
  'Le meilleur moment pour bouger ? Maintenant 🚀',
  'Tu n’es pas en retard. Tu es en route 🛣️',
  '{p}, tes muscles t’attendent. Ne les fais pas patienter 💪',
  'Si c’était facile, tout le monde aurait ta forme 😏',
  'Bouge pour la sensation d’après. Elle vaut le coup 🌈',
  'Le doute te ralentit, l’action te libère 🔓',
  'Sois la personne qui s’entraîne même quand il pleut 🌧️',
  'La régularité bat le talent quand le talent reste au lit 🛏️',
  'On ne gagne pas en un jour, mais on gagne chaque jour 📆',
  'Fais-le pour ton cœur, il bat pour toi 24 h sur 24 ❤️',
  'Une séance de plus, une excuse de moins ✂️',
  '{p}, ton énergie est contagieuse. Va la partager avec la barre 🏋️',
  'Rappelle-toi pourquoi tu as commencé 🎯',
  'Ce n’est pas une corvée, c’est un cadeau pour ton corps 🎁',
  'Aujourd’hui, choisis le « je l’ai fait » plutôt que le « j’aurais dû » ✅',
  'Lent, c’est toujours plus rapide que l’arrêt 🐢',
  'La forme, ça ne s’achète pas. Ça se construit, brique par brique 🧱',
  'Ton coach croit en toi. Et Axel aussi 🤖',
  'Le progrès aime ceux qui reviennent 🔁',
  'Tu as survécu à 100 % de tes mauvaises journées. Une séance, c’est rien 😎',
  '{p}, montre à ton miroir ce dont tu es capable 🪞',
  'Hydrate-toi, échauffe-toi, éclate-toi 💧',
  'Les champions aussi ont des jours sans. Ils y vont quand même 🏅',
  'Chaque kilomètre te rapproche de la meilleure version de toi 🏃',
  'Ton corps est ta maison. Entretiens-la 🏡',
  'La sueur d’aujourd’hui, c’est le sourire de demain 😁',
  'Ne cherche pas le temps, prends-le ⌛',
  'Un mouvement par jour éloigne la flemme toujours 🍏',
  '{p}, tu es exactement là où tu dois être pour commencer 📍',
  'Tes jambes grognent ? Elles deviennent plus fortes 🦵',
  'Ce que tu répètes, tu le deviens. Répète l’effort 🔂',
  'Aujourd’hui, pas d’excuse : juste des reps 💯',
  'Il n’y a pas de mauvais temps, juste une bonne séance à l’intérieur 🏠',
  'Commence là où tu es, avec ce que tu as 🙌',
  'Le confort ne t’a jamais fait progresser. Le petit effort, si 📈',
  'Ta série de jours actifs t’attend. Ne la laisse pas tomber 🔥',
  '{p}, tu mérites de te sentir bien dans ton corps ✨',
  'Une respiration profonde, et c’est parti 🌬️',
  'Les grandes choses commencent par une petite séance 🌟',
  'Garde la tête haute, et les genoux aussi 😄',
  'Plus tu bouges, plus tu as d’énergie. C’est magique 🪄',
  'Tu ne te bats pas contre les autres, tu avances avec toi-même 🤝',
  'Le meilleur investissement ? Ta santé. Rendement garanti 💹',
  'Aujourd’hui, sois fier de ce que tu fais, pas de ce que tu prévois 🗓️',
  '{p}, ton futur toi a besoin de toi aujourd’hui ⏳',
  'Le premier échauffement est toujours le plus dur. Après, ça roule 🚴',
  'Fais un pas hors de ta zone de confort, il y fait meilleur ☀️',
  'Les muscles se construisent au repos, mais ils s’annoncent à l’effort 💤💪',
  'Fais de ta séance le meilleur moment de ta journée 🎶',
  'Pas de pression, juste de la progression 🌿',
  'Tu as déjà fait le plus dur : ouvrir l’app 😉',
  'Chaque séance est un vote pour la personne que tu veux devenir 🗳️',
  '{p}, aujourd’hui on vise « mieux », pas « parfait » 🎯',
  'Bouge comme si personne ne te regardait 🕺',
  'Ta santé mentale aussi adore le sport 🧘',
  'Un jour tu seras content d’avoir commencé aujourd’hui 📖',
  'Les excuses ne brûlent pas de calories. Les squats, si 🔥',
  'Le sommet n’est pas loin. Continue de grimper ⛰️',
  'Donne à ton corps une raison de te dire merci 🙏',
  'Plus fort que hier, moins fort que demain 📶',
  '{p}, ton cœur adore quand tu le fais travailler un peu ❤️‍🔥',
  'La flemme est passagère, la fierté reste 🏅',
  'Tu ne regretteras pas d’avoir transpiré. Tu regretteras d’avoir hésité 🤷',
  'Il y a une séance qui a ton nom dessus aujourd’hui 🏷️',
  'Échauffe-toi bien, et fais-toi plaisir 😊',
  'Le progrès, c’est souvent invisible… jusqu’au jour où ça se voit 👀',
  'Ce n’est pas grave d’aller doucement, tant que tu y vas 🐾',
  '{p}, ta constance est ton super-pouvoir 🦸',
  'Aujourd’hui, transforme le « je dois » en « je peux » 🔄',
  'Mets ta playlist préférée, le reste viendra tout seul 🎧',
  'Tu es à une séance d’une bien meilleure humeur 😁',
  'Le corps atteint ce que l’esprit croit possible 🧠',
  'Un peu chaque jour, beaucoup chaque mois 📊',
  'Reste curieux de ce dont tu es capable 🔍',
  '{p}, tu n’as besoin de la permission de personne pour devenir plus fort 💪',
  'Les jours difficiles font les athlètes solides 🪨',
  'Ta zone de confort est belle, mais rien n’y pousse 🌵',
  'La meilleure séance est celle que tu fais vraiment ✔️',
  'Prends soin de ton cœur : il ne prend jamais de vacances ❤️',
  'C’est pas la taille du pas qui compte, c’est la direction 🧭',
  'Ton énergie de demain se construit aujourd’hui ⚡',
  '{p}, encore un petit effort et tu vas adorer la sensation d’après 🌈',
  'Fais-le maintenant, remercie-toi plus tard 💌',
  'Rien ne change si rien ne change. Bouge 🔧',
  'Tu es plus proche de ton objectif qu’hier 🎯',
  'Chaque séance laisse une trace. Laisse-en une belle 👣',
  'Respire profondément : ton cœur te dit déjà merci 🫁',
  'Ce n’est pas le temps qui manque, c’est la priorité. Fais-toi passer en premier 🥇',
  '{p}, aujourd’hui est une super journée pour être actif ☀️',
  'Tu as tout ce qu’il faut. Il ne manque que le premier mouvement 🚦',
  'Termine ta journée avec la fierté du « fait » 🌙',
  'Un corps qui bouge est un esprit qui respire 🍃',
  '{p}, la ligne d’arrivée commence par la ligne de départ 🏁',
  'Tu es la preuve vivante que les petits efforts finissent par payer 💎',
  'Ton rythme, ta route, ta victoire 🛤️',
];

/** Index du jour : jours écoulés depuis le premier jour de la personne (sa graine, une date ISO), sinon le 1er janvier 2026. */
function jourIndex(d: Date, graine: string): number {
  const g = new Date(graine);
  const debut = Number.isNaN(+g) ? new Date(2026, 0, 1) : new Date(g.getFullYear(), g.getMonth(), g.getDate());
  return Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - debut.getTime()) / 864e5 + 0.5);
}

/** Ordre mélangé des messages pour une personne et un cycle (Fisher-Yates avec un hasard déterministe). */
function melange(graine: string, cycle: number): number[] {
  const idx = MOTIVATIONS.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(hash(`${graine}:${cycle}:${i}`) * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/** Ordre d'un cycle ; le 1er message ne reprend pas le dernier du cycle précédent. */
function ordre(graine: string, cycle: number): number[] {
  const idx = melange(graine, cycle);
  if (cycle > 0 && idx[0] === melange(graine, cycle - 1)[idx.length - 1]) [idx[0], idx[1]] = [idx[1], idx[0]];
  return idx;
}

/** Message de motivation d'un jour : différent chaque jour, aucun retour avant d'avoir vu tous les messages. */
export function motivationDuJour(graine: string, prenom: string, d: Date = new Date()): string {
  const n = MOTIVATIONS.length;
  const j = Math.max(0, jourIndex(d, graine));
  const brut = MOTIVATIONS[ordre(graine, Math.floor(j / n))[j % n]];
  return prenom ? brut.replace('{p}', prenom) : brut.replace('{p}, ', '').replace(/^./, (c) => c.toUpperCase());
}
