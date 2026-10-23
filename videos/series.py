#!/usr/bin/env python3
"""Série de Reels NÉA (DA robot dessiné) : voix off, musique et bruitages synchronisés.

Usage : python3 series.py <id> [<id> ...]   (ids définis dans REELS ; « all » pour tout)
Sortie : /home/user/celestev1/videos/serie/<id>.mp4
"""
import math, random, subprocess, sys, os, wave, json
import numpy as np
from PIL import Image, ImageDraw
sys.argv = sys.argv[:1] + ["/dev/null"] + sys.argv[1:]  # make_reel lit argv[1]
import make_reel as M

HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = "/home/user/celestev1/videos/serie"
VOICE = "fr-FR-HenriNeural"
W, H, FPS, SR = M.W, M.H, M.FPS, 44100
ORANGE, INK, HILITE = M.ORANGE, M.INK, M.HILITE
IMGS = {"tired": M.TIRED, "energy": M.ENERGY, "seance": M.SEANCE}

# ---------- les 7 Reels ----------
# Une scène : lignes de texte (une ligne qui commence par « ! » est surlignée), voix, accessoire, image.
REELS = {
 "01-batterie-semaine": {
  "caption": "ta batterie change tous les jours, ta séance aussi 🔋 NÉA adapte ta séance à ton énergie du jour. lien en bio 🧡",
  "tags": "#motivation #fitness #sport #fatigue #coachsportif",
  "bpm": 122, "key": 0,
  "scenes": [
   {"lines": ["Lundi :", "!batterie à 100 %"], "voice": "Lundi : batterie à cent pour cent.", "prop": "battery:1.0:1.0"},
   {"lines": ["Mercredi :", "!40 %"], "voice": "Mercredi : quarante.", "prop": "battery:1.0:0.4"},
   {"lines": ["Vendredi :", "!3 %"], "voice": "Vendredi : trois pour cent.", "img": "tired"},
   {"lines": ["NÉA adapte ta séance", "!à ta batterie."], "voice": "Néa adapte ta séance à ta batterie du jour.", "img": "energy"},
  ]},
 "02-mal-dormi": {
  "caption": "mal dormi ? ta séance n'a pas à être la même 😴 dis à NÉA comment tu te sens, elle s'adapte. lien en bio 🧡",
  "tags": "#sommeil #fatigue #sport #motivation #fitness",
  "bpm": 118, "key": 2,
  "scenes": [
   {"lines": ["5 h de sommeil", "!cette nuit ?"], "voice": "Cinq heures de sommeil cette nuit ?", "prop": "clock"},
   {"lines": ["Ta séance", "!peut être plus douce."], "voice": "Ta séance peut être plus douce.", "img": "tired"},
   {"lines": ["Tu dis à NÉA", "!comment", "!tu te sens."], "voice": "Tu dis à Néa comment tu te sens.", "img": "energy"},
   {"lines": ["Et ta séance", "!s'adapte."], "voice": "Et ta séance s'adapte.", "img": "seance", "prop": "check"},
  ]},
 "03-seance-ratee": {
  "caption": "une séance ratée ne gâche pas ta semaine 🧡 on reprend demain, à ton rythme. NÉA, lien en bio",
  "tags": "#culpabilite #motivation #sport #fitness #bienveillance",
  "bpm": 120, "key": 5,
  "scenes": [
   {"lines": ["T'as raté ta", "!séance hier ?"], "voice": "T'as raté ta séance hier ?", "img": "tired"},
   {"lines": ["!Pas grave."], "voice": "Pas grave.", "prop": "bigtext:0 culpabilité"},
   {"lines": ["Une séance ratée", "!ne gâche pas", "!ta semaine."], "voice": "Une séance ratée ne gâche pas ta semaine.", "prop": "meter:3"},
   {"lines": ["NÉA te prépare", "!la suivante."], "voice": "Néa te prépare la suivante. À ton rythme.", "img": "seance"},
  ]},
 "04-comparaison": {
  "caption": "ton début n'est pas leur chapitre 20 📖 avance à ton rythme. NÉA, lien en bio 🧡",
  "tags": "#comparaison #motivation #debutant #sport #fitness",
  "bpm": 116, "key": 7,
  "scenes": [
   {"lines": ["!Arrête de", "!te comparer."], "voice": "Arrête de te comparer.", "prop": "bigtext:chapitre 1"},
   {"lines": ["Ton début n'est pas", "!leur chapitre 20."], "voice": "Ton début n'est pas leur chapitre vingt.", "img": "tired"},
   {"lines": ["Ton énergie", "!n'est pas la leur."], "voice": "Ton énergie n'est pas la leur.", "img": "energy"},
   {"lines": ["Ta séance non plus."], "voice": "Ta séance non plus.", "img": "seance", "prop": "check"},
  ]},
 "05-15-minutes": {
  "caption": "15 minutes, ça compte ⏱️ une petite séance vaut mieux que zéro. NÉA, lien en bio 🧡",
  "tags": "#pasletemps #seancecourte #motivation #sport #fitness",
  "bpm": 126, "key": 3,
  "scenes": [
   {"lines": ["!Pas le temps ?"], "voice": "Pas le temps ?", "prop": "clock"},
   {"lines": ["15 minutes,", "!ça compte."], "voice": "Quinze minutes, ça compte.", "prop": "bigtext:15 min"},
   {"lines": ["Une petite séance", "!vaut mieux", "!que zéro."], "voice": "Une petite séance vaut mieux que zéro.", "prop": "meter:1"},
   {"lines": ["Lance-la.", "!C'est tout."], "voice": "Lance-la. C'est tout.", "img": "seance", "prop": "check"},
  ]},
 "06-zero-motivation": {
  "caption": "la motivation vient après avoir commencé 👟 enfile tes baskets, NÉA s'occupe du reste. lien en bio 🧡",
  "tags": "#motivation #flemme #sport #fitness #discipline",
  "bpm": 124, "key": 9,
  "scenes": [
   {"lines": ["Zéro motivation", "!aujourd'hui ?"], "voice": "Zéro motivation aujourd'hui ?", "img": "tired"},
   {"lines": ["La motivation", "!vient APRÈS."], "voice": "La motivation, elle vient après.", "prop": "battery:0.05:0.9"},
   {"lines": ["Enfile juste", "!tes baskets."], "voice": "Enfile juste tes baskets.", "prop": "bigtext:étape 1"},
   {"lines": ["NÉA s'occupe", "!du reste."], "voice": "Néa s'occupe du reste.", "img": "seance", "prop": "check"},
  ]},
 "07-coach-qui-ecoute": {
  "caption": "le coach qui te demande d'abord comment tu vas 🤖🧡 NÉA, lien en bio",
  "tags": "#coachsportif #bienveillance #sport #fitness #motivation",
  "bpm": 128, "key": 4,
  "scenes": [
   {"lines": ["Les coachs", "!qui crient…"], "voice": "Les coachs qui crient…", "prop": "bigtext:ENCORE 10 !", "shake": True},
   {"lines": ["Moi, je te demande", "!d'abord", "!comment tu vas."], "voice": "Moi, je te demande d'abord comment tu vas.", "img": "energy"},
   {"lines": ["Pas d'énergie ?", "!On adapte."], "voice": "Pas d'énergie ? On adapte.", "img": "tired"},
   {"lines": ["NÉA,", "!le coach", "!qui t'écoute."], "voice": "Néa, le coach qui t'écoute.", "img": "seance", "prop": "check"},
  ]},
}
END_VOICE = "Néa, ton coach. Lien en bio !"

