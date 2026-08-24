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

export type ModeEcran = "veille" | "hub" | "gps" | "musiques" | "horloge" | "stats" | "eteint"
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

/* la vue « nez sur l'écran » du rail (repère brut du GLB, prototype #23) */
export const VUE_ECRAN = {
  cam: new THREE.Vector3(-0.075, 0.9, -0.05),
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
  /* frange neutre entre la façade et le dehors : un clic à quelques
     millimètres du bord ne doit pas éjecter du zoom */
  if (Math.abs(d.x) > 0.16 || Math.abs(dy) > 0.1) return { type: "dehors" }
  return null
}

/* ---- la fabrique ------------------------------------------------------- */

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
}

export function creeEcran(lang: Lang): Ecran {
  const c = document.createElement("canvas")
  c.width = 512
  c.height = 256
  const g = c.getContext("2d")!
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

  const peintFond = () => {
    g.fillStyle = "#0b0d14"
    g.fillRect(0, 0, l, h)
    if (fond) {
      g.drawImage(fond, 0, 0, l, h)
      g.fillStyle = "rgba(7, 9, 16, 0.42)"
      g.fillRect(0, 0, l, h)
    }
    g.strokeStyle = "#2b2440"
    g.lineWidth = Math.max(2, u * 1.2)
    g.strokeRect(u * 2, u * 2, l - u * 4, h - u * 4)
    g.textBaseline = "middle"
    g.font = `${Math.round(u * 8)}px monospace`
    g.fillStyle = "#b7a8d8"
    g.textAlign = "right"
    g.fillText("23:42", l - u * 8, u * 10)
    g.textAlign = "left"
  }

  const tuile = (x: number, titre: string, teinte: string, glyphe: (cx: number, cy: number, r: number) => void) => {
    const y = u * 20
    const la = l / 2 - u * 12
    const ha = h - y - u * 12
    g.beginPath()
    g.roundRect(x, y, la, ha, u * 4)
    g.fillStyle = "rgba(16, 12, 28, 0.7)"
    g.fill()
    g.strokeStyle = teinte
    g.lineWidth = u * 1.4
    g.stroke()
    const cx = x + la / 2
    const cy = y + ha * 0.42
    g.strokeStyle = teinte
    g.fillStyle = teinte
    glyphe(cx, cy, ha * 0.2)
    g.textAlign = "center"
    g.font = `bold ${Math.round(u * 9)}px monospace`
    g.fillStyle = "#efe8fb"
    g.fillText(titre, cx, y + ha * 0.82)
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

  const peintGps = () => {
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
       Waze de la route optimale), points blancs qui avancent */
    const tronc = () => {
      g.moveTo(256, 246)
      g.bezierCurveTo(252, 215, 262, 160, 274, 112)
    }
    const gauche = () => {
      g.moveTo(274, 112)
      g.bezierCurveTo(240, 100, 180, 98, 116, 98)
    }
    const droite = () => {
      g.moveTo(274, 112)
      g.bezierCurveTo(320, 100, 380, 94, 436, 96)
    }
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
      pointsQuiAvancent(chemin)
    }
    /* sans destination, la fourche n'est que des rues normales (façon
       Waze — l'itinéraire n'existe qu'après le choix) */
    if (etat.choix === null) {
      morte(tronc, 1.2)
      morte(gauche, 1.2)
      morte(droite, 1.2)
    } else {
      vive(tronc, true)
      if (etat.choix === "maison") {
        morte(droite, 1.2)
        vive(gauche, true)
      } else {
        morte(gauche, 1.2)
        vive(droite, true)
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
      g.save()
      g.shadowColor = "rgba(0, 0, 0, 0.55)"
      g.shadowBlur = u * 5
      g.beginPath()
      g.roundRect(px0, py0, pl, h * 0.5, u * 5)
      g.fillStyle = "#221c40"
      g.fill()
      g.restore()
      g.font = `bold ${Math.round(u * 6.5)}px monospace`
      g.fillStyle = "#a99cc8"
      g.fillText(t(langue, "gt86OuVaTOn"), px0 + u * 6, py0 + h * 0.075)
      const rangee = (ry: number, titre: string, teinte: string, glyphe: (cx: number, cy: number, r: number) => void) => {
        g.beginPath()
        g.roundRect(px0 + u * 4, ry, pl - u * 8, h * 0.155, u * 3)
        g.fillStyle = "#2c2452"
        g.fill()
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
    /* chrome flottant : retour en cercle, horloge en pilule */
    g.save()
    g.shadowColor = "rgba(0, 0, 0, 0.5)"
    g.shadowBlur = u * 3
    g.beginPath()
    g.arc(u * 9, u * 10, u * 6, 0, Math.PI * 2)
    g.fillStyle = "#221c40"
    g.fill()
    g.beginPath()
    g.roundRect(l - u * 26, u * 4.5, u * 22, u * 11, u * 5.5)
    g.fill()
    g.restore()
    g.textAlign = "center"
    g.font = `bold ${Math.round(u * 9)}px monospace`
    g.fillStyle = "#e8def8"
    g.fillText("‹", u * 9, u * 10.5)
    g.font = `${Math.round(u * 6.5)}px monospace`
    g.fillText("23:42", l - u * 15, u * 10.5)
    g.textAlign = "left"
    /* la sélection : carte ETA façon Waze, jauge fine tenue 2,6 s */
    if (etat.choix) {
      const nom = etat.choix === "maison" ? MAISON() : TRAVAIL()
      const teinte = etat.choix === "maison" ? "#8f5cff" : "#e561d3"
      const bl = l * 0.5
      const bx = (l - bl) / 2
      const by = h * 0.74
      g.save()
      g.shadowColor = "rgba(0, 0, 0, 0.55)"
      g.shadowBlur = u * 4
      g.beginPath()
      g.roundRect(bx, by, bl, h * 0.19, u * 5)
      g.fillStyle = "#221c40"
      g.fill()
      g.restore()
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
      g.roundRect(bx + u * 4, by + h * 0.163, bl - u * 8, u * 1.8, u * 0.9)
      g.fillStyle = "#37305c"
      g.fill()
      g.beginPath()
      g.roundRect(bx + u * 4, by + h * 0.163, (bl - u * 8) * etat.transition, u * 1.8, u * 0.9)
      g.fillStyle = teinte
      g.fill()
    }
  }

  const peintMusiques = () => {
    /* le lecteur en maquette — le vrai Spotify arrive avec #33 */
    g.save()
    g.shadowColor = "rgba(0, 0, 0, 0.55)"
    g.shadowBlur = u * 5
    g.beginPath()
    g.roundRect(l * 0.09, h * 0.2, l * 0.82, h * 0.62, u * 5)
    g.fillStyle = "rgba(20, 15, 38, 0.88)"
    g.fill()
    g.restore()
    if (fond) g.drawImage(fond, 128, 0, 256, 256, l * 0.12, h * 0.27, h * 0.48, h * 0.48)
    g.strokeStyle = "#8f5cff"
    g.lineWidth = u * 1.2
    g.strokeRect(l * 0.12, h * 0.27, h * 0.48, h * 0.48)
    g.font = `bold ${Math.round(u * 7.5)}px monospace`
    g.fillStyle = "#f2ecff"
    g.fillText(t(langue, "gt86RienNeJoue"), l * 0.4, h * 0.34)
    g.font = `${Math.round(u * 5.5)}px monospace`
    g.fillStyle = "#a99cc8"
    g.fillText(t(langue, "gt86SpotifyArrive"), l * 0.4, h * 0.44)
    g.beginPath()
    g.roundRect(l * 0.4, h * 0.55, l * 0.46, u * 2, u)
    g.fillStyle = "#37305c"
    g.fill()
    g.beginPath()
    g.roundRect(l * 0.4, h * 0.55, l * 0.12, u * 2, u)
    g.fillStyle = "#8f5cff"
    g.fill()
    const bt = (x: number, dessin: () => void) => {
      g.beginPath()
      g.arc(x, h * 0.7, u * 6, 0, Math.PI * 2)
      g.fillStyle = "#2c2452"
      g.fill()
      g.fillStyle = "#e8def8"
      dessin()
    }
    bt(l * 0.5, () => {
      g.beginPath()
      g.moveTo(l * 0.5 - u, h * 0.7 - u * 2.4)
      g.lineTo(l * 0.5 - u, h * 0.7 + u * 2.4)
      g.lineTo(l * 0.5 - u * 3, h * 0.7)
      g.closePath()
      g.fill()
      g.fillRect(l * 0.5 + u * 0.6, h * 0.7 - u * 2.4, u * 1.1, u * 4.8)
    })
    bt(l * 0.63, () => {
      g.beginPath()
      g.moveTo(l * 0.63 - u * 1.6, h * 0.7 - u * 2.6)
      g.lineTo(l * 0.63 - u * 1.6, h * 0.7 + u * 2.6)
      g.lineTo(l * 0.63 + u * 2.6, h * 0.7)
      g.closePath()
      g.fill()
    })
    bt(l * 0.76, () => {
      g.beginPath()
      g.moveTo(l * 0.76 + u, h * 0.7 - u * 2.4)
      g.lineTo(l * 0.76 + u, h * 0.7 + u * 2.4)
      g.lineTo(l * 0.76 + u * 3, h * 0.7)
      g.closePath()
      g.fill()
      g.fillRect(l * 0.76 - u * 1.7, h * 0.7 - u * 2.4, u * 1.1, u * 4.8)
    })
  }

  const peintHorloge = () => {
    g.textAlign = "center"
    g.font = `bold ${Math.round(u * 30)}px monospace`
    g.shadowColor = "#9b5cff"
    g.shadowBlur = u * 8
    g.fillStyle = "#efe6ff"
    g.fillText("23:42", l / 2, h * 0.48)
    g.shadowBlur = 0
    g.font = `${Math.round(u * 7)}px monospace`
    g.fillStyle = "#b7a8d8"
    g.fillText(t(langue, "gt86Date"), l / 2, h * 0.68)
    g.textAlign = "left"
  }

  const peintStats = () => {
    /* les statistiques de la voiture — jauges au violet du combiné (les
       libellés font partie du dessin gaté #26) */
    g.fillStyle = "#16132a"
    g.fillRect(0, 0, l, h)
    g.font = `bold ${Math.round(u * 7)}px monospace`
    g.fillStyle = "#a99cc8"
    g.fillText("GT86 — STATS", u * 6, u * 10)
    const jauge = (x: number, y: number, titre: string, valeur: string, frac: number) => {
      g.save()
      g.shadowColor = "rgba(0, 0, 0, 0.5)"
      g.shadowBlur = u * 3
      g.beginPath()
      g.roundRect(x, y, l * 0.42, h * 0.3, u * 4)
      g.fillStyle = "#221c40"
      g.fill()
      g.restore()
      g.beginPath()
      g.arc(x + u * 12, y + h * 0.15, u * 8, Math.PI * 0.75, Math.PI * 2.25)
      g.strokeStyle = "#37305c"
      g.lineWidth = u * 2.4
      g.lineCap = "round"
      g.stroke()
      g.beginPath()
      g.arc(x + u * 12, y + h * 0.15, u * 8, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * frac))
      g.strokeStyle = "#8f5cff"
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
    } else if (etat.mode === "musiques") {
      peintMusiques()
    } else if (etat.mode === "horloge") {
      peintHorloge()
    } else if (etat.mode === "veille") {
      if (etat.allume) {
        g.textAlign = "center"
        g.font = `bold ${Math.round(u * 15)}px monospace`
        g.shadowColor = "#9b5cff"
        g.shadowBlur = u * 6
        g.fillStyle = "#d8beff"
        g.fillText("CLICK HERE", l / 2, h * 0.52)
        g.shadowBlur = 0
        g.textAlign = "left"
      }
    } else if (etat.mode === "hub") {
      tuile(u * 8, t(langue, "gt86Gps").toUpperCase(), "#b57aff", (cx, cy, r) => {
        g.lineWidth = u * 1.6
        g.beginPath()
        g.arc(cx, cy, r * 0.75, 0, Math.PI * 2)
        g.stroke()
        g.beginPath()
        g.arc(cx, cy, r * 0.22, 0, Math.PI * 2)
        g.fill()
      })
      tuile(l / 2 + u * 4, t(langue, "gt86Musiques").toUpperCase(), "#f473e8", (cx, cy, r) => {
        g.font = `bold ${Math.round(r * 2.4)}px monospace`
        g.textAlign = "center"
        g.fillText("♪", cx, cy)
        g.textAlign = "left"
      })
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
    peint()
  }
  img.src = "/prototype/ecran-fond.jpg"
  const imgQuartier = new Image()
  imgQuartier.onload = () => {
    quartier = imgQuartier
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
    etatDebug: () => JSON.stringify(etat),
    mode: () => etat.mode,
    langue(nouvelle: Lang) {
      langue = nouvelle
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
      peint()
    },
    hub() {
      etat.mode = "hub"
      /* revenir au hub annule une sélection en cours (recette proto) */
      etat.choix = null
      etat.transition = 0
      peint()
    },
    gps() {
      etat.mode = "gps"
      /* un re-rendu ne doit pas raturer un départ déjà lancé (piège #26) */
      if (etat.transition === 0) etat.choix = null
      peint()
    },
    musiques: () => passeEn("musiques"),
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
