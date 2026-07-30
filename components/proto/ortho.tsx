"use client"

import { t, type Lang } from "./dict"

/* ==================================================================
   PLANCHE DE VUES ORTHOGRAPHIQUES

   Ce qu'on emprunte à l'affiche technique automobile, c'est sa
   MÉTHODE, pas son sujet : un même objet répété sous les projections
   normalisées, légendé, coté, certifié. L'objet lui-même est un volume
   abstrait — un bloc à trois alésages avec un bossage. Aucune
   référence littérale à un véhicule, conformément à la direction.

   Les quatre cellules ne sont pas quatre dessins : trois sont le PLAN
   (trait, projection, cote) et la quatrième est la PIÈCE (matière,
   reflet). La planche dit « voici ce qui est spécifié, voici ce que
   ça devient ». C'est le même geste que la section Tracé.

   PIÈGE DU PROJET — collision CSS/SVG sur les noms de classe. En SVG2
   les propriétés CSS width/height/x/y/r battent les attributs de
   présentation, et une règle HTML homonyme réécrit la géométrie d'un
   <rect>. Tout est donc préfixé `ov-`, et AUCUNE règle `.ov-*` ne
   déclare width, height, x, y ni r.
   ================================================================== */

/* Géométrie de l'objet, en unités de dessin. Une seule source : les
   trois vues DOIVENT rester cohérentes entre elles, sinon la planche
   ne décrit plus un objet mais trois. */
const L = 120 // longueur
const P = 60 // profondeur
const H = 40 // hauteur
const BORE = 7 // rayon d'alésage
const BORES = [-35, 0, 35] // entraxes depuis le centre

/* Repère commun à toutes les vues : même viewBox, même échelle, donc
   les vues sont comparables à l'œil — c'est tout l'intérêt d'une
   planche par rapport à quatre images. */
const VB = "0 0 200 132"
const CX = 100

