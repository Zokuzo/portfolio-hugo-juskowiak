import * as THREE from "three"

/* LA PHYSIQUE DE LA CHUTE (#56, v4), sans React ni scène : le calage de
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
   l'extrait) : écran coupé, fin des obliques, début des plans a à d, la
   chute. Hugo les règle par l'URL (?calage=ecran:2.29,a:4.12,...) */
export type Calage = Record<"ecran" | "ouvre" | "a" | "b" | "c" | "d" | "tombe", number>
export const CALAGE_DEFAUT: Calage = { ecran: 2.29, ouvre: 5.74, a: 4.12, b: 7.12, c: 10.11, d: 13.13, tombe: 16.12 }
/* l'ordre que les instants doivent respecter ; « ouvre » se glisse
   n'importe où entre l'écran coupé et la chute */
const SUITE: (keyof Calage)[] = ["ecran", "a", "b", "c", "d", "tombe"]
/* le plan e de la v3 n'existe plus : une URL qui le porte encore reste
   lisible, sa valeur est ignorée */
const CLES_RETIREES = ["e"]

export function lisCalage(texte: string | null): Calage {
  if (texte === null) return CALAGE_DEFAUT
  const calage = { ...CALAGE_DEFAUT }
  for (const morceau of texte.split(",")) {
    if (!morceau.trim()) continue
    const paire = morceau.split(":").map((m) => m.trim())
    const [cle, valeur] = paire
    const v = Number(valeur)
    if (paire.length !== 2 || valeur === "" || !Number.isFinite(v) || !(Object.hasOwn(calage, cle) || CLES_RETIREES.includes(cle)))
      return refuseCalage(texte, `« ${morceau} » illisible`)
    if (Object.hasOwn(calage, cle)) calage[cle as keyof Calage] = v
  }
  const croissant = SUITE.every((cle, k) => (k === 0 ? calage[cle] > 0 : calage[SUITE[k - 1]] < calage[cle]))
  if (!croissant || !(calage.ecran < calage.ouvre && calage.ouvre <= calage.tombe))
    return refuseCalage(texte, "les instants doivent croître : 0 < ecran < a < b < c < d < tombe, ecran < ouvre <= tombe")
  return calage
}

function refuseCalage(texte: string, pourquoi: string): Calage {
  console.warn(`[gt86] ?calage=${texte} refusé (${pourquoi}) : calage par défaut`)
  return CALAGE_DEFAUT
}

/* ---- le temps ralenti ----------------------------------------------------- */

/* du clic à l'écran coupé, la voiture tombe en vitesse réelle ; dans les
   RAMPE_ECRAN dernières secondes avant l'écran coupé le temps de la
   simulation descend à RALENTI fois celui de la musique, et y reste
   pendant les plans ; à la chute il remonte à 1 en RAMPE_CHUTE, moins
   d'une seconde (v5, « la voiture doit réaccélérer »). Les
   rampes sont des smootherstep : la cadence, donc la vitesse de la
   voiture à l'écran, n'a aucune cassure */
export const RALENTI = 0.1
const RAMPE_ECRAN = 0.6
const RAMPE_CHUTE = 0.9

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

/* le ralenti s'installe de debutRalenti à l'écran coupé */
const debutRalenti = (calage: Calage) => Math.max(0, calage.ecran - RAMPE_ECRAN)

export function tempsSimule(t: number, calage: Calage): number {
  const debut = debutRalenti(calage)
  const libre = Math.min(t, debut)
  const ralentit = rampe(calage.ecran - debut, 1, RALENTI, t - debut)
  const plans = RALENTI * Math.max(0, Math.min(t, calage.tombe) - calage.ecran)
  const chute = rampe(RAMPE_CHUTE, RALENTI, 1, t - calage.tombe)
  return libre + ralentit + plans + chute + Math.max(0, t - calage.tombe - RAMPE_CHUTE)
}

