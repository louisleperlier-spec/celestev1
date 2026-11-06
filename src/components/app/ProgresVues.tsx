/**
 * Rubriques de l'onglet Progrès, direction « nuit » (maquettes de l'utilisateur, oct. 2026) :
 * Parcours (montagne d'ascension par niveau), Statistiques (séances en barres, temps / calories / volume, santé, poids)
 * et Collection (cartes, succès à débloquer avec leurs objectifs).
 */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { CarteJeu } from '@/components/app/CarteJeu';
import { Lvl } from '@/components/app/Lvl';
import { Appui, Card, Icon, Segmente, Text, type IconName } from '@/components/ui';
import { DECO_IMAGES } from '@/data';
import { QUESTS } from '@/data/ligue';
import { SUCCES_IMAGES, SUCCES_RATIO } from '@/data/succesImages';
import { dec, fmt } from '@/lib/charges';
import { CARTES, possedees } from '@/lib/jeu';
import { santeDisponible } from '@/lib/sante';
import { baseHrv } from '@/lib/sommeil';
import { avancement, debloque, missionFaite, SUCCES, type SuccesId } from '@/lib/succes';
import { gelsDispo, GEL_PALIER, serieAvecGels } from '@/lib/gel';
import { lvlInfo, rankOf, todayQuests, type Log } from '@/lib/xp';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, ui } from '@/theme';

/* ---------------- Parcours ---------------- */

/** Repères du chemin sur l'image (part de la largeur / de la hauteur) : 3 étapes puis le sommet. */
const REPERES = [
  { x: 0.203, y: 0.757 },
  { x: 0.393, y: 0.509 },
  { x: 0.524, y: 0.248 },
];
const SOMMET = { x: 0.682, y: 0.15 };

