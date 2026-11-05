"""Détoure une illustration Axel Sport (fond ivoire) et l'enregistre pour l'app.
Usage : python axel-sport-detourer.py <modele isnet.onnx> <image brute> <sortie .webp>
Masque ISNet (onnxruntime) + seuil doux, recadrage sur le personnage et sa machine (marge 4 %), 900 px de large max, WebP avec transparence."""
import sys
import numpy as np
import onnxruntime as ort
from PIL import Image

modele, entree, sortie = sys.argv[1:4]
im = Image.open(entree).convert('RGB')
w, h = im.size
x = np.asarray(im.resize((1024, 1024), Image.BILINEAR), dtype=np.float32) / 255.0
x = (x - 0.5) / 1.0
x = x.transpose(2, 0, 1)[None]
s = ort.InferenceSession(modele, providers=['CPUExecutionProvider'])
m = s.run(None, {s.get_inputs()[0].name: x})[0][0, 0]
m = (m - m.min()) / max(1e-6, m.max() - m.min())
masque = Image.fromarray((np.clip((m - 0.15) / 0.7, 0, 1) * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)
rgba = im.convert('RGBA')
rgba.putalpha(masque)
a = np.asarray(masque)
ys, xs = np.where(a > 24)
if len(xs):
    mx, my = int(0.04 * w), int(0.04 * h)
    rgba = rgba.crop((max(0, xs.min() - mx), max(0, ys.min() - my), min(w, xs.max() + mx), min(h, ys.max() + my)))
if rgba.width > 900:
    rgba = rgba.resize((900, round(rgba.height * 900 / rgba.width)), Image.LANCZOS)
rgba.save(sortie, 'WEBP', quality=86, method=6)
print(sortie, rgba.size)
