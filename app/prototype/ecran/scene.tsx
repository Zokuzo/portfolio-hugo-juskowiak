"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Center, Environment, Lightformer, Loader, SpotLight as SpotVolumetrique, Text3D, useGLTF, useTexture } from "@react-three/drei"
import * as THREE from "three"
import { habilleNuit } from "../rue/voiture-rue"
import Fond from "../rue/fond"
import { halo } from "../rue/rue"
import DecorGlb from "../rue/decor-glb"
import VieNocturne from "../rue/ville-vivante"

/* La scène du prototype #23 — l'écran média de l'habitacle. Verdict du
   gate : l'écran NATIF du GT86 (quad `Car_16`, mat `Display`, 512×256 —
   le ratio 2:1 est gravé pour l'UI écran, GPS #26 et Musiques #33) ; la
   variante PSP a perdu et est sortie du code avec son GLB.
   Vue par défaut : ASSIS CONDUCTEUR (demande Hugo) ; clic sur l'écran →
   la caméra vient s'y cadrer ; re-clic → retour au siège.
   Conduite à droite (Speedo à x>0) — relevé de l'analyse #16. */

const REDUIT =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* le quad Display relevé dans le GLB : x -0,14..-0,01, y 0,75..0,82,
   z 0,32..0,34 — centre et inclinaison (dossier ~16° vers l'arrière) */
const ECRAN_NATIF = {
  centre: new THREE.Vector3(-0.075, 0.785, 0.328),
  bascule: -0.28,
}
/* les MÊMES vecteurs que le raycast de ClicEcran — toute position de cage
   dérivée à la main divergeait (l'axe vertical du plan pointe vers le BAS) */
const PLAN_NORMALE = new THREE.Vector3(0, Math.sin(ECRAN_NATIF.bascule), Math.cos(ECRAN_NATIF.bascule)).normalize()
const PLAN_AXE_Y = PLAN_NORMALE.clone().cross(new THREE.Vector3(-1, 0, 0)).normalize()

/* ---- l'écran natif : deux états, même fond ------------------------- */
/* veille (vue conducteur) : le Rayquaza + « CLICK HERE » qui clignote ;
   hub (après clic) : les tuiles GPS / MUSIQUES aux teintes du fond.
   Textes d'en-tête supprimés (demande Hugo), seule l'horloge reste. */
function creeEcran() {
  const c = document.createElement("canvas")
  c.width = 512
  c.height = 256
  const g = c.getContext("2d")!
  const l = 512
  const h = 256
  const u = h / 100
  let fond: HTMLImageElement | null = null
  let quartier: HTMLImageElement | null = null
  const etat = {
    mode: "veille" as "veille" | "hub" | "gps" | "musiques" | "horloge" | "stats" | "eteint",
    allume: true,
    tic: 0,
    flash: false,
    choix: null as null | "maison" | "travail",
    transition: 0,
  }
  let quandDepart: ((dest: "maison" | "travail") => void) | null = null

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

  /* ---- la carte GPS (ticket #26), façon Waze nuit -------------------- */
  /* codes relevés : itinéraire optimal VIOLET (le code Waze), carte de
     nuit sombre, rubans arrondis, ballons-marqueurs à liseré blanc,
     chrome flottant en pastilles */
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

  const peintGps = () => {
    /* une carte est une SURFACE : fond opaque façon Waze nuit, le
       Rayquaza ne vit plus que sur la veille et le hub */
    g.fillStyle = "#16132a"
    g.fillRect(0, 0, l, h)
    /* les bâtiments RÉELS du modèle 3D (demande Hugo) : empreintes
       extraites du GLB par tools/monde/carte-quartier.mjs — projection du
       dessus dans le repère de la voiture garée (4 px/m, cap sud en haut),
       arrondies en morphologie. Ce qu'on voit au pare-brise EST la carte. */
    if (quartier) g.drawImage(quartier, 0, 0, l, h)
    /* le réseau mort : rubans courbes, jamais empruntables */
    /* le réseau mort suit les vraies rues du quartier : le boulevard sud
       (traversé par la fourche), la rue qui continue au-delà du carrefour,
       les deux verticales des bords (x = ±55 m du décor) */
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
    const vive = (chemin: () => void, choisi: boolean, estompe: boolean) => {
      if (estompe) {
        ruban(chemin, "#0e0a1d", u * 1.4, "#3a3260", u * 3.4)
        return
      }
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
    /* sans destination choisie, la fourche n'est que des rues normales —
       l'itinéraire n'existe qu'après le choix (façon Waze, demande Hugo) */
    if (etat.choix === null) {
      morte(tronc, 1.2)
      morte(gauche, 1.2)
      morte(droite, 1.2)
    } else {
      vive(tronc, true, false)
      if (etat.choix === "maison") {
        morte(droite, 1.2)
        vive(gauche, true, false)
      } else {
        morte(gauche, 1.2)
        vive(droite, true, false)
      }
    }
    /* la voiture : flèche blanche en écusson violet (façon Waze) */
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
    if (etat.choix === "maison")
      ballon(100, 58, 116, 96, "MAISON", "#8f5cff", true, (cx, cy, r) => {
        g.lineWidth = r * 0.34
        g.beginPath()
        g.moveTo(cx - r, cy + r * 0.15)
        g.lineTo(cx, cy - r * 0.85)
        g.lineTo(cx + r, cy + r * 0.15)
        g.moveTo(cx - r * 0.6, cy)
        g.lineTo(cx - r * 0.6, cy + r * 0.85)
        g.lineTo(cx + r * 0.6, cy + r * 0.85)
        g.lineTo(cx + r * 0.6, cy)
        g.stroke()
      })
    if (etat.choix === "travail")
      ballon(452, 56, 436, 94, "TRAVAIL", "#e561d3", true, (cx, cy, r) => {
        g.lineWidth = r * 0.34
        g.beginPath()
        g.roundRect(cx - r * 0.85, cy - r * 0.45, r * 1.7, r * 1.25, r * 0.2)
        g.moveTo(cx - r * 0.35, cy - r * 0.45)
        g.lineTo(cx - r * 0.35, cy - r * 0.85)
        g.lineTo(cx + r * 0.35, cy - r * 0.85)
        g.lineTo(cx + r * 0.35, cy - r * 0.45)
        g.stroke()
      })
    /* le sélecteur de destination façon Waze : « OÙ VA-T-ON ? » + deux
       rangées favoris (demande Hugo — plus de points posés d'office) */
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
      g.fillText("O\u00d9 VA-T-ON ?", px0 + u * 6, py0 + h * 0.075)
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
        g.fillText("\u203a", px0 + pl - u * 8, cy)
        g.textAlign = "left"
      }
      rangee(py0 + h * 0.115, "MAISON", "#8f5cff", (cx, cy, r) => {
        g.lineWidth = r * 0.4
        g.beginPath()
        g.moveTo(cx - r, cy + r * 0.15)
        g.lineTo(cx, cy - r * 0.85)
        g.lineTo(cx + r, cy + r * 0.15)
        g.moveTo(cx - r * 0.6, cy)
        g.lineTo(cx - r * 0.6, cy + r * 0.85)
        g.lineTo(cx + r * 0.6, cy + r * 0.85)
        g.lineTo(cx + r * 0.6, cy)
        g.stroke()
      })
      rangee(py0 + h * 0.3, "TRAVAIL", "#e561d3", (cx, cy, r) => {
        g.lineWidth = r * 0.4
        g.beginPath()
        g.roundRect(cx - r * 0.85, cy - r * 0.45, r * 1.7, r * 1.25, r * 0.2)
        g.moveTo(cx - r * 0.35, cy - r * 0.45)
        g.lineTo(cx - r * 0.35, cy - r * 0.85)
        g.lineTo(cx + r * 0.35, cy - r * 0.85)
        g.lineTo(cx + r * 0.35, cy - r * 0.45)
        g.stroke()
      })
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
    /* la sélection : carte ETA façon Waze, jauge fine */
    if (etat.choix) {
      const nom = etat.choix === "maison" ? "MAISON" : "TRAVAIL"
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
      g.fillText(`DÉPART → ${nom}`, bx + u * 17, by + h * 0.062)
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
    const cx = l * 0.30
    g.save()
    g.shadowColor = "rgba(0, 0, 0, 0.55)"
    g.shadowBlur = u * 5
    g.beginPath()
    g.roundRect(l * 0.09, h * 0.2, l * 0.82, h * 0.62, u * 5)
    g.fillStyle = "rgba(20, 15, 38, 0.88)"
    g.fill()
    g.restore()
    /* pochette : le Rayquaza recadré */
    if (fond) g.drawImage(fond, 128, 0, 256, 256, l * 0.12, h * 0.27, h * 0.48, h * 0.48)
    g.strokeStyle = "#8f5cff"
    g.lineWidth = u * 1.2
    g.strokeRect(l * 0.12, h * 0.27, h * 0.48, h * 0.48)
    g.font = `bold ${Math.round(u * 7.5)}px monospace`
    g.fillStyle = "#f2ecff"
    g.fillText("RIEN NE JOUE", l * 0.4, h * 0.34)
    g.font = `${Math.round(u * 5.5)}px monospace`
    g.fillStyle = "#a99cc8"
    g.fillText("Spotify arrive (#33)", l * 0.4, h * 0.44)
    /* barre de lecture */
    g.beginPath()
    g.roundRect(l * 0.4, h * 0.55, l * 0.46, u * 2, u)
    g.fillStyle = "#37305c"
    g.fill()
    g.beginPath()
    g.roundRect(l * 0.4, h * 0.55, l * 0.12, u * 2, u)
    g.fillStyle = "#8f5cff"
    g.fill()
    /* transport : précédent / lecture / suivant */
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
    void cx
  }

  const peintHorloge = () => {
    /* le fond seul avec l'heure — grand, voilé de violet */
    g.textAlign = "center"
    g.font = `bold ${Math.round(u * 30)}px monospace`
    g.shadowColor = "#9b5cff"
    g.shadowBlur = u * 8
    g.fillStyle = "#efe6ff"
    g.fillText("23:42", l / 2, h * 0.48)
    g.shadowBlur = 0
    g.font = `${Math.round(u * 7)}px monospace`
    g.fillStyle = "#b7a8d8"
    g.fillText("mar. 19 ao\u00fbt", l / 2, h * 0.68)
    g.textAlign = "left"
  }

  const peintStats = () => {
    /* les statistiques de la voiture — jauges au violet du combiné */
    g.fillStyle = "#16132a"
    g.fillRect(0, 0, l, h)
    g.font = `bold ${Math.round(u * 7)}px monospace`
    g.fillStyle = "#a99cc8"
    g.fillText("GT86 \u2014 STATS", u * 6, u * 10)
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
    jauge(u * 6, h * 0.16, "TEMP. MOTEUR", "90 \u00b0C", 0.55)
    jauge(l * 0.52, h * 0.16, "BATTERIE", "12,4 V", 0.8)
    jauge(u * 6, h * 0.55, "HUILE", "OK", 0.7)
    jauge(l * 0.52, h * 0.55, "PNEUS", "2,4 bar", 0.65)
  }

  const peint = () => {
    if (etat.mode === "eteint") {
      /* vraiment éteint : dalle noire, rien d'autre */
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
      /* veille : CLICK HERE clignotant, lueur violette */
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
    } else {
      /* le hub : tuiles aux teintes du Rayquaza (violet / magenta) */
      tuile(u * 8, "GPS", "#b57aff", (cx, cy, r) => {
        g.lineWidth = r * 0.24
        g.beginPath()
        g.arc(cx, cy - r * 0.25, r * 0.55, Math.PI * 0.92, Math.PI * 2.08)
        g.lineTo(cx, cy + r)
        g.closePath()
        g.stroke()
        g.beginPath()
        g.arc(cx, cy - r * 0.25, r * 0.2, 0, Math.PI * 2)
        g.fill()
      })
      tuile(l / 2 + u * 4, "MUSIQUES", "#f473e8", (cx, cy, r) => {
        g.lineWidth = r * 0.24
        g.beginPath()
        g.moveTo(cx - r * 0.45, cy + r * 0.7)
        g.lineTo(cx - r * 0.45, cy - r * 0.8)
        g.lineTo(cx + r * 0.65, cy - r)
        g.lineTo(cx + r * 0.65, cy + r * 0.5)
        g.stroke()
        g.beginPath()
        g.arc(cx - r * 0.6, cy + r * 0.7, r * 0.28, 0, Math.PI * 2)
        g.arc(cx + r * 0.5, cy + r * 0.5, r * 0.28, 0, Math.PI * 2)
        g.fill()
      })
      if (etat.flash) {
        /* MUSIQUES pas encore câblées (#33) */
        g.textAlign = "center"
        g.font = `bold ${Math.round(u * 8)}px monospace`
        g.fillStyle = "#f9c4f1"
        g.fillText("BIENT\u00d4T", l * 0.75, h * 0.52)
        g.textAlign = "left"
      }
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

  return {
    tex,
    etatDebug() {
      return JSON.stringify(etat)
    },
    veille(allume: boolean) {
      etat.mode = "veille"
      etat.allume = allume
      peint()
    },
    hub() {
      etat.mode = "hub"
      etat.choix = null
      peint()
    },
    gps() {
      etat.mode = "gps"
      etat.choix = null
      peint()
    },
    musiques() {
      etat.mode = "musiques"
      peint()
    },
    horloge() {
      etat.mode = "horloge"
      peint()
    },
    stats() {
      etat.mode = "stats"
      peint()
    },
    eteint() {
      etat.mode = "eteint"
      peint()
    },
    surDepart(fn: (dest: "maison" | "travail") => void) {
      quandDepart = fn
    },
    /* le clic sur la carte GPS, interprété selon l'état : rangées du
       sélecteur, ou ‹ retour */
    clicGps(uv: number, vv: number): "retour" | "maison" | "travail" | null {
      if (uv < 0.2 && vv < 0.3) return "retour"
      if (etat.choix !== null) return null
      /* le panneau : x ∈ [0.2, 0.8], rangées à 42-58 % et 60-76 % */
      if (uv < 0.2 || uv > 0.8) return null
      if (vv > 0.5 && vv < 0.62) return "maison"
      if (vv > 0.68 && vv < 0.82) return "travail"
      return null
    },
    tic() {
      etat.tic += 1.4
      peint()
    },
    bientot() {
      if (etat.flash) return
      etat.flash = true
      peint()
      setTimeout(() => {
        etat.flash = false
        if (etat.mode === "hub") peint()
      }, 750)
    },
    /* la micro-transition de sélection : la branche choisie s'allume, le
       bandeau DÉPART se remplit, puis la carte revient au repos — le vrai
       départ vers la page viendra avec #27/#32 */
    choisit(dest: "maison" | "travail") {
      if (etat.choix) return
      etat.choix = dest
      etat.transition = 0
      const fini = () => {
        /* jauge pleine : on plonge dans le portfolio relié (demande Hugo) */
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
        ;(window as unknown as { __pas: number }).__pas = ((window as unknown as { __pas?: number }).__pas ?? 0) + 1
        if (etat.mode !== "gps" || !etat.choix) return
        etat.transition = Math.min(1, (performance.now() - debut) / 1500)
        peint()
        if (etat.transition < 1) requestAnimationFrame(pas)
        else fini()
      }
      requestAnimationFrame(pas)
    },
  }
}

/* ---- la voiture, écran natif habillé --------------------------------- */
/* verdict Hugo : l'écran NATIF gagne — le ratio 2:1 (512×256) est gravé
   pour l'UI écran (GPS #26, Musiques #33) ; la PSP a perdu le gate et
   sort du code avec son GLB (l'historique git les garde) */
function Voiture({ ecran }: { ecran: ReturnType<typeof creeEcran> }) {
  const { scene } = useGLTF("/prototype/gt86.glb")
  /* la planche passagère troque sa livrée Miku pour le Haunter (choix
     Hugo — raccord au violet des néons) : recomposé DANS le repère de la
     texture d'origine (atlas 2048² gris, artwork à 180° dans le quart
     haut-gauche — relevé sur la texture extraite), + carte émissive
     noire où seul le Haunter luit */
  const [art, lueur, compteur] = useTexture(["/prototype/haunter-dash.jpg", "/prototype/haunter-dash-lueur.jpg", "/prototype/compteur-violet.jpg"])
  const modele = useMemo(() => {
    for (const t of [art, lueur, compteur]) {
      t.flipY = false
      t.colorSpace = THREE.SRGBColorSpace
    }
    /* même piège que le quad Display : les UV du combiné débordent de
       [0,1] — sans Repeat, le clamp rend le cadran noir */
    compteur.wrapS = THREE.RepeatWrapping
    compteur.wrapT = THREE.RepeatWrapping
    /* la robe de nuit COMMUNE aux scènes (Argent, verre teinté, livrée
       neutralisée, feux allumés) — la voiture de l'habitacle est la même
       que celle de la rue (retour Hugo : plus jamais la livrée d'usine) */
    habilleNuit(scene)
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      const mat = mesh.material as THREE.MeshStandardMaterial
      /* pare-brise éclairci pour laisser passer le nom (demande Hugo) —
         réglage propre à l'habitacle, la rue garde son verre à 0,8 */
      if (mat?.name === "Glass") {
        const verre = mat as THREE.MeshPhysicalMaterial
        verre.opacity = 0.4
        verre.color.set("#1a2027")
      }
      /* le combiné passe au violet (cohérence néons, demande Hugo) :
         la texture du cadran est la même à la teinte près (rouge → violet
         par rotation de teinte, seule couleur saturée du cadran), et les
         aiguilles suivent */
      if (mat?.name === "Speedo") {
        mat.map = compteur
        mat.emissiveMap = compteur
        mat.needsUpdate = true
      }
      if (mat?.name === "Speedoneedle") {
        mat.color.set("#1a1022")
        mat.emissive.set("#a86bff")
        mat.needsUpdate = true
      }
      /* rétroéclairage concentré PAR BOUTON (demande Hugo) : InteriorStuff
         porte toutes les faces de boutons (vérifié au flash magenta) — sa
         propre texture en carte émissive violette fait briller les
         sérigraphies claires, les fonds sombres restent sourds */
      if (mat?.name === "InteriorStuff") {
        mat.emissiveMap = mat.map
        mat.emissive = new THREE.Color("#8a5cff")
        mat.emissiveIntensity = 0.55
        mat.needsUpdate = true
      }
      if (mat?.name === "DashboardArtwork") {
        mat.map = art
        mat.emissiveMap = lueur
        mat.emissive = new THREE.Color("#ffffff")
        mat.emissiveIntensity = 0.55
        mat.needsUpdate = true
      }
      if (mat?.name === "Display") {
        const m = mat.clone()
        m.map = ecran.tex
        m.emissiveMap = ecran.tex
        m.emissive = new THREE.Color("#ffffff")
        m.emissiveIntensity = 1.1
        mesh.material = m
      }
    })
    return scene
  }, [scene, art, lueur, compteur, ecran])

  /* plafonnier éteint, suite : l'Environment plein repeignait plastiques
     et planche en fin d'après-midi — l'intérieur reçoit l'environnement
     en envMap propre à dose de veille (leçon du #22 : sans envMap posé
     sur le matériau, envMapIntensity est INERTE) ; la robe garde le sien */
  const envPose = useRef(false)
  useFrame(({ scene: sc, gl }) => {
    if (envPose.current || !sc.environment) return
    envPose.current = true
    const INTERIEUR = new Set(["MoreInterior", "InteriorBlack", "InteriorStuff", "SilverPlastic", "Pedals", "Carbon"])
    /* textures de l'habitacle affûtées : l'anisotropie à 1 délavait tout
       ce qui se voit en angle rasant — planche, console, sièges (retour
       Hugo « améliore les textures ») ; la résolution des atlas n'était
       pas le goulot (512-2048 natifs, vérifié à l'inspection) */
    const aniso = gl.capabilities.getMaxAnisotropy()
    modele.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const mat = m as THREE.MeshStandardMaterial
        if (!mat) continue
        for (const tex of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.emissiveMap, mat.aoMap]) {
          if (tex && tex.anisotropy < aniso) {
            tex.anisotropy = aniso
            tex.needsUpdate = true
          }
        }
        if (!INTERIEUR.has(mat.name)) continue
        mat.envMap = sc.environment
        /* les plastiques de console reprennent un éclat (retour Hugo
           « ne reflète pas la lumière ») : sheen d'environnement et
           rugosité plafonnée — les sièges/tapis restent mats */
        const console_ = mat.name === "InteriorStuff" || mat.name === "SilverPlastic"
        mat.envMapIntensity = console_ ? 0.35 : 0.1
        if (console_) mat.roughness = Math.min(mat.roughness, 0.45)
        /* et la teinte elle-même descend d'un cran : l'ambiante de nuit
           suffisait encore à révéler les plastiques (retour Hugo) */
        mat.color.multiplyScalar(0.5)
        mat.needsUpdate = true
      }
    })
  })
  return <primitive object={modele} />
}

