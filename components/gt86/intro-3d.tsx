"use client"

import { useGt86 } from "./capable"
import Surcouche from "./surcouche"

/* L'INTRO 3D DE LA RACINE (#27). Le serveur rend la fusion, toujours :
   c'est elle qui est indexée, et c'est elle le repli. `useGt86` répond
   `false` au serveur ET pendant l'hydratation ; la surcouche se pose au
   rendu suivant si la machine est desktop capable, et se retire d'elle-même
   à la moindre erreur, la fusion étant déjà là dessous. FRÈRE DIRECT de la
   fusion, sans enveloppe : un ancêtre portant transform, filter ou
   will-change deviendrait le bloc conteneur de ses `position: fixed`. */
export function Intro3d() {
  const gt86 = useGt86()
  return gt86.actif ? <Surcouche lang="fr" surRepli={gt86.abandonne} /> : null
}
