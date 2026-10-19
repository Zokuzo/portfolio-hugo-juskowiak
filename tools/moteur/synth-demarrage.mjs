/* LE DÉMARRAGE SYNTHÉTISÉ (#42) : un boxer 4 cylindres qui démarre,
   calculé échantillon par échantillon et écrit en WAV mono 44,1 kHz.

     node tools/moteur/synth-demarrage.mjs /chemin/demarrage-synth.wav
     ffmpeg -i demarrage-synth.wav -af loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100 \
       -c:a aac -b:a 112k -movflags +faststart public/sons/demarrage-synth.m4a

   Rendu hors ligne plutôt qu'en direct : le site lit le même fichier que
   pour la version libre (un seul chemin de lecture), le son est identique
   dans tous les navigateurs, rien ne calcule sur le fil audio à l'entrée
   dans l'habitacle, et le spectrogramme se contrôle avant publication.

   La partition (secondes) doit rester celle de SONS.synth dans
   components/gt86/demarrage.tsx (démarreur, prise), et les régimes ses
   TOURS_LANCEUR, TOURS_COUP_DE_GAZ et TOURS_RALENTI. */

import { writeFileSync } from "node:fs"

const TAUX = 44100
const DUREE = 4.2
const DEMARREUR = 0.1
const PRISE = 0.72
const FONDU_SORTIE = 0.6
const REGIME_LANCEUR = 260
const REGIME_CRETE = 2500
const REGIME_RALENTI = 800
/* le grondement du boxer : les explosions d'un cycle (720°) ne tombent pas
   à intervalles égaux (collecteurs de longueurs inégales), en degrés */
const ALLUMAGES = [0, 196, 360, 548]

/* hasard déterministe : le même fichier à chaque rendu */
let graine = 86
const alea = () => {
  graine = (graine * 1103515245 + 12345) & 0x7fffffff
  return graine / 0x7fffffff
}

/* résonateur RBJ passe-bande : l'échappement, la caisse, l'admission */
function resonateur(frequence, q) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  const w = (2 * Math.PI * frequence) / TAUX
  const a = Math.sin(w) / (2 * q)
  const a0 = 1 + a
  const [b0, b2, a1, a2] = [a / a0, -a / a0, (-2 * Math.cos(w)) / a0, (1 - a) / a0]
  return (x) => {
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2
    x2 = x1; x1 = x; y2 = y1; y1 = y
    return y
  }
}

function passeBas(frequence) {
  let y = 0
  return (x, f = frequence) => {
    y += (1 - Math.exp((-2 * Math.PI * f) / TAUX)) * (x - y)
    return y
  }
}

/* le régime : lanceur, prise et coup de gaz jusqu'à 2 500 tr/min, retombée
   au ralenti avec une légère sous-oscillation (le ralenti qui se cherche) */
function regime(t) {
  if (t < PRISE) return REGIME_LANCEUR * Math.min(1, (t - DEMARREUR) / 0.12)
  const u = t - PRISE
  const montee = 1 - Math.exp(-u / 0.09)
  const retombee = Math.exp(-u / 0.55)
  const cherche = 60 * Math.sin(u * 5.5) * Math.exp(-u / 0.9)
  return REGIME_RALENTI + (REGIME_CRETE - REGIME_RALENTI) * montee * retombee + cherche * (1 - retombee)
}

function synthetise() {
  const n = Math.round(DUREE * TAUX)
  const sortie = new Float32Array(n)
  const echappement = resonateur(88, 3.5)
  const caisse = resonateur(240, 2.5)
  const admission = resonateur(1400, 1.2)
  const grincement = resonateur(2600, 6)
  const etouffe = passeBas(1800)
  const etouffe2 = passeBas(1800)
  const souffle = passeBas(600)
  let angle = 0
  let prochain = 0
  let compression = 0
  for (let i = 0; i < n; i++) {
    const t = i / TAUX
    if (t < DEMARREUR) continue
    const tours = regime(t)
    const avant = angle
    angle = (angle + (tours / 60) * 360 / TAUX) % 720
    const franchi = (deg) => (avant <= angle ? avant < deg && deg <= angle : deg > avant || deg <= angle)
    let impulsion = 0
    /* les explosions (après la prise) ou les compressions (au lanceur) */
    if (franchi(ALLUMAGES[prochain])) {
      impulsion = t >= PRISE ? 0.85 + 0.3 * alea() : 0
      compression = t < PRISE ? 1 : compression
      prochain = (prochain + 1) % ALLUMAGES.length
    }
    let x = 0
    if (t >= PRISE) {
      const charge = Math.min(1, (tours - REGIME_RALENTI) / (REGIME_CRETE - REGIME_RALENTI) + 0.35)
      const pet = impulsion * (36 + 24 * charge)
      x += echappement(pet + (alea() - 0.5) * 0.08) * 1.0
      x += caisse(pet * 0.6) * 0.5
      x += admission((alea() - 0.5) * charge) * 0.35
    } else {
      /* le démarreur : moteur électrique qui siffle (harmoniques de 180 Hz
         montant avec le lancement), modulé par chaque compression, et le
         pignon qui grince */
      compression *= Math.exp(-1 / (0.05 * TAUX))
      const charge = 0.2 + 0.8 * Math.sin((angle / 180) * Math.PI) ** 2
      const f = 175 + 25 * Math.min(1, (t - DEMARREUR) / 0.3)
      let bourdon = 0
      for (let h = 1; h <= 6; h++) bourdon += Math.sin(2 * Math.PI * f * h * t) / h
      x += bourdon * 0.04 * charge
      x += grincement((alea() - 0.5) * 0.15) * charge
      x += echappement(compression * 0.08) * 0.6
    }
    const coupure = 420 + tours * 0.3
    x = etouffe2(etouffe(x, coupure), coupure) + souffle((alea() - 0.5) * 0.02)
    sortie[i] = Math.tanh(x * 1.6)
  }
  const debutFondu = DUREE - FONDU_SORTIE
  for (let i = 0; i < n; i++) {
    const t = i / TAUX
    if (t > debutFondu) sortie[i] *= Math.cos(((t - debutFondu) / FONDU_SORTIE) * Math.PI / 2)
  }
  return sortie
}

function wav(echantillons) {
  const tampon = Buffer.alloc(44 + echantillons.length * 2)
  tampon.write("RIFF", 0)
  tampon.writeUInt32LE(36 + echantillons.length * 2, 4)
  tampon.write("WAVEfmt ", 8)
  tampon.writeUInt32LE(16, 16)
  tampon.writeUInt16LE(1, 20)
  tampon.writeUInt16LE(1, 22)
  tampon.writeUInt32LE(TAUX, 24)
  tampon.writeUInt32LE(TAUX * 2, 28)
  tampon.writeUInt16LE(2, 32)
  tampon.writeUInt16LE(16, 34)
  tampon.write("data", 36)
  tampon.writeUInt32LE(echantillons.length * 2, 40)
  echantillons.forEach((s, i) => tampon.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2))
  return tampon
}

const chemin = process.argv[2]
if (!chemin) throw new Error("synth-demarrage : chemin du WAV de sortie manquant")
writeFileSync(chemin, wav(synthetise()))
