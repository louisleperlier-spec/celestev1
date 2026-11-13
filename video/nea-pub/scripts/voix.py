"""Génère la voix off (edge-tts, fr-CA) ligne par ligne + les mots et leurs instants (sous-titres)."""
import asyncio, json, sys, certifi
certifi.where = lambda: '/root/.ccr/ca-bundle.crt'  # proxy de l'environnement de dev
import edge_tts

LIGNES = [
    "Tu arrives à la salle sans savoir quoi faire ?",
    "Avec NÉA, retrouve ton programme et passe à ta séance.",
    "Un : ouvre ton programme. Tu retrouves ce qui est prévu.",
    "Deux : retrouve tes exercices, tes séries et tes répétitions.",
    "Trois : consulte tes progrès et garde le fil de ton parcours.",
    "Ton programme, tes séances, tes progrès. Au même endroit.",
    "Découvre NÉA sur neacoach point x y z.",
]
VOIX, DEBIT = sys.argv[1] if len(sys.argv) > 1 else 'fr-CA-AntoineNeural', '+16%'

async def une(i, texte):
    c = edge_tts.Communicate(texte, VOIX, rate=DEBIT, boundary='WordBoundary')
    mots, audio = [], bytearray()
    async for m in c.stream():
        if m['type'] == 'audio': audio += m['data']
        elif m['type'] == 'WordBoundary':
            mots.append({'mot': m['text'], 'debut': m['offset'] / 1e7, 'fin': (m['offset'] + m['duration']) / 1e7})
    open(f'public/audio/voix_{i}.mp3', 'wb').write(audio)
    return mots

async def main():
    r = await asyncio.gather(*[une(i, t) for i, t in enumerate(LIGNES)])
    json.dump(r, open('scripts/mots.json', 'w'), ensure_ascii=False, indent=1)

asyncio.run(main())