/* ---- le clic écran : écouteur DOM + raycast maison ------------------ */
/* le pipeline d'événements R3F restait sourd sur cette page (vérifié :
   proxy en place, handler enregistré, rayon manuel au centre — zéro
   appel) ; un écouteur natif sur le canvas ne dépend de rien */
/* les boutons physiques de la façade, en coordonnées plan (d.x, dy) —
   relevés sur la capture de Hugo (dalle 0,13 m ↔ 544 px → 4185 px/m) */
/* zones posées par Hugo dans l'éditeur ?edit (axe vertical du plan vers
   le bas — ses mesures font foi) */
const BOUTONS: [string, number, number][] = [
  ["power", 0.091, -0.0354],
  ["media", 0.08, 0],
  ["suivant", 0.0822, 0.03],
  ["precedent", 0.0816, 0.0141],
  ["map", -0.0861, 0.0275],
  /* déduit de la grille de Hugo : même colonne que MAP NAV, à hauteur de MEDIA */
  ["setup", -0.0861, 0],
]

function ClicEcran({ centre, surClic, surBouton, surDehors, surBrut }: { centre: THREE.Vector3; surClic: (u: number, v: number) => void; surBouton: (nom: string) => void; surDehors: () => void; surBrut?: (dx: number, dy: number) => void }) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const refClic = useRef(surClic)
  refClic.current = surClic
  const refBouton = useRef(surBouton)
  refBouton.current = surBouton
  const refDehors = useRef(surDehors)
  refDehors.current = surDehors
  const refBrut = useRef(surBrut)
  refBrut.current = surBrut
  useEffect(() => {
    const el = gl.domElement
    const normale = new THREE.Vector3(0, Math.sin(ECRAN_NATIF.bascule), Math.cos(ECRAN_NATIF.bascule)).normalize()
    const axeY = normale.clone().cross(new THREE.Vector3(-1, 0, 0)).normalize()
    const rayon = new THREE.Raycaster()
    const clic = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      rayon.setFromCamera(
        new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)),
        camera,
      )
      const plan = new THREE.Plane().setFromNormalAndCoplanarPoint(normale, centre)
      const impact = new THREE.Vector3()
      if (!rayon.ray.intersectPlane(plan, impact)) return refDehors.current()
      const d = impact.sub(centre)
      const dy = d.dot(axeY)
      /* mode édition : coordonnées plan brutes, rien d'autre */
      if (refBrut.current) {
        if (Math.abs(d.x) < 0.16 && Math.abs(dy) < 0.1) refBrut.current(d.x, dy)
        return
      }
      /* dalle 13×7 cm : en coordonnées écran, u croît vers la droite du
         conducteur (monde −x) — calibré au clic sur la tuile GPS */
      if (Math.abs(d.x) < 0.072 && Math.abs(dy) < 0.04) {
        refClic.current((0.065 - d.x) / 0.13, (0.035 - dy) / 0.07)
      } else {
        const bouton = BOUTONS.find(([, bx, by]) => Math.abs(d.x - bx) < 0.011 && Math.abs(dy - by) < 0.007)
        if (bouton) refBouton.current(bouton[0])
        else if (Math.abs(d.x) > 0.16 || Math.abs(dy) > 0.1) {
          /* frange neutre entre la façade et le « dehors » : un clic à
             quelques millimètres du bord ne doit pas éjecter du zoom */
          refDehors.current()
        }
      }
    }
    el.addEventListener("click", clic)
    return () => el.removeEventListener("click", clic)
  }, [gl, camera, centre])
  return null
}

