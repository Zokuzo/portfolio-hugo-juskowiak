import { t } from "./dict"
import { SchemaEternal } from "./schema-eternal"
import { Bloc, Cotes, CodeAnnote, type Corps } from "./fiche-blocs"

/* ==================================================================
   FICHE U-04 — ETERNAL. Sa mise en page, à elle seule.

   CE QUE CETTE FICHE FAIT ET QUE LES AUTRES NE FERONT PAS. L'ordre
   de la coque générique (contexte → contraintes → décisions →
   résultat → parc) raconte un projet dont on connaît le récit. Ici on
   connaît le CODE (recherche 02, tout sourcé), donc la fiche montre
   au lieu de raconter :

     1. le SCHÉMA arrive en deuxième, juste après le contexte, parce
        que la seule phrase difficile du projet — « deux vues, un seul
        moteur » — se lit en dessin et pas en prose ;
     2. le PONT est montré EN CODE, tout de suite après la décision
        qu'il prouve. Une décision d'architecture suivie de ses six
        lignes, c'est la différence entre affirmer et montrer ;
     3. les COTES ferment la fiche avant le parc, chacune avec la
        commande qui la rejoue.

   Pas de bloc « Résultat » : le projet n'a aucune télémétrie
   (recherche 02 §9.4, aucun `fetch` sortant hors `lecons/`), donc
   personne ne peut dire combien de leçons ont été lues. Un résultat
   inventé serait pire que pas de résultat.

   LE SCHÉMA NE BOUGE PAS AU SCROLL, et c'est une décision. Le module
   du ticket 10 ne produit que de la géométrie statique : le rendre
   collant ou l'accrocher à la progression du scroll ajouterait du
   travail par frame sur 101 nœuds pour zéro information de plus — sa
   légende est DANS le SVG, il n'y a rien à faire défiler à côté. Il
   entre comme les autres blocs, une fois, et se pose. Sous `reduce`,
   il n'y a donc rien à couper de plus que la révélation commune.
   ================================================================== */

export const CorpsEternal: Corps = ({ p, lang, reduit }) => (
  <>
    <Bloc id="fp-ctx" titre={t(lang, "fpContexte")} reduit={reduit} i={0}>
      <p className="fp-prose">{p.contexte}</p>
    </Bloc>

    <Bloc id="fp-arc" titre={t(lang, "fpArchitecture")} reduit={reduit} i={1}>
      <div className="fp-schema">
        <SchemaEternal lang={lang} />
      </div>
    </Bloc>

    {/* Les contraintes AVANT les décisions : une décision ne veut rien
        dire sans ce qu'elle avait à tenir. C'est la seule règle de
        lecture que toutes les fiches gardent. */}
    <Bloc id="fp-ctr" titre={t(lang, "fpContraintes")} reduit={reduit} i={2}>
      <ul className="fp-contraintes">
        {p.contraintes.map((c, i) => (
          <li key={c}>
            <span className="mono mono-xs dim fp-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="mono mono-sm dim-2 fp-contrainte">{c}</span>
          </li>
        ))}
      </ul>
    </Bloc>

    <Bloc id="fp-dec" titre={t(lang, "fpDecisions")} reduit={reduit} i={3}>
      <ol className="fp-decisions">
        {p.decisions.map((d, i) => (
          <li key={d.titre} className="fp-decision">
            <span className="mono mono-xs dim fp-num">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="fp-decision-titre">{d.titre}</h3>
              <p className="mono mono-sm dim-2 fp-decision-texte">{d.texte}</p>
            </div>
          </li>
        ))}
      </ol>
    </Bloc>

    <Bloc id="fp-pont" titre={t(lang, "fpPont")} reduit={reduit} i={4}>
      <CodeAnnote
        source={t(lang, "etnPontSource")}
        lignes={t(lang, "etnPontCode") as unknown as string[][]}
        note={t(lang, "etnPontNote")}
        elision={t(lang, "fpCodeElision")}
      />
    </Bloc>

    <Bloc id="fp-cot" titre={t(lang, "fpCotes")} reduit={reduit} i={5}>
      <Cotes lang={lang} lignes={t(lang, "etnCotes") as unknown as string[][]} note={t(lang, "fpCotesNote")} />
    </Bloc>

    <Bloc id="fp-parc" titre={t(lang, "fpParc")} reduit={reduit} i={6}>
      <ul className="fp-parc">
        {p.parc.map((x) => (
          <li key={x} className="mono mono-xs fp-piece">
            {x}
          </li>
        ))}
      </ul>
    </Bloc>
  </>
)
