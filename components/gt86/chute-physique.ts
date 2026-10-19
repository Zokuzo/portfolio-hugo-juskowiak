import * as THREE from "three"

/* LA PHYSIQUE DE LA CHUTE (#56, v3), sans React ni scène : le calage de
   Hugo, le temps ralenti, la voiture en corps rigide, la caméra sur
   ressort. Tout est intégré UNE fois, au premier usage, en pas fixes
   (PAS_S) : la même trajectoire à toute cadence, et la même sous
   l'horloge simulée des captures que chez Hugo. Les composants ne font
   qu'échantillonner ces tables.

   Le retour de Hugo sur la v2 : « la chute n'est pas assez naturelle ».
   Plus de pose interpolée ni de vitesse limite en tanh plaquée sur une
   courbe écrite : la gravité, la traînée et le couple aérodynamique
   tirent la voiture, du clic au toucher. Pendant les plans, le temps de
   la simulation est ralenti (RALENTI) ; il remonte à 1 à la chute. */

/* ---- le calage ------------------------------------------------------------ */

/* les instants du montage, en secondes depuis le clic (= temps dans
   l'extrait) : écran coupé, fin des obliques, début des plans a à e, la
   chute. Hugo les règle par l'URL (?calage=ecran:0.91,a:1.62,...) */
export type Calage = Record<"ecran" | "ouvre" | "a" | "b" | "c" | "d" | "e" | "tombe", number>
export const CALAGE_DEFAUT: Calage = { ecran: 0.91, ouvre: 2.9, a: 1.62, b: 4.62, c: 7.61, d: 10.63, e: 12, tombe: 13.01 }
/* l'ordre que les instants doivent respecter ; « ouvre » se glisse
   n'importe où entre l'écran coupé et la chute */
const SUITE: (keyof Calage)[] = ["ecran", "a", "b", "c", "d", "e", "tombe"]

export function lisCalage(texte: string | null): Calage {
  if (texte === null) return CALAGE_DEFAUT
  const calage = { ...CALAGE_DEFAUT }
  for (const morceau of texte.split(",")) {
    if (!morceau.trim()) continue
    const paire = morceau.split(":").map((m) => m.trim())
    const [cle, valeur] = paire
    const v = Number(valeur)
    if (paire.length !== 2 || !Object.hasOwn(calage, cle) || valeur === "" || !Number.isFinite(v))
      return refuseCalage(texte, `« ${morceau} » illisible`)
    calage[cle as keyof Calage] = v
  }
  const croissant = SUITE.every((cle, k) => (k === 0 ? calage[cle] >= 0 : calage[SUITE[k - 1]] < calage[cle]))
  if (!croissant || !(calage.ecran < calage.ouvre && calage.ouvre <= calage.tombe) || calage.tombe < RAMPE_CLIC)
    return refuseCalage(texte, `les instants doivent croître : ecran < a < b < c < d < e < tombe, ecran < ouvre <= tombe, tombe >= ${RAMPE_CLIC}`)
  return calage
}

function refuseCalage(texte: string, pourquoi: string): Calage {
  console.warn(`[gt86] ?calage=${texte} refusé (${pourquoi}) : calage par défaut`)
  return CALAGE_DEFAUT
}

/* ---- le temps ralenti ----------------------------------------------------- */

/* le temps de la simulation avance à RALENTI fois le temps de la musique
   pendant les plans : au clic il y descend en RAMPE_CLIC (« la voiture
   ralentit dans les airs »), à la chute il remonte à 1 en RAMPE_CHUTE.
   Les rampes sont des smootherstep : la cadence, donc la vitesse de la
   voiture à l'écran, n'a aucune cassure */
export const RALENTI = 0.1
const RAMPE_CLIC = 0.3
const RAMPE_CHUTE = 0.8

/* smootherstep : vitesse et accélération nulles aux deux bouts */
export const douce = (u: number) => u * u * u * (u * (6 * u - 15) + 10)
/* la progression linéaire de a à b, bornée à [0, 1] */
export const lisse = (a: number, b: number, t: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))
/* l'intégrale de douce sur [0, u] */
const douceIntegree = (u: number) => u * u * u * u * (u * (u - 3) + 2.5)
const borne = (u: number) => Math.min(1, Math.max(0, u))

