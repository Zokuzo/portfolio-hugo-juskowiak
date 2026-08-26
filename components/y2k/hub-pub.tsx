"use client"

import { useState } from "react"
import Link from "next/link"
import { t, type Lang } from "@/components/proto/dict"
import { employeurs } from "@/components/proto/parcours"

/* ==================================================================
   HUB « PUB » — l'essai C du gate #36, d'après la pub Nokia 7250 :
   chaque employeur est une PAGE DE MAGAZINE — visuel glacé à bord
   courbe (le nom géant recadré comme un gros plan), colonne
   publicitaire (marque cobalt, accroches, marque-pied Hugo), et
   l'appareil qui chevauche la couture : son écran LCD montre le
   produit (les VRAIES captures Reach-Up pour UpYourBizz, la liste des
   produits pour les autres).

   MÊME CONTENU dict/parcours.ts que les essais A et B (parc compris,
   en ligne mono sous les produits) — les accroches du hero sont trois
   « dits » de la méthode, repris tels quels.
   Route jetable /prototype/hub-pub.
   ================================================================== */

/* le skin pub ne teinte que le VISUEL : seule --acc sert ici (la paire
   --acc-txt des essais A/B n'a pas de consommateur dans pub.css) */
const ACCENTS: Record<string, string> = {
  upyourbizz: "#ff3ea5",
  "sophia-genetics": "#8fd0ff",
  "the-guill-corp": "#4a63e8",
  legrand: "#f2a63b",
}
const accVars = (c: string) => ({ "--acc": c }) as React.CSSProperties

/* les barres d'étalonnage d'imprimeur des coins de la pub */
const Cales = ({ ou }: { ou: "haut" | "bas" }) => (
  <span className={`pub-cales ${ou}`} aria-hidden="true">
    <i />
    <i />
  </span>
)

/* Deux MONDES pour un même squelette (verdict du 3e gate : « combine
   néon et pub ») : « papier » est la pub magazine blanche d'origine,
   « neon » la même grammaire posée sur la nuit vaporwave de /work —
   la peau vit dans pub-neon.css, le markup ne bouge pas. */
