"""Musique et bruitages synthétisés (libres de droits) pour le Reel NÉA. Sortie : music.wav, sfx.wav (44,1 kHz stéréo)."""
import numpy as np, wave
SR = 44100; DUR = 16.5; N = int(SR * DUR)
BPM = 124; B = 60 / BPM
rng = np.random.default_rng(3)
t_all = np.arange(N) / SR

def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * np.exp(-t / d)
    return e
def add(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]
def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 0.9
def clap():
    n = int(0.2 * SR); x = rng.standard_normal(n)
    e = env(n, 0.001, 0.06); x = np.convolve(x, np.ones(6) / 6, 'same')
    return x * e * 0.35
def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR); x = rng.standard_normal(n)
    x = x - np.convolve(x, np.ones(4) / 4, 'same')
    return x * env(n, 0.001, 0.06 if open_ else 0.015) * 0.22
def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    out = 0
    for d in (-detune, 0, detune):
        ph = (t * freq * (1 + d)) % 1
        out = out + (2 * ph - 1)
    return out / 3
def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, 'same')
def note(m): return 440 * 2 ** ((m - 69) / 12)

music = np.zeros(N)
# accords : Am - F - C - G (une mesure chacun)
prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
bass = [45, 41, 48, 43]
bar = 4 * B
nb = int(DUR / bar) + 1
for b in range(nb):
    ch = prog[b % 4]; t0 = b * bar
    for s in range(8):  # stabs en croches décalées
        if s in (1, 3, 4, 6):
            n = int(B * 0.45 * SR)
            sig = sum(saw(note(m + 12), n, 0.006) for m in ch) / 3
            sig = lowpass(sig, 6) * env(n, 0.003, 0.12) * 0.22
            add(music, sig, t0 + s * B / 2)
    for s in range(8):  # basse en croches à contretemps
        if s % 2 == 1:
            n = int(B * 0.45 * SR)
            sig = lowpass(saw(note(bass[b % 4]), n), 18) * env(n, 0.003, 0.18) * 0.5
            add(music, sig, t0 + s * B / 2)
# batterie
beats = int(DUR / B) + 1
for k in range(beats):
    t = k * B
    if t < 0.0: continue
    add(music, kick(), t)
    if k % 2 == 1: add(music, clap(), t)
    add(music, hat(), t + B / 2)
    if k % 4 == 3: add(music, hat(True), t + B / 2)
    add(music, hat() * 0.5, t + B / 4); add(music, hat() * 0.5, t + 3 * B / 4)
# montée (riser) avant la carte de fin + crash
rs, re = 10.3, 11.45
n = int((re - rs) * SR); x = rng.standard_normal(n); tt = np.linspace(0, 1, n)
add(music, x * tt ** 2 * 0.25, rs)
n = int(1.6 * SR); add(music, (rng.standard_normal(n) - lowpass(rng.standard_normal(n), 3)) * env(n, 0.001, 0.5) * 0.35, 11.45)
# fondu de fin
fade = np.ones(N); fs = int(15.3 * SR); fade[fs:] = np.linspace(1, 0, N - fs)
music *= fade

# bruitages
sfx = np.zeros(N)
def pop(f0=900):
    n = int(0.09 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (f0 + 900 * np.exp(-t * 60)) * t) * env(n, 0.001, 0.03) * 0.35
def whoosh(d=0.35):
    n = int(d * SR); x = rng.standard_normal(n); tt = np.linspace(0, 1, n)
    y = np.zeros(n)
    for i in range(0, n, 512):  # passe-bande glissant approximatif
        k = int(2 + 30 * (1 - tt[i]))
        seg = x[i:i + 512]; y[i:i + 512] = seg - lowpass(seg, k) if len(seg) > k else seg
    return y * np.sin(np.pi * tt) * 0.5
def ding():
    n = int(0.8 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1318 * t) + 0.5 * np.sin(2 * np.pi * 1976 * t)) * env(n, 0.002, 0.25) * 0.28
def beep(f=880, d=0.08):
    n = int(d * SR); t = np.arange(n) / SR
    return np.sign(np.sin(2 * np.pi * f * t)) * env(n, 0.001, 0.05) * 0.08
fps = 30
for fr in (-12, -7, 3):  # mots de l'écran 1
    add(sfx, pop(), max(0, fr / fps))
add(sfx, beep(660, 0.12), 0.9); add(sfx, beep(520, 0.12), 1.2); add(sfx, beep(400, 0.18), 1.5)  # pile qui se vide
for g in (0, 4, 8): add(sfx, pop(700), (66 + g) / fps)
add(sfx, whoosh(), (150 - 10) / fps)
for g in (4, 8, 12, 14, 18): add(sfx, pop(1000), (150 + g) / fps)
add(sfx, whoosh(), (252 - 10) / fps)
for g in (4, 8, 12, 14): add(sfx, pop(1100), (252 + g) / fps)
add(sfx, ding(), (252 + 31) / fps)
for k in range(3): add(sfx, pop(600 + k * 200), (345 + 13 + k * 4) / fps)
add(sfx, pop(1400), (345 + 48) / fps)

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    st = np.stack([x, x], 1)
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
save('music.wav', music); save('sfx.wav', sfx)
print('ok')
