#!/usr/bin/env python3
"""Reel NÉA « dynamique » (DA robot dessiné) inspiré du skill famous-reel-editor :
graphiques qui se dessinent, machine à écrire, tampons, sous-titres un mot à la fois calés sur la voix,
couche décorative toujours en mouvement, bruitages et musique synthétisés (libres de droits).

Usage : python reel_dynamique.py <sortie.mp4>   (Pillow, numpy, edge-tts, ffmpeg)
"""
import asyncio, math, os, random, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "assets")
WORK = os.environ.get("WORK", "/tmp/reel_dyn")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "nea-reel-dynamique.mp4")
W, H, FPS, SR = 1080, 1920, 30, 44100
CREAM, ORANGE, INK, HILITE = (252, 251, 246), (255, 106, 26), (17, 17, 17), (252, 222, 186)
RED, GREY = (226, 48, 38), (150, 150, 150)
HAND = os.path.join(A, "fonts", "Mali-Bold.ttf")
MONT = os.path.join(A, "fonts", "Montserrat-VariableFont_wght.ttf")
VOICE = "fr-FR-HenriNeural"
os.makedirs(WORK, exist_ok=True)

# ---------- script (règles viral-video-writing : accroche chiffrée < 3 s, une idée par phrase, une seule demande) ----------
SCENES = [
    ("calendar", "T'as sauté trois séances cette semaine ?"),
    ("flemme",   "C'est pas de la flemme."),
    ("battery",  "Ta batterie était à vingt pour cent."),
    ("versus",   "Une appli classique te donne la même séance, tous les jours."),
    ("chat",     "Néa, elle, te demande ton énergie."),
    ("adapt",    "Et elle coupe ta séance en deux."),
    ("rising",   "Résultat : tu y vas quand même."),
    ("end",      "Néa. Lien en bio !"),
]
CAPFIX = {"vingt": "20", "pour": "%", "cent.": "", "cent": "", "trois": "3", "néa,": "NÉA,", "néa.": "NÉA.", "néa": "NÉA"}

# ---------- utilitaires ----------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(g, s, d): return clamp((g - s) / d)
def eo(t): return 1 - (1 - t) ** 3
def eio(t): return 3 * t * t - 2 * t ** 3
def back(t, s=2.4):
    t -= 1
    return t * t * ((s + 1) * t + s) + 1
def elastic(t):
    if t <= 0: return 0.0
    if t >= 1: return 1.0
    return 2 ** (-10 * t) * math.sin((t - 0.075) * (2 * math.pi) / 0.3) + 1

FONTS = {}
def font(path, size, wght=None):
    k = (path, size, wght)
    if k not in FONTS:
        f = ImageFont.truetype(path, size)
        if wght:
            try: f.set_variation_by_axes([wght])
            except Exception: pass
        FONTS[k] = f
    return FONTS[k]

def text_img(txt, size, color=INK, path=HAND, wght=None, hl=None):
    f = font(path, size, wght)
    l, t, r, b = f.getbbox(txt)
    pad = int(size * 0.25)
    im = Image.new("RGBA", (r - l + 2 * pad, b - t + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if hl: d.rounded_rectangle((0, pad * 0.4, im.width, im.height - pad * 0.4), int(size * 0.3), fill=hl + (255,))
    d.text((pad - l, pad - t), txt, font=f, fill=color)
    return im

def place(c, im, cx, cy, sc=1.0, rot=0.0, alpha=1.0):
    if sc <= 0.01 or alpha <= 0: return
    if abs(sc - 1) > 0.002: im = im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))), Image.BILINEAR)
    if abs(rot) > 0.05: im = im.rotate(rot, Image.BICUBIC, expand=True)
    if alpha < 1: im = im.copy(); im.putalpha(im.getchannel("A").point(lambda v: int(v * alpha)))
    c.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))

