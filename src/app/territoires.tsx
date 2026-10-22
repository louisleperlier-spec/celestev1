import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EnTetePage } from '@/components/app/Catalogue';
import { CarteTerritoires, couleurLien, type Zone } from '@/components/app/CarteTerritoires';
import { CoachFace } from '@/components/app/CoachFace';
import { Button, Card, Icon, Segmente, Text } from '@/components/ui';
import { dec } from '@/lib/charges';
import { bornes, caseDe, RAYON_QUARTIER, RAYON_VILLE, surfaceCase } from '@/lib/territoires';
import type { Pt } from '@/lib/velo';
import { useCompte } from '@/store/compte';
import { chargerClassement, chargerZone, envoyerAttente, useTerritoires, type CaseProprio, type Rang } from '@/store/territoires';
import { useVelo } from '@/store/velo';
import { colors, fonts, ui } from '@/theme';

/** Montréal, si la position n'est pas encore connue. */
const PAR_DEFAUT: Pt = [45.5017, -73.5673];

const LEGENDE = [
  ['moi', 'Toi'],
  ['ami', 'Amis et équipe'],
  ['autre', 'Autres joueurs'],
] as const;

/**
 * Territoires (hors prototype) : carte des cases conquises autour de toi, classements du quartier et de la ville.
 * Règles : case traversée = à toi ; celle d'un autre est volée sauf pendant 24 h après sa prise ; 14 jours sans passage = libre.
 */
