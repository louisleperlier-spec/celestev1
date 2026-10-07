import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MascotteVide } from '@/components/app/Mascotte';
import { EnTetePage, Recherche } from '@/components/app/Catalogue';
import { IconeSport } from '@/components/app/IconeSport';
import { Sheet } from '@/components/app/Sheet';
import { Appui, BigNumber, Button, Card, Icon, Segmente, Text, toast } from '@/components/ui';
import { EXERCICE_IMAGES, EXERCICES, GROUPES } from '@/data';
import type { ExerciceId } from '@/data/types';
import { exercice } from '@/lib/plan';
import { FAMILLES, INTENSITES, kcalSport, MET_MUSCU_LIBRE, sansAccents, sportParId, SPORTS, xpMuscuLibre, xpSport, type FamilleSport, type Intensite } from '@/lib/sports';
import { enregistrerMuscuLibre, enregistrerSport, type ExoLibre } from '@/store/activites';
import { useProfil } from '@/store/profil';
import { useSportLive } from '@/store/sportLive';
import { alpha, colors, fonts, ui } from '@/theme';

type Mode = { kind: 'choix' } | { kind: 'sport'; id: string } | { kind: 'muscu' };
type Quand = 'auj' | 'hier';

const estExercice = (id: string | undefined): id is ExerciceId => !!id && EXERCICES.some((e) => e.id === id);
const DUREES = [15, 30, 45, 60, 90];

function quitter() {
  if (router.canGoBack()) router.back();
  else router.navigate('/accueil');
}

/**
 * Ajouter une activité (hors cahier des charges, demandé par l'utilisateur, oct. 2026) : musculation libre (séries notées à la main,
 * ex. tractions) ou un autre sport parmi 47 (tennis, natation, yoga…). `?exo=` ouvre la musculation avec cet exercice, `?sport=` le sport.
 */
export default function Ajouter() {
  const params = useLocalSearchParams<{ exo?: string; sport?: string }>();
  const [mode, setMode] = useState<Mode>(() =>
    estExercice(params.exo) ? { kind: 'muscu' } : sportParId(params.sport) ? { kind: 'sport', id: params.sport! } : { kind: 'choix' },
  );
  const [exos, setExos] = useState<ExoLibre[]>(() => (estExercice(params.exo) ? [{ id: params.exo, series: [{ reps: 8, kg: 0 }] }] : []));

  const retour = () => (mode.kind !== 'choix' && !params.exo && !params.sport ? setMode({ kind: 'choix' }) : router.canGoBack() ? router.back() : router.navigate('/programme'));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {mode.kind === 'choix' && <Choix onSport={(id) => setMode({ kind: 'sport', id })} onMuscu={() => setMode({ kind: 'muscu' })} />}
      {mode.kind === 'sport' && <FormSport id={mode.id} onRetour={retour} />}
      {mode.kind === 'muscu' && <FormMuscu exos={exos} setExos={setExos} onRetour={retour} />}
    </SafeAreaView>
  );
}

function Choix({ onSport, onMuscu }: { onSport: (id: string) => void; onMuscu: () => void }) {
  const [q, setQ] = useState('');
  const k = sansAccents(q.trim());
  const liste = k ? SPORTS.filter((s) => sansAccents(s.nom).includes(k)) : SPORTS;
  const familles = (Object.keys(FAMILLES) as FamilleSport[]).map((f) => ({ f, sports: liste.filter((s) => s.famille === f) })).filter((x) => x.sports.length);
  return (
    <>
      <EnTetePage titre="Ajouter une activité" sous="Note tes séries ou un autre sport" />
      <Recherche value={q} onChange={setQ} placeholder="Tennis, natation, yoga…" />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        {!k && (
          <>
            <Appui accessibilityRole="button" accessibilityLabel="Musculation libre" onPress={onMuscu}>
              <Card style={styles.grande}>
                <View style={styles.pastille}>
                  <Icon name="dumb" size={24} color={colors.pink} />
                </View>
                <View style={styles.flex}>
                  <Text weight="bold" style={styles.grandeTitre}>
                    Musculation libre
                  </Text>
                  <Text style={styles.petit}>Tractions, pompes, squats… note tes séries, tes reps et ta charge</Text>
                </View>
                <Icon name="right" size={18} color={colors.textSecondary} />
              </Card>
            </Appui>
            <Appui accessibilityRole="button" accessibilityLabel="Séances guidées" onPress={() => router.push('/seances')}>
              <Card style={styles.grande}>
                <View style={styles.pastille}>
                  <Icon name="play" size={22} color={colors.pink} />
                </View>
                <View style={styles.flex}>
                  <Text weight="bold" style={styles.grandeTitre}>
                    Séances guidées
                  </Text>
                  <Text style={styles.petit}>41 séances prêtes, avec minuteur et repos</Text>
                </View>
                <Icon name="right" size={18} color={colors.textSecondary} />
              </Card>
            </Appui>
          </>
        )}
        {familles.map(({ f, sports }) => (
          <View key={f} style={styles.famille}>
            <Text weight="semibold" style={styles.h3}>
              {FAMILLES[f]}
            </Text>
            <View style={styles.grille}>
              {sports.map((s) => (
                <Appui key={s.id} accessibilityRole="button" accessibilityLabel={s.nom} onPress={() => onSport(s.id)} style={styles.case}>
                  <View style={styles.casePastille}>
                    <IconeSport glyphe={s.icone} size={24} />
                  </View>
                  <Text weight="medium" style={styles.caseNom} numberOfLines={2}>
                    {s.nom}
                  </Text>
                </Appui>
              ))}
            </View>
          </View>
        ))}
        {!familles.length && <MascotteVide texte="Aucun sport trouvé. Essaie un autre mot !" />}
      </ScrollView>
    </>
  );
}