def boil(f):
    r = random.Random(f // 3)
    return r.uniform(-2, 2), r.uniform(-2, 2), r.uniform(-0.7, 0.7)

def feather(path, f=90, side=50):
    im = Image.open(path).convert("RGB")
    m = Image.new("L", im.size, 255); d = ImageDraw.Draw(m)
    for i in range(f):
        a = int(255 * i / f); d.line((0, i, im.width, i), fill=a); d.line((0, im.height - 1 - i, im.width, im.height - 1 - i), fill=a)
    m2 = Image.new("L", im.size, 255); d2 = ImageDraw.Draw(m2)
    for i in range(side):
        a = int(255 * i / side); d2.line((i, 0, i, im.height), fill=a); d2.line((im.width - 1 - i, 0, im.width - 1 - i, im.height), fill=a)
    im.putalpha(ImageChops.darker(m, m2)); return im

TIRED = feather(os.path.join(A, "robot-a-plat.png"))
ENERGY = feather(os.path.join(A, "robot-energie.png"))
SEANCE = feather(os.path.join(A, "robot-seance.png"))
def make_head():
    im = Image.open(os.path.join(A, "robot-tete.png")).convert("RGB").crop((25, 25, 525, 515))
    m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), 80, fill=255)
    st = Image.new("RGBA", (im.width + 36, im.height + 36), (0, 0, 0, 0))
    ImageDraw.Draw(st).rounded_rectangle((0, 0, st.width - 1, st.height - 1), 95, fill=(255, 255, 255, 255))
    im.putalpha(m); st.alpha_composite(im, (18, 18)); return st
HEAD = make_head()

def paper():
    rnd = random.Random(7)
    bg = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(bg)
    for _ in range(160):
        x, y = rnd.randrange(W), rnd.randrange(H)
        d.line((x, y, x + rnd.randint(20, 70), y + rnd.randint(-4, 4)), fill=(242, 239, 230), width=1)
    return bg.convert("RGBA")
PAPER = paper()
# couche décorative : grille de points qui défile + particules orange qui montent
GRID = Image.new("RGBA", (W, H + 60), (0, 0, 0, 0))
gd = ImageDraw.Draw(GRID)
for y in range(0, H + 60, 60):
    for x in range(30, W, 60): gd.ellipse((x - 2, y - 2, x + 2, y + 2), fill=(225, 215, 200, 255))
PARTS = [(random.Random(i).uniform(0, W), random.Random(i + 99).uniform(0, H), random.Random(i + 7).uniform(1.5, 4), random.Random(i + 3).uniform(3, 9)) for i in range(34)]
def decor(c, f):
    c.alpha_composite(GRID, (0, -(f * 2 % 60)))
    d = ImageDraw.Draw(c)
    for x0, y0, sp, r in PARTS:
        y = (y0 - f * sp) % (H + 40) - 20
        x = x0 + 18 * math.sin(f * 0.05 + y0)
        d.ellipse((x - r, y - r, x + r, y + r), fill=ORANGE + (70,))

def stamp(c, txt, cx, cy, p, color=ORANGE, rot=-8, size=110):
    if p <= 0: return
    im = text_img(txt, size, color, path=MONT, wght=900)
    box = Image.new("RGBA", (im.width + 40, im.height + 20), (0, 0, 0, 0))
    ImageDraw.Draw(box).rounded_rectangle((4, 4, box.width - 5, box.height - 5), 26, outline=color + (255,), width=10)
    box.alpha_composite(im, (20, 10))
    sc = 1 + 1.4 * (1 - eo(p))
    place(c, box, cx, cy, sc, rot, min(1, p * 2))

def burst(c, cx, cy, g, start, r=200, n=10, col=ORANGE):
    p = prog(g, start, 9)
    if p <= 0 or p >= 1: return
    d = ImageDraw.Draw(c)
    for i in range(n):
        a = i / n * 2 * math.pi + 0.2
        r0, r1 = r * (0.6 + 0.5 * eo(p)), r * (0.85 + 0.9 * eo(p))
        d.line((cx + math.cos(a) * r0, cy + math.sin(a) * r0, cx + math.cos(a) * r1, cy + math.sin(a) * r1), fill=col + (255,), width=int(12 * (1 - p)) + 2)

