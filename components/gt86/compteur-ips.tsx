"use client"

import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import type { Etat } from "./machine"

/* LE COMPTEUR D'IMAGES : ticket #42, la cible « aucune image au-dessus de
   16,7 ms ». Le headless ment sur les temps : il faut mesurer sur un vrai
   écran (la préversion Vercel, le PC de Hugo). Avec ?ips dans l'URL, et
   seulement là, un panneau en coin compte les images par phase ; « Copier »
   met le relevé en texte dans le presse-papiers, prêt à coller.

   Du DOM et un requestAnimationFrame, rien dans la 3D : aucun programme à
   compiler, aucun coût sans ?ips (le composant n'est pas monté).

   PAS D'ALLOCATION PAR IMAGE : la boucle n'écrit que dans des tableaux typés
   alloués au montage. Le centile vient d'un histogramme (pas de 0,25 ms),
   donc il couvre toute la session sans garder chaque image. */

export function ipsVoulu(): boolean {
  return new URLSearchParams(window.location.search).has("ips")
}

const BUDGET_MS = 1000 / 60
/* une vsync et demie : à 60 Hz, une image plus longue a raté au moins une
   vsync (33,3 ms) ; entre 16,7 et 25, c'est du bruit de cadence (#42) */
const SACCADE_MS = 25
const PAS_MS = 0.25
const CASES = 800 // 200 ms couverts, au-delà tout tombe dans la dernière case
const RAFRAICHI_MS = 500

/* le chargement est le ciel encore couvert par le voile : ses à-coups ne se
   voient pas, ils ne doivent pas noircir le ciel */
const PHASES = ["chargement", "ciel", "chute", "seuil", "habitacle"] as const
const CHARGEMENT = 0

function phaseDe(etat: Etat, pret: boolean): number {
  if (etat === "CIEL") return pret ? 1 : CHARGEMENT
  if (etat === "ATTERRISSAGE") return 2
  if (etat === "SEUIL") return 3
  return 4
}

/* LES GELS NOMMÉS : un relevé qui montre une image de 840 ms sans dire qui
   l'a prise ne se corrige pas, et le headless ne reproduit pas tout. Les
   long-animation-frame (Chrome 123+) portent l'attribution des scripts :
   on garde les pires au-delà de GEL_MS, rangés dans la phase où le tableau
   a rangé l'image lente : celle de la FIN de l'image. Chrome les signale
   plus tard, souvent après un changement de phase : un gel du chargement
   se lisait au ciel ou à l'habitacle (#42). Ceux du chargement restent
   sous le voile, ils ne prennent pas la place. */
const GEL_MS = 50
const GELS_GARDES = 3

type Gel = { phase: number; duree: number; cause: string }
type Changement = { t: number; phase: number }

/* le sous-ensemble de PerformanceLongAnimationFrameTiming qu'on lit,
   absent de lib.dom de TypeScript 5 */
type ImageLongue = {
  startTime: number
  duration: number
  scripts: { invoker: string; sourceFunctionName: string; sourceURL: string; duration: number }[]
}

type Releve = {
  histo: Uint32Array
  images: Uint32Array
  lentes: Uint32Array
  saccades: Uint32Array
  somme: Float64Array
  pire: Float64Array
  gels: Gel[]
}

function releveVide(): Releve {
  const n = PHASES.length
  return {
    histo: new Uint32Array(n * CASES),
    images: new Uint32Array(n),
    lentes: new Uint32Array(n),
    saccades: new Uint32Array(n),
    somme: new Float64Array(n),
    pire: new Float64Array(n),
    gels: [],
  }
}

function enregistre(r: Releve, phase: number, dureeMs: number) {
  r.images[phase]++
  r.somme[phase] += dureeMs
  if (dureeMs > BUDGET_MS) r.lentes[phase]++
  if (dureeMs > SACCADE_MS) r.saccades[phase]++
  if (dureeMs > r.pire[phase]) r.pire[phase] = dureeMs
  r.histo[phase * CASES + Math.min(CASES - 1, Math.floor(dureeMs / PAS_MS))]++
}

