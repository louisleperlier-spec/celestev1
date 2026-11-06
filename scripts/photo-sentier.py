"""
Photo d'un sentier au style NÉA : voile chaud orange (#FF6B1A, lumière douce 30 %), ombres vers le graphite,
léger assombrissement et vignette. Écrit assets/randos/<id>_grand.jpg (1000 px) et <id>.jpg (vignette 360 × 188).
Usage : python3 scripts/photo-sentier.py <photo source> <id du sentier>
"""
import sys

import numpy as np
from PIL import Image, ImageEnhance


def teinter(im: Image.Image) -> Image.Image:
    im = ImageEnhance.Color(im.convert('RGB')).enhance(0.92)
    a = np.asarray(im).astype(np.float32) / 255
    o = np.array([1.0, 0.42, 0.10])
    doux = np.where(o <= 0.5, 2 * a * o + a * a * (1 - 2 * o), 2 * a * (1 - o) + np.sqrt(a) * (2 * o - 1))
    a = a * 0.7 + doux * 0.3
    g = np.array([0x22, 0x23, 0x28]) / 255
    a = (a * 0.9 + g * 0.1 * (1 - a)) * 0.92
    h, w, _ = a.shape
    y, x = np.ogrid[:h, :w]
    r = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2)
    a *= (1 - 0.22 * np.clip(r - 0.55, 0, 1) ** 1.5)[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


if __name__ == '__main__':
    src, id_ = sys.argv[1], sys.argv[2]
    p = teinter(Image.open(src))
    w, h = p.size
    p.resize((1000, round(1000 * h / w)), Image.LANCZOS).save(f'assets/randos/{id_}_grand.jpg', quality=82)
    hv = round(w * 188 / 360)
    y = max(0, (h - hv) // 2)
    p.crop((0, y, w, y + hv)).resize((360, 188), Image.LANCZOS).save(f'assets/randos/{id_}.jpg', quality=85)
