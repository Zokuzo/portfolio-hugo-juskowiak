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

// Le rejeu (4e retour de gate #31) : l'habitacle SEUL rend la main au CIEL.
assert.equal(suivant(S("HABITACLE"), { t: "rejoue" }).etat, "CIEL", "rejouer depuis l'habitacle")
for (const etat of ETATS.filter((e) => e !== "HABITACLE")) {
  const avant = S(etat)
  assert.equal(suivant(avant, { t: "rejoue" }), avant, `rejouer est inerte depuis ${etat}`)
}

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
  { t: "rejoue" },
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
    noms: ["Aussenbeet", "Carbon", "DashboardArtwork", "Display", "Floor", "Glass",
      "HeadlightsTex", "Indicator", "InteriorBlack", "InteriorStuff", "LightsFront",
      "Paint", "Pedals", "RedGlow", "SilverPlastic", "Speedo",
      "Speedoneedle", "Stern", "Taillightbody"],
  },
  "public/prototype/decor-procedural.glb": {
    max: 8_800_000,
    mats: 38,
    meshes: 38,
    noms: ["CityGen_LR_Facades", "CityGenGlass.001"],
  },
  /* la ville coupée ne sert plus qu'à la route prototype (#31 a mis
     l'habitacle dans la rue entière) — gardée au budget tant que le
     prototype vit, #35 tranchera son sort */
  "public/prototype/decor-habitacle.glb": {
    max: 5_000_000,
    mats: 42,
    meshes: 44,
    noms: ["CityGen_LR_Facades", "CityGenGlass.001"],
  },
  "public/prototype/crepuscule.hdr": { max: 1_200_000 },
  /* l'habillage habitacle (#31) : textures gatées aux #23/#26 */
  "public/prototype/compteur-violet.jpg": { max: 168_000 },
  "public/prototype/haunter-dash.jpg": { max: 98_000 },
  "public/prototype/haunter-dash-lueur.jpg": { max: 52_000 },
  "public/prototype/ecran-fond.jpg": { max: 43_000 },
  "public/prototype/retro.jpg": { max: 5_300 },
  /* la carte vue du dessus de l'écran GPS (#32, générée par
     tools/monde/carte-quartier.mjs) */
  "public/prototype/carte-quartier.png": { max: 1_600 },
  /* la face du disque de l'AMP (#33, 11e retour : les images fournies
     par Hugo) — chargées paresseusement à la première entrée AMP, donc
     HORS de la cascade de la passe 7 */
  "public/amp/kirby-sprite.jpg": { max: 22_000 },
  "public/amp/kirby-logo.jpg": { max: 29_000 },
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
/* le voile CHARGEMENT (7e retour #33) est OPAQUE ET BLOQUANT tant que la
   rue décode — comme pour l'œil, le clic n'existe qu'une fois le voile
   levé (data-pret) ; budget mule : décodage meshopt + compiles */
await attends(
  async () => (await sonde(`document.querySelector("[data-etat]")?.dataset.pret`)) === "1",
  90000,
  "le voile CHARGEMENT se lève (ciel + rue décodés)",
)
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
/* budget MULE : la passe 3 attend désormais le voile CHARGEMENT (rue
   décodée + compiles) AVANT ses clics — la navigation repart donc sur un
   renderer en pleine tempête de compilation, le remontage peut traîner */
await attends(async () => await etat(), 30000, "remontage")
assert.equal(await etat(), "HABITACLE", "l'intro s'est rejouée dans la même session")
console.log("  4/6 intro une seule fois par session")

/* 4 bis. Le rail complet s'achève DE LUI-MÊME (#30, #31) : session vierge,
      clic sur la consigne, et vol PUIS seuil doivent mener à l'habitacle
      sans skip — les chorégraphes envoient le vrai « fini », les horloges
      de scene.tsx ne sont que des filets. Large : vol 4,6 s + seuil 6,6 s
      + chargement rue, filets compris (VOL_MS+4 s puis SEUIL_MS+4 s sur
      machine gelée). */
await sonde(`sessionStorage.clear()`)
await va(base + "/")
await attends(async () => (await etat()) === "CIEL", 8000, "retour au CIEL en session vierge")
await sonde(`document.querySelector('[data-gt86="demarrer"]').click()`)
/* budget MULE : la topologie de lumières constante (#31, retour de gate —
   15 lumières toujours collectées) fait ramer SwiftShader à ~0,65 fps et
   affame même les filets ; mesuré au CDP : rail complet ~60 s sur la
   machine de test, 10,7 s sur une vraie. La passe prouve l'ABOUTISSEMENT,
   pas la durée. */