def keyword(c, f, g, txt, y=470, size=118, hl=True):
    p = prog(g, 0, 7)
    if p <= 0: return
    bx, by, br = boil(f)
    im = text_img(txt, size, INK, hl=HILITE if hl else None)
    fit = min(1.0, (W - 90) / im.width)
    place(c, im, W / 2 + bx, y + by + (1 - eo(p)) * 40, (0.3 + 0.7 * back(p, 2.6)) * fit, br, min(1, p * 2.5))

def polyline_partial(d, pts, p, color, width):
    if p <= 0: return None
    L = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    tot, goal, acc = sum(L), sum(L) * p, 0
    out = [pts[0]]
    for i, l in enumerate(L):
        if acc + l >= goal:
            q = (goal - acc) / l
            out.append((pts[i][0] + (pts[i + 1][0] - pts[i][0]) * q, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * q)); break
        out.append(pts[i + 1]); acc += l
    d.line(out, fill=color + (255,), width=width, joint="curve")
    return out[-1]

# ---------- scènes (g = image depuis le début de la scène, D = durée en images) ----------
EVENTS = []  # (type, temps en s, param) pour les bruitages
def ev(kind, t, v=0): EVENTS.append((kind, round(t, 3), v))

def sc_calendar(c, f, g, D, t0):
    keyword(c, f, g + 12, "3 séances sautées ?")
    days = "LMMJVSD"; w, gap = 132, 12; x0 = W / 2 - (7 * w + 6 * gap) / 2; y = 1050
    d = ImageDraw.Draw(c)
    for i, L in enumerate(days):
        p = back(prog(g + 10, i * 2, 8))
        if p <= 0: continue
        cx = x0 + i * (w + gap) + w / 2; s = w * p / 2
        d.rounded_rectangle((cx - s, y - s * 1.25, cx + s, y + s * 1.25), 24, fill=(255, 255, 255, 255), outline=INK + (255,), width=6)
        place(c, text_img(L, 60, INK), cx, y - 40 * p, p)
    for k, i in enumerate((1, 3, 4)):
        st = 10 + k * 7; cx = x0 + i * (w + gap) + w / 2
        p = prog(g, st, 6)
        if p > 0:
            im = Image.new("RGBA", (150, 150), (0, 0, 0, 0)); xd = ImageDraw.Draw(im)
            xd.line((20, 20, 130, 130), fill=RED + (255,), width=26); xd.line((130, 20, 20, 130), fill=RED + (255,), width=26)
            place(c, im, cx, y + 20, 1 + 1.3 * (1 - eo(p)), -6, min(1, p * 2))
        if g == st: ev("stamp", t0 + st / FPS, 0.55)
    return (4, -3) if any(10 + k * 7 <= g < 13 + k * 7 for k in range(3)) else (0, 0)

def sc_flemme(c, f, g, D, t0):
    p = prog(g, 0, 7); bx, by, br = boil(f)
    place(c, text_img("FLEMME", 175, GREY, path=MONT, wght=900), W / 2 + bx, 640 + by, 0.3 + 0.7 * back(p), br, min(1, p * 2))
    sp = eo(prog(g, 9, 8))
    if sp > 0:
        d = ImageDraw.Draw(c); x0, x1 = 120, 120 + (W - 240) * sp
        d.line((x0, 660, x1, 630), fill=ORANGE + (255,), width=26)
    if g == 9: ev("whoosh", t0 + 9 / FPS, 0.5)
    pe = prog(g, 4, 18)
    place(c, TIRED, W / 2, 1250 + (1 - elastic(pe)) * 800)
    for k in range(3):
        zp = ((g + k * 9) % 27) / 27
        place(c, text_img("z", 50 + k * 12, (90, 90, 90)), W / 2 + 320 + k * 34 + zp * 40, 1060 - k * 52 - zp * 90, 1, 0, 1 - zp)
    return (0, 0)

