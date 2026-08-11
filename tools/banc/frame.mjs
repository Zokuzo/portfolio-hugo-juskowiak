/* ==================================================================
   BANC DE BUDGET DE FRAME — ce que coûte une frame au fil principal.

   La carte pose une cible de 8,3 ms par frame (120 Hz). Ce banc mesure
   si elle tient, et le fait de la même façon que la campagne du
   ticket 04, dont il reprend le protocole — ce banc-là vivait dans un
   scratchpad de session et a été perdu. Celui-ci est versionné.

   CE QU'ON MESURE, ET POURQUOI CETTE DÉFINITION
   ---------------------------------------------
   `coût` = du DÉBUT DE LA FRAME (l'horodatage que rAF passe à tous ses
   callbacks) à l'exécution d'une tâche postée par un MessageChannel
   pendant cette frame. Cette tâche ne peut pas s'exécuter avant que la
   mise à jour du rendu soit finie : la mesure couvre donc TOUS les rAF
   + style + layout + paint + commit. C'est le travail du fil principal
   pour cette frame, et c'est lui qui décide si elle tient dans son
   budget.

   La campagne du ticket 04 chronométrait depuis l'entrée du callback de
   la sonde. Ici ce serait FAUX, et c'est mesuré : une sonde injectée
   dans une page qui tourne déjà s'inscrit après les rAF du site et y
   reste, donc elle ne verrait que ce qui suit leur travail — 0,3 ms au
   lieu de 5,0 sur une charge étalonnée. Voir le commentaire de SONDE.
   Conséquence à connaître : un coût inclut la latence entre la vsync et
   le moment où le fil principal prend la frame. L'étalon la chiffre —
   une charge de 5,0 ms se lit 5,8 à 6,9.

   DONC : LES CHIFFRES DE CE BANC NE SE COMPARENT PAS À CEUX DU
   TICKET 04. Ils mesurent plus large, exprès. Ce qui se compare, c'est
   un relevé de ce banc à un autre relevé de ce banc, même mode.

   ET IL FAUT --tete POUR RÉPONDRE À LA QUESTION DES 120 Hz : en
   headless le compositeur est logiciel, le plancher tombe à 16,7 ms et
   le coût triple. Le banc le dit tout seul en fin de relevé.

   `intervalle` = temps entre deux frames présentées. Son plancher est
   la vsync de l'écran, PAS un coût. C'est la confusion que le ticket 04
   a levée : les « 16,7 ms » d'un vieux commentaire de voiture.tsx
   étaient la cadence d'un écran 60 Hz, pas une dépense.

   LE CONTRÔLE DE PLANCHER EST OBLIGATOIRE, et il est fait tout seul :
   une passe relevée à 60 Hz ne peut pas répondre à une question posée à
   120 Hz. Le banc mesure la cadence sur une page vide avant chaque
   passe et l'affiche. Avec --plancher, il REJETTE les passes hors
   tolérance au lieu de publier un chiffre incomparable.

   AUCUNE DÉPENDANCE npm : Chrome est piloté en CDP par tools/chrome.mjs.

   USAGE
   -----
     npm run build && npx next start -p 3210 &
     node tools/banc/frame.mjs http://localhost:3210/ accueil

   Options : --passes=3 --seuil=8.3 --plancher=<ms> --tolerance=0.45
             --largeur=1440 --hauteur=900 --sortie=<fichier.json>
             --chrome=<chemin> --tete --drag

   --drag (#12) : une amorce non mesurée (déclenche chunk + .glb),
   attente de la promotion WebGL, puis un drag MESURÉ (gate 1) et le
   défilement d'après (gate 3). Le mode sans --drag reste le témoin
   du gate 2.

   Contrôle du banc lui-même (il doit rendre ~5 ms) :
     node tools/banc/frame.mjs --etalon

   CE QUE CE BANC NE FAIT PAS : isoler le décor, la voiture ou Lenis.
   La campagne du ticket 04 le faisait en coupant des composants dans
   `app/page.tsx` — c'est une enquête ponctuelle, pas un contrôle de
   routine. Il ne décompose pas non plus le GPU : la sonde ne voit que
   le fil principal.
   ================================================================== */

