"use client"

import { useFrame } from "@react-three/fiber"
import { ALLUME, TOURS_BUTEE, TOURS_RALENTI, VITESSE_BUTEE, allumeHabitacle, poseAiguilles, type Cockpit } from "./habitacle"
import type { Etat } from "./machine"
import { musiqueCoupee } from "./musique-intro"
import { contexteAudio } from "./spotify"

/* LE DÉMARRAGE (#42) : en entrant dans la voiture, la GT86 démarre. Le
   seuil (seuil.tsx) a éteint le tableau de bord sous la traversée du
   verre ; à la fin de sa course il lance ce démarrage, joué sur le son :
   - au démarreur, les voyants s'allument et vacillent avec les
     compressions, les phares et les néons baissent (la batterie débite) ;
   - à la prise, les aiguilles balaient jusqu'en butée et reviennent, comme
     sur une vraie GT86, puis le compte-tours suit le régime du son jusqu'au
     ralenti (~800 tr/min) où il tremble à peine ; tout l'habitacle
     s'allume en cascade et les phares reprennent toute leur force.
   Ni le skip ni la session revenante ne démarrent : ils arrivent moteur
   tournant (allumeHabitacle).

   Deux sons, interrupteur ?moteur=libre|synth|0 (libre par défaut) :
   - libre : Subaru Impreza 2003 (boxer EJ20), « subaru impreza start
     up-idle-launch limiter.wav » de t33kno sur Freesound, CC0
     (crédits du README) ;
   - synth : un boxer synthétisé hors ligne (tools/moteur/synth-demarrage.mjs).
   Zéro octet audio avant le clic de décollage : le fichier part sous la
   chute (prechargeDemarrage, appelée dans le clic). Le son passe par le
   contexte audio partagé et se tait si la MUSIQUE a été coupée. */

export type Moteur = "libre" | "synth"

export function moteurVoulu(): Moteur | null {
  if (typeof location === "undefined") return null
  const valeur = new URLSearchParams(location.search).get("moteur")
  if (valeur === "0") return null
  return valeur === "synth" ? "synth" : "libre"
}

/* la partition de chaque son, en secondes depuis son début : le démarreur
   lance, le moteur prend, puis le régime retombe vers le ralenti avec la
   constante de temps `retombee` (relevés à l'enveloppe et au spectrogramme) */
const SONS: Record<Moteur, { fichier: string; demarreur: number; prise: number; retombee: number }> = {
  libre: { fichier: "/sons/demarrage-libre.m4a", demarreur: 0.08, prise: 0.44, retombee: 1.1 },
  synth: { fichier: "/sons/demarrage-synth.m4a", demarreur: 0.1, prise: 0.72, retombee: 0.55 },
}
const VOLUME = 0.8
/* la source se cale un souffle plus tard que l'appel : son départ tombe
   juste, même si le fil audio est en retard d'un bloc */
const AVANCE_S = 0.05
const TOURS_LANCEUR = 250
const TOURS_COUP_DE_GAZ = 2500
const MONTEE_S = 0.09
/* les compressions au lanceur font vaciller la tension, ~8 par seconde */
const VACILLEMENT_HZ = 8
/* le balayage des aiguilles depuis la prise : montée, butée, retour */
const BALAYAGE = { monte: 0.55, tenue: 0.7, revient: 1.35 }
/* le tableau s'allume en cascade après la prise : [début, fin] en secondes */
const CASCADE = {
  cadran: [0, 0.2],
  boutons: [0.1, 0.4],
  planche: [0.25, 0.6],
  ecran: [0.45, 0.95],
} as const
const CASCADE_FIN = 0.95
/* au démarreur, ce que débite la batterie : voyants à mi-force, phares
   et néons baissés */
const VOYANTS = 0.35
const TENSION_LANCEUR = 0.55

let tampon: AudioBuffer | null = null
let chargement: Promise<void> | null = null
let depart: { son: (typeof SONS)[Moteur]; audio: number | null; t: number; allume: boolean } | null = null

/* appelée dans le clic de décollage : le son a toute la chute pour arriver */
export function prechargeDemarrage(moteur: Moteur | null) {
  if (!moteur || chargement) return
  chargement = fetch(SONS[moteur].fichier)
    .then((reponse) => {
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
      return reponse.arrayBuffer()
    })
    .then((octets) => contexteAudio().decodeAudioData(octets))
    .then((decode) => {
      tampon = decode
    })
    .catch((e) => console.warn("[gt86] son du démarrage indisponible, démarrage muet", e))
}

/* appelée par le seuil au bout de sa course, dans l'habitacle */
export function lanceDemarrage(moteur: Moteur) {
  depart = { son: SONS[moteur], audio: joueSon(), t: 0, allume: false }
}

/* l'instant de départ sur l'horloge audio, ou null sans son : le
   démarrage se joue alors en silence sur l'horloge des images */
function joueSon(): number | null {
  const ctx = contexteAudio()
  if (!tampon || ctx.state !== "running" || musiqueCoupee()) return null
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = tampon
  gain.gain.value = VOLUME
  source.connect(gain).connect(ctx.destination)
  const debut = ctx.currentTime + AVANCE_S
  source.start(debut)
  source.onended = () => {
    source.disconnect()
    gain.disconnect()
  }
  return debut
}

