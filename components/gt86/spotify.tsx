"use client"

import { useEffect, useRef, type MutableRefObject } from "react"
import { useFrame } from "@react-three/fiber"
import { PLAYLISTS, type Ecran } from "./ecran"

/* LE MOTEUR DU HJ·AMP — ticket #33, 7e retour de gate (« tourner la
   molette pour baisser le son »). L'iframe officielle de l'embed est
   MORTE ici : son protocole n'a aucune commande volume (énum vérifiée
   dans le wrapper ET dans la page embed — play/pause/resume/toggle/
   seek/ack/fullscreen, rien d'autre) et son audio est inaccessible
   cross-origin. Le son passe donc par un moteur À NOUS :

   - /api/gt86/mix/[id] (notre serveur) rend titres + préversions MP3
     du mix — le client ne parle jamais à open.spotify.com ;
   - un <audio> maison lit les préversions (p.scdn.co, CORS ouvert) à
     travers un GainNode : la molette pilote un VRAI volume ;
   - un AnalyserNode tape le flux : les 19 bougies dansent sur le VRAI
     spectre — la limite documentée aux gates précédents tombe ;
   - ⏮/⏭ deviennent de VRAIS changements de piste (fini le seek à la
     dernière seconde), et le marquee affiche le VRAI titre.

   Ce qu'on perd : la lecture complète pour les comptes connectés —
   l'embed sans session ne servait déjà que ces mêmes préversions 30 s.
   La FAÇADE RGPD tient inchangée : PAS UN OCTET (ni chez nous ni chez
   le CDN) avant le clic MUSIQUES — le moteur ne se monte qu'après. */

type Piste = { titre: string; artiste: string; apercu: string }

export type CommandesSpotify = {
  bascule: () => void
  /* ⏮ : recommence la piste si elle a plus de 3 s, sinon la précédente */
  reprend: () => void
  saute: () => void
  chargeMix: (i: number) => void
  /* la molette : delta signé, borné [0 ; 1] — pousse `volume` au peintre */
  volume: (delta: number) => void
}

/* le volume survit aux allers-retours hub ↔ player (module, pas d'état React) */
let volumeMemorise = 0.8
/* UN SEUL AudioContext pour la session (revue adversariale : un contexte
   par visite fuyait — jamais fermé, chacun retenant son <audio> ; et
   Safari plafonne les contextes simultanés). Les nœuds, eux, vivent par
   montage et se déconnectent au démontage. */
let ctxAudio: AudioContext | null = null

