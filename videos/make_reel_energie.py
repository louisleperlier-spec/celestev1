#!/usr/bin/env python3
"""Reel motion design NÉA (DA robot dessiné) : 1080x1920, 30 i/s, ~15 s. Sortie : MP4 H.264 sans son."""
import math, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

S = "/tmp/claude-0/-home-user-celestev1/c4569c36-3639-5b6d-8029-f122b63c6d0f/scratchpad/"
U = "/root/.claude/uploads/c4569c36-3639-5b6d-8029-f122b63c6d0f/"
OUT = sys.argv[1] if len(sys.argv) > 1 else S + "reel/nea-reel.mp4"
W, H, FPS = 1080, 1920, 30
CREAM = (252, 251, 246)
ORANGE = (255, 106, 26)
HILITE = (252, 222, 186)
INK = (17, 17, 17)
HAND = S + "fonts/Mali-Bold.ttf"
BOLD = "/home/user/celestev1/slideshow/fonts/TikTokSans-800.ttf"
random.seed(7)

# ---------- utilitaires d'animation ----------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(f, start, dur): return clamp((f - start) / dur)
def ease_out(t): return 1 - (1 - t) ** 3
def ease_in(t): return t ** 3
def ease_io(t): return 3 * t * t - 2 * t ** 3
def back(t, s=2.2):  # dépassement puis retour (pop)
    t -= 1
    return t * t * ((s + 1) * t + s) + 1
def elastic(t):
    if t <= 0: return 0.0
    if t >= 1: return 1.0
    return 2 ** (-10 * t) * math.sin((t - 0.075) * (2 * math.pi) / 0.3) + 1

# ---------- fond papier ----------
def paper():
    bg = Image.new("RGB", (W, H), CREAM)
    noise = Image.effect_noise((W // 2, H // 2), 18).resize((W, H)).filter(ImageFilter.GaussianBlur(0.6))
    tex = Image.merge("RGB", (noise, noise, noise))
    bg = ImageChops.blend(bg, ImageChops.multiply(bg, tex.point(lambda v: 230 + v // 10)), 0.25)
    d = ImageDraw.Draw(bg)
    for _ in range(140):  # fibres légères
        x, y = random.randrange(W), random.randrange(H)
        d.line((x, y, x + random.randint(20, 70), y + random.randint(-4, 4)), fill=(242, 239, 230), width=1)
    return bg
PAPER = paper()

# ---------- découpes des visuels ----------
def band(path, y0, y1, feather=130):
    im = Image.open(path).convert("RGB").crop((0, y0, 941, y1))
    sc = W / 941
    im = im.resize((W, int((y1 - y0) * sc)), Image.LANCZOS)
    m = Image.new("L", im.size, 255)
    d = ImageDraw.Draw(m)
    for i in range(feather):
        a = int(255 * i / feather)
        d.line((0, i, W, i), fill=a)
        d.line((0, im.height - 1 - i, W, im.height - 1 - i), fill=a)
    for i in range(70):  # bords latéraux
        a = int(255 * i / 70)
        d.line((i, 0, i, im.height), fill=min(a, 255))
        d.line((W - 1 - i, 0, W - 1 - i, im.height), fill=min(a, 255))
    im.putalpha(ImageChops.darker(m, m))
    return im

SEANCE = band(U + "d6967e2d-image.png", 600, 1450)   # robot + écran séance
TIRED = band(U + "6633a024-image.png", 900, 1450)    # robot à plat (sans la pile, redessinée)
ENERGY = band(U + "1724727b-image.png", 630, 1470)   # robot + écran énergie

def sticker_head():
    im = Image.open(U + "d6967e2d-image.png").convert("RGB").crop((25, 640, 405, 995))
    im = im.resize((int(im.width * 1.3), int(im.height * 1.3)), Image.LANCZOS)
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), 70, fill=255)
    pad = 18
    st = Image.new("RGBA", (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(st).rounded_rectangle((0, 0, st.width - 1, st.height - 1), 85, fill=(255, 255, 255, 255))
    im.putalpha(m)
    st.alpha_composite(im, (pad, pad))
    sh = Image.new("RGBA", st.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((0, 0, st.width - 1, st.height - 1), 85, fill=(0, 0, 0, 90))
    out = Image.new("RGBA", (st.width + 30, st.height + 30), (0, 0, 0, 0))
    out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)), (18, 22))
    out.alpha_composite(st, (0, 0))
    return out
HEAD = sticker_head()

def place(canvas, img, cx, cy, scale=1.0, rot=0.0, alpha=1.0):
    if scale <= 0.01 or alpha <= 0: return
    im = img if img.mode == "RGBA" else img.convert("RGBA")
    if abs(scale - 1) > 0.001:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.BILINEAR)
    if abs(rot) > 0.05:
        im = im.rotate(rot, Image.BICUBIC, expand=True)
    if alpha < 1:
        a = im.getchannel("A").point(lambda v: int(v * alpha))
        im.putalpha(a)
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))

