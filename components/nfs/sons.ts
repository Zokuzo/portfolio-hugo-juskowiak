import { contexteActif, contexteAudio } from "@/components/gt86/audio"

/* LES SONS D'UI du menu Need for Speed, synthétisés : zéro fichier, zéro
   dépendance (pas de banque CC0 vérifiée sous la main, et un tic de
   30 ms se fabrique en trois nœuds). Un tic sec au déplacement, un
   « clunk » grave à la validation, un souffle pour le volet en biais.
   Le survol ne crée jamais de contexte (ce n'est pas un geste) : il ne
   sonne qu'une fois le contexte lancé par un clic, ou par l'intro. */

type Son = "tic" | "valide" | "souffle"

const VOLUME = { tic: 0.05, valide: 0.32, souffle: 0.12 }

export function joue(son: Son) {
  const ctx = son === "tic" ? contexteActif() : reveille()
  if (!ctx) return
  const t = ctx.currentTime
  if (son === "tic") bip(ctx, t, { freq: 2100, fin: 1400, duree: 0.03, type: "square", volume: VOLUME.tic })
  else if (son === "valide") {
    bip(ctx, t, { freq: 150, fin: 48, duree: 0.22, type: "sine", volume: VOLUME.valide })
    bip(ctx, t, { freq: 900, fin: 300, duree: 0.04, type: "triangle", volume: VOLUME.valide * 0.4 })
  } else souffle(ctx, t)
}

/* un clic EST un geste : c'est là qu'un contexte suspendu accepte de
   repartir (Safari compris) */
function reveille(): AudioContext | null {
  try {
    const ctx = contexteAudio()
    void ctx.resume()
    return ctx
  } catch (e) {
    console.warn("[nfs] son d'UI indisponible", e)
    return null
  }
}

type Bip = { freq: number; fin: number; duree: number; type: OscillatorType; volume: number }

function bip(ctx: AudioContext, t: number, { freq, fin, duree, type, volume }: Bip) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(fin, t + duree)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + duree + 0.02)
  osc.onended = () => gain.disconnect()
}

const SOUFFLE_S = 0.4

function souffle(ctx: AudioContext, t: number) {
  const bruit = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * SOUFFLE_S), ctx.sampleRate)
  const d = bruit.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  const filtre = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  source.buffer = bruit
  filtre.type = "bandpass"
  filtre.Q.value = 1.4
  filtre.frequency.setValueAtTime(400, t)
  filtre.frequency.exponentialRampToValueAtTime(3200, t + SOUFFLE_S)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(VOLUME.souffle, t + SOUFFLE_S * 0.4)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + SOUFFLE_S)
  source.connect(filtre).connect(gain).connect(ctx.destination)
  source.start(t)
  source.onended = () => gain.disconnect()
}