# ---------- voix ----------
def tts(text, out, rate="+8%"):
    if not os.path.exists(out) or os.path.getsize(out) == 0:
        subprocess.run([sys.executable, os.path.join(HERE, "tts.py"), VOICE, rate, "+0Hz", text, out], check=True, timeout=90)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", out, "-af", "silencedetect=n=-40dB:d=0.12", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    starts = [float(l.split("silence_start: ")[1]) for l in r.splitlines() if "silence_start" in l]
    ends = [float(l.split("silence_end: ")[1].split()[0]) for l in r.splitlines() if "silence_end" in l]
    lead = ends[0] if starts and starts[0] < 0.01 else 0.0
    tail = starts[-1] if starts and starts[-1] > lead else float(r.split("Duration: ")[1].split(",")[0].split(":")[-1])
    return lead, tail

# ---------- accessoires ----------
def draw_prop(c, kind, g, f, dur):
    if not kind: return
    name, *args = kind.split(":")
    cy = 1150 if not args or name != "check" else 1080
    if name == "battery":
        a, b = float(args[0]), float(args[1])
        lvl = a + (b - a) * M.ease_io(M.prog(g, 6, max(8, dur - 20)))
        pb = M.back(M.prog(g, 2, 10))
        if pb > 0:
            layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            M.battery(layer, W / 2, cy, lvl, f, 2.0 * pb)
            c.alpha_composite(layer)
    elif name == "meter":
        M.energy_meter(c, W / 2, cy, int(args[0]), g, 4)
        lab = M.word_img("ton énergie", 60, (120, 120, 120))
        M.place(c, lab, W / 2, cy + 110, M.back(M.prog(g, 10, 10)))
    elif name == "clock":
        p = M.back(M.prog(g, 2, 10))
        if p <= 0: return
        d = ImageDraw.Draw(c)
        r = 230 * p; bx, by, _ = M.boil(f)
        x, y = W / 2 + bx, cy + by
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, 255), outline=INK + (255,), width=14)
        for k in range(12):
            a = k / 12 * 2 * math.pi
            d.line((x + math.cos(a) * r * 0.82, y + math.sin(a) * r * 0.82, x + math.cos(a) * r * 0.92, y + math.sin(a) * r * 0.92), fill=INK + (255,), width=8)
        am = g * 0.35; ah = g * 0.03
        d.line((x, y, x + math.sin(am) * r * 0.75, y - math.cos(am) * r * 0.75), fill=ORANGE + (255,), width=14)
        d.line((x, y, x + math.sin(ah) * r * 0.5, y - math.cos(ah) * r * 0.5), fill=INK + (255,), width=16)
        d.ellipse((x - 18, y - 18, x + 18, y + 18), fill=INK + (255,))
    elif name == "bigtext":
        p = M.prog(g, 6, 10)
        if p <= 0: return
        txt = args[0]
        im = M.word_img(txt, 150, (255, 255, 255), path=M.BOLD)
        pill = Image.new("RGBA", (im.width + 60, im.height + 10), (0, 0, 0, 0))
        ImageDraw.Draw(pill).rounded_rectangle((0, 0, pill.width - 1, pill.height - 1), 70, fill=ORANGE + (255,))
        pill.alpha_composite(im, (30, 5))
        bx, by, br = M.boil(f)
        M.place(c, pill, W / 2 + bx, cy + by, M.back(p, 2.8) * min(1, (W - 80) / pill.width), -4 + br)
        M.sparks(c, W / 2, cy, g, 8, 380, 8)
    elif name == "check":
        cp = M.ease_out(M.prog(g, 26, 10))
        if cp <= 0: return
        d = ImageDraw.Draw(c)
        cx, cy2 = 930, 560
        pts = [(cx - 40, cy2), (cx - 10, cy2 + 32), (cx + 50, cy2 - 40)]
        if cp < 0.5:
            q = cp / 0.5
            d.line((pts[0], (pts[0][0] + (pts[1][0] - pts[0][0]) * q, pts[0][1] + (pts[1][1] - pts[0][1]) * q)), fill=ORANGE + (255,), width=16)
        else:
            q = (cp - 0.5) / 0.5
            d.line((pts[0], pts[1], (pts[1][0] + (pts[2][0] - pts[1][0]) * q, pts[1][1] + (pts[2][1] - pts[1][1]) * q)), fill=ORANGE + (255,), width=16, joint="curve")
        M.sparks(c, cx, cy2, g, 36, 90, 6)