export function Parcours() {
  const { xp, logs, days, jeu, quests } = useProfil(useShallow((s) => ({ xp: s.xp, logs: s.logs, days: s.days, jeu: s.jeu, quests: s.quests })));
  const { width } = useWindowDimensions();
  const li = lvlInfo(xp);
  const [rang, couleurRang] = rankOf(li.n);
  const actuelle = serieAvecGels(logs, days, jeu.gelsUtilises);
  const serie = Math.max(jeu.records.serie, actuelle);
  const gels = gelsDispo(jeu);
  // Trois étapes affichées : les deux niveaux précédents et le niveau actuel (ou 1, 2, 3 au début).
  const debut = Math.max(1, li.n - 2);
  const etapes = [debut, debut + 1, debut + 2];
  const q = todayQuests(quests);
  const prochaine = QUESTS.find(([id]) => q.ids.includes(id) && !q.done.includes(id));
  const L = width - 40 - 2;
  const H = (L * 452) / 748;
  return (
    <View style={styles.pile}>
      <Card style={styles.ascension}>
        <View style={styles.ascTete}>
          <View style={styles.flex}>
            <Text weight="bold" style={styles.h2}>
              Ton ascension
            </Text>
            <Text style={styles.petit}>Chaque effort te fait avancer.</Text>
          </View>
          <Lvl n={li.n} color={couleurRang} />
          <View>
            <Text weight="bold" style={styles.niv}>
              Niveau {li.n}
            </Text>
            <Text weight="semibold" style={[styles.rang, { color: couleurRang }]}>
              {rang}
            </Text>
          </View>
        </View>
        <View style={{ width: L, height: H, marginHorizontal: -16 }}>
          <Image source={DECO_IMAGES.ascension} style={StyleSheet.absoluteFill} contentFit="cover" />
          {etapes.map((n, i) => {
            const etat = n < li.n ? 'passe' : n === li.n ? 'actuel' : 'futur';
            const r = REPERES[i];
            return (
              <View key={n} style={[styles.repere, etat === 'actuel' && styles.repereActuel, etat === 'futur' && styles.repereFutur, { left: r.x * L - 15, top: r.y * H - 15 }]}>
                <Text weight="bold" style={[styles.repereTxt, etat === 'actuel' && styles.repereTxtActuel]}>
                  {n}
                </Text>
              </View>
            );
          })}
          <View style={[styles.sommet, { left: SOMMET.x * L - 16, top: SOMMET.y * H - 30 }]}>
            <Icon name="lock" size={16} color={colors.text} />
          </View>
        </View>
        <View style={styles.barre}>
          <View style={[styles.rempli, { width: `${(li.cur / li.need) * 100}%` }]} />
        </View>
        <Text style={styles.centre}>
          <Text weight="bold" style={styles.centreFort}>
            {li.cur}
          </Text>{' '}
          / {li.need} XP vers le niveau {li.n + 1}
        </Text>
      </Card>

      <View style={styles.rangee}>
        <Tuile valeur={fmt(xp)} nom="XP au total" icone="chart" />
        <Tuile valeur={`${serie} ${serie > 1 ? 'jours' : 'jour'}`} nom="Meilleure série" icone="flame" />
      </View>
      <Card style={styles.gel}>
        <Text style={styles.gelEmoji}>🧊</Text>
        <View style={styles.flex}>
          <Text weight="bold" style={styles.h3}>
            {gels} gel{gels > 1 ? 's' : ''} de série · série actuelle {actuelle} j
          </Text>
          <Text style={styles.petit}>
            Un jour de séance manqué ne casse pas ta série : un gel est utilisé tout seul. +1 gel tous les {GEL_PALIER} jours de série.
          </Text>
        </View>
      </Card>

      <Card style={styles.etape}>
        <Text weight="bold" style={styles.h3}>
          Prochaine étape
        </Text>
        {prochaine ? (
          <View style={styles.ligneQuete}>
            <View style={styles.rond} />
            <Text style={[styles.flex, styles.queteTxt]}>{prochaine[1]}</Text>
            <Text weight="bold" style={styles.xpOrange}>
              +{prochaine[2]} XP
            </Text>
          </View>
        ) : (
          <Text style={styles.petit}>Toutes les quêtes du jour sont faites. Bravo !</Text>
        )}
        <Appui accessibilityRole="button" onPress={() => router.navigate('/programme')} style={styles.cta}>
          <Text weight="semibold" style={styles.ctaTxt}>
            Voir mon programme
          </Text>
          <Icon name="right" size={18} color={colors.onPrimary} strokeWidth={2.4} />
        </Appui>
      </Card>
    </View>
  );
}

