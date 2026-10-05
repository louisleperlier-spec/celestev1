"""Sons de NÉA : 3 sonneries de réveil (< 30 s, limite d'iOS) et 3 ambiances de nuit en boucle. numpy seul."""
import sys
import wave

import numpy as np

OUT = sys.argv[1] if len(sys.argv) > 1 else 'assets/sons'
rng = np.random.default_rng(7)


def ecrire(nom, x, sr):
    if nom.startswith('reveil'):
        f = int(sr * 0.4)
        x = x.copy()
        x[-f:] *= np.linspace(1, 0, f)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    d = (x * 32767).astype('<i2')
    with wave.open(f'{OUT}/{nom}', 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(d.tobytes())
    print(nom, f'{len(x) / sr:.1f} s')


def hz(n):
    """Note MIDI → Hz."""
    return 440 * 2 ** ((n - 69) / 12)


def reverb(x, sr, duree=1.8, mix=0.22):
    n = int(sr * duree)
    t = np.arange(n) / sr
    ir = rng.standard_normal(n) * np.exp(-t * 6.9 / duree)
    # réverbe sombre : on adoucit l'impulsion
    ir = np.convolve(ir, np.ones(8) / 8, mode='same')
    ir /= np.sqrt(np.sum(ir**2))
    m = len(x) + n
    taille = 1 << (m - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, taille) * np.fft.rfft(ir, taille), taille)[: len(x)]
    return x * (1 - mix) + y * mix * 0.6


def passe_bas(x, fc, sr):
    """Filtre passe-bas à une pôle (fc peut être un tableau)."""
    a = np.exp(-2 * np.pi * np.broadcast_to(fc, x.shape) / sr)
    y = np.empty_like(x)
    v = 0.0
    for i in range(len(x)):
        v = (1 - a[i]) * x[i] + a[i] * v
        y[i] = v
    return y


# ---------------------------------------------------------------- réveils (44,1 kHz, 28 s)
SR = 44100
DUREE = 28.0
N = int(SR * DUREE)
T = np.arange(N) / SR


def note(sig, debut, f, dur, timbre, vol=1.0):
    i = int(debut * SR)
    if i >= N:
        return
    n = min(int(dur * SR), N - i)
    t = np.arange(n) / SR
    sig[i : i + n] += timbre(t, f) * vol


def marimba(t, f):
    att = np.minimum(1, t / 0.004)
    return att * (
        np.sin(2 * np.pi * f * t) * np.exp(-t * 2.6)
        + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 9)
        + 0.08 * np.sin(2 * np.pi * f * 9.9 * t) * np.exp(-t * 22)
    )


def cloche(t, f):
    att = np.minimum(1, t / 0.006)
    return att * (
        np.sin(2 * np.pi * f * t) * np.exp(-t * 1.4)
        + 0.5 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 2.2)
        + 0.25 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 3.5)
        + 0.12 * np.sin(2 * np.pi * f * 4.2 * t) * np.exp(-t * 6)
    )


def montee(debut=0.18, plein=18.0):
    """Volume qui monte doucement puis reste stable."""
    return debut + (1 - debut) * np.clip(T / plein, 0, 1) ** 1.4


# Réveil doux : marimba, petite mélodie pentatonique qui revient, volume qui monte.
s = np.zeros(N)
melodie = [(0, 72), (0.3, 76), (0.6, 79), (0.9, 84), (1.5, 81), (1.8, 79), (2.4, 76), (2.7, 79)]
basse = [48, 53, 45, 55]
for k in range(int(DUREE / 3.6) + 1):
    t0 = k * 3.6
    for dt, n in melodie:
        note(s, t0 + dt, hz(n), 2.0, marimba, 0.8)
    note(s, t0, hz(basse[k % 4]), 3.4, marimba, 0.55)
s = reverb(s, SR) * montee()
ecrire('reveil_doux.wav', s, SR)

# Classique : le bip-bip-bip-bip d'un réveil de chevet, sans agressivité (son rond, bords arrondis).
s = np.zeros(N)


def bip(t, f):
    env = np.minimum(1, t / 0.008) * np.minimum(1, (0.11 - t) / 0.02).clip(0, 1)
    return env * (np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 2 * f * t))