import { writeFile } from "node:fs/promises"
import { lanceChrome, attends, pause } from "../chrome.mjs"

const args = process.argv.slice(2)
const opt = Object.fromEntries(
  args.filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.slice(2).split("=")
    return [k, v === undefined ? "1" : v]
  })
)
const libres = args.filter((a) => !a.startsWith("--"))
const URL_ = libres[0]
const ETIQUETTE = libres[1] ?? "sans-nom"

const PASSES = +(opt.passes ?? 3)
const SEUIL = +(opt.seuil ?? 8.3)
const TOLERANCE = +(opt.tolerance ?? 0.45)
const LARGEUR = +(opt.largeur ?? 1440)
const HAUTEUR = +(opt.hauteur ?? 900)
const PLANCHER = opt.plancher === undefined ? null : +opt.plancher

if (!URL_ && !opt.etalon) {
  console.error("usage: node tools/banc/frame.mjs <url> [étiquette] [--options]")
  console.error("       node tools/banc/frame.mjs --etalon      (contrôle du banc)")
  process.exit(1)
}

/* ── la sonde, telle qu'elle est injectée dans la page ───────────────
   Un SEUL MessageChannel pour toute la passe, et une file : en créer un
   par frame allouerait dans la boucle qu'on mesure. Les messages arrivent
   dans l'ordre d'envoi, donc la file suffit à réapparier.

   L'ORIGINE DU CHRONO EST `t`, L'HORODATAGE DE rAF — pas `performance.now()`
   à l'entrée du callback, et c'est le point le plus délicat de ce fichier.
   Une sonde injectée dans une page qui tourne déjà s'inscrit APRÈS les rAF
   du site, et elle y reste : chacun se réinscrit à la fin de sa propre
   passe, donc l'ordre est figé. Chronométrer depuis l'entrée du callback
   ne mesurerait alors que ce qui reste APRÈS le travail de Lenis, de framer
   et de la voiture — mesuré : une charge de 5 ms injectée avant la sonde se
   lisait 0,3 ms. `t`, lui, vaut le début de la frame et il est le MÊME pour
   tous les callbacks : on mesure donc début de frame → tâche postée après la
   mise à jour du rendu, c'est-à-dire tous les rAF + style + layout + paint.
   C'est exactement ce que veut dire « tenir dans 8,3 ms ». */
const SONDE = `
window.__banc = {
  gen: 0,
  demarre(){
    const s = this
    /* Un JETON DE GÉNÉRATION, et pas un simple booléen \`actif\` : une phase
       (repos) puis une autre (défilement) appellent demarre() deux fois, et
       la boucle rAF de la première a un callback encore en vol quand la
       seconde démarre. Avec un booléen elle repartait, écrivait dans le
       NOUVEAU tableau d'échantillons, et le banc comptait deux fois ses
       frames — 210 fps présentés sur un écran à 120 Hz, ce qui est le
       symptôme à reconnaître si ça revient. */
    const gen = ++s.gen
    s.ech = []; s.t0 = performance.now(); s.dernier = 0
    const file = []
    const canal = new MessageChannel()
    canal.port1.onmessage = () => {
      if (gen !== s.gen) return
      const t = file.shift()
      s.ech.push([performance.now() - t, s.dernier ? t - s.dernier : 0])
      s.dernier = t
    }
    const frame = (t) => {
      if (gen !== s.gen) return
      requestAnimationFrame(frame)
      file.push(t)
      canal.port2.postMessage(0)
    }
    requestAnimationFrame(frame)
  },
  arrete(){
    this.gen++
    return { ech: this.ech, duree: performance.now() - this.t0 }
  },
}
`

const pct = (xs, p) => {
  if (!xs.length) return null
  const t = [...xs].sort((a, b) => a - b)
  return t[Math.min(t.length - 1, Math.floor((p / 100) * t.length))]
}
const r1 = (x) => (x === null ? "—" : x.toFixed(1))
const r2 = (x) => (x === null ? "—" : x.toFixed(2))