/** Durée (−/+ de 5 min, raccourcis), quand (aujourd'hui / hier). */
function Duree({ min, setMin }: { min: number; setMin: (m: number) => void }) {
  return (
    <Card style={styles.bloc}>
      <Text style={styles.petit}>Durée</Text>
      <View style={styles.compteur}>
        <Appui accessibilityRole="button" accessibilityLabel="Moins 5 minutes" onPress={() => setMin(Math.max(5, min - 5))} style={styles.rond}>
          <Icon name="minus" size={20} />
        </Appui>
        <BigNumber value={String(min)} unit="min" size={48} />
        <Appui accessibilityRole="button" accessibilityLabel="Plus 5 minutes" onPress={() => setMin(Math.min(600, min + 5))} style={styles.rond}>
          <Icon name="plus" size={20} />
        </Appui>
      </View>
      <View style={styles.raccourcis}>
        {DUREES.map((d) => (
          <Appui key={d} accessibilityRole="button" accessibilityState={{ selected: d === min }} onPress={() => setMin(d)} style={[styles.puce, d === min && styles.puceOn]}>
            <Text style={[styles.puceTxt, d === min && styles.puceTxtOn]}>{d < 60 ? `${d} min` : `${d / 60} h`.replace('1.5', '1,5')}</Text>
          </Appui>
        ))}
      </View>
    </Card>
  );
}

function FormSport({ id, onRetour }: { id: string; onRetour: () => void }) {
  const s = sportParId(id)!;
  const poids = useProfil((p) => p.weight);
  const [min, setMin] = useState(45);
  const [int, setInt] = useState<Intensite>('moderee');
  const [quand, setQuand] = useState<Quand>('auj');
  const cal = kcalSport(s.met, poids, min, int);
  const lancer = () => {
    useSportLive.getState().demarrer(s.id, int);
    router.replace('/sport-en-cours');
  };
  const enregistrer = () => {
    const r = enregistrerSport(s.id, min, int, quand === 'hier');
    if (!r) return;
    toast(`${s.nom} enregistré · +${r.xp} XP`);
    quitter();
  };
  return (
    <>
      <EnTeteForm titre={s.nom} onRetour={onRetour} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroPastille}>
            <IconeSport glyphe={s.icone} size={46} strokeWidth={1.6} />
          </View>
        </View>
        <Card style={styles.bloc}>
          <Text style={styles.petit}>Intensité</Text>
          <Segmente options={(Object.keys(INTENSITES) as Intensite[]).map((k) => [k, INTENSITES[k].nom] as [Intensite, string])} value={int} onChange={setInt} />
        </Card>
        <Button label="Lancer en direct" icon="play" onPress={lancer} />
        <Text style={styles.estimation}>Chrono, BPM capté par ta montre et notification « {s.nom} en cours »</Text>
        <Text weight="semibold" style={[styles.h3, styles.ou]}>
          Ou note une activité déjà faite
        </Text>
        <Duree min={min} setMin={setMin} />
        <Card style={styles.bloc}>
          <Text style={styles.petit}>Quand</Text>
          <Segmente options={[['auj', "Aujourd'hui"], ['hier', 'Hier']] as [Quand, string][]} value={quand} onChange={setQuand} />
        </Card>
        <Text style={styles.estimation}>
          ≈ {cal} kcal · +{xpSport(min) + (int === 'intense' ? 5 : 0)} XP · compte pour ta série et tes cercles
        </Text>
        <Button label={`Enregistrer ${min} min`} variant="dark" icon="check" onPress={enregistrer} />
      </ScrollView>
    </>
  );
}

