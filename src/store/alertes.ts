/**
 * Alertes santé (hors prototype) : réglages du Profil envoyés au module natif, qui pose les notifications même app
 * fermée (modules/nea-montre/ios/AlertesSante.swift : VFC et fatigue toutes les heures, eau, vélo et dépense du jour, pas).
 */
import { OBJECTIF_PAS } from '@/lib/notifs';
import { buildPlan, sesKcal } from '@/lib/plan';

import { NeaMontre } from '../../modules/nea-montre/src';
import { autorisation, demanderAutorisation } from './notifs';
import { selectProfil, useProfil } from './profil';

let dernier = '';

function envoyer() {
  if (typeof NeaMontre?.configurerAlertes !== 'function') return;
  const st = useProfil.getState();
  if (!st.onboarded) return;
  // Objectif de dépense = cercle Bouger (séance moyenne du programme).
  const ses = buildPlan(selectProfil(st)).sessions;
  const objectifKcal = ses.length ? ses.reduce((a, s) => a + sesKcal(s, st.weight), 0) / ses.length : 300;
  const json = JSON.stringify({ ...st.alertesSante, objectifPas: OBJECTIF_PAS, objectifKcal: Math.round(objectifKcal), poids: st.weight });
  if (json === dernier) return;
  dernier = json;
  NeaMontre.configurerAlertes(json);
}

/** Au démarrage puis à chaque changement des réglages, du programme ou du poids. */
export function demarrerAlertes() {
  envoyer();
  // Sans autorisation du téléphone, rien ne s'affiche : demandée une fois si une alerte est active.
  if (typeof NeaMontre?.configurerAlertes === 'function' && Object.values(useProfil.getState().alertesSante).some(Boolean)) {
    autorisation().then((a) => {
      if (a === 'undetermined') void demanderAutorisation();
    });
  }
  useProfil.subscribe((s, avant) => {
    if (s.alertesSante !== avant.alertesSante || s.weight !== avant.weight || s.days !== avant.days || s.dur !== avant.dur || s.onboarded !== avant.onboarded) envoyer();
  });
}
