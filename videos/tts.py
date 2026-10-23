import sys, certifi
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import asyncio, edge_tts
async def main(voice, rate, pitch, text, out):
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await c.save(out)
asyncio.run(main(*sys.argv[1:6]))