def draw_lines(c, g, lines, has_img=True):
    sizes = []
    for l in lines:
        w = M.font(150).getlength(l.lstrip("!"))
        cap = (150 if l.startswith("!") else 120) if len(lines) < 3 or not has_img else (128 if l.startswith("!") else 105)
        sizes.append(min(cap, int(150 * (W - 140) / max(w, 1))))
    y = {1: 420, 2: 330, 3: 290}[len(lines)] if has_img else {1: 520, 2: 430, 3: 380}[len(lines)]
    start = 0
    for i, line in enumerate(lines):
        size = sizes[i]
        y += size * 0.62 if i else 0
        hl = line.startswith("!")
        words = line.lstrip("!").split()
        M.line_words(c, g, words, y, size, start, 4,
                     hl_words=tuple(words) if hl else (), hl_start=start + 8 if hl else None)
        y += size * 0.62
        start += 4 * len(words) + 2
    return start

def draw_img(c, name, g, entrance, dur):
    img = IMGS[name]
    p = M.prog(g, 2, 18)
    if entrance == "up":
        M.place(c, img, W / 2, 1180 + (1 - M.elastic(p)) * 900)
    elif entrance == "right":
        M.place(c, img, W / 2 + (1 - M.elastic(p)) * 1100, 1180)
    else:
        zoom = 1 + 0.12 * M.ease_io(M.prog(g, dur - 30, 30))
        M.place(c, img, W / 2, 1180 + (1 - M.back(p, 1.8)) * 700, zoom, (1 - p) * 8)
    if name == "tired":
        for k in range(3):
            zp = ((g + k * 10) % 30) / 30
            zi = M.word_img("z", 46 + k * 10, (90, 90, 90))
            M.place(c, zi, W / 2 + 330 + k * 30 + zp * 40, 980 - k * 50 - zp * 90, 1, 0, 1 - zp)

