import { Tuile, type Famille, type IconeProps } from "./tuile"

/* Famille « PS1 / Windows 95 » : du pixel art 16 x 16 sur une tuile grise
   biseautée, la palette de l'interface 95 et le rose de la barre de
   sélection. Chaque icône s'écrit comme une grille de lettres : on la lit
   d'un coup d'œil et on la retouche sans outil. */

const PALETTE: Record<string, string> = {
  K: "#000000",
  W: "#ffffff",
  G: "#c0c0c0",
  D: "#808080",
  N: "#000080",
  B: "#1084d0",
  T: "#008080",
  Y: "#ffd23f",
  O: "#c89000",
  P: "#e561d3",
  R: "#d42a3a",
  L: "#6fe03c",
  C: "#4fd1ff",
}

const COTE = 16
const MARGE = 2
/* Le biseau 95 : lumière en haut à gauche, ombre en bas à droite. */
const BISEAU = "inset 2px 2px 0 #fff, inset -2px -2px 0 #808080, inset 0 0 0 1px light-dark(rgb(0 0 0 / .25), rgb(255 255 255 / .15))"

const GRILLES: Record<keyof Famille, string[]> = {
  travail: [
    "................",
    ".KKKKKKKKKKKKKK.",
    ".KWWWWWWWWWWWDK.",
    ".KWNNNNNNNNNNDK.",
    ".KWNCCNNNNNNNDK.",
    ".KWNCNNNNNNNNDK.",
    ".KWNNNNNNPPNNDK.",
    ".KWNNNNNNPPNNDK.",
    ".KWNNNNNNNNNNDK.",
    ".KWDDDDDDDDDDDK.",
    ".KKKKKKKKKKKKKK.",
    "......KGGK......",
    "....KKGGGGKK....",
    "...KWWWWWWWDK...",
    "...KKKKKKKKKK...",
    "................",
  ],
  maison: [
    "................",
    ".......KK.......",
    "......KRRK......",
    ".....KRRRRK.....",
    "....KRRRRRRK....",
    "...KRRRRRRRRK...",
    "..KRRRRRRRRRRK..",
    ".KKKKKKKKKKKKKK.",
    "..KWWWWWWWWWWK..",
    "..KWPPWPPWWWWK..",
    "..KWPPPPPWKKKK..",
    "..KWWPPPWWKYYK..",
    "..KWWWPWWWKYYK..",
    "..KWWWWWWWKYYK..",
    "..KKKKKKKKKKKK..",
    "................",
  ],
  projets: [
    "................",
    "................",
    ".KKKKK..........",
    "KYYYYYK.........",
    "KYYYYYYKKKKKKKK.",
    "KYYYWWWWWWWWYYK.",
    "KYYYWBBBBWWWYYK.",
    "KYYYWWWBBBBWYYK.",
    "KKKKKKKKKKKKKKKK",
    "KYYYYYYYYYYYYYYK",
    "KYYYYYYYYYYYYYYK",
    "KYYYYYYYYYYYYYYK",
    "KYYYYYYYYYYYYYYK",
    "KOOOOOOOOOOOOOOK",
    "KKKKKKKKKKKKKKKK",
    "................",
  ],
  parcours: [
    "................",
    "................",
    "................",
    "KKKKKKKKKKKKKKKK",
    "KNNNNNNNNNNNGGGK",
    "KNWWWWNNNNNNGKGK",
    "KNNNNNNNNNNNGGGK",
    "KGGGGGGGGGGGGGGK",
    "KGDDDDDDDDDDDDWK",
    "KGDPPGPPGPPGGGWK",
    "KGDPPGPPGPPGGGWK",
    "KGDWWWWWWWWWWWWK",
    "KGGGGGGGGGGGGGGK",
    "KKKKKKKKKKKKKKKK",
    "................",
    "................",
  ],
  atelier: [
    "................",
    "....KKKKKK......",
    "..KKWWWWWWKK....",
    ".KWWRRWWLLWWK...",
    ".KWWRRWWLLWWWK..",
    "KWWWWWWWWWWWWK..",
    "KWCCWWWWWKKWWWK.",
    "KWCCWWWWK..KWWK.",
    "KWWWWWWWK..KWK..",
    "KWPPWWWWWKKWWK..",
    ".KPPWWWYYWWWK...",
    ".KWWWWWYYWWK..KK",
    "..KKWWWWWKK..KNK",
    "....KKKKK...KNK.",
    "...........KNK..",
    "..........KK....",
  ],
  cursus: [
    "................",
    "................",
    ".......KK.......",
    ".....KKBBKK.....",
    "...KKBBBBBBKK...",
    ".KKBBBBBBBBBBKK.",
    "KBBBBBBBBBBBBBBK",
    ".KKBBBBBBBBBBKKP",
    "...KKBBBBBBKK..P",
    "...KNKKBBKKNK..P",
    "...KNNNKKNNNK.PP",
    "...KNNNNNNNNK.PP",
    "...KNNNNNNNNK...",
    "....KKKKKKKK....",
    "................",
    "................",
  ],
  contact: [
    "....KKKKKKKK....",
    "...KBBBBBBBBK...",
    "...KBKKKKKKBK...",
    "...KBKLLLLKBK...",
    "...KBKLKKLKBK...",
    "...KBKLLLLKBK...",
    "...KBKKKKKKBK...",
    "...KBBBWWBBBK...",
    "...KBWBBBBWBK...",
    "...KBBBWWBBBK...",
    "...KBWBWWBWBK...",
    "...KBBBBBBBBK...",
    "...KBWBWWBWBK...",
    "...KBBBBBBBBK...",
    "....KKKKKKKK....",
    "................",
  ],
  email: [
    "................",
    "................",
    "................",
    "KKKKKKKKKKKKKKKK",
    "KWKWWWWWWWWWWKWK",
    "KWWKWWWWWWWWKWWK",
    "KWWWKWWWWWWKWWWK",
    "KWWWWKWWWWKWWWWK",
    "KWWWWWKPPKWWWWWK",
    "KWWWWWWKKWWWWWWK",
    "KWWWWWWWWWWWWWWK",
    "KWWWWWWWWWWWWWWK",
    "KKKKKKKKKKKKKKKK",
    "................",
    "................",
    "................",
  ],
  linkedin: [
    "................",
    ".KKKKKKKKKKKKKK.",
    "KNNNNNNNNNNNNNNK",
    "KNNWWNNNNNNNNNNK",
    "KNNWWNNNNNNNNNNK",
    "KNNNNNNNNNNNNNNK",
    "KNNWWNWWNWWWNNNK",
    "KNNWWNWWWWWWWNNK",
    "KNNWWNWWWNNWWNNK",
    "KNNWWNWWNNNWWNNK",
    "KNNWWNWWNNNWWNNK",
    "KNNWWNWWNNNWWNNK",
    "KNNNNNNNNNNNNNPK",
    "KNNNNNNNNNNNNPPK",
    ".KKKKKKKKKKKKKK.",
    "................",
  ],
  cv: [
    "................",
    "..KKKKKKKKK.....",
    "..KWWWWWWWKK....",
    "..KWWWWWWWKWK...",
    "..KWWWWWWWKKKK..",
    "..KWWWWWWWWWWK..",
    "..KWPPPWPWPWWK..",
    "..KWPWWWPWPWWK..",
    "..KWPWWWPWPWWK..",
    "..KWPWWWWPWWWK..",
    "..KWPPPWWPWWWK..",
    "..KWWWWWWWWWWK..",
    "..KWDDDDDDDWWK..",
    "..KWDDDDDWWWWK..",
    "..KKKKKKKKKKKK..",
    "................",
  ],
  radio: [
    "................",
    ".....KKKKKK.....",
    "...KKCCCPPPKK...",
    "..KCCWCCPPPPPK..",
    ".KCCWCCCPPPPPPK.",
    ".KCCCCCCPPPPPPK.",
    "KCCCCCKKKKPPPPPK",
    "KCCCCKW..WKPPPPK",
    "KYYYYKW..WKLLLLK",
    "KYYYYYKKKKLLLLLK",
    ".KYYYYYYLLLLLLK.",
    ".KYYYYYYLLLLLLK.",
    "..KYYYYYLLLLLK..",
    "...KKYYYLLLKK...",
    ".....KKKKKK.....",
    "................",
  ],
  reglages: [
    "................",
    "..KKKK..........",
    "..KPPK..........",
    "KKKPPKKKKKKKKKKK",
    "..KKKK..........",
    "................",
    ".........KKKK...",
    ".........KCCK...",
    "KKKKKKKKKCCKKKKK",
    ".........KKKK...",
    "................",
    ".....KKKK.......",
    ".....KYYK.......",
    "KKKKKKYYKKKKKKKK",
    ".....KKKK.......",
    "................",
  ],
  accueil: [
    "................",
    "...T......PPP...",
    "...T.....P...P..",
    "..T.T...P.....P.",
    "..T.T...P.....P.",
    ".T...T..P.....P.",
    ".T...T...P...P..",
    "TTTTTTT...PPP...",
    "................",
    "N.....N..OOOOOOO",
    ".N...N...O.....O",
    "..N.N....O.....O",
    "...N.....O.....O",
    "..N.N....O.....O",
    ".N...N...O.....O",
    "N.....N..OOOOOOO",
  ],
}

