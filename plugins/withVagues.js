/**
 * Vagues NÉA (DistortionWavesKit) : les shaders SwiftUI doivent être compilés par Xcode dans le `default.metallib` de l'app.
 * Le module natif (pod) ne peut pas l'embarquer : ce plugin copie `DistortionWaveShaders.metal` dans le dossier de l'app
 * et l'ajoute aux sources de la cible principale, à chaque prebuild.
 */
const fs = require('fs');
const path = require('path');
const { withXcodeProject, IOSConfig } = require('@expo/config-plugins');

const FICHIER = 'DistortionWaveShaders.metal';

module.exports = function withVagues(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const nom = IOSConfig.XcodeUtils.getProjectName(cfg.modRequest.projectRoot);
    const source = path.join(cfg.modRequest.projectRoot, 'modules', 'nea-montre', 'ios', 'Vagues', FICHIER);
    fs.copyFileSync(source, path.join(cfg.modRequest.platformProjectRoot, nom, FICHIER));
    const chemin = `${nom}/${FICHIER}`;
    if (!project.hasFile(chemin)) {
      const cible = IOSConfig.XcodeUtils.getApplicationNativeTarget({ project, projectName: nom });
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath: chemin, groupName: nom, project, targetUuid: cible.uuid });
    }
    // Type de fichier Metal : sans lui, Xcode ne compile pas le fichier en default.metallib.
    const refs = project.pbxFileReferenceSection();
    for (const [cle, ref] of Object.entries(refs)) {
      if (typeof ref === 'object' && String(ref.path ?? '').replace(/"/g, '') === chemin) {
        ref.lastKnownFileType = 'sourcecode.metal';
        delete ref.explicitFileType;
        delete ref.fileEncoding;
        delete ref.includeInIndex;
        refs[cle] = ref;
      }
    }
    return cfg;
  });
};
