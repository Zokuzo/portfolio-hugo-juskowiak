#!/usr/bin/env node
/* LE BANC DES IMAGES DE L'INTRO : ticket #43 de la carte #42.

     npm run banc:intro                       → 3 passes à froid, rapport, JSON
     npm run banc:intro -- --runs 5 --label avant-fix
     options : --build (force le build)  --attente <ms> (CIEL avant le clic,
               défaut 1500)  --repos <ms> (habitacle observé, défaut 3000)

   La question : de « chargement fini » (le voile CHARGEMENT se lève,
   data-pret=1, c'est t0) jusqu'à l'habitacle posé, combien durent les
   images, et où sont les pics.

   À FROID, TOUJOURS : chaque passe a son profil Chrome neuf
   (tools/chrome.mjs efface le --user-data-dir), donc un cache de shaders GPU
   vide. Le gel visé est un phénomène de première visite ; une passe à chaud
   répondrait à une autre question.

   FENÊTRÉ, TOUJOURS : en headless le compositeur est SwiftShader, tout
   chiffre de temps y est faux. La fenêtre apparaît sur l'écran de Hugo.

   CE QUI EST FIABLE, CE QUI NE L'EST PAS. Sans entrée utilisateur réelle,
   la cadence présentée décroît par moitiés (120 → 60 → 30) : un intervalle
   rAF de 16,7 ms peut être la vsync étranglée, pas un coût. D'où trois
   mesures côte à côte :
   - l'intervalle rAF par image (ce que l'œil voit, plancher compris) ;
   - le coût fil principal par image (de l'horodatage rAF à une tâche
     MessageChannel postée dans la même image, recette de frame.mjs) ;
   - les long-animation-frame (LoAF) et longtask, qui ne dépendent pas de la
     cadence et portent l'attribution des scripts.
   Le plancher de cadence détecté est imprimé avec l'histogramme : un pic
   à 100 ms ne s'explique pas par une vsync à 33.

   Zéro dépendance : CDP par tools/chrome.mjs, comme le reste des bancs. */

import { spawn, execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { createServer } from "node:net"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { lanceChrome, attends, pause } from "../chrome.mjs"

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const SORTIE = path.join(RACINE, ".scratch/banc-intro")

const opt = litOptions(process.argv.slice(2))
const RUNS = +(opt.runs ?? 3)
const LABEL = opt.label ?? "baseline"
const ATTENTE_CIEL_MS = +(opt.attente ?? 1500)
const REPOS_HABITACLE_MS = +(opt.repos ?? 3000)
const FENETRE = { largeur: 1600, hauteur: 900 }
const SEUILS_MS = [33, 50]
/* sans ces réglages un Chrome piloté en CDP se dit sans pointeur et la
   garde de capacité (pointeur + ≥ 768 px + WebGL2) refuse la 3D */
const POINTEUR_DECLARE =
  "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4"

function litOptions(argv) {
  const o = {}
  for (let i = 0; i < argv.length; i++) {
    const [cle, val] = argv[i].replace(/^--/, "").split("=")
    if (val !== undefined) o[cle] = val
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) o[cle] = argv[++i]
    else o[cle] = true
  }
  return o
}

/* ───────────────────────── l'enregistreur, dans la page ───────────────────────── */

/* Injecté AVANT tout script du site : sa boucle rAF s'inscrit la première,
   donc l'horodatage rAF couvre tout le travail de l'image (voir frame.mjs).
   L'état de la machine et le compte de programmes GPU sont relevés à chaque
   image ; on ne stocke que les CHANGEMENTS. */