/* l'intégrale d'une rampe douce de r0 à r1, sur `duree`, jusqu'à `ecoule` */
function rampe(duree: number, r0: number, r1: number, ecoule: number) {
  const u = borne(ecoule / duree)
  return duree * (r0 * u + (r1 - r0) * douceIntegree(u))
}

export function tempsSimule(t: number, calage: Calage): number {
  const clic = rampe(RAMPE_CLIC, 1, RALENTI, t)
  const plans = RALENTI * Math.max(0, Math.min(t, calage.tombe) - RAMPE_CLIC)
  const chute = rampe(RAMPE_CHUTE, RALENTI, 1, t - calage.tombe)
  return clic + plans + chute + Math.max(0, t - calage.tombe - RAMPE_CHUTE)
}

export function cadence(t: number, calage: Calage): number {
  if (t < RAMPE_CLIC) return 1 + (RALENTI - 1) * douce(borne(t / RAMPE_CLIC))
  return RALENTI + (1 - RALENTI) * douce(borne((t - calage.tombe) / RAMPE_CHUTE))
}

/* l'instant musical où la simulation atteint s (croissante : dichotomie) */
function instantDe(s: number, calage: Calage) {
  let bas = 0
  let haut = calage.tombe + RAMPE_CHUTE + s + 1
  for (let k = 0; k < 60; k++) {
    const milieu = (bas + haut) / 2
    if (tempsSimule(milieu, calage) < s) bas = milieu
    else haut = milieu
  }
  return haut
}

/* ---- la voiture : un corps rigide dans l'air -------------------------------- */

/* repère du GLB : x vers le conducteur, y en haut, z vers le nez. Le
   tangage positif pique du nez (la convention de vol.tsx et ciel.tsx) */
const G = 9.81
const RHO_AIR = 1.225
const MASSE = 1250
/* les trois faces que le vent relatif peut prendre de front, leur aire
   (m²) et leur coefficient de traînée : le plancher, plat et large, freine
   bien plus que la face avant profilée. À plat, la vitesse limite vaut
   sqrt(2 m g / (rho Cx A)) = 49 m/s ; nez en bas, 160 m/s */
const PLANCHER = { aire: 7.6, cx: 1.1 }
const FACE_AVANT = { aire: 1.95, cx: 0.4 }
const FLANC = { aire: 3.4, cx: 0.9 }
/* le centre de poussée, derrière le centre de gravité : le vent qui monte
   sous le plancher soulève l'arrière, la voiture tend à se mettre nez en
   bas */
const RECUL_POUSSEE = 0.6
/* les inerties d'une coupé de 1 250 kg (kg m²), en tangage, lacet, roulis */
const INERTIE = new THREE.Vector3(1900, 2100, 520)
/* l'amortissement aérodynamique des rotations : un couple -k |v| omega
   par axe (N m s² / rad / m) */
const AMORTI_AERO = new THREE.Vector3(55, 55, 18)
/* la turbulence : un couple proportionnel à la pression dynamique (m³ ;
   N m par Pa), modulé par un bruit lisse (sommes de sinus de fréquences
   incommensurables, en secondes de simulation : déterministe) */
const TURBULENCE = new THREE.Vector3(1.6, 1.4, 0.45)
const TURBULENCE_FREQUENCES = [4.1, 9.7, 17.3]
/* l'élan de rotation au moment où la lévitation lâche (rad/s) : elle se
   redresse un peu de son piqué (tangage et roulis, repère de la voiture)
   et prend un lent cap (autour de la verticale), comme la v2, mais par
   son inertie ; l'aéro reprend ensuite la main */
const ROTATION_DEPART = { tangage: -0.22, cap: 0.3, roulis: 0.04 }

