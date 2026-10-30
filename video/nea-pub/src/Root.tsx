import React from 'react';
import { Composition } from 'remotion';

import { NeaPub } from './NeaPub';
import { FORMAT } from './config/theme';
import { DUREE_TOTALE, img } from './config/timeline';

export const Root: React.FC = () => (
  <Composition id="NeaPub" component={NeaPub} durationInFrames={img(DUREE_TOTALE)} fps={FORMAT.fps} width={FORMAT.largeur} height={FORMAT.hauteur} />
);