const ENREGISTREUR = `(() => {
  const R = (window.__banc = { frames: [], couts: [], loaf: [], longtasks: [], phases: [], gpu: [] })
  const canal = new MessageChannel()
  let ouverte = null
  canal.port1.onmessage = () => {
    if (ouverte !== null) R.couts.push([ouverte, performance.now() - ouverte])
    ouverte = null
  }
  let derniere = ""
  const boucle = (ts) => {
    R.frames.push(ts)
    ouverte = ts
    canal.port2.postMessage(0)
    const el = document.querySelector("[data-etat]")
    if (el) {
      const cle = el.dataset.etat + "|" + el.dataset.pret + "|" + el.dataset.rue
      if (cle !== derniere) {
        derniere = cle
        R.phases.push({ t: ts, etat: el.dataset.etat, pret: el.dataset.pret === "1", rue: el.dataset.rue === "1" })
      }
    }
    const info = window.__gt86 && window.__gt86.gl && window.__gt86.gl.info
    if (info) {
      const g = { t: ts, programmes: info.programs ? info.programs.length : 0,
        geometries: info.memory.geometries, textures: info.memory.textures }
      const p = R.gpu[R.gpu.length - 1]
      if (!p || p.programmes !== g.programmes || p.geometries !== g.geometries || p.textures !== g.textures) R.gpu.push(g)
    }
    requestAnimationFrame(boucle)
  }
  requestAnimationFrame(boucle)
  const observe = (type, ranger) => {
    try { new PerformanceObserver((l) => l.getEntries().forEach(ranger)).observe({ type, buffered: true }) }
    catch (e) { R["sans_" + type] = String(e) }
  }
  observe("long-animation-frame", (e) => R.loaf.push({
    debut: e.startTime, duree: e.duration, bloquant: e.blockingDuration,
    rendu: e.renderStart ? e.startTime + e.duration - e.renderStart : 0,
    scripts: (e.scripts || []).map((s) => ({
      invocateur: s.invoker, type: s.invokerType, fonction: s.sourceFunctionName,
      url: (s.sourceURL || "").split("/").pop(), position: s.sourceCharPosition,
      duree: s.duration, styleForce: s.forcedStyleAndLayoutDuration })),
  }))
  observe("longtask", (e) => R.longtasks.push({ debut: e.startTime, duree: e.duration }))
})()`

/* ───────────────────────────── le serveur ───────────────────────────── */

const SOURCES_DU_BUILD = ["app", "components", "lib", "public", "next.config.mjs", "package.json"]

function plusRecent(p) {
  const s = statSync(p)
  if (!s.isDirectory()) return s.mtimeMs
  return Math.max(s.mtimeMs, ...readdirSync(p).map((f) => plusRecent(path.join(p, f))))
}

function buildPerime() {
  const id = path.join(RACINE, ".next/BUILD_ID")
  if (opt.build || !existsSync(id)) return true
  const sources = Math.max(...SOURCES_DU_BUILD.map((f) => path.join(RACINE, f)).filter(existsSync).map(plusRecent))
  return sources > statSync(id).mtimeMs
}

const NEXT = path.join(RACINE, "node_modules/next/dist/bin/next")

async function demarreServeur() {
  if (buildPerime()) {
    console.log("build (sources plus récentes que .next)…")
    execFileSync(process.execPath, [NEXT, "build"], { cwd: RACINE, stdio: "ignore" })
  } else console.log("build réutilisé (.next à jour)")
  const port = await portLibre()
  /* le binaire next lancé DIRECTEMENT, sans npx : tuer le processus tue le
     serveur, pas un shell intermédiaire qui laisserait next-server orphelin */
  const proc = spawn(process.execPath, [NEXT, "start", "-p", String(port)], { cwd: RACINE, stdio: "ignore" })
  const base = `http://127.0.0.1:${port}`
  await attends(async () => {
    try { return (await fetch(base + "/")).ok } catch { return false }
  }, 40000, "démarrage de next start")
  const arrete = () => {
    proc.kill("SIGTERM")
    try { execFileSync("fuser", ["-k", `${port}/tcp`], { stdio: "ignore" }) } catch { /* déjà libre */ }
  }
  return { base, arrete }
}