await attends(async () => (await etat()) === "HABITACLE", 120000, "vol + seuil jusqu'à l'habitacle")
/* …et la mise sous contact a bien eu lieu (#31) : phares à l'intensité
   gatée, dalle allumée, caméra ASSISE (à moins de 2 m du poste de
   conduite — la vue d'arrivée du #30 en est à 7). La voiture du ciel
   traîne ses propres matériaux homonymes : on cherche DES exemplaires
   aux valeurs du réveil, pas l'unicité. On ATTEND l'état final au lieu
   de le lire au vol : `data-etat` bascule au commit, mais l'allumage vit
   dans des effets passifs que React diffère — sur machine affamée
   (SwiftShader ~1 fps) la sonde les doublait (payé : « LightsFront à
   1 » alors que l'état final était bon, relevé au CDP). */
const contact = await attends(async () => {
  const r = JSON.parse(
    await sonde(`(() => {
      const st = window.__gt86
      const releve = { optiques: 0, ecran: 0 }
      st.scene.traverse((o) => {
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
        for (const m of mats) {
          if (m.name === "LightsFront") releve.optiques = Math.max(releve.optiques, m.emissiveIntensity)
          if (m.name === "Display") releve.ecran = Math.max(releve.ecran, m.emissiveIntensity)
        }
      })
      const c = st.camera.position
      releve.distance = Math.hypot(c.x - -4.7, c.z - -18.6)
      return JSON.stringify(releve)
    })()`),
  )
  return r.optiques >= 7.9 && r.ecran >= 1 && r.distance < 2 ? r : null
}, 10000, "le réveil de l'habitacle (phares gatés + dalle allumée + caméra assise)")
console.log(
  `  4b/6 vol + seuil s'achèvent d'eux-mêmes, habitacle vivant (phares ${contact.optiques}, dalle ${contact.ecran}), caméra assise`,
)

/* 4 ter. LE REJEU (4e retour de gate #31) : « revoir la scène » rend la
      main au CIEL, la voiture de rue REDEVIENT MORTE (l'extinction est
      l'inverse exact de l'allumage), et un skip la rallume — le cycle est
      réversible autant de fois qu'on veut. Les matériaux de la voiture de
      rue se reconnaissent à leur préparation (toneMapped:false sur
      LightsFront, CanvasTexture sur Display) — la voiture du ciel garde
      les siens d'usine. */
await sonde(`document.querySelector('[data-gt86="rejouer"]').click()`)
await attends(async () => (await etat()) === "CIEL", 8000, "le rejeu rend la main au CIEL")
await attends(async () => {
  const r = JSON.parse(
    await sonde(`(() => {
      const st = window.__gt86
      let optiques = -1, ecran = -1
      st.scene.traverse((o) => {
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
        for (const m of mats) {
          if (m.name === "LightsFront" && m.toneMapped === false) optiques = m.emissiveIntensity
          if (m.name === "Display" && m.emissiveMap?.isCanvasTexture) ecran = m.emissiveIntensity
        }
      })
      return JSON.stringify({ optiques, ecran })
    })()`),
  )
  return r.optiques === 0 && r.ecran === 0
}, 8000, "l'extinction de la voiture au rejeu")
await sonde(`document.querySelector('[data-gt86="passer"]').click()`)
await attends(async () => (await etat()) === "HABITACLE", 8000, "le skip du rejeu rassoit")
await attends(async () => {
  const v = await sonde(`(() => {
    let v = 0
    window.__gt86.scene.traverse((o) => {
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      for (const m of mats) if (m.name === "LightsFront" && m.toneMapped === false) v = m.emissiveIntensity
    })
    return v
  })()`)
  return v >= 7.9
}, 8000, "le rallumage après le rejeu")
console.log("  4c/6 le rejeu rend au ciel voiture morte, et le skip rallume tout")

/* 4 quater. LE POSTE RÉPOND (#32) : au vrai clic souris — la dalle zoome
      (le rail vole vers l'écran), le hub part au GPS, la rangée MAISON
      lance l'itinéraire (CHOIX), ?nodepart le fige, Échap rassoit. Les
      pixels sont calculés en projetant le PLAN calibré de la dalle. */
