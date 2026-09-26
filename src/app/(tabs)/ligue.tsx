import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bientot } from '@/components/app/bientot';
import { CoachFace } from '@/components/app/CoachFace';
import { confirmer } from '@/components/app/confirmer';
import { Lvl } from '@/components/app/Lvl';
import { Row } from '@/components/app/Rows';
import { SectionHead } from '@/components/app/Section';
import { Sheet } from '@/components/app/Sheet';
import { Button, Card, Icon, Text, toast, isIconName } from '@/components/ui';
import { QUESTS } from '@/data/ligue';
import type { CoachId } from '@/data/types';
import { dec, fmt } from '@/lib/charges';
import { actifSemaine, actifsEquipe, xpSemaine } from '@/lib/ligue';
import { isPremium } from '@/lib/premium';
import { boosts, lvlInfo, mult, rankOf, streak, todayQuests } from '@/lib/xp';
import { rafraichirLigue, useCompte } from '@/store/compte';
import { ajouterAmi, creerEquipe, quitterEquipe, rejoindreEquipe, renommerEquipe, useLigue, type Resultat } from '@/store/ligue';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, glow, ui } from '@/theme';

type Ligne = { key: string; nom: string; coach?: CoachId; equipe?: boolean; moi?: boolean; tot: number; wk: number };