function portLibre() {
  return new Promise((res) => {
    const s = createServer()
    s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)) })
  })
}

/* ───────────────────────────── une passe ───────────────────────────── */

async function passe(base) {
  const { cdp, ferme } = await lanceChrome({
    nom: "banc-intro",
    tete: true,
    args: [`--window-size=${FENETRE.largeur},${FENETRE.hauteur}`, POINTEUR_DECLARE],
  })
  try {
    await cdp.envoie("Page.enable")
    await cdp.envoie("Page.addScriptToEvaluateOnNewDocument", { source: ENREGISTREUR })
    await cdp.envoie("Page.navigate", { url: base + "/" })
    const etat = () => cdp.evalue(`document.querySelector("[data-etat]")?.dataset.etat ?? null`)

    await attends(async () => (await cdp.evalue(`document.querySelector("[data-etat]")?.dataset.pret`)) === "1",
      90000, "le voile CHARGEMENT se lève (data-pret)")
    await pause(ATTENTE_CIEL_MS)

    /* un VRAI clic souris au centre : la carrosserie y est, et seul le
       raycast R3F réagit (l'overlay est pointer-events:none) */
    const [cx, cy] = await cdp.evalue(`[innerWidth / 2, innerHeight / 2]`)
    const clic = await cdp.evalue(`performance.now()`)
    await attends(async () => {
      if ((await etat()) === "CIEL") {
        for (const type of ["mousePressed", "mouseReleased"])
          await cdp.envoie("Input.dispatchMouseEvent", { type, x: cx, y: cy, button: "left", clickCount: 1 })
      }
      await pause(150)
      return (await etat()) !== "CIEL"
    }, 20000, "clic sur la voiture → atterrissage")

    await attends(async () => (await etat()) === "HABITACLE", 120000, "vol + seuil jusqu'à l'habitacle")
    await pause(REPOS_HABITACLE_MS)

    const brut = await cdp.evalue(`JSON.stringify(window.__banc)`)
    const env = await cdp.evalue(`(() => {
      const gl = window.__gt86.gl.getContext()
      const dbg = gl.getExtension("WEBGL_debug_renderer_info")
      return { ecran: { largeur: screen.width, hauteur: screen.height, dpr: devicePixelRatio },
        fenetre: { largeur: innerWidth, hauteur: innerHeight },
        gpu: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) }
    })()`)
    env.chrome = (await cdp.envoie("Browser.getVersion")).product
    return { ...JSON.parse(brut), clic, env }
  } finally {
    await ferme()
  }
}

/* ───────────────────────────── l'analyse ───────────────────────────── */

const pct = (xs, p) => {
  if (!xs.length) return 0
  const t = [...xs].sort((a, b) => a - b)
  return t[Math.min(t.length - 1, Math.floor((p / 100) * t.length))]
}
const r1 = (x) => Math.round(x * 10) / 10

/* le nom de phase d'un instant : l'état de la machine, et le vol coupé en
   deux à la bascule ciel → rue (c'est là qu'on soupçonne le gel) */
function phaseA(phases, t) {
  let p = phases[0]
  for (const q of phases) if (q.t <= t) p = q
  if (p.etat === "ATTERRISSAGE") return p.rue ? "VOL rue" : "VOL ciel"
  return p.etat
}

/* le plancher : la classe d'intervalles la plus peuplée près du minimum ;
   l'histogramme l'accompagne, un mélange de cadences s'y lit tout de suite */
function plancherDe(deltas) {
  const histo = new Map()
  for (const d of deltas) {
    const k = Math.round(d * 2) / 2
    histo.set(k, (histo.get(k) ?? 0) + 1)
  }
  const bas = pct(deltas, 5)
  const pres = [...histo].filter(([k]) => k <= bas * 1.3)
  const [plancher] = pres.sort((a, b) => b[1] - a[1])[0] ?? [0]
  const tete = [...histo].sort((a, b) => b[1] - a[1]).slice(0, 5)
  return { plancherMs: plancher, hzEstime: plancher ? Math.round(1000 / plancher) : 0, histo: tete }
}

