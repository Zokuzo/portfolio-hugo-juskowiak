import * as THREE from "three"
import { t, type Lang } from "@/components/proto/dict"

/* L'ÉCRAN MÉDIA — ticket #32 : la fabrique gatée aux #23/#26, portée du
   prototype `app/prototype/ecran/` dans la coquille, BILINGUE par le
   dictionnaire (doctrine #25 — les libellés passent par `t(langue, …)`,
   les éléments décoratifs gatés — heure 23:42, ETA, stats — restent tels
   quels). La dalle 512×256 (ratio 2:1 gravé) peint sept états :
   veille (Rayquaza + CLICK HERE) · hub (tuiles GPS/MUSIQUES) · gps (carte
   façon Waze sur les bâtiments RÉELS du GLB) · musiques (maquette, le
   vrai Spotify est #33) · horloge · stats · éteint.

   Le fichier porte AUSSI la géométrie des clics : le plan de la dalle et
   la table des boutons de façade posés par Hugo au gizmo (?edit du
   prototype). PIÈGE gravé au #26 : l'axe vertical du plan pointe vers le
   BAS — le v du clic suit le dessin grâce au signe de `zoneDuClic`. */

/* les quatre playlists arrêtées au #19 (mixes Spotify, vérifiées 200 au
   build #33) et le profil pour le lien discret */
export const PLAYLISTS = [
  { nom: "yaego Radio", id: "37i9dQZF1E4vFjPhXGCpFQ", url: "https://open.spotify.com/playlist/37i9dQZF1E4vFjPhXGCpFQ" },
  { nom: "Super Eurobeat Mix", id: "37i9dQZF1EIdXhbTpFjYwG", url: "https://open.spotify.com/playlist/37i9dQZF1EIdXhbTpFjYwG" },
  { nom: "berlioz Radio", id: "37i9dQZF1E4ytDbsAetara", url: "https://open.spotify.com/playlist/37i9dQZF1E4ytDbsAetara" },
  { nom: "Lieless Radio", id: "37i9dQZF1E4wUbdv72Tm7c", url: "https://open.spotify.com/playlist/37i9dQZF1E4wUbdv72Tm7c" },
] as const
export const PROFIL_SPOTIFY = "https://open.spotify.com/user/9p0f1gx6f10segq9f4rs1cg4n"

export type ModeEcran = "veille" | "hub" | "gps" | "musiques" | "spotify" | "horloge" | "stats" | "eteint"
export type DestEcran = "maison" | "travail"

const REDUIT =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/* ---- la géométrie de la dalle et des boutons (calibrée au prototype) --- */

/* le quad Display relevé au GLB : centre et inclinaison du plan */
export const ECRAN_NATIF = {
  centre: new THREE.Vector3(-0.075, 0.785, 0.328),
  bascule: -0.28,
}
const PLAN_NORMALE = new THREE.Vector3(0, Math.sin(ECRAN_NATIF.bascule), Math.cos(ECRAN_NATIF.bascule)).normalize()
const PLAN_AXE_Y = PLAN_NORMALE.clone().cross(new THREE.Vector3(-1, 0, 0))
const PLAN = new THREE.Plane().setFromNormalAndCoplanarPoint(PLAN_NORMALE, ECRAN_NATIF.centre)

/* la vue « nez sur l'écran » du rail — RAPPROCHÉE au retour de gate #33
   (« l'écran devrait être plus zoomé ») : 20 cm dans l'axe NORMAL de la
   dalle (perpendiculaire, plus de biais) — la dalle emplit ~42 % de la
   hauteur du cadre et le panneau Spotify loge DEDANS au pixel ; les
   boutons de façade restent visibles et cliquables aux bords */
export const VUE_ECRAN = {
  cam: ECRAN_NATIF.centre
    .clone()
    .add(new THREE.Vector3(0, Math.sin(ECRAN_NATIF.bascule), Math.cos(ECRAN_NATIF.bascule)).normalize().multiplyScalar(-0.2)),
  vise: ECRAN_NATIF.centre.clone(),
}

/* boutons physiques posés main par Hugo dans ?edit (coordonnées plan) */
export type NomBouton = "power" | "media" | "suivant" | "precedent" | "map" | "setup" | "warning"
const BOUTONS: [NomBouton, number, number][] = [
  ["power", 0.091, -0.0354],
  ["media", 0.08, 0],
  ["suivant", 0.0822, 0.03],
  ["precedent", 0.0816, 0.0141],
  ["map", -0.0861, 0.0275],
  ["setup", -0.0861, 0],
  ["warning", 0, 0.0704],
]

export type Zone =
  | { type: "ecran"; u: number; v: number }
  | { type: "bouton"; nom: NomBouton }
  | { type: "molette" }
  | { type: "dehors" }

/* brouillon partagé — zéro allocation par clic */
const impact3 = new THREE.Vector3()
const rayon = new THREE.Ray()

/* Le clic en repère VOITURE (brut GLB) → la zone touchée. On projette le
   rayon caméra→point sur le plan de la dalle plutôt que le point d'impact
   lui-même : le clic peut toucher le volant ou la casquette devant. */
export function zoneDuClic(origineLocale: THREE.Vector3, pointLocal: THREE.Vector3): Zone | null {
  rayon.origin.copy(origineLocale)
  rayon.direction.copy(pointLocal).sub(origineLocale).normalize()
  const impact = rayon.intersectPlane(PLAN, impact3)
  if (!impact) return null
  const d = impact.sub(ECRAN_NATIF.centre)
  const dy = d.dot(PLAN_AXE_Y)
  /* la dalle 13×7 cm — u croît vers la droite du conducteur (monde −x),
     v suit le DESSIN (0 en haut) : l'axe du plan pointe vers le bas */
  if (Math.abs(d.x) < 0.072 && Math.abs(dy) < 0.04) {
    return { type: "ecran", u: (0.065 - d.x) / 0.13, v: (dy + 0.035) / 0.07 }
  }
  for (const [nom, bx, by] of BOUTONS) {
    if (Math.abs(d.x - bx) < 0.011 && Math.abs(dy - by) < 0.007) return { type: "bouton", nom }
  }
  /* la molette VOLUME — le bouton rotatif gauche de la façade (7e retour
     de gate #33 : « tourner la molette pour baisser le son ») ; on la
     TOURNE à la roulette, le geste du bouton rotatif à la souris */
  if (Math.abs(d.x - 0.088) < 0.016 && Math.abs(dy + 0.027) < 0.016) return { type: "molette" }
  /* frange neutre entre la façade et le dehors : un clic à quelques
     millimètres du bord ne doit pas éjecter du zoom */
  if (Math.abs(d.x) > 0.16 || Math.abs(dy) > 0.1) return { type: "dehors" }
  return null
}

/* ---- la fabrique ------------------------------------------------------- */

export type EtatSpotify = {
  enLecture: boolean
  position: number
  duree: number
  piste: number
  pistes: number
  titre: string
  volume: number
  indice: number
  repli: boolean
}

export type ClicSpotify =
  | "retour"
  | "crt"
  | "lecture"
  | "piste-prec"
  | "piste-suiv"
  | "mix-prec"
  | "mix-suiv"
  | "ouvrir"
  | "ouvrir-mix"
  | { mix: number }

export type Ecran = {
  tex: THREE.CanvasTexture
  etatDebug: () => string
  mode: () => ModeEcran
  langue: (l: Lang) => void
  bat: () => void
  veille: () => void
  hub: () => void
  gps: () => void
  musiques: () => void
  horloge: () => void
  stats: () => void
  eteint: () => void
  surDepart: (fn: (dest: DestEcran) => void) => void
  clicGps: (u: number, v: number) => "retour" | DestEcran | null
  tic: () => void
  choisit: (dest: DestEcran) => void
  spotify: () => void
  majSpotify: (maj: Partial<EtatSpotify>) => void
  majSpectre: (bandes: number[]) => void
  regleCrt: (actif: boolean) => void
  ticSpotify: (dt: number) => void
  clicSpotify: (u: number, v: number) => ClicSpotify | null
}

