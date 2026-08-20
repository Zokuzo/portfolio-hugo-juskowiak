/* LA MACHINE À ÉTATS de l'expérience GT86 — ticket #27 de la carte #15.
   La forme est celle arrêtée par la spec d'architecture (#25) :

     CIEL ──clic──▶ ATTERRISSAGE ──▶ SEUIL ──▶ HABITACLE ──▶ {GPS, MUSIQUES}
      │              │               │           ▲            │
      └──── passer ──┴───────────────┘           └── retour ──┴─ GPS ▶ CHOIX ▶ DÉPART

   CE FICHIER EST PUR : pas un import de React, de three ni du DOM. C'est ce
   qui permet à `tools/gt86/verifie.mjs` de l'exécuter dans node et d'assérer
   la table de transitions sans navigateur — et c'est le seul endroit où
   l'enchaînement des scènes est écrit. Les composants ne décident rien : ils
   émettent des signaux.

   Les deux fonctions de session touchent `globalThis.sessionStorage` et non
   `window` : hors navigateur elles ne trouvent rien et se taisent, ce qui les
   rend testables en stubbant globalThis. */

export type Etat =
  | "CIEL"
  | "ATTERRISSAGE"
  | "SEUIL"
  | "HABITACLE"
  | "GPS"
  | "CHOIX"
  | "MUSIQUES"
  | "SPOTIFY"
  | "DEPART"

export type Dest = "/work" | "/home"

export type Scene = { etat: Etat; dest: Dest | null }

export type Signal =
  | { t: "clic" } // le clic sur la voiture flottante lance l'atterrissage
  | { t: "fini" } // un rail de caméra arrive au bout
  | { t: "passer" } // le skip discret, visible de CIEL à SEUIL
  | { t: "va"; ou: "GPS" | "MUSIQUES" }
  | { t: "choisit"; dest: Dest }
  | { t: "confirme" }
  | { t: "retour" } // ‹ et Échap : un seul chemin de sortie, jamais deux

export const ETATS: readonly Etat[] = [
  "CIEL",
  "ATTERRISSAGE",
  "SEUIL",
  "HABITACLE",
  "GPS",
  "CHOIX",
  "MUSIQUES",
  "SPOTIFY",
  "DEPART",
]

/* Les trois états où le bouton « passer » s'affiche — la spec le veut
   présent de CIEL à SEUIL, et nulle part ailleurs. */
export const INTRO: readonly Etat[] = ["CIEL", "ATTERRISSAGE", "SEUIL"]

/* Les SEULS enchaînements automatiques : un rail finit, l'état suivant tombe.
   Tout le reste attend un geste du visiteur. */
export const RAILS: Partial<Record<Etat, Etat>> = {
  ATTERRISSAGE: "SEUIL",
  SEUIL: "HABITACLE",
}

/* Les états EN POSE, où la caméra ne bouge pas : `frameloop="demand"` y
   suffit et la boucle de rendu s'arrête. Les autres sont des transitions. */
export const REPOS: ReadonlySet<Etat> = new Set<Etat>([
  "CIEL",
  "HABITACLE",
  "GPS",
  "CHOIX",
  "MUSIQUES",
  "SPOTIFY",
])

/* Un signal qui ne s'applique pas rend LA MÊME RÉFÉRENCE, pas une copie :
   le reducer ne re-rend alors rien, et la vérification peut l'assérer à
   l'identité (`===`) plutôt qu'en comparant des champs. */
export function suivant(s: Scene, g: Signal): Scene {
  switch (g.t) {
    case "clic":
      return s.etat === "CIEL" ? { etat: "ATTERRISSAGE", dest: null } : s

    case "passer":
      return INTRO.includes(s.etat) ? { etat: "HABITACLE", dest: null } : s

    case "fini": {
      const apres = RAILS[s.etat]
      return apres ? { etat: apres, dest: s.dest } : s
    }

    case "va":
      return s.etat === "HABITACLE" ? { etat: g.ou, dest: null } : s

    case "choisit":
      return s.etat === "GPS" ? { etat: "CHOIX", dest: g.dest } : s

    case "confirme":
      /* La destination traverse CHOIX → DÉPART : c'est elle que la
         navigation Next consommera à l'arrivée. */
      if (s.etat === "CHOIX") return { etat: "DEPART", dest: s.dest }
      if (s.etat === "MUSIQUES") return { etat: "SPOTIFY", dest: null }
      return s

    case "retour":
      /* DÉPART est TERMINAL : la suite est un `router.push`, pas un état —
         revenir en arrière depuis un départ en cours raturerait la
         navigation (le piège exact corrigé au #26 sur `gps()`). */
      if (s.etat === "HABITACLE" || s.etat === "DEPART") return s
      return { etat: "HABITACLE", dest: null }
  }
}

/* L'INTRO NE SE JOUE QU'UNE FOIS PAR SESSION (spec #25) : un retour
   navigateur ou une seconde visite dans le même onglet arrive directement
   à l'habitacle-hub, qui est le menu du site. */
export const CLE = "gt86-intro"

export function depart(): Scene {
  let vu = false
  try {
    vu = globalThis.sessionStorage?.getItem(CLE) === "vu"
  } catch {
    /* Safari en navigation privée jette au seul accès : l'intro se rejoue,
       ce n'est pas une raison de ne pas monter l'expérience. */
  }
  return { etat: vu ? "HABITACLE" : "CIEL", dest: null }
}

export function marqueVue(): void {
  try {
    globalThis.sessionStorage?.setItem(CLE, "vu")
  } catch {
    /* idem — l'écriture est un confort, jamais une condition */
  }
}