function analyse(run) {
  const t0 = run.phases.find((p) => p.pret)?.t
  const habitacle = run.phases.find((p) => p.etat === "HABITACLE")?.t
  const images = []
  for (let i = 1; i < run.frames.length; i++) {
    /* l'image qui LÈVE le voile commence derrière lui : elle appartient
       au chargement, pas à l'intro */
    const debut = run.frames[i - 1]
    if (debut < t0) continue
    const t = run.frames[i]
    images.push({ t, delta: t - debut, phase: phaseA(run.phases, t), debut })
  }
  const couts = new Map(run.couts)
  const ordre = ["CIEL", "VOL ciel", "VOL rue", "SEUIL", "HABITACLE"]
  const parPhase = {}
  for (const nom of ordre) {
    const ims = images.filter((im) => im.phase === nom)
    if (!ims.length) continue
    const ds = ims.map((im) => im.delta)
    const debut = ims[0].debut
    const fin = ims[ims.length - 1].t
    const dedans = (e) => e.debut >= debut && e.debut < fin
    parPhase[nom] = {
      images: ims.length,
      dureeMs: r1(fin - debut),
      max: r1(Math.max(...ds)),
      p95: r1(pct(ds, 95)),
      p50: r1(pct(ds, 50)),
      ...Object.fromEntries(SEUILS_MS.map((s) => [`sup${s}`, ds.filter((d) => d > s).length])),
      coutMax: r1(Math.max(0, ...ims.map((im) => couts.get(im.debut) ?? 0))),
      loaf: run.loaf.filter(dedans).length,
      loafBloquantMs: r1(run.loaf.filter(dedans).reduce((s, e) => s + e.bloquant, 0)),
      longtasks: run.longtasks.filter(dedans).length,
      plancherMs: plancherDe(ds).plancherMs,
    }
  }
  const pires = [...images].sort((a, b) => b.delta - a.delta).slice(0, 5).map((im) => {
    const loafs = run.loaf.filter((e) => e.debut < im.t && e.debut + e.duree > im.debut)
    const scripts = loafs.flatMap((e) => e.scripts).sort((a, b) => b.duree - a.duree).slice(0, 2)
    return {
      tMs: r1(im.t - t0),
      deltaMs: r1(im.delta),
      phase: im.phase,
      loaf: loafs.map((e) => ({ duree: r1(e.duree), bloquant: r1(e.bloquant), rendu: r1(e.rendu) })),
      scripts: scripts.map((s) => `${s.invocateur} ${s.fonction || "?"}@${s.url}:${s.position} ${r1(s.duree)}ms`),
    }
  })
  const bascule = run.phases.find((p) => p.rue)?.t
  const seuil = run.phases.find((p) => p.etat === "SEUIL")?.t
  const gpuA = (t) => [...run.gpu].reverse().find((g) => g.t <= t) ?? null
  return {
    env: run.env,
    chargementMs: r1(t0),
    introMs: r1(habitacle - t0),
    cadence: plancherDe(images.map((im) => im.delta)),
    parPhase,
    pires,
    gpu: {
      t0: gpuA(t0),
      avantBascule: gpuA(bascule - 0.01),
      /* le premier relevé APRÈS la bascule : celui de l'image qui l'a payée */
      apresBascule: run.gpu.find((g) => g.t > bascule) ?? null,
      seuil: gpuA(seuil),
      fin: run.gpu.at(-1),
    },
    sansLoaf: run["sans_long-animation-frame"] ?? null,
  }
}

/* ───────────────────────────── le rapport ───────────────────────────── */

const COLONNES = ["images", "dureeMs", "max", "p95", "p50", "sup33", "sup50", "coutMax", "loaf", "loafBloquantMs", "longtasks", "plancherMs"]