async function mesure(cdp, ms) {
  await cdp.evalue("window.__banc.demarre()")
  await pause(ms)
  const { ech, duree } = await cdp.evalue("JSON.stringify(window.__banc.arrete())").then(JSON.parse)
  return { couts: ech.map((e) => e[0]), intervalles: ech.map((e) => e[1]).filter(Boolean), duree }
}

/* Le défilement se fait à la VRAIE molette : Lenis n'écoute que ça, et un
   `window.scrollTo` mesurerait une page sans son lissage — c'est-à-dire pas
   la page. Descente PUIS remontée : deux fois plus d'échantillons, et les
   révélations `whileInView` ne jouent qu'une fois, à la descente. */
async function defile(cdp) {
  await cdp.evalue("window.__banc.demarre()")
  const hauteur = await cdp.evalue("Math.max(0, document.documentElement.scrollHeight - innerHeight)")
  const pas = Math.max(1, Math.min(500, Math.ceil(hauteur / 120)))
  for (const sens of [1, -1]) {
    for (let i = 0; i < pas; i++) {
      await cdp.envoie("Input.dispatchMouseEvent", {
        type: "mouseWheel", x: LARGEUR / 2, y: HAUTEUR / 2,
        deltaX: 0, deltaY: sens * 120, button: "none", modifiers: 0,
      })
      await pause(8)
    }
    await pause(600) // l'inertie de Lenis fait encore des frames après le dernier cran
  }
  const { ech, duree } = await cdp.evalue("JSON.stringify(window.__banc.arrete())").then(JSON.parse)
  return { couts: ech.map((e) => e[0]), intervalles: ech.map((e) => e[1]).filter(Boolean), duree, pas }
}

/* ── scénario drag (#12) ─────────────────────────────────────────────
   Mousedown au centre de la voiture en haut de page (fondu = 1),
   balayage en azimut sur plusieurs tours avec une sinusoïde
   d'élévation — les deux axes travaillent — puis relâchement. Même
   sonde, même unité que le défilement. L'injection CDP ne traverse
   pas le compositeur comme une vraie souris (#11) : le POURCENTAGE
   au-dessus du seuil à plancher égal reste comparable, la cadence
   présentée non. */
async function drague(cdp, mesurer = true) {
  const cx = LARGEUR / 2, cy = HAUTEUR / 2
  const souris = (type, x, y, extra = {}) => cdp.envoie("Input.dispatchMouseEvent", {
    type, x, y, button: "left", buttons: 1, clickCount: 1, ...extra,
  })
  if (mesurer) await cdp.evalue("window.__banc.demarre()")
  await souris("mousePressed", cx, cy)
  /* ~3 tours d'azimut (0,45 °/px) en crans de 8 px, l'élévation
     balayée à ±80 px, en rebondissant aux bords de la fenêtre. */
  let x = cx
  let sens = 1
  for (let i = 0; i < 300; i++) {
    x += sens * 8
    if (x > LARGEUR - 40 || x < 40) { sens = -sens; x += sens * 16 }
    await souris("mouseMoved", x, cy + Math.sin(i / 18) * 80)
    await pause(8)
  }
  await souris("mouseReleased", x, cy, { buttons: 0 })
  await pause(700) // l'inertie fait encore des frames après la main
  if (!mesurer) return null
  const { ech, duree } = await cdp.evalue("JSON.stringify(window.__banc.arrete())").then(JSON.parse)
  return { couts: ech.map((e) => e[0]), intervalles: ech.map((e) => e[1]).filter(Boolean), duree }
}

/* Le plancher de cadence, mesuré sur la page témoin : c'est la vsync de
   l'écran (ou celle que le navigateur headless s'impose). Sans lui, on ne
   sait pas si un « 110 fps » est un résultat ou un plafond.

   LE PLANCHER N'EST PAS UN CHIFFRE, C'EST UNE DISTRIBUTION (ticket 32) :
   cette machine a deux écrans à cadences différentes (119,98 et 99,99 Hz)
   et la fenêtre atterrit où le compositeur veut ; et sans entrée réelle la
   cadence présentée décroît par moitiés en quelques secondes. Un p50 seul
   ne distingue pas « vsync propre à 12 ms » d'un mélange 8,3/16,7 dont la
   médiane tombe n'importe où — les 12,10 ms historiques étaient ce
   mélange. D'où l'histogramme, et le verdict « mélange » quand deux
   classes éloignées pèsent chacune : dans ce cas le plancher publié ne
   correspond à aucune cadence réelle et ne doit pas servir d'appariement. */