def sc_battery(c, f, g, D, t0):
    keyword(c, f, g, "ta batterie")
    d = ImageDraw.Draw(c); X0, Y0, X1, Y1 = 140, 760, 940, 1360
    pa = eo(prog(g, 2, 6))
    d.line((X0, Y0 - 20, X0, Y0 + (Y1 - Y0 + 20) * pa), fill=INK + (255,), width=8)
    d.line((X0, Y1, X0 + (X1 - X0) * pa, Y1), fill=INK + (255,), width=8)
    vals = [100, 92, 95, 74, 78, 55, 48, 30, 20]
    pts = [(X0 + 30 + i * (X1 - X0 - 60) / (len(vals) - 1), Y1 - (Y1 - Y0) * v / 105) for i, v in enumerate(vals)]
    p = eio(prog(g, 6, max(10, D - 22)))
    head = polyline_partial(d, pts, p, ORANGE if p < 0.7 else RED, 16)
    if head: d.ellipse((head[0] - 18, head[1] - 18, head[0] + 18, head[1] + 18), fill=(RED if p > 0.7 else ORANGE) + (255,))
    pe = prog(g, D - 16, 8)
    if pe > 0:
        place(c, text_img("20 %", 170, RED, path=MONT, wght=900, hl=(255, 255, 255)), 640, 880, 0.4 + 0.6 * back(pe, 3))
        burst(c, 640, 880, g, D - 16, 230)
    if g == D - 16: ev("boom", t0 + g / FPS, 0.4)
    if g == 6: ev("whoosh", t0 + g / FPS, 0.3)
    return (0, 0)

def sc_versus(c, f, g, D, t0):
    keyword(c, f, g, "même séance ?")
    d = ImageDraw.Draw(c)
    cols = [(280, GREY, "appli classique", [45, 45, 45]), (800, ORANGE, "NÉA", [45, 15, 30])]
    for ci, (cx, col, lab, mins) in enumerate(cols):
        pl = back(prog(g, 3 + ci * 4, 8))
        place(c, text_img(lab, 58 if ci == 0 else 96, col if ci else (110, 110, 110), path=HAND if ci == 0 else MONT, wght=900 if ci else None), cx, 760, pl)
        for k, (dname, m) in enumerate(zip(("lun", "mer", "ven"), mins)):
            p = eo(prog(g, 8 + ci * 4 + k * 3, 9)); y = 880 + k * 200
            hgt = 180; wmax = 400 * m / 45
            d.rounded_rectangle((cx - 200, y, cx - 200 + wmax * p, y + hgt * 0.6), 22, fill=col + (255,))
            if p > 0.6:
                place(c, text_img(f"{m} min", 62, (255, 255, 255) if m > 20 else INK, path=MONT, wght=800), cx - 200 + max(wmax * p, 200) / 2 + (0 if m > 20 else 120), y + hgt * 0.3, 1)
                place(c, text_img(dname, 44, (120, 120, 120)), cx - 245, y + hgt * 0.3, 1)
            if g == 8 + ci * 4 + k * 3: ev("pop", t0 + g / FPS, 0.25)
    vp = back(prog(g, 6, 8))
    place(c, text_img("VS", 90, INK, path=MONT, wght=900), W / 2 + 45, 760, vp, -6)
    return (0, 0)

