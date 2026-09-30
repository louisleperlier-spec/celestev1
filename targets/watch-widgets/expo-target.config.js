/**
 * Complications NÉA pour les cadrans de l'Apple Watch (WidgetKit) : score santé, pas, prochaine séance, mascotte.
 * Données écrites par l'app de la montre (`Cadran.publier`) dans le groupe d'apps ; pas lus dans Apple Santé.
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
module.exports = {
  type: 'watch-widget',
  name: 'NeaComplications',
  displayName: 'NÉA',
  bundleIdentifier: 'com.neacoach.app.watchkitapp.complications',
  deploymentTarget: '10.0',
  colors: { $accent: '#FF4FA3', $widgetBackground: '#000000' },
  images: {
    axel: './images/axel.png',
    nova: './images/nova.png',
    kai: './images/kai.png',
    luna: './images/luna.png',
    axel_teinte: './images/axel_teinte.png',
    nova_teinte: './images/nova_teinte.png',
    kai_teinte: './images/kai_teinte.png',
    luna_teinte: './images/luna_teinte.png',
  },
  frameworks: ['SwiftUI', 'WidgetKit', 'HealthKit'],
  entitlements: {
    'com.apple.security.application-groups': ['group.com.neacoach.app'],
    'com.apple.developer.healthkit': true,
    'com.apple.developer.healthkit.access': [],
  },
};
