// Étapes 4 et 5 — Écrire et Appeler : brouillon de courriel, pitch d'appel, relances.
const STATUSES = ['à contacter', 'courriel envoyé', 'appelé', 'à relancer', 'intéressé', 'gagné', 'perdu'];

function hook(b) {
  const v = b.audit?.verdict;
  const top = (b.audit?.issues || []).slice().sort((a, c) => c.w - a.w)[0]?.label;
  if (v === 'absent') return { line: `je n’ai pas trouvé de site web pour ${b.name}`, why: 'Aujourd’hui, la plupart des clients cherchent sur Google avant de se déplacer : sans site, ils tombent sur vos concurrents.' };
  if (v === 'cassé') return { line: `le site de ${b.name} ne s’ouvre pas en ce moment (${(top || '').toLowerCase()})`, why: 'Chaque client qui clique depuis Google tombe sur une erreur et repart.' };
  if (v === 'dépassé') return { line: `le site de ${b.name} mériterait un coup de jeune (${(top || '').toLowerCase()})`, why: 'Plus de 60 % des visites se font sur téléphone, et un site qui s’affiche mal fait fuir.' };
  return { line: `j’ai regardé le site de ${b.name}`, why: 'Il y a sûrement moyen d’aller chercher plus de clients en ligne.' };
}

function emailDraft(b, me) {
  const h = hook(b);
  const subject = `${b.name} — une maquette de site, déjà prête`;
  const body = `Bonjour,

Je m’appelle ${me.name || '[ton nom]'}, je crée des sites web pour les commerces de ${b.city || me.city || 'la région'}.

En passant, ${h.line}. ${h.why}

Plutôt que de vous en parler, j’ai préparé une maquette sur mesure pour ${b.name}, qui s’affiche bien sur téléphone, tablette et ordinateur. Je peux vous l’envoyer ou vous la montrer en 10 minutes, sans engagement.

Ça vous intéresse ?

${me.name || '[ton nom]'}
${me.phone || '[ton téléphone]'}${me.site ? '\n' + me.site : ''}`;
  return { subject, body };
}

function callPitch(b, me) {
  const h = hook(b);
  const issues = (b.audit?.issues || []).slice(0, 3).map((i) => '• ' + i.label).join('\n') || '• (aucun problème relevé)';
  return `OUVERTURE (10 s)
« Bonjour, est-ce que je parle au propriétaire de ${b.name} ? Je m’appelle ${me.name || '[ton nom]'}, je suis à ${me.city || 'côté'}, je fais des sites pour les commerces du coin. Vous avez deux minutes ? »

ACCROCHE
« Je vous appelle parce que ${h.line}. ${h.why} »

CE QUE TU AS RELEVÉ
${issues}

LA PREUVE
« J’ai déjà préparé une maquette pour vous. Je peux vous l’envoyer par texto ou par courriel tout de suite, vous regardez quand vous voulez. »

OBJECTIONS
— « J’ai pas le temps » → « Justement, je m’occupe de tout. Je vous envoie la maquette et vous me dites oui ou non. »
— « Ça coûte combien ? » → « Ça dépend de ce que vous voulez ; la maquette est gratuite, on en parle après l’avoir vue. »
— « J’ai déjà Facebook » → « C’est bien, mais Google montre d’abord les sites. Les deux se complètent. »
— « Mon neveu s’en occupe » → « Parfait, je peux lui envoyer la maquette comme idée de départ. »

CONCLURE
« Je vous l’envoie à quelle adresse ? » → noter le courriel, fixer la relance dans 3 jours.`;
}

function followUpDraft(b, me, n) {
  return {
    subject: `Re: ${b.name} — la maquette`,
    body: n <= 1
      ? `Bonjour,\n\nJe me permets de revenir vers vous au sujet de la maquette de site préparée pour ${b.name}. Avez-vous eu le temps d’y jeter un œil ?\n\nJe peux aussi passer vous la montrer.\n\n${me.name || '[ton nom]'}\n${me.phone || ''}`
      : `Bonjour,\n\nDernier petit message de ma part : la maquette pour ${b.name} est toujours disponible si le projet vous intéresse un jour. Bonne continuation !\n\n${me.name || '[ton nom]'}`,
  };
}

module.exports = { STATUSES, emailDraft, callPitch, followUpDraft };