export function MoteurSpotify({
  ecran,
  commandes,
  mix,
}: {
  ecran: Ecran
  commandes: MutableRefObject<CommandesSpotify | null>
  mix: number
}) {
  /* `mix` ne sert qu'au montage — changer de mix passe par chargeMix */
  const mixInitial = useRef(mix)

  useEffect(() => {
    let vivant = true
    const m = {
      pistes: [] as Piste[],
      indice: 0,
      mix: mixInitial.current,
      volume: volumeMemorise,
      rates: 0,
    }
    const audio = new Audio()
    audio.crossOrigin = "anonymous"
    audio.preload = "auto"
    /* le repli sans Web Audio (contexte refusé) : el.volume porte le
       réglage — initialisé, sinon la lecture partait à fond */
    audio.volume = volumeMemorise * volumeMemorise

    /* le graphe Web Audio — APRÈS le premier play() (le contexte exige un
       geste utilisateur ; le clic de façade l'a déjà donné, mais un
       navigateur têtu le refuse sans casser l'audio : gain et analyseur
       deviennent alors optionnels, el.volume prend le relais) */
    let gain: GainNode | null = null
    let analyseur: AnalyserNode | null = null
    let noeuds: AudioNode[] = []
    const armeGraphe = () => {
      /* resume À CHAQUE appel — bascule() tourne dans la pile du clic,
         c'est là que Safari accepte de sortir un contexte de 'suspended'
         (revue : le resume unique à la création laissait le son mort) */
      if (gain) {
        void ctxAudio?.resume()
        return
      }
      try {
        ctxAudio ??= new AudioContext()
        const source = ctxAudio.createMediaElementSource(audio)
        gain = ctxAudio.createGain()
        analyseur = ctxAudio.createAnalyser()
        analyseur.fftSize = 128
        analyseur.smoothingTimeConstant = 0.55
        source.connect(gain)
        gain.connect(ctxAudio.destination)
        /* l'analyseur écoute APRÈS le gain : les bougies suivent ce qui
           SORT — baisser la molette couche le spectre, comme la skin
           de référence suivait la sortie, pas la source */
        gain.connect(analyseur)
        gain.gain.value = m.volume * m.volume
        noeuds = [source, gain, analyseur]
        void ctxAudio.resume()
      } catch {
        gain = null
        analyseur = null
      }
    }

    const pousse = () => {
      if (!vivant) return
      const p = m.pistes[m.indice]
      ecran.majSpotify({
        enLecture: !audio.paused && !audio.ended,
        position: audio.currentTime * 1000,
        duree: (Number.isFinite(audio.duration) ? audio.duration : 30) * 1000,
        piste: m.indice + 1,
        pistes: m.pistes.length,
        titre: p ? `${p.titre} — ${p.artiste}` : "",
        indice: m.mix,
      })
    }

    const joue = (k: number) => {
      if (!m.pistes.length) return
      m.indice = ((k % m.pistes.length) + m.pistes.length) % m.pistes.length
      audio.src = m.pistes[m.indice].apercu
      armeGraphe()
      audio.play().catch(() => {})
      pousse()
    }

    audio.addEventListener("timeupdate", pousse)
    audio.addEventListener("play", pousse)
    audio.addEventListener("playing", () => {
      m.rates = 0
    })
    audio.addEventListener("pause", pousse)
    audio.addEventListener("ended", () => joue(m.indice + 1))
    audio.addEventListener("error", () => {
      /* une préversion peut mourir (lien périmé) : on passe à la
         suivante — tout le mix mort = repli */
      if (!vivant || !m.pistes.length) return
      m.rates += 1
      if (m.rates >= m.pistes.length) {
        audio.pause()
        ecran.majSpotify({ repli: true })
      } else joue(m.indice + 1)
    })

    const charge = (i: number) => {
      m.mix = i
      m.rates = 0
      /* l'ancien mix se TAIT tout de suite (revue : il continuait de
         jouer pendant le fetch, et son timeupdate écrasait le repli) */
      audio.pause()
      m.pistes = []
      ecran.majSpotify({ indice: i, piste: 1, position: 0, duree: 0, enLecture: false, titre: "" })
      fetch(`/api/gt86/mix/${PLAYLISTS[i].id}`, { signal: AbortSignal.timeout(12000) })
        .then((r) => r.json())
        .then((corps: { pistes?: Piste[] }) => {
          if (!vivant || m.mix !== i) return
          m.pistes = corps.pistes ?? []
          if (!m.pistes.length) ecran.majSpotify({ repli: true })
          else {
            ecran.majSpotify({ repli: false })
            joue(0)
          }
        })
        .catch(() => vivant && m.mix === i && ecran.majSpotify({ repli: true }))
    }

    /* le spectre — 64 bacs FFT groupés en 19 bandes géométriques ;
       poussé ~25×/s, seulement quand ça joue (le peintre retombe en
       danse procédurale dès que le flux se tarit) */
    const bacs = new Uint8Array(64)
    const bandes = new Array<number>(19)
    /* bornes géométriques STRICTEMENT croissantes : chaque bougie lit ses
       propres bacs (revue : le floor dégénérait le tiers gauche) */
    const bords = [1]
    for (let i = 1; i <= 19; i++) bords.push(Math.max(bords[i - 1] + 1, Math.round(Math.pow(48, i / 19))))
    const horlogeSpectre = setInterval(() => {
      if (!vivant || !analyseur || audio.paused) return
      analyseur.getByteFrequencyData(bacs)
      for (let i = 0; i < 19; i++) {
        let somme = 0
        for (let b = bords[i]; b < bords[i + 1]; b++) somme += bacs[b]
        bandes[i] = Math.pow(somme / (bords[i + 1] - bords[i]) / 255, 0.75)
      }
      ecran.majSpectre(bandes)
    }, 40)

    commandes.current = {
      bascule: () => {
        if (audio.paused) {
          armeGraphe()
          audio.play().catch(() => {})
        } else audio.pause()
      },
      reprend: () => {
        if (audio.currentTime > 3) {
          audio.currentTime = 0
          pousse()
        } else joue(m.indice - 1)
      },
      saute: () => joue(m.indice + 1),
      chargeMix: (i: number) => {
        if (i !== m.mix || !m.pistes.length) charge(i)
      },
      volume: (delta: number) => {
        m.volume = Math.min(1, Math.max(0, m.volume + delta))
        volumeMemorise = m.volume
        /* courbe quadratique — l'oreille est logarithmique */
        if (gain) gain.gain.value = m.volume * m.volume
        else audio.volume = m.volume * m.volume
        ecran.majSpotify({ volume: m.volume })
      },
    }

    /* pas de `volume` ici : l'écran garde le sien (une poussée armerait
       la surcouche VOL sans geste de molette) — les deux mémoires ne
       divergent jamais, chaque cran passe par majSpotify */
    ecran.majSpotify({ repli: false })
    charge(m.mix)

    return () => {
      vivant = false
      clearInterval(horlogeSpectre)
      commandes.current = null
      audio.pause()
      audio.removeAttribute("src")
      for (const n of noeuds) n.disconnect()
    }
  }, [ecran, commandes])

  return null
}

/* la couche vivante du player, cadencée à l'image (plafonnée dans
   ticSpotify à ~30 repeints/s — bougies, crêtes, marquee, LCD) */
export function RythmeAmp({ actif, ecran }: { actif: boolean; ecran: Ecran }) {
  useFrame((_, dt) => {
    if (actif) ecran.ticSpotify(Math.min(dt, 0.1))
  })
  return null
}
