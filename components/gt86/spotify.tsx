"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { t, type Lang } from "@/components/proto/dict"
import { ECRAN_NATIF, PLAYLISTS, PROFIL_SPOTIFY } from "./ecran"
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

/* ---- la skin ----------------------------------------------------------- */

const LCD_FOND = "#160a20"
const LCD_ENCRE = "#ffd9f6"
const CHROME: CSSProperties = {
  background: "linear-gradient(165deg, #d493ec 0%, #a95fd0 34%, #8a45b4 62%, #6b3193 100%)",
}
const puits: CSSProperties = {
  background: LCD_FOND,
  border: "2px solid",
  borderColor: "#3a1548 #e2b6f4 #e2b6f4 #3a1548",
  borderRadius: 2,
}
const biseau: CSSProperties = {
  background: "linear-gradient(180deg, #edc4fa, #b06ad4 45%, #8e4bb0)",
  border: "2px solid",
  borderColor: "#f6e0ff #4d2064 #4d2064 #f6e0ff",
  borderRadius: 4,
  color: "#2e1040",
  cursor: "pointer",
  font: "700 11px/1 var(--f-mono)",
}
const legende: CSSProperties = {
  font: "700 9px/1 var(--f-mono)",
  letterSpacing: "0.22em",
  color: "#f3daff",
  textShadow: "1px 1px 0 #4d2064",
}

const formatTemps = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

/* l'égaliseur : 19 barres qui ne dansent QUE pendant la lecture (niveau
   lissé vers 0 à la pause), crêtes qui retombent — au canvas, à l'image */
function Egaliseur({ enLecture }: { enLecture: boolean }) {
  const toile = useRef<HTMLCanvasElement>(null)
  const lecture = useRef(enLecture)
  lecture.current = enLecture
  useEffect(() => {
    const c = toile.current
    if (!c) return
    const g = c.getContext("2d")!
    const N = 19
    const cretes = new Array(N).fill(0)
    let niveau = 0
    let vivant = true
    let rafId = 0
    const peint = (t: number) => {
      if (!vivant) return
      const L = c.width
      const H = c.height
      niveau += ((lecture.current ? 1 : 0) - niveau) * 0.06
      g.fillStyle = LCD_FOND
      g.fillRect(0, 0, L, H)
      const pas = L / N
      const tt = t / 1000
      for (let i = 0; i < N; i++) {
        const forme = 0.55 + 0.45 * Math.sin((i / N) * Math.PI * 1.4 + 0.4)
        const danse =
          0.5 +
          0.28 * Math.sin(tt * (2.1 + (i % 5) * 0.9) + i * 1.7) +
          0.22 * Math.sin(tt * (5.3 + (i % 3) * 1.3) + i * 0.6)
        const h = Math.max(0.02, niveau * forme * danse) * (H - 6)
        const x = i * pas + 2
        const lb = pas - 4
        const grad = g.createLinearGradient(0, H, 0, H - h)
        grad.addColorStop(0, "#7a2cf0")
        grad.addColorStop(0.6, "#c86df0")
        grad.addColorStop(1, "#ffd9f6")
        g.fillStyle = grad
        g.fillRect(x, H - h, lb, h)
        cretes[i] = Math.max(cretes[i] - (H / 60) * 0.35, h)
        g.fillStyle = "#ffe9fb"
        g.fillRect(x, H - cretes[i] - 2, lb, 2)
      }
      rafId = requestAnimationFrame(peint)
    }
    rafId = requestAnimationFrame(peint)
    return () => {
      vivant = false
      cancelAnimationFrame(rafId)
    }
  }, [])
  return <canvas ref={toile} width={430} height={44} style={{ width: "100%", height: "100%", display: "block" }} />
}

