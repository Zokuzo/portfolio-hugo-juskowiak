"use client"

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { ECRAN_NATIF, PLAYLISTS, type Ecran } from "./ecran"
import { enMondeRepos } from "./rue"
import type { Cockpit } from "./habitacle"

/* SPOTIFY DANS L'ÉCRAN — ticket #33, doctrine des #18/#25 : l'embed est
   À PLAT en overlay DOM, épousant la dalle au pixel. La FAÇADE
   click-to-load (RGPD) vit dans la texture de l'écran : PAS UN OCTET ne
   part chez Spotify avant le clic — c'est aussi ce qui tient la passe
   « zéro requête tierce » du harnais. Repli « écran custom qui linke »
   si rien ne répond.

   LE PLAYER ANNÉES 2000 (retour de gate #33, référence skin Winamp
   violette de Hugo) : bandeau titre, LCD à digits, ÉGALISEUR dont les
   barres ne dansent QUE quand la musique joue vraiment, fenêtre de
   lecture, panneau PLAYLIST, transport biseauté. Le « réellement » passe
   par l'API officielle de l'embed (open.spotify.com/embed/iframe-api/v1,
   chargée APRÈS le clic de façade — même consentement) : elle pousse
   playback_update (position, durée, pause) — le LCD compte le vrai
   temps, ⏯ pilote la vraie lecture, les barres suivent le vrai état.
   L'audio lui-même reste inaccessible (iframe cross-origin) : les barres
   réagissent à l'état de lecture, pas au spectre — c'est déjà ce que
   faisaient la moitié des skins de l'époque. */

/* le panneau ÉPOUSE la dalle au pixel (retour de gate #33 : « qu'il
   s'affiche dans l'écran de la voiture comme le reste ») — la vue écran
   rapprochée rend le rectangle assez grand pour l'embed */
const ATTENTE_EMBED = 6000

/* ---- le projecteur : le cadre de la dalle, suivi à l'image ------------- */

/* les coins de la zone visible de la dalle (repère plan du #26) */
const DEMI_L = 0.065
const DEMI_H = 0.035
const normale = new THREE.Vector3(0, Math.sin(ECRAN_NATIF.bascule), Math.cos(ECRAN_NATIF.bascule)).normalize()
const axeY = normale.clone().cross(new THREE.Vector3(-1, 0, 0))
const coinsLocaux = [
  [-DEMI_L, -DEMI_H],
  [DEMI_L, -DEMI_H],
  [-DEMI_L, DEMI_H],
  [DEMI_L, DEMI_H],
].map(([dx, dy]) =>
  ECRAN_NATIF.centre
    .clone()
    .add(new THREE.Vector3(dx, 0, 0))
    .add(axeY.clone().multiplyScalar(dy)),
)
const coin = new THREE.Vector3()

/* Écrit chaque image la boîte écran (px) du panneau dans le style du
   conteneur DOM — suivi vivant : si le rail est encore en vol quand
   SPOTIFY s'ouvre, le panneau accompagne la dalle. */
export function CadreDalle({
  actif,
  cockpit,
  boite,
}: {
  actif: boolean
  cockpit: Cockpit
  boite: RefObject<HTMLDivElement | null>
}) {
  const camera = useThree((s) => s.camera)
  const taille = useThree((s) => s.size)
  useFrame(() => {
    if (!actif || !boite.current) return
    const voiture = cockpit.voiture
    if (!voiture) return
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const local of coinsLocaux) {
      enMondeRepos(coin, local, voiture).project(camera)
      const x = ((coin.x + 1) / 2) * taille.width
      const y = ((1 - coin.y) / 2) * taille.height
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
    /* 1:1 sur la dalle — garde-fous seulement pour les toutes petites
       fenêtres (l'embed reste utilisable) */
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const l = Math.max(320, maxX - minX)
    const h = Math.max(200, maxY - minY)
    const s = boite.current.style
    s.left = `${Math.round(cx - l / 2)}px`
    s.top = `${Math.round(Math.max(8, cy - h / 2))}px`
    s.width = `${Math.round(l)}px`
    s.height = `${Math.round(h)}px`
  })
  return null
}

/* ---- l'API iframe de Spotify (chargée après consentement) -------------- */

type ControleurSpotify = {
  loadUri: (uri: string) => void
  togglePlay: () => void
  play: () => void
  restart: () => void
  seek: (secondes: number) => void
  destroy: () => void
  addListener: (evt: string, cb: (e: { data: { isPaused?: boolean; position?: number; duration?: number } }) => void) => void
}
type ApiSpotify = {
  createController: (
    el: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number; theme?: string },
    cb: (c: ControleurSpotify) => void,
  ) => void
}
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: ApiSpotify) => void
    __spotifyApi?: Promise<ApiSpotify>
  }
}