function EnTeteForm({ titre, onRetour }: { titre: string; onRetour: () => void }) {
  return (
    <View style={styles.head}>
      <Appui accessibilityRole="button" accessibilityLabel="Retour" onPress={onRetour} style={styles.back}>
        <Icon name="left" />
      </Appui>
      <Text style={styles.h1} accessibilityRole="header" numberOfLines={1}>
        {titre}
      </Text>
    </View>
  );
}

/** Petit compteur −/+ (reps ou kg). */
function Pas({ valeur, unite, pas, min, onChange, label }: { valeur: number; unite: string; pas: number; min: number; onChange: (v: number) => void; label: string }) {
  return (
    <View style={styles.pas}>
      <Appui accessibilityRole="button" accessibilityLabel={`${label} moins`} onPress={() => onChange(Math.max(min, +(valeur - pas).toFixed(1)))} style={styles.pasBtn}>
        <Icon name="minus" size={16} />
      </Appui>
      <Text weight="semibold" style={styles.pasVal}>
        {String(valeur).replace('.', ',')} <Text style={styles.pasUnite}>{unite}</Text>
      </Text>
      <Appui accessibilityRole="button" accessibilityLabel={`${label} plus`} onPress={() => onChange(+(valeur + pas).toFixed(1))} style={styles.pasBtn}>
        <Icon name="plus" size={16} />
      </Appui>
    </View>
  );
}

function FormMuscu({ exos, setExos, onRetour }: { exos: ExoLibre[]; setExos: (e: ExoLibre[]) => void; onRetour: () => void }) {
  const poids = useProfil((p) => p.weight);
  const [min, setMin] = useState(30);
  const [quand, setQuand] = useState<Quand>('auj');
  const [choisir, setChoisir] = useState(false);
  const nbSeries = exos.reduce((a, e) => a + e.series.filter((s) => s.reps > 0).length, 0);
  const cal = Math.round(MET_MUSCU_LIBRE * poids * (min / 60));

  const majSerie = (i: number, j: number, champ: 'reps' | 'kg', v: number) =>
    setExos(exos.map((e, a) => (a === i ? { ...e, series: e.series.map((s, b) => (b === j ? { ...s, [champ]: v } : s)) } : e)));
  const ajouterSerie = (i: number) => setExos(exos.map((e, a) => (a === i ? { ...e, series: [...e.series, { ...(e.series[e.series.length - 1] ?? { reps: 8, kg: 0 }) }] } : e)));
  const retirerSerie = (i: number, j: number) =>
    setExos(exos.map((e, a) => (a === i ? { ...e, series: e.series.filter((_, b) => b !== j) } : e)).filter((e) => e.series.length > 0));

  const enregistrer = () => {
    const r = enregistrerMuscuLibre(exos, min, quand === 'hier');
    if (!r) return;
    toast(`Séance enregistrée · +${r.xp} XP`);
    quitter();
  };

  return (
    <>
      <EnTeteForm titre="Musculation libre" onRetour={onRetour} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        {exos.map((e, i) => {
          const ex = exercice(e.id);
          return (
            <Card key={e.id + i} style={styles.bloc}>
              <View style={styles.exoTete}>
                <Image source={EXERCICE_IMAGES[e.id]} style={styles.exoImg} contentFit="contain" />
                <View style={styles.flex}>
                  <Text weight="bold" style={styles.exoNom}>
                    {ex.nom}
                  </Text>
                  <Text style={styles.petit}>{GROUPES[ex.groupe]}</Text>
                </View>
              </View>
              {e.series.map((s, j) => (
                <View key={j} style={styles.serie}>
                  <Text style={styles.serieN}>{j + 1}</Text>
                  <Pas label="Répétitions" valeur={s.reps} unite="reps" pas={1} min={0} onChange={(v) => majSerie(i, j, 'reps', v)} />
                  <Pas label="Charge" valeur={s.kg} unite="kg" pas={2.5} min={0} onChange={(v) => majSerie(i, j, 'kg', v)} />
                  <Appui accessibilityRole="button" accessibilityLabel={`Retirer la série ${j + 1}`} onPress={() => retirerSerie(i, j)} style={styles.retirer}>
                    <Icon name="x" size={14} color={colors.textSecondary} />
                  </Appui>
                </View>
              ))}
              <Appui accessibilityRole="button" onPress={() => ajouterSerie(i)} style={styles.ajoutSerie}>
                <Icon name="plus" size={16} color={colors.pink} />
                <Text weight="semibold" style={styles.ajoutTxt}>
                  Ajouter une série
                </Text>
              </Appui>
            </Card>
          );
        })}
        <Button label={exos.length ? 'Ajouter un exercice' : 'Choisir un exercice'} variant="dark" icon="plus" onPress={() => setChoisir(true)} />
        <Text style={styles.astuce}>Au poids du corps (tractions, pompes…), laisse la charge à 0 kg ; ajoute le lest si tu en portes un.</Text>
        <Duree min={min} setMin={setMin} />
        <Card style={styles.bloc}>
          <Text style={styles.petit}>Quand</Text>
          <Segmente options={[['auj', "Aujourd'hui"], ['hier', 'Hier']] as [Quand, string][]} value={quand} onChange={setQuand} />
        </Card>
        {nbSeries > 0 && (
          <Text style={styles.estimation}>
            {nbSeries} série{nbSeries > 1 ? 's' : ''} · ≈ {cal} kcal · +{xpMuscuLibre(nbSeries)} XP
          </Text>
        )}
        <Button label="Enregistrer ma séance" icon="check" disabled={nbSeries === 0} onPress={enregistrer} />
      </ScrollView>
      <ChoixExercice
        visible={choisir}
        onClose={() => setChoisir(false)}
        onChoisir={(id) => {
          setExos([...exos, { id, series: [{ reps: 8, kg: 0 }] }]);
          setChoisir(false);
        }}
      />
    </>
  );
}

