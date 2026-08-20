"use client"

import { useCallback, useState, useSyncExternalStore } from "react"

/* « DESKTOP CAPABLE » — la condition d'entrée dans l'expérience 3D, telle
   que la spec #25 l'arrête : pointeur fin ET viewport ≥ 1024 ET WebGL2
   créable ET pas de `prefers-reduced-motion`. Sous reduce, l'expérience est
   un cinématique : la version simple EST la bonne réponse, pas un repli.

   CE FICHIER N'IMPORTE NI THREE NI R3F, et ne doit jamais le faire : il est
   dans le paquet de la home, donc dans le chargement de TOUS les visiteurs,
   mobiles et reduce compris. Les 139 Ko de la 3D vivent derrière le
   `dynamic(ssr:false)` de la surcouche. `tools/gt86/verifie.mjs` monte la
   garde sur ce point. */

/* Le serveur ne connaît pas la capacité du visiteur — il ne PEUT pas la
   connaître. On ne devine donc rien au rendu serveur : `useSyncExternalStore`
   n'appelle que `serveur()` au SSR ET pendant la passe d'hydratation, si bien
   que le premier rendu client est identique au HTML du serveur (aucun écart
   d'hydratation possible) et que la bascule arrive au re-rendu suivant.
   Corollaire précieux : la SONDE WEBGL ne tourne ni au serveur ni pendant
   l'hydratation — aucun contexte GPU n'est créé avant que React ait fini. */
const serveur = () => false

/* Déclarées AU MODULE, jamais dans le composant : un `matchMedia()` par
   rendu produirait un nouvel objet et `subscribe` se ré-abonnerait sans fin. */
type Sondes = { fin: MediaQueryList; large: MediaQueryList; reduit: MediaQueryList }
let sondes: Sondes | null = null
function mq(): Sondes {
  if (!sondes)
    sondes = {
      fin: matchMedia("(pointer: fine)"),
      large: matchMedia("(min-width: 1024px)"),
      /* La NÉGATION de `reduce`, jamais `no-preference` : un agent qui
         ignore la caractéristique répond faux aux deux, et `no-preference`
         replierait alors tout le monde. */
      reduit: matchMedia("(prefers-reduced-motion: reduce)"),
    }
  return sondes
}

/* La sonde WebGL2, faite UNE fois et mémoïsée au module. Deux précautions :

   — le contexte de test est RELÂCHÉ tout de suite (`WEBGL_lose_context`).
     Un canvas jeté sans ça garde son slot jusqu'au passage du GC, et
     Chromium évince le contexte le PLUS ANCIEN quand la limite (~8-16) est
     atteinte : sonder sans relâcher, c'est se préparer à tuer sa propre
     scène plus tard ;
   — les attributs sont CEUX QUE R3F DEMANDERA. Une sonde plus permissive
     que le vrai contexte validerait une machine qui échouera au montage. */
let webgl2: boolean | undefined
function webgl2Creable(): boolean {
  if (webgl2 === undefined) {
    let gl: WebGL2RenderingContext | null = null
    try {
      gl = document.createElement("canvas").getContext("webgl2", {
        powerPreference: "high-performance",
        antialias: true,
        alpha: true,
      })
    } catch {
      gl = null
    }
    gl?.getExtension("WEBGL_lose_context")?.loseContext()
    webgl2 = gl !== null
  }
  return webgl2
}

/* Deux paramètres d'URL, qui sont le HARNAIS DE TEST et non des réglages :
   `?gt86=off` force l'incapacité (la version simple doit rester entière),
   `?gt86=boom` fait jeter la scène au montage (le repli doit démonter). */
export function parametre(): string | null {
  if (typeof location === "undefined") return null
  return new URLSearchParams(location.search).get("gt86")
}

/* Une fois DANS l'expérience, on n'en sort que sur `reduce`. La largeur et le
   pointeur sont des critères d'ENTRÉE : une fenêtre qu'on redimensionne autour
   de 1024 px ne doit pas détruire une cinématique en cours. */
let verrou = false

function instantane(): boolean {
  if (parametre() === "off") return false
  const s = mq()
  if (s.reduit.matches) {
    verrou = false
    return false
  }
  if (verrou) return true
  verrou = s.fin.matches && s.large.matches && webgl2Creable()
  return verrou
}

function abonne(previent: () => void): () => void {
  const s = mq()
  const l = [s.fin, s.large, s.reduit]
  for (const m of l) m.addEventListener("change", previent)
  return () => {
    for (const m of l) m.removeEventListener("change", previent)
  }
}

/** La capacité brute de la machine, réévaluée à chaud. */
export function useDesktopCapable(): boolean {
  return useSyncExternalStore(abonne, instantane, serveur)
}

/**
 * Capacité ET abandon réunis : `actif` dit si la surcouche doit être montée,
 * `abandonne()` la retire pour de bon (échec de montage, contexte perdu).
 * L'abandon est DÉFINITIF pour la page : re-tenter en boucle sur une machine
 * qui vient d'échouer produirait un clignotement au lieu d'un repli.
 */
export function useGt86(): { actif: boolean; abandonne: () => void } {
  const capable = useDesktopCapable()
  const [perdu, setPerdu] = useState(false)
  const abandonne = useCallback(() => setPerdu(true), [])
  return { actif: capable && !perdu, abandonne }
}