t0 = 0.0
while t0 < DUREE:
    for b in range(4):
        note(s, t0 + b * 0.17, 1046.5, 0.11, bip, 1.0)
    t0 += 1.25
s = s * montee(0.22, 14)
ecrire('reveil_classique.wav', s, SR)

# Lever du soleil : arpèges de cloches sur des accords qui s'ouvrent, avec une nappe chaude dessous.
s = np.zeros(N)
accords = [[60, 64, 67, 71, 74], [53, 57, 60, 64, 69], [57, 60, 64, 67, 72], [55, 59, 62, 67, 74]]
for k in range(int(DUREE / 4) + 1):
    ac = accords[k % 4]
    t0 = k * 4.0
    for j, n in enumerate(ac + [ac[2] + 12, ac[3] + 12]):
        note(s, t0 + j * 0.22, hz(n + 12), 3.5, cloche, 0.45)
    # nappe : quelques sinus légèrement désaccordés
    i0, n = int(t0 * SR), int(4.6 * SR)
    n = min(n, N - i0)
    if n > 0:
        t = np.arange(n) / SR
        env = np.sin(np.pi * np.clip(t / 4.6, 0, 1)) ** 2
        nappe = sum(np.sin(2 * np.pi * hz(m) * t) + np.sin(2 * np.pi * hz(m) * 1.003 * t) for m in ac[:3])
        s[i0 : i0 + n] += 0.12 * env * nappe
s = reverb(s, SR, 2.4, 0.3) * montee(0.12, 20)
ecrire('reveil_soleil.wav', s, SR)

# ---------------------------------------------------------------- ambiances de nuit (22,05 kHz, 40 s en boucle sans couture)
SRN = 22050
L = 40.0
NL = int(SRN * L)
TL = np.arange(NL) / SRN
FONDU = int(SRN * 2)


def boucle(gen):
    """Génère NL + FONDU échantillons et fond la fin dans le début : boucle sans clic."""
    x = gen(NL + FONDU)
    r = np.linspace(0, 1, FONDU)
    x[:FONDU] = x[:FONDU] * r + x[NL:] * (1 - r)
    return x[:NL]


def brun(n):
    b = np.cumsum(rng.standard_normal(n))
    # retire la dérive lente
    b -= np.convolve(b, np.ones(2205) / 2205, mode='same')
    return b


# Bruit doux (bruit brun) : un souffle grave et régulier.
x = boucle(lambda n: passe_bas(brun(n), 500.0, SRN))
ecrire('nuit_brun.wav', x, SRN)

# Vagues lentes : bruit qui s'ouvre et se referme sur 8 s (5 vagues par boucle).
def vagues(n):
    t = np.arange(n) / SRN
    houle = (0.5 - 0.5 * np.cos(2 * np.pi * t / 8.0)) ** 1.6
    fc = 110 + 650 * houle
    v = passe_bas(passe_bas(rng.standard_normal(n), fc, SRN), fc * 1.5, SRN)
    v = v / np.std(v)
    fond = passe_bas(brun(n), 250.0, SRN)
    return v * (0.12 + 0.88 * houle) + 0.25 * fond / np.std(fond)


x = boucle(vagues)
ecrire('nuit_vagues.wav', x, SRN)

# Nuit calme : nappe de quatre accords (10 s chacun), fondus les uns dans les autres, très douce.
x = np.zeros(NL)
accords = [[45, 52, 57, 64], [41, 48, 57, 60], [48, 55, 60, 67], [43, 50, 55, 62]]
for k, ac in enumerate(accords):
    centre = k * 10.0 + 5.0
    d = (TL - centre + L / 2) % L - L / 2  # distance circulaire : la boucle se referme
    env = np.cos(np.clip(d / 10.0, -0.5, 0.5) * np.pi) ** 2
    for m in ac:
        # fréquences arrondies à un nombre entier de cycles par boucle (aucun clic au raccord)
        def q(f):
            return round(f * L) / L

        f = hz(m)
        x += env * (np.sin(2 * np.pi * q(f) * TL) + 0.6 * np.sin(2 * np.pi * q(f * 1.004) * TL + 1.3) + 0.15 * np.sin(2 * np.pi * q(2 * f) * TL))
x *= 0.85 + 0.15 * np.sin(2 * np.pi * TL / 20)
ecrire('nuit_calme.wav', x, SRN)