async function plancherDe(cdp) {
  await cdp.evalue("window.__banc.demarre()")
  await pause(1000)
  const { ech } = await cdp.evalue("JSON.stringify(window.__banc.arrete())").then(JSON.parse)
  /* Zéro frame en une seconde n'est pas « un plancher très haut », c'est un
     navigateur qui ne dessine pas — et un relevé vide se lirait comme un
     résultat. Mieux vaut échouer ici. */
  if (ech.length < 10) throw new Error(`le navigateur ne tire pas de frames (${ech.length} en 1 s) — aucun relevé n'aurait de sens`)
  const dts = ech.map((e) => e[1]).filter(Boolean)
  const classes = new Map()
  for (const d of dts) { const k = Math.round(d * 10) / 10; classes.set(k, (classes.get(k) || 0) + 1) }
  const tri = [...classes.entries()].sort((a, b) => b[1] - a[1])
  /* Mélange : deux classes qui pèsent chacune ≥ 20 % des intervalles et
     dont l'une vaut au moins 1,5 fois l'autre — c'est la signature de la
     décroissance par moitiés, pas du bruit de mesure autour d'une vsync. */
  const lourdes = tri.filter(([, n]) => n >= dts.length * 0.2).map(([k]) => k)
  const melange = lourdes.length >= 2 && Math.max(...lourdes) >= Math.min(...lourdes) * 1.5
  return {
    plancher: pct(dts, 50),
    histo: tri.slice(0, 4).map(([k, n]) => `${k.toFixed(1)} ms ×${n}`).join("  "),
    melange,
  }
}

/* La page témoin porte une animation PERMANENTE, et ce n'est pas décoratif.
   Un Chrome headless ne produit une frame que s'il a quelque chose à
   redessiner : sur `about:blank` la sonde relevait 0 échantillon par seconde,
   sur un document statique entre 0 et 24 selon les lancements. Avec une
   animation qui tourne, 61 — c'est-à-dire la cadence réelle du navigateur,
   qui est ce qu'un plancher doit mesurer. Une page témoin immobile aurait
   rendu un plancher au hasard. */
async function temoin(cdp) {
  const { frameTree } = await cdp.envoie("Page.getFrameTree")
  await cdp.envoie("Page.setDocumentContent", {
    frameId: frameTree.frame.id,
    html: `<!doctype html><meta charset=utf-8><title>témoin</title>
<style>@keyframes t{to{transform:translateX(100px)}}
body{margin:0;background:#111}i{display:block;width:40px;height:40px;background:#c8102e;animation:t 1s linear infinite alternate}</style>
<body><i></i><div style="height:300vh"></div>`,
  })
  await attendFrames(cdp)
}

/* Le navigateur met un temps VARIABLE à commencer à produire des frames après
   un démarrage à froid — un lancement sur trois rendait zéro échantillon. On
   attend donc qu'il tire vraiment avant de mesurer quoi que ce soit, au lieu
   de publier un relevé vide ou de retenter la passe entière. */
async function attendFrames(cdp) {
  await attends(async () => {
    await cdp.evalue("window.__ping = 0; (() => { const f = () => { window.__ping++; if (window.__ping < 90) requestAnimationFrame(f) }; requestAnimationFrame(f) })()")
    await pause(500)
    return (await cdp.evalue("window.__ping")) >= 20
  }, 15000, "le navigateur ne commence pas à produire des frames")
}

