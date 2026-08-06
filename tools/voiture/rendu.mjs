/* ==================================================================
   GÉNÉRATEUR DE LA SÉQUENCE — NB WebP à fond transparent. NB vient de
   --nb (60 par défaut) ; la séquence en production en compte 120
   (`ls public/voiture/*.webp | wc -l` → 120).

   Chaîne : Chrome headless rend la scène three.js (scene.html) en
   2000×2000 avec alpha → recadrage/réduction à 1000×1000 dans la page
   → ImageMagick OU ffmpeg encode en WebP lossy avec alpha. L'encodeur
   n'est pas imposé, il est SONDÉ (voir plus bas) : ImageMagick sur la
   machine Linux, ffmpeg sous Windows s'il est installé.

   AUCUNE DÉPENDANCE npm. Chrome et l'encodeur (ffmpeg OU ImageMagick)
   sont déjà sur la machine, et Node 22 embarque un client WebSocket : le
   pilotage se fait donc en CDP à la main plutôt qu'en installant
   Playwright pour trois appels.

   Usage :
     node tools/voiture/rendu.mjs <modele.glb> [--cle=valeur ...]
     node tools/voiture/rendu.mjs <modele.glb> --materiaux   (introspection)

   Options utiles : --carrosserie=0b0e14 --mats=body,paint --elevation=13
                    --depart=0 --env=1 --poids=60000 --sortie=1000
   ================================================================== */

import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { readFile, writeFile, mkdir, rm, readdir } from "node:fs/promises"
import { existsSync, readdirSync } from "node:fs"
import { execFile } from "node:child_process"
import { tmpdir, homedir } from "node:os"
import { promisify } from "node:util"
import path from "node:path"

const pexec = promisify(execFile)
const ICI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))
const RACINE = path.resolve(ICI, "../..")

const args = process.argv.slice(2)
const MODELE = args.find((a) => !a.startsWith("--"))
const opt = Object.fromEntries(
  args.filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.slice(2).split("=")
    return [k, v === undefined ? "1" : v]
  })
)
if (!MODELE && !opt.depuis) {
  console.error("usage: node tools/voiture/rendu.mjs <modele.glb> [--options]")
  console.error("       node tools/voiture/rendu.mjs --depuis=<dossier-png>   (réencoder sans recalculer)")
  process.exit(1)
}

const NB     = +(opt.nb ?? 60)
const SORTIE = +(opt.sortie ?? 1000)
const POIDS  = +(opt.poids ?? 60000)          // plafond par image, en octets
const DEST   = path.resolve(RACINE, opt.dest ?? "public/voiture")
const CHROME = opt.chrome ?? trouveChrome()

/* Le dépôt sert DEUX machines : Hugo rend sous Windows, la machine de mesure
   est sous Linux. Une liste de chemins Windows y échouait sans autre recours
   que --chrome à la main. Le chromium du cache Playwright fait un troisième
   candidat — il est déjà installé pour les bancs de mesure et sait faire du
   WebGL2 en SwiftShader ; son numéro de build change à chaque mise à jour de
   Playwright, on le CHERCHE donc au lieu de l'écrire en dur. En tête de liste :
   un vrai Chrome, s'il y en a un, reste le rendu de référence. */