/* ---- le nom dans les phares (aperçu du ticket #31) ------------------ */
/* « Hugo Juskowiak / SDE-IA Engineer » flotte en chrome dans la rue, face
   au pare-brise, éclairé par deux faisceaux volumétriques partis des
   optiques (axe voiture x = −0,075, optiques natives à ±0,62) */
function NomChrome() {
  const cibles = useMemo(() => [new THREE.Object3D(), new THREE.Object3D()], [])
  /* le nom FLOTTE (demande Hugo) — houle lente + roulis infime ; les
     faisceaux restent fixes : la lumière glisse sur les lettres. Figé
     sous prefers-reduced-motion. */
  const flotte = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!flotte.current) return
    const t = REDUIT ? 0 : clock.elapsedTime
    flotte.current.position.y = Math.sin(t * 0.7) * 0.07
    flotte.current.rotation.z = Math.sin(t * 0.45 + 1.3) * 0.008
  })
  return (
    <group>
      <group ref={flotte}>
      <Center position={[-0.45, 1.4, 13]} rotation-y={Math.PI}>
        <Text3D
          font="/prototype/helvetiker_bold.typeface.json"
          size={0.5}
          height={0.12}
          curveSegments={8}
          bevelEnabled
          bevelThickness={0.015}
          bevelSize={0.01}
        >
          HUGO JUSKOWIAK
          <meshStandardMaterial color="#e8ecf2" metalness={0.9} roughness={0.28} envMapIntensity={1.8} emissive="#fff3dc" emissiveIntensity={0.2} />
        </Text3D>
      </Center>
      <Center position={[-0.45, 0.82, 13]} rotation-y={Math.PI}>
        <Text3D font="/prototype/helvetiker_regular.typeface.json" size={0.26} height={0.05} curveSegments={6}>
          SDE / IA Engineer
          <meshStandardMaterial color="#cfd5de" metalness={0.9} roughness={0.3} envMapIntensity={1.7} emissive="#fff3dc" emissiveIntensity={0.16} />
        </Text3D>
      </Center>
      </group>
      {([1, -1] as const).map((c, i) => (
        <group key={c}>
          <primitive object={cibles[i]} position={[-0.45 + c * 1.3, 1.25, 13]} />
          <SpotVolumetrique
            position={[-0.075 + c * 0.62, 0.76, 1.85]}
            target={cibles[i]}
            color="#ffeecb"
            intensity={900}
            angle={0.38}
            penumbra={0.6}
            decay={1.2}
            distance={30}
            attenuation={10}
            anglePower={5}
            radiusTop={0.14}
          />
        </group>
      ))}
    </group>
  )
}

