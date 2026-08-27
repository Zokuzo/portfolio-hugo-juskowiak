"use client"

import { useState } from "react"
import Link from "next/link"
import { t, type Lang } from "@/components/proto/dict"
import { etudes, perso } from "@/components/proto/parcours"
import { Pixels } from "./pixels"
import { SAKURA } from "./pixel-art"
import { HeroFenetre } from "./hero-fenetre"

/* ==================================================================
   LE HUB /home (#37) — la partition MAISON : la CHAMBRE au crépuscule,
   miroir du bureau de nuit de /work.

   Cinq sections dans l'ordre gravé au ticket : en-tête (le boot sakura
   « MAISON 97 » de la moisson), atelier en BOÎTE À DISQUETTES,
   qualifications en PLAYLIST HJ·AMP, hors travail en PROFIL.INI,
   contact en MESSAGERIE. Le CONTENU vient des feuilles existantes
   (dict.ts, parcours.ts) repris tels quels — ce fichier ne fait que le
   mettre en chambre.

   Les fiches restent sous /work/<slug> tant que #39 ne les a pas
   déménagées — les liens pointent sur des routes qui existent.
   ================================================================== */

/* Un accent par disquette, posé en variable CSS sur la carte — le CSS
   ne connaît que `--acc`, comme partout dans le monde Y2K. */
const ACCENTS_ATELIER: Record<string, string> = {
  A1: "#a06bff", // Eternal — le violet du monde (pixel HD, Evangelion)
  A2: "#9be05a", // Trading Agent — le vert acide (celui d'Octo)
  A3: "#ff9ec7", // La Provence — le rose sakura de la moisson
  A4: "#f2a63b", // bot de candidature — l'ambre atelier
}
const accVars = (c: string) => ({ "--acc": c }) as React.CSSProperties

/* la durée d'une piste : les années entières de debut/fin — « 2020 →
   2022 » ; une excursion qui tient dans l'année n'affiche qu'elle */
const duree = (debut: number, fin: number) => {
  const a = Math.floor(debut)
  const b = Math.floor(fin)
  return a === b ? `${a}` : `${a} → ${b}`
}

/* la tranche d'une piste sur l'axe commun, en pourcentages — le CSS ne
   connaît que --d (départ) et --w (largeur) */
const rail = (debut: number, fin: number, t0: number, t1: number) =>
  ({
    "--d": `${((debut - t0) / (t1 - t0)) * 100}%`,
    "--w": `${(Math.max(fin - debut, 0.15) / (t1 - t0)) * 100}%`,
  }) as React.CSSProperties

/* DEUX HEROS, UNE SEULE PAGE (retour de gate : « fais une version
   totalement différente de la hero section »). Le reste de la page est
   RIGOUREUSEMENT identique d'une version à l'autre — c'est la seule
   façon de gater un hero à l'œil : ce qui change est ce qu'on juge. */
