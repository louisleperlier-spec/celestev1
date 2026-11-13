# Découpe la planche « couleurs codées » (Nano Banana, fournie par l'utilisateur) en masques de muscles face / dos pour NÉA.
from PIL import Image, ImageFilter
import numpy as np, json, sys
src, dest = sys.argv[1], sys.argv[2]
im = np.array(Image.open(src).convert('RGB')).astype(float)
ref = {'traps':(245,4,3),'shoulders':(4,246,5),'chest':(1,2,246),'biceps':(252,246,6),'triceps':(244,7,244),'forearms':(9,249,248),
'upperBack':(249,132,8),'lats':(124,18,219),'abs':(76,175,246),'lowerBack':(142,248,5),'glutes':(248,42,147),'quads':(34,247,133),
'adductors':(117,55,11),'hamstrings':(248,141,136),'calves':(144,147,248)}
noms = list(ref)
R = np.array([ref[n] for n in noms], float)
# Teinte : couleur divisée par sa composante la plus forte (les bords assombris par la compression gardent leur teinte).
def chroma(a): return a / np.maximum(a.max(-1, keepdims=True), 1)
mx = im.max(2); sat = (mx - im.min(2)) > 60
d = ((chroma(im)[:, :, None, :] - chroma(R)[None, None]) ** 2).sum(3)
lab = np.where(sat & (mx > 70) & (d.min(2) < 0.06), d.argmin(2), -1)
# Le brun des adducteurs a la teinte de l'orange du haut du dos : c'est la luminosité qui les sépare.
ub, ad = noms.index('upperBack'), noms.index('adductors')
lab = np.where(((lab == ub) | (lab == ad)) & (mx < 200), ad, np.where(lab == ad, ub, lab))
corps = im.sum(2) < 690
lignes = im.sum(2) < 160
y0, y1 = 40, 1362   # au-dessus de la ligne du sol (y = 1368) et des légendes
vues = {'face': (55, 846), 'dos': (1758, 2530)}
LARG = 450
info = {}
for v, (x0, x1) in vues.items():
    cw, ch = x1 - x0, y1 - y0
    h = round(LARG * ch / cw)
    def sauve(m, nom):
        a = Image.fromarray((m[y0:y1, x0:x1] * 255).astype(np.uint8), 'L').resize((LARG, h), Image.LANCZOS)
        rgba = Image.new('RGBA', a.size, (255, 255, 255, 0)); rgba.putalpha(a)
        rgba.save(f'{dest}/{v}_{nom}.png', optimize=True)
    sil = Image.fromarray((corps * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    sauve(np.array(sil) > 127, 'silhouette')
    sauve(lignes & corps, 'lignes')
    presents = []
    for k, n in enumerate(noms):
        m = lab == k
        if m[y0:y1, x0:x1].sum() < 3600: continue  # miettes de compression (≈ 900 px une fois réduit)
        mm = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))
        sauve((np.array(mm) > 127) & corps, n); presents.append(n)
    info[v] = {'muscles': presents, 'ratio': round(ch / cw, 4)}
print(json.dumps(info))
json.dump(info, open('info.json', 'w'))