function ChoixExercice({ visible, onClose, onChoisir }: { visible: boolean; onClose: () => void; onChoisir: (id: ExerciceId) => void }) {
  const [q, setQ] = useState('');
  const k = sansAccents(q.trim());
  const liste = EXERCICES.filter((e) => !k || sansAccents(e.nom + ' ' + GROUPES[e.groupe] + ' ' + e.muscles).includes(k));
  return (
    <Sheet visible={visible} onClose={onClose} title="Choisis un exercice">
      <Recherche value={q} onChange={setQ} placeholder="Tractions, pompes, squat…" />
      <ScrollView style={styles.liste} keyboardShouldPersistTaps="handled">
        {liste.map((e) => (
          <Appui key={e.id} accessibilityRole="button" accessibilityLabel={e.nom} onPress={() => onChoisir(e.id)} style={styles.ligne}>
            <Image source={EXERCICE_IMAGES[e.id]} style={styles.ligneImg} contentFit="contain" />
            <View style={styles.flex}>
              <Text weight="semibold" style={styles.ligneNom}>
                {e.nom}
              </Text>
              <Text style={styles.petit}>{GROUPES[e.groupe]}</Text>
            </View>
            <Icon name="plus" size={18} color={colors.pink} />
          </Appui>
        ))}
        {!liste.length && <MascotteVide texte="Aucun exercice trouvé. Essaie un autre mot !" />}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  petit: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  vide: { textAlign: 'center', marginTop: 20 },
  grande: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  pastille: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.pink, 0.14) },
  grandeTitre: { fontSize: 17, lineHeight: 22 },
  famille: { gap: 10, marginTop: 6 },
  h3: { fontSize: 17, lineHeight: 22 },
  ou: { marginTop: 14 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  case: {
    width: '31%',
    flexGrow: 1,
    maxWidth: '32%',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  casePastille: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.pink, 0.12) },
  caseNom: { fontSize: 13, lineHeight: 16, textAlign: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.iconBg },
  h1: { ...fonts.bold, flex: 1, fontSize: 26, lineHeight: 32 },
  hero: { alignItems: 'center', paddingVertical: 6 },
  heroPastille: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.pink, 0.12),
    borderWidth: 1,
    borderColor: alpha(colors.pink, 0.35),
    boxShadow: `0 0 30px ${alpha(colors.pink, 0.3)}`,
  },
  bloc: { padding: 16, gap: 12 },
  compteur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rond: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.iconBg },
  raccourcis: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  puce: { paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center', backgroundColor: ui.iconBg },
  puceOn: { backgroundColor: colors.pink },
  puceTxt: { fontSize: 13.5, lineHeight: 18, color: colors.text },
  puceTxtOn: { color: colors.onPrimary, ...fonts.semibold },
  estimation: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary, textAlign: 'center' },
  astuce: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 10 },
  exoTete: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exoImg: { width: 54, height: 54, borderRadius: 12, backgroundColor: ui.iconBg },
  exoNom: { fontSize: 17, lineHeight: 22 },
  serie: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serieN: { width: 18, fontSize: 14, lineHeight: 18, color: colors.textSecondary, textAlign: 'center' },
  pas: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40, borderRadius: 20, backgroundColor: ui.iconBg, paddingHorizontal: 4 },
  pasBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pasVal: { fontSize: 15, lineHeight: 20 },
  pasUnite: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  retirer: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  ajoutSerie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38 },
  ajoutTxt: { fontSize: 14, lineHeight: 18, color: colors.pink },
  liste: { maxHeight: 420, marginTop: 8 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  ligneImg: { width: 44, height: 44, borderRadius: 10, backgroundColor: ui.iconBg },
  ligneNom: { fontSize: 15, lineHeight: 20 },
});
