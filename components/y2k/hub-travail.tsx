"use client"

import { useState } from "react"
import Link from "next/link"
import { t, type Lang } from "@/components/proto/dict"
import { employeurs } from "@/components/proto/parcours"

/* ==================================================================
   LE HUB /work (#36) — la partition TRAVAIL du bureau Y2K.

   Six sections dans l'ordre gravé au #20 : en-tête, expérience,
   télémétrie EN VITRINE (jamais fondue dans Reach-Up), méthode,
   spécifications, contact. Le CONTENU vient des feuilles existantes
   (dict.ts, parcours.ts) repris tels quels — ce fichier ne fait que le
   mettre en fenêtres.

   L'ACCENT PAR EXPÉRIENCE (décision du 2026-08-26) vit ici : une
   couleur par employeur, posée en variable CSS sur la carte — le CSS
   ne connaît que `--acc`.
   ================================================================== */

/* Chaque accent vient avec SA couleur d'écriture (revue #36 : blanc sur
   glacé = 1,7:1) : encre sombre sur les accents clairs, blanc sur les
   sombres — le CSS ne connaît que --acc / --acc-txt. */
type Accent = { c: string; txt: string }
const ENCRE = "#241f3d"
const ACCENTS: Record<string, Accent> = {
  upyourbizz: { c: "#ff3ea5", txt: ENCRE },       // le rose DesignMart — le poste courant est le chaud
  "sophia-genetics": { c: "#8fd0ff", txt: ENCRE }, // le bleu glacé Lightforce — données, santé
  "the-guill-corp": { c: "#4a63e8", txt: "#fff" }, // le cobalt Nokia — aviation
  legrand: { c: "#f2a63b", txt: ENCRE },           // l'ambre atelier — l'industrie
}
const accVars = (a: Accent) => ({ "--acc": a.c, "--acc-txt": a.txt }) as React.CSSProperties

/* Le palier (0|1|2) décide de la hauteur du curseur ET de sa teinte :
   plus la voie coûte, plus elle chauffe — la seule rose est la facture. */
const PALIERS = [
  { h: 30, tint: "#8fd0ff" },
  { h: 62, tint: "#a06bff" },
  { h: 94, tint: "#ff3ea5" },
]