/** Onglet Ligue (vLigue du prototype) : niveau, boosts, Turbo, quêtes, classements, équipe, invitation. */
export default function Ligue() {
  const p = useProfil();
  const connecte = !!useCompte((s) => s.userId);
  const l = useLigue();
  const [seg, setSeg] = useState<'amis' | 'equipes'>('amis');
  const [per, setPer] = useState<'semaine' | 'total'>('semaine');
  const [feuille, setFeuille] = useState<'ami' | 'nom' | null>(null);
  const [saisie, setSaisie] = useState('');
  /** Erreur affichée dans la feuille (un toast serait caché derrière elle). */
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);
  // Instant de référence (semaine, Turbo), remis à jour à chaque affichage de l'onglet.
  const [now, setNow] = useState(Date.now);
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      rafraichirLigue();
    }, []),
  );

  const date = new Date(now);
  const li = lvlInfo(p.xp);
  const rk = rankOf(li.n);
  const autres = l.membres.filter((m) => m.actif).length;
  const tA = actifsEquipe(autres, p.logs, date);
  const b = boosts(streak(p.logs, p.days, date), p.boostUntil, tA, now);
  const m = mult(b);
  const q = todayQuests(p.quests, date);
  const turboActif = p.boostUntil > now;
  const monWk = xpSemaine(p.xpLog, date);

  const rows: Ligne[] =
    seg === 'amis'
      ? [
          { key: 'moi', nom: p.name + ' (toi)', coach: p.coach, moi: true, tot: p.xp, wk: monWk },
          ...l.amis.map((a) => ({ key: a.id, nom: a.prenom, coach: a.coach, tot: a.xp, wk: a.xpSemaine })),
        ]
      : l.classement.map((e) => ({ key: e.id, nom: e.nom, equipe: true, moi: e.id === l.equipe?.id, tot: e.xp, wk: e.xpSemaine }));
  const cle = per === 'semaine' ? 'wk' : 'tot';
  rows.sort((x, y) => y[cle] - x[cle]);

  const tli = lvlInfo(Math.round((p.xp + l.membres.reduce((a, f) => a + f.xp, 0)) / 3));
  const n = l.membres.length + 1;

  const agir = async (f: () => Promise<Resultat>, ok: (r: Resultat & { ok: true }) => void, ko: (e: string) => void = toast) => {
    setOccupe(true);
    const r = await f();
    setOccupe(false);
    if (r.ok) ok(r);
    else ko(r.erreur);
  };

  const turbo = () => {
    if (!isPremium()) {
      bientot('plus');
      return;
    }
    if (p.tokens < 1) return;
    p.set({ tokens: p.tokens - 1, boostUntil: Date.now() + 864e5 });
    setNow(Date.now());
    toast('Turbo x2 actif pendant 24 h');
  };

  const inviter = () => {
    if (!l.code) return;
    Share.share({ message: 'Rejoins-moi sur NÉA, le coach sportif IA ! Mon code ami : ' + l.code });
  };

  const ouvrir = (f: 'ami' | 'nom') => {
    setSaisie(f === 'nom' ? (l.equipe?.nom ?? '') : '');
    setErreur('');
    setFeuille(f);
  };

  const valider = () => {
    const v = saisie.trim();
    if (!v) return;
    if (feuille === 'ami')
      agir(
        () => ajouterAmi(v),
        (r) => {
          setFeuille(null);
          toast((r.prenom || 'Ton ami') + ' est dans tes amis');
        },
        setErreur,
      );
    else
      agir(
        () => renommerEquipe(v),
        () => setFeuille(null),
        setErreur,
      );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text weight="bold" style={styles.ptitle}>
          Ligue
        </Text>

        {/* .lhead */}
        <Card style={styles.lhead}>
          <Lvl n={li.n} color={rk[1]} big />
          <View style={styles.flex}>
            <Text weight="bold" style={styles.lheadB}>
              {rk[0]} • niveau {li.n}
            </Text>
            <View style={styles.xbar}>
              <LinearGradient
                colors={[colors.pinkLight, colors.pink]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.xfill, { width: `${(li.cur / li.need) * 100}%` }]}
              />
            </View>
            <Text style={styles.small}>
              {li.cur}/{li.need} XP avant le niveau {li.n + 1}
            </Text>
          </View>
        </Card>

        {/* .boosts */}
        <View style={styles.boosts}>
          {b.length ? (
            b.map((x) => (
              <View key={x[0]} style={styles.boost}>
                {isIconName(x[2]) && <Icon name={x[2]} size={14} color={colors.pinkPale} />}
                <Text style={styles.boostTxt}>
                  {x[0]} x{dec(x[1])}
                </Text>
              </View>
            ))
          ) : (
            <View style={[styles.boost, styles.boostOff]}>
              <Text style={[styles.boostTxt, styles.muted]}>Aucun boost : garde ta série 3 jours pour x1,2</Text>
            </View>
          )}
          <LinearGradient colors={[ui.segOn, colors.pinkLight]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.boost, styles.boostTot]}>
            <Text weight="bold" style={[styles.boostTxt, { color: colors.onPrimary }]}>
              Total x{dec(m.toFixed(2))}
            </Text>
          </LinearGradient>
        </View>

        {/* .turbo */}
        <Card style={styles.carteAction}>
          <View style={styles.carteG}>
            <Icon name="bolt" color={ui.turbo} />
            <View style={styles.flex}>
              <Text weight="bold" style={styles.b14}>
                Turbo x2
              </Text>
              <Text style={styles.small}>
                {turboActif
                  ? 'Actif encore ' + Math.ceil((p.boostUntil - now) / 36e5) + ' h'
                  : p.tokens + ' disponible' + (p.tokens > 1 ? 's' : '') + ' • 1 gagné à chaque niveau'}
              </Text>
            </View>
          </View>
          <Button label="Activer" onPress={turbo} disabled={p.tokens < 1 || turboActif} style={styles.btn40} />
        </Card>

        {/* Quêtes du jour */}
        <SectionHead title="Quêtes du jour" note={`${q.done.length}/${q.ids.length}`} />
        <View style={styles.list}>
          {q.ids.map((id) => {
            const Q = QUESTS.find((x) => x[0] === id)!;
            const d = q.done.includes(id);
            return (
              <Row key={id}>
                <View style={[styles.qk, d && styles.qkDone]}>{d && <Icon name="check" size={14} strokeWidth={3} color={colors.onPrimary} />}</View>
                <View style={styles.flex}>
                  <Text weight="semibold" style={[styles.h5, d && styles.barre]}>
                    {Q[1]}
                  </Text>
                  <Text style={styles.p}>
                    +{Q[2]} XP {m > 1 ? '(x' + dec(m.toFixed(2)) + ')' : ''}
                  </Text>
                </View>
              </Row>
            );
          })}
        </View>

        {/* .seg : Amis | Équipes | Cette semaine / Total */}
        <View style={styles.seg}>
          <Seg label="Amis" on={seg === 'amis'} onPress={() => setSeg('amis')} />
          <Seg label="Équipes" on={seg === 'equipes'} onPress={() => setSeg('equipes')} />
          <Seg label={per === 'semaine' ? 'Cette semaine' : 'Total'} on onPress={() => setPer(per === 'semaine' ? 'total' : 'semaine')} />
        </View>
        <View style={[styles.list, styles.mt12]}>
          {rows.map((r, i) => {
            const rn = lvlInfo(r.tot).n;
            return (
              <Row key={r.key} style={[styles.lrow, r.moi && styles.lrowMoi]}>
                <Text weight="extrabold" style={[styles.pos, i < 3 && { color: ui.podium[i] }]}>
                  {i + 1}
                </Text>
                {r.equipe ? (
                  <View style={styles.tav}>
                    <Icon name="usercheck" color={colors.pinkLight} />
                  </View>
                ) : (
                  <CoachFace id={r.coach!} size={38} borderWidth={1} />
                )}
                <View style={styles.flex}>
                  <Text weight="semibold" style={styles.h5} numberOfLines={1}>
                    {r.nom}
                  </Text>
                  <Text style={styles.p}>{r.equipe ? 'Équipe' : 'Niveau ' + rn + ' • ' + rankOf(rn)[0]}</Text>
                </View>
                <Text weight="bold" style={styles.lxp}>
                  {fmt(r[cle])} XP
                </Text>
              </Row>
            );
          })}
          {!rows.length && <Text style={styles.vide}>{connecte ? 'Aucune équipe pour l’instant : crée la tienne !' : 'Crée ton compte pour voir les équipes.'}</Text>}
        </View>

        {!connecte ? (
          /* Sans compte : amis et équipes ont besoin du serveur */
          <Card style={[styles.teamc, styles.mt22]}>
            <Text weight="bold" style={styles.b14}>
              Joue avec tes amis
            </Text>
            <Text style={styles.small}>Crée ton compte pour ajouter tes amis, former une équipe et débloquer le boost Équipe +20 %.</Text>
            <Button label="Créer mon compte" onPress={() => router.push({ pathname: '/compte', params: { mode: 'signup' } })} style={styles.mt12} />
          </Card>
        ) : l.equipe ? (
          <>
            <SectionHead title={l.equipe.nom} action="Renommer" onAction={() => ouvrir('nom')} />
            {/* .teamc */}
            <Card style={styles.teamc}>
              <View style={styles.tl}>
                <Lvl n={tli.n} color={rankOf(tli.n)[1]} />
                <View style={styles.flex}>
                  <Text weight="bold" style={styles.b14}>
                    Niveau d&apos;équipe {tli.n}
                  </Text>
                  <Text style={styles.small}>
                    {tA}/{n} actifs cette semaine •{' '}
                    {tA >= 3 ? 'boost Équipe +20 % pour tous' : 'encore ' + (3 - tA) + ' actif' + (3 - tA > 1 ? 's' : '') + ' pour débloquer +20 %'}
                  </Text>
                </View>
              </View>
              <View style={styles.mem}>
                <Membre coach={p.coach} nom="Toi" actif={actifSemaine(p.logs, date)} />
                {l.membres.map((f) => (
                  <Membre key={f.id} coach={f.coach} nom={f.prenom} actif={f.actif} />
                ))}
              </View>
            </Card>
            <Pressable
              accessibilityRole="button"
              disabled={occupe}
              onPress={() => confirmer("Quitter l'équipe ?", 'Tu pourras en rejoindre une autre ou créer la tienne.', 'Quitter', () => agir(quitterEquipe, () => toast("Tu as quitté l'équipe")))}
              style={styles.quitter}
            >
              <Text style={styles.small}>Quitter l&apos;équipe</Text>
            </Pressable>
          </>
        ) : (
          <>
            <SectionHead title="Équipe" note="5 membres max" />
            <Card style={styles.teamc}>
              <Text style={styles.small}>Quand 3 membres sont actifs dans la semaine, toute l&apos;équipe gagne +20 % d&apos;XP.</Text>
              {l.equipesAmies.map((e) => (
                <View key={e.id} style={styles.rejoindre}>
                  <View style={styles.tav}>
                    <Icon name="usercheck" color={colors.pinkLight} />
                  </View>
                  <View style={styles.flex}>
                    <Text weight="semibold" style={styles.h5} numberOfLines={1}>
                      {e.nom}
                    </Text>
                    <Text style={styles.p}>{e.n}/5 membres</Text>
                  </View>
                  <Button label="Rejoindre" variant="dark" small disabled={occupe} onPress={() => agir(() => rejoindreEquipe(e.id), () => toast('Bienvenue dans ' + e.nom))} style={styles.btn40} />
                </View>
              ))}
              <Button
                label="Créer mon équipe"
                icon="plus"
                disabled={occupe}
                onPress={() => agir(() => creerEquipe('Team ' + (p.name || 'NÉA')), () => toast('Équipe créée : invite tes amis'))}
                style={styles.mt12}
              />
            </Card>
          </>
        )}

        {connecte && (
          <>
            {/* .invite */}
            <Card style={styles.carteAction}>
              <View style={styles.carteG}>
                <Icon name="usercheck" color={colors.pink} />
                <View style={styles.flex}>
                  <Text weight="bold" style={styles.b14}>
                    Invite tes amis
                  </Text>
                  <Text style={styles.small12}>
                    Ton code : <Text style={styles.code}>{l.code ?? '…'}</Text>
                  </Text>
                </View>
              </View>
              <Button label="Inviter" onPress={inviter} disabled={!l.code} style={styles.btn40} />
            </Card>
            <Card style={styles.carteAction}>
              <View style={styles.carteG}>
                <Icon name="plus" color={colors.pink} />
                <View style={styles.flex}>
                  <Text weight="bold" style={styles.b14}>
                    Ajouter un ami
                  </Text>
                  <Text style={styles.small12}>Entre le code de ton ami</Text>
                </View>
              </View>
              <Button label="Ajouter" variant="dark" onPress={() => ouvrir('ami')} style={styles.btn40} />
            </Card>
          </>
        )}
        <View style={styles.bas} />
      </ScrollView>

      <Sheet visible={feuille !== null} onClose={() => setFeuille(null)} title={feuille === 'ami' ? 'Ajouter un ami' : 'Nom de ton équipe'}>
        <TextInput
          style={styles.inp}
          value={saisie}
          onChangeText={(t) => {
            setSaisie(t);
            setErreur('');
          }}
          placeholder={feuille === 'ami' ? 'NEA-XXXXXX' : 'Team…'}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize={feuille === 'ami' ? 'characters' : 'sentences'}
          autoCorrect={false}
          maxLength={feuille === 'ami' ? 12 : 24}
          autoFocus
          onSubmitEditing={valider}
          accessibilityLabel={feuille === 'ami' ? 'Code ami' : "Nom de l'équipe"}
        />
        {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
        <Button label={occupe ? '…' : feuille === 'ami' ? 'Ajouter' : 'Enregistrer'} disabled={occupe || !saisie.trim()} onPress={valider} style={styles.mt12} />
      </Sheet>
    </SafeAreaView>
  );
}

