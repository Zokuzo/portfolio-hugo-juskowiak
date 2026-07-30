"use client"

import { motion } from "framer-motion"
import { t, type Lang } from "./dict"

/* ==================================================================
   07 — CARTOUCHE. La prise de contact.

   Tout dessin technique se termine par son cartouche : le bloc qui
   porte le titre, l'échelle, la date, la référence et le nom du
   dessinateur. C'est LA forme juste pour une page de contact ici — le
   document ne s'arrête pas, il SE SIGNE. Et un cartouche est déjà,
   littéralement, un bloc de coordonnées.

   Les liens sont alignés sur ce que le site de production expose
   déjà : e-mail et LinkedIn. Le CV porte aussi un numéro de
   téléphone ; il n'est pas repris — publier un numéro sur une page
   ouverte est une décision du propriétaire, pas du document.

   PAS DE FORMULAIRE. Un formulaire de contact demande un back-end, une
   protection anti-spam et une boîte à surveiller, pour faire moins
   bien qu'un `mailto:` que le lecteur peut copier. Le cartouche d'un
   plan ne contient pas de formulaire, il contient des références.
   ================================================================== */

export function Cartouche({ lang }: { lang: Lang }) {
  const champs = t(lang, "ctChamps") as unknown as [string, string][]
  const liens = t(lang, "ctLiens") as unknown as [string, string, string][]

  return (
    <section className="ct" id="contact" aria-labelledby="ct-titre">
      <div className="ct-rail mono mono-xs dim" aria-hidden="true">
        {t(lang, "ctRail")}
      </div>

      <header className="ct-head">
        <p className="mono mono-sm dim ct-idx">{t(lang, "ctIndex")}</p>
        <h2 id="ct-titre" className="ct-titre">
          {t(lang, "ctTitle")}
        </h2>
        <p className="jp dim ct-jp">{t(lang, "ctJp")}</p>
      </header>

      <motion.p
        className="ct-accroche"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {t(lang, "ctAccroche")}
      </motion.p>

      <div className="ct-bloc">
        {/* Les coordonnées d'abord : c'est ce qu'on vient chercher. Le
            reste du cartouche documente le document lui-même, et peut
            attendre d'être lu. */}
        <ul className="ct-liens">
          {liens.map(([role, libelle, href]) => {
            const externe = href.startsWith("http")
            return (
              <li key={role}>
                <a
                  className="ct-lien"
                  href={href}
                  {...(externe ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                >
                  <span className="mono mono-xs dim ct-role">{role}</span>
                  <span className="ct-libelle">{libelle}</span>
                  <span className="ct-fleche mono" aria-hidden="true">
                    →
                  </span>
                </a>
              </li>
            )
          })}
        </ul>

        <dl className="ct-champs">
          {champs.map(([cle, valeur]) => (
            <div key={cle} className="ct-champ">
              <dt className="mono mono-xs dim">{cle}</dt>
              <dd className="mono mono-xs ct-valeur">{valeur}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Marque de fin de document : la seule chose qui vient après le
          cartouche sur un plan est le bord de la feuille. */}
      <p className="mono mono-xs dim ct-fin" aria-hidden="true">
        — fin —
      </p>
    </section>
  )
}
