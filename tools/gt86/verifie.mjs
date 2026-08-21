#!/usr/bin/env node
/* LA VÉRIFICATION DE LA COQUILLE — ticket #27 de la carte #15.
 *
 *   node tools/gt86/verifie.mjs          → bloc A seul (machine + gardes), instantané
 *   node tools/gt86/verifie.mjs --nav    → + bloc B : le vrai navigateur sur `next start`
 *
 * Bloc A asserte la table de transitions, qui est pure et donc exécutable
 * ici sans navigateur (Node 24 dépouille les types nativement, on importe le
 * .ts directement), plus deux gardes de dépôt.
 *
 * Bloc B est le CRITÈRE D'ACCEPTATION du ticket, mot pour mot : « la
 * surcouche monte, se démonte, ne casse jamais la version simple » — et il
 * le montre sans un octet de contenu 3D.
 *
 * Zéro dépendance : `node:assert` et `tools/chrome.mjs` (CDP), déjà là.
 */

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { fileURLToPath } from "node:url"
import path from "node:path"

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const NAV = process.argv.includes("--nav")

/* ─────────────────────────── BLOC A — la machine ─────────────────────── */

const { suivant, depart, marqueVue, CLE, ETATS, INTRO, RAILS, REPOS } = await import(
  path.join(RACINE, "components/gt86/machine.ts")
)

const S = (etat, dest = null) => ({ etat, dest })

/* La session est stubbée plutôt que simulée : `depart()` lit
   `globalThis.sessionStorage` précisément pour être testable ici. */
function avecSession(valeur, fn) {
  const avant = globalThis.sessionStorage
  const boite = new Map(valeur === null ? [] : [[CLE, valeur]])
  globalThis.sessionStorage = {
    getItem: (k) => boite.get(k) ?? null,
    setItem: (k, v) => boite.set(k, v),
  }
  try {
    return fn(boite)
  } finally {
    globalThis.sessionStorage = avant
  }
}

// L'intro se joue une fois par session, et pas deux.
avecSession(null, () => assert.equal(depart().etat, "CIEL", "première visite → CIEL"))
avecSession("vu", () => assert.equal(depart().etat, "HABITACLE", "session déjà vue → HABITACLE"))
avecSession(null, (boite) => {
  marqueVue()
  assert.equal(boite.get(CLE), "vu", "marqueVue() écrit la session")
})

// La chaîne complète de l'intro, rail après rail.
let s = S("CIEL")
s = suivant(s, { t: "clic" })
assert.equal(s.etat, "ATTERRISSAGE", "le clic lance l'atterrissage")
s = suivant(s, { t: "fini" })
assert.equal(s.etat, "SEUIL", "le rail d'atterrissage mène au seuil")
s = suivant(s, { t: "fini" })
assert.equal(s.etat, "HABITACLE", "le rail du seuil mène à l'habitacle")
assert.equal(suivant(s, { t: "fini" }), s, "l'habitacle n'a pas de rail : identité")

// Le skip mène à l'habitacle depuis les trois états d'intro, et de nulle part ailleurs.
for (const etat of INTRO)
  assert.equal(suivant(S(etat), { t: "passer" }).etat, "HABITACLE", `passer depuis ${etat}`)
for (const etat of ETATS.filter((e) => !INTRO.includes(e))) {
  const avant = S(etat)
  assert.equal(suivant(avant, { t: "passer" }), avant, `passer est inerte depuis ${etat}`)
}

// La destination traverse GPS → CHOIX → DÉPART sans se perdre.
let g = suivant(S("HABITACLE"), { t: "va", ou: "GPS" })
assert.equal(g.etat, "GPS")
g = suivant(g, { t: "choisit", dest: "/work" })
assert.deepEqual(g, S("CHOIX", "/work"), "le choix retient la destination")
g = suivant(g, { t: "confirme" })
assert.deepEqual(g, S("DEPART", "/work"), "le départ garde la destination")

// Le retour est un seul chemin, et DÉPART est terminal.
for (const etat of ["GPS", "CHOIX", "MUSIQUES", "SPOTIFY", "SEUIL"])
  assert.equal(suivant(S(etat), { t: "retour" }).etat, "HABITACLE", `retour depuis ${etat}`)
const enRoute = S("DEPART", "/home")
assert.equal(suivant(enRoute, { t: "retour" }), enRoute, "un départ en cours ne se rature pas")

