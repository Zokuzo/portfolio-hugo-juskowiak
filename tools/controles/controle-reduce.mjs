/* Contrôle du ticket 23 — `prefers-reduced-motion` sur les révélations framer.
 *
 * Mesure, sur la plaque (`rise()`, `animate` au chargement, 1,1 s), la suite
 * des opacités traversées dans les deux modes. Le fait à établir est binaire :
 * sous `reduce`, l'élément doit se POSER à son état final, pas le rejoindre.
 *
 * Deux gardes obligatoires, hérités de la recherche 06 :
 *   1. rAF doit TIRER. Sans ce contrôle, un relevé vide se lit « reduce
 *      fonctionne » — la conclusion inverse de la bonne.
 *   2. On relève aussi la console : la coupure se fait au rendu, donc elle
 *      peut faire diverger le HTML du serveur de celui du client.
 *
 * Usage : node tools/controles/controle-reduce.mjs [url]   (défaut http://localhost:3210)
 *         CHROME=<chemin d'un Chrome/Chromium> pour un autre binaire.
 */
/* playwright-core est une devDependency du dépôt (il ne télécharge
   aucun navigateur) : l'import se résout depuis node_modules, plus
   depuis un chemin de cache propre à une machine. */
import { chromium } from "playwright-core"

const URL = process.argv[2] ?? "http://localhost:3210"
const CIBLE = ".plate-label" // rise(0.3) — animate au chargement, sans scroll
const DUREE = 1800 // ms — 1,1 s d'animation + 0,3 s de retard + marge

/* playwright-core n'installe pas de navigateur : le binaire vient de
   CHROME, ou du cache ms-playwright existant. Échouer ici avec la
   marche à suivre vaut mieux qu'un ENOENT cryptique au launch. */
import { existsSync } from "node:fs"
const CHROME = process.env.CHROME ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`
if (!existsSync(CHROME)) {
  console.error(`Chrome introuvable (${CHROME}) — passe CHROME=<chemin du binaire>.`)
  process.exit(2)
}

const navigateur = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox"], // ticket 21 : nécessaire sur cette machine
})

/* Garde 1 — rAF tire-t-il ? */
{
  const p = await navigateur.newPage()
  await p.setContent("<div>x</div>")
  const frames = await p.evaluate(
    () =>
      new Promise((res) => {
        let n = 0
        const t = () => {
          n++
          requestAnimationFrame(t)
        }
        requestAnimationFrame(t)
        setTimeout(() => res(n), 1000)
      }),
  )
  console.log(`rAF en 1 s : ${frames} frames`)
  if (frames < 10) {
    console.log("ARRÊT — ce navigateur ne tire pas de frames, tout relevé serait faux.")
    await navigateur.close()
    process.exit(2)
  }
  await p.close()
}

for (const mode of ["no-preference", "reduce"]) {
  const ctx = await navigateur.newContext({ reducedMotion: mode, viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const console_ = []
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") console_.push(`${m.type()}: ${m.text().slice(0, 200)}`)
  })
  page.on("pageerror", (e) => console_.push(`pageerror: ${String(e).slice(0, 200)}`))

  await page.goto(URL, { waitUntil: "load" })

  const releve = await page.evaluate(
    ([sel, duree]) =>
      new Promise((res) => {
        const el = document.querySelector(sel)
        if (!el) return res({ erreur: `introuvable: ${sel}` })
        const opacites = []
        const transforms = []
        const t0 = performance.now()
        const tick = () => {
          const s = getComputedStyle(el)
          opacites.push(s.opacity)
          transforms.push(s.transform)
          if (performance.now() - t0 < duree) requestAnimationFrame(tick)
          else res({ opacites, transforms, echantillons: opacites.length })
        }
        requestAnimationFrame(tick)
      }),
    [CIBLE, DUREE],
  )

  if (releve.erreur) {
    console.log(`\n=== ${mode} === ${releve.erreur}`)
  } else {
    const distinctes = [...new Set(releve.opacites)]
    console.log(`\n=== ${mode} ===`)
    console.log(`échantillons : ${releve.echantillons}`)
    console.log(`opacité : ${releve.opacites[0]} → ${releve.opacites.at(-1)}   (${distinctes.length} valeurs distinctes)`)
    console.log(`transform : ${releve.transforms[0]} … ${releve.transforms.at(-1)}`)
  }
  /* Second relevé : une révélation au SCROLL (`whileInView`), qui est le
     motif des 12 autres sites. Le premier relevé ne couvre que la plaque,
     seule révélation à jouer au chargement. */
  const scroll = await page.evaluate(
    ([sel]) =>
      new Promise((res) => {
        const el = document.querySelector(sel)
        if (!el) return res({ erreur: `introuvable: ${sel}` })
        el.scrollIntoView({ behavior: "instant", block: "center" })
        const opacites = []
        const t0 = performance.now()
        const tick = () => {
          opacites.push(getComputedStyle(el).opacity)
          if (performance.now() - t0 < 1200) requestAnimationFrame(tick)
          else res({ opacites, echantillons: opacites.length })
        }
        requestAnimationFrame(tick)
      }),
    [".nomen-feuille"],
  )
  if (scroll.erreur) console.log(`scroll : ${scroll.erreur}`)
  else {
    const d = [...new Set(scroll.opacites)]
    console.log(
      `scroll (.nomen-feuille) : ${scroll.opacites[0]} → ${scroll.opacites.at(-1)}   (${d.length} valeurs distinctes sur ${scroll.echantillons} échantillons)`,
    )
  }

  console.log(`console : ${console_.length ? console_.join("\n          ") : "(vide)"}`)

  await ctx.close()
}

await navigateur.close()