await va(base + "/?nodepart")
await attends(async () => (await etat()) === "HABITACLE", 15000, "l'habitacle sous ?nodepart")
await attends(async () => {
  const v = await sonde(`(() => {
    if (!window.__gt86 || !window.__gt86.scene.getObjectByName("moquette")) return 0
    let v = 0
    window.__gt86.scene.traverse((o) => {
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      for (const m of mats) if (m.name === "LightsFront" && m.toneMapped === false) v = m.emissiveIntensity
    })
    return v
  })()`)
  return v >= 7.9
}, 15000, "le réveil avant le poste")
/* le pixel d'un point (u, v) de la dalle, via le plan calibré (#26 : les
   axes du plan — le vertical pointe vers le BAS, le u suit −x) */
const pixelDalle = async (u, v) =>
  JSON.parse(
    await sonde(`(() => {
      const st = window.__gt86
      const T = st.scene.getObjectByName("moquette").parent
      const V = st.camera.position.constructor
      const centre = new V(-0.075, 0.785, 0.328)
      const normale = new V(0, Math.sin(-0.28), Math.cos(-0.28)).normalize()
      const axeY = normale.clone().cross(new V(-1, 0, 0))
      const local = centre
        .clone()
        .add(new V(0.065 - ${u} * 0.13, 0, 0))
        .add(axeY.clone().multiplyScalar(${v} * 0.07 - 0.035))
      local.add(T.position)
      const monde = new V(-local.x - 4.4, local.y - 0.05, -local.z - 19)
      monde.project(st.camera)
      return JSON.stringify({ x: Math.round(((monde.x + 1) / 2) * innerWidth), y: Math.round(((1 - monde.y) / 2) * innerHeight) })
    })()`),
  )
const clicPoste = async (u, v) => {
  const px = await pixelDalle(u, v)
  await cdp.envoie("Input.dispatchMouseEvent", { type: "mousePressed", x: px.x, y: px.y, button: "left", clickCount: 1 })
  await cdp.envoie("Input.dispatchMouseEvent", { type: "mouseReleased", x: px.x, y: px.y, button: "left", clickCount: 1 })
}
await clicPoste(0.5, 0.5)
/* le rail vole vers l'écran (1,1 s) : la caméra doit finir au nez de la
   dalle — l'écran passe en hub au même clic */
await attends(async () => {
  const d = await sonde(`(() => {
    const st = window.__gt86
    const T = st.scene.getObjectByName("moquette").parent
    const V = st.camera.position.constructor
    const local = new V(-0.075, 0.8403, 0.1358).add(T.position)
    const monde = new V(-local.x - 4.4, local.y - 0.05, -local.z - 19)
    return st.camera.position.distanceTo(monde)
  })()`)
  return d < 0.05
}, 90000, "le rail jusqu'au nez de la dalle")
/* budget MULE encore : le rail de 1,1 s avance d'1/12 s par frame rendue —
   à ~0,5 fps SwiftShader, c'est ~26 s de mur (mesuré au CDP). Et on laisse
   la caméra SE POSER avant de viser la tuile : un pixel projeté en plein
   vol tombait à côté (payé : clic sur MUSIQUES au lieu de GPS). */
await pause(1500)
await clicPoste(0.25, 0.5)
await attends(async () => (await etat()) === "GPS", 20000, "la tuile GPS du hub")
await clicPoste(0.5, 0.6)
await attends(async () => (await etat()) === "CHOIX", 20000, "la rangée MAISON lance l'itinéraire")
await pause(3400)
assert.equal(await etat(), "CHOIX", "?nodepart doit figer l'itinéraire (départ lancé quand même)")
await sonde(`window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))`)
await attends(async () => (await etat()) === "HABITACLE", 8000, "Échap rassoit depuis l'itinéraire")
console.log("  4d/6 le poste répond : dalle → hub → GPS → MAISON, ?nodepart fige, Échap rassoit")

/* 4 quinquies. SPOTIFY EN FAÇADE (#33) : l'écran MUSIQUES ne fait AUCUNE
      requête tierce — c'est le clic sur la dalle (click-to-load, doctrine
      RGPD du #18) qui démarre le MOTEUR maison (7e retour : plus
      d'iframe — notre API sert les pistes, le CDN l'audio). Le ‹ du
      player revient au hub. Budgets mule : chaque vol de rail ≈ 26 s. */