# ---------- carte de fin ----------
def end_card(g):
    c = Image.new("RGBA", (W, H), ORANGE + (255,))
    d = ImageDraw.Draw(c)
    for i in range(14):
        a = i / 14 * 2 * math.pi + g * 0.01
        d.polygon([(W / 2, 760), (W / 2 + math.cos(a) * 1500, 760 + math.sin(a) * 1500),
                   (W / 2 + math.cos(a + 0.11) * 1500, 760 + math.sin(a + 0.11) * 1500)], fill=(255, 122, 48, 255))
    M.place(c, M.HEAD, W / 2, 760 - 10 * math.sin(g * 0.15), M.back(M.prog(g, 2, 14), 2.4), 4 * math.sin(g * 0.12))
    for k, L in enumerate("NÉA"):
        p = M.prog(g, 12 + k * 4, 10)
        if p <= 0: continue
        im = M.word_img(L, 230, (255, 255, 255), path=M.BOLD)
        M.place(c, im, W / 2 + (k - 1) * 205, 1180 - (1 - M.back(p, 2.4)) * 300, 1, 0, min(1, p * 3))
    M.line_words(c, g, ["Ton", "coach.", "Ton", "rythme."], 1370, 82, 30, 3, color=(255, 255, 255))
    pp = M.prog(g, 48, 10)
    if pp > 0:
        pulse = 1 + 0.06 * math.sin(g * 0.3)
        pill = Image.new("RGBA", (520, 120), (0, 0, 0, 0))
        ImageDraw.Draw(pill).rounded_rectangle((0, 0, 519, 119), 60, fill=INK + (255,))
        t = M.word_img("Lien en bio ↓", 62, (255, 255, 255))
        pill.alpha_composite(t, (int(260 - t.width / 2), int(60 - t.height / 2)))
        M.place(c, pill, W / 2, 1530, M.back(pp, 2) * pulse)
    if g < 6:
        c.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(255 * (1 - g / 6)))))
    return c

