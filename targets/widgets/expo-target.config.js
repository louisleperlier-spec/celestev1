/**
 * Widgets de l'iPhone (WidgetKit) : Prochaine séance, Score NÉA, Pas, Fréquence cardiaque, Aperçu du jour, Horloge
 * (maquette noire à lueur rose avec la mascotte du coach) + formats de l'écran verrouillé.
 * Données écrites par l'app (`ecrireWidget`, module nea-montre) dans le groupe d'apps partagé ; pas et FC lus dans Apple Santé.
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
module.exports = {
  type: 'widget',
  name: 'NeaWidgets',
  displayName: 'NÉA',
  bundleIdentifier: '.widgets',
  deploymentTarget: '17.0',
  colors: { $accent: '#FF6B1A', $widgetBackground: '#0A0A0E' },
  images: {
    axel_corps: './images/axel_corps.png',
    nova_corps: './images/nova_corps.png',
    kai_corps: './images/kai_corps.png',
    luna_corps: './images/luna_corps.png',
    axel_dodo: './images/axel_dodo.png',
    axel_seance: './images/axel_seance.png',
    axel_pause: './images/axel_pause.png',
    axel_pas: './images/axel_pas.png',
  },
  frameworks: ['SwiftUI', 'WidgetKit', 'HealthKit', 'ActivityKit'],
  entitlements: {
    'com.apple.security.application-groups': ['group.com.neacoach.app'],
    'com.apple.developer.healthkit': true,
    'com.apple.developer.healthkit.access': [],
  },
};