function trouveChrome() {
  const win = process.platform === "win32"
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH ??
    path.join(homedir(), win ? "AppData/Local/ms-playwright" : ".cache/ms-playwright")
  const playwright = (existsSync(cache) ? readdirSync(cache) : [])
    .filter((d) => d.startsWith("chromium-"))
    .sort((a, b) => +b.slice(9) - +a.slice(9))          // build le plus récent d'abord
    .map((d) => path.join(cache, d, ...(win ? ["chrome-win", "chrome.exe"] : ["chrome-linux64", "chrome"])))
  const pistes = [
    process.env.CHROME_PATH,
    ...(win
      ? ["C:/Program Files/Google/Chrome/Application/chrome.exe",
         "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"]
      : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/opt/google/chrome/chrome"]),
    ...playwright,
    /* Les chromium de la distribution passent APRÈS le cache Playwright, et
       seulement sous Linux : sur Ubuntu ces trois chemins sont des shims snap,
       confinés, dont rien ne dit qu'ils savent écrire le --user-data-dir qu'on
       pose dans tmpdir(). NON VÉRIFIÉ — aucun snap sur la machine de mesure.
       Le binaire Playwright, lui, n'est pas confiné et sert déjà aux bancs :
       en cas de doute c'est lui qu'on veut. Symptôme si un shim snap gagnait
       quand même : « délai dépassé : démarrage de Chrome » au bout de 30 s ;
       contournement : --chrome=<chemin>. */
    ...(win ? [] : ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium"]),
  ].filter(Boolean)
  const t = pistes.find((p) => existsSync(p))
  if (!t) throw new Error("Chrome introuvable — passer --chrome=<chemin>")
  return t
}

/* ── encodeur WebP ────────────────────────────────────────────────
   ffmpeg n'est pas installé partout, et celui qu'embarque Playwright est
   compilé SANS libwebp (son `-encoders` ne liste que png et libvpx) : sur la
   machine Linux il ne reste qu'ImageMagick, et un apt install demanderait un
   sudo qu'on n'a pas. On prend donc celui qui répond plutôt que d'en imposer un.

   MAIS LES DEUX BRANCHES NE SONT PAS INTERCHANGEABLES À L'OCTET :
   — magick ≡ sharp : même fichier, md5 identiques aux qualités 60/75/80/85/95.
     Mesuré. Et remarquable, parce que les deux enveloppent des libwebp
     DIFFÉRENTES (magick 1.5.0, sharp 1.6.0) — la cause de cette identité
     n'est pas connue, elle n'est pas « la même libwebp ».
   — magick contre ffmpeg : NON VÉRIFIÉ. Aucun ffmpeg avec libwebp n'est
     joignable sur la machine de mesure (celui de Playwright n'a que png et
     libvpx). Et c'est douteux par construction : la branche ffmpeg impose
     -pix_fmt yuva420p, donc swscale convertit RGB→YUV 4:2:0 AVANT libwebp,
     là où magick passe du RGBA que libwebp convertit lui-même. Deux
     conversions chroma différentes ne peuvent pas donner le même bitstream.
   Conséquence pratique : un rendu sous Windows (ffmpeg) et un rendu sous
   Linux (magick) ne produiront vraisemblablement PAS les mêmes fichiers.
   Si deux séquences doivent être comparables, forcer --encodeur=magick des
   deux côtés. */
let ENCODEUR = null

async function trouveEncodeur() {
  const sondes = [
    ["ffmpeg", ["-hide_banner", "-encoders"], /libwebp/],
    ["magick", ["-list", "format"], /^\s*WEBP\*?\s+WEBP\s+rw/m],
  ]
  for (const [bin, args, marque] of sondes) {
    /* --encodeur choisit la branche mais NE COURT-CIRCUITE PAS la sonde. Ce
       drapeau est précisément ce que le message d'erreur ci-dessous recommande :
       le prendre au mot sans vérifier ferait découvrir le binaire absent APRÈS
       les quarante minutes de rendu, sur un dossier de destination vide. */
    if (opt.encodeur && opt.encodeur !== bin) continue
    try { if (marque.test((await pexec(bin, args)).stdout)) return bin } catch {}
  }
  throw new Error((opt.encodeur ? `--encodeur=${opt.encodeur} : ` : "") +
    "aucun encodeur WebP avec alpha — installer ffmpeg compilé avec libwebp ou ImageMagick, ou passer --encodeur=<ffmpeg|magick>")
}

/* ── serveur statique ────────────────────────────────────────────
   Une page en file:// ne peut pas importer de module ES : il faut une
   vraie origine http. Dix lignes suffisent, on sert scene.html et le
   .glb depuis leurs dossiers respectifs. */
const MIME = {
  ".html": "text/html", ".glb": "model/gltf-binary", ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".ktx2": "image/ktx2",
}
/* On sert la page ET tout le dossier du modèle. Sketchfab livre du glTF
   éclaté — scene.gltf, scene.bin, textures/ — et le loader va chercher
   ces fichiers voisins tout seul : exposer le seul .gltf donnerait une
   voiture sans géométrie ni texture. */
function servir(alias, dossier) {
  return new Promise((res) => {
    const s = createServer(async (req, rep) => {
      const url = decodeURIComponent(req.url.split("?")[0])
      let f = alias[url]
      if (!f && dossier) {
        const p = path.resolve(dossier, "." + url)
        if (p.startsWith(path.resolve(dossier))) f = p   // pas de remontée hors du dossier
      }
      if (!f) { rep.writeHead(404); return rep.end("non") }
      try {
        const buf = await readFile(f)
        rep.writeHead(200, { "content-type": MIME[path.extname(f).toLowerCase()] ?? "application/octet-stream", "access-control-allow-origin": "*" })
        rep.end(buf)
      } catch { rep.writeHead(404); rep.end("non") }
    })
    s.listen(0, "127.0.0.1", () => res(s))
  })
}

/* ── client CDP minimal ──────────────────────────────────────── */
class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.attente = new Map()
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data)
      const p = this.attente.get(m.id)
      if (!p) return
      this.attente.delete(m.id)
      m.error ? p.rej(new Error(m.error.message)) : p.res(m.result)
    })
  }
  envoie(method, params = {}) {
    const id = ++this.id
    return new Promise((res, rej) => { this.attente.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })) })
  }
  async evalue(expr, attendrePromesse = false) {
    const r = await this.envoie("Runtime.evaluate", { expression: expr, awaitPromise: attendrePromesse, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "erreur page")
    return r.result.value
  }
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms))