def sc_chat(c, f, g, D, t0):
    pe = prog(g, 0, 14)
    place(c, ENERGY, W / 2, 1290 + (1 - back(pe, 1.6)) * 800, 0.86)
    d = ImageDraw.Draw(c)
    q = "Énergie du jour ?"; n = int(len(q) * clamp((g - 6) / 14))
    if g >= 4:
        place(c, HEAD, 150, 430, 0.28 * back(prog(g, 4, 8)))
        bub = text_img(q[:n] + ("|" if (g // 4) % 2 and n < len(q) else ""), 74, (255, 255, 255), path=MONT, wght=800)
        bw = max(bub.width + 50, 120)
        d.rounded_rectangle((250, 370, 250 + bw, 370 + bub.height + 30), 50, fill=ORANGE + (255,))
        c.alpha_composite(bub, (275, 385))
        if 6 <= g < 6 + 14 and g % 2 == 0: ev("tick", t0 + g / FPS, 0.18)
    pa = back(prog(g, 24, 8))
    if pa > 0:
        rep = text_img("2 / 5", 84, INK, path=MONT, wght=900)
        bx = W - 120 - rep.width - 40
        box = Image.new("RGBA", (rep.width + 50, rep.height + 30), (0, 0, 0, 0))
        ImageDraw.Draw(box).rounded_rectangle((0, 0, box.width - 1, box.height - 1), 50, fill=(255, 255, 255, 255), outline=INK + (255,), width=5)
        box.alpha_composite(rep, (25, 15)); place(c, box, bx + box.width / 2, 560, pa)
    if g == 24: ev("pop", t0 + g / FPS, 0.3)
    return (0, 0)

def sc_adapt(c, f, g, D, t0):
    pe = prog(g, 0, 16)
    place(c, SEANCE, W / 2 + (1 - elastic(pe)) * 1100, 1260, 0.86)
    p1 = back(prog(g, 2, 8))
    place(c, text_img("45 min", 105, GREY, path=MONT, wght=900), 270, 520, p1)
    sp = eo(prog(g, 10, 6))
    if sp > 0: ImageDraw.Draw(c).line((90, 545, 90 + 360 * sp, 495), fill=RED + (255,), width=18)
    if g == 10: ev("whoosh", t0 + g / FPS, 0.35)
    p2 = prog(g, 15, 8)
    if p2 > 0:
        pill = text_img("15 min", 120, (255, 255, 255), path=MONT, wght=900, hl=ORANGE)
        place(c, pill, 790, 520, 0.4 + 0.6 * back(p2, 3), -4)
        burst(c, 790, 520, g, 15, 260)
    if g == 15: ev("ding", t0 + g / FPS, 0.35)
    return (0, 0)

def sc_rising(c, f, g, D, t0):
    keyword(c, f, g, "résultat")
    d = ImageDraw.Draw(c); X0, Y0, X1, Y1 = 140, 720, 940, 1380
    d.line((X0, Y1, X1, Y1), fill=INK + (255,), width=8)
    vals = [10, 14, 22, 28, 40, 52, 68, 85, 100]
    pts = [(X0 + 30 + i * (X1 - X0 - 60) / (len(vals) - 1), Y1 - (Y1 - Y0) * v / 105) for i, v in enumerate(vals)]
    p = eio(prog(g, 4, max(10, D - 20)))
    if p > 0:
        k = max(2, int(len(pts) * p) + 1)
        area = [(pts[0][0], Y1)] + pts[:k] + [(pts[min(k, len(pts)) - 1][0], Y1)]
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(lay).polygon(area, fill=ORANGE + (45,)); c.alpha_composite(lay)
    head = polyline_partial(d, pts, p, ORANGE, 16)
    if head: d.ellipse((head[0] - 18, head[1] - 18, head[0] + 18, head[1] + 18), fill=ORANGE + (255,))
    st = D - 14
    stamp(c, "SÉANCE FAITE", W / 2, 1080, prog(g, st, 6), ORANGE, -8, 78)
    burst(c, W / 2, 1080, g, st + 4, 420, 12)
    if g == st: ev("stamp", t0 + g / FPS, 0.5)
    if g == 4: ev("whoosh", t0 + g / FPS, 0.3)
    return (5, -4) if st <= g < st + 4 else (0, 0)

def sc_end(c, f, g, D, t0):
    c.paste(Image.new("RGBA", (W, H), ORANGE + (255,)))
    d = ImageDraw.Draw(c)
    for i in range(14):
        a = i / 14 * 2 * math.pi + g * 0.012
        d.polygon([(W / 2, 760), (W / 2 + math.cos(a) * 1500, 760 + math.sin(a) * 1500), (W / 2 + math.cos(a + 0.11) * 1500, 760 + math.sin(a + 0.11) * 1500)], fill=(255, 122, 48, 255))
    place(c, HEAD, W / 2, 740 - 10 * math.sin(g * 0.15), 0.8 * back(prog(g, 2, 12), 2.4), 4 * math.sin(g * 0.12))
    for k, L in enumerate("NÉA"):
        p = prog(g, 8 + k * 3, 8)
        if p > 0: place(c, text_img(L, 230, (255, 255, 255), path=MONT, wght=900), W / 2 + (k - 1) * 215, 1170 - (1 - back(p, 2.4)) * 300, 1, 0, min(1, p * 3))
        if g == 8 + k * 3: ev("pop", t0 + g / FPS, 0.3)
    pp = prog(g, 26, 8)
    if pp > 0:
        place(c, text_img("Ton coach. Ton rythme.", 84, (255, 255, 255)), W / 2, 1360, back(pp))
    if g == 0: ev("boom", t0, 0.45)
    if g < 5: c.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(255 * (1 - g / 5)))))
    return (0, 0)