/* ---- les néons ------------------------------------------------------ */
/* sous caisse : spots PLONGEANTS — la lumière va au sol, plus rien ne
   remonte dans l'habitacle (retour Hugo) */
function NeonsSol() {
  const cibles = useMemo(() => Array.from({ length: 4 }, () => new THREE.Object3D()), [])
  const points: [number, number][] = [[-0.075, 1.5], [-0.075, -1.4], [-0.7, 0.05], [0.55, 0.05]]
  return (
    <group>
      {points.map(([x, z], i) => (
        <group key={i}>
          <primitive object={cibles[i]} position={[x, 0, z]} />
          <spotLight position={[x, 0.28, z]} target={cibles[i]} color="#8a3cff" intensity={5} angle={1.1} penumbra={0.7} distance={1.6} decay={2} />
        </group>
      ))}
    </group>
  )
}

/* interstices de l'habitacle : accents violets locaux (repose-pieds,
   flancs de console) — courte portée, l'habitacle reste éteint */
function NeonsInterieur() {
  const points: [number, number, number][] = [
    [0.3, 0.38, 0.5],
    [-0.5, 0.38, 0.5],
    [0.1, 0.48, -0.12],
    [-0.28, 0.48, -0.12],
  ]
  return (
    <group>
      {points.map(([x, y, z], i) => (
        <group key={i}>
          <sprite position={[x, y, z]} scale={[0.16, 0.16, 1]}>
            <spriteMaterial map={halo()} color="#9b4dff" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
          <pointLight position={[x, y, z]} color="#8a3cff" intensity={0.35} distance={0.5} decay={2} />
        </group>
      ))}
    </group>
  )
}

