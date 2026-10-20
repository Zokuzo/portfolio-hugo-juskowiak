"use client"

import { useState, type ReactNode } from "react"
import { t, type Lang } from "@/components/proto/dict"
import { employeurs, etudes, perso, type Lien } from "@/components/proto/parcours"
import { LienFiche } from "@/components/proto/lien-fiche"
import { CreditsModeles } from "@/components/y2k/credits-modeles"
import a from "./arrivee.module.css"
import c from "./course.module.css"
import { MENU, Volet, VoletSortant } from "./course"
import { TraitVitesse } from "./trait-vitesse"
import { joue } from "./sons"
import type { Piste } from "./menu-nfs"

/* LES PAGES D'ARRIVÉE du menu NFS : le contenu réel des hubs /home et
   /work (dict.ts, parcours.ts), mis en course dans la DA A. Le volet du
   trajet repart par la droite à l'entrée ; « ‹ Garage » le refait entrer
   et rend la main au menu. */

const RETOUR_MS = 460

type Cadre = { piste: Piste; titre: string; jp: string; accroche: string; stats: [string, string | number][] }

function Arrivee({ cadre, lang, setLang, children }: { cadre: Cadre; lang: Lang; setLang: (l: Lang) => void; children: ReactNode }) {
  const [repart, setRepart] = useState(false)
  /* un VRAI chargement, pas router.push : le masque d'attente du layout
     (#54) ne joue qu'au chargement, et la scène lit le drapeau du menu à son
     montage, avant que le routeur client n'ait réécrit l'adresse */
  const retour = () => {
    if (repart) return
    joue("souffle")
    setRepart(true)
    setTimeout(() => location.assign(MENU), RETOUR_MS)
  }
  return (
    <main className={a.page} lang={lang}>
      <div className={a.fond} aria-hidden />
      <header className={a.barre}>
        <button type="button" className={a.retour} onClick={retour} data-nfs="garage">
          <span>‹ Garage</span>
        </button>
        <span className={`${a.chrome} ${a.marque}`}>Hugo Juskowiak</span>
        <span className={a.langues} role="group" aria-label="FR / EN">
          {(["fr", "en"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </span>
      </header>

      <section className={a.titre}>
        <span className={a.mono}>épreuve · portfolio {cadre.piste}</span>
        <h1 className={`${a.chrome} ${a.glitch}`} data-text={cadre.titre}>{cadre.titre}</h1>
        <span className={a.jp}>{cadre.jp}</span>
        <TraitVitesse className={a.trait} />
        <p className={a.accroche}>{cadre.accroche}</p>
        <dl className={a.stats}>
          {cadre.stats.map(([k, v]) => (
            <div key={k}>
              <dt className={a.mono}>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {children}

      <Radio lang={lang} />
      <footer className={a.credits}>
        <CreditsModeles lang={lang} />
      </footer>
      <VoletSortant piste={cadre.piste} />
      {repart && (
        <div className={c.course}>
          <Volet vers="garage" className={c.voletEntre} />
        </div>
      )}
    </main>
  )
}

function Rubrique({ num, titre, note, children }: { num: string; titre: string; note?: string; children: ReactNode }) {
  return (
    <section className={a.rubrique}>
      <div className={a.bandeau}>
        <span>CP{num} · {titre}</span>
      </div>
      {note && <p className={a.note}>{note}</p>}
      {children}
    </section>
  )
}

function Liens({ liens }: { liens?: Lien[] }) {
  if (!liens?.length) return null
  return (
    <span className={a.liens}>
      {liens.map((l) => (
        <a key={l.url} href={l.url} target={l.url.startsWith("http") ? "_blank" : undefined} rel="noopener">
          {l.role} ↗{l.note ? ` (${l.note})` : ""}
        </a>
      ))}
    </span>
  )
}

function Radio({ lang }: { lang: Lang }) {
  return (
    <Rubrique num="R" titre={t(lang, "ctTitle")} note={t(lang, "ctAccroche")}>
      <div className={a.radio}>
        {t(lang, "ctLiens").map(([role, valeur, href]) => (
          <a key={role} className={a.frequence} href={href}>
            <span className={a.mono}>{role}</span>
            <span className={a.frequenceValeur}>{valeur}</span>
          </a>
        ))}
      </div>
    </Rubrique>
  )
}

export function ArriveeWork() {
  const [lang, setLang] = useState<Lang>("fr")
  const xps = employeurs(lang)
  const produits = xps.reduce((n, e) => n + e.produits.length, 0)
  const cadre: Cadre = {
    piste: "work",
    titre: "Work",
    jp: "ワーク",
    accroche: t(lang, "xpNote"),
    stats: [["écuries", xps.length], ["produits", produits], ["étapes", t(lang, "nodes").length], ["rôle", t(lang, "role")]],
  }
  return (
    <Arrivee cadre={cadre} lang={lang} setLang={setLang}>
      <Rubrique num="1" titre={t(lang, "xpTitle")}>
        <div className={a.grille}>
          {xps.map((e, i) => (
            <article key={e.slug} className={`${a.carte} ${i === 0 ? a.carteLarge : ""}`}>
              <span className={a.position}>P{i + 1}</span>
              <h3 className={`${a.chrome} ${a.carteNom}`}>{e.nom}</h3>
              <p className={a.mono}>
                {e.fonction}{e.lieu ? ` · ${e.lieu}` : ""} · {e.periode}
                {e.courant && <b className={a.enCourse}> {t(lang, "xpEnCours")}</b>}
              </p>
              <p className={a.texte}>{e.resume}</p>
              <ul className={a.produits}>
                {e.produits.map((p) => (
                  <li key={p.code}>
                    <span className={a.mono}>{p.code}</span>
                    <b>{p.nom}</b>
                    {p.aConfirmer && <i className={a.mono}> {t(lang, "hubAConfirmer")}</i>}
                    <span className={a.texteFin}>{p.texte}</span>
                    {p.fiche && <LienFiche slug={p.fiche} className={a.fiche}>{t(lang, "xpFiche")} ▸</LienFiche>}
                    <Liens liens={p.liens} />
                  </li>
                ))}
              </ul>
              <p className={a.parc}>{e.parc.join(" · ")}</p>
            </article>
          ))}
        </div>
      </Rubrique>

      <Rubrique num="2" titre={t(lang, "traceTitle")} note={t(lang, "traceNote")}>
        <ol className={a.checkpoints}>
          {t(lang, "nodes").map(([num, nom, texte]) => (
            <li key={num}>
              <span className={a.cpNum}>{num}</span>
              <b>{nom}</b>
              <span className={a.texteFin}>{texte}</span>
            </li>
          ))}
        </ol>
      </Rubrique>

      <Rubrique num="3" titre={t(lang, "specTitle")} note={t(lang, "specNote")}>
        <div className={a.reglages}>
          {t(lang, "specGroupes").map(([groupe, pieces]) => (
            <div key={groupe} className={a.reglage}>
              <h3 className={a.reglageNom}>{groupe}</h3>
              <ul>
                {pieces.map(([nom, classe]) => (
                  <li key={nom}>
                    {nom}
                    {classe && <span className={a.mono}> {classe}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Rubrique>
    </Arrivee>
  )
}

export function ArriveeMaison() {
  const [lang, setLang] = useState<Lang>("fr")
  const projets = perso(lang)
  const cursus = etudes(lang)
  const cadre: Cadre = {
    piste: "maison",
    titre: "Maison",
    jp: "ホーム",
    accroche: t(lang, "hubMaisonAtNote"),
    stats: [["atelier", projets.length], ["cursus", cursus.length], ["langues", "FR · EN · ES · JP"], ["base", "France"]],
  }
  return (
    <Arrivee cadre={cadre} lang={lang} setLang={setLang}>
      <Rubrique num="1" titre={t(lang, "atTitle")}>
        <div className={a.grille}>
          {projets.map((p, i) => (
            <article key={p.code} className={`${a.carte} ${i === 0 ? a.carteLarge : ""}`}>
              <span className={a.position}>{p.code}</span>
              <h3 className={`${a.chrome} ${a.carteNom}`}>{p.nom}</h3>
              <p className={a.mono}>
                {p.intitule} · <b className={a.enCourse}>{p.etat}</b>
                {p.aConfirmer && <i> {t(lang, "hubAConfirmer")}</i>}
              </p>
              <p className={a.texte}>{p.texte}</p>
              <p>
                {p.fiche && <LienFiche slug={p.fiche} className={a.fiche}>{t(lang, "xpFiche")} ▸</LienFiche>}
                <Liens liens={p.liens} />
              </p>
            </article>
          ))}
        </div>
      </Rubrique>

      <Rubrique num="2" titre={t(lang, "etuTitle")} note={t(lang, "etuNote")}>
        <table className={a.tableau}>
          <tbody>
            {cursus.map((e, i) => (
              <tr key={e.code}>
                <td className={a.position}>P{i + 1}</td>
                <td>
                  <div className={a.tableauNom}>
                    {e.nom}
                    {e.rail === 1 && <span className={a.mono}> {t(lang, "etuDouble")}</span>}
                  </div>
                  <div className={a.texteFin}>{e.intitule}{e.lieu ? ` · ${e.lieu}` : ""}</div>
                  <div className={a.texteFin}>{e.texte}</div>
                  {e.fiche && <LienFiche slug={e.fiche} className={a.fiche}>{t(lang, "xpFiche")} ▸</LienFiche>}
                </td>
                <td className={a.mono}>{Math.floor(e.debut)} → {Math.floor(e.fin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Rubrique>

      <Rubrique num="3" titre={t(lang, "opTitle")}>
        <div className={a.horsPiste}>
          <div>
            <p className={a.texte}>{t(lang, "opCorps")}</p>
            <p className={a.texte}>{t(lang, "opChute")}</p>
            <p className={a.texte}>{t(lang, "opDesign")}</p>
          </div>
          <dl className={a.licence}>
            {t(lang, "opChamps").map(([k, v]) => (
              <div key={k}>
                <dt className={a.mono}>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Rubrique>
    </Arrivee>
  )
}
