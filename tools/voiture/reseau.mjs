/* ==================================================================
   GATE RÉSEAU (#12) — le visiteur qui ne drague pas ne paie RIEN.
   Rechargement + défilement complet sans drag : zéro requête vers le
   chunk du régime drag et le .glb. Sous --reduce : le montage ne
   charge qu'UNE image de la séquence (voiture.tsx, veille).
   usage : node tools/voiture/reseau.mjs <url> [--tete] [--reduce]
   ================================================================== */
import { lanceChrome, attends, pause } from "../chrome.mjs"

const args = process.argv.slice(2)
const URL_ = args.find((a) => !a.startsWith("--"))
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => {
  const [k, v] = a.slice(2).split("=")
  return [k, v === undefined ? "1" : v]
}))
if (!URL_) {
  console.error("usage: node tools/voiture/reseau.mjs <url> [--tete] [--reduce]")
  process.exit(1)
}

const { cdp, ferme } = await lanceChrome({
  nom: "reseau-voiture",
  tete: !!opt.tete,
  args: ["--window-size=1440,900", "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"],
})
try {
  await cdp.envoie("Page.enable")
  await cdp.envoie("Emulation.setFocusEmulationEnabled", { enabled: true })
  /* Le tampon par défaut de l'API resource est de 250 entrées : les
     160 images le crèveraient et le relevé mentirait par omission. */
  await cdp.envoie("Page.addScriptToEvaluateOnNewDocument", {
    source: "performance.setResourceTimingBufferSize(4096)",
  })
  if (opt.reduce) {
    await cdp.envoie("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    })
  }
  await cdp.envoie("Page.navigate", { url: URL_ })
  await attends(async () => await cdp.evalue("document.readyState === 'complete'"), 30000, "chargement de " + URL_)
  await pause(2500) // hydratation, polices, veille du montage

  const avant = await cdp.evalue('performance.getEntriesByType("resource").length')

  if (!opt.reduce) {
    /* Défilement complet à la molette — Lenis n'écoute que ça. */
    const h = await cdp.evalue("Math.max(0, document.documentElement.scrollHeight - innerHeight)")
    const pas = Math.max(1, Math.min(500, Math.ceil(h / 120)))
    for (const sens of [1, -1]) {
      for (let i = 0; i < pas; i++) {
        await cdp.envoie("Input.dispatchMouseEvent", {
          type: "mouseWheel", x: 720, y: 450, deltaX: 0, deltaY: sens * 120, button: "none", modifiers: 0,
        })
        await pause(8)
      }
      await pause(600)
    }
    await pause(1000)
  }

  const entrees = JSON.parse(await cdp.evalue(
    'JSON.stringify(performance.getEntriesByType("resource").map((e) => ({ n: e.name, o: e.decodedBodySize })))'
  ))
  const toutes = entrees.map((e) => e.n)
  const nouvelles = entrees.slice(avant)
  const glb = toutes.filter((u) => u.includes(".glb") || u.includes("/voiture/draco/"))
  const sequence = toutes.filter((u) => /\/voiture\/\d{3}\.webp/.test(u))
  /* Next préfetch les chunks de route quand leurs liens entrent au
     viewport pendant le défilement (mesuré : /work/[slug], 17 Ko) —
     c'est un comportement préexistant, pas le régime drag. On ne
     condamne donc que les chunks à la TAILLE du régime (three seul
     pèse 730 Ko décodés ; les chunks de route, quelques dizaines de
     Ko). ponytail: seuil naïf à 200 Ko — si un jour une route devient
     obèse, ce gate la signalera et on affinera par contenu. */
  const chunksJs = nouvelles.filter((e) => /\/_next\/.*\.js/.test(e.n))
  const lourds = chunksJs.filter((e) => e.o > 200000)

  let echec = false
  if (glb.length) { console.log(`✗ ${glb.length} requête(s) vers le .glb ou le décodeur sans drag — ${glb[0]}`); echec = true }
  else console.log("✓ zéro requête vers le .glb ou le décodeur Draco")
  if (opt.reduce) {
    if (sequence.length === 1) console.log("✓ sous reduce : une seule image de la séquence au montage")
    else { console.log(`✗ sous reduce : ${sequence.length} images chargées au lieu d'une`); echec = true }
  } else {
    if (lourds.length) { console.log(`✗ ${lourds.length} chunk(s) à la taille du régime drag pendant le défilement — ${lourds.map((e) => `${e.n} (${e.o} o)`).join(", ")}`); echec = true }
    else console.log(`✓ aucun chunk du régime drag déclenché par le défilement (${chunksJs.length} préfetch(s) de route, toléré(s))`)
    console.log(`  ${sequence.length} images de séquence, ${toutes.length} requêtes en tout`)
  }
  process.exitCode = echec ? 1 : 0
} finally {
  await ferme()
}