/* Balayage exhaustif : tout couple (état, signal) rend un état CONNU, et
   aucun état n'échappe au classement du frameloop — sans quoi une scène
   ajoutée plus tard tournerait en boucle sans que personne le remarque. */
const SIGNAUX = [
  { t: "clic" },
  { t: "fini" },
  { t: "passer" },
  { t: "va", ou: "GPS" },
  { t: "va", ou: "MUSIQUES" },
  { t: "choisit", dest: "/work" },
  { t: "confirme" },
  { t: "retour" },
]
for (const etat of ETATS)
  for (const sig of SIGNAUX) {
    const r = suivant(S(etat), sig)
    assert.ok(ETATS.includes(r.etat), `${etat} + ${sig.t} → état inconnu ${r.etat}`)
  }
const classes = new Set([...REPOS, ...Object.keys(RAILS), "DEPART"])
assert.deepEqual(
  ETATS.filter((e) => !classes.has(e)),
  [],
  "un état n'est ni en repos, ni un rail, ni terminal",
)

/* GARDE DE DÉPÔT : le paquet de la home ne doit contenir NI three NI R3F.
   Un import statique enverrait les 139 Ko (mesurés au #17) à tous les
   visiteurs — mobiles et `prefers-reduced-motion` compris. C'est invisible à
   l'œil et ça ne casse aucun test : d'où cette garde. */