/* Une ligne de pixels de même couleur devient un seul rectangle :
   quelques dizaines de nœuds par icône au lieu de 256. */
function rectangles(grille: string[]) {
  const sortie: { x: number; y: number; l: number; c: string }[] = []
  grille.forEach((ligne, y) => {
    let x = 0
    while (x < ligne.length) {
      const lettre = ligne[x]
      let fin = x
      while (ligne[fin + 1] === lettre) fin++
      if (PALETTE[lettre]) sortie.push({ x, y, l: fin - x + 1, c: PALETTE[lettre] })
      x = fin + 1
    }
  })
  return sortie
}

function Pixel({ grille, size }: { grille: string[]; size?: number }) {
  const cote = COTE + 2 * MARGE
  return (
    <Tuile size={size} fond="#c0c0c0" relief={BISEAU}>
      <svg viewBox={`${-MARGE} ${-MARGE} ${cote} ${cote}`} width="100%" height="100%" shapeRendering="crispEdges">
        {rectangles(grille).map(({ x, y, l, c }) => <rect key={`${x}-${y}`} x={x} y={y} width={l} height={1} fill={c} />)}
      </svg>
    </Tuile>
  )
}

const icone = (nom: keyof Famille) => function IconePixel({ size }: IconeProps) {
  return <Pixel grille={GRILLES[nom]} size={size} />
}

export const pixel: Famille = Object.fromEntries(
  Object.keys(GRILLES).map((nom) => [nom, icone(nom as keyof Famille)]),
) as Famille