/* ---- le reflet du rétroviseur --------------------------------------- */
/* POV fixe → le reflet est une VRAIE capture de la vue arrière (prise
   depuis la position du miroir, retournée en miroir, assombrie), plaquée
   sur la glace — position/inclinaison sondées par raycast à travers le
   pixel du miroir depuis la caméra conducteur */
function Retro() {
  const tex = useTexture("/prototype/retro.jpg")
  tex.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh position={[-0.03, 1.128, 0.147]} rotation={[-0.14, 2.618, 0]}>
      <planeGeometry args={[0.23, 0.076]} />
      <meshBasicMaterial map={tex} toneMapped={false} color="#b6bfd2" />
    </mesh>
  )
}

/* ---- le rail de caméra : la SEULE façon de bouger ------------------- */
/* pas d'orbite libre (demande Hugo) : la caméra vit sur un rail, seuls
   les clics la déplacent — le rail tient sa propre cible et verrouille
   le regard à chaque frame */
function Rail({ but, arrive, viseInitiale }: { but: { cam: THREE.Vector3; vise: THREE.Vector3 } | null; arrive: () => void; viseInitiale: [number, number, number] }) {
  const vise = useRef(new THREE.Vector3(...viseInitiale))
  useFrame(({ camera }) => {
    if (but) {
      const k = REDUIT ? 1 : 0.09
      camera.position.lerp(but.cam, k)
      vise.current.lerp(but.vise, k)
      if (camera.position.distanceTo(but.cam) < 0.005) arrive()
    }
    camera.lookAt(vise.current)
  })
  return null
}

