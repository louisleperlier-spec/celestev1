"""Met chaque ligne de voix off au même niveau (crête à -1 dBFS) pour qu'elle passe bien au-dessus de la musique."""
import glob, wave
import numpy as np

for f in sorted(glob.glob('public/audio/voix_*.wav')):
    w = wave.open(f); p = w.getparams(); x = np.frombuffer(w.readframes(p.nframes), dtype=np.int16).astype(np.float32); w.close()
    x = x / max(1.0, np.abs(x).max()) * (0.89 * 32767)
    o = wave.open(f, 'w'); o.setparams(p); o.writeframes(x.astype(np.int16).tobytes()); o.close()
    print(f, 'ok')