async function ouvre() {
  const { cdp, ferme } = await lanceChrome({
    ...(opt.chrome ? { chrome: opt.chrome } : {}),
    nom: "banc-frame",
    tete: !!opt.tete,
    /* Sans ces trois drapeaux, une fenêtre headless est traitée comme
       arrière-plan : rAF est étranglé et la sonde relève DEUX frames en deux
       secondes. Mesuré. Ce sont ceux que Playwright pose par défaut, et c'est
       la raison pour laquelle les sondes ad hoc écrites avec lui tiraient
       leurs 60 frames là où ce banc n'en tirait aucune. */
    args: [
      `--window-size=${LARGEUR},${HAUTEUR}`,
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      /* Un Chrome piloté en CDP (surtout headless) se déclare sans pointeur
         fin, et le composant refuse alors — à raison — le régime drag qu'on
         vient précisément mesurer. `Emulation.setEmulatedMedia` ne couvre
         pas hover/pointer (mesuré : matchMedia restait false) ; ces
         blink-settings, si. On déclare ce que le banc EST : une souris
         fine qui survole. */
      ...(opt.drag ? ["--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4"] : []),
    ],
  })
  await cdp.envoie("Page.enable")
  // et la page doit se croire au premier plan, sinon le compositeur s'endort
  await cdp.envoie("Emulation.setFocusEmulationEnabled", { enabled: true })
  await cdp.envoie("Emulation.setDeviceMetricsOverride", {
    width: LARGEUR, height: HAUTEUR, deviceScaleFactor: 1, mobile: false,
  })
  return { cdp, ferme }
}

/* ── contrôle du banc ────────────────────────────────────────────────
   Une page vide dont le rAF occupe le fil pendant 5 ms exactement. Si la
   sonde ne lit pas ~5 ms, elle ne mesure pas ce qu'elle prétend et aucun
   chiffre de ce fichier ne vaut rien. C'est le seul test de ce banc, et
   il doit rester le premier réflexe quand un relevé surprend. */
async function etalon() {
  const { cdp, ferme } = await ouvre()
  try {
    await temoin(cdp)
    await cdp.evalue(SONDE)
    await cdp.evalue(`
      window.__charge = () => { const f = performance.now() + 5; while (performance.now() < f); requestAnimationFrame(window.__charge) }
      requestAnimationFrame(window.__charge)
    `)
    const { couts } = await mesure(cdp, 2000)
    const p50 = pct(couts, 50)
    const ok = couts.length >= 30 && p50 !== null && p50 >= 4.5 && p50 <= 8.0
    console.log(`étalon : charge injectée 5,0 ms → sonde ${r2(p50)} ms (p50 sur ${couts.length} frames)`)
    console.log(ok
      ? "OK — la sonde mesure bien le travail du fil principal (l'écart au-dessus de 5,0 est la latence début-de-frame + le paint)."
      : "ÉCHEC — la sonde est fausse, ne pas se servir des relevés.")
    process.exitCode = ok ? 0 : 1
  } finally { await ferme() }
}