/* LE CIEL. La voiture pend à l'altitude 0 au clic ; à chaque coupe elle
   remonte (rien ne se voit pendant une coupe franche) pour finir chaque
   plan à Y_FIN_PLAN : le sommet de la mer de nuages (-2,6) ne la touche
   jamais en pleine vue, et la caméra de contre-plongée reste dans le
   clair. Elle quitte le dernier plan (e) à Y_CHUTE, l'altitude de la v2.
   Le voile blanchit l'écran avant qu'elle n'entre dans le banc ; la
   bascule vers la rue se fait quand elle est à Y_BASCULE, voile plein */
const Y_FIN_PLAN = 1.5
const Y_CHUTE = 4.65
const Y_BASCULE = -5

/* LA RUE : la même chute se poursuit à H_BASCULE au-dessus du garage.
   De la v2 sont repris : l'assiette d'entrée (ASSIETTE_RUE) que l'aéro
   rétablit vers le plat du toucher, et l'atterrissage souple, freiné
   dans les FREIN.hauteur derniers mètres jusqu'à FREIN.vitesse. Ce
   freinage n'a rien de réaliste (une voiture ne freine pas en l'air),
   c'est le parti de la v2 que Hugo a validé : il entre en douceur sur
   FREIN.rampe mètres, puis tient une décélération résolue par dichotomie
   pour toucher pile à FREIN.vitesse. Le rétablissement est un ressort
   critique sur le tangage et le roulis (pulsation STABILISATION). */
const H_BASCULE = 30
const ASSIETTE_RUE = { tangage: 0.5, toucher: -0.04 }
const STABILISATION = 3.2
const FREIN = { hauteur: 14, vitesse: 2.6, rampe: 3 }
/* après le toucher, la suspension de la v2 : une compression, un petit
   rebond, l'assiette qui s'amortit vers le plat */
const SUSPENSION = { pulsation: 16, amorti: 5, plongeon: 0.05 }
/* la pose après le toucher, avant de rendre la main au seuil (plus que
   le ressort de la rue, TASSE_DUREE 1,2 s, qui reste ainsi au repos) */
const POSE_S = 1.3

/* les roues pendent : la lévitation lâche, la suspension se détend de
   DETENTE mètres, en oscillant un peu (en temps de simulation) */
const DETENTE = { course: 0.055, pulsation: 2 * Math.PI * 1.5, amorti: 0.35 }

export const PAS_S = 1 / 600
const DUREE_MAX_S = 60

/* ---- la caméra de la chute : un ressort sur la verticale ---------------- */

/* de la marque « tombe » à la fin, la caméra suit la voiture sur un
   ressort amorti (pulsation, amortissement) : elle la voit partir, prend
   du retard, la rattrape ; la visée suit sur un ressort plus raide. En
   rue, la caméra freine pour s'arrêter CAMERA_FREIN.hauteur mètres plus
   bas, au-dessus de la voiture posée */
const RESSORT_CAMERA = { pulsation: 3.2, amorti: 0.75 }
const RESSORT_VISEE = { pulsation: 9, amorti: 1 }
const CAMERA_FREIN = { hauteur: 16, rampe: 4 }

/* ---- la partition ----------------------------------------------------------- */

export type Partition = {
  calage: Calage
  /* la trace de la voiture, par pas de simulation */
  z: Float64Array
  vz: Float64Array
  q: Float64Array
  tangageRue: Float64Array
  roulisRue: Float64Array
  kBascule: number
  kToucher: number
  zChute: number
  zBascule: number
  /* la caméra et sa visée, par pas de musique depuis « tombe » */
  zCamera: Float64Array
  zVisee: Float64Array
  /* en temps musical */
  tBascule: number
  tToucher: number
  tFini: number
}

/* `pique` : le tangage de la pose du ciel, d'où elle part */
export function partitionDe(calage: Calage, pique: number): Partition {
  const voiture = simuleVoiture(calage, pique)
  const tBascule = instantDe(voiture.kBascule * PAS_S, calage)
  const tToucher = instantDe(voiture.kToucher * PAS_S, calage)
  const tFini = tToucher + POSE_S
  const p = { calage, ...voiture, tBascule, tToucher, tFini, zCamera: new Float64Array(0), zVisee: new Float64Array(0) }
  Object.assign(p, simuleCamera(p))
  return p
}