# ---------- musique ----------
def music(dur, bpm, key, end_at, seed):
    rng = np.random.default_rng(seed)
    N = int(SR * dur); B = 60 / bpm
    buf = np.zeros(N)
    def add(sig, at):
        i = int(at * SR)
        if i >= N or i < 0: return
        j = min(N, i + len(sig)); buf[i:j] += sig[: j - i]
    def env(n, a, d):
        t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
    def lp(x, k): return np.convolve(x, np.ones(k) / k, "same")
    def saw(fr, n, det=0.0):
        t = np.arange(n) / SR
        return sum(2 * ((t * fr * (1 + d)) % 1) - 1 for d in (-det, 0, det)) / 3
    def note(m): return 440 * 2 ** ((m + key - 69) / 12)
    progs = [[[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
             [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59]],
             [[53, 57, 60], [55, 59, 62], [57, 60, 64], [57, 60, 64]]]
    prog = progs[seed % 3]
    bass = [p[0] - 12 for p in prog]
    bar = 4 * B
    pattern = [(1, 3, 4, 6), (0, 3, 6), (1, 2, 4, 6, 7)][seed % 3]
    for b in range(int(dur / bar) + 1):
        ch = prog[b % 4]; t0 = b * bar
        for s in pattern:
            n = int(B * 0.45 * SR)
            add(lp(sum(saw(note(m + 12), n, 0.006) for m in ch) / 3, 6) * env(n, 0.003, 0.12) * 0.22, t0 + s * B / 2)
        for s in range(1, 8, 2):
            n = int(B * 0.45 * SR)
            add(lp(saw(note(bass[b % 4]), n), 18) * env(n, 0.003, 0.18) * 0.5, t0 + s * B / 2)
    for k in range(int(dur / B) + 1):
        t = k * B; n = int(0.35 * SR); tt = np.arange(n) / SR
        add(np.sin(2 * np.pi * np.cumsum(50 + 110 * np.exp(-tt * 35)) / SR) * np.exp(-tt * 7) * 0.9, t)
        if k % 2:
            n = int(0.2 * SR); add(lp(rng.standard_normal(n), 6) * env(n, 0.001, 0.06) * 0.35, t)
        for off, v in ((B / 2, 1), (B / 4, 0.5), (3 * B / 4, 0.5)):
            n = int(0.05 * SR); x = rng.standard_normal(n); add((x - lp(x, 4)) * env(n, 0.001, 0.015) * 0.22 * v, t + off)
    n = int(1.1 * SR); x = rng.standard_normal(n); add(x * np.linspace(0, 1, n) ** 2 * 0.25, end_at - 1.1)
    n = int(1.6 * SR); x = rng.standard_normal(n); add((x - lp(x, 3)) * env(n, 0.001, 0.5) * 0.35, end_at)
    fs = int((dur - 1.0) * SR); buf[fs:] *= np.linspace(1, 0, N - fs)
    return buf

def sfx(dur, events, seed):
    rng = np.random.default_rng(seed + 100)
    N = int(SR * dur); buf = np.zeros(N)
    def add(sig, at):
        i = int(at * SR)
        if i >= N or i < 0: return
        j = min(N, i + len(sig)); buf[i:j] += sig[: j - i]
    def env(n, a, d):
        t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
    for kind, t, v in events:
        if kind == "pop":
            n = int(0.09 * SR); tt = np.arange(n) / SR
            add(np.sin(2 * np.pi * (v + 900 * np.exp(-tt * 60)) * tt) * env(n, 0.001, 0.03) * 0.35, t)
        elif kind == "whoosh":
            n = int(0.35 * SR); x = rng.standard_normal(n); tt = np.linspace(0, 1, n)
            x = x - np.convolve(x, np.ones(5) / 5, "same")
            add(x * np.sin(np.pi * tt) * 0.45, t)
        elif kind == "ding":
            n = int(0.8 * SR); tt = np.arange(n) / SR
            add((np.sin(2 * np.pi * 1318 * tt) + 0.5 * np.sin(2 * np.pi * 1976 * tt)) * env(n, 0.002, 0.25) * 0.28, t)
        elif kind == "beep":
            n = int(0.1 * SR); tt = np.arange(n) / SR
            add(np.sign(np.sin(2 * np.pi * v * tt)) * env(n, 0.001, 0.05) * 0.08, t)
    return buf

def save_wav(path, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    st = np.stack([x, x], 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())

# ---------- assemblage d'un Reel ----------
def build(rid):
    spec = REELS[rid]
    work = os.path.join(HERE, "work", rid); os.makedirs(work, exist_ok=True)
    os.makedirs(OUTDIR, exist_ok=True)
    # 1. voix et durées des scènes
    timeline, t = [], 0.0
    for i, sc in enumerate(spec["scenes"]):
        vo = os.path.join(work, f"v{i}.mp3")
        lead, tail = tts(sc["voice"], vo)
        dur = max(2.2, (tail - lead) + 1.0)
        timeline.append((t, dur, vo, lead)); t += dur
    vo = os.path.join(work, "vend.mp3")
    lead, tail = tts(END_VOICE, vo, "+15%")
    end_start, end_dur = t, max(3.2, (tail - lead) + 0.9)
    timeline.append((t, end_dur, vo, lead))
    total = t + end_dur
    nframes = int(round(total * FPS))
    starts = [int(round(a * FPS)) for a, *_ in timeline]
    entrances = ["up", "right", "pop"]
    events = []
    # 2. images
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", os.path.join(work, "silent.mp4")]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(nframes):
        si = max(i for i, s in enumerate(starts) if s <= f)
        g = f - starts[si]
        if si == len(spec["scenes"]):
            c = end_card(g)
        else:
            sc = spec["scenes"][si]
            dur = (starts[si + 1] - starts[si])
            c = M.PAPER.copy().convert("RGBA")
            if sc.get("img"):
                draw_img(c, sc["img"], g, entrances[si % 3], dur)
            if sc.get("prop"):
                draw_prop(c, sc["prop"], g, f, dur)
            draw_lines(c, g + (14 if si == 0 else 0), sc["lines"], bool(sc.get("img")))
            if g < 8 and si > 0:
                M.orange_wipe(c, 0.5 + g / 16)
            if g >= dur - 10:
                wp = M.prog(g, dur - 10, 10)
                if si < len(spec["scenes"]) - 1:
                    M.speed_lines(c, f, wp, 1 if si % 2 else -1)
                    M.orange_wipe(c, wp)
                else:
                    rp = M.ease_in(wp)
                    r = rp * 1300
                    ImageDraw.Draw(c).ellipse((W / 2 - r, H / 2 - r, W / 2 + r, H / 2 + r), fill=ORANGE + (255,))
            M.brand(c, f)
        out = c.convert("RGB")
        if si < len(spec["scenes"]) and spec["scenes"][si].get("shake") and 10 <= g < 18:
            from PIL import ImageChops
            out = ImageChops.offset(out, random.randint(-14, 14), random.randint(-10, 10))
        proc.stdin.write(out.tobytes())
    proc.stdin.close(); proc.wait()
    # 3. bruitages calés sur l'animation
    for si, sc in enumerate(spec["scenes"]):
        s = starts[si] / FPS
        k = 0
        for line in sc["lines"]:
            for _ in line.lstrip("!").split():
                events.append(("pop", s + (k * 4 + 2) / FPS, 700 + 120 * (k % 4))); k += 1
            k += 0
        if si > 0: events.append(("whoosh", s - 10 / FPS, 0))
        p = sc.get("prop") or ""
        if p.startswith("battery"):
            for j, fr in enumerate((660, 520, 400)): events.append(("beep", s + 0.6 + j * 0.3, fr))
        if "check" in p: events.append(("ding", s + 31 / FPS, 0))
    for k in range(3): events.append(("pop", end_start + (13 + k * 4) / FPS, 600 + k * 200))
    events.append(("pop", end_start + 48 / FPS, 1400))
    seed = sum(map(ord, rid))
    save_wav(os.path.join(work, "music.wav"), music(total, spec["bpm"], spec["key"], end_start, seed))
    save_wav(os.path.join(work, "sfx.wav"), sfx(total, events, seed))
    # 4. mixage
    ins, delays = [], []
    for i, (a, dur, vo, lead) in enumerate(timeline):
        ins += ["-i", vo]
        ms = int(max(0, (a + (0.12 if i < len(timeline) - 1 else 0.3) - lead) * 1000))
        delays.append(f"[{i}]adelay={ms}|{ms}[a{i}]")
    nv = len(timeline)
    fc = ";".join(delays) + ";" + "".join(f"[a{i}]" for i in range(nv)) + \
        f"amix=inputs={nv}:normalize=0,aresample={SR},aformat=channel_layouts=stereo,highpass=f=90," \
        "acompressor=threshold=-20dB:ratio=4:attack=5:release=80,aecho=0.9:0.5:18:0.12,volume=2.2,asplit=2[vo][sc];" \
        f"[{nv}]volume=0.2[mu];[mu][sc]sidechaincompress=threshold=0.03:ratio=8:attack=10:release=250[mud];" \
        f"[{nv+1}]volume=0.22[fx];[vo][mud][fx]amix=inputs=3:normalize=0,alimiter=limit=0.95," \
        f"apad=whole_dur={total:.3f},loudnorm=I=-14:TP=-1.5:LRA=9[out]"
    mix = os.path.join(work, "mix.wav")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *ins, "-i", os.path.join(work, "music.wav"),
                    "-i", os.path.join(work, "sfx.wav"), "-filter_complex", fc, "-map", "[out]", "-ar", str(SR),
                    "-t", f"{total:.3f}", mix], check=True)
    out = os.path.join(OUTDIR, rid + ".mp4")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", os.path.join(work, "silent.mp4"), "-i", mix,
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
                    "-movflags", "+faststart", out], check=True)
    print(f"ok {out} ({total:.1f} s)")

if __name__ == "__main__":
    ids = sys.argv[2:]
    if ids == ["all"]: ids = list(REELS)
    for rid in ids:
        build(rid)