for (const f of ["components/gt86/capable.ts", "components/gt86/surcouche.tsx", "app/page.tsx"]) {
  const src = readFileSync(path.join(RACINE, f), "utf8")
  const fautif = src.match(/^\s*import[^\n]*from\s+["'](three|@react-three\/[\w-]+)["']/m)
  assert.equal(fautif, null, `${f} importe ${fautif?.[1]} statiquement — la 3D doit rester derrière le dynamic`)
}

/* LE RÉGIME DES ASSETS — ticket #28. Deux régressions passent inaperçues
   sans ces gardes : un asset qui REGROSSIT (un ré-export qui oublie
   `tools/monde/regime.mjs`), et un NOM qui disparaît (une passe join/palette
   fusionne les matériaux — le shader de fenêtres ne trouve plus sa façade,
   l'habillage de la voiture plus ses optiques). On lit le chunk JSON du GLB
   à la main : zéro dépendance, comme le reste du bloc A.

   Les noms listés sont EXACTEMENT ceux que le code compare (`mat.name ===`),
   relevés par grep — pas la liste complète des matériaux. Les budgets sont en
   octets, calés ~7 % au-dessus du poids mesuré après régime (`ls -lh` affiche
   des Mio : 8,3 Mo s'y lit « 7,9M », ce n'est pas une régression). */
const ASSETS = {
  "public/prototype/gt86.glb": {
    max: 2_400_000,
    mats: 36,
    noms: ["Carbon", "DashboardArtwork", "Display", "Floor", "Glass", "HeadlightsTex",
      "Indicator", "InteriorBlack", "InteriorStuff", "LightsFront", "RedGlow",
      "SilverPlastic", "Speedo", "Speedoneedle", "Taillightbody"],
  },
  "public/prototype/decor-procedural.glb": {
    max: 8_800_000,
    mats: 38,
    meshes: 38,
    noms: ["CityGen_LR_Facades", "CityGenGlass.001"],
  },
  "public/prototype/decor-habitacle.glb": {
    max: 5_000_000,
    mats: 42,
    meshes: 44,
    noms: ["CityGen_LR_Facades", "CityGenGlass.001"],
  },
  "public/prototype/crepuscule.hdr": { max: 1_200_000 },
}

const jsonDuGlb = (buf) => JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString("utf8"))

for (const [f, budget] of Object.entries(ASSETS)) {
  const buf = readFileSync(path.join(RACINE, f))
  assert.ok(
    buf.length <= budget.max,
    `${f} pèse ${buf.length} o (budget ${budget.max}) — repasser tools/monde/regime.mjs`,
  )
  if (!f.endsWith(".glb")) continue
  const g = jsonDuGlb(buf)
  const mats = (g.materials ?? []).map((m) => m.name)
  for (const nom of budget.noms) assert.ok(mats.includes(nom), `${f} a perdu le matériau ${nom}`)
  if (budget.mats) assert.equal(mats.length, budget.mats, `${f} : ${mats.length} matériaux au lieu de ${budget.mats}`)
  if (budget.meshes) assert.equal(g.meshes.length, budget.meshes, `${f} : ${g.meshes.length} meshes au lieu de ${budget.meshes}`)
  /* un GLB basisu jetterait au chargement : useGLTF ne pose aucun KTX2Loader */
  assert.ok(
    !(g.extensionsRequired ?? []).includes("KHR_texture_basisu"),
    `${f} exige KHR_texture_basisu — useGLTF n'a pas de transcodeur, le chargement jetterait`,
  )
}

console.log("bloc A — machine + gardes + assets : OK")
if (!NAV) {
  console.log("(bloc B navigateur non lancé — ajouter --nav)")
  process.exit(0)
}

/* ────────────────────── BLOC B — le vrai navigateur ───────────────────── */

const { lanceChrome, pause, attends } = await import(path.join(RACINE, "tools/chrome.mjs"))

const port = await new Promise((res) => {
  const srv = createServer()
  srv.listen(0, "127.0.0.1", () => {
    const { port } = srv.address()
    srv.close(() => res(port))
  })
})
const base = `http://127.0.0.1:${port}`

console.log(`build + next start sur ${port}…`)
await new Promise((res, rej) => {
  const b = spawn("npx", ["next", "build"], { cwd: RACINE, stdio: "ignore" })
  b.on("exit", (c) => (c === 0 ? res() : rej(new Error("next build a échoué"))))
})
const serveur = spawn("npx", ["next", "start", "-p", String(port)], { cwd: RACINE, stdio: "ignore" })
const ferme = []
const rangement = () => {
  for (const f of ferme.reverse()) {
    try {
      f()
    } catch {}
  }
  serveur.kill("SIGTERM")
}
process.on("exit", rangement)

await attends(async () => {
  try {
    return (await fetch(base + "/")).ok
  } catch {
    return false
  }
}, 40000, "démarrage de next start")

/* 1. Le HTML du SERVEUR : la version simple entière, et zéro trace de 3D.
      C'est ce que voit un robot d'indexation — et un visiteur mobile. */
const html = await (await fetch(base + "/")).text()
assert.ok(html.includes("Juskowiak"), "le HTML serveur ne contient pas la version simple")
assert.ok(!html.includes("data-etat"), "la surcouche a fuité dans le HTML serveur")
console.log("  1/6 SSR intact, zéro 3D au serveur")

/* Le pointeur fin doit être DÉCLARÉ : un Chrome piloté en CDP se dit sans
   souris, `Emulation.setEmulatedMedia` ne couvre pas hover/pointer, et toute
   la garde de capacité tomberait alors à faux (piège payé au chantier #12). */
const { cdp, ferme: fermeChrome } = await lanceChrome({
  nom: "gt86",
  url: "about:blank",
  args: [
    "--window-size=1280,900",
    "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4",
  ],
})
ferme.push(fermeChrome)

const va = async (url) => {
  await cdp.envoie("Page.navigate", { url })
  await pause(1200)
}
const sonde = (expr) => cdp.evalue(expr)
const compte = (sel) => sonde(`document.querySelectorAll(${JSON.stringify(sel)}).length`)
const etat = () => sonde(`document.querySelector("[data-etat]")?.dataset.etat ?? null`)

/* 2. La surcouche monte, et elle a bien DÉMONTÉ le WebGL vanille de la home :
      un seul canvas vivant, donc jamais deux contextes. */
await va(base + "/")
await attends(async () => await etat(), 8000, "montage de la surcouche")
assert.equal(await compte(".voiture"), 0, "la voiture vanille est restée montée sous la surcouche")
assert.equal(await compte("canvas"), 1, "il devrait rester exactement un canvas (celui de R3F)")
console.log("  2/6 surcouche montée, un seul contexte WebGL")

/* 3. Le clic sur la VOITURE lance l'atterrissage (#29) : un VRAI événement
      souris CDP au centre du cadre — la pose du gate #21 y met la
      carrosserie, la consigne DOM a quitté le centre exprès, et l'overlay
      est `pointerEvents:none` : seul le raycast R3F peut réagir. On
      réessaie tant que la Suspense décode le GLB — un clic dans le vide est
      inerte. Puis le skip rassoit, même en plein rail, et la session
      retient que l'intro est vue. */
assert.equal(await etat(), "CIEL", "l'expérience devrait s'ouvrir au CIEL")
const [cx, cy] = JSON.parse(await sonde(`JSON.stringify([innerWidth / 2, innerHeight / 2])`))
const clicToile = async () => {
  await cdp.envoie("Input.dispatchMouseEvent", { type: "mousePressed", x: cx, y: cy, button: "left", clickCount: 1 })
  await cdp.envoie("Input.dispatchMouseEvent", { type: "mouseReleased", x: cx, y: cy, button: "left", clickCount: 1 })
}
await attends(async () => {
  /* quitter le CIEL prouve le chemin canvas → raycast → machine ; on ne
     fige pas l'état attendu, les rails avancent tout seuls derrière */
  if ((await etat()) === "CIEL") await clicToile()
  await pause(150)
  return (await etat()) !== "CIEL"
}, 20000, "clic sur la voiture → atterrissage")
await sonde(`document.querySelector('[data-gt86="passer"]')?.click()`)
await pause(300)
assert.equal(await etat(), "HABITACLE", "le skip devrait rassoir à l'habitacle")
console.log("  3/6 le clic sur la voiture lance l'atterrissage, le skip rassoit")

await va(base + "/")
await attends(async () => await etat(), 8000, "remontage")
assert.equal(await etat(), "HABITACLE", "l'intro s'est rejouée dans la même session")
console.log("  4/6 intro une seule fois par session")

/* 5. La version simple n'est JAMAIS cassée : incapable → rien ne se monte,
      le décor et la voiture sont à leur place. */
await va(base + "/?gt86=off")
assert.equal(await etat(), null, "la surcouche s'est montée malgré ?gt86=off")
assert.equal(await compte(".voiture"), 1, "la voiture vanille manque à la version simple")
assert.ok((await compte("canvas")) >= 2, "les toiles de la version simple manquent")
console.log("  5/6 version simple intacte quand la machine est incapable")

/* 6. Le repli démonte : la scène jette au montage, la boundary la retire, et
      la version simple reprend la main d'elle-même. */
await va(base + "/?gt86=boom")
await attends(async () => (await compte(".voiture")) === 1, 6000, "retour de la version simple")
assert.equal(await etat(), null, "la surcouche est restée après l'échec")
assert.equal(
  await sonde(`document.documentElement.style.overflow`),
  "",
  "le défilement est resté gelé après le repli",
)
console.log("  6/6 le repli démonte proprement et rend le défilement")

/* 7. AUCUN OCTET NE PART CHEZ UN TIERS (#28). Grepper le bundle ne prouve
      rien — l'URL gstatic vit dans le module drei, override ou pas. La seule
      preuve est RUNTIME : on traverse l'intro (les preload en cascade se
      déclenchent — voiture, ciel, ville) puis on relit le journal réseau de
      la page. Couvre d'un coup le décodeur Draco (gstatic), les presets
      drei (jsdelivr), les HDRI distants et les polices tierces. */
await va(base + "/")
await attends(async () => await etat(), 8000, "remontage pour la sonde réseau")
if ((await etat()) === "CIEL") await sonde(`document.querySelector('[data-gt86="demarrer"]').click()`)
await pause(3000)
const ressources = JSON.parse(
  await sonde(`JSON.stringify(performance.getEntriesByType("resource").map((e) => e.name))`),
)
const externes = ressources.filter((u) => !u.startsWith(base))
assert.deepEqual(externes, [], `des requêtes partent chez un tiers : ${externes}`)
/* …et la cascade tire RÉELLEMENT ses octets — sans ça, une cascade débranchée
   passerait la sonde d'externes haut la main. La ville se précharge à
   l'HABITACLE (où la session revenante atterrit), la voiture et le ciel au
   chargement du module. */
for (const asset of ["/prototype/gt86.glb", "/prototype/crepuscule.hdr", "/prototype/decor-habitacle.glb"])
  assert.ok(
    ressources.some((u) => u.endsWith(asset)),
    `la cascade n'a pas demandé ${asset} — préchargement débranché ?`,
  )
console.log("  7/7 zéro requête externe, et la cascade tire voiture + ciel + ville")

console.log("bloc B — navigateur : OK")

/* Sortie EXPLICITE : le Chrome piloté et `next start` gardent la boucle
   d'événements vivante, et le script resterait suspendu sur un succès —
   indiscernable d'un blocage pour qui le lance en intégration. */
rangement()
process.exit(0)
