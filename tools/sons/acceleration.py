# Bande-son du trajet NFS (public/sons/acceleration-gt86.m4a) : synthèse par grains indexée sur le régime,
# depuis la pleine charge du banc dezoris (Freesound 191194, CC-BY 4.0).
import numpy as np, sys
SR = 44100
x = np.fromfile(sys.argv[1], dtype=np.float32)
sortie = sys.argv[2]

# partition du trajet (copie de components/gt86/trajet.ts)
LANCE, ACCEL, RALENTI, GAZ = 0.5, 13, 900, 6600
RAPPORTS = [0, 12, 22, 34, 50]; BAS, HAUT = 3600, 7300
def vitesse(t): return ACCEL * max(0, t - LANCE)
def rapport(t):
    if t < LANCE: return 0
    v = vitesse(t)
    for i, b in enumerate(RAPPORTS):
        if v < b: return i
    return len(RAPPORTS) - 1
def regime(t):
    if t < LANCE: return RALENTI + (GAZ - RALENTI) * (1 - np.exp(-t / 0.12))
    g = rapport(t); b, h = RAPPORTS[g-1], RAPPORTS[g]
    return BAS + (HAUT - BAS) * (vitesse(t) - b) / (h - b)

# la pleine charge : 26,0 s = 132 Hz, +13,4 Hz/s ; allumage = tr/min / 30
T0, F0, PENTE, TFIN = 26.0, 132.0, 13.4, 34.5
def source(r):
    t = T0 + (r / 30 - F0) / PENTE
    tc = min(max(t, T0), TFIN)
    rf = 30 * (F0 + PENTE * (tc - T0))
    return tc, max(0.8, r / rf)   # sous 3960 tr/min, on ralentit un peu le grain

DUREE, GRAIN, PAS = 3.75, 0.11, 0.0275
n = int(DUREE * SR); y = np.zeros(n + SR); poids = np.zeros(n + SR)
L = int(GRAIN * SR); fen = np.hanning(L)
rng = np.random.default_rng(7)
for k in range(int(DUREE / PAS)):
    to = k * PAS
    tc, rate = source(regime(to + GRAIN / 2))
    s = (tc + rng.uniform(-0.04, 0.04)) * SR
    idx = s + np.arange(L) * rate
    g = np.interp(idx, np.arange(len(x)), x) * fen
    o = int(to * SR); y[o:o+L] += g; poids[o:o+L] += fen
y = y[:n] / np.maximum(poids[:n], 1e-3)

# enveloppe : montée au coup de gaz, coupure de 70 ms à chaque passage, fondu final
t = np.arange(n) / SR
env = np.clip(t / 0.06, 0, 1) * np.clip((DUREE - t) / 0.45, 0, 1)
for g in range(1, 4):
    v = RAPPORTS[g]; tp = LANCE + v / ACCEL
    env *= 1 - 0.7 * np.exp(-((t - tp - 0.03) / 0.035) ** 2)
y *= env
y *= 0.89 / np.max(np.abs(y))
y.astype(np.float32).tofile(sortie)
print("passages à", [round(LANCE + RAPPORTS[g] / ACCEL, 2) for g in range(1, 4)])