export default function Territoires() {
  const connecte = useCompte((s) => !!s.userId);
  const attente = useTerritoires((s) => s.attente.length);
  const finSortie = useVelo((s) => s.res?.end ?? null);
  const [depart, setDepart] = useState<Pt | null>(null);
  const [cases, setCases] = useState<CaseProprio[]>([]);
  const [trop, setTrop] = useState(false);
  const [portee, setPortee] = useState<'quartier' | 'ville'>('quartier');
  const [rangs, setRangs] = useState<Rang[] | null>(null);
  const derniere = useRef(0);

  // Position de départ : la mienne si autorisée, sinon la fin de la dernière sortie, sinon Montréal.
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const p = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
          if (actif && p) return setDepart([p.coords.latitude, p.coords.longitude]);
        }
      } catch {
        // Pas de position : repli ci-dessous.
      }
      if (actif) setDepart(finSortie ?? PAR_DEFAUT);
    })();
    return () => {
      actif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cases gardées hors ligne : envoyées en arrivant sur l'écran.
  useEffect(() => {
    if (connecte && attente) void envoyerAttente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connecte]);

  // Classement autour de la position de départ.
  useEffect(() => {
    if (!depart || !connecte) return;
    let actif = true;
    chargerClassement(caseDe(depart), portee === 'quartier' ? RAYON_QUARTIER : RAYON_VILLE).then((r) => actif && setRangs(r ?? []));
    return () => {
      actif = false;
    };
  }, [depart, portee, connecte]);

  const surZone = async (z: Zone) => {
    const b = bornes(z.nord, z.sud, z.ouest, z.est);
    setTrop(!b);
    if (!b) return;
    const n = ++derniere.current;
    const r = await chargerZone(b);
    if (r && n === derniere.current) setCases(r);
  };

  const miennes = cases.filter((c) => c.lien === 'moi');
  const lat = depart?.[0] ?? PAR_DEFAUT[0];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <EnTetePage titre="Territoires" sous="Conquiers ton quartier en vélo et en course" retour="/velo" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {depart ? (
          <CarteTerritoires depart={depart} cases={cases} onZone={surZone} />
        ) : (
          <View style={styles.attenteCarte}>
            <Text style={styles.note}>Recherche de ta position…</Text>
          </View>
        )}

        <View style={styles.legende}>
          {LEGENDE.map(([l, t]) => (
            <View key={l} style={styles.leg}>
              <View style={[styles.pastille, { backgroundColor: couleurLien(l) }]} />
              <Text style={styles.legTxt}>{t}</Text>
            </View>
          ))}
          <View style={styles.leg}>
            <View style={[styles.pastille, styles.bouclier]} />
            <Text style={styles.legTxt}>Bouclier 24 h</Text>
          </View>
        </View>
        {trop && <Text style={[styles.note, styles.pad]}>Rapproche la carte pour voir les cases.</Text>}

        {!connecte ? (
          <Card style={styles.carte}>
            <Text weight="semibold" style={styles.h3}>
              Crée ton compte pour conquérir
            </Text>
            <Text style={styles.p}>
              Les territoires se jouent en ligne contre tous les joueurs NÉA.
              {attente ? ` Tes ${attente} cases déjà traversées seront envoyées dès la connexion.` : ''}
            </Text>
            <Button label="Créer mon compte" onPress={() => router.push({ pathname: '/compte', params: { mode: 'signup' } })} style={styles.btn} />
          </Card>
        ) : (
          <>
            <View style={styles.stats}>
              <Card style={styles.stat}>
                <Text style={styles.statLbl}>Tes cases ici</Text>
                <Text weight="bold" style={styles.statVal}>
                  {miennes.length}
                </Text>
              </Card>
              <Card style={styles.stat}>
                <Text style={styles.statLbl}>Surface</Text>
                <Text weight="bold" style={styles.statVal}>
                  {dec((miennes.length * surfaceCase(lat)).toFixed(2))} km²
                </Text>
              </Card>
              <Card style={styles.stat}>
                <Text style={styles.statLbl}>Sous bouclier</Text>
                <Text weight="bold" style={styles.statVal}>
                  {miennes.filter((c) => c.bouclier).length}
                </Text>
              </Card>
            </View>
            {attente > 0 && <Text style={[styles.note, styles.pad]}>{attente} cases en attente d&apos;envoi (connexion internet).</Text>}

            <View style={styles.titreClass}>
              <Text weight="semibold" style={styles.h3}>
                Classement
              </Text>
            </View>
            <Segmente
              options={[
                ['quartier', 'Quartier'],
                ['ville', 'Ville'],
              ]}
              value={portee}
              onChange={(v) => {
                setRangs(null);
                setPortee(v);
              }}
              style={styles.seg}
            />
            <Card style={styles.carte}>
              {rangs === null ? (
                <Text style={styles.note}>Chargement…</Text>
              ) : rangs.length ? (
                rangs.map((r, i) => (
                  <View key={r.proprio} style={[styles.ligne, i > 0 && styles.sep, r.moi && styles.moi]}>
                    <Text weight="bold" style={[styles.rang, r.moi && styles.rose]}>
                      {r.rang}
                    </Text>
                    <CoachFace id={r.coach} size={34} />
                    <Text weight={r.moi ? 'semibold' : 'regular'} style={styles.nom} numberOfLines={1}>
                      {r.moi ? 'Toi' : r.prenom}
                    </Text>
                    <Text weight="semibold" style={styles.nb}>
                      {r.cases}
                    </Text>
                    <Icon name="hexa" size={16} color={r.moi ? colors.pink : colors.textSecondary} />
                  </View>
                ))
              ) : (
                <Text style={styles.note}>Personne n&apos;a encore conquis de case ici. À toi de jouer !</Text>
              )}
            </Card>
          </>
        )}

        <Card style={styles.carte}>
          <Text weight="semibold" style={styles.h3}>
            Les règles
          </Text>
          {(
            [
              ['hexa', 'La ville est découpée en cases d’environ 150 m. Chaque case traversée dehors, à vélo ou en courant, devient à toi.'],
              ['bolt', 'Passe sur la case d’un autre joueur pour la lui voler.'],
              ['shield', 'Une case prise est protégée 24 h : personne ne peut la voler pendant ce temps.'],
              ['clock', 'Une case où personne n’est passé depuis 14 jours redevient libre. Repasse chez toi pour la garder !'],
            ] as const
          ).map(([ic, t]) => (
            <View key={ic} style={styles.regle}>
              <Icon name={ic} size={18} color={colors.pink} />
              <Text style={[styles.p, styles.flex]}>{t}</Text>
            </View>
          ))}
          <Text style={styles.note}>Seules les sorties au vrai GPS comptent (pas le parcours simulé ni le vélo stationnaire).</Text>
        </Card>

        <Button label="Partir conquérir" iconAfter="play" onPress={() => router.navigate('/velo')} style={styles.go} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingBottom: 28 },
  attenteCarte: { marginTop: 12, marginHorizontal: 20, height: 380, borderRadius: 20, backgroundColor: ui.carte, alignItems: 'center', justifyContent: 'center' },
  legende: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 20, paddingTop: 10 },
  leg: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pastille: { width: 12, height: 12, borderRadius: 3 },
  bouclier: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.text },
  legTxt: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  pad: { paddingHorizontal: 20, paddingTop: 8 },
  note: { fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  carte: { marginTop: 12, marginHorizontal: 20, padding: 16 },
  h3: { fontSize: 17, lineHeight: 22 },
  p: { fontSize: 13.5, lineHeight: 19, color: colors.textSecondary, marginTop: 4 },
  btn: { marginTop: 14 },
  stats: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 12 },
  stat: { flex: 1, paddingVertical: 12, paddingHorizontal: 10 },
  statLbl: { fontSize: 11.5, lineHeight: 15, color: colors.textSecondary },
  statVal: { fontSize: 20, lineHeight: 26, marginTop: 2, fontVariant: ['tabular-nums'] },
  titreClass: { paddingHorizontal: 20, paddingTop: 20 },
  seg: { marginHorizontal: 20, marginTop: 10 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  moi: { backgroundColor: ui.selFond, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 12 },
  rang: { width: 24, fontSize: 15, lineHeight: 20, textAlign: 'center', fontVariant: ['tabular-nums'] },
  rose: { color: colors.pink },
  nom: { flex: 1, fontSize: 15, lineHeight: 20 },
  nb: { fontSize: 15, lineHeight: 20, fontVariant: ['tabular-nums'], ...fonts.semibold },
  regle: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 10 },
  go: { marginTop: 16, marginHorizontal: 20 },
});
