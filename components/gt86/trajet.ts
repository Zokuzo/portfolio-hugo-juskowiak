/* LE TRAJET du menu Need for Speed : la partition du départ,
   en secondes depuis la validation. Module PUR (ni React, ni three, ni
   DOM) : la voiture, la caméra, le compteur et le son lisent les mêmes
   courbes, et `tools/gt86/verifie.mjs` peut les assérer dans node.

     0     coup de gaz au point mort, la caisse vibre
     0,5   embrayage : la GT86 part en 1re, 50 km/h en 3 s
     3,5   passage en 2e : la poussée tombe 0,3 s, le régime retombe
     4,8   le volet en biais traverse l'écran, la carte de destination
     5,5   navigation (setTimeout de la scène, jamais la boucle d'image) */

export const TRAJET_MS = 5500
export const LANCE_S = 0.5
export const VOLET = { debut: 4.8, fin: 5.22 }

export const TOURS_ROUGE = 7000
export const TOURS_MAX = 8000
const RALENTI = 900
const COUP_DE_GAZ = 6600
/* les rapports d'une GT86 en pleine charge : vitesse au rupteur (m/s) et
   poussée (m/s²). La 2e est 1,66 fois plus longue que la 1re (boîte
   d'origine) et tire moins fort ; la dernière n'a pas de fin */
const RAPPORTS = [
  { jusqua: 14, poussee: 4.6 },
  { jusqua: 23.2, poussee: 3.2 },
]
/* débrayer, passer, ré-embrayer : la poussée tombe, le régime aussi */
const PASSAGE_S = 0.3
const CHUTE_REGIME_S = 0.08
const TOURS_PASSAGE = { bas: 3600, haut: 7300 }

/* le trajet en tronçons à poussée constante : chaque rapport, et chaque
   passage entre deux, avec la vitesse et la distance à son début */
type Troncon = { debut: number; v: number; d: number; poussee: number; rapport: number; passage: boolean }

const TRONCONS = decoupeTrajet()

function decoupeTrajet(): Troncon[] {
  const troncons: Troncon[] = []
  let t = LANCE_S
  let v = 0
  let d = 0
  RAPPORTS.forEach(({ jusqua, poussee }, i) => {
    if (i > 0) {
      troncons.push({ debut: t, v, d, poussee: 0, rapport: i + 1, passage: true })
      d += v * PASSAGE_S
      t += PASSAGE_S
    }
    troncons.push({ debut: t, v, d, poussee, rapport: i + 1, passage: false })
    const duree = (jusqua - v) / poussee
    d += v * duree + 0.5 * poussee * duree * duree
    t += duree
    v = jusqua
  })
  return troncons
}

function troncon(t: number): Troncon {
  return TRONCONS.findLast((tr) => tr.debut <= t) ?? TRONCONS[0]
}

/* l'horloge du trajet. `fige` gèle l'instant pour les captures (poignée
   window.__nfs) ; avant le premier tic de la scène, t vaut 0 */
export const trajet = { t0: -1, fige: null as number | null }

export function tempsTrajet(): number {
  if (trajet.fige !== null) return trajet.fige
  if (trajet.t0 < 0) return 0
  return (performance.now() - trajet.t0) / 1000
}

/* ce que la voiture garée applique à son porteur (rue.tsx) : zéro hors
   trajet. `caisse` ne soulève que la carrosserie (les roues restent au
   sol), `roue` est l'angle des roues, `elan` la part de vitesse atteinte */
export const avance = { z: 0, y: 0, tangage: 0, caisse: 0, roue: 0, elan: 0 }

export function distance(t: number): number {
  if (t < LANCE_S) return 0
  const tr = troncon(t)
  const u = t - tr.debut
  return tr.d + tr.v * u + 0.5 * tr.poussee * u * u
}

export function vitesse(t: number): number {
  if (t < LANCE_S) return 0
  const tr = troncon(t)
  return tr.v + tr.poussee * (t - tr.debut)
}

export const VITESSE_MAX = vitesse(VOLET.debut)

/* le rapport engagé : celui qu'on passe compte dès qu'on débraye */
export function rapport(t: number): number {
  return t < LANCE_S ? 0 : troncon(t).rapport
}

/* les secondes depuis le dernier passage de rapport, -1 avant le premier :
   la caisse, la caméra et le champ y réagissent ensemble, au même instant
   que la coupure du son */
export function passage(t: number): number {
  const dernier = TRONCONS.findLast((tr) => tr.passage && tr.debut <= t)
  return dernier ? t - dernier.debut : -1
}

/* le régime : coup de gaz vers le rupteur, embrayage qui patine en 1re,
   puis au passage la chute vers le régime que donne la 2e à cette vitesse */
export function regime(t: number): number {
  if (t < LANCE_S) return RALENTI + (COUP_DE_GAZ - RALENTI) * (1 - Math.exp(-t / 0.12))
  const tr = troncon(t)
  const enPrise = regimeEnPrise(vitesse(t), tr.rapport)
  if (!tr.passage) return enPrise
  return enPrise + (TOURS_PASSAGE.haut - enPrise) * Math.exp(-(t - tr.debut) / CHUTE_REGIME_S)
}

function regimeEnPrise(v: number, rapport: number): number {
  const { jusqua } = RAPPORTS[rapport - 1]
  if (rapport === 1) return TOURS_PASSAGE.bas + (TOURS_PASSAGE.haut - TOURS_PASSAGE.bas) * (v / jusqua)
  return TOURS_PASSAGE.haut * (v / jusqua)
}

/* 0 → 1 : la part de la vitesse de pointe atteinte, adoucie */
export function elan(t: number): number {
  const k = Math.min(1, vitesse(t) / VITESSE_MAX)
  return k * k * (3 - 2 * k)
}

/* 0 → 1 : la course du volet, lente au départ puis très rapide */
export function progresVolet(t: number): number {
  const k = Math.min(1, Math.max(0, (t - VOLET.debut) / (VOLET.fin - VOLET.debut)))
  return k * k * k
}

/* le polygone du volet pour une course k : le bord haut mène de 20 % */
export function polygoneVolet(k: number): string {
  const bas = -20 + 140 * k
  return `polygon(0 0, ${bas + 20}% 0, ${bas}% 100%, -20% 100%)`
}