const VUES = {
  /* ASSIS au poste de conduite (à droite), le regard vers la route —
     volant, combiné et écran dans le champ */
  conducteur: { cam: new THREE.Vector3(0.3, 1.05, -0.42), vise: new THREE.Vector3(0.0, 0.8, 1.2) },
  /* le nez sur l'écran, dans son axe incliné */
  ecran: { cam: new THREE.Vector3(-0.075, 0.9, -0.05), vise: ECRAN_NATIF.centre.clone() },
}

export default function Scene() {
  const params = useSearchParams()
  const [zoome, setZoome] = useState(false)
  const routeur = useRouter()
  /* ?edit : Hugo place lui-même les zones des boutons physiques — clique
     une cage puis l'endroit exact du bouton, C copie la table */
  const edition = params.get("edit") !== null
  const [zones, setZones] = useState<[string, number, number][]>(() => BOUTONS.map((b) => [...b]))
  const [selZone, setSelZone] = useState<number | null>(null)
  const [modeEcran, setModeEcran] = useState<"hub" | "gps" | "musiques" | "horloge" | "stats">("hub")
  const [eteint, setEteint] = useState(false)
  const [partir, setPartir] = useState(false)
  const [but, setBut] = useState<{ cam: THREE.Vector3; vise: THREE.Vector3 } | null>(null)
  /* PAS un useMemo : creeEcran est impur (canvas, Image, timers) et le
     double-rendu StrictMode en fabriquait DEUX instances — le matériau
     pilotait l'une, les clics parlaient à l'autre (débogage aux pixels).
     L'init paresseuse en ref garantit l'instance unique. */
  const refEcran = useRef<ReturnType<typeof creeEcran> | null>(null)
  if (refEcran.current === null) refEcran.current = creeEcran()
  const ecran = refEcran.current
  if (process.env.NODE_ENV !== "production") (window as unknown as { __ecran: unknown }).__ecran = ecran

  /* la machine à états de l'écran : veille clignotante au siège, hub ou
     carte GPS au zoom — pointillés animés en mode carte, tout figé sous
     prefers-reduced-motion */
  useEffect(() => {
    if (!zoome) {
      if (REDUIT) {
        ecran.veille(true)
        return
      }
      let allume = true
      ecran.veille(allume)
      const t = setInterval(() => {
        allume = !allume
        ecran.veille(allume)
      }, 650)
      return () => clearInterval(t)
    }
    if (eteint) {
      ecran.eteint()
      return
    }
    if (modeEcran === "hub") {
      ecran.hub()
      return
    }
    if (modeEcran === "musiques") {
      ecran.musiques()
      return
    }
    if (modeEcran === "horloge") {
      ecran.horloge()
      return
    }
    if (modeEcran === "stats") {
      ecran.stats()
      return
    }
    ecran.gps()
    if (REDUIT) return
    const t = setInterval(() => ecran.tic(), 90)
    return () => clearInterval(t)
  }, [zoome, modeEcran, eteint, ecran])

  /* la jauge pleine du GPS plonge dans le portfolio relié : fondu noir
     puis navigation réelle — Maison → la home, Travail → /work */
  useEffect(() => {
    ecran.surDepart((dest) => {
      setPartir(true)
      setTimeout(() => routeur.push(dest === "maison" ? "/" : "/work"), 650)
    })
  }, [ecran, routeur])

  const brut = params.get("cam")?.split(",").map(Number)
  const cam: [number, number, number] =
    brut && brut.length === 3 && brut.every(Number.isFinite) ? (brut as [number, number, number]) : VUES.conducteur.cam.toArray() as [number, number, number]
  const brutVise = params.get("vise")?.split(",").map(Number)
  const cible: [number, number, number] =
    brutVise && brutVise.length === 3 && brutVise.every(Number.isFinite) ? (brutVise as [number, number, number]) : VUES.conducteur.vise.toArray() as [number, number, number]

  /* le routage des clics sur la dalle, par zones (u,v ∈ [0,1]) */
  const surEcran = (uv: number, vv: number) => {
    if (process.env.NODE_ENV !== "production")
      (window as unknown as { __routage: unknown }).__routage = { uv, vv, zoome, modeEcran, t: Date.now() }
    if (eteint) return
    if (!zoome) {
      setBut(VUES.ecran)
      setZoome(true)
      setModeEcran("hub")
      return
    }
    if (modeEcran === "hub") {
      if (uv < 0.48) setModeEcran("gps")
      else if (uv > 0.52) setModeEcran("musiques")
      return
    }
    if (modeEcran === "gps") {
      /* le sélecteur de destination et le ‹ retour, interprétés par
         l'écran lui-même (les zones vivent à côté du dessin) */
      const action = ecran.clicGps(uv, vv)
      if (action === "retour") setModeEcran("hub")
      else if (action === "maison" || action === "travail") ecran.choisit(action)
      return
    }
    /* musiques / horloge / stats : le ‹ n'existe pas encore, les boutons
       physiques (flèches, MAP, MEDIA) font la navigation */
  }

  /* les boutons physiques de la façade (demande Hugo) */
  const CYCLE: ("hub" | "gps" | "musiques" | "horloge" | "stats")[] = ["hub", "gps", "musiques", "horloge", "stats"]
  const surBouton = (nom: string) => {
    if (nom === "power") {
      setEteint((e) => !e)
      return
    }
    if (eteint) return
    const va = (m: "hub" | "gps" | "musiques" | "horloge" | "stats") => {
      if (!zoome) {
        setBut(VUES.ecran)
        setZoome(true)
      }
      setModeEcran(m)
    }
    if (nom === "media") va("musiques")
    else if (nom === "map") va("gps")
    else if (nom === "setup") va("stats")
    else if (nom === "suivant" || nom === "precedent") {
      const i = CYCLE.indexOf(modeEcran as (typeof CYCLE)[number])
      const j = i === -1 ? 0 : (i + (nom === "suivant" ? 1 : CYCLE.length - 1)) % CYCLE.length
      va(CYCLE[j])
    }
  }

  /* l'édition : sélection d'une cage ou téléportation de la sélection */
  const surEditer = (dx: number, dy: number) => {
    const dans = zones.findIndex(([, bx, by]) => Math.abs(dx - bx) < 0.011 && Math.abs(dy - by) < 0.007)
    if (dans !== -1) {
      setSelZone(dans)
      return
    }
    if (selZone !== null)
      setZones((t) => t.map((z, i) => (i === selZone ? [z[0], Math.round(dx * 10000) / 10000, Math.round(dy * 10000) / 10000] : z)))
  }

  useEffect(() => {
    if (!edition) return
    const clavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelZone(null)
      if (e.key.toLowerCase() === "c") {
        const texte = zones.map(([nom, bx, by]) => `  [${JSON.stringify(nom)}, ${bx}, ${by}],`).join("\n")
        console.log("[boutons]\n" + texte)
        navigator.clipboard?.writeText(texte).catch(() => {})
      }
    }
    window.addEventListener("keydown", clavier)
    return () => window.removeEventListener("keydown", clavier)
  }, [edition, zones])

  /* cliquer AILLEURS que l'écran ramène au siège */
  const surDehors = () => {
    if (!zoome) return
    setBut(VUES.conducteur)
    setZoome(false)
    setModeEcran("hub")
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#08070f" }}>
      <Canvas
        camera={{ position: cam, fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance" }}
        onCreated={({ scene, camera, gl }) => {
          /* la même nuit que la rue (#22) : fond, brume et palette — vus
             à travers les vitres, les deux scènes doivent se répondre */
          scene.background = new THREE.Color("#08070f")
          /* brume serrée : la ville est COUPÉE à 50 m (fluidité, demande
             Hugo) — le bord de coupe fond dans la nuit, la skyline du
             Fond (peinte hors brume) tient l'horizon derrière */
          scene.fog = new THREE.Fog("#08070f", 15, 70)
          /* poignées des outils de capture (tools/, gates visuels) */
          if (process.env.NODE_ENV !== "production")
            Object.assign(window as object, { __scene: scene, __camera: camera, __gl: gl })
        }}
      >
        <Suspense fallback={null}>
          {/* nuit d'habitacle : les mêmes lueurs urbaines que la rue,
              en sourdine — juste de quoi lire les volumes et la robe */}
          <Environment resolution={128}>
            <Lightformer form="rect" intensity={0.5} color="#ffb46b" position={[0, 6, 0]} scale={[20, 3, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.25} color="#9aa4c8" position={[6, 2, -4]} scale={[6, 2, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.2} color="#6b7490" position={[-6, 2, 4]} scale={[6, 2, 1]} target={[0, 0, 0]} />
          </Environment>
          {/* plafonnier ÉTEINT (demande Hugo) : mêmes ambiantes que la nuit
              de la rue — l'habitacle ne vit plus que de l'écran, du combiné
              et de la ville */}
          <hemisphereLight args={["#232038", "#0a080e", 0.22]} />
          <ambientLight intensity={0.21} color="#a9b4d4" />
          {/* la lueur de l'écran mange le tableau de bord */}
                    {/* le monde derrière les vitres : LA ville de la rue (#22), pas
              une silhouette — le décor entier avec ses fenêtres émissives,
              ses 90 luminaires et ses feux, transformé pour que la voiture
              soit garée à SA place de la scène précédente (pose (−4,4,
              −0,05, −19), cap π → rotation π, translation −R·pose) */}
          <group rotation-y={Math.PI} position={[-4.4, 0.02, -19]}>
            <DecorGlb fichier="/prototype/decor-habitacle.glb" nuit />
            <VieNocturne autour={[-4.4, -19, 50]} />
          </group>
          <Fond />
          {/* néons violets sous caisse (demande Hugo) : nappe additive au
              sol + deux lampes basses qui teintent l'asphalte autour */}
          <mesh position={[-0.075, 0.045, 0.05]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[3.3, 5.6]} />
            <meshBasicMaterial map={halo()} color="#7a2cf0" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <NeonsSol />
          <NeonsInterieur />
          <NomChrome />
          <Retro />
          <Voiture ecran={ecran} />
          <ClicEcran centre={ECRAN_NATIF.centre} surClic={surEcran} surBouton={surBouton} surDehors={surDehors} surBrut={edition ? surEditer : undefined} />
          {edition &&
            zones.map(([nom, bx, by], i) => (
              <mesh
                key={nom}
                position={ECRAN_NATIF.centre
                  .clone()
                  .add(new THREE.Vector3(bx, 0, 0))
                  .addScaledVector(PLAN_AXE_Y, by)
                  .addScaledVector(PLAN_NORMALE, -0.004)
                  .toArray()}
                rotation-x={ECRAN_NATIF.bascule}
              >
                <planeGeometry args={[0.022, 0.014]} />
                <meshBasicMaterial color={i === selZone ? "#ffffff" : "#ff6a3d"} wireframe transparent opacity={0.85} depthTest={false} />
              </mesh>
            ))}
          <Rail but={but} arrive={() => setBut(null)} viseInitiale={cible} />
        </Suspense>
      </Canvas>
      {edition && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            pointerEvents: "none",
            color: "#d8dcea",
            font: "13px/1.6 ui-monospace, monospace",
            background: "rgba(10, 10, 20, 0.75)",
            padding: "10px 14px",
            borderRadius: 8,
          }}
        >
          édition des zones boutons — clique une cage ({selZone !== null ? zones[selZone][0] : "aucune sélection"}) puis l&apos;ENDROIT EXACT du bouton
          <br />
          <b>C</b> : copier la table · <b>Échap</b> : désélectionner
        </div>
      )}
      {/* le fondu du départ vers le portfolio */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#050408",
          opacity: partir ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 600ms ease",
        }}
      />
      <Loader />
    </div>
  )
}