type EtatRue = { tangage: number; vTangage: number; roulis: number; vRoulis: number }

function simuleVoiture(calage: Calage, pique: number) {
  const n = Math.ceil(DUREE_MAX_S / PAS_S)
  const z = new Float64Array(n)
  const vz = new Float64Array(n)
  const q = new Float64Array(4 * n)
  const tangageRue = new Float64Array(n)
  const roulisRue = new Float64Array(n)
  const sChute = tempsSimule(calage.tombe, calage)

  const attitude = new THREE.Quaternion().setFromEuler(new THREE.Euler(pique, 0, 0, "YXZ"))
  const omega = new THREE.Vector3(0, ROTATION_DEPART.cap, 0)
    .applyQuaternion(attitude.clone().invert())
    .add(new THREE.Vector3(ROTATION_DEPART.tangage, 0, ROTATION_DEPART.roulis))
  const rue: EtatRue = { tangage: ASSIETTE_RUE.tangage, vTangage: 0, roulis: 0, vRoulis: 0 }
  let altitude = 0
  let vitesse = 0
  let zChute = Number.NaN
  let zBascule = Number.NaN
  let kBascule = -1
  let frein: Freinage | null = null
  let k = 0
  for (; k < n; k++) {
    const s = k * PAS_S
    z[k] = altitude
    vz[k] = vitesse
    q.set([attitude.x, attitude.y, attitude.z, attitude.w], 4 * k)
    tangageRue[k] = rue.tangage
    roulisRue[k] = rue.roulis

    if (kBascule < 0) {
      if (s >= sChute && Number.isNaN(zChute)) zChute = altitude
      if (!Number.isNaN(zChute) && Y_CHUTE + altitude - zChute <= Y_BASCULE) {
        kBascule = k
        zBascule = altitude
        Object.assign(rue, entreeRue(attitude, omega))
      }
    }
    if (kBascule < 0) {
      vitesse += PAS_S * avanceCiel(attitude, omega, vitesse, s)
    } else {
      const hauteur = H_BASCULE + altitude - zBascule
      if (hauteur <= 0) break
      stabiliseRue(rue, vitesse, s)
      if (!frein && hauteur <= FREIN.hauteur) frein = resousFreinage(hauteur, vitesse, accelerationRue(rue, vitesse), -FREIN.vitesse, FREIN.rampe)
      vitesse += PAS_S * (frein ? accelerationFreinee(frein, hauteur) : accelerationRue(rue, vitesse))
    }
    altitude += PAS_S * vitesse
  }
  return { z, vz, q, tangageRue, roulisRue, kBascule, kToucher: k, zChute, zBascule }
}

/* un pas de corps rigide dans le ciel : le couple tourne la voiture (repère
   de la voiture, gyroscopique compris), la traînée rend l'accélération
   verticale */
const vent = new THREE.Vector3()
const couple = new THREE.Vector3()
const moment = new THREE.Vector3()
const inverse = new THREE.Quaternion()
const derivee = new THREE.Quaternion()

