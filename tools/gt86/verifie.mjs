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

console.log("bloc A — machine + gardes : OK")
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

/* 3. Le skip mène à l'habitacle, et la session retient que l'intro est vue. */
assert.equal(await etat(), "CIEL", "l'expérience devrait s'ouvrir au CIEL")
await sonde(`document.querySelector('[data-gt86="passer"]').click()`)
await pause(300)
assert.equal(await etat(), "HABITACLE", "le skip devrait rassoir à l'habitacle")
console.log("  3/6 le skip mène au hub")

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

console.log("bloc B — navigateur : OK")

/* Sortie EXPLICITE : le Chrome piloté et `next start` gardent la boucle
   d'événements vivante, et le script resterait suspendu sur un succès —
   indiscernable d'un blocage pour qui le lance en intégration. */
rangement()
process.exit(0)