export default function HubMaison({ hero = "boot" }: { hero?: "boot" | "fenetre" }) {
  const [lang, setLang] = useState<Lang>("fr")
  const projets = perso(lang)
  const pistes = etudes(lang)
  const liens = t(lang, "ctLiens")
  const champs = t(lang, "opChamps")
  /* l'axe commun des pistes : la première année ouverte, la dernière
     fermée — il sert au readout de tête ET aux barres de rail */
  const t0 = Math.min(...pistes.map((e) => e.debut))
  const t1 = Math.max(...pistes.map((e) => e.fin))

  return (
    /* `maison-chambre` : sous le hero « fenêtre », la page N'A PLUS de
       ciel — on est dans la pièce, pas dehors. Le dégradé de crépuscule
       de `.maison` est calé en px sur la hauteur du hero « boot » ; le
       laisser sous une chambre ferait reparaître une aube au milieu du
       mur. Une classe, pas un `:has()` : aucun risque de support. */
    <main lang={lang} className={`y2k maison${hero === "fenetre" ? " maison-chambre" : ""}`}>
      <header className="y2k-barre">
        <span className="y2k-barre-os">{t(lang, "hubOs")}</span>
        <span className="y2k-barre-fichier">{t(lang, "hubMaisonSys")}</span>
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

      {hero === "fenetre" ? (
        <HeroFenetre lang={lang} />
      ) : (
      /* — le BOOT : l'écran de démarrage du foyer, sous le ciel du soir — */
      <section className="m-boot">
        {/* LA BRANCHE DE CERISIER, EN PIXEL ART (retour de gate : « je
            trouve la fleur de cerisier ignoble, améliore-la en la
            pixelisant »). Le dessin lissé aux courbes de Bézier est
            mort : la grille vient de `tools/pixel/dessine.mjs`, calée
            sur les références du feed de Hugo — branche sombre à
            marches franches, fleurs à lobes et cœur clair. */}
        <Pixels grille={SAKURA} className="m-sakura" />
        {/* deux nuages pixel — le ciel de la moisson */}
        <span className="m-nuage m-nuage-a" aria-hidden="true" />
        <span className="m-nuage m-nuage-b" aria-hidden="true" />
        <span className="m-kanji" aria-hidden="true">
          {t(lang, "hubMaisonJp")}
        </span>

        <p className="m-boot-ligne">
          {t(lang, "hubOs")} — {t(lang, "hubMaisonBoot")}
        </p>
        <h1 className="y2k-wordmark m-wordmark" data-texte={t(lang, "gt86Maison")}>
          {t(lang, "gt86Maison")}
        </h1>
        <p className="m-identite">
          <strong>{t(lang, "gt86Nom")}</strong> — {t(lang, "role")}
        </p>
        <div className="m-charge">
          <span className="m-charge-barre" aria-hidden="true">
            <i />
          </span>
          <span className="m-charge-txt">{t(lang, "hubMaisonCharge")}</span>
        </div>
      </section>
      )}

      <div className="y2k-marquee m-marquee" aria-hidden="true">
        <span>{t(lang, "hubMaisonMarquee")}</span>
      </div>

      <div className="y2k-colonne m-colonne">
        {/* — A:\ATELIER : la boîte à disquettes — */}
        <section className="m-pan" aria-labelledby="m-at" style={accVars("#ff9ec7")}>
          <span className="m-pan-tab">
            {t(lang, "hubMaisonAtelier")} <i aria-hidden="true">✦</i>
          </span>
          <div className="m-pan-corps">
            <h2 id="m-at">{t(lang, "atTitle")}</h2>
            <p className="m-note">{t(lang, "hubMaisonAtNote")}</p>
            <div className="m-disqs">
              {projets.map((p) => (
                <article key={p.code} className="m-disq" style={accVars(ACCENTS_ATELIER[p.code])}>
                  <div className="m-disq-volet" aria-hidden="true" />
                  <div className="m-disq-etiquette">
                    <h3>{p.nom}</h3>
                    <p className="m-disq-intitule">{p.intitule}</p>
                    <p className="m-disq-texte">
                      {p.texte}
                      {p.aConfirmer && <span className="y2k-aconf">{t(lang, "hubAConfirmer")}</span>}
                    </p>
                  </div>
                  <div className="m-disq-pied">
                    <span className="m-disq-etat">{p.etat}</span>
                    {p.fiche && <Link href={`/work/${p.fiche}`}>{t(lang, "xpFiche")} ▸</Link>}
                    {p.liens?.map((l) => (
                      <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                        {l.role}
                        {l.note ? ` — ${l.note}` : ""}
                        {/* la flèche est un INDICE, pas un mot : dans le nom
                            accessible elle s'annonce « flèche nord-est » */}
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="m-pan-etat">
            <span>
              {projets.length} {t(lang, "hubObjets")}
            </span>
            <span>{t(lang, "hubMaisonAtelier")}</span>
          </div>
        </section>

        {/* — QUALIF.M3U : la playlist HJ·AMP — */}
        <section className="m-pan" aria-labelledby="m-etu" style={accVars("#a06bff")}>
          <span className="m-pan-tab">
            {t(lang, "hubMaisonQualif")} <i aria-hidden="true">✦</i>
          </span>
          <div className="m-pan-corps">
            <h2 id="m-etu">{t(lang, "etuTitle")}</h2>
            <p className="m-note">{t(lang, "etuNote")}</p>
            <div className="m-amp">
              <div className="m-amp-tete">
                <span>{t(lang, "hubMaisonAmp")}</span>
                <span>
                  {pistes.length} {t(lang, "hubMaisonPistes")} — {duree(t0, t1)}
                </span>
              </div>
              <ol className="m-pistes">
                {pistes.map((e, i) => (
                  <li key={e.code} className={e.rail === 1 ? "m-piste-double" : undefined}>
                    <span className="num" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="corps">
                      {/* `fiche` est optionnel dans parcours.ts : sans garde,
                          une entrée future sans fiche donnerait un lien
                          /work/undefined (même garde que les disquettes) */}
                      {e.fiche ? (
                        <Link href={`/work/${e.fiche}`} className="nom">
                          {e.nom}
                        </Link>
                      ) : (
                        <span className="nom">{e.nom}</span>
                      )}
                      <span className="intitule">{e.intitule}</span>
                      {e.lieu && <span className="lieu">{e.lieu}</span>}
                      {e.rail === 1 && <span className="m-double-chip">{t(lang, "etuDouble")}</span>}
                      <p className="dit">{e.texte}</p>
                    </div>
                    <span className="duree">{duree(e.debut, e.fin)}</span>
                    {/* LA BARRE DE RAIL — etuNote dit qu'écrit en liste, le
                        parallélisme DISPARAÎT : la barre le remet à l'œil.
                        Chaque piste occupe sa tranche de l'axe commun, et
                        celles qui se chevauchent se voient se chevaucher
                        (le vrai sujet de la feuille 03). Décor : la donnée
                        est déjà écrite en toutes lettres dans la durée. */}
                    <span className="m-rail" aria-hidden="true">
                      <i style={rail(e.debut, e.fin, t0, t1)} />
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="m-pan-etat">
            <span>
              {pistes.length} {t(lang, "hubMaisonPistes")}
            </span>
            <span>{t(lang, "hubMaisonQualif")}</span>
          </div>
        </section>

        {/* — PROFIL.INI : le hors-travail en fichier de config — */}
        <section className="m-pan" aria-labelledby="m-op" style={accVars("#8fd0ff")}>
          <span className="m-pan-tab">
            {t(lang, "hubMaisonPerso")} <i aria-hidden="true">✦</i>
          </span>
          <div className="m-pan-corps">
            <h2 id="m-op">{t(lang, "opTitle")}</h2>
            <div className="m-ini">
              <div className="m-ini-col">
                <p className="m-ini-sec">{t(lang, "hubMaisonIniForce")}</p>
                <p className="m-ini-texte">{t(lang, "opCorps")}</p>
                <p className="m-ini-texte">{t(lang, "opChute")}</p>
                <dl className="m-ini-lignes">
                  {champs.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="m-ini-col">
                <p className="m-ini-sec">{t(lang, "hubMaisonIniReglages")}</p>
                <p className="m-ini-texte">{t(lang, "opDesign")}</p>
              </div>
            </div>
          </div>
          <div className="m-pan-etat">
            <span>{t(lang, "opTitle")}</span>
            <span>{t(lang, "hubMaisonPerso")}</span>
          </div>
        </section>

        {/* — MSGR.EXE : la messagerie — */}
        <section className="m-pan m-msgr" aria-labelledby="m-ct" style={accVars("#ff3ea5")}>
          <span className="m-pan-tab">
            {t(lang, "hubMaisonContact")} <i aria-hidden="true">✦</i>
          </span>
          <div className="m-pan-corps">
            <h2 id="m-ct" style={{ position: "absolute", left: -9999 }}>
              {t(lang, "ctTitle")}
            </h2>
            <p className="m-msgr-statut">{t(lang, "hubMaisonEnLigne")}</p>
            <div className="m-msgr-fil">
              <span className="m-msgr-avatar" aria-hidden="true">
                H
              </span>
              <p className="m-msgr-bulle">{t(lang, "ctAccroche")}</p>
            </div>
            <div className="m-msgr-boutons">
              {liens.map(([role, val, url]) => (
                <a key={url} href={url} target={url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  <span className="role">{role}</span>
                  <span className="val">{val}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>

      <footer className="y2k-pied">
        <span>{t(lang, "hubMaisonStatut")}</span>
        <span>{t(lang, "hubOs")}</span>
      </footer>
    </main>
  )
}
