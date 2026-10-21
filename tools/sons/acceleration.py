# Bande-son du trajet NFS (public/sons/acceleration-gt86.m4a) : synthèse par grains indexée sur le régime,
# depuis la pleine charge du banc dezoris (Freesound 191194, CC-BY 4.0). À relancer depuis la racine du dépôt :
#   ffmpeg -i ressources/191194__dezoris__*.mp3 -f f32le -ac 1 -ar 44100 /tmp/banc.f32
#   python3 tools/sons/acceleration.py /tmp/banc.f32 /tmp/trajet.f32
#   ffmpeg -f f32le -ar 44100 -ac 1 -i /tmp/trajet.f32 -c:a aac -b:a 96k public/sons/acceleration-gt86.m4a
import json, subprocess, sys
import numpy as np
SR = 44100
x = np.fromfile(sys.argv[1], dtype=np.float32)
sortie = sys.argv[2]

# la partition vient de components/gt86/trajet.ts elle-même, lue par node : régime échantillonné, instants des passages
PARTITION = """import('./components/gt86/trajet.ts').then((T) => {
  const temps = Array.from({ length: Math.ceil(T.TRAJET_MS / 5) + 60 }, (_, i) => i * 0.005)
  const passages = [...new Set(temps.filter((t) => T.passage(t) >= 0).map((t) => +(t - T.passage(t)).toFixed(4)))]
  console.log(JSON.stringify({ duree: T.TRAJET_MS / 1000, temps, tours: temps.map(T.regime), passages }))
})"""
P = json.loads(subprocess.run(["node", "-e", PARTITION], capture_output=True, text=True, check=True).stdout)
def regime(t): return float(np.interp(t, P["temps"], P["tours"]))

# la pleine charge : 26,0 s = 132 Hz, +13,4 Hz/s ; allumage = tr/min / 30
T0, F0, PENTE, TFIN = 26.0, 132.0, 13.4, 34.5
def source(r):
    t = T0 + (r / 30 - F0) / PENTE
    tc = min(max(t, T0), TFIN)
    rf = 30 * (F0 + PENTE * (tc - T0))
    return tc, max(0.8, r / rf)   # sous 3960 tr/min, on ralentit un peu le grain

DUREE, GRAIN, PAS = P["duree"] + 0.15, 0.11, 0.0275
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

# enveloppe : montée au coup de gaz, pied levé pendant chaque passage (0,3 s), fondu final
t = np.arange(n) / SR
env = np.clip(t / 0.06, 0, 1) * np.clip((DUREE - t) / 0.45, 0, 1)
for tp in P["passages"]:
    env *= 1 - 0.75 * np.clip((t - tp) / 0.03, 0, 1) * np.clip((tp + 0.3 - t) / 0.08, 0, 1)
y *= env
y *= 0.89 / np.max(np.abs(y))
y.astype(np.float32).tofile(sortie)
print("durée", round(DUREE, 2), "s, passages à", P["passages"])
