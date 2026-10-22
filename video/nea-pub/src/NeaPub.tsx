import { loadFont } from '@remotion/fonts';
import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion';

import { Scene } from './components/Scene';
import { GROUPES, SousTitres } from './components/SousTitres';
import { ASSETS, VOIX_SOURCE } from './config/assets';
import { COULEURS, TRANSITION } from './config/theme';
import { img, scene, SCENES, VOIX_DELAI, type IdScene } from './config/timeline';
import { Accroche, Conclusion, Etape1, Etape2, Etape3, Solution, Synthese } from './scenes/Scenes';

loadFont({ family: 'Inter', url: staticFile(ASSETS.police), weight: '100 900' });

const COMPOSANTS: Record<IdScene, React.FC> = {
  accroche: Accroche,
  solution: Solution,
  etape1: Etape1,
  etape2: Etape2,
  etape3: Etape3,
  synthese: Synthese,
  conclusion: Conclusion,
};

/** La musique baisse quand la voix parle (d'après les groupes de sous-titres). */
const volumeMusique = (f: number) => {
  const t = f / 30;
  const parle = GROUPES.some((g) => t >= g.debut - 0.15 && t <= g.fin + 0.1);
  const fin = interpolate(f, [img(SCENES[SCENES.length - 1].fin) - 45, img(SCENES[SCENES.length - 1].fin)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const debut = interpolate(f, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  return (parle ? 0.1 : 0.2) * fin * debut;
};

export const NeaPub: React.FC = () => {
  const derniere = SCENES.length - 1;
  return (
    <AbsoluteFill style={{ background: COULEURS.graphite }}>
      {SCENES.map((s, i) => {
        const sc = scene(s.id);
        const C = COMPOSANTS[s.id];
        return (
          <Sequence key={s.id} from={sc.from} durationInFrames={sc.duree + (i < derniere ? TRANSITION : 0)} name={s.id}>
            <Scene entree={i > 0} sortie={i < derniere}>
              <C />
            </Scene>
          </Sequence>
        );
      })}

      <SousTitres />

      {/* voix off */}
      {VOIX_SOURCE === 'lignes' &&
        SCENES.map((s, i) => (
          <Sequence key={'v' + i} from={img(s.debut + VOIX_DELAI)} name={'voix ' + s.id}>
            <Audio src={staticFile(ASSETS.audio.voix(i))} />
          </Sequence>
        ))}
      {VOIX_SOURCE === 'complete' && <Audio src={staticFile(ASSETS.audio.voixComplete)} />}

      {/* musique instrumentale (générée pour la vidéo, libre d'usage) */}
      <Audio src={staticFile(ASSETS.audio.musique)} volume={volumeMusique} />

      {/* sons : glissement à chaque changement de scène, clic à chaque étape, pop des coches */}
      {SCENES.slice(1).map((s) => (
        <Sequence key={'g' + s.id} from={img(s.debut) - 4}>
          <Audio src={staticFile(ASSETS.audio.glisse)} volume={0.5} />
        </Sequence>
      ))}
      {(['etape1', 'etape2', 'etape3'] as const).map((id) => (
        <Sequence key={'c' + id} from={scene(id).from + 6}>
          <Audio src={staticFile(ASSETS.audio.clic)} volume={0.7} />
        </Sequence>
      ))}
      {[0, 1, 2].map((k) => (
        <Sequence key={'p' + k} from={scene('synthese').from + 30 + k * 12}>
          <Audio src={staticFile(ASSETS.audio.pop)} volume={0.55} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
