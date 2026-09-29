#!/usr/bin/env bash
# Build iOS sur les serveurs EAS, distribué par TestFlight (profil « preview » de eas.json).
# Les identifiants Apple viennent de l'environnement (réglages de l'environnement cloud, jamais dans git) :
#   EXPO_TOKEN, EXPO_ASC_KEY_ID, EXPO_ASC_ISSUER_ID, EXPO_APPLE_TEAM_ID, EXPO_APPLE_TEAM_TYPE (INDIVIDUAL ou COMPANY_OR_ORGANIZATION)
#   EXPO_ASC_API_KEY_P8 : contenu du fichier AuthKey_XXXX.p8 (clé d'API App Store Connect, rôle Admin)
# Avec la clé, EAS crée seul le certificat, le profil et l'identifiant com.neacoach.app (avec HealthKit).
set -euo pipefail
for v in EXPO_TOKEN EXPO_ASC_KEY_ID EXPO_ASC_ISSUER_ID EXPO_APPLE_TEAM_ID EXPO_APPLE_TEAM_TYPE EXPO_ASC_API_KEY_P8; do
  [ -n "${!v:-}" ] || { echo "Variable manquante : $v" >&2; exit 1; }
done
cle="$(mktemp -d)/AuthKey.p8"
trap 'rm -f "$cle"' EXIT
# Accepte la clé complète (plusieurs lignes ou avec des « \n »), ou seulement son contenu sur une ligne
# (sans BEGIN/END, comme le donne : awk 'NF && !/-----/' AuthKey_XXXX.p8 | tr -d '\n' | pbcopy).
if printf '%s' "$EXPO_ASC_API_KEY_P8" | grep -q 'BEGIN PRIVATE KEY'; then
  printf '%b\n' "$EXPO_ASC_API_KEY_P8" > "$cle"
else
  { echo '-----BEGIN PRIVATE KEY-----'; printf '%s' "$EXPO_ASC_API_KEY_P8" | tr -d ' \n\r' | fold -w 64; echo; echo '-----END PRIVATE KEY-----'; } > "$cle"
fi
export EXPO_ASC_API_KEY_PATH="$cle"
npx eas-cli@latest build --platform ios --profile "${1:-preview}" --non-interactive --no-wait