/** Bouton du sélecteur (.seg button). */
function Seg({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={onPress} style={styles.flex}>
      {on ? (
        <LinearGradient colors={[ui.segOn, colors.pinkLight]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.segBtn, styles.segOn]}>
          <Text weight="semibold" style={[styles.segTxt, { color: colors.onPrimary }]}>
            {label}
          </Text>
        </LinearGradient>
      ) : (
        <View style={styles.segBtn}>
          <Text weight="semibold" style={styles.segTxt}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** Avatar d'un membre de l'équipe (.mem div), bordure verte s'il est actif cette semaine. */
function Membre({ coach, nom, actif }: { coach: CoachId; nom: string; actif: boolean }) {
  return (
    <View style={[styles.membre, !actif && styles.inactif]}>
      <CoachFace id={coach} size={44} borderColor={actif ? colors.green : colors.border2} style={actif ? glow(alpha(colors.green, 0.5), 10) : undefined} />
      <Text style={[styles.membreNom, actif && { color: colors.text }]} numberOfLines={1}>
        {nom}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  mt12: { marginTop: 12 },
  ptitle: { fontSize: 24, lineHeight: 30, paddingTop: 14, paddingHorizontal: 20 },
  lhead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12, marginHorizontal: 20, padding: 14 },
  lheadB: { fontSize: 15, lineHeight: 19 },
  xbar: { height: 7, borderRadius: 6, backgroundColor: colors.border, overflow: 'hidden', marginTop: 6, marginBottom: 4 },
  xfill: { height: '100%' },
  small: { fontSize: 11.5, lineHeight: 15, color: colors.textSecondary },
  small12: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  muted: { color: colors.textSecondary },
  boosts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 10, paddingHorizontal: 20 },
  boost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,79,163,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,79,163,0.4)',
  },
  boostOff: { backgroundColor: ui.segBg, borderColor: colors.border2 },
  boostTot: { borderWidth: 0 },
  boostTxt: { fontSize: 12, lineHeight: 16, color: colors.pinkPale },
  carteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  carteG: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  b14: { fontSize: 14, lineHeight: 18 },
  btn40: { height: 40 },
  list: { paddingHorizontal: 20 },
  qk: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  qkDone: { backgroundColor: colors.pinkLight, borderColor: 'transparent' },
  h5: { fontSize: 14.5, lineHeight: 19, fontFamily: fonts.semibold },
  barre: { textDecorationLine: 'line-through', color: colors.textSecondary },
  p: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
  seg: { flexDirection: 'row', gap: 8, paddingTop: 18, paddingHorizontal: 20 },
  segBtn: { height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.segBg, borderWidth: 1, borderColor: colors.border },
  segOn: { borderWidth: 0, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 14, spreadDistance: 0, color: 'rgba(255,79,163,0.4)' }] },
  segTxt: { fontSize: 13, lineHeight: 17, color: ui.segTxt },
  lrow: { gap: 10 },
  lrowMoi: { borderColor: colors.pink, backgroundColor: 'rgba(255,79,163,0.08)' },
  pos: { width: 24, textAlign: 'center', fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  tav: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ui.avatarBg,
    borderWidth: 1,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lxp: { fontSize: 13.5, lineHeight: 18, fontVariant: ['tabular-nums'] },
  vide: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, paddingVertical: 6 },
  teamc: { marginHorizontal: 20, padding: 14 },
  mt22: { marginTop: 22 },
  tl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mem: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  membre: { alignItems: 'center', gap: 5, maxWidth: 60 },
  inactif: { opacity: 0.45 },
  membreNom: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  quitter: { alignSelf: 'center', paddingVertical: 10 },
  rejoindre: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  code: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.text, letterSpacing: 0.6 },
  inp: {
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 14,
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  erreur: { fontSize: 13, lineHeight: 18, color: ui.heart, marginTop: 10 },
  bas: { height: 24 },
});
