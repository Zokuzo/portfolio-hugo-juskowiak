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
const PAS_MS = 0.25
const CASES = 800 // 200 ms couverts, au-delà tout tombe dans la dernière case
const RAFRAICHI_MS = 500

/* le chargement est le ciel encore couvert par le voile : ses à-coups ne se
   voient pas, ils ne doivent pas noircir le ciel */
const PHASES = ["chargement", "ciel", "chute", "seuil", "habitacle"] as const

function phaseDe(etat: Etat, pret: boolean): number {
  if (etat === "CIEL") return pret ? 1 : 0
  if (etat === "ATTERRISSAGE") return 2
  if (etat === "SEUIL") return 3
  return 4
}

type Releve = {
  histo: Uint32Array
  images: Uint32Array
  lentes: Uint32Array
  somme: Float64Array
  pire: Float64Array
}

function releveVide(): Releve {
  const n = PHASES.length
  return {
    histo: new Uint32Array(n * CASES),
    images: new Uint32Array(n),
    lentes: new Uint32Array(n),
    somme: new Float64Array(n),
    pire: new Float64Array(n),
  }
}

function enregistre(r: Releve, phase: number, dureeMs: number) {
  r.images[phase]++
  r.somme[phase] += dureeMs
  if (dureeMs > BUDGET_MS) r.lentes[phase]++
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
  const pire = Math.max(...phases.map((i) => r.pire[i]))
  return (
    nom.padEnd(10) +
    String(images).padStart(7) +
    f1(somme / images) +
    /* la case donne une borne haute : jamais au-dessus de la pire réelle */
    f1(Math.min(centile(r, phases, 0.95), pire)) +
    f1(pire) +
    `${((100 * lentes) / images).toFixed(1).padStart(COL)} %`
  )
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
    "phase".padEnd(10) + ["images", "moy", "p95", "pire"].map((c) => c.padStart(COL)).join("") + ">16,7".padStart(COL + 2),
    ...PHASES.map((nom, i) => ligne(r, nom, [i])),
    ligne(r, "total", toutes),
    gpu,
    decritToile(),
  ].join("\n")
}

export function CompteurIps({ etat, pret }: { etat: Etat; pret: boolean }) {
  const phase = useRef(phaseDe(etat, pret))
  const releve = useRef<Releve | null>(null)
  const sortie = useRef<HTMLPreElement>(null)
  const ips = useRef(0)
  const gpu = useRef("")
  const [copie, setCopie] = useState("Copier")

  useEffect(() => {
    phase.current = phaseDe(etat, pret)
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
    const h = setInterval(rafraichit, RAFRAICHI_MS)
    document.addEventListener("visibilitychange", visibilite)
    return () => {
      cancelAnimationFrame(id)
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
