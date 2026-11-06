"""Génère la musique d'ambiance (instrumentale, créée ici, libre d'usage) et les petits sons (clic, glisse, pop)."""
import numpy as np, wave

SR = 48000

def ecrire(nom, x):
    x = np.clip(x / max(1e-9, np.abs(x).max()) * 0.9, -1, 1)
    w = wave.open(f'public/audio/{nom}.wav', 'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()

t = lambda d: np.arange(int(d * SR)) / SR

# clic : petit tic sec et doux
c = t(0.06); ecrire('clic', np.sin(2 * np.pi * 2200 * c) * np.exp(-c * 90) + 0.4 * np.sin(2 * np.pi * 1100 * c) * np.exp(-c * 60))
# glisse : souffle filtré qui monte puis descend
g = t(0.35); rng = np.random.default_rng(3); n = rng.standard_normal(len(g))
n = np.convolve(n, np.ones(24) / 24, mode='same'); ecrire('glisse', n * np.sin(np.pi * g / 0.35) ** 2)
# pop : goutte arrondie
p = t(0.12); ecrire('pop', np.sin(2 * np.pi * (520 + 900 * np.exp(-p * 40)) * p) * np.exp(-p * 28))

# musique : 104 bpm, accords doux (Rhodes simple), basse ronde, kick léger, charleston feutré ; 32 s
bpm, duree = 104, 32.0
b = 60 / bpm; N = int(duree * SR); m = np.zeros(N)
hz = lambda k: 440 * 2 ** ((k - 69) / 12)
prog = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]  # Am7 Fmaj7 Cmaj7 G7
def ajoute(a, s):
    a = int(a * SR); s = s[: max(0, N - a)]; m[a:a + len(s)] += s
pos, k = 0.0, 0
while pos < duree:
    ch = prog[k % 4]
    for note in ch:
        d = t(4 * b); env = np.minimum(1, d / 0.02) * np.exp(-d * 0.9)
        ajoute(pos, 0.07 * env * (np.sin(2 * np.pi * hz(note) * d) + 0.25 * np.sin(4 * np.pi * hz(note) * d)))
    for i in range(8):
        d = t(b / 2); note = ch[[0, 2, 1, 3, 2, 1, 3, 2][i]] + 12
        ajoute(pos + i * b / 2, 0.035 * np.exp(-d * 9) * np.sin(2 * np.pi * hz(note) * d))
    d = t(4 * b); ajoute(pos, 0.16 * np.exp(-d * 1.5) * np.tanh(1.6 * np.sin(2 * np.pi * hz(ch[0] - 24) * d)))
    for i in range(4):
        d = t(0.22); ajoute(pos + i * b, 0.35 * np.sin(2 * np.pi * (48 + 70 * np.exp(-d * 28)) * d) * np.exp(-d * 14))
        d = t(0.04); ajoute(pos + i * b + b / 2, 0.025 * rng.standard_normal(len(d)) * np.exp(-d * 90))
    pos += 4 * b; k += 1
ecrire('musique', m)
print('ok')
