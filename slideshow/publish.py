#!/usr/bin/env python3
"""Publie un carrousel rendu (out/<id>/*.jpg) sur TikTok via l'API publique Postiz.

Usage :
    python3 publish.py carousels/001-exemple.json [--direct] [--draft] [--dry-run] [--force]

Par défaut, le carrousel part dans la boîte de réception TikTok (méthode UPLOAD) :
tu ouvres TikTok, tu ajoutes un son tendance et le label « contenu généré par IA », puis tu publies.
  --direct   publication directe (DIRECT_POST) avec musique ajoutée automatiquement par TikTok
  --draft    crée seulement un brouillon dans Postiz, rien n'est envoyé à TikTok
  --dry-run  affiche la requête sans rien envoyer
  --force    republie même si le carrousel a déjà été publié

Variables d'environnement :
  POSTIZ_API_KEY     clé API Postiz (Settings → Public API)            [obligatoire]
  POSTIZ_URL         défaut https://api.postiz.com/public/v1 ; auto-hébergé : https://<domaine>/api/public/v1
  POSTIZ_TIKTOK_ID   id de l'intégration TikTok ; sinon détecté automatiquement
"""
import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "out"
API = os.environ.get("POSTIZ_URL", "https://api.postiz.com/public/v1").rstrip("/")


def headers():
    key = os.environ.get("POSTIZ_API_KEY")
    if not key:
        sys.exit("POSTIZ_API_KEY manquante (à ajouter dans les variables d'environnement, jamais dans le code).")
    return {"Authorization": key}


def check(resp):
    if not resp.ok:
        sys.exit(f"Erreur Postiz {resp.status_code} sur {resp.request.method} {resp.url} :\n{resp.text}")
    return resp.json()


def tiktok_integration_id():
    if os.environ.get("POSTIZ_TIKTOK_ID"):
        return os.environ["POSTIZ_TIKTOK_ID"]
    integrations = check(requests.get(f"{API}/integrations", headers=headers(), timeout=30))
    tiktoks = [i for i in integrations if i.get("identifier") == "tiktok" and not i.get("disabled")]
    if len(tiktoks) != 1:
        found = ", ".join(f"{i.get('name')} ({i.get('identifier')}, {i['id']})" for i in integrations)
        sys.exit(f"{len(tiktoks)} compte(s) TikTok actif(s) trouvé(s). Définis POSTIZ_TIKTOK_ID. Intégrations : {found}")
    return tiktoks[0]["id"]


def upload(path):
    with open(path, "rb") as f:
        media = check(requests.post(f"{API}/upload", headers=headers(), files={"file": (path.name, f, "image/jpeg")}, timeout=120))
    return {"id": media["id"], "path": media["path"]}


def build_payload(data, images, integration_id, direct, draft):
    caption = data["caption"]
    if data.get("hashtags"):
        caption += "\n\n" + " ".join(data["hashtags"])

    if draft:
        post_type, date = "draft", datetime.now(timezone.utc).isoformat()
    elif data.get("date"):
        post_type, date = "schedule", datetime.fromisoformat(data["date"]).astimezone(timezone.utc).isoformat()
    else:
        post_type, date = "now", datetime.now(timezone.utc).isoformat()

    settings = {
        "__type": "tiktok",
        "title": data.get("title", "")[:90],
        "privacy_level": data.get("privacy_level", "PUBLIC_TO_EVERYONE"),
        "duet": False,
        "stitch": False,
        "comment": True,
        "autoAddMusic": "yes" if direct else "no",
        "brand_content_toggle": False,
        "brand_organic_toggle": False,
        "content_posting_method": "DIRECT_POST" if direct else "UPLOAD",
    }
    return {
        "type": post_type,
        "date": date,
        "shortLink": False,
        "tags": [],
        "posts": [
            {
                "integration": {"id": integration_id},
                "value": [{"content": caption, "image": images}],
                "settings": settings,
            }
        ],
    }


def publish(carousel_path, direct=False, draft=False, dry_run=False, force=False):
    carousel_path = Path(carousel_path)
    data = json.loads(carousel_path.read_text(encoding="utf-8"))
    cid = data.get("id") or carousel_path.stem
    out = OUT_DIR / cid
    marker = out / "published.json"

    slides = sorted(out.glob("*.jpg"))
    if not slides:
        sys.exit(f"[{cid}] aucune slide dans {out}. Lance d'abord : python3 render.py {carousel_path}")
    if len(slides) < 2:
        sys.exit(f"[{cid}] un carrousel TikTok demande au moins 2 images.")
    if marker.exists() and not force and not dry_run:
        print(f"[{cid}] déjà publié (voir {marker.relative_to(ROOT)}), ignoré. --force pour republier.")
        return

    if dry_run:
        images = [{"id": f"<upload {p.name}>", "path": "<url>"} for p in slides]
        payload = build_payload(data, images, os.environ.get("POSTIZ_TIKTOK_ID", "<tiktok-id>"), direct, draft)
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    integration_id = tiktok_integration_id()
    images = [upload(p) for p in slides]
    payload = build_payload(data, images, integration_id, direct, draft)
    result = check(requests.post(f"{API}/posts", headers={**headers(), "Content-Type": "application/json"}, json=payload, timeout=60))
    marker.write_text(json.dumps({"at": datetime.now(timezone.utc).isoformat(), "payload": payload, "result": result}, ensure_ascii=False, indent=2))
    print(f"[{cid}] envoyé à Postiz ({payload['type']}, {settings_label(direct, draft)}) : {len(images)} slides")


def settings_label(direct, draft):
    if draft:
        return "brouillon Postiz"
    return "publication directe" if direct else "boîte de réception TikTok"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("carousels", nargs="+")
    parser.add_argument("--direct", action="store_true")
    parser.add_argument("--draft", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    for path in args.carousels:
        publish(path, direct=args.direct, draft=args.draft, dry_run=args.dry_run, force=args.force)
