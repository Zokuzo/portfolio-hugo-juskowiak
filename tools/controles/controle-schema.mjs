/* Contrôle géométrique du schéma calculé — ticket 10.
   Ce script échoue si la géométrie casse. Une capture qui « a l'air
   bien » n'est pas une preuve ; celui-ci en est une.

   node tools/controles/controle-schema.mjs [url] [tolerance] [ecartMin]

   L'URL par défaut date de la page d'essai du ticket 10, qui n'existe
   plus dans app/ : passer l'URL d'une page qui REND le schéma —
   en pratique http://localhost:3210/work/eternal.
   CHROME=<chemin d'un Chrome/Chromium> pour un autre binaire.
*/
/* playwright-core est une devDependency du dépôt (il ne télécharge
   aucun navigateur) : l'import se résout depuis node_modules, plus
   depuis le node_modules d'un autre projet. */
import { chromium } from "playwright-core"
import { existsSync, mkdirSync } from "node:fs"

const CIBLE = process.argv[2] ?? "http://localhost:3000/controle-schema"
const TOL = Number(process.argv[3] ?? 0.02) // unités de dessin
const ECART_MIN = Number(process.argv[4] ?? 3) // unités de dessin entre deux textes
const SORTIE = new globalThis.URL(".", import.meta.url).pathname + "sortie"
mkdirSync(SORTIE, { recursive: true })

/* Même règle que controle-reduce.mjs : le navigateur vient de CHROME
   ou du cache ms-playwright, et l'absence échoue avec la marche à
   suivre. */