function Tuile({ valeur, nom, icone }: { valeur: string; nom: string; icone: IconName }) {
  return (
    <Card style={[styles.flex, styles.tuile]}>
      <View style={styles.flex}>
        <Text weight="bold" style={styles.tuileVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {valeur}
        </Text>
        <Text style={styles.petit}>{nom}</Text>
      </View>
      <Icon name={icone} size={26} color={colors.pink} strokeWidth={2.2} />
    </Card>
  );
}

/* ---------------- Statistiques ---------------- */

export type Periode = 'Semaine' | 'Mois' | 'Année';
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

/** Séances par colonne : jours de la semaine, semaines du mois (4) ou mois de l'année. */
function colonnes(logs: readonly Log[], periode: Periode, now: Date): { lib: string; n: number }[] {
  if (periode === 'Semaine') {
    const lundi = new Date(now);
    lundi.setHours(0, 0, 0, 0);
    lundi.setDate(lundi.getDate() - ((now.getDay() + 6) % 7));
    return JOURS.map((lib, i) => {
      const d = new Date(lundi);
      d.setDate(lundi.getDate() + i);
      return { lib, n: logs.filter((l) => new Date(l.d).toDateString() === d.toDateString()).length };
    });
  }
  if (periode === 'Mois') {
    return [3, 2, 1, 0].map((k) => {
      const fin = +now - k * 7 * 864e5;
      return { lib: k === 0 ? 'Cette sem.' : `S-${k}`, n: logs.filter((l) => +new Date(l.d) <= fin && +new Date(l.d) > fin - 7 * 864e5).length };
    });
  }
  return MOIS.map((lib, m) => ({ lib, n: logs.filter((l) => new Date(l.d).getFullYear() === now.getFullYear() && new Date(l.d).getMonth() === m).length }));
}

/** Barres orange des séances, avec la grille et les libellés. */
function Barres({ cols }: { cols: { lib: string; n: number }[] }) {
  const max = Math.max(3, ...cols.map((c) => c.n));
  const H = 110;
  return (
    <View style={styles.graph}>
      <View style={styles.axe}>
        {[max, Math.round((max * 2) / 3), Math.round(max / 3), 0].map((v, i) => (
          <Text key={i} style={styles.axeTxt}>
            {v}
          </Text>
        ))}
      </View>
      <View style={styles.flex}>
        <View style={[styles.zoneBarres, { height: H }]}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.grille, { top: (i * H) / 3 }]} />
          ))}
          {cols.map((c, i) => (
            <View key={i} style={styles.col}>
              {c.n > 0 && <View style={[styles.baton, { height: Math.max(8, (c.n / max) * H) }]} />}
            </View>
          ))}
        </View>
        <View style={styles.libs}>
          {cols.map((c, i) => (
            <Text key={i} style={styles.lib} numberOfLines={1}>
              {c.lib}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Ligne santé : icône, libellé, valeur, chevron. */
function LigneSante({ icone, nom, valeur, onPress }: { icone: IconName; nom: string; valeur: string; onPress: () => void }) {
  return (
    <Appui accessibilityRole="button" onPress={onPress} style={styles.ligneSante}>
      <Icon name={icone} size={20} color={colors.text} />
      <Text style={[styles.flex, styles.queteTxt]}>{nom}</Text>
      <Text weight="semibold" style={styles.queteTxt}>
        {valeur}
      </Text>
      <Icon name="right" size={16} color={colors.textSecondary} />
    </Appui>
  );
}

export function StatsHaut({ periode, setPeriode, onPesee }: { periode: Periode; setPeriode: (p: Periode) => void; onPesee: () => void }) {
  const { logs, nights, hrvChecks, wlog, weight } = useProfil(
    useShallow((s) => ({ logs: s.logs, nights: s.nights, hrvChecks: s.hrvChecks, wlog: s.wlog, weight: s.weight })),
  );
  const now = new Date();
  const jours = periode === 'Semaine' ? 7 : periode === 'Mois' ? 30 : 365;
  const cur = logs.filter((l) => +new Date(l.d) > +now - jours * 864e5);
  const min = cur.reduce((a, l) => a + l.min, 0);
  const n7 = nights.slice(-7);
  const som = n7.length ? n7.reduce((a, n) => a + n.h, 0) / n7.length : 0;
  const hS = Math.floor(som);
  const fcs = logs.map((l) => l.hrAvg ?? 0).filter((x) => x > 0);
  const fc = fcs.length ? Math.round(fcs.reduce((a, b) => a + b, 0) / fcs.length) : 0;
  const dernier = wlog[wlog.length - 1];
  return (
    <View style={styles.pile}>
      <Segmente options={['Semaine', 'Mois', 'Année'] as const} value={periode} onChange={setPeriode} />
      <Card style={styles.seances}>
        <Text weight="bold" style={styles.gros}>
          {cur.length} {cur.length > 1 ? 'séances' : 'séance'}
        </Text>
        <Text style={styles.sousGros}>{periode === 'Semaine' ? 'Cette semaine' : periode === 'Mois' ? 'Ces 30 derniers jours' : 'Cette année'}</Text>
        <Barres cols={colonnes(logs, periode, now)} />
      </Card>
      <View style={styles.rangee}>
        <Mini icone="clock" valeur={min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}` : `${min} min`} nom="Temps actif" />
        <Mini icone="flame" valeur={`${fmt(cur.reduce((a, l) => a + l.cal, 0))} kcal`} nom="Calories" />
        <Mini icone="dumb" valeur={`${fmt(cur.reduce((a, l) => a + (l.vol || 0), 0))} kg`} nom="Volume" />
      </View>
      <Card style={styles.santeCarte}>
        <LigneSante icone="moon" nom="Sommeil moyen" valeur={som ? `${hS} h ${String(Math.round((som - hS) * 60)).padStart(2, '0')}` : '—'} onPress={() => router.push('/nuits')} />
        <LigneSante icone="pulse" nom="VFC nocturne" valeur={`${baseHrv(nights, hrvChecks)} ms`} onPress={() => router.push('/recuperation')} />
        <LigneSante icone="heart" nom="FC moyenne" valeur={fc ? `${fc} bpm` : '—'} onPress={() => router.push('/nuits')} />
      </Card>
      {santeDisponible() && <Text style={styles.source}>♡ Source : Apple Santé</Text>}
      <Card style={styles.poids}>
        <Icon name="scale" size={26} color={colors.text} />
        <View style={styles.flex}>
          <Text style={styles.petit}>Ton poids</Text>
          <Text weight="bold" style={styles.tuileVal}>
            {dec((dernier?.kg ?? weight).toFixed(1))} kg
          </Text>
          <Text style={styles.petit}>{wlog.length > 1 ? `Départ : ${dec(wlog[0].kg.toFixed(1))} kg` : 'Poids de départ'}</Text>
        </View>
        <Appui accessibilityRole="button" onPress={onPesee} style={styles.ajouter}>
          <Icon name="plus" size={16} color={colors.text} />
          <Text weight="semibold" style={styles.queteTxt}>
            Ajouter
          </Text>
        </Appui>
      </Card>
    </View>
  );
}

function Mini({ icone, valeur, nom }: { icone: IconName; valeur: string; nom: string }) {
  return (
    <Card style={[styles.flex, styles.mini]}>
      <Icon name={icone} size={22} color={colors.text} />
      <View style={styles.flex}>
        <Text weight="bold" style={styles.miniVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {valeur}
        </Text>
        <Text style={styles.miniNom}>{nom}</Text>
      </View>
    </Card>
  );
}

/* ---------------- Collection ---------------- */

type Filtre = 'toutes' | 'debloquees' | 'agagner';

export function Collection() {
  const st = useProfil();
  const { width } = useWindowDimensions();
  const n = possedees(st.jeu);
  const total = CARTES.length;
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const premiere = SUCCES.find((s) => !debloque(s, st)) ?? SUCCES[SUCCES.length - 1];
  const [choisi, setChoisi] = useState<SuccesId>(premiere.id);
  const s = SUCCES.find((x) => x.id === choisi) ?? premiere;
  const ok = debloque(s, st);
  const faites = s.missions.filter((m) => missionFaite(m, st)).length;
  const nbSucces = SUCCES.filter((x) => debloque(x, st)).length;
  const cartes = CARTES.filter((c) => {
    const a = (st.jeu.cartes[c.id] ?? 0) > 0;
    return filtre === 'toutes' || (filtre === 'debloquees' ? a : !a);
  }).slice(0, 12);
  const lc = (width - 40 - 20) / 3;
  return (
    <View style={styles.pile}>
      <View>
        <Text weight="bold" style={styles.compte}>
          {n} <Text style={styles.compteSur}>/ {total} cartes</Text>
        </Text>
        <View style={[styles.barre, styles.mt6]}>
          <View style={[styles.rempli, { width: `${(n / total) * 100}%` }]} />
        </View>
      </View>
      <View style={styles.filtres}>
        {(
          [
            ['toutes', 'Toutes'],
            ['debloquees', 'Débloquées'],
            ['agagner', 'À gagner'],
          ] as const
        ).map(([k, l]) => (
          <Appui key={k} accessibilityRole="button" accessibilityState={{ selected: filtre === k }} onPress={() => setFiltre(k)} style={[styles.filtre, filtre === k && styles.filtreOn]} echelle={0.94}>
            <Text weight="semibold" style={styles.queteTxt}>
              {l}
            </Text>
          </Appui>
        ))}
      </View>

      {/* Succès mis en avant : image, état, objectifs. */}
      <Appui accessibilityRole="button" onPress={() => router.push('/cartes')} style={styles.vedette}>
        <Image source={SUCCES_IMAGES[s.id]} style={[styles.vedetteImg, !ok && styles.terne]} contentFit="contain" />
        {!ok && (
          <View style={styles.cadenas}>
            <Icon name="lock" size={18} color={colors.text} />
          </View>
        )}
      </Appui>
      <Text style={[styles.centre, styles.petit]}>{ok ? 'Débloqué' : `À débloquer · ${faites} / 2 objectifs`}</Text>
      <Card style={styles.objectifs}>
        {s.missions.map((m) => {
          const fait = missionFaite(m, st);
          return (
            <View key={m.id} style={styles.objectif}>
              <View style={[styles.rond, fait && styles.rondFait]}>{fait && <Icon name="check" size={13} strokeWidth={3} color={colors.onPrimary} />}</View>
              <View style={styles.flex}>
                <Text style={styles.queteTxt}>{m.texte}</Text>
                {!fait && <Text style={styles.petit}>{m.unite ? `${avancement(m, st)} / ${m.but} ${m.unite}` : `${avancement(m, st)} / ${m.but}`}</Text>}
              </View>
              <Text weight="bold" style={styles.xpOrange}>
                +{m.xp}
              </Text>
            </View>
          );
        })}
      </Card>
      <View style={styles.succesRang}>
        {SUCCES.map((x) => (
          <Appui key={x.id} accessibilityRole="button" accessibilityLabel={x.nom} onPress={() => setChoisi(x.id)} style={[styles.succesMini, x.id === choisi && styles.succesOn]} echelle={0.94}>
            <Image source={SUCCES_IMAGES[x.id]} style={[styles.succesImg, !debloque(x, st) && styles.terne]} contentFit="contain" />
          </Appui>
        ))}
      </View>
      <Text style={[styles.centre, styles.petit]}>
        Succès · {nbSucces} / {SUCCES.length} débloqués
      </Text>

      <Text weight="bold" style={styles.h3}>
        {filtre === 'agagner' ? 'Cartes à gagner' : filtre === 'debloquees' ? 'Tes cartes' : 'Cartes'}
      </Text>
      <View style={styles.grilleCartes}>
        {cartes.map((c) => (
          <Appui key={c.id} accessibilityRole="button" onPress={() => router.push('/cartes')} echelle={0.94}>
            <CarteJeu id={c.id} largeur={lc} cachee={!(st.jeu.cartes[c.id] ?? 0)} nombre={st.jeu.cartes[c.id] ?? 0} />
          </Appui>
        ))}
      </View>
      <Appui accessibilityRole="button" onPress={() => router.push('/cartes')} style={styles.collection}>
        <Icon name="book" size={18} color={colors.text} />
        <Text weight="semibold" style={styles.ctaTxtClair}>
          Voir toute ma collection
        </Text>
        <Icon name="right" size={16} color={colors.textSecondary} />
      </Appui>
    </View>
  );
}

const styles = StyleSheet.create({
  gel: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  gelEmoji: { fontSize: 28, lineHeight: 34 },
  flex: { flex: 1, minWidth: 0 },
  pile: { gap: 14 },
  h2: { fontSize: 22, lineHeight: 27 },
  h3: { fontSize: 17, lineHeight: 22 },
  petit: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  centre: { textAlign: 'center', fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  centreFort: { color: colors.text },
  ascension: { padding: 16, gap: 10, overflow: 'hidden' },
  ascTete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  niv: { fontSize: 16, lineHeight: 20 },
  rang: { fontSize: 13, lineHeight: 17 },
  repere: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: alpha(colors.bg, 0.85), borderWidth: 2, borderColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  repereActuel: { backgroundColor: colors.pink, borderColor: colors.pinkLight, boxShadow: `0 0 16px ${colors.pink}` },
  repereFutur: { borderColor: colors.textTertiary, opacity: 0.8 },
  repereTxt: { fontSize: 14, lineHeight: 18 },
  repereTxtActuel: { color: colors.onPrimary },
  sommet: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: alpha(colors.bg, 0.8), borderWidth: 1, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  barre: { height: 8, borderRadius: 4, backgroundColor: ui.dark, overflow: 'hidden' },
  rempli: { height: 8, borderRadius: 4, backgroundColor: colors.pink },
  mt6: { marginTop: 8 },
  rangee: { flexDirection: 'row', gap: 10 },
  tuile: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  tuileVal: { fontSize: 24, lineHeight: 30 },
  etape: { padding: 16, gap: 12 },
  ligneQuete: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rond: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.textSecondary, alignItems: 'center', justifyContent: 'center' },
  rondFait: { backgroundColor: colors.pink, borderColor: colors.pink },
  queteTxt: { fontSize: 15, lineHeight: 20 },
  xpOrange: { fontSize: 16, lineHeight: 21, color: colors.pink },
  cta: { height: 52, borderRadius: 26, backgroundColor: colors.pink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 6px 22px ${alpha(colors.pink, 0.4)}` },
  ctaTxt: { ...fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.onPrimary },
  ctaTxtClair: { ...fonts.semibold, fontSize: 15, lineHeight: 20 },
  seances: { padding: 16, gap: 2 },
  gros: { fontSize: 30, lineHeight: 36 },
  sousGros: { fontSize: 15, lineHeight: 20, color: colors.textSecondary, marginBottom: 12 },
  graph: { flexDirection: 'row', gap: 8 },
  axe: { height: 110, justifyContent: 'space-between' },
  axeTxt: { fontSize: 11, lineHeight: 13, color: colors.textSecondary },
  zoneBarres: { flexDirection: 'row', alignItems: 'flex-end' },
  grille: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  baton: { width: 18, borderRadius: 5, backgroundColor: colors.pink, boxShadow: `0 0 10px ${alpha(colors.pink, 0.45)}` },
  libs: { flexDirection: 'row', marginTop: 6 },
  lib: { flex: 1, textAlign: 'center', fontSize: 11.5, lineHeight: 15, color: colors.textSecondary },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  miniVal: { fontSize: 15, lineHeight: 20 },
  miniNom: { fontSize: 11.5, lineHeight: 15, color: colors.textSecondary },
  santeCarte: { padding: 4, gap: 0 },
  ligneSante: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12 },
  source: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: -6, marginLeft: 6 },
  poids: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  ajouter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border2 },
  compte: { fontSize: 22, lineHeight: 28 },
  compteSur: { fontSize: 18, color: colors.text },
  filtres: { flexDirection: 'row', gap: 8 },
  filtre: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  filtreOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  vedette: { alignSelf: 'center' },
  vedetteImg: { width: 220, height: 220 / SUCCES_RATIO },
  terne: { opacity: 0.45 },
  cadenas: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: alpha(colors.bg, 0.8), alignItems: 'center', justifyContent: 'center' },
  objectifs: { padding: 6, gap: 0 },
  objectif: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 12 },
  succesRang: { flexDirection: 'row', gap: 8 },
  succesMini: { flex: 1, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  succesOn: { borderColor: colors.pink },
  succesImg: { width: '100%', aspectRatio: SUCCES_RATIO },
  grilleCartes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  collection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 26, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border2 },
});