const distanceA = (lx, ly, lz) => sonde(`(() => {
  const st = window.__gt86
  const T = st.scene.getObjectByName("moquette").parent
  const V = st.camera.position.constructor
  const local = new V(${lx}, ${ly}, ${lz}).add(T.position)
  const monde = new V(-local.x - 4.4, local.y - 0.05, -local.z - 19)
  return st.camera.position.distanceTo(monde)
})()`)
await attends(async () => (await distanceA(0.3, 1.05, -0.42)) < 0.05, 90000, "le retour assis avant Spotify")
await pause(1500)
await clicPoste(0.5, 0.5)
await attends(async () => (await distanceA(-0.075, 0.8403, 0.1358)) < 0.05, 90000, "le rail vers la dalle (Spotify)")
await pause(1500)
/* le consentement est LE CLIC DE TUILE (8e retour : direct à l'AMP, la
   tuile porte la mention SPOTIFY) — zéro octet ne doit précéder CE clic */
const tiersAvantClic = JSON.parse(
  await sonde(
    `JSON.stringify(performance.getEntriesByType("resource").map((e) => e.name).filter((u) => u.includes("spotify") || u.includes("scdn.co") || u.includes("/api/gt86/mix")))`,
  ),
)
assert.deepEqual(tiersAvantClic, [], `la façade a fui : requêtes Spotify AVANT le clic — ${tiersAvantClic}`)
await clicPoste(0.75, 0.5)
await attends(async () => (await etat()) === "SPOTIFY", 20000, "la tuile MUSIQUES ouvre l'AMP direct")
await attends(
  async () =>
    await sonde(
      `performance.getEntriesByType("resource").some((e) => e.name.includes("/api/gt86/mix/"))`,
    ),
  60000,
  "le moteur appelle notre API des pistes (réseau Spotify lent sur la mule)",
)
/* la MOLETTE (7e retour) : trois crans de roulette sur le bouton rotatif
   gauche (zone plan étendue u ≈ −0,18) → le volume du moteur baisse —
   lu à la poignée __gt86ecran (etatDebug porte amp.volume) */
const volumeLu = async () => JSON.parse(await sonde(`window.__gt86ecran.etatDebug()`)).volume
const volAvant = await volumeLu()
const pxMolette = await pixelDalle(-0.177, 0.114)
for (let k = 0; k < 3; k++) {
  await cdp.envoie("Input.dispatchMouseEvent", {
    type: "mouseWheel", x: pxMolette.x, y: pxMolette.y, deltaX: 0, deltaY: 120,
  })
  await pause(400)
}
await attends(async () => (await volumeLu()) < volAvant - 0.01, 15000, "la molette baisse le volume")

/* le player est peint dans la dalle (6e retour) : son ‹ est une ZONE du
   peintre, cliquée comme le reste du poste */
await clicPoste(0.03, 0.05)
await attends(async () => (await etat()) === "HABITACLE", 15000, "le ‹ du player revient au hub")
console.log("  4e/6 Spotify direct : zéro octet avant le clic de tuile, l'AMP en texture, la molette, le ‹ revient au hub")

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
   passerait la sonde d'externes haut la main. Voiture, ciel et textures
   d'habitacle partent au chargement du module, la rue au montage. La ville
   coupée du prototype n'est PLUS de la cascade (#31 : l'habitacle vit dans
   la rue entière). */
for (const asset of [
  "/prototype/gt86.glb",
  "/prototype/crepuscule.hdr",
  "/prototype/decor-procedural.glb",
  "/prototype/compteur-violet.jpg",
  "/prototype/haunter-dash.jpg",
  "/prototype/haunter-dash-lueur.jpg",
  "/prototype/retro.jpg",
  "/prototype/ecran-fond.jpg",
  "/prototype/carte-quartier.png",
])
  assert.ok(
    ressources.some((u) => u.endsWith(asset)),
    `la cascade n'a pas demandé ${asset} — préchargement débranché ?`,
  )
console.log("  7/7 zéro requête externe, et la cascade tire voiture + ciel + rue + habitacle")

console.log("bloc B — navigateur : OK")

/* Sortie EXPLICITE : le Chrome piloté et `next start` gardent la boucle
   d'événements vivante, et le script resterait suspendu sur un succès —
   indiscernable d'un blocage pour qui le lance en intégration. */
rangement()
process.exit(0)
