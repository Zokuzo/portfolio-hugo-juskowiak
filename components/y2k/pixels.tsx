import { PALETTE } from "./pixel-art"

/* ==================================================================
   LE RENDU DU PIXEL ART (#37) — une grille de caractères devient un
   SVG de rectangles.

   POURQUOI UN SVG ET PAS UNE IMAGE : le monde s'interdit toute requête
   externe et auto-héberge tout (passe 7 du harnais) ; un SVG inline ne
   coûte AUCUNE requête, reste net à toutes les densités d'écran (un PNG
   pixel art se salit dès qu'un navigateur l'interpole), et se teinte par
   la palette du monde plutôt que par un fichier binaire opaque.

   `shape-rendering: crispEdges` est la ligne qui compte : sans elle, le
   moteur anti-aliase les bords et le pixel art redevient flou — c'est
   exactement ce que le retour de gate reprochait au dessin lissé.

   Les plages horizontales de même couleur sont FUSIONNÉES en un seul
   rect : la branche fait 466 pixels allumés mais ~180 rects, la fenêtre
   3600 mais ~400. Un rect par pixel serait un millier de nœuds DOM pour
   un ornement.
   ================================================================== */

export function Pixels({
  grille,
  className,
  palette = PALETTE,
}: {
  grille: readonly string[]
  className?: string
  palette?: Record<string, string>
}) {
  const l = grille[0].length
  const h = grille.length
  const rects: React.ReactElement[] = []
  grille.forEach((ligne, y) => {
    let x = 0
    while (x < l) {
      const c = ligne[x]
      if (c === ".") {
        x++
        continue
      }
      let w = 1
      while (x + w < l && ligne[x + w] === c) w++
      rects.push(<rect key={`${x},${y}`} x={x} y={y} width={w} height={1} fill={palette[c]} />)
      x += w
    }
  })
  return (
    <svg
      className={className}
      viewBox={`0 0 ${l} ${h}`}
      shapeRendering="crispEdges"
      /* ornement pur : la page ne perd rien à ce qu'il soit muet, et un
         lecteur d'écran n'a que faire d'un millier de rectangles */
      aria-hidden="true"
      focusable="false"
    >
      {rects}
    </svg>
  )
}