export function cadence(t: number, calage: Calage): number {
  const debut = debutRalenti(calage)
  if (t < calage.ecran) return 1 + (RALENTI - 1) * douce(borne((t - debut) / (calage.ecran - debut)))
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
/* le centre de poussée glisse vers le bord d'attaque, comme sur une
   plaque qui tombe : AVANCE_POUSSEE mètres devant le centre de gravité
   quand la voiture tombe nez en premier, au centre quand elle tombe à
   plat. Le vent qui monte sous le plancher relève donc le nez, d'autant
   plus vite qu'elle tombe vite, et la plaque se stabilise à plat : nez en
   bas au plan a, elle se remet peu à peu à plat jusqu'au plan d, comme
   dans les références de Hugo (v4) */
const AVANCE_POUSSEE = 1.5
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
/* l'élan de rotation que la voiture garde de son vol quand la lévitation
   lâche (rad/s) : elle pique encore un peu (tangage), tourne sur
   elle-même (cap, autour de la verticale) et bascule sur le flanc
   (roulis, repère de la voiture). Au ralenti, c'est ce qui se voit : sans
   lui, la voiture partie du repos ne tournait que de 1,5 °/s à l'écran
   (relevé du lot 4). Le couplage gyroscopique mêle ensuite les trois axes,
   l'amortissement de l'air les éteint peu à peu */
const ROTATION_DEPART = { tangage: 0.3, cap: 0.65, roulis: -0.15 }
/* cet élan s'installe en douceur sur DEPART_S secondes de simulation (lot 8,
   « la transition au clic doit être fluide ») : immobile avant le clic, la
   voiture ne se met pas à tourner d'un coup */
const DEPART_S = 0.6

/* LA REPRISE (v5). Le retour de Hugo sur la v4 : « ça doit être assez
   rapide, et elle doit réaccélérer pour retrouver sa vitesse de chute ».
   À plat, la vraie traînée plafonne la voiture à 49 m/s, qu'elle
   n'approche qu'en plusieurs secondes : au plan 5 elle ne prenait plus
   de vitesse à l'œil. Dès « tombe », le montage triche comme au cinéma :
   la verticale suit une loi de chute à traînée quadratique, mais sous
   une gravité exagérée (`gravite`) et vers une vitesse limite de voiture
   (`limite`). L'assiette, elle, reste celle de la vraie physique */
const REPRISE = { gravite: 3.5 * G, limite: 58 }
const accelerationReprise = (vitesse: number) => -REPRISE.gravite * (1 - (vitesse / REPRISE.limite) ** 2)

/* LE CIEL. La voiture pend à l'altitude 0 au clic, 2,6 m au-dessus du
   sommet de la mer de nuages (-2,6), et tombe en vitesse réelle jusqu'à
   l'écran coupé : près de 20 m. Pour qu'elle tombe de haut sans
   traverser la nappe, la nappe descend avec elle (nappeDuCiel) : vue
   d'une caméra qui ne la suit qu'à moitié, elle file vers une mer de
   nuages lointaine. À l'écran coupé, la nappe reprend sa place ; à
   chaque coupe la voiture remonte (rien ne se voit pendant une coupe
   franche ; le plan large prolonge l'intro sans coupe, lot 8 : la nappe
   la suit jusqu'au plan a, première coupe) pour finir chaque plan à Y_FIN_PLAN, haut au-dessus de la
   nappe, et la chute part de Y_CHUTE. Le plafond de nuages (sommet 8)
   monte de HAUSSE_PLAFOND dès l'écran coupé pour laisser la place, et de
   HAUSSE_PLAFOND_CHUTE à « tombe » : la reprise (v5) part de plus haut,
   le plafond garde au-dessus de la caméra l'écart de la v4. Le
   voile blanchit l'écran avant qu'elle n'entre dans le banc ; la
   bascule vers la rue se fait quand elle est à Y_BASCULE, voile plein */
const Y_FIN_PLAN = 28
const Y_CHUTE = 92
const Y_BASCULE = -6
const HAUSSE_PLAFOND = 60
const HAUSSE_PLAFOND_CHUTE = 105

/* LA RUE : la même chute se poursuit à H_BASCULE au-dessus du garage.
   Elle y entre avec l'assiette et les vitesses de rotation du ciel (cap
   excepté : la rue la pose dans l'axe de sa place). De la v2 sont repris
   le rétablissement vers le plat du toucher (ASSIETTE_TOUCHER) et
   l'atterrissage souple, freiné dans les FREIN.hauteur derniers mètres
   jusqu'à FREIN.vitesse. Ce freinage n'a rien de réaliste (une voiture
   ne freine pas en l'air), c'est le parti de la v2 que Hugo a validé,
   allégé au lot 8 pour un impact franc. Il entre en douceur sur
   FREIN.rampe mètres, puis tient une décélération résolue par dichotomie
   pour toucher pile à FREIN.vitesse. Le rétablissement est un ressort
   critique sur le tangage et le roulis (pulsation STABILISATION). */
const H_BASCULE = 30
/* la rue la reçoit à V_RUE au plus (m/s, sa vitesse de la v3) : venue de
   plus haut, elle tombe deux fois plus vite, et la rue n'aurait plus le
   temps de s'ouvrir. Le banc, voile plein, cache ce freinage */
const V_RUE = 21
const ASSIETTE_TOUCHER = -0.04
const STABILISATION = 3.2
/* lot 8, « il faut qu'elle tombe plus violemment » : elle touche à
   14 m/s (2,6 en v4), freinée moins longtemps */
const FREIN = { hauteur: 16, vitesse: 14, rampe: 3 }
/* après le toucher, la suspension : un écrasement franc (`ecrasement`
   mètres), un rebond qui la soulève, l'assiette qui s'amortit vers le
   plat */
const SUSPENSION = { pulsation: 14, amorti: 4, plongeon: 0.09, ecrasement: 0.17 }
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
   ressort amorti (pulsation, amortissement) : elle la voit partir et
   prend du retard (SUIVI_CIEL) ; la visée suit sur un ressort plus raide. En
   rue, la caméra freine pour s'arrêter CAMERA_FREIN.hauteur mètres plus
   bas, au-dessus de la voiture posée */
const RESSORT_CAMERA = { pulsation: 3.2, amorti: 0.75 }
const RESSORT_VISEE = { pulsation: 9, amorti: 1 }
const CAMERA_FREIN = { hauteur: 16, rampe: 4 }
/* dans le ciel (v5), le ressort de la caméra ne vise que SUIVI_CIEL fois
   la vitesse de la voiture : son retard grandit avec la vitesse, la
   voiture qui réaccélère s'éloigne d'elle vers les nuages au lieu de
   rester figée dans le cadre (retard établi : 2 amorti (1 - SUIVI_CIEL)
   v / pulsation, 9 m à 55 m/s) */
const SUIVI_CIEL = 0.65

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
  const elan = new THREE.Vector3(0, ROTATION_DEPART.cap, 0)
    .applyQuaternion(attitude.clone().invert())
    .add(new THREE.Vector3(ROTATION_DEPART.tangage, 0, ROTATION_DEPART.roulis))
  const omega = new THREE.Vector3()
  const rue: EtatRue = { tangage: 0, vTangage: 0, roulis: 0, vRoulis: 0 }
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
        vitesse = Math.max(vitesse, -V_RUE)
      }
    }
    if (s < DEPART_S) omega.addScaledVector(elan, douce(borne((s + PAS_S) / DEPART_S)) - douce(s / DEPART_S))
    if (kBascule < 0) {
      const physique = avanceCiel(attitude, omega, vitesse, s)
      vitesse += PAS_S * (s >= sChute ? accelerationReprise(vitesse) : physique)
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
  /* la poussée au centre de poussée : r x F */
  couple.set(0, 0, -AVANCE_POUSSEE * vent.z).cross(moment.copy(vent).multiplyScalar(trainee))
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

/* la bascule se fait voile plein : la rue reprend l'assiette du ciel et
   ses vitesses de rotation */
const euler = new THREE.Euler()
function entreeRue(attitude: THREE.Quaternion, omega: THREE.Vector3): EtatRue {
  euler.setFromQuaternion(attitude, "YXZ")
  return { tangage: euler.x, vTangage: omega.x, roulis: euler.z, vRoulis: omega.z }
}

/* le rétablissement : ressort critique vers l'assiette du toucher, la
   turbulence par-dessus */
function stabiliseRue(rue: EtatRue, vitesse: number, s: number) {
  const pression = 0.5 * RHO_AIR * vitesse * vitesse
  const w2 = STABILISATION * STABILISATION
  rue.vTangage += PAS_S * (-w2 * (rue.tangage - ASSIETTE_TOUCHER) - 2 * STABILISATION * rue.vTangage + (pression * TURBULENCE.x * bruit(s, 0)) / INERTIE.x)
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
  let enRue = false
  for (let j = 0; j < n; j++) {
    const t = calage.tombe + j * PAS_S
    zCamera[j] = camera.z
    zVisee[j] = visee.z
    const voiture = voitureVerticale(p, t)
    if (!enRue && t >= p.tBascule) {
      /* la bascule est une coupe, voile plein : la voiture passe à V_RUE,
         la caméra et sa visée la reprennent à sa hauteur et à sa vitesse,
         sans le retard du ciel */
      enRue = true
      Object.assign(camera, voiture)
      Object.assign(visee, voiture)
    }
    const hauteur = H_BASCULE + camera.z - p.zBascule
    const suivie = enRue ? voiture : { z: voiture.z, v: SUIVI_CIEL * voiture.v }
    const ressort = suitRessort(camera, suivie, RESSORT_CAMERA)
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
export type Segment = "ciel" | "large" | "a" | "b" | "c" | "d" | "chute" | "rue"
const DEBUTS: [Segment, keyof Calage][] = [["large", "ecran"], ["a", "a"], ["b", "b"], ["c", "c"], ["d", "d"], ["chute", "tombe"]]

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

/* le plan large prolonge l'intro sans coupe : jusqu'au plan a, la voiture
   et la nappe restent où la chute les mène */
const finIntro = (p: Partition) => p.calage.a

/* LA PLONGÉE de l'intro (lot 9, « on voit la voiture tomber à une vitesse
   folle, de l'espace, puis elle ralentit ») : de la mise en scène, pas de
   la physique. Au-dessus de la chute simulée, la voiture descend encore
   de `hauteur` mètres entre le clic et l'écran coupé, vite au départ
   (l'exposant tire le pic de vitesse vers le début), à l'arrêt quand le
   ralenti s'installe. La nappe la suit, mais se creuse de `creux` mètres
   sous elle au plus fort de la plongée puis remonte à sa rencontre quand
   elle ralentit (au clic comme à l'écran coupé, elle est à sa place : le
   clic ne fait rien sauter) ; le plafond, lui, reste où il est et file
   vers le haut */
const PLONGEE = { hauteur: 160, exposant: 0.7, creux: 45 }

/* le chemin parcouru par la plongée, de 0 au clic à 1 à l'écran coupé */
export const progresPlongee = (p: Partition, t: number) => douce(borne(t / p.calage.ecran) ** PLONGEE.exposant)

/* le décalage vertical de la plongée (négatif : elle descend) */
export const plongee = (p: Partition, t: number) => (t < finIntro(p) ? -PLONGEE.hauteur * progresPlongee(p, t) : 0)

/* la vitesse de la plongée, de 0 à 1 (1 : son pic) */
export function elanPlongee(p: Partition, t: number) {
  const d = 1 / 120
  const vitesse = (plongee(p, t - d) - plongee(p, t + d)) / (2 * d)
  return Math.min(1, vitesse / ((2.2 * PLONGEE.hauteur) / p.calage.ecran))
}

/* la remontée du ciel : 0 jusqu'au plan a, puis de quoi finir chaque
   plan à Y_FIN_PLAN, et partir de Y_CHUTE */
export function decalageCiel(p: Partition, t: number) {
  if (t < finIntro(p)) return plongee(p, t)
  if (t >= p.calage.tombe) return Y_CHUTE - p.zChute
  return Y_FIN_PLAN - echantillonne(p.z, tempsSimule(finDeSegment(p, t), p.calage), p.kToucher)
}

/* le décalage vertical de la mer de nuages : jusqu'au plan a, elle
   descend avec la voiture, creusée pendant la plongée */
export const nappeDuCiel = (p: Partition, t: number) =>
  t < finIntro(p) ? altitudeCiel(p, t) - PLONGEE.creux * Math.sin(Math.PI * progresPlongee(p, t)) : 0

/* le décalage vertical du plafond de nuages : il monte à la coupe du plan
   a, et encore à celle de « tombe » */
export const plafondDuCiel = (p: Partition, t: number) => (t < finIntro(p) ? 0 : t < p.calage.tombe ? HAUSSE_PLAFOND : HAUSSE_PLAFOND_CHUTE)

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
    const avantBascule = s < p.kBascule * PAS_S
    return {
      hauteur: H_BASCULE + echantillonne(p.z, s, kFin) - p.zBascule,
      tangage: avantBascule ? p.tangageRue[p.kBascule] : echantillonne(p.tangageRue, s, kFin),
      roulis: avantBascule ? p.roulisRue[p.kBascule] : echantillonne(p.roulisRue, s, kFin),
      toucher: -1,
    }
  }
  const apres = t - p.tToucher
  const amorti = Math.exp(-SUSPENSION.amorti * apres)
  const rebond = amorti * Math.sin(SUSPENSION.pulsation * apres)
  return {
    hauteur: -SUSPENSION.ecrasement * rebond,
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
