"use client"

import { t, type Lang } from "@/components/proto/dict"
import { Pixels } from "./pixels"
import { FENETRE } from "./pixel-art"

/* ==================================================================
   LE HERO « FENÊTRE » (#37, 2e retour de gate : « fais une version
   totalement différente de la hero section »).

   LE CONCEPT, et ce qui le rend VRAIMENT différent : le hero « boot »
   est un ÉCRAN — le système occupe toute la page, comme un démarrage
   plein cadre. Celui-ci est une SCÈNE. On est dans la chambre, au
   crépuscule ; le système ne remplit plus l'écran, il tourne sur un
   MONITEUR posé sur le bureau, devant la fenêtre ouverte sur la ville.
   Ce n'est pas le même ornement sur la même structure : c'est un
   changement de point de vue — l'un vous met DANS la machine, l'autre
   vous met dans la pièce d'où on la regarde.

   Le récit s'y raccroche : la GT86 vous a déposé DANS cette rue ; ici
   vous êtes rentré, et la ville est derrière la vitre.

   TOUT LE TEXTE RESTE DU DOM : le moniteur est une boîte CSS, pas une
   image — l'audit AA le mesure, le dictionnaire le traduit, un lecteur
   d'écran le lit. La fenêtre, elle, est du pixel art muet.
   ================================================================== */

export function HeroFenetre({ lang }: { lang: Lang }) {
  return (
    /* LE MUR ET LE BUREAU vivent sur la SECTION — ils traversent toute
       la largeur, comme un mur ; seuls les meubles sont plafonnés dans
       le cadre. Sans ça, le ciel de la page reparaît de part et d'autre
       de la chambre et la scène se lit comme une vignette collée. */
    <section className="hf">
      <div className="hf-cadre">
        {/* LA FENÊTRE et sa lumière : décor pur. */}
        <div className="hf-fond" aria-hidden="true">
          <span className="hf-lampe" />
          <span className="hf-affiche">{t(lang, "hubMaisonJp")}</span>
          <div className="hf-fen">
            <Pixels grille={FENETRE} className="hf-fenetre" />
            <span className="hf-appui" />
          </div>
        </div>

        {/* LE MONITEUR : une vraie boîte, un vrai texte. */}
        <div className="hf-crt">
        <div className="hf-crt-capot">
        <div className="hf-crt-dalle">
          <span className="hf-scan" aria-hidden="true" />
          <p className="hf-boot">
            {t(lang, "hubOs")} — {t(lang, "hubMaisonBoot")}
          </p>
          <h1 className="y2k-wordmark hf-wordmark" data-texte={t(lang, "gt86Maison")}>
            {t(lang, "gt86Maison")}
          </h1>
          <p className="hf-identite">
            <strong>{t(lang, "gt86Nom")}</strong> — {t(lang, "role")}
          </p>
          <div className="hf-charge">
            <span className="hf-charge-barre" aria-hidden="true">
              <i />
            </span>
            <span className="hf-charge-txt">{t(lang, "hubMaisonCharge")}</span>
          </div>
        </div>
        </div>
        {/* le socle du moniteur : la marque gravée dans le plastique */}
        <div className="hf-crt-socle">
          <span className="hf-crt-marque">{t(lang, "hubOs")}</span>
          <span className="hf-crt-diode" aria-hidden="true" />
        </div>
        </div>

        {/* les objets du bureau — décor pur, ils disent la pièce */}
        <div className="hf-objets" aria-hidden="true">
          <span className="hf-disquettes">
            <i />
            <i />
            <i />
          </span>
          <span className="hf-mug" />
        </div>
      </div>
    </section>
  )
}