export function PanneauSpotify({ lang, surRetour }: { lang: Lang; surRetour: () => void }) {
  const [indice, setIndice] = useState(0)
  /* null = en chargement, true = le player a répondu, false = repli */
  const [charge, setCharge] = useState<boolean | null>(null)
  const [enLecture, setEnLecture] = useState(false)
  const [temps, setTemps] = useState({ position: 0, duree: 0 })
  const nid = useRef<HTMLDivElement>(null)
  const controleur = useRef<ControleurSpotify | null>(null)
  const indiceRef = useRef(0)
  const playlist = PLAYLISTS[indice]

  /* le player : l'API crée l'iframe dans le nid — un seul contrôleur,
     loadUri au changement de playlist */
  useEffect(() => {
    let vivant = true
    const garde = setTimeout(() => setCharge((c) => (c === null ? false : c)), ATTENTE_EMBED)
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
            c.addListener("ready", () => setCharge(true))
            c.addListener("playback_update", (e) => {
              setEnLecture(e.data.isPaused === false)
              setTemps({ position: e.data.position ?? 0, duree: e.data.duration ?? 0 })
            })
          },
        )
      })
      .catch(() => setCharge(false))
    return () => {
      vivant = false
      clearTimeout(garde)
      controleur.current?.destroy()
      controleur.current = null
    }
  }, [])

  const choisitPlaylist = useCallback((i: number) => {
    setIndice(i)
    if (indiceRef.current !== i) {
      indiceRef.current = i
      controleur.current?.loadUri(`spotify:playlist:${PLAYLISTS[i].id}`)
      setEnLecture(false)
      setTemps({ position: 0, duree: 0 })
    }
  }, [])

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        ...CHROME,
        border: "2px solid",
        borderColor: "#f0ccfc #33113f #33113f #f0ccfc",
        borderRadius: 4,
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      <style>{`@keyframes gt86defile { 0% { transform: translateX(100%) } 100% { transform: translateX(-100%) } }`}</style>

      {/* bandeau titre */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "3px 6px",
          background: "linear-gradient(90deg, #5a2378, #a95fd0 45%, #5a2378)",
          borderBottom: "1px solid #33113f",
        }}
      >
        <button
          type="button"
          data-gt86="spotify-retour"
          onClick={surRetour}
          style={{ ...biseau, padding: "1px 8px 2px", fontSize: 12 }}
        >
          ‹
        </button>
        <span style={{ ...legende, fontStyle: "italic", fontSize: 11, letterSpacing: "0.3em" }}>HJ·AMP</span>
        <span style={{ flex: 1 }} />
        <span style={{ display: "flex", gap: 3 }}>
          {[0, 1, 2].map((k) => (
            <i key={k} style={{ width: 6, height: 6, background: "#33113f", boxShadow: "inset 1px 1px 0 #f0ccfc" }} />
          ))}
        </span>
      </div>

      {/* LCD : temps réel + titre défilant + mentions */}
      <div style={{ display: "flex", gap: 6, padding: "6px 8px 4px" }}>
        <div style={{ ...puits, padding: "4px 10px", minWidth: 118, textAlign: "right" }}>
          <span
            style={{
              font: "700 26px/1 var(--f-mono)",
              color: LCD_ENCRE,
              textShadow: "0 0 7px #ff64d2",
              letterSpacing: "0.06em",
            }}
          >
            {formatTemps(temps.position)}
          </span>
        </div>
        <div style={{ ...puits, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
            <span
              style={{
                display: "inline-block",
                font: "700 12px/1 var(--f-mono)",
                letterSpacing: "0.28em",
                color: LCD_ENCRE,
                textShadow: "0 0 6px #ff64d2",
                animation: "gt86defile 9s linear infinite",
              }}
            >
              {playlist.nom.toUpperCase()} · SPOTIFY · {formatTemps(temps.duree)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              font: "700 8px/1 var(--f-mono)",
              letterSpacing: "0.2em",
              color: "#8d6aa8",
              padding: "4px 2px 0",
            }}
          >
            <span style={{ color: LCD_ENCRE }}>320 KBPS · 44 KHZ</span>
            <span>
              MONO <span style={{ color: enLecture ? LCD_ENCRE : "#8d6aa8" }}>STEREO</span>
            </span>
          </div>
        </div>
      </div>

      {/* l'égaliseur — les barres suivent le VRAI état de lecture */}
      <div style={{ padding: "0 8px 4px" }}>
        <div style={{ textAlign: "center", ...legende, padding: "1px 0 3px" }}>E Q U A L I Z E R</div>
        <div style={{ ...puits, height: 46, overflow: "hidden" }}>
          <Egaliseur enLecture={enLecture} />
        </div>
      </div>

      {/* la fenêtre de lecture : l'iframe de l'API niche ici — le nid
          reste MONTÉ même quand le repli s'affiche (l'horloge de repli
          peut sonner avant un contrôleur lent : s'il finit par répondre,
          `ready` remet le player en place — repli non destructif) */}
      <div style={{ margin: "0 8px", ...puits, padding: 2, display: charge === false ? "none" : "block" }}>
        <div ref={nid} style={{ height: 80 }} />
      </div>

      {charge === false ? (
        /* le repli « écran custom qui linke » (doctrine #18) */
        <div
          style={{
            flex: 1,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            padding: 12,
            font: "700 11px/1.8 var(--f-mono)",
            color: "#f3daff",
          }}
        >
          <div>
            {t(lang, "gt86SpotifyBloque")}
            <br />
            <a href={playlist.url} target="_blank" rel="noopener noreferrer" style={{ color: "#ffd9f6" }}>
              {playlist.nom} ↗
            </a>
          </div>
        </div>
      ) : (
        <>

          {/* PLAYLIST : les quatre mixes du #19 en rangées Winamp */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "4px 8px 0" }}>
            <div style={{ textAlign: "center", ...legende, padding: "1px 0 3px" }}>P L A Y L I S T</div>
            <div style={{ ...puits, flex: 1, minHeight: 0, overflowY: "auto", padding: "3px 6px" }}>
              {PLAYLISTS.map((pl, i) => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => choisitPlaylist(i)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    background: i === indice ? "#3d1a55" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    font: "700 11px/1.8 var(--f-mono)",
                    letterSpacing: "0.08em",
                    color: i === indice ? LCD_ENCRE : "#b48cd4",
                    textShadow: i === indice ? "0 0 6px #ff64d2" : "none",
                    textAlign: "left",
                  }}
                >
                  <span>
                    {i + 1}. {pl.nom}
                  </span>
                  <span>{i === indice && enLecture ? "▶" : "RADIO"}</span>
                </button>
              ))}
            </div>
          </div>

          {/* transport : ⏯ pilote la VRAIE lecture, ◀ ▶ changent de mix */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px 6px" }}>
            <button type="button" style={{ ...biseau, padding: "3px 9px" }} onClick={() => choisitPlaylist((indice + PLAYLISTS.length - 1) % PLAYLISTS.length)}>
              ⏮
            </button>
            <button type="button" style={{ ...biseau, padding: "3px 11px" }} onClick={() => controleur.current?.togglePlay()}>
              {enLecture ? "⏸" : "▶"}
            </button>
            <button type="button" style={{ ...biseau, padding: "3px 9px" }} onClick={() => choisitPlaylist((indice + 1) % PLAYLISTS.length)}>
              ⏭
            </button>
            <span style={{ flex: 1 }} />
            <a
              href={PROFIL_SPOTIFY}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...legende, fontSize: 8, textDecoration: "none" }}
            >
              {t(lang, "gt86OuvrirSpotify")}
            </a>
          </div>
        </>
      )}
    </div>
  )
}
