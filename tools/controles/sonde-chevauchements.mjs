/* Sonde de chevauchements — /parcours, univers CPGE + ESTIA.
   Née du retour Hugo 2026-08-12 (« beaucoup d'éléments se
   chevauchent ») : mesure les boîtes des pièces porteuses de texte à
   PLUSIEURS largeurs de fenêtre et PLUSIEURS positions de scroll (la
   respiration bouge les pièces), et rapporte toute intersection >
   seuil entre pièces du même chapitre. La règle gravée : les cadres
   peuvent se toucher, LES TEXTES JAMAIS. Les paires sanctionnées par
   les planches gatées (mord / posé-sur / logé-dans-le-vide-du-bbox)
   sont étiquetées [design] mais rapportées quand même.
   À étendre à chaque univers neuf (Hokkaido, MBDS).
   Usage : node tools/controles/sonde-chevauchements.mjs [url]
           (défaut http://localhost:3210/parcours — build de PROD)
   Code de sortie 1 si une collision réelle (hors design) existe. */
import { existsSync } from "node:fs"
import { chromium } from "playwright-core"

const URL_ = process.argv[2] ?? "http://localhost:3210/parcours"
const CHROME = process.env.CHROME ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`
if (!existsSync(CHROME)) { console.error(`Chrome introuvable (${CHROME}) — passe CHROME=<binaire>.`); process.exit(2) }

const LARGEURS = [1100, 1200, 1280, 1440, 1920]
const THEMES = ["sombre", "clair"]
/* seuil : les cadres peuvent se toucher — on ignore < 6px de recouvrement */
const SEUIL = 6

const PIECES = {
  cpge: [".uc-entete", ".uc-reserve", ".uc-verdict", ".uc-titre", ".uc-seuil", ".uc-ctx", ".uc-prog", ".uc-travail", ".uc-bareme", ".uc-resultat", ".uc-tampon", ".uc-ne-pas-effacer", ".uc-no-page.uc-p1", ".uc-no-page.uc-p2", ".uc-eq1", ".uc-eq2", ".uc-eq3"],
  estia: [".ue-liminaire", ".ue-elevation", ".ue-ctx", ".ue-prog", ".ue-d01", ".ue-d02", ".ue-d03", ".ue-calque", ".ue-photo", ".ue-resultat", ".ue-nomenclature", ".ue-cartouche", ".ue-tampon", ".ue-cote-v"],
}
/* clés TRIÉES (l'ordre alphabétique est celui de cle()) —
   [design] = chevauchement voulu par la planche gatée :
   tampon qui mord, verdict dans le cadre, calque posé sur D-02 ;
   + les paires « zone vide de bbox » : eq1/ctx logés dans le vide à
   droite des glyphes du display (la bbox du h1 couvre toute la
   largeur), la cote d'élévation qui « va jusqu'où elle veut » sous
   la liminaire — vérifiés à l'œil sur les captures gatées. */
const DESIGN = new Set([
  "cpge:.uc-resultat+.uc-tampon", "cpge:.uc-reserve+.uc-verdict",
  "cpge:.uc-eq1+.uc-titre",
  "estia:.ue-calque+.ue-d02", "estia:.ue-cartouche+.ue-tampon",
  "estia:.ue-ctx+.ue-elevation", "estia:.ue-elevation+.ue-liminaire",
])
const cle = (ch, a, b) => `${ch}:${[a, b].sort().join("+")}`

const navigateur = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] })
const constats = new Map() // cle+contexte → pire recouvrement

for (const largeur of LARGEURS) {
  for (const theme of THEMES) {
    const ctx = await navigateur.newContext({ viewport: { width: largeur, height: 900 } })
    const page = await ctx.newPage()
    await page.addInitScript((t) => { try { localStorage.setItem("theme", t) } catch {} }, theme)
    await page.goto(URL_, { waitUntil: "networkidle" })
    await page.waitForTimeout(800)

    /* traversée complète à la molette (mouse.wheel UNIQUEMENT — Lenis
       reprend toute position posée à la main), mesure tous les ~500px */
    const hauteur = await page.evaluate(() => document.documentElement.scrollHeight)
    let parcouru = 0
    while (parcouru < hauteur + 900) {
      await page.mouse.wheel(0, 500)
      parcouru += 500
      await page.waitForTimeout(120)
      const releves = await page.evaluate((PIECES) => {
        const sortie = []
        for (const [chapitre, sels] of Object.entries(PIECES)) {
          for (const sel of sels) {
            const el = document.querySelector(`#${chapitre} ${sel}`)
            if (!el) continue
            const s = getComputedStyle(el)
            if (s.display === "none" || s.visibility === "hidden" || +s.opacity < 0.05) continue
            const r = el.getBoundingClientRect()
            if (r.width < 2 || r.height < 2) continue
            sortie.push({ chapitre, sel, x: r.x, y: r.y, w: r.width, h: r.height })
          }
        }
        return sortie
      }, PIECES)
      for (let i = 0; i < releves.length; i++) {
        for (let j = i + 1; j < releves.length; j++) {
          const a = releves[i], b = releves[j]
          if (a.chapitre !== b.chapitre) continue
          const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
          const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
          if (ix > SEUIL && iy > SEUIL) {
            const k = cle(a.chapitre, a.sel, b.sel)
            const ctxk = `${k} @${largeur}px/${theme}`
            const aire = Math.round(ix) * Math.round(iy)
            const prev = constats.get(ctxk)
            if (!prev || aire > prev.aire) constats.set(ctxk, { aire, ix: Math.round(ix), iy: Math.round(iy), design: DESIGN.has(k) })
          }
        }
      }
    }
    await ctx.close()
  }
}
await navigateur.close()

/* rapport groupé par paire, pires cas d'abord */
const parPaire = new Map()
for (const [ctxk, v] of constats) {
  const [paire, contexte] = ctxk.split(" @")
  if (!parPaire.has(paire)) parPaire.set(paire, [])
  parPaire.get(paire).push({ contexte, ...v })
}
let reels = 0
for (const [paire, cas] of [...parPaire.entries()].sort()) {
  const design = cas[0].design
  if (!design) reels++
  console.log(`${design ? "[design]" : "[COLLISION]"} ${paire}`)
  for (const c of cas.sort((a, b) => b.aire - a.aire).slice(0, 6)) {
    console.log(`    ${c.contexte} — ${c.ix}×${c.iy}px`)
  }
}
console.log(`\n${reels} paire(s) en collision réelle (hors design).`)
process.exit(reels ? 1 : 0)
