/* ==================================================================
   CHROME PILOTÉ EN CDP — le socle commun des outils du dépôt.

   AUCUNE DÉPENDANCE npm : Chrome est déjà sur la machine et Node 22
   embarque un client WebSocket. Le pilotage se fait donc en CDP à la
   main plutôt qu'en installant Playwright pour trois appels.

   Ce fichier existe parce que `tools/voiture/rendu.mjs` et
   `tools/banc/frame.mjs` avaient besoin du MÊME savoir : où trouve-t-on
   Chrome sur cette machine-ci. Ce savoir a coûté cher (voir les
   commentaires de `trouveChrome`) et il n'existe qu'ici — deux copies,
   c'est une copie qui pourrit.
   ================================================================== */

import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { existsSync, readdirSync } from "node:fs"
import { rm } from "node:fs/promises"
import { tmpdir, homedir } from "node:os"
import path from "node:path"

/* Le dépôt sert DEUX machines : Hugo rend sous Windows, la machine de mesure
   est sous Linux. Une liste de chemins Windows y échouait sans autre recours
   que --chrome à la main. Le chromium du cache Playwright fait un troisième
   candidat — il est déjà installé pour les bancs de mesure et sait faire du
   WebGL2 en SwiftShader ; son numéro de build change à chaque mise à jour de
   Playwright, on le CHERCHE donc au lieu de l'écrire en dur. En tête de liste :
   un vrai Chrome, s'il y en a un, reste le rendu de référence. */
export function trouveChrome() {
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

export class Cdp {
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

export const pause = (ms) => new Promise((r) => setTimeout(r, ms))

export async function attends(fn, limite, quoi) {
  const fin = Date.now() + limite
  while (Date.now() < fin) { const v = await fn(); if (v) return v; await pause(250) }
  throw new Error("délai dépassé : " + quoi)
}

/* Un port libre est demandé au noyau plutôt qu'écrit en dur : deux mesures
   lancées en même temps ne doivent pas se marcher dessus, et le nom du profil
   temporaire suit le port pour la même raison. */
async function portLibre() {
  return new Promise((res) => {
    const s = createServer()
    s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)) })
  })
}

/**
 * Démarre un Chrome, s'y branche en CDP, rend `{ cdp, ferme }`.
 * `args` s'ajoute aux drapeaux communs ; `url` est la page ouverte au départ.
 */
export async function lanceChrome({ chrome = trouveChrome(), args = [], url = "about:blank", nom = "outil", tete = false } = {}) {
  const port = await portLibre()
  const profil = path.join(tmpdir(), `chrome-${nom}-${port}`)
  await rm(profil, { recursive: true, force: true })
  const proc = spawn(chrome, [
    /* `tete` ouvre une VRAIE fenêtre. C'est la seule façon de mesurer la
       cadence d'un écran : en headless, le compositeur est logiciel et sa
       cadence n'a aucun rapport avec le panneau. Sous Wayland il faut le dire,
       sinon Chrome passe par XWayland et retombe à 60 Hz. */
    ...(tete
      ? (process.env.WAYLAND_DISPLAY ? ["--ozone-platform=wayland"] : [])
      : ["--headless=new"]),
    /* Sans ça, le chromium de Playwright s'ABORTE au démarrage sur les
       distributions qui bloquent les user namespaces non privilégiés
       (« No usable sandbox! », signal 6). On n'ouvre que des pages locales
       qu'on écrit soi-même : il n'y a pas de contenu hostile à isoler. */
    "--no-sandbox",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profil}`,
    "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--mute-audio",
    ...args,
    url,
  ], { stdio: "ignore" })

  const cible = await attends(async () => {
    try {
      const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
      return l.find((t) => t.type === "page" && t.webSocketDebuggerUrl)
    } catch { return null }
  }, 30000, "démarrage de Chrome")

  const ws = new WebSocket(cible.webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", j) })
  const cdp = new Cdp(ws)
  await cdp.envoie("Runtime.enable")

  /* La fermeture ne doit JAMAIS lever : elle tourne dans un `finally`, après
     un rendu qui peut avoir coûté quarante minutes, et perdre le travail sur
     un ménage raté serait absurde. Et on attend la SORTIE du processus avant
     d'effacer le profil : tuer puis effacer aussitôt rend un
     `ENOTEMPTY … /Default` — Chrome écrit encore pendant qu'on supprime. */
  const ferme = async () => {
    try { ws.close() } catch {}
    try {
      if (proc.exitCode === null && proc.signalCode === null) {
        proc.kill()
        await new Promise((r) => { proc.once("exit", r); setTimeout(r, 3000) })
      }
      await rm(profil, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
    } catch { /* un profil temporaire oublié n'est pas un échec */ }
  }
  return { cdp, ferme, port }
}