DRAW = {k: globals()["sc_" + k] for k in ("calendar", "flemme", "battery", "versus", "chat", "adapt", "rising", "end")}

# ---------- voix (edge-tts) avec temps de chaque mot ----------
async def tts(text, out, rate="+12%"):
    import certifi
    if os.path.exists("/root/.ccr/ca-bundle.crt"): certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
    import edge_tts
    comm = edge_tts.Communicate(text, VOICE, rate=rate, boundary="WordBoundary")
    words = []
    with open(out, "wb") as fh:
        async for ch in comm.stream():
            if ch["type"] == "audio": fh.write(ch["data"])
            elif ch["type"] == "WordBoundary": words.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
    return words

def build_timeline():
    tl, t = [], 0.0
    for i, (kind, txt) in enumerate(SCENES):
        mp3 = os.path.join(WORK, f"v{i}.mp3")
        words = asyncio.run(tts(txt, mp3))
        speech_end = words[-1][1] if words else 1.0
        dur = max(1.7, speech_end + (0.9 if kind == "end" else 0.32))
        if kind == "end": dur = max(dur, 3.2)
        tl.append(dict(kind=kind, start=t, dur=dur, mp3=mp3, words=[(t + a, t + b, w) for a, b, w in words]))
        t += dur
    return tl, t

# ---------- sous-titres un mot à la fois (pastille orange qui pop) ----------
def caption(c, t, words, on_orange):
    cur = None
    for i, (a, b, w) in enumerate(words):
        nxt = words[i + 1][0] if i + 1 < len(words) else b + 0.3
        if a <= t < max(b, nxt): cur = (a, w)
    if not cur: return
    a, w = cur
    w = CAPFIX.get(w.lower(), w)
    if not w: return
    p = clamp((t - a) * FPS / 3)
    pill = text_img(w.upper(), 96, (255, 255, 255), path=MONT, wght=900, hl=INK if on_orange else ORANGE)
    if pill.width > W - 80: pill = pill.resize((W - 80, int(pill.height * (W - 80) / pill.width)))
    place(c, pill, W / 2, 1560, 1.18 - 0.18 * eo(p))

def wipe(c, p):
    if p <= 0 or p >= 1: return
    x = -W * 1.6 + 3.2 * W * eio(p); d = ImageDraw.Draw(c)
    d.polygon([(x, 0), (x + W * 1.1, 0), (x + W * 0.7, H), (x - W * 0.4, H)], fill=ORANGE + (255,))
    d.polygon([(x + W * 1.1, 0), (x + W * 1.25, 0), (x + W * 0.85, H), (x + W * 0.7, H)], fill=INK + (255,))