async function passe(n) {
  const { cdp, ferme } = await ouvre()
  try {
    await temoin(cdp)
    await cdp.evalue(SONDE)
    const { plancher, histo, melange } = await plancherDe(cdp)
    /* L'écran d'atterrissage et le moteur WebGL, relevés sur le témoin
       (avant navigation, donc sans toucher à la page mesurée). L'écran se
       reconnaît à sa hauteur CSS ; le moteur dit si le processus GPU rend
       en matériel ou en SwiftShader — deux états entre lesquels les
       chiffres ne se comparent pas (ticket 32). */
    const env = JSON.parse(await cdp.evalue(`JSON.stringify({
      ecran: screen.width + "×" + screen.height + " CSS, dpr " + (Math.round(devicePixelRatio * 100) / 100),
      webgl: (() => {
        try {
          const gl = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl")
          if (!gl) return "aucun contexte"
          const d = gl.getExtension("WEBGL_debug_renderer_info")
          return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
        } catch (e) { return "erreur : " + e.message }
      })(),
    })`))

    if (PLANCHER !== null && Math.abs(plancher - PLANCHER) > TOLERANCE) {
      return { rejet: `plancher ${r2(plancher)} ms, consigne ${r2(PLANCHER)} ± ${TOLERANCE}` }
    }
    if (melange) {
      console.log(`  passe ${n} — ⚠ plancher MÉLANGÉ (${histo}) : la médiane ${r2(plancher)} ms ne correspond à aucune cadence réelle.`)
    }

    await cdp.evalue("window.__navigue = 1")
    await cdp.envoie("Page.navigate", { url: URL_ })
    await attends(async () => await cdp.evalue("window.__navigue === undefined && document.readyState === 'complete'"), 30000, "chargement de " + URL_)
    await cdp.evalue(SONDE)

    await pause(1500)                       // échauffement : polices, images, hydratation
    const repos = await mesure(cdp, 1500)

    if (opt.drag) {
      /* Premier geste : l'AMORCE — déclenche le chunk et le .glb,
         pilote la séquence. Non mesurée : c'est le régime WebGL qu'on
         juge. La promotion se lit sur data-regime (posé par le
         composant à l'arrivée du modèle). */
      await drague(cdp, false)
      await attends(async () =>
        await cdp.evalue("document.querySelector('.voiture')?.dataset.regime === 'gl'"),
        30000, "promotion WebGL (le modèle ne charge pas ?)")
      await pause(500)
      const drag = await drague(cdp)        // gate 1 : pendant le drag
      const scroll = await defile(cdp)      // gate 3 : le défilement APRÈS le premier drag
      const gpu = JSON.parse(await cdp.evalue(`JSON.stringify({
        geometries: document.querySelector('.voiture')?.dataset.glGeometries ?? null,
        textures: document.querySelector('.voiture')?.dataset.glTextures ?? null,
      })`))
      console.log(`  passe ${n} — plancher ${r2(plancher)} ms${melange ? " (MÉLANGE)" : ""} · drag ${drag.couts.length} frames · scroll après drag ${scroll.couts.length} frames`)
      console.log(`            écran ${env.ecran} · ${env.webgl} · GPU ${gpu.geometries} géométries, ${gpu.textures} textures`)
      console.log(`            intervalles du plancher : ${histo}`)
      return { plancher, melange, env, repos, scroll, drag, gpu }
    }

    const scroll = await defile(cdp)

    console.log(`  passe ${n} — plancher ${r2(plancher)} ms${melange ? " (MÉLANGE)" : ""} · ${scroll.couts.length} frames au défilement · ${scroll.pas} crans de molette`)
    console.log(`            écran ${env.ecran} · ${env.webgl}`)
    console.log(`            intervalles du plancher : ${histo}`)
    return { plancher, melange, env, repos, scroll }
  } finally { await ferme() }
}

