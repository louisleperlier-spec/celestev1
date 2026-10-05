/**
 * App Apple Watch de NÉA (SwiftUI, cible watchOS générée par @bacons/apple-targets au prebuild).
 * Séances de la semaine reçues de l'iPhone, séance guidée avec la FC de la montre, enregistrée dans Apple Santé.
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
module.exports = {
  type: 'watch',
  name: 'NeaWatch',
  displayName: 'NÉA',
  bundleIdentifier: '.watchkitapp',
  deploymentTarget: '10.0',
  icon: '../../assets/images/icon.png',
  colors: { $accent: '#FF6B1A' },
  images: {
    axel: './images/axel.png',
    nova: './images/nova.png',
    kai: './images/kai.png',
    luna: './images/luna.png',
    ax_stable: './images/ax_stable.png',
    ax_forme: './images/ax_forme.png',
    ax_seance: './images/ax_seance.png',
    ax_stresse: './images/ax_stresse.png',
    ax_fatigue: './images/ax_fatigue.png',
    ax_detendu: './images/ax_detendu.png',
    ax_energique: './images/ax_energique.png',
    ax_dodo: './images/ax_dodo.png',
  },
  frameworks: ['SwiftUI', 'HealthKit', 'WatchConnectivity', 'CoreMotion', 'CoreLocation', 'MapKit', 'WidgetKit'],
  entitlements: {
    'com.apple.developer.healthkit': true,
    'com.apple.developer.healthkit.access': [],
    'com.apple.security.application-groups': ['group.com.neacoach.app'],
  },
};