function tableau(parPhase) {
  const ligne = (cells) => cells.map((c, i) => String(c).padStart(i ? 9 : 10)).join(" ")
  console.log(ligne(["phase", ...COLONNES.map((c) => c.replace("loafBloquantMs", "bloqLoAF").replace("longtasks", "longtask").replace("plancherMs", "plancher"))]))
  for (const [nom, s] of Object.entries(parPhase)) console.log(ligne([nom, ...COLONNES.map((c) => s[c])]))
}

function rapportPasse(n, a) {
  const ecran = a.env.ecran.hauteur === 1200 ? "eDP 120 Hz" : a.env.ecran.hauteur === 1080 ? "HDMI 100 Hz" : "écran ?"
  console.log(`\n── passe ${n} · ${a.env.ecran.largeur}×${a.env.ecran.hauteur} CSS (${ecran}) · fenêtre ${a.env.fenetre.largeur}×${a.env.fenetre.hauteur} · ${a.env.gpu}`)
  console.log(`   chargement ${a.chargementMs} ms · intro t0 → habitacle ${a.introMs} ms · plancher ${a.cadence.plancherMs} ms (~${a.cadence.hzEstime} Hz)`)
  console.log(`   histogramme : ${a.cadence.histo.map(([k, v]) => `${k}ms×${v}`).join("  ")}`)
  if (a.sansLoaf) console.log(`   ⚠ LoAF indisponible : ${a.sansLoaf}`)
  tableau(a.parPhase)
  const g = (x) => (x ? `${x.programmes} prog · ${x.geometries} géom · ${x.textures} tex` : "-")
  console.log(`   GPU t0 ${g(a.gpu.t0)} | avant bascule ${g(a.gpu.avantBascule)} | après ${g(a.gpu.apresBascule)}`)
  console.log(`   GPU au seuil ${g(a.gpu.seuil)} | fin ${g(a.gpu.fin)}`)
  console.log("   pires images :")
  for (const p of a.pires)
    console.log(`     t+${p.tMs} ms  ${p.deltaMs} ms  [${p.phase}]  LoAF ${p.loaf.map((l) => `${l.duree}/${l.bloquant}b/${l.rendu}r`).join(",") || "-"}  ${p.scripts.join(" | ")}`)
}

function agrege(analyses) {
  const phases = [...new Set(analyses.flatMap((a) => Object.keys(a.parPhase)))]
  const med = (xs) => r1(pct(xs, 50))
  return Object.fromEntries(phases.map((nom) => {
    const ss = analyses.map((a) => a.parPhase[nom]).filter(Boolean)
    return [nom, Object.fromEntries(COLONNES.map((c) => [c, c === "max" || c === "coutMax" ? r1(Math.max(...ss.map((s) => s[c]))) : med(ss.map((s) => s[c]))]))]
  }))
}

/* ───────────────────────────── le banc ───────────────────────────── */

const { base, arrete } = await demarreServeur()
process.on("exit", arrete)
const passes = []
try {
  for (let n = 1; n <= RUNS; n++) {
    const brut = await passe(base)
    const a = analyse(brut)
    rapportPasse(n, a)
    passes.push({ analyse: a, brut })
  }
} finally {
  arrete()
}

const synthese = agrege(passes.map((p) => p.analyse))
console.log(`\n══ synthèse ${RUNS} passes (max = pire des passes, le reste = médiane des passes) ══`)
tableau(synthese)

mkdirSync(SORTIE, { recursive: true })
const fichier = path.join(SORTIE, `${new Date().toISOString().slice(0, 10)}-${LABEL}.json`)
writeFileSync(fichier, JSON.stringify({ label: LABEL, runs: RUNS, attenteCielMs: ATTENTE_CIEL_MS, synthese, passes }, null, 1))
console.log(`\nJSON : ${path.relative(RACINE, fichier)}`)
