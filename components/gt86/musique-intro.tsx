"use client"

import { useEffect, useState } from "react"
import type { Lang } from "@/components/proto/dict"
import type { Etat } from "./machine"
import { contexteAudio } from "./spotify"

/* LA MUSIQUE DE L'INTRO (#58) : « VISION (Slowed) » (UdieNnx, HXVSAGE,
   Duduzinho), le choix de Hugo pour la chute. Depuis le #56, l'extrait
   est HÉBERGÉ ici : le début du morceau, du 13,92 s au 48,42 s (34,5 s,
   AAC 128 kbit/s, fondu d'entrée de 30 ms, de sortie de 2 s), coupé et
   calé par Hugo à l'oreille (recoupé pour la chute v4). Piste sous
   droits : Hugo a décidé de l'héberger en connaissance du risque. Il
   remplace la préversion du CDN Spotify, qui commençait trop tard dans
   le morceau pour le montage du #56.

   Départ au clic de décollage ; fondu de sortie de 1,6 s à l'entrée dans
   l'habitacle (la nouvelle chute, elle, a déjà tout fondu avant, voir
   attenueMusique). Zéro octet audio avant le clic : l'<audio> naît dans
   lanceMusique(), appelée dans la pile du clic (geste exigé par les
   navigateurs). */

const SOURCE = "/musique/vision-debut.m4a"
const VOLUME = 0.6
/* un simple anti-clic : le calage de Hugo part du premier échantillon */
const FONDU_ENTREE_S = 0.05
const FONDU_SORTIE_S = 1.6

/* une seule lecture à la fois, au module : le clic et le composant la
   partagent sans passer par React */
let lecture: { audio: HTMLAudioElement; fondu: GainNode; coupe: GainNode; noeuds: AudioNode[] } | null = null
/* le bouton MUSIQUE coupé l'est aussi pour le démarrage du moteur (#42),
   qui joue après la disparition du bouton */
let coupee = false
export const musiqueCoupee = () => coupee
const ecouteurs = new Set<() => void>()
const previens = () => ecouteurs.forEach((f) => f())

export function lanceMusique() {
  if (lecture) return
  /* un contexte refusé ne doit jamais bloquer le décollage : sans
     musique, la chute part quand même */
  try {
    const ctx = contexteAudio()
    const audio = new Audio()
    audio.src = SOURCE
    const source = ctx.createMediaElementSource(audio)
    const fondu = ctx.createGain()
    const coupe = ctx.createGain()
    source.connect(fondu).connect(coupe).connect(ctx.destination)
    fondu.gain.setValueAtTime(0, ctx.currentTime)
    fondu.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + FONDU_ENTREE_S)
    lecture = { audio, fondu, coupe, noeuds: [source, fondu, coupe] }
    /* sans son, pas de bouton qui en annonce un */
    const echec = (e: unknown) => {
      console.warn("[gt86] musique de l'intro refusée", e)
      if (lecture?.audio === audio) arrete(0)
    }
    audio.addEventListener("error", () => echec(audio.error))
    void ctx.resume()
    audio.play().catch(echec)
    previens()
  } catch (e) {
    console.warn("[gt86] musique de l'intro impossible", e)
  }
}

/* secondes depuis le début de l'extrait, null hors lecture ; pour caler
   des coupes sur la musique (#56). paused reste faux pendant le
   chargement et après un échec réseau : seul readyState dit que le son
   avance vraiment. */
export function tempsMusique(): number | null {
  const audio = lecture?.audio
  return audio && !audio.paused && audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA ? audio.currentTime : null
}

/* recale la lecture sur l'image de la nouvelle chute (#56), quand la
   musique a pris du retard (départ tardif, trou de lecture) */
export function caleMusique(t: number) {
  if (lecture) lecture.audio.currentTime = t
}

/* lancée mais pas encore partie (chargement, mise en mémoire) : la
   nouvelle chute (#56) l'attend pour ne pas se décaler */
export function musiqueEnAttente(): boolean {
  return lecture !== null && !lecture.audio.ended && tempsMusique() === null
}

/* le fondu de la nouvelle chute (#56), de 1 (plein) à 0 (muet), demandé
   image par image : la constante de temps lisse les marches */
export function attenueMusique(niveau: number) {
  if (!lecture) return
  lecture.fondu.gain.setTargetAtTime(VOLUME * niveau, contexteAudio().currentTime, 0.04)
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
  const [muet, setMuet] = useState(coupee)

  /* LE CONTEXTE AUDIO NAÎT SOUS LE VOILE (#42) : `new AudioContext()` est
     synchrone et interroge le périphérique de sortie. Créé dans la pile du
     clic, il gelait l'image du décollage (45 ms en headless muet, de
     l'ordre de 800 ms au relevé ?ips de Hugo). Créé au montage, pendant le
     chargement, il naît suspendu (pas de geste) ; lanceMusique le reprend
     dans le clic, ce qui ne bloque pas. */
  useEffect(() => {
    contexteAudio()
  }, [])

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
    coupee = muet
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
      <span aria-hidden="true">♪ </span>
      {lang === "fr" ? "MUSIQUE" : "MUSIC"}
    </button>
  )
}
