"use client"

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { t, type Lang } from "@/components/proto/dict"
import { ECRAN_NATIF, PLAYLISTS, PROFIL_SPOTIFY } from "./ecran"
import { enMondeRepos } from "./rue"
import type { Cockpit } from "./habitacle"

/* SPOTIFY DANS L'ÉCRAN — ticket #33, doctrine des #18/#25 : l'embed est un
   IFRAME À PLAT en overlay DOM, posé sur la dalle (netteté native, vrais
   événements, occlusion sans artefact — CSS3D et drei Html perdaient sur
   les trois, recherche #18). La FAÇADE click-to-load (RGPD) vit dans la
   texture de l'écran (peintMusiques) : PAS UN OCTET ne part chez Spotify
   avant le clic — c'est aussi ce qui tient la passe « zéro requête
   tierce » du harnais. Si l'embed ne répond pas (réseau d'entreprise,
   bloqueur), le REPLI « écran custom qui linke » prend sa place. */

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

/* ---- le panneau ------------------------------------------------------- */

const ENCRE = "#e8dff5"
const onglet = (actif: boolean): CSSProperties => ({
  font: "500 10px/1 var(--f-mono)",
  letterSpacing: "0.06em",
  padding: "7px 8px",
  color: actif ? "#efe8fb" : `${ENCRE}8c`,
  background: actif ? "#8f5cff33" : "transparent",
  border: "none",
  borderBottom: actif ? "2px solid #8f5cff" : "2px solid transparent",
  cursor: "pointer",
  whiteSpace: "nowrap",
})

export function PanneauSpotify({ lang, surRetour }: { lang: Lang; surRetour: () => void }) {
  const [indice, setIndice] = useState(0)
  /* null = en chargement, true = l'embed a répondu, false = repli */
  const [charge, setCharge] = useState<boolean | null>(null)
  const horloge = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playlist = PLAYLISTS[indice]

  useEffect(() => {
    setCharge(null)
    horloge.current = setTimeout(() => {
      setCharge((c) => (c === null ? false : c))
    }, ATTENTE_EMBED)
    return () => {
      if (horloge.current) clearTimeout(horloge.current)
    }
  }, [indice])

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        /* PAS une carte flottante : c'est l'AFFICHAGE de l'écran — opaque,
           coins de dalle, liseré de la lunette, aucune ombre portée */
        background: "#0a0814",
        border: "1px solid #2b2440",
        borderRadius: 4,
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid #8f5cff2e" }}>
        <button
          type="button"
          data-gt86="spotify-retour"
          onClick={surRetour}
          style={{
            font: "500 13px/1 var(--f-mono)",
            color: `${ENCRE}b3`,
            background: "transparent",
            border: "none",
            padding: "0 12px",
            cursor: "pointer",
          }}
        >
          ‹
        </button>
        <div style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none", flex: 1 }}>
          {PLAYLISTS.map((p, i) => (
            <button key={p.id} type="button" style={onglet(i === indice)} onClick={() => setIndice(i)}>
              {p.nom}
            </button>
          ))}
        </div>
      </div>

      {charge === false ? (
        /* le repli « écran custom qui linke » (doctrine #18) */
        <div
          style={{
            flex: 1,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            padding: 16,
            font: "500 12px/1.7 var(--f-mono)",
            color: `${ENCRE}b3`,
          }}
        >
          <div>
            {t(lang, "gt86SpotifyBloque")}
            <br />
            <a
              href={playlist.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#b78aff", font: "500 14px/2.4 var(--f-mono)" }}
            >
              {playlist.nom} ↗
            </a>
          </div>
        </div>
      ) : (
        /* l'embed — thème sombre ; la clé force un iframe NEUF par onglet
           (et relance l'horloge du repli) */
        <iframe
          key={playlist.id}
          title={playlist.nom}
          src={`https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator&theme=0`}
          onLoad={() => setCharge(true)}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ flex: 1, width: "100%", border: 0, background: "#0a0814" }}
        />
      )}

      <a
        href={PROFIL_SPOTIFY}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          font: "500 10px/1 var(--f-mono)",
          letterSpacing: "0.1em",
          color: `${ENCRE}66`,
          textDecoration: "none",
          padding: "8px 12px",
          textAlign: "right",
        }}
      >
        {t(lang, "gt86OuvrirSpotify")}
      </a>
    </div>
  )
}