function avanceCiel(attitude: THREE.Quaternion, omega: THREE.Vector3, vitesse: number, s: number): number {
  /* le vent relatif vient d'en dessous (la voiture tombe), dans son repère */
  vent.set(0, Math.sign(-vitesse) || 1, 0).applyQuaternion(inverse.copy(attitude).invert())
  const pression = 0.5 * RHO_AIR * vitesse * vitesse
  const trainee = pression * aireEffective(Math.abs(vent.y), Math.abs(vent.z), Math.abs(vent.x))
  /* la poussée au centre de poussée, (0, 0, -RECUL) : r x F */
  couple.set(0, 0, -RECUL_POUSSEE).cross(moment.copy(vent).multiplyScalar(trainee))
  couple.x += pression * TURBULENCE.x * bruit(s, 0) - AMORTI_AERO.x * Math.abs(vitesse) * omega.x
  couple.y += pression * TURBULENCE.y * bruit(s, 1) - AMORTI_AERO.y * Math.abs(vitesse) * omega.y
  couple.z += pression * TURBULENCE.z * bruit(s, 2) - AMORTI_AERO.z * Math.abs(vitesse) * omega.z
  /* I dw/dt = couple - w x (I w) */
  couple.sub(moment.copy(omega).multiply(INERTIE).crossVectors(omega, moment))
  omega.addScaledVector(couple.divide(INERTIE), PAS_S)
  /* dq/dt = q (0, w) / 2 */
  derivee.set(omega.x, omega.y, omega.z, 0).premultiply(attitude)
  attitude.set(
    attitude.x + 0.5 * PAS_S * derivee.x,
    attitude.y + 0.5 * PAS_S * derivee.y,
    attitude.z + 0.5 * PAS_S * derivee.z,
    attitude.w + 0.5 * PAS_S * derivee.w,
  ).normalize()
  return -G + (Math.sign(-vitesse) * trainee) / MASSE
}

/* l'aire freinante, Cx compris : chaque face pèse selon le cosinus entre
   sa normale et le vent */
const aireEffective = (plancher: number, avant: number, flanc: number) =>
  PLANCHER.cx * PLANCHER.aire * plancher + FACE_AVANT.cx * FACE_AVANT.aire * avant + FLANC.cx * FLANC.aire * flanc

/* un bruit lisse dans [-1, 1], un par axe */
function bruit(s: number, axe: number) {
  let somme = 0
  for (let i = 0; i < TURBULENCE_FREQUENCES.length; i++)
    somme += Math.sin(TURBULENCE_FREQUENCES[i] * s + 1.7 * axe + 2.3 * i * (axe + 1))
  return somme / TURBULENCE_FREQUENCES.length
}

/* la bascule se fait voile plein : l'assiette de la rue reprend celle de
   la v2, ses vitesses de rotation celles du ciel */
const euler = new THREE.Euler()
function entreeRue(attitude: THREE.Quaternion, omega: THREE.Vector3): EtatRue {
  euler.setFromQuaternion(attitude, "YXZ")
  return { tangage: ASSIETTE_RUE.tangage, vTangage: omega.x, roulis: euler.z, vRoulis: omega.z }
}

/* le rétablissement : ressort critique vers l'assiette du toucher, la
   turbulence par-dessus */
function stabiliseRue(rue: EtatRue, vitesse: number, s: number) {
  const pression = 0.5 * RHO_AIR * vitesse * vitesse
  const w2 = STABILISATION * STABILISATION
  rue.vTangage += PAS_S * (-w2 * (rue.tangage - ASSIETTE_RUE.toucher) - 2 * STABILISATION * rue.vTangage + (pression * TURBULENCE.x * bruit(s, 0)) / INERTIE.x)
  rue.vRoulis += PAS_S * (-w2 * rue.roulis - 2 * STABILISATION * rue.vRoulis + (pression * TURBULENCE.z * bruit(s, 2)) / INERTIE.z)
  rue.tangage += PAS_S * rue.vTangage
  rue.roulis += PAS_S * rue.vRoulis
}

function accelerationRue(rue: EtatRue, vitesse: number) {
  const aire = aireEffective(Math.abs(Math.cos(rue.tangage) * Math.cos(rue.roulis)), Math.abs(Math.sin(rue.tangage)), Math.abs(Math.sin(rue.roulis)))
  return -G + (0.5 * RHO_AIR * vitesse * vitesse * aire) / MASSE
}

/* ---- un freinage vertical en douceur -------------------------------------- */

/* depuis `hauteur` à `vitesse` (négative, elle descend) et `acceleration`,
   l'accélération glisse en smootherstep sur `rampe` mètres vers une
   décélération constante, choisie pour arriver à 0 à `arrivee` */
type Freinage = { hauteur: number; acceleration: number; cible: number; rampe: number }