function chargeApiSpotify(): Promise<ApiSpotify> {
  if (window.__spotifyApi) return window.__spotifyApi
  window.__spotifyApi = new Promise<ApiSpotify>((resoud, rejette) => {
    window.onSpotifyIframeApiReady = (api) => resoud(api)
    const script = document.createElement("script")
    script.src = "https://open.spotify.com/embed/iframe-api/v1"
    script.async = true
    script.onerror = () => rejette(new Error("script embed"))
    document.head.appendChild(script)
  })
  return window.__spotifyApi
}

/* ---- l'hôte invisible : le moteur audio du HJ·AMP ---------------------- */

/* Depuis le 6e retour de gate, la skin vit DANS la texture de la dalle
   (ecran.ts, mode "spotify") — l'iframe de l'embed ne sert plus que de
   MOTEUR : invisible (opacité 0, pointeurs coupés) mais montée dans le
   viewport pour que la lecture continue. L'hôte nourrit le peintre
   (majSpotify) et détecte les CHANGEMENTS DE PISTE : une durée qui change
   ou une position qui retombe = piste suivante, le compteur s'incrémente. */

export type CommandesSpotify = {
  bascule: () => void
  reprend: () => void
  saute: () => void
  chargeMix: (i: number) => void
}

export function HoteSpotify({
  ecran,
  commandes,
}: {
  ecran: Ecran
  commandes: MutableRefObject<CommandesSpotify | null>
}) {
  const nid = useRef<HTMLDivElement>(null)
  const controleur = useRef<ControleurSpotify | null>(null)
  const memoire = useRef({ duree: 0, position: 0, piste: 1, indice: 0, enLecture: false })

  useEffect(() => {
    let vivant = true
    const m = memoire.current
    Object.assign(m, { duree: 0, position: 0, piste: 1, indice: 0, enLecture: false })
    ecran.majSpotify({ enLecture: false, position: 0, duree: 0, piste: 1, indice: 0, repli: false })
    /* GARDE ÉTAGÉE : la réponse du contrôleur désarme la première horloge
       et en arme une plus patiente pour `ready` — le repli (peint par le
       peintre) ne prend la place que si l'embed ne répond vraiment jamais */
    const gardes: ReturnType<typeof setTimeout>[] = []
    const armeGarde = (ms: number) => gardes.push(setTimeout(() => vivant && ecran.majSpotify({ repli: true }), ms))
    const desarme = () => gardes.splice(0).forEach(clearTimeout)
    armeGarde(ATTENTE_EMBED)
    chargeApiSpotify()
      .then((api) => {
        if (!vivant || !nid.current) return
        api.createController(
          nid.current,
          { uri: `spotify:playlist:${PLAYLISTS[0].id}`, width: "100%", height: 80, theme: "dark" },
          (c) => {
            if (!vivant) {
              c.destroy()
              return
            }
            controleur.current = c
            desarme()
            armeGarde(ATTENTE_EMBED * 3)
            c.addListener("ready", () => {
              desarme()
              if (vivant) ecran.majSpotify({ repli: false })
            })
            c.addListener("playback_update", (e) => {
              if (!vivant) return
              const duree = e.data.duration ?? 0
              const position = e.data.position ?? 0
              /* la détection de changement de piste */
              if ((duree > 0 && m.duree > 0 && duree !== m.duree) || position + 2000 < m.position) m.piste++
              m.duree = duree
              m.position = position
              m.enLecture = e.data.isPaused === false
              desarme()
              ecran.majSpotify({ enLecture: m.enLecture, position, duree, piste: m.piste, repli: false })
            })
          },
        )
      })
      .catch(() => vivant && ecran.majSpotify({ repli: true }))
    commandes.current = {
      bascule: () => controleur.current?.togglePlay(),
      reprend: () => controleur.current?.restart(),
      /* le saut de piste : l'API n'a pas de « suivante » — seek à la
         dernière seconde, le player enchaîne tout seul */
      saute: () => {
        const c = controleur.current
        if (!c || m.duree < 3000) return
        c.seek(Math.max(0, m.duree / 1000 - 0.8))
        if (!m.enLecture) c.play()
      },
      chargeMix: (i: number) => {
        if (i === m.indice) return
        m.indice = i
        m.piste = 1
        Object.assign(m, { duree: 0, position: 0, enLecture: false })
        controleur.current?.loadUri(`spotify:playlist:${PLAYLISTS[i].id}`)
        ecran.majSpotify({ indice: i, piste: 1, position: 0, duree: 0, enLecture: false })
      },
    }
    return () => {
      vivant = false
      desarme()
      commandes.current = null
      controleur.current?.destroy()
      controleur.current = null
    }
  }, [ecran, commandes])

  /* dans le viewport (la lecture continue), mais invisible et sourd */
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden>
      <div ref={nid} style={{ height: 80 }} />
    </div>
  )
}

/* la couche vivante du player, cadencée à l'image (plafonnée dans
   ticSpotify à ~30 repeints/s — bougies, crêtes, marquee, LCD) */
export function RythmeAmp({ actif, ecran }: { actif: boolean; ecran: Ecran }) {
  useFrame((_, dt) => {
    if (actif) ecran.ticSpotify(Math.min(dt, 0.1))
  })
  return null
}