# ---------- audio : musique + bruitages ----------
def env(n, a, d):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def lp(x, k): return np.convolve(x, np.ones(k) / k, "same")
def music(dur, end_at):
    rng = np.random.default_rng(11); N = int(SR * dur); buf = np.zeros(N); B = 60 / 128
    def add(sig, at):
        i = int(at * SR)
        if 0 <= i < N: j = min(N, i + len(sig)); buf[i:j] += sig[: j - i]
    def saw(fr, n): t = np.arange(n) / SR; return sum(2 * ((t * fr * (1 + d)) % 1) - 1 for d in (-0.006, 0, 0.006)) / 3
    note = lambda m: 440 * 2 ** ((m - 69) / 12)
    prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
    for b in range(int(dur / (4 * B)) + 1):
        t0 = b * 4 * B; ch = prog[b % 4]
        for s in (0, 3, 6, 8, 11, 14):
            n = int(B * 0.22 * SR); add(lp(sum(saw(note(m + 12), n) for m in ch) / 3, 5) * env(n, 0.002, 0.07) * 0.2, t0 + s * B / 4)
        for s in range(1, 8, 2):
            n = int(B * 0.45 * SR); add(lp(saw(note(ch[0] - 12), n), 18) * env(n, 0.003, 0.16) * 0.55, t0 + s * B / 2)
    pump = np.ones(N)
    for k in range(int(dur / B) + 1):
        t = k * B; n = int(0.33 * SR); tt = np.arange(n) / SR
        add(np.sin(2 * np.pi * np.cumsum(48 + 120 * np.exp(-tt * 38)) / SR) * np.exp(-tt * 8) * 1.0, t)
        i = int(t * SR); m = min(N, i + int(0.18 * SR)); pump[i:m] = np.linspace(0.45, 1, m - i)
        if k % 2: n = int(0.2 * SR); add(lp(rng.standard_normal(n), 6) * env(n, 0.001, 0.06) * 0.4, t)
        for off, v in ((B / 2, 1.0), (B / 4, 0.45), (3 * B / 4, 0.45)):
            n = int(0.05 * SR); x = rng.standard_normal(n); add((x - lp(x, 4)) * env(n, 0.001, 0.015) * 0.22 * v, t + off)
    buf *= pump
    n = int(1.0 * SR); add(rng.standard_normal(n) * np.linspace(0, 1, n) ** 2 * 0.25, end_at - 1.0)
    n = int(1.6 * SR); x = rng.standard_normal(n); add((x - lp(x, 3)) * env(n, 0.001, 0.5) * 0.35, end_at)
    fs = int((dur - 0.8) * SR); buf[fs:] *= np.linspace(1, 0, N - fs)
    return buf
