"use client"

import { useState } from "react"
import Link from "next/link"
import { t, type Lang } from "@/components/proto/dict"
import { employeurs } from "@/components/proto/parcours"

/* ==================================================================
   HUB « AFFICHE » — l'essai B du gate #36. MÊME CONTENU que le hub
   fenêtres (dict + parcours.ts, repris tels quels), autre mise en
   scène : une pile d'affiches — hero DesignMart, une affiche par
   employeur (atmosphère à SON accent, colonne de lecture façon pub
   Nokia), méthode en grands numéros, specs sur papier millimétré,
   contact au couchant sur sol en grille.

   Si l'essai perd le gate, ce fichier meurt avec sa route ; s'il
   gagne, sa grammaire devient le gabarit fiche (#38).
   ================================================================== */

type Accent = { c: string; txt: string }
const ENCRE = "#241f3d"
const ACCENTS: Record<string, Accent> = {
  upyourbizz: { c: "#ff3ea5", txt: ENCRE },
  "sophia-genetics": { c: "#8fd0ff", txt: ENCRE },
  "the-guill-corp": { c: "#4a63e8", txt: "#fff" },
  legrand: { c: "#f2a63b", txt: ENCRE },
}
const accVars = (a: Accent) => ({ "--acc": a.c, "--acc-txt": a.txt }) as React.CSSProperties

export default function HubAffiche() {
  const [lang, setLang] = useState<Lang>("fr")
  const xps = employeurs(lang)
  const nodes = t(lang, "nodes")
  const pool = t(lang, "pool")
  const groupes = t(lang, "specGroupes")
  const liens = t(lang, "ctLiens")
  /* les étiquettes du hero : la paire « Domaines » du readout, éclatée */
  const domaines = (t(lang, "spec")[4][1] as string).split(" · ")

  return (
    <main lang={lang} className="y2k aff">
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

      {/* — l'affiche d'ouverture : le hero DesignMart — */}
      <section className="aff-poster" aria-labelledby="aff-hero">
        <span className="aff-coin hg">{`${t(lang, "hubOs")}\n${t(lang, "hubBoot")}`}</span>
        <span className="aff-coin hd">{`${t(lang, "gt86Nom")}\n${t(lang, "status")}`}</span>
        <span className="aff-vertical" aria-hidden="true">
          {t(lang, "xpJp")}
        </span>
        <h1 id="aff-hero" className="aff-titre" style={{ textAlign: "center", fontSize: "clamp(44px, 11vw, 150px)" }}>
          {t(lang, "gt86Travail")}
        </h1>
        <p className="aff-sous" style={{ textAlign: "center" }}>
          {t(lang, "gt86Nom")} — {t(lang, "role")}
        </p>
        <div className="aff-tags" style={{ justifyContent: "center" }}>
          {domaines.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <span className="aff-coin bd">
          <span className="aff-chip">
            {t(lang, "hubTravailSys")} <b>01</b>
          </span>
        </span>
      </section>

      {/* — une affiche PAR EMPLOYEUR : l'atmosphère à son accent — */}
      {xps.map((e, i) => (
        <section key={e.slug} className="aff-poster" style={accVars(ACCENTS[e.slug])} aria-labelledby={`aff-${e.slug}`}>
          <span className="aff-coin hg">{`${e.periode}\n${e.lieu ?? ""}`}</span>
          <span className="aff-coin hd">{e.courant ? t(lang, "xpEnCours") : e.fonction}</span>
          <div className="aff-duo">
            <div>
              <h2 id={`aff-${e.slug}`} className="aff-titre">
                {e.nom}
              </h2>
              <p className="aff-sous">{e.fonction}</p>
              <div className="aff-tags">
                {e.parc.map((o) => (
                  <span key={o}>{o}</span>
                ))}
              </div>
            </div>
            <div className="aff-colonne">
              <span className="fonction">
                {e.periode}
                {e.lieu ? ` · ${e.lieu}` : ""}
              </span>
              <p className="resume">{e.resume}</p>
              {e.produits.map((p) => (
                <div key={p.code} className="aff-produit">
                  <b>{p.nom}</b> — {p.texte}
                  {p.aConfirmer && <span className="aff-aconf">{t(lang, "hubAConfirmer")}</span>}
                  {p.fiche && <br />}
                  {p.fiche && <Link href={`/work/${p.fiche}`}>{t(lang, "xpFiche")} ▸</Link>}
                </div>
              ))}
            </div>
          </div>
          <span className="aff-coin bd">
            <span className="aff-chip">
              {t(lang, "hubFenXp")} <b>{String(i + 1).padStart(2, "0")}</b>
            </span>
          </span>
        </section>
      ))}

      {/* — l'affiche MÉTHODE : six grands numéros — */}
      <section className="aff-poster" style={accVars({ c: "#8fd0ff", txt: ENCRE })} aria-labelledby="aff-methode">
        <span className="aff-coin hg">{t(lang, "hubFenMethode")}</span>
        <span className="aff-coin hd">{t(lang, "poolMark")}</span>
        <h2 id="aff-methode" className="aff-titre">
          {t(lang, "traceTitle")}
        </h2>
        <p className="aff-sous">{t(lang, "traceNote")}</p>
        <ol className="aff-etapes">
          {nodes.map(([num, nom, dit]) => (
            <li key={num} className="aff-etape">
              <span className="num">{num}</span>
              <span className="nom">{nom}</span>
              <span className="dit">{dit}</span>
            </li>
          ))}
        </ol>
        <p className="aff-banc">
          <b>{pool[0]}</b>{" "}
          <span className="chips">
            {t(lang, "poolChips").map((c) => (
              <span key={c}>{c}</span>
            ))}
          </span>
          <br />
          {pool[1]}
        </p>
      </section>

      {/* — l'affiche SPECS : papier millimétré — */}
      <section className="aff-poster aff-papier" aria-labelledby="aff-spec">
        <span className="aff-coin hg">{t(lang, "hubFenSpec")}</span>
        <h2 id="aff-spec" className="aff-titre">
          {t(lang, "specTitle")}
        </h2>
        <div className="aff-arbre">
          {groupes.map(([nom, lignes]) => (
            <div key={nom as string} className="aff-groupe">
              <h3>{nom}</h3>
              {(lignes as readonly (readonly [string, string])[]).map(([des, classe]) => (
                <div key={des} className="aff-ligne">
                  <span>{des}</span>
                  <span className="fil" aria-hidden="true" />
                  {classe && <span className="classe">{classe}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* — l'affiche CONTACT : le couchant et le sol en grille — */}
      <section className="aff-poster aff-couchant" aria-labelledby="aff-contact">
        <span className="aff-coin hg">{t(lang, "hubFenContact")}</span>
        <h2 id="aff-contact" className="aff-titre" style={{ textAlign: "center" }}>
          {t(lang, "ctAccroche")}
        </h2>
        <div className="aff-boutons" style={{ justifyContent: "center" }}>
          {liens.map(([role, val, url]) => (
            <a key={url} href={url} target={url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              <span className="role">{role}</span>
              <span className="val">{val}</span>
            </a>
          ))}
        </div>
      </section>

      <footer className="y2k-pied">
        <span>{t(lang, "hubStatut")}</span>
        <span>{t(lang, "hubOs")}</span>
      </footer>
    </main>
  )
}