async function main() {
  if (opt.etalon) return etalon()

  console.log(`banc de frame — ${URL_} (${ETIQUETTE}), ${PASSES} passe(s), cible ${SEUIL} ms\n`)
  const bonnes = []
  const rejets = []
  for (let n = 1; n <= PASSES; n++) {
    const r = await passe(n)
    if (r.rejet) { rejets.push(r.rejet); console.log(`  passe ${n} — REJETÉE : ${r.rejet}`) }
    else bonnes.push(r)
  }
  if (!bonnes.length) {
    console.error("\nAucune passe retenue. Un plancher hors consigne ne se contourne pas : c'est l'écran, pas le code.")
    process.exitCode = 1
    return
  }

  const couts = bonnes.flatMap((b) => b.scroll.couts)
  const intervalles = bonnes.flatMap((b) => b.scroll.intervalles)
  const reposP90 = pct(bonnes.flatMap((b) => b.repos.couts), 90)
  const duree = bonnes.reduce((s, b) => s + b.scroll.duree, 0)
  const depassent = couts.filter((c) => c > SEUIL).length
  const drags = bonnes.flatMap((b) => b.drag?.couts ?? [])
  const dragDepassent = drags.filter((c) => c > SEUIL).length

  const bilan = {
    etiquette: ETIQUETTE, url: URL_, passes: bonnes.length, rejets,
    plancherMs: pct(bonnes.map((b) => b.plancher), 50),
    plancherMelange: bonnes.some((b) => b.melange),
    ecran: bonnes[0].env.ecran, webgl: bonnes[0].env.webgl,
    frames: couts.length,
    coutP50: pct(couts, 50), coutP90: pct(couts, 90), coutMax: Math.max(...couts),
    reposP90,
    intervalleP50: pct(intervalles, 50), intervalleP90: pct(intervalles, 90),
    fpsPresentes: (couts.length / duree) * 1000,
    partAuDessusDuSeuilPct: (depassent / couts.length) * 100,
    ...(drags.length ? {
      dragFrames: drags.length,
      dragCoutP50: pct(drags, 50),
      dragCoutP90: pct(drags, 90),
      dragPartAuDessusDuSeuilPct: (dragDepassent / drags.length) * 100,
      gpu: bonnes[0].gpu,
    } : {}),
    seuilMs: SEUIL,
  }

  console.log(`
  plancher de cadence   ${r2(bilan.plancherMs)} ms       ← la vsync, pas un coût
  coût p50              ${r2(bilan.coutP50)} ms
  coût p90              ${r2(bilan.coutP90)} ms
  coût max              ${r2(bilan.coutMax)} ms
  coût au repos p90     ${r2(bilan.reposP90)} ms
  intervalle p50 / p90  ${r2(bilan.intervalleP50)} / ${r2(bilan.intervalleP90)} ms
  fps présentés         ${r1(bilan.fpsPresentes)}
  frames > ${SEUIL} ms        ${r2(bilan.partAuDessusDuSeuilPct)} %   (${depassent}/${couts.length})

  marge au p90          ${r2(SEUIL - bilan.coutP90)} ms sur ${SEUIL}`)

  if (drags.length) {
    console.log(`
  drag — coût p50 / p90   ${r2(bilan.dragCoutP50)} / ${r2(bilan.dragCoutP90)} ms
  drag — frames > ${SEUIL} ms  ${r2(bilan.dragPartAuDessusDuSeuilPct)} %   (${dragDepassent}/${drags.length})
  GPU après promotion     ${bilan.gpu.geometries} géométries · ${bilan.gpu.textures} textures
  (en mode --drag, le bloc scroll ci-dessus est le défilement APRÈS le premier drag — gate 3)`)
  }

  console.log(bilan.coutP90 <= SEUIL
    ? `\n  ✓ la cible tient — ${r2(SEUIL - bilan.coutP90)} ms de marge au p90.`
    : `\n  ✗ la cible est dépassée au p90 de ${r2(bilan.coutP90 - SEUIL)} ms.`)

  /* Un plancher au-dessus de la cible veut dire que l'environnement ne PEUT
     pas présenter à la cadence visée — en headless, le compositeur est
     logiciel et plafonne à 60 Hz. Le coût reste lisible (c'est du travail de
     fil principal, il ne dépend pas de la cadence), la cadence non. Le dire,
     sinon un « ✓ » se lira comme une preuve qu'il n'est pas. */
  if (bilan.plancherMelange) {
    console.log(`\n  ⚠ au moins une passe a un plancher MÉLANGÉ (deux cadences dans le même relevé,
    signature de la décroissance sans entrée réelle — ticket 32). Le COÛT reste
    lisible ; le plancher, les fps présentés et l'appariement « à plancher égal », non.`)
  }
  if (bonnes.some((b) => b.env.ecran !== bonnes[0].env.ecran)) {
    console.log(`\n  ⚠ les passes n'ont pas toutes atterri sur le même écran — sous Wayland la
    fenêtre se place où le compositeur veut, et le plancher suit l'écran (ticket 32).`)
  }
  if (bilan.plancherMs > SEUIL + TOLERANCE) {
    console.log(`\n  ⚠ plancher à ${r2(bilan.plancherMs)} ms : cet environnement ne présente pas à ${r1(1000 / SEUIL)} Hz.
    Le COÛT reste comparable d'une mesure à l'autre ; l'intervalle, les fps
    présentés et le pourcentage au-dessus du seuil, non. Relancer avec --tete
    pour mesurer sur le vrai écran.`)
  }

  if (opt.sortie) {
    await writeFile(opt.sortie, JSON.stringify(bilan, null, 2))
    console.log(`\n  bilan écrit dans ${opt.sortie}`)
  }
}

await main()