export default function HubTravail() {
  const [lang, setLang] = useState<Lang>("fr")
  const xps = employeurs(lang)
  const voies = t(lang, "telVoies")
  const tiers = t(lang, "telTiers")
  const why = t(lang, "telWhy")
  const cols = t(lang, "telCols")
  const nodes = t(lang, "nodes")
  const pool = t(lang, "pool")
  const groupes = t(lang, "specGroupes")
  const liens = t(lang, "ctLiens")

  /* les faux boutons de fenêtre : du chrome, pas des commandes */
  const boutons = (
    <span className="boutons" aria-hidden="true">
      <i>_</i>
      <i>□</i>
      <i>✕</i>
    </span>
  )

  return (
    <main lang={lang} className="y2k">
      <header className="y2k-barre">
        <span className="y2k-barre-os">{t(lang, "hubOs")}</span>
        <span className="y2k-barre-fichier">{t(lang, "hubTravailSys")}</span>
        <span className="y2k-barre-espace" />
        <span className="y2k-langues" role="group" aria-label="FR / EN">
          {(["fr", "en"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </span>
        <Link href="/" className="y2k-ejecter">
          {t(lang, "hubEjecter")}
        </Link>
      </header>

      {/* — le POST : identité système — */}
      <section className="y2k-tete">
        <p className="y2k-boot">
          {t(lang, "hubOs")} — {t(lang, "hubBoot")}
        </p>
        <h1 className="y2k-wordmark" data-texte={t(lang, "gt86Travail")}>
          {t(lang, "gt86Travail")}
        </h1>
        <p className="y2k-identite">
          <strong>{t(lang, "gt86Nom")}</strong> — {t(lang, "role")}
        </p>
        <span className="y2k-statut-chip">{t(lang, "status")}</span>
        <dl className="y2k-bios">
          {/* `spec` porte déjà la paire « En service » — pas de ligne stamp
              en plus, elle doublonnait au readout */}
          {t(lang, "spec").map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="y2k-marquee" aria-hidden="true">
        <span>{t(lang, "hubMarquee")}</span>
      </div>

      <div className="y2k-colonne">
        {/* — EXPERIENCE.EXE — */}
        <section className="y2k-fen" aria-labelledby="y2k-xp">
          <div className="y2k-fen-titre">
            <span className="pastille" aria-hidden="true" />
            {t(lang, "hubFenXp")}
            {boutons}
          </div>
          <div className="y2k-fen-corps">
            <h2 id="y2k-xp">{t(lang, "xpTitle")}</h2>
            <p className="y2k-note">{t(lang, "xpNote")}</p>
            <div className="y2k-xp-grille">
              {xps.map((e) => (
                <article key={e.slug} className="y2k-xp" style={accVars(ACCENTS[e.slug])}>
                  <div className="y2k-xp-tete">
                    <h3>{e.nom}</h3>
                    <div className="y2k-xp-meta">
                      <span>{e.fonction}</span>
                      {e.lieu && <span>{e.lieu}</span>}
                      <span>{e.periode}</span>
                      {e.courant && <span className="y2k-xp-encours">{t(lang, "xpEnCours")}</span>}
                    </div>
                  </div>
                  <div className="y2k-xp-corps">
                    <p className="y2k-xp-resume">{e.resume}</p>
                    {e.produits.map((p) => (
                      <div key={p.code} className="y2k-produit">
                        <b>{p.nom}</b> — {p.texte}
                        {p.aConfirmer && <span className="y2k-aconf">{t(lang, "hubAConfirmer")}</span>}
                        {p.fiche && <br />}
                        {p.fiche && <Link href={`/work/${p.fiche}`}>{t(lang, "xpFiche")} ▸</Link>}
                      </div>
                    ))}
                    <div className="y2k-xp-parc">
                      {e.parc.map((o) => (
                        <span key={o}>{o}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="y2k-fen-etat">
            <span>
              {xps.length} {t(lang, "hubObjets")}
            </span>
            <span>{t(lang, "hubTravailSys")}</span>
          </div>
        </section>

        {/* — TELEMETRIE.EXE : les voies en égaliseur — */}
        <section className="y2k-fen" aria-labelledby="y2k-tel">
          <div className="y2k-fen-titre" style={accVars({ c: "#8a4fe8", txt: "#fff" })}>
            <span className="pastille" aria-hidden="true" />
            {t(lang, "hubFenTel")}
            {boutons}
          </div>
          <div className="y2k-fen-corps">
            <h2 id="y2k-tel">{t(lang, "telTitle")}</h2>
            <p className="y2k-note">{t(lang, "telNote")}</p>
            {/* l'égaliseur est une ILLUSTRATION du tableau qui suit — il est
                soustrait aux lecteurs d'écran, le tableau porte tout ; le
                défileur l'empêche de dicter sa largeur à toute la colonne
                (revue #36 : min-content 444px → page à 520px sur mobile) */}
            <div className="y2k-defile-x">
            <div className="y2k-eq" aria-hidden="true">
              {voies.map(([num, nom, , palier]) => {
                const p = PALIERS[Number(palier)]
                return (
                  <div key={num} className="y2k-eq-voie">
                    <div className="y2k-eq-piste">
                      <i
                        className="y2k-eq-niveau"
                        style={{ height: `${p.h}%`, "--tint": p.tint } as React.CSSProperties}
                      />
                      <i className="y2k-eq-curseur" style={{ bottom: `${p.h}%` }} />
                    </div>
                    <div className="y2k-eq-num">{num}</div>
                    <div className="y2k-eq-nom">{nom}</div>
                  </div>
                )
              })}
            </div>
            </div>
            <div className="y2k-eq-legende" aria-hidden="true">
              {tiers.map(([nom, classe], i) => (
                <span key={nom}>
                  <i style={{ "--tint": PALIERS[i].tint } as React.CSSProperties} />
                  {nom} · {classe}
                </span>
              ))}
            </div>
            <p className="y2k-tel-lecture">{t(lang, "telRead")}</p>
            <div className="y2k-defile-x">
              <table className="y2k-tel-table">
                <thead>
                  <tr>
                    {cols.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {voies.map(([num, nom, precision, palier], i) => (
                    <tr key={num}>
                      <td>{num}</td>
                      <td>
                        {nom} — {precision}
                      </td>
                      <td>
                        <span
                          className="y2k-palier"
                          style={{ "--tint": PALIERS[Number(palier)].tint } as React.CSSProperties}
                        >
                          <i aria-hidden="true" />
                          {tiers[Number(palier)][0]}
                        </span>
                      </td>
                      <td>{why[i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="y2k-fen-etat">
            <span>
              {voies.length} {t(lang, "hubObjets")}
            </span>
            <span>{t(lang, "hubTelSource")}</span>
          </div>
        </section>

        {/* — METHODE.EXE : l'assistant en six étapes — */}
        <section className="y2k-fen" aria-labelledby="y2k-methode">
          <div className="y2k-fen-titre" style={accVars({ c: "#8fd0ff", txt: ENCRE })}>
            <span className="pastille" aria-hidden="true" />
            {t(lang, "hubFenMethode")}
            {boutons}
          </div>
          <div className="y2k-fen-corps">
            <h2 id="y2k-methode">{t(lang, "traceTitle")}</h2>
            <p className="y2k-note">{t(lang, "traceNote")}</p>
            <div className="y2k-jauge" aria-hidden="true">
              {nodes.map(([num]) => (
                <i key={num} />
              ))}
            </div>
            <ol className="y2k-etapes" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {nodes.map(([num, nom, dit]) => (
                <li key={num} className="y2k-etape">
                  <span className="num">{num}</span>
                  <span className="nom">{nom}</span>
                  <span className="dit">{dit}</span>
                  {/* le banc s'accroche à MESURER : c'est l'étape outillée */}
                  {num === "04" && (
                    <p className="y2k-banc" style={{ gridColumn: "1 / -1", margin: "6px 0 0" }}>
                      {/* l'espace texte entre <b> et les chips est une VRAIE
                          opportunité de césure — sans lui, la ligne entière
                          est insécable et déborde à 320px (revue #36) */}
                      <b>{pool[0]}</b>{" "}
                      <span className="chips">
                        {t(lang, "poolChips").map((c) => (
                          <span key={c}>{c}</span>
                        ))}
                      </span>
                      <br />
                      {pool[1]}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
          <div className="y2k-fen-etat">
            <span>
              {nodes.length} {t(lang, "hubObjets")}
            </span>
            <span>{t(lang, "poolMark")}</span>
          </div>
        </section>

        {/* — SPECS.SYS : le gestionnaire de périphériques — */}
        <section className="y2k-fen" aria-labelledby="y2k-spec">
          <div className="y2k-fen-titre" style={accVars({ c: "#4a63e8", txt: "#fff" })}>
            <span className="pastille" aria-hidden="true" />
            {t(lang, "hubFenSpec")}
            {boutons}
          </div>
          <div className="y2k-fen-corps">
            <h2 id="y2k-spec">{t(lang, "specTitle")}</h2>
            <p className="y2k-note">{t(lang, "specNote")}</p>
            <div className="y2k-arbre">
              {groupes.map(([nom, lignes]) => (
                <div key={nom as string} className="y2k-groupe">
                  <h3>{nom}</h3>
                  {(lignes as readonly (readonly [string, string])[]).map(([des, classe]) => (
                    <div key={des} className="y2k-ligne">
                      <span>{des}</span>
                      <span className="fil" aria-hidden="true" />
                      {classe && <span className="classe">{classe}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="y2k-fen-etat">
            <span>
              {groupes.length} {t(lang, "hubObjets")}
            </span>
            <span>{t(lang, "specCols")[1]}</span>
          </div>
        </section>

        {/* — CONTACT.DLL : la boîte de dialogue — */}
        <section className="y2k-fen y2k-dlg" aria-labelledby="y2k-contact">
          <div className="y2k-fen-titre">
            <span className="pastille" aria-hidden="true" />
            {t(lang, "hubFenContact")}
            {boutons}
          </div>
          <div className="y2k-dlg-corps">
            <span className="y2k-dlg-icone" aria-hidden="true">
              ✉
            </span>
            <div>
              <h2 id="y2k-contact" style={{ position: "absolute", left: -9999 }}>
                {t(lang, "ctTitle")}
              </h2>
              <p className="y2k-dlg-texte">{t(lang, "ctAccroche")}</p>
            </div>
          </div>
          <div className="y2k-dlg-boutons">
            {liens.map(([role, val, url]) => (
              <a key={url} href={url} target={url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                <span className="role">{role}</span>
                <span className="val">{val}</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <footer className="y2k-pied">
        <span>{t(lang, "hubStatut")}</span>
        <span>{t(lang, "hubOs")}</span>
      </footer>
    </main>
  )
}