def sfx(dur):
    rng = np.random.default_rng(5); N = int(SR * dur); buf = np.zeros(N)
    def add(sig, at, v):
        i = int(at * SR)
        if 0 <= i < N: j = min(N, i + len(sig)); buf[i:j] += sig[: j - i] * v
    for kind, t, v in EVENTS:
        tt = None
        if kind == "pop":
            n = int(0.09 * SR); tt = np.arange(n) / SR; add(np.sin(2 * np.pi * (800 + 900 * np.exp(-tt * 60)) * tt) * env(n, 0.001, 0.03), t, v * 1.4)
        elif kind == "tick":
            n = int(0.03 * SR); x = rng.standard_normal(n); add((x - lp(x, 3)) * env(n, 0.0005, 0.006), t, v * 1.6)
        elif kind == "whoosh":
            n = int(0.35 * SR); x = rng.standard_normal(n); add((x - lp(x, 5)) * np.sin(np.pi * np.linspace(0, 1, n)), t - 0.1, v)
        elif kind == "ding":
            n = int(0.8 * SR); tt = np.arange(n) / SR; add((np.sin(2 * np.pi * 1318 * tt) + 0.5 * np.sin(2 * np.pi * 1976 * tt)) * env(n, 0.002, 0.25), t, v)
        elif kind in ("stamp", "boom"):
            n = int(0.5 * SR); tt = np.arange(n) / SR
            thump = np.sin(2 * np.pi * np.cumsum(40 + 90 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 9)
            crack = lp(rng.standard_normal(n), 2) * env(n, 0.0005, 0.03 if kind == "stamp" else 0.12)
            add(thump + 0.5 * crack, t, v * 1.5)
    return buf
def save_wav(p, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(p, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.stack([x, x], 1) * 32767).astype(np.int16).tobytes())

# ---------- rendu ----------
def main():
    tl, total = build_timeline()
    nf = int(round(total * FPS)); starts = [int(round(s["start"] * FPS)) for s in tl]
    allwords = [w for s in tl for w in s["words"]]
    silent = os.path.join(WORK, "silent.mp4")
    proc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                             "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", silent], stdin=subprocess.PIPE)
    for f in range(nf):
        si = max(i for i, s in enumerate(starts) if s <= f)
        sc = tl[si]; g = f - starts[si]
        D = (starts[si + 1] if si + 1 < len(tl) else nf) - starts[si]
        c = PAPER.copy()
        if sc["kind"] != "end": decor(c, f)
        shake = DRAW[sc["kind"]](c, f, g, D, sc["start"])
        if sc["kind"] != "end":
            pb = ImageDraw.Draw(c)
            place(c, text_img("N É A", 50, INK, path=MONT, wght=800), W / 2, 1760)
            if si > 0 and g < 7: wipe(c, 0.5 + g / 14)
            if si + 1 < len(tl) and g >= D - 7: wipe(c, (g - (D - 7)) / 14)
            if si + 1 < len(tl) and g == D - 7: ev("whoosh", (f) / FPS, 0.35)
        caption(c, f / FPS + 0.04, allwords, sc["kind"] == "end")
        # punch-in au début de chaque scène
        z = 1 + 0.05 * (1 - eo(clamp(g / 6)))
        out = c.convert("RGB")
        if z > 1.001:
            big = out.resize((int(W * z), int(H * z)), Image.BILINEAR)
            out = big.crop(((big.width - W) // 2, (big.height - H) // 2, (big.width - W) // 2 + W, (big.height - H) // 2 + H))
        if shake != (0, 0): out = ImageChops.offset(out, random.randint(-12, 12), random.randint(-9, 9))
        proc.stdin.write(out.tobytes())
    proc.stdin.close(); proc.wait()
    # bruitages des mots-clés de la scène d'accroche + musique
    save_wav(os.path.join(WORK, "music.wav"), music(total, tl[-1]["start"]))
    save_wav(os.path.join(WORK, "sfx.wav"), sfx(total))
    ins, dl = [], []
    for i, s in enumerate(tl):
        ins += ["-i", s["mp3"]]; ms = int(s["start"] * 1000); dl.append(f"[{i}]adelay={ms}|{ms}[a{i}]")
    n = len(tl)
    fc = ";".join(dl) + ";" + "".join(f"[a{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0,aresample={SR},aformat=channel_layouts=stereo," \
        "highpass=f=90,acompressor=threshold=-20dB:ratio=4:attack=5:release=80,aecho=0.9:0.5:18:0.12,volume=2.2,asplit=2[vo][sc];" \
        f"[{n}]volume=0.22[mu];[mu][sc]sidechaincompress=threshold=0.03:ratio=8:attack=10:release=250[mud];[{n+1}]volume=0.3[fx];" \
        f"[vo][mud][fx]amix=inputs=3:normalize=0,alimiter=limit=0.95,apad=whole_dur={total:.3f},loudnorm=I=-14:TP=-1.5:LRA=9[out]"
    mix = os.path.join(WORK, "mix.wav")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *ins, "-i", os.path.join(WORK, "music.wav"), "-i", os.path.join(WORK, "sfx.wav"),
                    "-filter_complex", fc, "-map", "[out]", "-ar", str(SR), "-t", f"{total:.3f}", mix], check=True)
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", silent, "-i", mix, "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", OUT], check=True)
    print(f"ok {OUT} ({total:.1f} s, {len(EVENTS)} bruitages)")

if __name__ == "__main__":
    main()
