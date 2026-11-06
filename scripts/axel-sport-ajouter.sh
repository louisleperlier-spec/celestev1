#!/usr/bin/env bash
# Ajoute une illustration Axel Sport de bout en bout : image brute (URL ou fichier) → brut/<id>.webp → détourage → intégration à l'app
# → journal des générations → manifeste, prompts et planches. Usage :
#   scripts/axel-sport-ajouter.sh <id_exercice> <url_ou_fichier> <modele> [id_generation] [remarques]
# PY / ISNET : préparés tout seuls par scripts/axel-sport-preparer.sh s'ils ne sont pas donnés.
set -euo pipefail
id="$1"; source="$2"; modele="$3"; gen="${4:-}"; rem="${5:-}"
cd "$(dirname "$0")/.."
if [ -z "${PY:-}" ] || [ -z "${ISNET:-}" ]; then eval "$(scripts/axel-sport-preparer.sh)"; fi
grep -q "id: '$id'" src/data/exercices.ts || { echo "Exercice inconnu : $id" >&2; exit 1; }
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
if [[ "$source" == http* ]]; then curl -fsSL -o "$tmp/brut" "$source"; else cp "$source" "$tmp/brut"; fi
"$PY" -c "from PIL import Image; import sys; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],'WEBP',quality=94,method=6)" "$tmp/brut" "docs/axel-sport/brut/$id.webp"
"$PY" scripts/axel-sport-detourer.py "$ISNET" "docs/axel-sport/brut/$id.webp" "assets/exercices/axel/$id.webp"
"$PY" - "$id" "$modele" "$gen" "$rem" <<'PY'
import json, sys, datetime
i, m, g, r = sys.argv[1:5]
p = 'docs/axel-sport/generations.json'; d = json.load(open(p))
d[i] = {"generation": g or None, "modele": m, "date": datetime.date.today().isoformat(), "statut": "genere_a_verifier", "remarques": r or None}
json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2)
PY
npx tsx scripts/axel-sport-integrer.ts
npx tsx scripts/axel-sport-manifeste.ts
npx tsx scripts/axel-sport-prompts-chatgpt.ts >/dev/null
"$PY" scripts/axel-sport-planches.py >/dev/null
echo "OK $id"
