/* LE TRAJET du menu Need for Speed : la partition du départ,
   en secondes depuis la validation. Module PUR (ni React, ni three, ni
   DOM) : la voiture, la caméra, le compteur et le son lisent les mêmes
   courbes, et `tools/gt86/verifie.mjs` peut les assérer dans node.

     0     coup de gaz au point mort, la caisse vibre
     0,5   embrayage : la GT86 part, rapports en dents de scie
     2,9   le volet en biais traverse l'écran, la carte de destination
     3,6   navigation (setTimeout de la scène, jamais la boucle d'image) */

export const TRAJET_MS = 3600
export const LANCE_S = 0.5
export const VOLET = { debut: 2.9, fin: 3.32 }
/* l'accélération : ~41 m en 2,5 s, on reste dans la partie éclairée */
const ACCEL = 13
export const VITESSE_MAX = ACCEL * (VOLET.debut - LANCE_S)

export const TOURS_ROUGE = 7000
export const TOURS_MAX = 8000
const RALENTI = 900
const COUP_DE_GAZ = 6600
/* les rapports, bornés en m/s : 1re jusqu'à 12, 2e jusqu'à 22, 3e jusqu'à 34 */
const RAPPORTS = [0, 12, 22, 34, 50]
const TOURS_PASSAGE = { bas: 3600, haut: 7300 }

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
  const u = Math.max(0, t - LANCE_S)
  return 0.5 * ACCEL * u * u
}

export function vitesse(t: number): number {
  return ACCEL * Math.max(0, t - LANCE_S)
}

export function rapport(t: number): number {
  if (t < LANCE_S) return 0
  const v = vitesse(t)
  const i = RAPPORTS.findIndex((borne) => v < borne)
  return i < 0 ? RAPPORTS.length - 1 : i
}

/* les secondes depuis le dernier passage de rapport (montée en 2e, 3e...),
   -1 avant le premier : la caisse, la caméra et le champ y réagissent
   ensemble, au même instant que la dent de scie du son */
export function passage(t: number): number {
  let dernier = -1
  for (let i = 1; i < RAPPORTS.length - 1; i++) {
    const instant = LANCE_S + RAPPORTS[i] / ACCEL
    if (t >= instant) dernier = instant
  }
  return dernier < 0 ? -1 : t - dernier
}

/* le régime : coup de gaz qui monte vers le rupteur, puis la dent de
   scie des rapports (chute au passage, remontée avec la vitesse) */
export function regime(t: number): number {
  if (t < LANCE_S) return RALENTI + (COUP_DE_GAZ - RALENTI) * (1 - Math.exp(-t / 0.12))
  const g = rapport(t)
  const bas = RAPPORTS[g - 1]
  const haut = RAPPORTS[g]
  const k = (vitesse(t) - bas) / (haut - bas)
  return TOURS_PASSAGE.bas + (TOURS_PASSAGE.haut - TOURS_PASSAGE.bas) * k
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