const CHROME = process.env.CHROME ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`
if (!existsSync(CHROME)) {
  console.error(`Chrome introuvable (${CHROME}) — passe CHROME=<chemin du binaire>.`)
  process.exit(2)
}

const nav = await chromium.launch({
  executablePath: CHROME,
})
const page = await nav.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 2 })
await page.goto(CIBLE, { waitUntil: "networkidle" })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)

const rapport = await page.evaluate(
  ({ TOL, ECART_MIN }) => {
    /* On lit la géométrie RENDUE, jamais ce que le composant prétend
       avoir calculé : les attributs du <rect> et le `d` du <path> tels
       que le navigateur les a compris. Un data-* recopié ne prouverait
       que la cohérence du composant avec lui-même. */
    const rc = (el) => ({
      x: el.x.baseVal.value,
      y: el.y.baseVal.value,
      l: el.width.baseVal.value,
      h: el.height.baseVal.value,
    })
    // distance signée d'un point au BORD d'un rectangle (0 = pile sur le bord)
    const auBord = (p, r) => {
      const dx = Math.max(r.x - p.x, p.x - (r.x + r.l))
      const dy = Math.max(r.y - p.y, p.y - (r.y + r.h))
      const dehors = Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
      const dedans = Math.min(Math.max(dx, dy), 0)
      return Math.abs(dehors + dedans)
    }
    // premier et dernier point d'un "M x y L x y"
    const bouts = (d) => {
      const v = d.match(/-?\d+(\.\d+)?/g).map(Number)
      return [
        { x: v[0], y: v[1] },
        { x: v[v.length - 2], y: v[v.length - 1] },
      ]
    }
    const inter = (a, b, m) =>
      a.x - m < b.x + b.l + m && b.x - m < a.x + a.l + m && a.y - m < b.y + b.h + m && b.y - m < a.y + a.h + m

    const res = { police: {}, metrique: [], fleches: [], branches: [], textes: [], viewBox: [], css: [], svgs: 0 }

    for (const svg of document.querySelectorAll("svg[class$='-svg']")) {
      res.svgs++
      const nom = svg.closest("[id]")?.id ?? "?"
      const vb = svg.viewBox.baseVal
      res.viewBoxes = res.viewBoxes ?? {}
      res.viewBoxes[nom] = svg.getAttribute("viewBox")
      res.noeudsDom = (res.noeudsDom ?? 0) + svg.querySelectorAll("*").length
      const boites = new Map(
        [...svg.querySelectorAll("[data-boite]")].map((g) => [g.dataset.boite, rc(g.querySelector("rect"))]),
      )

      /* 1 — police réellement employée et métriques mesurées */
      const t0 = svg.querySelector("text")
      const cs = getComputedStyle(t0)
      res.police[nom] = { famille: cs.fontFamily, taille: cs.fontSize, tracking: cs.letterSpacing }
      for (const t of svg.querySelectorAll("text")) {
        const b = t.getBBox()
        const px = parseFloat(getComputedStyle(t).fontSize)
        res.metrique.push({
          n: t.textContent.length,
          avance: b.width / t.textContent.length / px,
          montee: (t.y.baseVal[0].value - b.y) / px,
          hauteur: b.height / px,
        })
      }

      /* 2 — ACCROCHAGE : chaque extrémité de flèche touche le bord de sa boîte */
      for (const g of svg.querySelectorAll("[data-de]")) {
        const a = boites.get(g.dataset.de)
        const b = boites.get(g.dataset.vers)
        const [d, r] = bouts(g.querySelector("path").getAttribute("d"))
        // la pointe rendue : sommet du triangle, premier point du path de tête
        const sommet = bouts(g.querySelector("path:nth-of-type(2)").getAttribute("d"))[0]
        res.fleches.push({
          svg: nom,
          lien: `${g.dataset.de}→${g.dataset.vers}`,
          departAuBord: auBord(d, a),
          arriveeAuBord: auBord(r, b),
          sommetAuBord: auBord(sommet, b),
          // un accrochage au centre (le défaut d'AnimatedBeam) se verrait ici
          departAuCentre: Math.hypot(d.x - (a.x + a.l / 2), d.y - (a.y + a.h / 2)) < 0.5,
          arriveeDansLaBoite:
            r.x > b.x + 0.5 && r.x < b.x + b.l - 0.5 && r.y > b.y + 0.5 && r.y < b.y + b.h - 0.5,
        })
      }

      /* 3 — EMBRANCHEMENTS : bord de boîte d'un côté, tronc de l'autre */
      const bus = svg.querySelector("line[class$='-bus']")
      for (const g of svg.querySelectorAll("[data-branche]")) {
        const r = boites.get(g.dataset.branche)
        const [p1, p2] = bouts(g.querySelector("path").getAttribute("d"))
        const surBus = (p) => Math.abs(p.y - bus.y1.baseVal.value)
        res.branches.push({
          svg: nom,
          noeud: `${g.dataset.branche}/${g.dataset.sens}`,
          auBord: g.dataset.sens === "entree" ? auBord(p1, r) : auBord(p2, r),
          surTronc: g.dataset.sens === "entree" ? surBus(p2) : surBus(p1),
          dansLeTronc:
            Math.min(bus.x1.baseVal.value, bus.x2.baseVal.value) - TOL <= p1.x &&
            p1.x <= Math.max(bus.x1.baseVal.value, bus.x2.baseVal.value) + TOL,
        })
      }

      /* 4 — TEXTES. Deux règles, parce que ce ne sont pas les mêmes
         objets : DEUX LIGNES D'UN MÊME BLOC sont un paragraphe, elles
         ont seulement interdiction de se recouvrir ; DEUX LIBELLÉS
         INDÉPENDANTS doivent en plus garder ECART_MIN d'air, sans quoi
         ils se lisent comme un seul mot. */
      const txt = [...svg.querySelectorAll("text")].map((t) => ({
        t,
        b: t.getBBox(),
        s: t.textContent,
        bloc: t.parentElement,
      }))
      let pireEcart = Infinity
      for (let i = 0; i < txt.length; i++) {
        for (let j = i + 1; j < txt.length; j++) {
          const a = txt[i].b
          const b = txt[j].b
          const ra = { x: a.x, y: a.y, l: a.width, h: a.height }
          const rb = { x: b.x, y: b.y, l: b.width, h: b.height }
          const memeBloc = txt[i].bloc === txt[j].bloc
          const exige = memeBloc ? 0 : ECART_MIN / 2
          if (inter(ra, rb, exige)) {
            res.textes.push({ svg: nom, a: txt[i].s, b: txt[j].s, memeBloc, chevauche: inter(ra, rb, 0) })
          }
          const gx = Math.max(ra.x - (rb.x + rb.l), rb.x - (ra.x + ra.l))
          const gy = Math.max(ra.y - (rb.y + rb.h), rb.y - (ra.y + ra.h))
          const ecart = Math.max(gx, gy)
          if (memeBloc) res.ecartMinBloc = Math.min(res.ecartMinBloc ?? Infinity, ecart)
          else pireEcart = Math.min(pireEcart, ecart)
        }
      }
      res.ecartMinTexte = Math.min(res.ecartMinTexte ?? Infinity, pireEcart)

      for (const g of svg.querySelectorAll("[data-boite]")) {
        const r = rc(g.querySelector("rect"))
        for (const t of g.querySelectorAll("text")) {
          const b = t.getBBox()
          const deborde = b.x < r.x || b.y < r.y || b.x + b.width > r.x + r.l || b.y + b.height > r.y + r.h
          if (deborde)
            res.textes.push({
              svg: nom,
              debordement: t.textContent,
              marge: {
                g: b.x - r.x,
                d: r.x + r.l - (b.x + b.width),
                h: b.y - r.y,
                b: r.y + r.h - (b.y + b.height),
              },
            })
        }
      }

      /* 5 — VIEWBOX : rien n'est coupé */
      for (const el of svg.querySelectorAll("rect,line,path,text")) {
        const b = el.getBBox()
        const dehors =
          b.x < vb.x - 0.01 || b.y < vb.y - 0.01 || b.x + b.width > vb.x + vb.width + 0.01 || b.y + b.height > vb.y + vb.height + 0.01
        if (dehors) res.viewBox.push({ svg: nom, el: el.tagName, cls: el.getAttribute("class"), b: [b.x, b.y, b.width, b.height] })
      }
    }

    /* 6 — PIÈGE MAISON : aucune règle .<prefixe>-* ne déclare width/height/x/y/r
       (la racine <svg> exceptée : c'est un élément HTML remplacé) */
    const interdits = ["width", "height", "x", "y", "r"]
    for (const f of document.styleSheets) {
      let regles
      try {
        regles = f.cssRules
      } catch {
        continue
      }
      for (const re of regles) {
        if (!re.selectorText || !/\.(etn)-/.test(re.selectorText)) continue
        if (/-svg\b/.test(re.selectorText)) continue
        for (const p of interdits) if (re.style.getPropertyValue(p)) res.css.push(`${re.selectorText} { ${p} }`)
      }
    }
    return res
  },
  { TOL, ECART_MIN },
)

/* --- verdict --- */
const max = (a, k) => a.reduce((m, x) => Math.max(m, x[k]), 0)
const ecarts = {
  "flèche · départ sur le bord": max(rapport.fleches, "departAuBord"),
  "flèche · arrivée sur le bord": max(rapport.fleches, "arriveeAuBord"),
  "flèche · pointe sur le bord": max(rapport.fleches, "sommetAuBord"),
  "embranchement · bord de boîte": max(rapport.branches, "auBord"),
  "embranchement · sur le tronc": max(rapport.branches, "surTronc"),
}
const met = rapport.metrique
const moy = (k) => met.reduce((s, m) => s + m[k], 0) / met.length
const metrique = {
  echantillons: met.length,
  avance: { moy: moy("avance"), min: Math.min(...met.map((m) => m.avance)), max: Math.max(...met.map((m) => m.avance)) },
  montee: { moy: moy("montee"), max: Math.max(...met.map((m) => m.montee)) },
  hauteur: { moy: moy("hauteur"), max: Math.max(...met.map((m) => m.hauteur)) },
}

const echecs = []
for (const [k, v] of Object.entries(ecarts)) if (v > TOL) echecs.push(`${k} : ${v.toFixed(4)} u > ${TOL} u`)
if (rapport.branches.some((b) => !b.dansLeTronc)) echecs.push("un embranchement tombe hors du tronc")
if (rapport.fleches.some((f) => f.departAuCentre)) echecs.push("une flèche part d'un centre au lieu d'un bord")
if (rapport.fleches.some((f) => f.arriveeDansLaBoite)) echecs.push("une pointe de flèche flotte dans sa boîte")
if (rapport.textes.length) echecs.push(`${rapport.textes.length} conflit(s) de texte`)
if (rapport.viewBox.length) echecs.push(`${rapport.viewBox.length} élément(s) hors viewBox`)
if (rapport.css.length) echecs.push(`règle CSS interdite : ${rapport.css.join(", ")}`)
if (!/JetBrains/i.test(Object.values(rapport.police)[0]?.famille ?? "")) echecs.push("la police mono n'est pas chargée")

console.log(
  JSON.stringify(
    {
      url: CIBLE,
      tolerance: TOL,
      ecartMinTexteExige: ECART_MIN,
      svgs: rapport.svgs,
      viewBoxes: rapport.viewBoxes,
      noeudsDomParSchema: rapport.noeudsDom / rapport.svgs,
      police: rapport.police,
      metrique,
      ecarts,
      ecartMinEntreLibelles: rapport.ecartMinTexte,
      ecartMinDansUnBloc: rapport.ecartMinBloc,
      conflits: rapport.textes,
      horsViewBox: rapport.viewBox,
      cssInterdit: rapport.css,
      fleches: rapport.fleches,
      branches: rapport.branches,
      echecs,
    },
    null,
    2,
  ),
)

await page.locator("#fr svg").screenshot({ path: `${SORTIE}/eternal-fr.png` })
await page.locator("#en svg").screenshot({ path: `${SORTIE}/eternal-en.png` })
await nav.close()

if (echecs.length) {
  console.error("\nÉCHEC :\n" + echecs.map((e) => " - " + e).join("\n"))
  process.exit(1)
}
console.error("\nOK — géométrie conforme.")