/* `phases` vide = toutes : la ligne du total */
function centile(r: Releve, phases: number[], p: number): number {
  const total = phases.reduce((s, i) => s + r.images[i], 0)
  const vise = Math.ceil(total * p)
  let cumul = 0
  for (let c = 0; c < CASES; c++) {
    for (const i of phases) cumul += r.histo[i * CASES + c]
    if (cumul >= vise) return c === CASES - 1 ? Infinity : (c + 1) * PAS_MS
  }
  return Infinity
}

/* Infinity = la dernière case de l'histogramme, au-delà de 200 ms */
const COL = 7
const f1 = (x: number) => (x === Infinity ? `>${CASES * PAS_MS}` : x.toFixed(1)).padStart(COL)

function ligne(r: Releve, nom: string, phases: number[]): string {
  const images = phases.reduce((s, i) => s + r.images[i], 0)
  if (!images) return `${nom.padEnd(10)}${"0".padStart(7)}`
  const somme = phases.reduce((s, i) => s + r.somme[i], 0)
  const lentes = phases.reduce((s, i) => s + r.lentes[i], 0)
  const saccades = phases.reduce((s, i) => s + r.saccades[i], 0)
  const pire = Math.max(...phases.map((i) => r.pire[i]))
  return (
    nom.padEnd(10) +
    String(images).padStart(7) +
    f1(somme / images) +
    /* la case donne une borne haute : jamais au-dessus de la pire réelle */
    f1(Math.min(centile(r, phases, 0.95), pire)) +
    f1(pire) +
    pourcent(lentes, images) +
    pourcent(saccades, images)
  )
}

const pourcent = (n: number, total: number) => `${((100 * n) / total).toFixed(1).padStart(COL)} %`

function observeGels(r: Releve, changements: Changement[]): PerformanceObserver | null {
  if (!PerformanceObserver.supportedEntryTypes?.includes("long-animation-frame")) return null
  const observateur = new PerformanceObserver((liste) => {
    for (const image of liste.getEntries() as unknown as ImageLongue[]) {
      const phase = phaseA(changements, image.startTime + image.duration)
      if (image.duration > GEL_MS && phase !== CHARGEMENT) retiensGel(r.gels, { phase, duree: image.duration, cause: causeDe(image) })
    }
  })
  observateur.observe({ type: "long-animation-frame" })
  return observateur
}

function phaseA(changements: Changement[], t: number): number {
  let phase = changements[0].phase
  for (const c of changements) if (c.t <= t) phase = c.phase
  return phase
}

function causeDe(image: ImageLongue): string {
  const script = [...image.scripts].sort((a, b) => b.duration - a.duration)[0]
  if (!script) return "aucun script (rendu, GPU ou natif)"
  const fichier = script.sourceURL.split("/").pop() || "?"
  return `${script.invoker} ${script.sourceFunctionName || "?"}@${fichier} ${script.duration.toFixed(0)} ms`
}

function retiensGel(gels: Gel[], gel: Gel) {
  gels.push(gel)
  gels.sort((a, b) => b.duree - a.duree)
  gels.length = Math.min(gels.length, GELS_GARDES)
}

function ligneGels(r: Releve): string {
  if (!r.gels.length) return `gels > ${GEL_MS} ms : aucun`
  return ["gels :", ...r.gels.map((g) => `  ${g.duree.toFixed(0)} ms [${PHASES[g.phase]}] ${g.cause}`)].join("\n")
}

function decritToile(): string {
  const toile = document.querySelector<HTMLCanvasElement>("[data-etat] canvas")
  if (!toile) return "toile : pas encore montée"
  const rendu = toile.clientWidth ? toile.width / toile.clientWidth : 0
  return `toile ${toile.width}x${toile.height} (rendu x${rendu.toFixed(2)}) · DPR écran ${devicePixelRatio}`
}

function decritGpu(): string {
  const toile = document.querySelector<HTMLCanvasElement>("[data-etat] canvas")
  /* même type que celui de R3F : rend le contexte existant, n'en crée pas */
  const gl = toile?.getContext("webgl2")
  if (!gl) return "GPU : inconnu (pas de contexte WebGL2)"
  const dbg = gl.getExtension("WEBGL_debug_renderer_info")
  return `GPU : ${gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER)}`
}