async function attends(fn, limite, quoi) {
  const fin = Date.now() + limite
  while (Date.now() < fin) { const v = await fn(); if (v) return v; await pause(250) }
  throw new Error("délai dépassé : " + quoi)
}

async function main() {
  /* L'encodeur se cherche AVANT le rendu : découvrir qu'il manque après
     quarante minutes de calcul 3D serait une mauvaise plaisanterie. */
  if (!opt.materiaux) { ENCODEUR = await trouveEncodeur(); console.log("encodeur :", ENCODEUR) }

  // Reprise : les PNG existent déjà, on ne refait que l'encodage.
  if (opt.depuis) return encodeTout(path.resolve(opt.depuis))

  const glb = path.resolve(MODELE)
  if (!existsSync(glb)) throw new Error("modèle introuvable : " + glb)

  const srv = await servir(
    { "/scene.html": path.join(ICI, "scene.html") },
    path.dirname(glb)
  )
  const port = srv.address().port

  const q = new URLSearchParams({ modele: "/" + path.basename(glb), nb: String(NB), sortie: String(SORTIE) })
  for (const k of ["rendu", "fov", "elevation", "depart", "sens", "env", "marge", "carrosserie", "rugosite"]) {
    if (opt[k] !== undefined) q.set(k, opt[k])
  }
  const page = `http://127.0.0.1:${port}/scene.html?${q}`

  /* Port de débogage pris à l'OS, et profil nommé d'après lui. Un port
     fixe interdisait deux rendus en parallèle : le second trouvait le
     port occupé, se rattachait à la page du PREMIER et échouait sans
     rien dire d'utile. On teste souvent plusieurs réglages à la fois,
     ça ne peut pas être un piège. */
  const port0 = await new Promise((res) => {
    const s = createServer()
    s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)) })
  })
  const profil = path.join(tmpdir(), `chrome-rendu-voiture-${port0}`)
  await rm(profil, { recursive: true, force: true })
  const chrome = spawn(CHROME, [
    "--headless=new",
    /* Sans ça, le chromium de Playwright s'ABORTE au démarrage sur les
       distributions qui bloquent les user namespaces non privilégiés
       (« No usable sandbox! », signal 6). On ne rend qu'une page locale
       qu'on écrit nous-mêmes : il n'y a pas de contenu hostile à isoler. */
    "--no-sandbox",
    `--remote-debugging-port=${port0}`,
    `--user-data-dir=${profil}`,
    "--no-first-run", "--no-default-browser-check", "--disable-extensions",
    "--hide-scrollbars", "--mute-audio", "--window-size=2048,2048",
    // WebGL logiciel : garantit un rendu identique quelle que soit la machine
    ...(opt.gpu ? [] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-sandbox"]),
    page,
  ], { stdio: "ignore" })

  let ws
  try {
    const cible = await attends(async () => {
      try {
        const l = await (await fetch(`http://127.0.0.1:${port0}/json/list`)).json()
        return l.find((t) => t.type === "page" && t.webSocketDebuggerUrl)
      } catch { return null }
    }, 30000, "démarrage de Chrome")

    ws = new WebSocket(cible.webSocketDebuggerUrl)
    await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", j) })
    const cdp = new Cdp(ws)
    await cdp.envoie("Runtime.enable")

    await attends(async () => {
      const e = await cdp.evalue("window.erreur ?? null")
      if (e) throw new Error("chargement du modèle : " + e)
      return await cdp.evalue("window.pret === true")
    }, 300000, "chargement du modèle et cadrage")

    if (opt.materiaux) {
      const m = await cdp.evalue("JSON.stringify(window.materiaux)")
      console.log(JSON.parse(m).map((x) => `${x.type.padEnd(24)} mat="${x.mat}"  mesh="${x.mesh}"`).join("\n"))
      return
    }

    const cadre = await cdp.evalue("JSON.stringify(window.cadre)")
    console.log("cadrage commun :", cadre)

    /* Le dossier des PNG intermédiaires est nommé lui aussi d'après le
       port. Il était partagé, et comme on le VIDE au démarrage, lancer
       un second rendu effaçait les images du premier en pleine course.
       Un dossier de travail commun à des processus concurrents, c'est
       une bombe à retardement, pas une optimisation. */
    const brut = path.join(tmpdir(), `voiture-png-${port0}`)
    await rm(brut, { recursive: true, force: true })
    await mkdir(brut, { recursive: true })
    await mkdir(DEST, { recursive: true })

    for (let i = 0; i < NB; i++) {
      const url = await cdp.evalue(`window.rendreFrame(${i})`)
      const png = Buffer.from(url.slice(url.indexOf(",") + 1), "base64")
      await writeFile(path.join(brut, `${String(i).padStart(3, "0")}.png`), png)
      process.stdout.write(`\rrendu ${i + 1}/${NB}`)
    }
    console.log("")

    await encodeTout(brut)
    /* Les PNG ne sont effacés qu'en cas de SUCCÈS — 38 Mo par rendu, ça
       ne peut pas s'accumuler en silence. En cas d'échec on les garde au
       contraire précieusement : c'est la phase longue, et `--depuis`
       permet de reprendre au seul encodage sans refaire le calcul 3D. */
    await rm(brut, { recursive: true, force: true })
  } finally {
    try { ws?.close() } catch {}
    chrome.kill()
    srv.close()
  }
}

