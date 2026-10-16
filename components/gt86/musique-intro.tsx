"use client"

import { useEffect, useState } from "react"
import type { Lang } from "@/components/proto/dict"
import type { Etat } from "./machine"
import { contexteAudio } from "./spotify"

/* LA MUSIQUE DE L'INTRO (#58) : « VISION (Slowed) » (UdieNnx, HXVSAGE,
   Duduzinho), le choix de Hugo pour la chute. Piste sous droits : on
   n'héberge RIEN, /api/gt86/musique-intro renvoie vers la préversion du
   CDN Spotify (p.scdn.co, CORS ouvert), comme le lecteur de l'habitacle.
   La préversion fait 24 s : 2 s de montée, puis la partie pleine jusqu'au
   bout. La chute (vol 4,6 s + seuil 6,6 s) tombe donc dessus en entier.

   Départ au clic de décollage, fondu d'entrée 600 ms ; fondu de sortie
   de 1,6 s à l'entrée dans l'habitacle. Zéro octet audio avant le clic :
   l'<audio> naît dans lanceMusique(), appelée dans la pile du clic
   (geste exigé par les navigateurs). */

const SOURCE = "/api/gt86/musique-intro"
const VOLUME = 0.6
const FONDU_ENTREE_S = 0.6
const FONDU_SORTIE_S = 1.6

/* une seule lecture à la fois, au module : le clic et le composant la
   partagent sans passer par React */
let lecture: { audio: HTMLAudioElement; fondu: GainNode; coupe: GainNode; noeuds: AudioNode[] } | null = null
const ecouteurs = new Set<() => void>()
const previens = () => ecouteurs.forEach((f) => f())

export function lanceMusique() {
  if (lecture) return
  /* un contexte refusé ne doit jamais bloquer le décollage : sans
     musique, la chute part quand même */
  try {
    const ctx = contexteAudio()
    const audio = new Audio()
    audio.crossOrigin = "anonymous"
    audio.loop = true
    audio.src = SOURCE
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

/* secondes depuis le début de l'extrait, null hors lecture ; pour caler
   des coupes sur la musique (#56). L'extrait boucle : le temps repart à 0
   après 24 s. paused reste faux pendant le chargement et après un échec
   réseau : seul readyState dit que le son avance vraiment. */
export function tempsMusique(): number | null {
  const audio = lecture?.audio
  return audio && !audio.paused && audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA ? audio.currentTime : null
}

function arrete(duree: number) {
  const l = lecture
  if (!l) return
  const ctx = contexteAudio()
  const g = l.fondu.gain
  g.cancelScheduledValues(ctx.currentTime)
  g.setValueAtTime(g.value, ctx.currentTime)
  g.linearRampToValueAtTime(0, ctx.currentTime + duree)
  lecture = null
  previens()
  setTimeout(() => {
    l.audio.pause()
    l.audio.removeAttribute("src")
    for (const n of l.noeuds) n.disconnect()
  }, duree * 1000 + 50)
}

export function MusiqueIntro({ etat, ampVivant, lang }: { etat: Etat; ampVivant: boolean; lang: Lang }) {
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

  /* l'habitacle éteint la musique ; le lecteur Spotify, le rejeu (retour
     au CIEL) et le départ aussi */
  useEffect(() => {
    if (etat === "CIEL") arrete(0.2)
    else if (ampVivant || etat === "DEPART" || etat === "HABITACLE") arrete(FONDU_SORTIE_S)
  }, [etat, ampVivant])

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