function texte(r: Releve, ips: number, gpu: string): string {
  const toutes = PHASES.map((_, i) => i)
  return [
    `IPS ${ips.toFixed(0)} (dernière demi-seconde) · budget ${BUDGET_MS.toFixed(1)} ms`,
    "phase".padEnd(10) + ["images", "moy", "p95", "pire"].map((c) => c.padStart(COL)).join("") + ">16,7".padStart(COL + 2) + `>${SACCADE_MS}`.padStart(COL + 2),
    ...PHASES.map((nom, i) => ligne(r, nom, [i])),
    ligne(r, "total", toutes),
    ligneGels(r),
    gpu,
    decritToile(),
  ].join("\n")
}

export function CompteurIps({ etat, pret }: { etat: Etat; pret: boolean }) {
  const phase = useRef(phaseDe(etat, pret))
  /* quelques dizaines par session : un changement par état de la machine */
  const changements = useRef<Changement[]>([{ t: 0, phase: phase.current }])
  const releve = useRef<Releve | null>(null)
  const sortie = useRef<HTMLPreElement>(null)
  const ips = useRef(0)
  const gpu = useRef("")
  const [copie, setCopie] = useState("Copier")

  useEffect(() => {
    phase.current = phaseDe(etat, pret)
    changements.current.push({ t: performance.now(), phase: phase.current })
  }, [etat, pret])

  useEffect(() => {
    const r = releveVide()
    releve.current = r
    let precedent = 0
    let id = 0
    const boucle = (t: number) => {
      if (precedent) enregistre(r, phase.current, t - precedent)
      precedent = t
      id = requestAnimationFrame(boucle)
    }
    /* un onglet caché ne peint pas : son retour n'est pas une image lente */
    const visibilite = () => {
      precedent = 0
    }
    let imagesAvant = 0
    let tAvant = performance.now()
    const rafraichit = () => {
      const maintenant = performance.now()
      const images = r.images.reduce((s, n) => s + n, 0)
      ips.current = ((images - imagesAvant) * 1000) / (maintenant - tAvant)
      imagesAvant = images
      tAvant = maintenant
      if (!gpu.current || gpu.current.startsWith("GPU : inconnu")) gpu.current = decritGpu()
      if (sortie.current) sortie.current.textContent = texte(r, ips.current, gpu.current)
    }
    id = requestAnimationFrame(boucle)
    const observateur = observeGels(r, changements.current)
    const h = setInterval(rafraichit, RAFRAICHI_MS)
    document.addEventListener("visibilitychange", visibilite)
    return () => {
      cancelAnimationFrame(id)
      observateur?.disconnect()
      clearInterval(h)
      document.removeEventListener("visibilitychange", visibilite)
    }
  }, [])

  const copier = async () => {
    const r = releve.current
    if (!r) return
    const entete = [
      `relevé ?ips · ${new Date().toISOString()}`,
      location.href,
      navigator.userAgent,
      `écran ${screen.width}x${screen.height} · fenêtre ${innerWidth}x${innerHeight}`,
    ]
    try {
      await navigator.clipboard.writeText([...entete, texte(r, ips.current, decritGpu())].join("\n"))
      setCopie("Copié")
    } catch (e) {
      console.warn("[ips] presse-papiers refusé, sélectionner le texte du panneau", e)
      setCopie("Refusé : sélectionner")
    }
    setTimeout(() => setCopie("Copier"), 1500)
  }

  return (
    <div style={panneau}>
      <pre ref={sortie} style={{ margin: 0, userSelect: "text" }}>
        mesure en cours…
      </pre>
      <button type="button" onClick={copier} style={boutonCopier}>
        {copie}
      </button>
    </div>
  )
}

const panneau: CSSProperties = {
  position: "absolute",
  top: 12,
  left: 12,
  zIndex: 100,
  padding: "8px 10px",
  font: "11px/1.35 ui-monospace, monospace",
  color: "#e8dff5",
  background: "rgba(8, 7, 15, 0.82)",
  border: "1px solid rgba(232, 223, 245, 0.25)",
  borderRadius: 2,
  pointerEvents: "auto",
  maxWidth: "calc(100vw - 24px)",
  overflowX: "auto",
}

const boutonCopier: CSSProperties = {
  marginTop: 6,
  font: "inherit",
  color: "inherit",
  background: "transparent",
  border: "1px solid rgba(232, 223, 245, 0.4)",
  borderRadius: 2,
  padding: "3px 10px",
  cursor: "pointer",
}
