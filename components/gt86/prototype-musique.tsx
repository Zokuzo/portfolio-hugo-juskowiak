"use client"

import { useEffect, useState } from "react"
import type { Lang } from "@/components/proto/dict"
import type { Etat } from "./machine"
import { contexteAudio } from "./spotify"

/* PROTOTYPE JETABLE (#58) : LA MUSIQUE DE L'INTRO.

   « VISION (Slowed) » (UdieNnx, HXVSAGE, Duduzinho), le choix de Hugo pour
   la chute. Piste sous droits : on n'héberge RIEN, on lit la préversion du
   CDN Spotify (p.scdn.co, CORS ouvert), comme le lecteur de l'habitacle.
   La préversion fait 24 s : 2 s de montée, puis la partie pleine jusqu'au
   bout. La chute (vol 4,6 s + seuil 6,6 s) tombe donc dessus en entier.

   Commuté par ?musique=a|b sur / ; sans paramètre, lanceMusique() sort
   tout de suite et le composant n'est pas monté.
   - a : départ au clic de décollage, fondu d'entrée 600 ms, fondu de
     sortie à l'entrée dans l'habitacle ;
   - b : même départ, puis la boucle continue à volume réduit dans
     l'habitacle jusqu'à ce que le lecteur Spotify prenne la main.

   Zéro octet audio avant le clic : l'<audio> naît dans lanceMusique(),
   appelée dans la pile du clic (geste exigé par les navigateurs). */

type Variante = "a" | "b"

/* ponytail: URL relevée le 2026-10-16 dans open.spotify.com/embed/track/
   7fx9paDdMEk5xrF5yVWUfW (audioPreview.url) ; si elle meurt, silence. Une
   route serveur comme /api/gt86/mix le jour où on garde la musique. */
const PREVERSION = "https://p.scdn.co/mp3-preview/7fb250cd985d7beeaad88f05390d59a123fb6da3"
const VOLUME = 0.6
const VOLUME_HABITACLE = 0.18
const FONDU_ENTREE_S = 0.6
const FONDU_SORTIE_S = 1.6

export function musiqueVoulue(): Variante | null {
  const v = new URLSearchParams(window.location.search).get("musique")
  return v === "a" || v === "b" ? v : null
}

/* une seule lecture à la fois, au module : le clic et le composant la
   partagent sans passer par React */
let lecture: { audio: HTMLAudioElement; fondu: GainNode; coupe: GainNode; noeuds: AudioNode[] } | null = null
const ecouteurs = new Set<() => void>()
const previens = () => ecouteurs.forEach((f) => f())

export function lanceMusique() {
  if (!musiqueVoulue() || lecture) return
  /* un contexte refusé ne doit jamais bloquer le décollage : sans
     musique, la chute part quand même */
  try {
    const ctx = contexteAudio()
    const audio = new Audio()
    audio.crossOrigin = "anonymous"
    audio.loop = true
    audio.src = PREVERSION
    const source = ctx.createMediaElementSource(audio)
    const fondu = ctx.createGain()
    const coupe = ctx.createGain()
    source.connect(fondu).connect(coupe).connect(ctx.destination)
    fondu.gain.setValueAtTime(0, ctx.currentTime)
    fondu.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + FONDU_ENTREE_S)
    lecture = { audio, fondu, coupe, noeuds: [source, fondu, coupe] }
    void ctx.resume()
    audio.play().catch((e) => console.warn("[gt86] musique de l'intro refusée", e))
    previens()
  } catch (e) {
    console.warn("[gt86] musique de l'intro impossible", e)
  }
}

function rampe(cible: number, duree: number) {
  if (!lecture) return
  const ctx = contexteAudio()
  const g = lecture.fondu.gain
  g.cancelScheduledValues(ctx.currentTime)
  g.setValueAtTime(g.value, ctx.currentTime)
  g.linearRampToValueAtTime(cible, ctx.currentTime + duree)
}

function arrete(duree: number) {
  const l = lecture
  if (!l) return
  rampe(0, duree)
  lecture = null
  previens()
  setTimeout(() => {
    l.audio.pause()
    l.audio.removeAttribute("src")
    for (const n of l.noeuds) n.disconnect()
  }, duree * 1000 + 50)
}

export function MusiqueIntro({ variante, etat, ampVivant, lang }: { variante: Variante; etat: Etat; ampVivant: boolean; lang: Lang }) {
  const [enCours, setEnCours] = useState(lecture !== null)
  const [muet, setMuet] = useState(false)

  useEffect(() => {
    const f = () => setEnCours(lecture !== null)
    ecouteurs.add(f)
    return () => {
      ecouteurs.delete(f)
      arrete(0)
    }
  }, [])

  /* l'habitacle : a s'éteint, b se range sous la conversation ; le
     lecteur Spotify, le rejeu (retour au CIEL) et le départ coupent tout */
  useEffect(() => {
    if (ampVivant || etat === "CIEL" || etat === "DEPART") arrete(etat === "CIEL" ? 0.2 : FONDU_SORTIE_S)
    else if (etat === "HABITACLE") {
      if (variante === "a") arrete(FONDU_SORTIE_S)
      else rampe(VOLUME_HABITACLE, FONDU_SORTIE_S)
    }
  }, [variante, etat, ampVivant])

  useEffect(() => {
    if (lecture) lecture.coupe.gain.value = muet ? 0 : 1
  }, [muet, enCours])

  if (!enCours) return null
  /* bouton bascule : le libellé visible est le nom accessible (WCAG
     2.5.3), l'état passe par aria-pressed, enfoncé quand le son joue */
  return (
    <button
      type="button"
      aria-pressed={!muet}
      onClick={() => setMuet((m) => !m)}
      style={{
        position: "absolute",
        top: 16,
        right: 18,
        font: "500 11px/1 var(--f-mono)",
        letterSpacing: "0.14em",
        /* encre pleine et halo sombre : lisible sur le voile crème */
        color: "#e8dff5",
        textShadow: "0 0 3px rgba(40, 20, 40, 0.8), 0 0 10px rgba(40, 20, 40, 0.45)",
        background: "transparent",
        border: "none",
        padding: "8px 10px",
        cursor: "pointer",
      }}
    >
      {lang === "fr" ? "♪ MUSIQUE" : "♪ MUSIC"}
    </button>
  )
}
