#!/usr/bin/env python3
"""Rend les slides d'un carrousel : recadre chaque image en 9:16 et pose le texte style TikTok.

Usage :
    python3 render.py carousels/001-exemple.json [autres.json ...]

Sortie : out/<id>/01.jpg, 02.jpg, ... et out/<id>/legende.txt (légende + hashtags à copier-coller)
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
IMAGES_DIR = ROOT / "images"
OUT_DIR = ROOT / "out"
FONTS = {
    "bold": ROOT / "fonts" / "TikTokSans-800.ttf",
    "semibold": ROOT / "fonts" / "TikTokSans-600.ttf",
}

WIDTH, HEIGHT = 1080, 1920
DEFAULT_STYLE = {
    "variant": "outline",  # "outline" : blanc contour noir · "box" : texte noir sur fond blanc · "minimal" : blanc fin, ombre douce
    "position": "center",  # "top", "center", "bottom" ou une fraction de la hauteur (0.0 à 1.0)
    "size": 64,  # taille max ; réduite automatiquement si le texte ne tient pas
    "font": "bold",
    "max_width": 0.82,  # largeur max du bloc de texte, en fraction de la largeur
}
POSITIONS = {"top": 0.22, "center": 0.5, "bottom": 0.72}


def cover(img, width, height):
    """Recadre au centre pour remplir exactement width x height."""
    img = ImageOps.exif_transpose(img).convert("RGB")
    return ImageOps.fit(img, (width, height), Image.LANCZOS, centering=(0.5, 0.5))


def contain(img, width, height, scale=1.0, valign="center"):
    """Place l'image entière (sans la rogner) sur un fond flou et assombri tiré d'elle-même."""
    img = ImageOps.exif_transpose(img).convert("RGB")
    background = cover(img, width, height).filter(ImageFilter.GaussianBlur(40))
    background = ImageEnhance.Brightness(background).enhance(0.45)
    fitted = ImageOps.contain(img, (int(width * scale), int(height * scale)), Image.LANCZOS)
    x = (width - fitted.width) // 2
    margin = height - fitted.height
    y = {"top": int(margin * 0.08), "bottom": int(margin * 0.92)}.get(valign, margin // 2)
    background.paste(fitted, (x, y))
    return background


def wrap(text, font, max_width, draw):
    """Coupe le texte en lignes qui tiennent dans max_width, en respectant les retours à la ligne voulus."""
    lines = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        if not words:
            lines.append("")
            continue
        line = words[0]
        for word in words[1:]:
            candidate = f"{line} {word}"
            if draw.textlength(candidate, font=font) <= max_width:
                line = candidate
            else:
                lines.append(line)
                line = word
        lines.append(line)
    return lines


def layout(text, style, draw):
    """Choisit la plus grande taille de police (<= style.size) dont le texte tient en largeur et en hauteur."""
    max_width = WIDTH * style["max_width"]
    max_height = HEIGHT * 0.5
    size = style["size"]
    while True:
        font = ImageFont.truetype(str(FONTS[style["font"]]), size)
        lines = wrap(text, font, max_width, draw)
        line_height = int(size * 1.22)
        too_wide = any(draw.textlength(l, font=font) > max_width for l in lines)
        if (not too_wide and line_height * len(lines) <= max_height) or size <= 28:
            return font, lines, line_height
        size -= 2


def draw_text(img, text, style):
    draw = ImageDraw.Draw(img)
    font, lines, line_height = layout(text, style, draw)
    size = font.size

    pos = style["position"]
    center_y = HEIGHT * (POSITIONS[pos] if isinstance(pos, str) else float(pos))
    top = center_y - line_height * len(lines) / 2

    if style["variant"] == "minimal":
        # Texte blanc fin avec une ombre douce, façon carrousels « wellness aesthetic »
        shadow = Image.new("L", img.size, 0)
        shadow_draw = ImageDraw.Draw(shadow)
        for i, line in enumerate(lines):
            w = draw.textlength(line, font=font)
            shadow_draw.text(((WIDTH - w) / 2, top + i * line_height), line, font=font, fill=170)
        shadow = shadow.filter(ImageFilter.GaussianBlur(max(4, size // 6)))
        img.paste(Image.new("RGB", img.size, "black"), (0, 0), shadow)
        draw = ImageDraw.Draw(img)
        for i, line in enumerate(lines):
            w = draw.textlength(line, font=font)
            draw.text(((WIDTH - w) / 2, top + i * line_height), line, font=font, fill="white")
        return img

    for i, line in enumerate(lines):
        if not line:
            continue
        y = top + i * line_height
        w = draw.textlength(line, font=font)
        x = (WIDTH - w) / 2
        if style["variant"] == "box":
            pad_x, pad_y = size * 0.35, size * 0.12
            draw.rounded_rectangle(
                (x - pad_x, y - pad_y, x + w + pad_x, y + line_height - pad_y),
                radius=size * 0.25,
                fill="white",
            )
            draw.text((x, y), line, font=font, fill="black")
        else:
            draw.text(
                (x, y),
                line,
                font=font,
                fill="white",
                stroke_width=max(3, size // 14),
                stroke_fill="black",
            )
    return img


def render(carousel_path):
    carousel_path = Path(carousel_path)
    data = json.loads(carousel_path.read_text(encoding="utf-8"))
    cid = data.get("id") or carousel_path.stem
    base_style = {**DEFAULT_STYLE, **data.get("style", {})}

    out = OUT_DIR / cid
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.jpg"):
        old.unlink()

    files = []
    for n, slide in enumerate(data["slides"], start=1):
        src = IMAGES_DIR / slide["image"]
        if not src.exists():
            sys.exit(f"[{cid}] image introuvable : {src}")
        style = {**base_style, **slide.get("style", {})}
        if slide.get("fit") == "contain":
            img = contain(Image.open(src), WIDTH, HEIGHT, slide.get("scale", 1.0), slide.get("valign", "center"))
        else:
            img = cover(Image.open(src), WIDTH, HEIGHT)
        if slide.get("text"):
            draw_text(img, slide["text"], style)
        dest = out / f"{n:02d}.jpg"
        img.save(dest, "JPEG", quality=92, optimize=True)
        files.append(dest)

    caption = data.get("caption", "")
    if data.get("hashtags"):
        caption += "\n\n" + " ".join(data["hashtags"])
    (out / "legende.txt").write_text(caption + "\n", encoding="utf-8")
    print(f"[{cid}] {len(files)} slides + legende.txt -> {out.relative_to(ROOT)}")
    return files


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for path in sys.argv[1:]:
        render(path)
