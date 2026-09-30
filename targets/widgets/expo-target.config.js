/**
 * Widgets de l'iPhone (WidgetKit) : bilan du jour et prochaine séance, écran d'accueil et écran verrouillé.
 * Données écrites par l'app (`ecrireWidget`, module nea-montre) dans le groupe d'apps partagé.
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
module.exports = {
  type: 'widget',
  name: 'NeaWidgets',
  displayName: 'NÉA',
  bundleIdentifier: '.widgets',
  deploymentTarget: '17.0',
  colors: { $accent: '#FF4FA3', $widgetBackground: '#222328' },
  entitlements: {
    'com.apple.security.application-groups': ['group.com.neacoach.app'],
  },
};