export function Demarrage({ etat, cockpit }: { etat: Etat; cockpit: Cockpit }) {
  useFrame(({ clock }, delta) => {
    /* le rejeu repart d'une voiture morte */
    if (etat === "CIEL" || etat === "ATTERRISSAGE") {
      depart = null
      return
    }
    if (!depart) {
      /* skip et session revenante : moteur déjà au ralenti */
      if (etat !== "SEUIL") poseAiguilles(cockpit, TOURS_RALENTI + tremble(clock.elapsedTime), 0)
      return
    }
    depart.t = horloge(depart.audio, depart.t, delta)
    const { son, t } = depart
    if (!depart.allume && t - son.prise > CASCADE_FIN) {
      /* la cascade est finie : l'état final d'un coup, puis plus que les
         aiguilles (l'écran et ses modes reprennent la main) */
      allumeHabitacle(cockpit)
      depart.allume = true
    }
    if (!depart.allume) eclaire(cockpit, son, t)
    const tours = regime(son, t)
    const balaye = balayage(t - son.prise)
    poseAiguilles(cockpit, tours + (TOURS_BUTEE - tours) * balaye, VITESSE_BUTEE * balaye)
  })
  return null
}

/* l'horloge audio quand le son joue (latence de sortie déduite), sinon
   celle des images, au delta plafonné comme les chorégraphes */
function horloge(audio: number | null, t: number, delta: number) {
  if (audio === null) return t + Math.min(delta, 1 / 12)
  const ctx = contexteAudio()
  return Math.max(0, ctx.currentTime - audio - (ctx.outputLatency || 0))
}

const lisse = (a: number, b: number, t: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))
const adoucit = (t: number) => t * t * (3 - 2 * t)

/* le régime du son : rien, le lanceur, puis le coup de gaz qui retombe
   vers le ralenti */
function regime(son: (typeof SONS)[Moteur], t: number) {
  if (t < son.demarreur) return 0
  if (t < son.prise) return TOURS_LANCEUR * (1 + 0.2 * Math.sin((t - son.demarreur) * 2 * Math.PI * VACILLEMENT_HZ))
  const u = t - son.prise
  return TOURS_RALENTI + (TOURS_COUP_DE_GAZ - TOURS_RALENTI) * (1 - Math.exp(-u / MONTEE_S)) * Math.exp(-u / son.retombee) + tremble(t)
}

/* le ralenti tremble à peine : ±20 tr/min, moins d'un demi-degré */
function tremble(t: number) {
  return 12 * Math.sin(t * 2 * Math.PI * 9) + 8 * Math.sin(t * 2 * Math.PI * 23)
}

/* 0 → 1 → 0 : la butée et le retour, depuis la prise */
function balayage(prise: number) {
  if (prise < 0) return 0
  if (prise < BALAYAGE.monte) return adoucit(prise / BALAYAGE.monte)
  if (prise < BALAYAGE.tenue) return 1
  return 1 - adoucit(lisse(BALAYAGE.tenue, BALAYAGE.revient, prise))
}

/* les lumières à l'instant t : uniforms seulement (topologie constante,
   voir le Cockpit d'habitacle.tsx) */
function eclaire(cockpit: Cockpit, son: (typeof SONS)[Moteur], t: number) {
  const lance = t >= son.demarreur && t < son.prise
  const vacille = 0.75 + 0.25 * Math.sin((t - son.demarreur) * 2 * Math.PI * VACILLEMENT_HZ)
  const prise = t - son.prise
  const cascade = ([a, b]: readonly [number, number]) => adoucit(lisse(a, b, prise))
  /* les voyants : rien avant le démarreur, mi-force vacillante au
     lanceur, pleine force en cascade après la prise */
  const voyant = (etape: readonly [number, number]) =>
    t < son.demarreur ? 0 : lance ? VOYANTS * vacille : VOYANTS + (1 - VOYANTS) * cascade(etape)
  const cadran = voyant(CASCADE.cadran)
  for (const m of cockpit.cadran) m.emissiveIntensity = cadran * ALLUME.cadran
  for (const m of cockpit.aiguille) m.emissiveIntensity = cadran * ALLUME.aiguille
  const boutons = voyant(CASCADE.boutons)
  for (const m of cockpit.boutons) m.emissiveIntensity = boutons * ALLUME.boutons
  const planche = cascade(CASCADE.planche)
  for (const m of cockpit.planche) m.emissiveIntensity = planche * ALLUME.planche
  const ecran = cascade(CASCADE.ecran)
  for (const m of cockpit.ecran) {
    m.emissiveIntensity = ecran * ALLUME.ecran
    m.color.setScalar(ecran)
  }
  /* dehors : les phares et les néons baissent pendant que le démarreur
     tire sur la batterie */
  const tension = lance ? TENSION_LANCEUR * vacille : 1
  for (const m of cockpit.optiques) m.emissiveIntensity = tension * ALLUME.optiques
  for (const m of cockpit.signature) m.emissiveIntensity = tension * ALLUME.signature
  for (const l of cockpit.phareLums) l.intensity = tension * ALLUME.faisceau
  for (const n of cockpit.neonLums) n.lum.intensity = tension * n.plein
}
