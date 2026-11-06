#!/usr/bin/env bash
# Prépare les outils de détourage Axel Sport dans un dossier temporaire (rien dans git) : Python + PIL + onnxruntime + modèle ISNet.
# Affiche les deux variables à exporter : PY et ISNET.
set -euo pipefail
dir="${AXEL_OUTILS:-/tmp/axel-sport-outils}"
mkdir -p "$dir"
if [ ! -x "$dir/venv/bin/python" ]; then
  python3 -m venv "$dir/venv"
  "$dir/venv/bin/pip" install -q pillow numpy onnxruntime
fi
if [ ! -s "$dir/isnet.onnx" ]; then
  curl -fsSL -o "$dir/isnet.onnx" https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx
fi
echo "export PY=$dir/venv/bin/python ISNET=$dir/isnet.onnx"