export default function HubPub({ monde = "papier" }: { monde?: "papier" | "neon" }) {
  const [lang, setLang] = useState<Lang>("fr")
  const xps = employeurs(lang)
  const nodes = t(lang, "nodes")
  const pool = t(lang, "pool")
  const groupes = t(lang, "specGroupes")
  const liens = t(lang, "ctLiens")
  /* la pile d'accroches du hero : trois « dits » de la méthode —
     comprendre, mesurer, livrer — repris tels quels */
  const accroches = [nodes[0][2], nodes[3][2], nodes[4][2]]

  return (
    <main lang={lang} className={`y2k pub${monde === "neon" ? " pub-neon" : ""}`}>
      <header className="y2k-barre">
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

      {/* — la page d'ouverture : l'annonce TRAVAIL — */}
      <section className="pub-page" aria-labelledby="pub-hero">
        <div className="pub-visu">
          <p className="geant" aria-hidden="true">
            {t(lang, "gt86Travail")}
          </p>
        </div>
        <div className="pub-col">
          <Cales ou="haut" />
          <h1 id="pub-hero" className="pub-marque">
            {t(lang, "gt86Travail")}
          </h1>
          <div className="pub-copy">
            <div className="lignes">
              {/* sans point ajouté : les « dits » se REPRENNENT tels
                  quels, et la section méthode plus bas les montre nus */}
              {accroches.map((a) => (
                <p key={a}>{a}</p>
              ))}
            </div>
            <p className="fonction">
              {t(lang, "role")} — {t(lang, "status")}
            </p>
          </div>
          <p className="pub-pied-marque">
            <span className="nom">{t(lang, "gt86Nom")}</span>
            <br />
            <span className="sous">{t(lang, "gt86Titre")}</span>
          </p>
          <Cales ou="bas" />
        </div>
        <span className="pub-url">{t(lang, "pubUrl")}</span>
      </section>

      {/* — une annonce PAR EMPLOYEUR — */}
      {xps.map((e) => (
        <section key={e.slug} className="pub-page" style={accVars(ACCENTS[e.slug])} aria-labelledby={`pub-${e.slug}`}>
          <div className="pub-visu">
            <p className="geant" aria-hidden="true">
              {e.nom}
            </p>
          </div>
          {/* l'appareil : son écran montre le produit — les vraies
              captures pour Reach-Up, la liste LCD pour les autres */}
          <div className="pub-devise" aria-hidden="true">
            <div className="ecran">
              {e.slug === "upyourbizz" ? (
                /* 1600×900 : les dimensions RÉELLES du fichier (mêmes
                   attributs que fiche-projet.tsx) — 1280×800 réservait
                   un 16:10 puis sautait au décodage */
                <img src="/reach-up/01-dashboard.webp" alt="" width={1600} height={900} loading="lazy" />
              ) : (
                <div className="lcd">
                  {e.produits.map((p) => (
                    <span key={p.code}>▸ {p.nom}</span>
                  ))}
                  <span>{e.periode}</span>
                </div>
              )}
            </div>
            <div className="touches">
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="pub-col">
            <Cales ou="haut" />
            <h2 id={`pub-${e.slug}`} className="pub-marque">
              {e.nom}
            </h2>
            <div className="pub-copy">
              <p className="lignes">{e.resume}</p>
              <p className="fonction">
                {e.fonction} — {e.periode}
                {e.lieu ? ` · ${e.lieu}` : ""}
                {e.courant ? ` · ${t(lang, "xpEnCours")}` : ""}
              </p>
              <div className="pub-produits">
                {e.produits.map((p) => (
                  <div key={p.code}>
                    <b>{p.nom}</b> — {p.texte}
                    {p.aConfirmer && <span className="pub-aconf">{t(lang, "hubAConfirmer")}</span>}{" "}
                    {p.fiche && <Link href={`/work/${p.fiche}`}>{t(lang, "xpFiche")} ▸</Link>}
                  </div>
                ))}
              </div>
              <p className="pub-parc">{e.parc.join(" · ")}</p>
            </div>
            <p className="pub-pied-marque">
              <span className="nom">{t(lang, "gt86Nom")}</span>
              <br />
              <span className="sous">{t(lang, "role")}</span>
            </p>
            <Cales ou="bas" />
          </div>
          <span className="pub-url">{t(lang, "pubUrl")}</span>
        </section>
      ))}

      {/* — les pages print : méthode, specs, contact — */}
      <section className="pub-print" aria-labelledby="pub-methode">
        <h2 id="pub-methode">{t(lang, "traceTitle")}</h2>
        <p className="note">{t(lang, "traceNote")}</p>
        <ol className="pub-etapes">
          {nodes.map(([num, nom, dit]) => (
            <li key={num}>
              <span className="num">{num}</span>
              <span className="nom">{nom}</span>
              <span className="dit">{dit}</span>
            </li>
          ))}
        </ol>
        <p className="pub-banc">
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

      <section className="pub-print" aria-labelledby="pub-spec">
        <h2 id="pub-spec">{t(lang, "specTitle")}</h2>
        <p className="note">{t(lang, "specNote")}</p>
        <div className="pub-arbre">
          {groupes.map(([nom, lignes]) => (
            <div key={nom as string} className="pub-groupe">
              <h3>{nom}</h3>
              {(lignes as readonly (readonly [string, string])[]).map(([des, classe]) => (
                <div key={des} className="pub-ligne">
                  <span>{des}</span>
                  <span className="fil" aria-hidden="true" />
                  {classe && <span className="classe">{classe}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="pub-print pub-contact" aria-labelledby="pub-ct">
        <h2 id="pub-ct">{t(lang, "ctAccroche")}</h2>
        <div className="pub-boutons">
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
        <span>{t(lang, "pubUrl")}</span>
      </footer>
    </main>
  )
}
