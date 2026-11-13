"""Détoure une illustration Axel Sport (fond ivoire uni) et l'enregistre pour l'app.
Usage : python axel-sport-detourer.py <modele isnet.onnx> <image brute> <sortie .webp>
Masque = union de deux mesures : ISNet (onnxruntime) pour le personnage, et l'écart de couleur au fond (médiane des bords) pour garder
les fines pièces graphite que l'IA efface (barres de traction, montants, tapis). Recadrage (marge 3 %), 900 px de large max, WebP transparent."""
import sys
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

modele, entree, sortie = sys.argv[1:4]
im = Image.open(entree).convert('RGB')
w, h = im.size
s = ort.InferenceSession(modele, providers=['CPUExecutionProvider'])
x = (np.asarray(im.resize((1024, 1024), Image.BILINEAR), dtype=np.float32) / 255.0 - 0.5).transpose(2, 0, 1)[None]
m = s.run(None, {s.get_inputs()[0].name: x})[0][0, 0]
m = (m - m.min()) / max(1e-6, m.max() - m.min())
ia = np.clip((m - 0.15) / 0.7, 0, 1)
ia = np.asarray(Image.fromarray((ia * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR), dtype=np.float32) / 255
a = np.asarray(im, dtype=np.float32)
bord = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
dist = np.sqrt(((a - np.median(bord, axis=0)) ** 2).sum(axis=2))
coul = np.clip((dist - 38) / 30, 0, 1)
coul = np.asarray(Image.fromarray((coul * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)), dtype=np.float32) / 255
masque = Image.fromarray((np.maximum(ia, coul) * 255).astype(np.uint8))
rgba = im.convert('RGBA')
rgba.putalpha(masque)
ys, xs = np.where(np.asarray(masque) > 24)
if len(xs):
    mx, my = int(0.03 * w), int(0.03 * h)
    rgba = rgba.crop((max(0, xs.min() - mx), max(0, ys.min() - my), min(w, xs.max() + mx), min(h, ys.max() + my)))
if rgba.width > 900:
    rgba = rgba.resize((900, round(rgba.height * 900 / rgba.width)), Image.LANCZOS)
rgba.save(sortie, 'WEBP', quality=86, method=6)
print(sortie, rgba.size)