/* Encodage. On cherche la qualité la plus haute qui tient sous le
   plafond, par dichotomie et par image : une image de trois-quarts
   montre plus de carrosserie qu'un profil et ne compresse pas pareil.
   Une qualité unique gâcherait les unes ou ferait déborder les autres.

   Séparé du rendu, et accessible seul par --depuis : c'est la phase
   COURTE des deux. Changer le plafond de poids ne doit pas coûter les
   quarante minutes de calcul 3D qu'on vient déjà de payer — et si
   l'encodage est interrompu, les PNG sont toujours là. */
async function encodeTout(brut) {
  await mkdir(DEST, { recursive: true })
  const nom = (i) => String(i).padStart(3, "0")
  const src = (i) => path.join(brut, `${nom(i)}.png`)
  for (let i = 0; i < NB; i++) if (!existsSync(src(i))) throw new Error(`image manquante : ${src(i)}`)

  /* UNE SEULE IMAGE PAIE LA RECHERCHE. La dichotomie sur les 120 lançait
     jusqu'à sept ffmpeg par image : quasiment tout le temps passait à
     démarrer des processus, pas à compresser. Or les 120 vues d'un même
     objet sous le même éclairage compressent presque pareil — on cherche
     donc la qualité une fois, sur une image médiane, et on la réutilise.
     Celles qui débordent quand même redescendent d'un cran, ce qui reste
     rare et coûte un appel de plus. */
  let q = 80
  {
    let bas = 30, haut = 95
    while (bas <= haut) {
      const m = Math.round((bas + haut) / 2)
      if ((await encode(src(Math.floor(NB / 4)), m)).length <= POIDS) { q = m; bas = m + 1 } else { haut = m - 1 }
    }
    console.log(`qualité retenue : ${q}`)
  }

  /* Quatre encodages de front. ffmpeg sur une image de 1000² tient dans
     quelques mégaoctets, donc la mémoire n'est pas le facteur limitant —
     l'attente du processus l'est. */
  const tailles = new Array(NB).fill(0)
  let faits = 0
  const file = [...Array(NB).keys()]
  const ouvrier = async () => {
    for (let i = file.shift(); i !== undefined; i = file.shift()) {
      let qi = q, buf = await encode(src(i), qi)
      while (buf.length > POIDS && qi > 30) { qi = Math.max(30, qi - 8); buf = await encode(src(i), qi) }
      await writeFile(path.join(DEST, `${nom(i)}.webp`), buf)
      tailles[i] = buf.length
      process.stdout.write(`\rencodage ${++faits}/${NB}`)
    }
  }
  await Promise.all(Array.from({ length: 4 }, ouvrier))
  console.log("")

  const total = tailles.reduce((a, b) => a + b, 0)
  const max = Math.max(...tailles)
  console.log(`${NB} images dans ${path.relative(RACINE, DEST)} — ${(total / 1048576).toFixed(2)} Mo, moyenne ${(total / NB / 1024).toFixed(1)} Ko, max ${(max / 1024).toFixed(1)} Ko`)
  if (max > POIDS) console.log(`ATTENTION : ${tailles.filter((t) => t > POIDS).length} image(s) au-dessus du plafond`)
}

async function encode(src, q) {
  const out = src.replace(/\.png$/, `.q${q}.webp`)
  /* Les deux commandes visent le MÊME réglage libwebp : lossy, qualité q,
     méthode 6, canal alpha conservé sans perte (alpha_quality 100, défaut des
     deux côtés). Le -define est nécessaire parce qu'ImageMagick est à
     method=4 par défaut là où ffmpeg reçoit -compression_level 6. */
  await (ENCODEUR === "ffmpeg"
    ? pexec("ffmpeg", ["-y", "-loglevel", "error", "-i", src,
        "-c:v", "libwebp", "-pix_fmt", "yuva420p", "-compression_level", "6",
        "-quality", String(q), out])
    : pexec(ENCODEUR, [src, "-quality", String(q), "-define", "webp:method=6", out]))
  const b = await readFile(out)
  await rm(out, { force: true })
  return b
}

main().catch((e) => { console.error("\n" + e.message); process.exit(1) })