export function Ortho({ lang }: { lang: Lang }) {
  const views = t(lang, "ovViews") as unknown as [string, string, string][]

  return (
    <section className="ov" id="vues" aria-labelledby="ov-titre">
      <div className="ov-rail mono mono-xs dim" aria-hidden="true">
        {t(lang, "ovRail")}
      </div>
      {/* En-tête aligné sur les autres feuilles : ligne d'index, chiffre
          en chrome, titre. La section portait un `aria-label` et aucun
          titre — un lecteur d'écran ne pouvait pas la lister parmi les
          autres. */}
      <header className="ov-head">
        <p className="mono mono-sm dim ov-idx">{t(lang, "ovLigne")}</p>
        <span className="f-num chrome" aria-hidden="true">
          {t(lang, "ovNum")}
        </span>
        <h2 id="ov-titre" className="ov-titre">
          {t(lang, "ovTitle")}
        </h2>
        <p className="jp dim ov-jp">{t(lang, "ovJp")}</p>
      </header>

      <div className="ov-grid">
        {/* ---------- A · DESSUS : projection horizontale ---------- */}
        <Cell code={views[0]}>
          <svg viewBox={VB} className="ov-svg" role="img" aria-hidden="true">
            {/* axes avant l'arête : un axe qui passe par-dessus le
                trait le fait paraître interrompu */}
            <line className="ov-axis" x1={CX - L / 2 - 14} y1={66} x2={CX + L / 2 + 14} y2={66} />
            {BORES.map((d) => (
              <line key={d} className="ov-axis" x1={CX + d} y1={66 - P / 2 - 14} x2={CX + d} y2={66 + P / 2 + 14} />
            ))}
            <rect className="ov-edge" x={CX - L / 2} y={66 - P / 2} width={L} height={P} />
            {BORES.map((d) => (
              <circle key={d} className="ov-edge" cx={CX + d} cy={66} r={BORE} />
            ))}
            {/* bossage vu de dessus : arête vue, donc trait continu */}
            <rect className="ov-edge" x={CX - 15} y={66 - P / 2} width={30} height={P} />

            {/* plan de coupe A-A. Le rouge est ici parce qu'il DÉSIGNE :
                c'est l'instruction de coupe, la seule affirmation
                impérative de la planche. Le trait s'arrête AVANT la
                ligne de cote — deux instruments ne se disputent pas le
                même pixel, et le repère A doit rester lisible. */}
            <line className="ov-cut" x1={CX} y1={22} x2={CX} y2={104} />
            {/* flèches de sens d'observation : triangles pleins, pas des
                chevrons. Elles disent DEPUIS OÙ on regarde la coupe. */}
            <path className="ov-cut-head" d={`M ${CX} 22 l 10 0 l 0 -3 l 7 4.5 l -7 4.5 l 0 -3 z`} />
            <path className="ov-cut-head" d={`M ${CX} 104 l 10 0 l 0 -3 l 7 4.5 l -7 4.5 l 0 -3 z`} />
            <text className="ov-t ov-t-cut" x={CX + 24} y={16}>
              A
            </text>
            <text className="ov-t ov-t-cut" x={CX + 24} y={116}>
              A
            </text>

            {/* la cote : « la seule affirmation de la planche ».
                Le texte est décalé du centre, pas centré : au centre il
                tomberait exactement sur le plan de coupe. */}
            <line className="ov-dim" x1={CX - L / 2} y1={122} x2={CX + L / 2} y2={122} />
            <path className="ov-dim" d={`M ${CX - L / 2} 122 l 7 -2.5 l 0 5 z`} />
            <path className="ov-dim" d={`M ${CX + L / 2} 122 l -7 -2.5 l 0 5 z`} />
            <line className="ov-witness" x1={CX - L / 2} y1={66 + P / 2 + 3} x2={CX - L / 2} y2={126} />
            <line className="ov-witness" x1={CX + L / 2} y1={66 + P / 2 + 3} x2={CX + L / 2} y2={126} />
            <text className="ov-t ov-t-dim" x={CX - 36} y={119}>
              {L}
            </text>
          </svg>
        </Cell>

        {/* ---------- B · FACE : projection frontale ---------- */}
        <Cell code={views[1]}>
          <svg viewBox={VB} className="ov-svg" role="img" aria-hidden="true">
            <line className="ov-axis" x1={CX - L / 2 - 14} y1={76} x2={CX + L / 2 + 14} y2={76} />
            {BORES.map((d) => (
              <line key={d} className="ov-axis" x1={CX + d} y1={40} x2={CX + d} y2={102} />
            ))}
            <rect className="ov-edge" x={CX - L / 2} y={76 - H / 2} width={L} height={H} />
            {/* bossage : il monte au-dessus de la face, arête vue */}
            <rect className="ov-edge" x={CX - 15} y={76 - H / 2 - 11} width={30} height={11} />
            {/* alésages traversants : arête CACHÉE, donc tireté */}
            {BORES.map((d) => (
              <g key={d}>
                <line className="ov-hidden" x1={CX + d - BORE} y1={76 - H / 2} x2={CX + d - BORE} y2={76 + H / 2} />
                <line className="ov-hidden" x1={CX + d + BORE} y1={76 - H / 2} x2={CX + d + BORE} y2={76 + H / 2} />
              </g>
            ))}
            <line className="ov-dim" x1={CX + L / 2 + 16} y1={76 - H / 2} x2={CX + L / 2 + 16} y2={76 + H / 2} />
            <path className="ov-dim" d={`M ${CX + L / 2 + 16} ${76 - H / 2} l -2.5 6 l 5 0 z`} />
            <path className="ov-dim" d={`M ${CX + L / 2 + 16} ${76 + H / 2} l -2.5 -6 l 5 0 z`} />
            <text className="ov-t ov-t-dim" x={CX + L / 2 + 26} y={79}>
              {H}
            </text>
          </svg>
        </Cell>

        {/* ---------- C · PROFIL : projection latérale, coupée en A-A ---------- */}
        <Cell code={views[2]}>
          <svg viewBox={VB} className="ov-svg" role="img" aria-hidden="true">
            <defs>
              {/* hachure de coupe : 45°, pas régulier. patternUnits en
                  userSpaceOnUse — sinon le pas suit la taille de la
                  forme et deux pièces coupées n'ont plus la même
                  hachure. */}
              <pattern id="ov-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line className="ov-hatch-line" x1="0" y1="0" x2="0" y2="6" />
              </pattern>
            </defs>
            <line className="ov-axis" x1={CX - P / 2 - 16} y1={76} x2={CX + P / 2 + 16} y2={76} />
            <line className="ov-axis" x1={CX} y1={40} x2={CX} y2={102} />

            {/* matière coupée : hachurée. Les alésages sont du vide,
                donc ils ne sont PAS hachurés — c'est la règle qui rend
                une coupe lisible. */}
            <path
              className="ov-cut-face"
              d={`M ${CX - P / 2} ${76 - H / 2} h ${P} v ${H} h ${-P} z
                  M ${CX - BORE} ${76 - H / 2} h ${BORE * 2} v ${H} h ${-BORE * 2} z`}
              fillRule="evenodd"
            />
            <rect className="ov-edge" x={CX - P / 2} y={76 - H / 2} width={P} height={H} />
            <rect className="ov-edge" x={CX - 15} y={76 - H / 2 - 11} width={30} height={11} />
            {/* parois de l'alésage : arêtes VUES en coupe */}
            <line className="ov-edge" x1={CX - BORE} y1={76 - H / 2} x2={CX - BORE} y2={76 + H / 2} />
            <line className="ov-edge" x1={CX + BORE} y1={76 - H / 2} x2={CX + BORE} y2={76 + H / 2} />

            <text className="ov-t ov-t-cut" x={CX} y={34}>
              {t(lang, "ovSection")}
            </text>
          </svg>
        </Cell>

        {/* ---------- D · MATIÈRE : la pièce, plus le plan ----------
            Trois faces, une seule rampe de chrome — celle du titre —
            décalée par face. Un chrome, c'est un horizon réfléchi :
            deux faces d'orientation différente ne peuvent pas
            réfléchir le même endroit de cet horizon, sinon le volume
            s'aplatit. Le décalage EST la troisième dimension. */}
        <Cell code={views[3]} solid>
          <div className="ov-iso">
            <i className="ov-face ov-top" />
            <i className="ov-face ov-left" />
            <i className="ov-face ov-right" />
            <svg viewBox="0 0 200 200" className="ov-iso-bore" aria-hidden="true">
              <ellipse className="ov-bore-hole" cx="100" cy="70" rx="15" ry="8.5" transform="rotate(-26 100 70)" />
            </svg>
          </div>
        </Cell>
      </div>

      <p className="mono mono-sm dim-2 ov-note">{t(lang, "ovNote")}</p>

      <footer className="ov-foot">
        <span className="ov-bars" aria-hidden="true" />
        <span className="mono mono-xs dim">{t(lang, "ovScale")}</span>
        <span className="mono mono-xs dim">CE</span>
        <span className="mono mono-xs dim ov-ref">REF.0043-B / REV.2</span>
      </footer>
    </section>
  )
}

/* Une cellule = un cadre, un repère, un nom, un angle de prise. Le
   repère est dans un carré plein parce qu'il indexe la vue dans la
   planche : c'est de la nomenclature, pas de la décoration. */
function Cell({
  code,
  solid,
  children,
}: {
  code: [string, string, string]
  solid?: boolean
  children: React.ReactNode
}) {
  const [mark, name, angle] = code
  return (
    <figure className={`ov-cell${solid ? " ov-cell-solid" : ""}`}>
      <div className="ov-frame">{children}</div>
      <figcaption className="ov-cap">
        <span className="mono mono-xs ov-mark">{mark}</span>
        <span className="mono mono-sm ov-name">{name}</span>
        <span className="mono mono-xs dim ov-angle">{angle}</span>
      </figcaption>
    </figure>
  )
}