# ---------- texte manuscrit ----------
FONTS = {}
def font(size, path=HAND):
    k = (size, path)
    if k not in FONTS: FONTS[k] = ImageFont.truetype(path, size)
    return FONTS[k]

def word_img(text, size, color=INK, path=HAND, hl=None, hl_p=1.0):
    f = font(size, path)
    l, t, r, b = f.getbbox(text)
    pad = int(size * 0.28)
    im = Image.new("RGBA", (r - l + 2 * pad, int(size * 1.35) + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if hl and hl_p > 0:
        x1 = pad * 0.4 + (im.width - pad * 0.8) * ease_out(hl_p)
        d.rounded_rectangle((pad * 0.4, pad + size * 0.12, x1, pad + size * 1.18), int(size * 0.3), fill=hl + (255,))
    d.text((pad - l, pad), text, font=f, fill=color)
    return im

def boil(f):  # petit tremblement façon dessin animé, change toutes les 3 images
    random.seed(f // 3)
    return random.uniform(-2.2, 2.2), random.uniform(-2.2, 2.2), random.uniform(-0.8, 0.8)

def line_words(canvas, f, words, cy, size, start, gap=4, hl_words=(), hl_start=None, color=INK, center=W / 2, enter=1.0):
    imgs = [word_img(w, size, color) for w in words]
    pad = int(size * 0.28)
    space = int(font(size).getlength(" ")) - 2 * pad
    total = sum(i.width for i in imgs) + space * (len(imgs) - 1)
    x0 = center - total / 2
    xs, x = [], x0
    for im in imgs:
        xs.append(x); x += im.width + space
    if hl_start is not None and hl_words:
        idx = [k for k, w in enumerate(words) if w in hl_words]
        hp = ease_out(prog(f, hl_start, 10))
        if hp > 0:
            a = xs[idx[0]] + pad * 0.3
            b = xs[idx[-1]] + imgs[idx[-1]].width - pad * 0.3
            bx, by, _ = boil(f + 99)
            d = ImageDraw.Draw(canvas)
            d.rounded_rectangle((a + bx, cy - size * 0.52 + by, a + (b - a) * hp + bx, cy + size * 0.5 + by), int(size * 0.28), fill=HILITE + (255,))
    for k, im in enumerate(imgs):
        p = prog(f, start + k * gap, 9)
        if p > 0:
            bx, by, br = boil(f + k * 5)
            sc = 0.2 + 0.8 * back(p, 2.6)
            place(canvas, im, xs[k] + im.width / 2 + bx, cy + by + (1 - ease_out(p)) * 40, sc * enter, br, min(1, p * 2.5))

def sparks(canvas, cx, cy, f, start, r=140, n=6, col=ORANGE):
    p = prog(f, start, 10)
    if p <= 0 or p >= 1: return
    d = ImageDraw.Draw(canvas)
    for i in range(n):
        a = i / n * 2 * math.pi + 0.3
        r0, r1 = r * (0.6 + 0.6 * ease_out(p)), r * (0.9 + 0.9 * ease_out(p))
        w = int(14 * (1 - p)) + 2
        d.line((cx + math.cos(a) * r0, cy + math.sin(a) * r0, cx + math.cos(a) * r1, cy + math.sin(a) * r1), fill=col + (255,), width=w)

def battery(canvas, cx, cy, level, f, scale=1.0, blink=True):
    d = ImageDraw.Draw(canvas)
    w, h = 300 * scale, 135 * scale
    x0, y0 = cx - w / 2, cy - h / 2
    bx, by, _ = boil(f)
    x0 += bx; y0 += by
    d.rounded_rectangle((x0, y0, x0 + w, y0 + h), int(26 * scale), outline=INK + (255,), width=int(11 * scale))
    d.rounded_rectangle((x0 + w + 4, y0 + h * 0.32, x0 + w + 26 * scale, y0 + h * 0.68), 6, fill=INK + (255,))
    inner = w - 34 * scale
    fill_w = inner * clamp(level)
    col = ORANGE if level > 0.3 else (226, 38, 32)
    if not (blink and level <= 0.3 and (f // 6) % 2 == 1) and fill_w > 2:
        d.rounded_rectangle((x0 + 17 * scale, y0 + 17 * scale, x0 + 17 * scale + fill_w, y0 + h - 17 * scale), int(10 * scale), fill=col + (255,))

def energy_meter(canvas, cx, cy, filled, f, start):
    d = ImageDraw.Draw(canvas)
    seg_w, seg_h, gap = 120, 40, 22
    total = 5 * seg_w + 4 * gap
    for i in range(5):
        p = prog(f, start + i * 3, 8)
        x = cx - total / 2 + i * (seg_w + gap)
        col = ORANGE if i < filled else (226, 220, 210)
        sc = back(p, 3) if p > 0 else 0
        if sc <= 0: continue
        hw, hh = seg_w / 2 * sc, seg_h / 2 * sc
        d.rounded_rectangle((x + seg_w / 2 - hw, cy - hh, x + seg_w / 2 + hw, cy + hh), 20, fill=col + (255,))

def speed_lines(canvas, f, p, direction=1):
    d = ImageDraw.Draw(canvas)
    random.seed(f)
    for _ in range(26):
        y = random.randrange(H)
        L = random.randint(200, 700) * p
        x = random.randrange(-200, W)
        d.line((x, y, x + L * direction, y), fill=(ORANGE if random.random() < 0.4 else INK) + (int(200 * p),), width=random.randint(3, 9))

def orange_wipe(canvas, p):
    """Panneau orange diagonal qui balaie l'écran (transition)."""
    if p <= 0 or p >= 1: return
    x = -W * 1.6 + 3.2 * W * ease_io(p)
    d = ImageDraw.Draw(canvas)
    d.polygon([(x, 0), (x + W * 1.1, 0), (x + W * 0.7, H), (x - W * 0.4, H)], fill=ORANGE + (255,))
    d.polygon([(x + W * 1.1, 0), (x + W * 1.25, 0), (x + W * 0.85, H), (x + W * 0.7, H)], fill=INK + (255,))

def counter(canvas, f, n):
    im = word_img(f"{n}/4", 64)
    bx, by, _ = boil(f)
    place(canvas, im, W - 150 + bx, 210 + by)
    d = ImageDraw.Draw(canvas)
    d.line((W - 262, 168, W - 240, 186), fill=ORANGE + (255,), width=8)
    d.line((W - 270, 205, W - 244, 207), fill=ORANGE + (255,), width=8)

def brand(canvas, f, color=INK):
    im = word_img("N É A", 54, color, path=BOLD)
    bx, by, _ = boil(f)
    place(canvas, im, W / 2 + bx, 1640 + by)

# ---------- scènes ----------
T1, T2, T3, T4, T5, END = 0, 66, 150, 252, 345, 450

def frame(f):
    c = PAPER.copy().convert("RGBA")
    shake = (0, 0)

    if f < T2:  # 1. accroche + pile qui se vide
        line_words(c, f, ["t'es", "pas"], 470, 150, -12, 5)
        line_words(c, f, ["paresseux."], 650, 150, 3)
        level = 1 - 0.85 * ease_io(prog(f, 16, 34))
        pb = back(prog(f, 8, 10))
        if pb > 0:
            layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            battery(layer, W / 2, 1060, level, f, 1.6 * pb)
            c.alpha_composite(layer)
        if 4 <= f < 10: shake = (random.randint(-14, 14), random.randint(-10, 10))
        sparks(c, W / 2, 650, f, 6, 330, 8)
        counter(c, f, 1)

    elif f < T3:  # 2. « t'es à plat. » + robot affalé
        g = f - T2
        line_words(c, g, ["t'es", "à", "plat."], 420, 165, 0, 4, hl_words=("t'es", "à", "plat."), hl_start=10)
        battery(c, W / 2, 760, 0.12, f, 1.1)
        d = ImageDraw.Draw(c)
        if (f // 4) % 2 == 0:
            d.line((W / 2 + 200, 700, W / 2 + 235, 665), fill=ORANGE + (255,), width=9)
            d.line((W / 2 + 212, 760, W / 2 + 258, 752), fill=ORANGE + (255,), width=9)
        p = prog(g, 6, 22)
        y = 1260 + (1 - elastic(p)) * 900
        squash = 1 + 0.05 * math.sin(g * 0.35) * (p >= 1)
        place(c, TIRED, W / 2, y, squash)
        # « zzz »
        for k in range(3):
            zp = ((g + k * 10) % 30) / 30
            zi = word_img("z", 46 + k * 10, (90, 90, 90))
            place(c, zi, W / 2 + 330 + k * 30 + zp * 40, 1000 - k * 50 - zp * 90, 1, 0, 1 - zp)
        counter(c, f, 2)
        if g > H and False: pass
        if g >= (T3 - T2) - 10:  # sortie en whip
            wp = prog(g, (T3 - T2) - 10, 10)
            speed_lines(c, f, wp, -1)
            orange_wipe(c, wp)

    elif f < T4:  # 3. NÉA te demande ton énergie
        g = f - T3
        line_words(c, g, ["NÉA", "te", "demande"], 330, 118, 4, 4)
        line_words(c, g, ["ton", "énergie."], 475, 118, 14, 4, hl_words=("énergie.",), hl_start=24)
        p = prog(g, 2, 16)
        zoom = 1 + 0.18 * ease_io(prog(g, 62, 30))
        place(c, ENERGY, W / 2 - (zoom - 1) * 300, 1130 + (1 - back(p, 1.8)) * 700 + (zoom - 1) * 250, zoom, (1 - p) * 8)
        sparks(c, W / 2 + 230, 1050, g, 18, 260, 7)
        if g < 8: orange_wipe(c, 0.5 + g / 16)
        counter(c, f, 3)
        if g >= (T4 - T3) - 10:
            wp = prog(g, (T4 - T3) - 10, 10)
            speed_lines(c, f, wp, 1)
            orange_wipe(c, wp)

    elif f < T5:  # 4. et ta séance s'adapte
        g = f - T4
        line_words(c, g, ["et", "ta", "séance"], 330, 130, 4, 4)
        line_words(c, g, ["s'adapte."], 480, 130, 14, hl_words=("s'adapte.",), hl_start=22)
        p = prog(g, 2, 18)
        place(c, SEANCE, W / 2 + (1 - elastic(p)) * 1100, 1160)
        # coche qui se dessine
        cp = ease_out(prog(g, 30, 10))
        if cp > 0:
            d = ImageDraw.Draw(c)
            cx, cy = 905, 520
            pts = [(cx - 40, cy), (cx - 10, cy + 32), (cx + 50, cy - 40)]
            if cp < 0.5:
                q = cp / 0.5
                d.line((pts[0], (pts[0][0] + (pts[1][0] - pts[0][0]) * q, pts[0][1] + (pts[1][1] - pts[0][1]) * q)), fill=ORANGE + (255,), width=16)
            else:
                q = (cp - 0.5) / 0.5
                d.line((pts[0], pts[1], (pts[1][0] + (pts[2][0] - pts[1][0]) * q, pts[1][1] + (pts[2][1] - pts[1][1]) * q)), fill=ORANGE + (255,), width=16, joint="curve")
        sparks(c, 905, 520, g, 40, 90, 6)
        if 20 <= g < 26: shake = (random.randint(-8, 8), random.randint(-6, 6))
        if g < 8: orange_wipe(c, 0.5 + g / 16)
        counter(c, f, 4)
        if g >= (T5 - T4) - 12:
            # révélation circulaire orange vers la fin
            rp = ease_in(prog(g, (T5 - T4) - 12, 12))
            d = ImageDraw.Draw(c)
            r = rp * 1300
            d.ellipse((W / 2 - r, H / 2 - r, W / 2 + r, H / 2 + r), fill=ORANGE + (255,))

    else:  # 5. carte de fin
        g = f - T5
        c = Image.new("RGBA", (W, H), ORANGE + (255,))
        d = ImageDraw.Draw(c)
        # rayons qui tournent
        for i in range(14):
            a = i / 14 * 2 * math.pi + g * 0.01
            d.polygon([(W / 2, 760), (W / 2 + math.cos(a) * 1500, 760 + math.sin(a) * 1500),
                       (W / 2 + math.cos(a + 0.11) * 1500, 760 + math.sin(a + 0.11) * 1500)], fill=(255, 122, 48, 255))
        place(c, HEAD, W / 2, 760 - 10 * math.sin(g * 0.15), back(prog(g, 2, 14), 2.4), 4 * math.sin(g * 0.12))
        # NÉA lettre par lettre
        letters = ["N", "É", "A"]
        for k, L in enumerate(letters):
            p = prog(g, 12 + k * 4, 10)
            if p <= 0: continue
            im = word_img(L, 230, (255, 255, 255), path=BOLD)
            place(c, im, W / 2 + (k - 1) * 205, 1180 - (1 - back(p, 2.4)) * 300, 1, 0, min(1, p * 3))
        line_words(c, g, ["Ton", "coach.", "Ton", "rythme."], 1370, 82, 30, 3, color=(255, 255, 255))
        pp = prog(g, 48, 10)
        if pp > 0:
            pulse = 1 + 0.06 * math.sin(g * 0.3)
            pill = Image.new("RGBA", (520, 120), (0, 0, 0, 0))
            ImageDraw.Draw(pill).rounded_rectangle((0, 0, 519, 119), 60, fill=INK + (255,))
            t = word_img("Lien en bio ↓", 62, (255, 255, 255))
            pill.alpha_composite(t, (int(260 - t.width / 2), int(60 - t.height / 2)))
            place(c, pill, W / 2, 1530, back(pp, 2) * pulse)
        if g < 6:  # flash
            fl = Image.new("RGBA", (W, H), (255, 255, 255, int(255 * (1 - g / 6))))
            c.alpha_composite(fl)

    if f >= T2 and f < T5:
        brand(c, f)
    elif f < T2:
        brand(c, f)

    out = c.convert("RGB")
    if shake != (0, 0):
        out = ImageChops.offset(out, *shake)
    return out

def main():
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest",
           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
           "-movflags", "+faststart", OUT]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    only = [int(a) for a in sys.argv[2:]]
    if only:
        for f in only:
            frame(f).save(S + f"reel/f{f:03d}.jpg", quality=85)
        p.stdin.close(); p.kill(); return
    for f in range(END):
        p.stdin.write(frame(f).tobytes())
    p.stdin.close(); p.wait()
    print("ok", OUT)

if __name__ == "__main__":
    main()