export function creeEcran(lang: Lang): Ecran {
  const c = document.createElement("canvas")
  c.width = 512
  c.height = 256
  const g = c.getContext("2d")!
  /* TOUTES les cotes du peintre sont calées baseline "middle" (revue :
     seul peintAmp la posait — le premier écran d'une session rendait
     décalé jusqu'au premier passage AMP) */
  g.textBaseline = "middle"
  const l = 512
  const h = 256
  const u = h / 100
  let fond: HTMLImageElement | null = null
  let quartier: HTMLImageElement | null = null
  let langue = lang
  const etat = {
    mode: "veille" as ModeEcran,
    allume: true,
    tic: 0,
    choix: null as null | DestEcran,
    transition: 0,
  }
  let quandDepart: ((dest: DestEcran) => void) | null = null
  const MAISON = () => t(langue, "gt86Maison").toUpperCase()
  const TRAVAIL = () => t(langue, "gt86Travail").toUpperCase()

  /* CONTRE LES SACCADES (5e retour de gate #31/#32) : les parties FIXES
     du dessin — fond, cadre, carte, rubans, ombres portées (shadowBlur
     est cher) — se peignent UNE FOIS par changement d'état dans des
     calques hors-écran ; chaque tic d'animation ne redessine plus que
     les points qui avancent et la jauge (~0,2 ms au lieu de la carte
     entière jusqu'à ~36×/s). */
  const fondCalque = document.createElement("canvas")
  fondCalque.width = l
  fondCalque.height = h
  const fg = fondCalque.getContext("2d")!
  let fondSale = true
  const gpsCalque = document.createElement("canvas")
  gpsCalque.width = l
  gpsCalque.height = h
  const gg = gpsCalque.getContext("2d")!
  let gpsSale = true
  const ampCalque = document.createElement("canvas")
  ampCalque.width = l
  ampCalque.height = h
  const ag = ampCalque.getContext("2d")!
  let ampSale = true
  /* l'état du player HJ·AMP (mode "spotify") — nourri par l'hôte de
     l'iframe invisible via majSpotify */
  const amp: EtatSpotify = {
    enLecture: false,
    position: 0,
    duree: 0,
    piste: 1,
    pistes: 0,
    titre: "",
    volume: 0.8,
    indice: 0,
    repli: false,
  }
  /* le VRAI spectre poussé par le moteur (7e retour) — périmé après
     250 ms, le peintre retombe alors en danse procédurale */
  const ampSpectre = new Array(19).fill(0)
  let ampSpectreMs = -1e9
  /* la surcouche VOL s'affiche 1,4 s après le dernier cran de molette */
  let ampVolMs = -1e9
  /* l'état du filtre CRT, reflété par le bouton peint du bandeau AMP
     (13e retour : le badge global seul était invisible à l'œil) */
  let crtAllume = false
  /* le DISQUE 2D (10e retour : le 3D ne prend pas) — l'angle n'avance
     que quand la musique JOUE. 11e retour : la face porte les IMAGES
     fournies par Hugo (public/amp/), détourées de leur fond blanc à la
     volée — chargées PARESSEUSEMENT à la première entrée AMP (la
     cascade de la passe 7 ne les voit jamais). */
  let disqueAngle = 0
  let kirbySprite: HTMLCanvasElement | null = null
  let kirbyLogo: HTMLCanvasElement | null = null
  let kirbyDemande = false
  const detoure = (img: HTMLImageElement, cote: number, seuil = 232): HTMLCanvasElement => {
    const cnv = document.createElement("canvas")
    cnv.width = cote
    cnv.height = Math.round((img.height / img.width) * cote)
    const cg = cnv.getContext("2d")!
    cg.drawImage(img, 0, 0, cnv.width, cnv.height)
    const donnees = cg.getImageData(0, 0, cnv.width, cnv.height)
    const d = donnees.data
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > seuil && d[i + 1] > seuil && d[i + 2] > seuil) d[i + 3] = 0
    }
    cg.putImageData(donnees, 0, 0)
    return cnv
  }
  /* les icônes du hub (12e retour : les images fournies par Hugo) —
     détourées ET adaptées à la palette : les teintes pleines glissent
     dans la bande violet→rose de l'écran, les gris/contours restent */
  let iconeGps: HTMLCanvasElement | null = null
  let iconeMusiques: HTMLCanvasElement | null = null
  const adaptePalette = (cnv: HTMLCanvasElement, eclaircit: boolean) => {
    const cg = cnv.getContext("2d")!
    const donnees = cg.getImageData(0, 0, cnv.width, cnv.height)
    const d = donnees.data
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue
      let [r, gg, b] = [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255]
      const max = Math.max(r, gg, b)
      const min = Math.min(r, gg, b)
      let l = (max + min) / 2
      const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1))
      if (eclaircit && l < 0.28) l = 0.45
      if (sat < 0.15) {
        /* gris clair désaturé = frange d'anticrénelage du fond blanc
           (les contours des icônes sont NOIRS) : dehors */
        if (l > 0.68) {
          d[i + 3] = 0
          continue
        }
        /* gris et contours : seule la clarté bouge */
        const v = Math.round(l * 255)
        d[i] = v
        d[i + 1] = v
        d[i + 2] = v
        continue
      }
      let h = 0
      if (max === r) h = ((gg - b) / (max - min)) % 6
      else if (max === gg) h = (b - r) / (max - min) + 2
      else h = (r - gg) / (max - min) + 4
      h = ((h * 60 + 360) % 360)
      /* toutes les teintes glissent dans [250 ; 330] : violet → rose */
      const h2 = (250 + (h / 360) * 80) / 360
      const c = (1 - Math.abs(2 * l - 1)) * sat
      const x = c * (1 - Math.abs(((h2 * 6) % 2) - 1))
      const m = l - c / 2
      const seg = Math.floor(h2 * 6)
      const [r2, g2, b2] = [
        [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
      ][seg % 6]
      d[i] = Math.round((r2 + m) * 255)
      d[i + 1] = Math.round((g2 + m) * 255)
      d[i + 2] = Math.round((b2 + m) * 255)
    }
    cg.putImageData(donnees, 0, 0)
    return cnv
  }
  for (const [src, eclaircit, pose] of [
    ["/amp/icone-gps.jpg", false, (c: HTMLCanvasElement) => (iconeGps = c)],
    ["/amp/icone-musiques.jpg", true, (c: HTMLCanvasElement) => (iconeMusiques = c)],
  ] as const) {
    const im = new Image()
    im.onload = () => {
      /* seuil plus dur que la galette : le halo d'anticrénelage du fond
         blanc laissait un liseré autour des icônes */
      pose(adaptePalette(detoure(im, 112, 213), eclaircit))
      if (etat.mode === "hub") peint()
    }
    im.src = src
  }
  const chargeKirby = () => {
    if (kirbyDemande) return
    kirbyDemande = true
    for (const [src, cote, pose] of [
      ["/amp/kirby-sprite.jpg", 96, (c: HTMLCanvasElement) => (kirbySprite = c)],
      ["/amp/kirby-logo.jpg", 128, (c: HTMLCanvasElement) => (kirbyLogo = c)],
    ] as const) {
      const im = new Image()
      im.onload = () => {
        pose(detoure(im, cote))
        if (etat.mode === "spotify") peint()
      }
      im.src = src
    }
  }

  let ampHorloge = 0
  const LCD_ENCRE_AMP = "#ffd9f6"
  let ampCumul = 0
  const ampCretes = new Array(19).fill(0)
  let ampNiveau = 0

  const peintFond = () => {
    if (fondSale) {
      fg.fillStyle = "#0b0d14"
      fg.fillRect(0, 0, l, h)
      if (fond) {
        fg.drawImage(fond, 0, 0, l, h)
        fg.fillStyle = "rgba(7, 9, 16, 0.42)"
        fg.fillRect(0, 0, l, h)
      }
      /* le CHROME Y2K commun (8e retour : « toute l'interface au design
         de l'AMP ») : bandeau titre à la AMP, biseau de cadre, badges —
         le fond d'écran reste, c'est le bureau qui change d'OS */
      const bandeau = fg.createLinearGradient(0, 0, l, 0)
      bandeau.addColorStop(0, "#5a2378")
      bandeau.addColorStop(0.45, "#a95fd0")
      bandeau.addColorStop(1, "#5a2378")
      fg.fillStyle = bandeau
      fg.fillRect(0, 0, l, 16)
      fg.textBaseline = "middle"
      fg.fillStyle = "#f3daff"
      fg.font = "italic bold 9px monospace"
      fg.fillText("H J · O S", 8, 8)
      for (let k = 0; k < 3; k++) {
        fg.fillStyle = "#33113f"
        fg.fillRect(l - 30 + k * 9, 5, 6, 6)
      }
      fg.font = "bold 8px monospace"
      fg.fillStyle = "#e2c8f4"
      fg.textAlign = "right"
      fg.fillText("23:42", l - 36, 8)
      fg.textAlign = "left"
      /* biseau de cadre (clair haut-gauche, sombre bas-droit) */
      fg.fillStyle = "#c9a0e4"
      fg.fillRect(0, 16, l, 1)
      fg.fillRect(0, 16, 1, h - 16)
      fg.fillStyle = "#2b1040"
      fg.fillRect(0, h - 1, l, 1)
      fg.fillRect(l - 1, 16, 1, h - 16)
      /* la rangée de badges (planche : STEREO · DOLBY · RCA) */
      fg.font = "bold 6px monospace"
      fg.fillStyle = "#9d86bd"
      fg.textAlign = "right"
      fg.fillText("STEREO · DOLBY · 44 KHZ", l - 8, h - 8)
      fg.textAlign = "left"
      fondSale = false
    }
    g.drawImage(fondCalque, 0, 0)
  }

  const tuile = (x: number, titre: string, sous: string, teinte: string, glyphe: (cx: number, cy: number, r: number) => void) => {
    /* une FENÊTRE Y2K : biseau saillant, puits sombre, icône pixel,
       libellé + sous-libellé façon explorateur de fichiers (planche) */
    const y = 26
    const la = l / 2 - 20
    const ha = h - y - 22
    const grad = g.createLinearGradient(0, y, 0, y + ha)
    grad.addColorStop(0, "#b47ad2")
    grad.addColorStop(1, "#7a3fa2")
    g.fillStyle = grad
    g.fillRect(x, y, la, ha)
    g.fillStyle = "#f0d4fc"
    g.fillRect(x, y, la, 2)
    g.fillRect(x, y, 2, ha)
    g.fillStyle = "#3a1450"
    g.fillRect(x, y + ha - 2, la, 2)
    g.fillRect(x + la - 2, y, 2, ha)
    g.fillStyle = "#150a20"
    g.fillRect(x + 6, y + 6, la - 12, ha - 44)
    const cx = x + la / 2
    const cy = y + (ha - 44) / 2 + 8
    g.strokeStyle = teinte
    g.fillStyle = teinte
    glyphe(cx, cy, (ha - 44) * 0.3)
    g.textAlign = "center"
    g.font = "bold 12px monospace"
    g.fillStyle = "#f6ecff"
    g.shadowColor = teinte
    g.shadowBlur = 4
    g.fillText(titre, cx, y + ha - 27)
    g.shadowBlur = 0
    g.font = "bold 7px monospace"
    g.fillStyle = "#2b1040"
    g.fillText(sous, cx, y + ha - 12)
    g.textAlign = "left"
  }

  /* ---- la carte GPS (gate #26), façon Waze nuit ---- */
  const ruban = (chemin: () => void, casing: string, lc: number, coeur: string, lcoeur: number) => {
    g.lineCap = "round"
    g.lineJoin = "round"
    g.beginPath()
    chemin()
    g.strokeStyle = casing
    g.lineWidth = lcoeur + lc
    g.stroke()
    g.beginPath()
    chemin()
    g.strokeStyle = coeur
    g.lineWidth = lcoeur
    g.stroke()
  }

  const pointsQuiAvancent = (chemin: () => void) => {
    /* l'astuce des points ronds : un dash quasi nul à bouts ronds */
    g.lineCap = "round"
    g.strokeStyle = "rgba(255, 252, 255, 0.9)"
    g.lineWidth = u * 2
    g.setLineDash([0.01, u * 6])
    g.lineDashOffset = -etat.tic
    g.beginPath()
    chemin()
    g.stroke()
    g.setLineDash([])
  }

  const ballon = (x: number, y: number, boutX: number, boutY: number, titre: string, teinte: string, choisi: boolean, glyphe: (cx: number, cy: number, r: number) => void) => {
    const r = u * 8.5
    g.save()
    g.shadowColor = "rgba(0, 0, 0, 0.55)"
    g.shadowBlur = u * 4
    g.shadowOffsetY = u * 1.5
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fillStyle = teinte
    g.fill()
    g.beginPath()
    g.moveTo(x - r * 0.42, y + r * 0.82)
    g.lineTo(boutX, boutY)
    g.lineTo(x + r * 0.42, y + r * 0.82)
    g.closePath()
    g.fill()
    g.restore()
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.strokeStyle = choisi ? "#ffffff" : "rgba(255, 255, 255, 0.85)"
    g.lineWidth = choisi ? u * 1.8 : u * 1.2
    g.stroke()
    g.strokeStyle = "#ffffff"
    g.fillStyle = "#ffffff"
    glyphe(x, y, r * 0.52)
    g.font = `bold ${Math.round(u * 6.5)}px monospace`
    const lt = g.measureText(titre).width
    g.beginPath()
    g.roundRect(x - lt / 2 - u * 3, y + r + u * 2.5, lt + u * 6, u * 9, u * 4.5)
    g.fillStyle = "rgba(10, 8, 22, 0.85)"
    g.fill()
    g.textAlign = "center"
    g.fillStyle = "#f2ecff"
    g.fillText(titre, x, y + r + u * 7.2)
    g.textAlign = "left"
  }

  /* les chemins de l'itinéraire — partagés entre le calque statique
     (rubans) et la couche dynamique (points qui avancent) */
  const tronc = () => {
    g.moveTo(256, 246)
    g.bezierCurveTo(252, 215, 262, 160, 274, 112)
  }
  const brancheGauche = () => {
    g.moveTo(274, 112)
    g.bezierCurveTo(240, 100, 180, 98, 116, 98)
  }
  const brancheDroite = () => {
    g.moveTo(274, 112)
    g.bezierCurveTo(320, 100, 380, 94, 436, 96)
  }

  const glypheMaison = (cx: number, cy: number, r: number) => {
    g.beginPath()
    g.moveTo(cx - r, cy + r * 0.15)
    g.lineTo(cx, cy - r * 0.85)
    g.lineTo(cx + r, cy + r * 0.15)
    g.moveTo(cx - r * 0.6, cy)
    g.lineTo(cx - r * 0.6, cy + r * 0.85)
    g.lineTo(cx + r * 0.6, cy + r * 0.85)
    g.lineTo(cx + r * 0.6, cy)
    g.stroke()
  }
  const glypheTravail = (cx: number, cy: number, r: number) => {
    g.beginPath()
    g.roundRect(cx - r * 0.85, cy - r * 0.45, r * 1.7, r * 1.25, r * 0.2)
    g.moveTo(cx - r * 0.35, cy - r * 0.45)
    g.lineTo(cx - r * 0.35, cy - r * 0.85)
    g.lineTo(cx + r * 0.35, cy - r * 0.85)
    g.lineTo(cx + r * 0.35, cy - r * 0.45)
    g.stroke()
  }

  const peintGpsStatique = () => {
    /* une carte est une SURFACE : fond opaque façon Waze nuit — et les
       bâtiments RÉELS du GLB (tools/monde/carte-quartier.mjs, 4 px/m,
       cap sud en haut) : ce qu'on voit au pare-brise EST la carte */
    g.fillStyle = "#16132a"
    g.fillRect(0, 0, l, h)
    if (quartier) g.drawImage(quartier, 0, 0, l, h)
    /* le réseau mort suit les vraies rues (boulevard sud, verticales des
       bords) — jamais empruntable */
    const morte = (chemin: () => void, large = 1) => ruban(chemin, "#100d1f", u * 1.6, "#2a2447", u * (3.2 * large))
    morte(() => {
      g.moveTo(0, 102)
      g.bezierCurveTo(170, 98, 342, 106, 512, 100)
    }, 1.5)
    morte(() => {
      g.moveTo(276, 108)
      g.bezierCurveTo(272, 70, 284, 30, 280, -8)
    })
    morte(() => {
      g.moveTo(54, 256)
      g.bezierCurveTo(58, 180, 46, 100, 52, 30)
    })
    morte(() => {
      g.moveTo(494, 256)
      g.bezierCurveTo(490, 190, 502, 120, 496, 60)
    })
    /* l'itinéraire : tronc en S puis la fourche — rubans VIOLETS (le code
       Waze de la route optimale) ; les points qui avancent vivent dans la
       couche DYNAMIQUE */
    const vive = (chemin: () => void, choisi: boolean) => {
      if (choisi) {
        g.save()
        g.shadowColor = "#a06bff"
        g.shadowBlur = u * 5
        ruban(chemin, "#0e0a1d", u * 1.6, "#b78aff", u * 4.6)
        g.restore()
      } else {
        ruban(chemin, "#0e0a1d", u * 1.6, "#8f5cff", u * 4.2)
      }
    }
    /* sans destination, la fourche n'est que des rues normales (façon
       Waze — l'itinéraire n'existe qu'après le choix) */
    if (etat.choix === null) {
      morte(tronc, 1.2)
      morte(brancheGauche, 1.2)
      morte(brancheDroite, 1.2)
    } else {
      vive(tronc, true)
      if (etat.choix === "maison") {
        morte(brancheDroite, 1.2)
        vive(brancheGauche, true)
      } else {
        morte(brancheGauche, 1.2)
        vive(brancheDroite, true)
      }
    }
    /* la voiture : flèche blanche en écusson violet */
    g.save()
    g.shadowColor = "rgba(0, 0, 0, 0.5)"
    g.shadowBlur = u * 3
    g.beginPath()
    g.arc(256, 244, u * 5.2, 0, Math.PI * 2)
    g.fillStyle = "#8f5cff"
    g.fill()
    g.restore()
    g.beginPath()
    g.arc(256, 244, u * 5.2, 0, Math.PI * 2)
    g.strokeStyle = "#ffffff"
    g.lineWidth = u * 1.2
    g.stroke()
    g.beginPath()
    g.moveTo(256, 244 - u * 3)
    g.lineTo(256 - u * 2.4, 244 + u * 2.2)
    g.lineTo(256, 244 + u * 0.8)
    g.lineTo(256 + u * 2.4, 244 + u * 2.2)
    g.closePath()
    g.fillStyle = "#ffffff"
    g.fill()
    /* le ballon n'apparaît qu'à la destination CHOISIE */
    if (etat.choix === "maison") ballon(100, 58, 116, 96, MAISON(), "#8f5cff", true, glypheMaison)
    if (etat.choix === "travail") ballon(452, 56, 436, 94, TRAVAIL(), "#e561d3", true, glypheTravail)
    /* le sélecteur : « OÙ VA-T-ON ? » + deux rangées favoris — les zones
       de clicGps sont CALQUÉES sur ce dessin */
    if (etat.choix === null) {
      const px0 = l * 0.2
      const pl = l * 0.6
      const py0 = h * 0.42
      const cadreSel = g.createLinearGradient(0, py0, 0, py0 + h * 0.5)
      cadreSel.addColorStop(0, "#b47ad2")
      cadreSel.addColorStop(1, "#7a3fa2")
      g.fillStyle = cadreSel
      g.fillRect(px0, py0, pl, h * 0.5)
      g.fillStyle = "#f0d4fc"
      g.fillRect(px0, py0, pl, 2)
      g.fillRect(px0, py0, 2, h * 0.5)
      g.fillStyle = "#3a1450"
      g.fillRect(px0, py0 + h * 0.5 - 2, pl, 2)
      g.fillRect(px0 + pl - 2, py0, 2, h * 0.5)
      g.fillStyle = "#150a20"
      g.fillRect(px0 + 4, py0 + 4, pl - 8, h * 0.5 - 8)
      g.font = `italic bold ${Math.round(u * 6.5)}px monospace`
      g.fillStyle = "#f3daff"
      g.shadowColor = "#ff64d2"
      g.shadowBlur = 3
      g.fillText(t(langue, "gt86OuVaTOn"), px0 + u * 6, py0 + h * 0.075)
      g.shadowBlur = 0
      const rangee = (ry: number, titre: string, teinte: string, glyphe: (cx: number, cy: number, r: number) => void) => {
        g.fillStyle = "#241238"
        g.fillRect(px0 + u * 4, ry, pl - u * 8, h * 0.155)
        g.fillStyle = "#4a2668"
        g.fillRect(px0 + u * 4, ry, pl - u * 8, 1)
        const cy = ry + h * 0.078
        g.beginPath()
        g.arc(px0 + u * 12, cy, u * 4.6, 0, Math.PI * 2)
        g.fillStyle = teinte
        g.fill()
        g.strokeStyle = "#ffffff"
        g.fillStyle = "#ffffff"
        glyphe(px0 + u * 12, cy, u * 2.6)
        g.font = `bold ${Math.round(u * 7)}px monospace`
        g.fillStyle = "#f2ecff"
        g.fillText(titre, px0 + u * 20, cy)
        g.textAlign = "right"
        g.font = `bold ${Math.round(u * 8)}px monospace`
        g.fillStyle = "#8d80b8"
        g.fillText("›", px0 + pl - u * 8, cy)
        g.textAlign = "left"
      }
      rangee(py0 + h * 0.115, MAISON(), "#8f5cff", glypheMaison)
      rangee(py0 + h * 0.3, TRAVAIL(), "#e561d3", glypheTravail)
    }
    /* le bandeau HJ·NAV (9e retour : le GPS rejoint le langage de l'AMP)
       — la zone retour u<0,22 × v<0,26 couvre le ‹ inchangée */
    const bandeauNav = g.createLinearGradient(0, 0, l, 0)
    bandeauNav.addColorStop(0, "#5a2378")
    bandeauNav.addColorStop(0.45, "#a95fd0")
    bandeauNav.addColorStop(1, "#5a2378")
    g.fillStyle = bandeauNav
    g.fillRect(0, 0, l, 16)
    biseau2d(g, 3, 2, 16, 12)
    g.fillStyle = "#2e1040"
    g.font = "bold 10px monospace"
    g.textAlign = "center"
    g.fillText("‹", 11, 8)
    g.textAlign = "left"
    g.fillStyle = "#f3daff"
    g.font = "italic bold 9px monospace"
    g.fillText("H J · N A V", 26, 8)
    for (let k = 0; k < 3; k++) {
      g.fillStyle = "#33113f"
      g.fillRect(l - 30 + k * 9, 5, 6, 6)
    }
    g.font = "bold 8px monospace"
    g.fillStyle = "#e2c8f4"
    g.textAlign = "right"
    g.fillText("23:42", l - 36, 8)
    g.textAlign = "left"
    /* la sélection : carte ETA façon Waze, jauge fine tenue 2,6 s */
    if (etat.choix) {
      const nom = etat.choix === "maison" ? MAISON() : TRAVAIL()
      const teinte = etat.choix === "maison" ? "#8f5cff" : "#e561d3"
      const bl = l * 0.5
      const bx = (l - bl) / 2
      const by = h * 0.74
      const cadreEta = g.createLinearGradient(0, by, 0, by + h * 0.19)
      cadreEta.addColorStop(0, "#b47ad2")
      cadreEta.addColorStop(1, "#7a3fa2")
      g.fillStyle = cadreEta
      g.fillRect(bx, by, bl, h * 0.19)
      g.fillStyle = "#f0d4fc"
      g.fillRect(bx, by, bl, 2)
      g.fillRect(bx, by, 2, h * 0.19)
      g.fillStyle = "#3a1450"
      g.fillRect(bx, by + h * 0.19 - 2, bl, 2)
      g.fillRect(bx + bl - 2, by, 2, h * 0.19)
      g.fillStyle = "#150a20"
      g.fillRect(bx + 3, by + 3, bl - 6, h * 0.19 - 6)
      g.beginPath()
      g.arc(bx + u * 9, by + h * 0.095, u * 5, 0, Math.PI * 2)
      g.fillStyle = teinte
      g.fill()
      g.beginPath()
      g.moveTo(bx + u * 9, by + h * 0.095 - u * 2.6)
      g.lineTo(bx + u * 9 - u * 2.1, by + h * 0.095 + u * 2)
      g.lineTo(bx + u * 9, by + h * 0.095 + u * 0.7)
      g.lineTo(bx + u * 9 + u * 2.1, by + h * 0.095 + u * 2)
      g.closePath()
      g.fillStyle = "#ffffff"
      g.fill()
      g.font = `bold ${Math.round(u * 7)}px monospace`
      g.fillStyle = "#f2ecff"
      g.fillText(`${t(langue, "gt86Partir").toUpperCase()} → ${nom}`, bx + u * 17, by + h * 0.062)
      g.font = `${Math.round(u * 5.5)}px monospace`
      g.fillStyle = "#a99cc8"
      g.fillText("0,4 km · 2 min", bx + u * 17, by + h * 0.128)
      g.beginPath()
      g.roundRect(bx + u * 4, by + h * 0.157, bl - u * 8, u * 1.8, u * 0.9)
      g.fillStyle = "#37305c"
      g.fill()
    }
  }

  /* le GPS servi : calque statique (photographié du canvas au premier
     dessin de l'état), puis SEULES les couches vivantes par tic */
  const peintGps = () => {
    if (gpsSale) {
      peintGpsStatique()
      gg.clearRect(0, 0, l, h)
      gg.drawImage(c, 0, 0)
      gpsSale = false
    } else {
      g.drawImage(gpsCalque, 0, 0)
    }
    if (etat.choix) {
      pointsQuiAvancent(tronc)
      pointsQuiAvancent(etat.choix === "maison" ? brancheGauche : brancheDroite)
      /* le ballon et la carte ETA repassent PAR-DESSUS les points (l'ordre
         du dessin d'origine) : on retamponne leurs zones depuis le calque */
      const bl = l * 0.5
      const bx = (l - bl) / 2
      const by = h * 0.74
      const patte = (x: number, y: number, la: number, ha: number) => {
        const px = Math.max(0, x)
        const py = Math.max(0, y)
        g.drawImage(gpsCalque, px, py, la, ha, px, py, la, ha)
      }
      patte(bx - u * 2, by - u * 2, bl + u * 4, h * 0.19 + u * 4)
      if (etat.choix === "maison") patte(56, 16, 90, 100)
      else patte(406, 14, 92, 100)
      const teinte = etat.choix === "maison" ? "#8f5cff" : "#e561d3"
      g.beginPath()
      g.roundRect(bx + u * 4, by + h * 0.157, (bl - u * 8) * etat.transition, u * 1.8, u * 0.9)
      g.fillStyle = teinte
      g.fill()
    }
  }

  const peintMusiques = () => {
    /* transitoire (8e retour : MUSIQUES va DIRECT à l'AMP — la machine ne
       s'y pose plus qu'un battement) : un splash, plus une façade */
    g.textAlign = "center"
    g.font = "italic bold 22px monospace"
    g.shadowColor = "#ff64d2"
    g.shadowBlur = 8
    g.fillStyle = LCD_ENCRE_AMP
    g.fillText("HJ·AMP", l / 2, h * 0.46)
    g.shadowBlur = 0
    g.font = "bold 8px monospace"
    g.fillStyle = "#b48cd4"
    g.fillText(t(langue, "gt86ChargerSpotify").toUpperCase(), l / 2, h * 0.62)
    g.textAlign = "left"
  }


  /* ---- HJ·AMP en texture (retour de gate #33 : « l'AMP doit s'intégrer
     à l'écran, pas une surcouche ») : la skin années 2000 se peint DANS
     la dalle 512×256 comme le hub et le GPS — le grain LCD vient du même
     coup. Calque statique (chrome, biseaux, puits, playlist) + couche
     vivante (temps, marquee, bougies, crêtes) repeinte par ticSpotify. */
  const AMP_ZONES = {
    /* v de la rangée transport, et la GRILLE PLAYLIST en pixels (7e
       retour de gate : la rangée active mordait le libellé et le bord
       du puits) — les zones de clicSpotify sont calquées sur ce dessin */
    transportV: [0.875, 1.0] as const,
    playlistY0: 158,
    playlistDY: 16,
    playlistHR: 15,
  }
  const biseau2d = (ctx: CanvasRenderingContext2D, x: number, y: number, la: number, ha: number, creux = false) => {
    ctx.fillStyle = creux ? "#160a20" : "#a95fd0"
    if (!creux) {
      const grad = ctx.createLinearGradient(0, y, 0, y + ha)
      grad.addColorStop(0, "#edc4fa")
      grad.addColorStop(0.45, "#b06ad4")
      grad.addColorStop(1, "#8e4bb0")
      ctx.fillStyle = grad
    }
    ctx.fillRect(x, y, la, ha)
    ctx.fillStyle = creux ? "#3a1548" : "#f6e0ff"
    ctx.fillRect(x, y, la, 1)
    ctx.fillRect(x, y, 1, ha)
    ctx.fillStyle = creux ? "#e2b6f4" : "#4d2064"
    ctx.fillRect(x, y + ha - 1, la, 1)
    ctx.fillRect(x + la - 1, y, 1, ha)
  }
  const peintAmpStatique = () => {
    /* le chrome plastique */
    const fondA = ag.createLinearGradient(0, 0, l * 0.4, h)
    fondA.addColorStop(0, "#d493ec")
    fondA.addColorStop(0.34, "#a95fd0")
    fondA.addColorStop(0.62, "#8a45b4")
    fondA.addColorStop(1, "#6b3193")
    ag.fillStyle = fondA
    ag.fillRect(0, 0, l, h)
    ag.textBaseline = "middle"
    /* bandeau titre */
    const bandeau = ag.createLinearGradient(0, 0, l, 0)
    bandeau.addColorStop(0, "#5a2378")
    bandeau.addColorStop(0.45, "#a95fd0")
    bandeau.addColorStop(1, "#5a2378")
    ag.fillStyle = bandeau
    ag.fillRect(0, 0, l, 18)
    biseau2d(ag, 3, 3, 16, 12)
    ag.fillStyle = "#2e1040"
    ag.font = "bold 10px monospace"
    ag.textAlign = "center"
    ag.fillText("‹", 11, 9)
    ag.textAlign = "left"
    ag.fillStyle = "#f3daff"
    ag.font = "italic bold 9px monospace"
    ag.fillText("H J · A M P", 26, 9)
    for (let k = 0; k < 3; k++) {
      ag.fillStyle = "#33113f"
      ag.fillRect(l - 30 + k * 9, 6, 6, 6)
    }
    /* puits du LCD (temps + marquee) — le marquee cède sa droite au CD */
    biseau2d(ag, 6, 22, 108, 40, true)
    biseau2d(ag, 118, 22, 290, 40, true)
    /* LE BLOC CD (9e retour : « un bloc destiné au cd ») : un puits haut
       à droite, LCD + égaliseur de haut — le disque 3D flotte devant */
    biseau2d(ag, l - 98, 22, 92, 121, true)
    ag.fillStyle = "#6a4a86"
    ag.font = "bold 6px monospace"
    ag.textAlign = "center"
    ag.fillText("CD·ROM", l - 52, 137)
    ag.textAlign = "left"
    /* puits de l'égaliseur (rétréci du bloc CD) */
    ag.fillStyle = "#f3daff"
    ag.font = "bold 8px monospace"
    ag.textAlign = "center"
    ag.fillText("E Q U A L I Z E R", 207, 70)
    ag.textAlign = "left"
    biseau2d(ag, 6, 75, 402, 68, true)
    /* PLAYLIST */
    ag.fillStyle = "#f3daff"
    ag.textAlign = "center"
    ag.fillText("P L A Y L I S T", l / 2, 151)
    ag.textAlign = "left"
    biseau2d(ag, 6, 156, l - 12, 66, true)
    /* transport */
    const ty = Math.round(h * AMP_ZONES.transportV[0]) + 3
    biseau2d(ag, 18, ty, 46, 22)
    biseau2d(ag, 70, ty, 56, 22)
    biseau2d(ag, 132, ty, 46, 22)
    biseau2d(ag, 214, ty, 62, 22)
    biseau2d(ag, 282, ty, 62, 22)
    ag.fillStyle = "#2e1040"
    ag.font = "bold 11px monospace"
    ag.textAlign = "center"
    ag.fillText("⏮", 41, ty + 11)
    ag.fillText("⏭", 155, ty + 11)
    ag.font = "bold 8px monospace"
    ag.fillText("‹ MIX", 245, ty + 11)
    ag.fillText("MIX ›", 313, ty + 11)
    ag.textAlign = "right"
    ag.fillStyle = "#f3daff"
    ag.font = "bold 8px monospace"
    ag.fillText("SPOTIFY ↗", l - 12, ty + 11)
    ag.textAlign = "left"
  }
  const peintDisque = () => {
    /* le disque PEINT dans sa baie CD·ROM (centre 460, 82, r 40) */
    const r = 40
    g.save()
    g.translate(460, 82)
    g.rotate(disqueAngle)
    g.beginPath()
    g.arc(0, 0, r, 0, Math.PI * 2)
    g.fillStyle = "#f06fb4"
    g.fill()
    for (let k = 0; k < 4; k++) {
      g.beginPath()
      g.moveTo(0, 0)
      g.arc(0, 0, r, k * 1.571 + 0.3, k * 1.571 + 1.15)
      g.closePath()
      g.fillStyle = k % 2 ? "#ff9ecb" : "#d2408e"
      g.fill()
    }
    /* l'arc holo */
    const HOLO = ["#ffb3c8", "#ffe2a8", "#c8f0b0", "#a8d8f0", "#d0b8f0"]
    for (let k = 0; k < HOLO.length; k++) {
      g.beginPath()
      g.arc(0, 0, 30 - k * 2, Math.PI * 1.05, Math.PI * 1.95)
      g.strokeStyle = HOLO[k]
      g.lineWidth = 2
      g.globalAlpha = 0.55
      g.stroke()
    }
    g.globalAlpha = 1
    /* la bande label basse */
    g.beginPath()
    g.arc(0, 0, r, 0.46, Math.PI - 0.46)
    g.closePath()
    g.fillStyle = "#120716"
    g.fill()
    g.textAlign = "center"
    g.fillStyle = "#ffd9f6"
    g.font = "bold 5px monospace"
    g.fillText("320 KBPS · 44 KHZ", 0, 28)
    g.textAlign = "left"
    /* LES IMAGES de Hugo (11e retour), détourées : le logo au-dessus du
       moyeu, le sprite à cheval sur la droite comme le pressage réf. */
    if (kirbyLogo) {
      const ll = 54
      const lh = (kirbyLogo.height / kirbyLogo.width) * ll
      g.drawImage(kirbyLogo, -ll / 2, -21 - lh / 2, ll, lh)
    }
    if (kirbySprite) {
      const sl = 34
      const sh = (kirbySprite.height / kirbySprite.width) * sl
      g.drawImage(kirbySprite, 6, -sh / 2 - 2, sl, sh)
    }
    /* moyeu : anneau blanc, trou sombre */
    g.beginPath()
    g.arc(0, 0, 12, 0, Math.PI * 2)
    g.fillStyle = "#f2f5f9"
    g.fill()
    g.beginPath()
    g.arc(0, 0, 7, 0, Math.PI * 2)
    g.fillStyle = "#0f0a18"
    g.fill()
    g.restore()
  }
  const peintAmp = () => {
    if (ampSale) {
      peintAmpStatique()
      ampSale = false
    }
    g.drawImage(ampCalque, 0, 0)
    g.textBaseline = "middle"
    /* le ⏯ suit l'état */
    const ty = Math.round(h * AMP_ZONES.transportV[0]) + 3
    g.fillStyle = "#2e1040"
    g.font = "bold 12px monospace"
    g.textAlign = "center"
    g.fillText(amp.enLecture ? "⏸" : "▶", 98, ty + 11)
    /* le bouton CRT du bandeau : biseau miniature, allumé quand le
       filtre l'est — la zone de clicSpotify est calquée dessus */
    biseau2d(g, l - 64, 3, 28, 12, !crtAllume)
    g.font = "bold 7px monospace"
    if (crtAllume) {
      g.fillStyle = "#2e1040"
    } else {
      g.fillStyle = LCD_ENCRE_AMP
      g.shadowColor = "#ff64d2"
      g.shadowBlur = 3
    }
    g.fillText("CRT", l - 50, 9)
    g.shadowBlur = 0
    g.textAlign = "left"
    /* LCD : temps réel + piste, marquee du mix */
    g.fillStyle = LCD_ENCRE_AMP
    g.shadowColor = "#ff64d2"
    g.shadowBlur = 5
    g.font = "bold 24px monospace"
    g.textAlign = "right"
    const sPos = Math.max(0, Math.floor(amp.position / 1000))
    g.fillText(`${Math.floor(sPos / 60)}:${String(sPos % 60).padStart(2, "0")}`, 108, 40)
    g.shadowBlur = 0
    g.font = "bold 8px monospace"
    g.fillStyle = "#8d6aa8"
    g.fillText(
      amp.pistes > 0
        ? `PISTE ${String(amp.piste).padStart(2, "0")}/${String(amp.pistes).padStart(2, "0")}`
        : `PISTE ${String(amp.piste).padStart(2, "0")}`,
      108,
      55,
    )
    g.textAlign = "left"
    const sDur = Math.max(0, Math.floor(amp.duree / 1000))
    const bandeauTexte = `${(amp.titre || PLAYLISTS[amp.indice].nom).toUpperCase()} · ${PLAYLISTS[amp.indice].nom.toUpperCase()} · ${Math.floor(sDur / 60)}:${String(sDur % 60).padStart(2, "0")}   `
    g.save()
    g.beginPath()
    g.rect(120, 24, 286, 20)
    g.clip()
    g.fillStyle = LCD_ENCRE_AMP
    g.shadowColor = "#ff64d2"
    g.shadowBlur = 4
    g.font = "bold 11px monospace"
    const lt = g.measureText(bandeauTexte).width
    const defile = (ampHorloge * 26) % lt
    g.fillText(bandeauTexte + bandeauTexte, 120 - defile, 34)
    g.restore()
    g.shadowBlur = 0
    g.font = "bold 7px monospace"
    g.fillStyle = "#6a4a86"
    g.fillText("320 KBPS · 44 KHZ", 122, 55)
    g.textAlign = "right"
    g.fillStyle = amp.enLecture ? LCD_ENCRE_AMP : "#6a4a86"
    g.fillText("STEREO", 404, 55)
    g.textAlign = "left"
    /* les bougies — une couleur chacune, crêtes qui retombent */
    const bx0 = 8
    const bl = 396
    const by1 = 141
    const bh = 62
    const N = 19
    const pas = bl / N
    const volActif = performance.now() - ampVolMs < 1400
    if (volActif) {
      /* la surcouche VOL — le retour de la molette, à la place de
         l'égaliseur le temps du geste (comme les vrais postes) */
      g.fillStyle = LCD_ENCRE_AMP
      g.shadowColor = "#ff64d2"
      g.shadowBlur = 5
      g.font = "bold 15px monospace"
      g.fillText(`VOL ${String(Math.round(amp.volume * 100)).padStart(3, " ")}`, 22, 96)
      g.shadowBlur = 0
      const crans = 24
      const plein = Math.round(amp.volume * crans)
      for (let k = 0; k < crans; k++) {
        const teinte = 270 + (k / (crans - 1)) * 120
        g.fillStyle = k < plein ? `hsl(${teinte}, 92%, 62%)` : "#2a1038"
        g.fillRect(22 + k * 16, 108, 11, 26)
      }
    } else {
      const spectreFrais = performance.now() - ampSpectreMs < 250
      ampNiveau += ((amp.enLecture ? 1 : 0) - ampNiveau) * 0.07
      for (let i = 0; i < N; i++) {
        let bh1: number
        if (spectreFrais) {
          /* le VRAI spectre (7e retour) — l'analyseur du moteur */
          bh1 = Math.max(1.5, ampSpectre[i] * bh)
        } else {
          const forme = 0.55 + 0.45 * Math.sin((i / N) * Math.PI * 1.4 + 0.4)
          const danse =
            0.5 +
            0.28 * Math.sin(ampHorloge * (2.1 + (i % 5) * 0.9) + i * 1.7) +
            0.22 * Math.sin(ampHorloge * (5.3 + (i % 3) * 1.3) + i * 0.6)
          bh1 = Math.max(1.5, ampNiveau * forme * danse * bh)
        }
        const teinte = 270 + (i / (N - 1)) * 120
        const grad = g.createLinearGradient(0, by1, 0, by1 - bh1)
        grad.addColorStop(0, `hsl(${teinte}, 88%, 32%)`)
        grad.addColorStop(0.55, `hsl(${teinte}, 92%, 55%)`)
        grad.addColorStop(1, `hsl(${teinte}, 100%, 78%)`)
        g.fillStyle = grad
        g.fillRect(bx0 + i * pas + 2, by1 - bh1, pas - 4, bh1)
        ampCretes[i] = Math.max(ampCretes[i] - 0.55, bh1)
        g.fillStyle = "#ffe9fb"
        g.fillRect(bx0 + i * pas + 2, by1 - ampCretes[i] - 2, pas - 4, 2)
      }
    }
    /* PLAYLIST : quatre rangées, l'active en lueur */
    g.font = "bold 10px monospace"
    if (amp.repli) {
      g.fillStyle = "#f3daff"
      g.textAlign = "center"
      g.fillText(t(langue, "gt86SpotifyBloque"), l / 2, 176)
      g.fillStyle = LCD_ENCRE_AMP
      g.fillText(`${PLAYLISTS[amp.indice].nom} ↗`, l / 2, 196)
      g.textAlign = "left"
    } else {
      for (let i = 0; i < PLAYLISTS.length; i++) {
        const haut = AMP_ZONES.playlistY0 + i * AMP_ZONES.playlistDY
        const ry = haut + Math.floor(AMP_ZONES.playlistHR / 2) + 1
        const actif = i === amp.indice
        if (actif) {
          g.fillStyle = "#3d1a55"
          g.fillRect(9, haut, l - 18, AMP_ZONES.playlistHR)
        }
        g.fillStyle = actif ? LCD_ENCRE_AMP : "#b48cd4"
        if (actif) {
          g.shadowColor = "#ff64d2"
          g.shadowBlur = 4
        }
        g.fillText(`${i + 1}. ${PLAYLISTS[i].nom}`, 14, ry)
        g.textAlign = "right"
        g.fillText(actif && amp.enLecture ? "▶" : "RADIO", l - 14, ry)
        g.textAlign = "left"
        g.shadowBlur = 0
      }
    }
    /* le disque dans sa baie, par-dessus le chrome */
    peintDisque()
  }

  const peintHorloge = () => {
    /* le LCD de l'AMP en grand : puits biseauté, digits lueur rose */
    biseau2d(g, l / 2 - 130, h * 0.28, 260, 76, true)
    g.textAlign = "center"
    g.font = `bold ${Math.round(u * 30)}px monospace`
    g.shadowColor = "#ff64d2"
    g.shadowBlur = u * 6
    g.fillStyle = LCD_ENCRE_AMP
    g.fillText("23:42", l / 2, h * 0.44)
    g.shadowBlur = 0
    g.font = "bold 8px monospace"
    g.fillStyle = "#8d6aa8"
    g.fillText(t(langue, "gt86Date").toUpperCase(), l / 2, h * 0.56)
    g.font = "bold 7px monospace"
    g.fillStyle = "#6a4a86"
    g.fillText("24 H · GMT+9 · TOKYO NIGHTS", l / 2, h * 0.75)
    g.textAlign = "left"
  }

  const peintStats = () => {
    /* les statistiques de la voiture — jauges au violet du combiné (les
       libellés font partie du dessin gaté #26) */
    peintFond()
    g.font = "italic bold 9px monospace"
    g.fillStyle = "#f3daff"
    g.fillText("S Y S T E M", 10, 24 + 8)
    const jauge = (x: number, y: number, titre: string, valeur: string, frac: number) => {
      biseau2d(g, x, y, l * 0.42, h * 0.3, true)
      g.beginPath()
      g.arc(x + u * 12, y + h * 0.15, u * 8, Math.PI * 0.75, Math.PI * 2.25)
      g.strokeStyle = "#37305c"
      g.lineWidth = u * 2.4
      g.lineCap = "round"
      g.stroke()
      g.beginPath()
      g.arc(x + u * 12, y + h * 0.15, u * 8, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * frac))
      g.strokeStyle = "#ff64d2"
      g.stroke()
      g.font = `${Math.round(u * 5.5)}px monospace`
      g.fillStyle = "#a99cc8"
      g.fillText(titre, x + u * 24, y + h * 0.1)
      g.font = `bold ${Math.round(u * 8)}px monospace`
      g.fillStyle = "#f2ecff"
      g.fillText(valeur, x + u * 24, y + h * 0.2)
    }
    jauge(u * 6, h * 0.16, "TEMP. MOTEUR", "90 °C", 0.55)
    jauge(l * 0.52, h * 0.16, "BATTERIE", "12,4 V", 0.8)
    jauge(u * 6, h * 0.55, "HUILE", "OK", 0.7)
    jauge(l * 0.52, h * 0.55, "PNEUS", "2,4 bar", 0.65)
  }

  const peint = () => {
    if (etat.mode === "eteint") {
      g.fillStyle = "#050408"
      g.fillRect(0, 0, l, h)
      tex.needsUpdate = true
      return
    }
    if (etat.mode === "stats") {
      peintStats()
      tex.needsUpdate = true
      return
    }
    peintFond()
    if (etat.mode === "gps") {
      peintGps()
    } else if (etat.mode === "spotify") {
      peintAmp()
    } else if (etat.mode === "musiques") {
      peintMusiques()
    } else if (etat.mode === "horloge") {
      peintHorloge()
    } else if (etat.mode === "veille") {
      if (etat.allume) {
        /* chrome liquide (planche) : cœur métal clair, halo rose, ombre */
        g.textAlign = "center"
        g.font = `italic bold ${Math.round(u * 16)}px monospace`
        g.fillStyle = "#1a0b28"
        g.fillText("CLICK HERE", l / 2 + 2, h * 0.52 + 2)
        const chrome = g.createLinearGradient(0, h * 0.42, 0, h * 0.6)
        chrome.addColorStop(0, "#ffffff")
        chrome.addColorStop(0.45, "#c9cdd6")
        chrome.addColorStop(0.55, "#8f95a2")
        chrome.addColorStop(1, "#e8ecf2")
        g.shadowColor = "#ff64d2"
        g.shadowBlur = u * 7
        g.fillStyle = chrome
        g.fillText("CLICK HERE", l / 2, h * 0.52)
        g.shadowBlur = 0
        g.textAlign = "left"
      }
    } else if (etat.mode === "hub") {
      const dessine = (img: HTMLCanvasElement | null) => (cx: number, cy: number, r: number) => {
        if (!img) return
        const la = r * 2.6
        const ha = (img.height / img.width) * la
        g.imageSmoothingEnabled = false
        g.drawImage(img, cx - la / 2, cy - ha / 2, la, ha)
        g.imageSmoothingEnabled = true
      }
      tuile(12, t(langue, "gt86Gps").toUpperCase(), "NAV · MAP", "#b57aff", dessine(iconeGps))
      tuile(l / 2 + 8, t(langue, "gt86Musiques").toUpperCase(), "SPOTIFY · AMP", "#f473e8", dessine(iconeMusiques))
    }
    tex.needsUpdate = true
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  /* UV du quad Display : v ∈ [1,2] (relevé au GLB brut) → Repeat
     obligatoire, flipY par défaut remet l'image à l'endroit */
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  const img = new Image()
  img.onload = () => {
    fond = img
    fondSale = true
    peint()
  }
  img.src = "/prototype/ecran-fond.jpg"
  const imgQuartier = new Image()
  imgQuartier.onload = () => {
    quartier = imgQuartier
    gpsSale = true
    peint()
  }
  imgQuartier.src = "/prototype/carte-quartier.png"
  peint()

  const passeEn = (mode: ModeEcran) => {
    etat.mode = mode
    peint()
  }

  return {
    tex,
    etatDebug: () => JSON.stringify({ ...etat, volume: amp.volume, piste: amp.piste }),
    mode: () => etat.mode,
    langue(nouvelle: Lang) {
      langue = nouvelle
      fondSale = true
      gpsSale = true
      peint()
    },
    bat() {
      if (etat.mode !== "veille") return
      etat.allume = !etat.allume
      peint()
    },
    veille() {
      etat.mode = "veille"
      etat.allume = true
      etat.choix = null
      etat.transition = 0
      gpsSale = true
      peint()
    },
    hub() {
      etat.mode = "hub"
      /* revenir au hub annule une sélection en cours (recette proto) */
      etat.choix = null
      etat.transition = 0
      gpsSale = true
      peint()
    },
    gps() {
      etat.mode = "gps"
      /* un re-rendu ne doit pas raturer un départ déjà lancé (piège #26) */
      if (etat.transition === 0) etat.choix = null
      gpsSale = true
      peint()
    },
    musiques: () => passeEn("musiques"),
    spotify: () => {
      chargeKirby()
      passeEn("spotify")
    },
    majSpotify(maj: Partial<EtatSpotify>) {
      Object.assign(amp, maj)
      if ("volume" in maj) ampVolMs = performance.now()
      if (etat.mode === "spotify") peint()
    },
    regleCrt(actif: boolean) {
      crtAllume = actif
      if (etat.mode === "spotify") peint()
    },
    /* le spectre du moteur — pas de repeinture ici : ticSpotify cadence */
    majSpectre(bandes: number[]) {
      for (let i = 0; i < 19; i++) ampSpectre[i] = bandes[i] ?? 0
      ampSpectreMs = performance.now()
    },
    /* la couche vivante du player — appelée à l'image pendant SPOTIFY,
       plafonnée par l'appelant ; ne repeint QUE si le mode est là */
    ticSpotify(dt: number) {
      ampHorloge += dt
      if (amp.enLecture) disqueAngle += dt * 2.6
      if (etat.mode !== "spotify") return
      ampCumul += dt
      if (ampCumul < 0.033) return
      ampCumul = 0
      peint()
    },
    /* zones calquées sur le dessin du peintre HJ·AMP */
    clicSpotify(u: number, v: number): ClicSpotify | null {
      if (u < 0.06 && v < 0.1) return "retour"
      /* le bouton CRT du bandeau : x ∈ [l−64 ; l−36] → u [0,875 ; 0,93] */
      if (v < 0.08 && u >= 0.86 && u < 0.945) return "crt"
      if (v >= 0.875) {
        /* frontières calées sur les x DESSINÉS des boutons (revue : le
           bord droit de ‹ MIX rendait « mix suivant ») : ⏮ 18-64,
           ⏯ 70-126, ⏭ 132-178, ‹MIX 214-276, MIX› 282-344 (sur 512) */
        if (u < 0.131) return "piste-prec"
        if (u < 0.252) return "lecture"
        if (u < 0.354) return "piste-suiv"
        if (u >= 0.41 && u < 0.545) return "mix-prec"
        if (u >= 0.545 && u < 0.68) return "mix-suiv"
        if (u >= 0.72) return "ouvrir"
        return null
      }
      if (amp.repli && v >= 0.6 && v <= 0.86) return "ouvrir-mix"
      const y = v * h
      if (!amp.repli && y >= AMP_ZONES.playlistY0 && y < AMP_ZONES.playlistY0 + 4 * AMP_ZONES.playlistDY) {
        const i = Math.floor((y - AMP_ZONES.playlistY0) / AMP_ZONES.playlistDY)
        if (i >= 0 && i < PLAYLISTS.length) return { mix: i }
      }
      return null
    },
    horloge: () => passeEn("horloge"),
    stats: () => passeEn("stats"),
    eteint: () => passeEn("eteint"),
    surDepart(fn: (dest: DestEcran) => void) {
      quandDepart = fn
    },
    /* zones CALQUÉES sur le dessin (panneau x ∈ [0,2 ; 0,8], rangée
       MAISON y ∈ [0,535 ; 0,69], TRAVAIL [0,72 ; 0,875]) */
    clicGps(uv: number, vv: number): "retour" | DestEcran | null {
      if (uv < 0.22 && vv < 0.26) return "retour"
      if (etat.choix !== null) return null
      if (uv < 0.18 || uv > 0.82) return null
      if (vv >= 0.5 && vv < 0.705) return "maison"
      if (vv >= 0.705 && vv <= 0.9) return "travail"
      return null
    },
    tic() {
      etat.tic += 1.4
      peint()
    },
    /* la sélection : la branche s'allume, la jauge se remplit en 2,6 s —
       une HORLOGE, pas un rAF (le rAF est étranglé quand la scène rame,
       piège payé au #26) — puis le départ part */
    choisit(dest: DestEcran) {
      if (etat.choix) return
      etat.choix = dest
      etat.transition = 0
      gpsSale = true
      const fini = () => {
        setTimeout(() => {
          if (quandDepart) quandDepart(dest)
        }, 450)
      }
      if (REDUIT) {
        etat.transition = 1
        peint()
        fini()
        return
      }
      const debut = performance.now()
      const pas = () => {
        if (etat.mode !== "gps" || !etat.choix) return
        etat.transition = Math.min(1, (performance.now() - debut) / 2600)
        peint()
        if (etat.transition < 1) setTimeout(pas, 40)
        else fini()
      }
      setTimeout(pas, 40)
    },
  }
}
