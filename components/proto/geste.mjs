/* ==================================================================
   L'ARITHMÉTIQUE DU GESTE (#12) — pur, sans DOM, prouvé au node --test
   (tools/voiture/geste.test.mjs). nb et pose arrivent en paramètres :
   les constantes vivent dans voiture.tsx avec leur doctrine, ce module
   ne fait que compter juste.
   ================================================================== */

/* Le second `+ nb` couvre les valeurs négatives, que le `%` de
   JavaScript propagerait — le même garde structurel que l'index du
   scroll dans voiture.tsx. */
export const mod = (i, nb) => ((i % nb) + nb) % nb

/* L'image la plus proche d'un azimut continu : l'aimantation au cran
   de 360/nb degrés, ajustement ≤ un demi-cran — sous ce que le
   ticket 18 a montré invisible en mouvement. */
export const azimutVersIndex = (azimutDeg, nb) => mod(Math.round(azimutDeg / (360 / nb)), nb)

/* L'offset en crans qui fait persister l'angle laissé par la main :
   le delta entre le cran du relâchement et la pose de départ. Le terme
   de ressort a disparu avec la rotation au scroll (#13) : le scroll ne
   dicte plus d'azimut, l'angle posé est l'angle affiché. */
export const offsetAuRelachement = (azimutDeg, { nb, pose }) =>
  mod(Math.round(azimutDeg / (360 / nb)) - pose, nb)