function accelerationFreinee(f: Freinage, hauteur: number) {
  return THREE.MathUtils.lerp(f.acceleration, f.cible, douce(borne((f.hauteur - hauteur) / f.rampe)))
}

function resousFreinage(hauteur: number, vitesse: number, acceleration: number, arrivee: number, rampe: number): Freinage {
  const f = { hauteur, acceleration, cible: 0, rampe }
  let bas = -100
  let haut = 2000
  for (let k = 0; k < 50; k++) {
    f.cible = (bas + haut) / 2
    if (vitesseAuSol(f, vitesse) < arrivee) bas = f.cible
    else haut = f.cible
  }
  f.cible = haut
  return f
}

/* la vitesse en touchant 0 ; 0 si le freinage l'arrête avant */
function vitesseAuSol(f: Freinage, vitesse: number) {
  let h = f.hauteur
  let v = vitesse
  while (h > 0) {
    v += PAS_S * accelerationFreinee(f, h)
    if (v >= 0) return 0
    h += PAS_S * v
  }
  return v
}

/* ---- la caméra, en temps musical depuis « tombe » ------------------------ */

function simuleCamera(p: Omit<Partition, "zCamera" | "zVisee">) {
  const { calage } = p
  const n = Math.ceil((p.tFini + 1 - calage.tombe) / PAS_S)
  const zCamera = new Float64Array(n)
  const zVisee = new Float64Array(n)
  const depart = voitureVerticale(p, calage.tombe)
  const camera = { z: depart.z, v: depart.v }
  const visee = { z: depart.z, v: depart.v }
  let frein: Freinage | null = null
  for (let j = 0; j < n; j++) {
    const t = calage.tombe + j * PAS_S
    zCamera[j] = camera.z
    zVisee[j] = visee.z
    const voiture = voitureVerticale(p, t)
    const hauteur = H_BASCULE + camera.z - p.zBascule
    const ressort = suitRessort(camera, voiture, RESSORT_CAMERA)
    if (!frein && t >= p.tBascule && hauteur <= CAMERA_FREIN.hauteur)
      frein = resousFreinage(hauteur, camera.v, ressort, 0, CAMERA_FREIN.rampe)
    camera.v = frein ? Math.min(0, camera.v + PAS_S * accelerationFreinee(frein, hauteur)) : camera.v + PAS_S * ressort
    visee.v += PAS_S * suitRessort(visee, voiture, RESSORT_VISEE)
    camera.z += PAS_S * camera.v
    visee.z += PAS_S * visee.v
  }
  return { zCamera, zVisee }
}

type Vertical = { z: number; v: number }

function suitRessort(suiveur: Vertical, cible: Vertical, r: { pulsation: number; amorti: number }) {
  return r.pulsation * r.pulsation * (cible.z - suiveur.z) + 2 * r.amorti * r.pulsation * (cible.v - suiveur.v)
}

/* l'altitude de simulation de la voiture et sa vitesse en temps musical
   (posée après le toucher) */
function voitureVerticale(p: Omit<Partition, "zCamera" | "zVisee">, t: number): Vertical {
  if (t >= p.tToucher) return { z: p.z[p.kToucher - 1], v: 0 }
  const s = tempsSimule(t, p.calage)
  return { z: echantillonne(p.z, s, p.kToucher), v: echantillonne(p.vz, s, p.kToucher) * cadence(t, p.calage) }
}

/* ---- la lecture ------------------------------------------------------------- */

export function echantillonne(table: Float64Array, s: number, fin: number) {
  const x = Math.max(0, s / PAS_S)
  const k = Math.min(fin - 2, Math.floor(x))
  return THREE.MathUtils.lerp(table[k], table[k + 1], Math.min(1, x - k))
}

/* les segments du montage, pour le bandeau de calage et les plans */
export type Segment = "ciel" | "large" | "a" | "b" | "c" | "d" | "e" | "chute" | "rue"
const DEBUTS: [Segment, keyof Calage][] = [["large", "ecran"], ["a", "a"], ["b", "b"], ["c", "c"], ["d", "d"], ["e", "e"], ["chute", "tombe"]]

