import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// Chromium déjà installé sur la machine (sinon Remotion télécharge le sien) : NEA_CHROME=/chemin/vers/chrome
if (process.env.NEA_CHROME) Config.setBrowserExecutable(process.env.NEA_CHROME);
