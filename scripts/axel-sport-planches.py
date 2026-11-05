"""Planches de présentation Axel Sport, assemblées à partir des visuels individuels intégrés à l'app (assets/exercices/axel/<id>.webp).
- une planche (ou plusieurs pages) par programme, exercices dans l'ordre des séances, chaque exercice une seule fois ;
- un catalogue global des exercices uniques, numérotés comme le manifeste ;
- 30 vignettes au plus par page (6 × 5) ; un exercice sans image Axel est marqué « À générer ».
Usage : python axel-sport-planches.py   (depuis la racine du projet ; PIL)"""
import json
import math
import os

from PIL import Image, ImageDraw, ImageFont

ORANGE, IVOIRE, GRAPHITE = (0xFF, 0x6B, 0x1A), (0xF5, 0xEF, 0xE4), (0x24, 0x23, 0x28)
FOND = (0xFB, 0xF6, 0xEE)
POLICE = '/usr/share/fonts/opentype/inter/Inter-%s.otf'
f = lambda poids, t: ImageFont.truetype(POLICE % poids, t)
COLS, LIGNES, TW, TH = 6, 5, 330, 330
MARGE, ENTETE = 40, 210
SORTIE = 'docs/axel-sport/planches'
os.makedirs(SORTIE, exist_ok=True)

inv = json.load(open('docs/axel-sport/inventaire.json'))
man = {l['id']: l for l in json.load(open('docs/axel-sport/manifeste.json'))}
logo = Image.open('docs/axel-sport/references/logo-impulsion.png').convert('RGBA').resize((120, 120), Image.LANCZOS)


def ajuster(d, texte, police, largeur):
    while d.textlength(texte, font=police) > largeur and len(texte) > 4:
        texte = texte[:-2].rstrip() + '…'
    return texte


def vignette(numero, ex, etiquette=None):
    t = Image.new('RGB', (TW, TH), FOND)
    d = ImageDraw.Draw(t)
    d.rounded_rectangle((0, 0, TW - 1, TH - 1), radius=18, outline=(0xEA, 0xDF, 0xCF), width=2)
    d.text((16, 12), f'{numero:02d}', font=f('Bold', 26), fill=ORANGE)
    d.text((62, 16), ajuster(d, ex['nom'], f('SemiBold', 19), TW - 78), font=f('SemiBold', 19), fill=GRAPHITE)
    if etiquette:
        d.text((62, 40), ajuster(d, etiquette, f('Regular', 14), TW - 78), font=f('Regular', 14), fill=(0x8A, 0x80, 0x76))
    zone = (14, 66, TW - 14, TH - 14)
    chemin = man[ex['id']]['fichier']
    if os.path.exists(chemin):
        im = Image.open(chemin).convert('RGBA')
        im.thumbnail((zone[2] - zone[0], zone[3] - zone[1]), Image.LANCZOS)
        t.paste(im, (zone[0] + (zone[2] - zone[0] - im.width) // 2, zone[1] + (zone[3] - zone[1] - im.height) // 2), im)
    else:
        d.rounded_rectangle(zone, radius=14, fill=(0xF1, 0xE8, 0xDA), outline=(0xE3, 0xD6, 0xC3), width=2)
        txt = 'À générer'
        d.text(((TW - d.textlength(txt, font=f('SemiBold', 18))) / 2, (zone[1] + zone[3]) / 2 - 12), txt, font=f('SemiBold', 18), fill=(0xB0, 0xA2, 0x92))
    return t


def planche(titre, sous_titre, elements, nom_fichier):
    pages = max(1, math.ceil(len(elements) / (COLS * LIGNES)))
    fichiers = []
    for p in range(pages):
        lot = elements[p * COLS * LIGNES:(p + 1) * COLS * LIGNES]
        rangs = math.ceil(len(lot) / COLS)
        W = MARGE * 2 + COLS * TW + (COLS - 1) * 14
        H = ENTETE + rangs * TH + (rangs - 1) * 14 + MARGE
        im = Image.new('RGB', (W, H), FOND)
        d = ImageDraw.Draw(im)
        im.paste(logo, (MARGE, 40), logo)
        d.line((MARGE + 140, 52, MARGE + 140, 150), fill=ORANGE, width=3)
        d.text((MARGE + 162, 40), 'NÉA / AXEL SPORT', font=f('ExtraBold', 54), fill=GRAPHITE)
        d.text((MARGE + 162, 106), titre + (f'  ·  page {p + 1}/{pages}' if pages > 1 else ''), font=f('SemiBold', 30), fill=ORANGE)
        d.text((MARGE + 162, 148), sous_titre, font=f('Regular', 20), fill=(0x6E, 0x66, 0x5E))
        for i, (numero, ex, etiquette) in enumerate(lot):
            x = MARGE + (i % COLS) * (TW + 14)
            y = ENTETE + (i // COLS) * (TH + 14)
            im.paste(vignette(numero, ex, etiquette), (x, y))
        chemin = f'{SORTIE}/{nom_fichier}' + (f'-p{p + 1}' if pages > 1 else '') + '.png'
        im.save(chemin, optimize=True)
        fichiers.append(chemin)
    return fichiers


par_id = {e['id']: e for e in inv['exercices']}
faites = sum(1 for e in inv['exercices'] if os.path.exists(man[e['id']]['fichier']))

# Catalogue global (numérotation du manifeste).
cat = [(man[e['id']]['numero'], e, e['groupe'] + ' · ' + e['materiel']) for e in inv['exercices']]
sortis = planche('Catalogue des exercices', f'{len(cat)} exercices uniques · {faites} illustrés, les autres à générer', cat, 'catalogue')

# Une planche par programme : exercices dans l'ordre des séances, chacun une fois (le même visuel est réutilisé partout).
for prog in inv['programmes']:
    vus, elements = set(), []
    for s in prog['seances']:
        for x in s['exercices']:
            if x['id'] in vus:
                continue
            vus.add(x['id'])
            elements.append((len(elements) + 1, par_id[x['id']], s['titre']))
    seances = ' · '.join(s['titre'] for s in prog['seances'])
    sortis += planche(prog['nom'], f'{len(elements)} mouvements possibles selon ton lieu et ton niveau · {seances}'[:150], elements, f'programme-{prog["id"]}')
print('\n'.join(sortis))