export function segmentDe(p: Partition, t: number): Segment {
  if (t >= p.tBascule) return "rue"
  let segment: Segment = "ciel"
  for (const [nom, cle] of DEBUTS) if (t >= p.calage[cle]) segment = nom
  return segment
}

/* l'instant de fin du segment de plan en cours (le suivant du calage) */
export function finDeSegment(p: Partition, t: number) {
  for (const [, cle] of DEBUTS) if (t < p.calage[cle]) return p.calage[cle]
  return p.calage.tombe
}

/* la remontée du ciel : 0 avant l'écran coupé, puis de quoi finir chaque
   plan à Y_FIN_PLAN, et partir de Y_CHUTE */
export function decalageCiel(p: Partition, t: number) {
  if (t < p.calage.ecran) return 0
  if (t >= p.calage.e) return Y_CHUTE - p.zChute
  return Y_FIN_PLAN - echantillonne(p.z, tempsSimule(finDeSegment(p, t), p.calage), p.kToucher)
}

/* l'assiette du ciel (sans le cap fixe de ciel.tsx), figée à la bascule */
const avant = new THREE.Quaternion()
export function attitudeCiel(p: Partition, s: number, out: THREE.Quaternion) {
  const x = Math.min(p.kBascule, Math.max(0, s / PAS_S))
  const k = Math.min(p.kBascule - 1, Math.floor(x))
  return out.fromArray(p.q, 4 * (k + 1)).slerp(avant.fromArray(p.q, 4 * k), 1 - Math.min(1, x - k))
}

/* la hauteur de la voiture de la rue au-dessus de sa place, et son
   assiette ; après le toucher, la suspension de la v2 */
export function poseRue(p: Partition, t: number) {
  if (t < p.tToucher) {
    const s = tempsSimule(t, p.calage)
    const kFin = p.kToucher
    return {
      hauteur: H_BASCULE + echantillonne(p.z, s, kFin) - p.zBascule,
      tangage: s < p.kBascule * PAS_S ? ASSIETTE_RUE.tangage : echantillonne(p.tangageRue, s, kFin),
      roulis: s < p.kBascule * PAS_S ? 0 : echantillonne(p.roulisRue, s, kFin),
      toucher: -1,
    }
  }
  const apres = t - p.tToucher
  const amorti = Math.exp(-SUSPENSION.amorti * apres)
  const rebond = amorti * Math.sin(SUSPENSION.pulsation * apres)
  return {
    hauteur: -(FREIN.vitesse / SUSPENSION.pulsation) * rebond,
    tangage: p.tangageRue[p.kToucher - 1] * amorti + SUSPENSION.plongeon * rebond,
    roulis: p.roulisRue[p.kToucher - 1] * amorti,
    toucher: apres,
  }
}

/* la hauteur de la caméra et de sa visée, par rapport à la voiture posée
   (rue) ou dans le repère de la simulation (ciel) */
export function verticaleCamera(p: Partition, t: number, monde: "ciel" | "rue") {
  const depuis = t - p.calage.tombe
  const camera = echantillonne(p.zCamera, depuis, p.zCamera.length)
  const visee = echantillonne(p.zVisee, depuis, p.zVisee.length)
  const base = monde === "ciel" ? Y_CHUTE - p.zChute : H_BASCULE - p.zBascule
  return { camera: base + camera, visee: base + visee }
}

/* l'altitude affichée de la voiture du ciel */
export function altitudeCiel(p: Partition, t: number) {
  return decalageCiel(p, t) + echantillonne(p.z, tempsSimule(t, p.calage), p.kToucher)
}

/* la détente des roues, en mètres, au temps de simulation s */
export function detenteRoues(s: number) {
  const { course, pulsation, amorti } = DETENTE
  const pseudo = pulsation * Math.sqrt(1 - amorti * amorti)
  const e = Math.exp(-amorti * pulsation * s)
  return course * (1 - e * (Math.cos(pseudo * s) + ((amorti * pulsation) / pseudo) * Math.sin(pseudo * s)))
}
