/* ENGENDRÉ par `node tools/pixel/dessine.mjs` — NE PAS ÉDITER À LA MAIN.
   Le geste qui dessine ces grilles (polylignes, sprites, semis de
   fenêtres) vit dans l'outil ; ici ne vit que son résultat, figé et
   déterministe. Un caractère = un pixel, '.' = transparent.

   Pièces du monde MAISON (#37) : la branche de cerisier du hero « boot »
   et la fenêtre du hero « fenêtre ». Références : le feed Pinterest de
   Hugo (moisson du 2026-08-27). */

/* la palette : un caractère → une couleur. Les deux pièces la partagent
   — c'est ce qui fait qu'elles appartiennent au même monde. */
export const PALETTE: Record<string, string> = {
  b: "#2f2740", // branche
  B: "#5a4c74", // arête claire de la branche
  p: "#f58ab8", // pétale
  P: "#ffc2dc", // pétale clair
  y: "#ffe27a", // cœur
  s: "#fff3c4", // étincelle
  "0": "#f4b2ca", // ciel — l'horizon chaud
  "1": "#e294be",
  "2": "#c082c0",
  "3": "#946eba",
  "4": "#64549e",
  "5": "#383066", // ciel — le zénith
  n: "#18122e", // la nuit sous l'horizon
  m: "#fff6d6", // la lune
  c: "#342a56", // ville, plan lointain
  C: "#1c1636", // ville, plan proche
  w: "#ffd68a", // fenêtre allumée
  W: "#fff0c8", // fenêtre allumée, vive
  f: "#f2f0fd", // châssis, arête éclairée
  F: "#8278b0", // châssis
}

export const SAKURA: readonly string[] = [
  "...........................................................P.P..",
  "................................................P.P.......PpppP.",
  "...............s...................p.......b...PpppP.......pypBB",
  "..............sss.................pPp......bb...pyp......BPpppPb",
  "...............s...................p....P.P.bb.PpppP.BBBBbbPbPbb",
  "...................p.............P.P...PpppP.b..PBPBBbbbbbbbb...",
  "..................pPp....P.P....PpppP...pyp.BBBBbbbbbbPbP.......",
  "...................p....PpppP....pyp...PpppPbbbbbbbbbPpppP....p.",
  "...........p.............pyp....PpppPBBBPbPbbPbP......pyp....pPp",
  "..........pPp....P.P....PpppP..BBPBPbbbbbbbbPpppP....PpppP....p.",
  "...........p....PpppP....P.PBBBbbbb..bbb.....pyp......P.P.......",
  ".....b..P.P......pyp...bBBBbbbb.b....P.P....PpppP..p............",
  ".....bbPpppP....PpppPbbbbbb..P.Pbb..PpppP....P.P..pPp....s......",
  "......bbpyp....bbPbPbbP.P...PpppPb...pyp...........p....sss.....",
  ".......PpppPbbbbbbbbbPpppP...pyp.bb.PpppP..p.............s......",
  ".......bPbPbbbb.....b.pyp...PpppP.b..P.P..pPp...............Pp..",
  "....bbbbbbb..P.P....bPpppP...P.P...........p....................",
  "..bbbbbp....PpppP....bP.P..p....................Pp..............",
  "..bP.PpPp....pyp.....b....pPp...................................",
  "..PpppPp....PpppP..........p...s......................Pp........",
  "...pyp.......P.P..............sss.......Pp......................",
  "..PpppP..Pp............Pp......s................................",
  "...P.P.........Pp................Pp.............................",
  "................................................................",
]

export const FENETRE: readonly string[] = [
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
  "FFffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffFF",
  "FFf55555555555555555555555555555555FF555555555555555555555555555PpppPfFF",
  "FFf55555555555555555555555555555555FF5555555555555555555555555555pypbfFF",
  "FFf55555555555555555555555555555555FF555555555555555555555555555PpppPfFF",
  "FFf4444444444mmmm444444444444444444FF444444444444444444444444444bPbP4fFF",
  "FFf444444444mmmmmm44444444444444444FF4444444444444444444444444bbbb444fFF",
  "FFf44444444mmmmmmmm4444444444444444FF44444444444444P4P44444bbbbb44444fFF",
  "FFf44444444mmmmmmmm4444444444444444FF4444444444444PpppP44bbbbb4444444fFF",
  "FFf44444444mmmmmmmm4444444444444444FF44444444444444pyp4bbbP4P44444444fFF",
  "FFf33333333mmmmmmmm3333333333333333FF3333333333333PpppPbbPpppP3333333fFF",
  "FFf333333333mmmmmm33333333333333333FF3333333333P3P3PbPb3bbpyp33333333fFF",
  "FFf3333333333mmmm333333333333333333FF333333333PpppPbb3333PpppP3333333fFF",
  "FFf33333333333333333333333333333333FF3333333333pypb333333bP3P33333333fFF",
  "FFf33333333333333333333333333333333FF333333333PpppP333333b33333333333fFF",
  "FFf22222222222222222222222222222222FF2222222222P2P22222P2Pb2222222222fFF",
  "FFf22222222222222222222222222222222FF22222222222222222PpppP2222222222fFF",
  "FFf22222222222222222222222222222222FF222222222222222222pypb2222222222fFF",
  "FFf22222222222222222222222222222222FF22222222222222222PpppP2222222222fFF",
  "FFf2222222222222222222222222222222cFFc22222222222222222P2P22222222222fFF",
  "FFf1111111111111111111111111111111cFFc1111111111111111111111ccc111111fFF",
  "FFf111111111111ccc111111111111111CCFFC1111111111111111111111ccc111111fFF",
  "FFfFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFfFF",
  "FFfFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFfFF",
  "FFfnccccnnnnnnCCCCnnnnnncccccnnnnCCFFCnnnnnnnnnnnccccnnnnnnCCCCCnnnnnfFF",
  "FFfnccccnnnnnnCCCCnnnnnncccccnnnnCWFFCnnnnnnncccnccccnnnnnnCwCwCnnnnnfFF",
  "FFfnccccnnnnnnCwCCnccccncccccnnnnCCFFCnnnnnnncCCCCCccnnnnnnCCCCCccccnfFF",
  "FFfnccccnnnnnnCCCCnccccncccCCCCnnCwFFCncccccncCCCCCccnnnnnnCwCWCccccnfFF",
  "FFfnccccnnnnnnCCCCnccccncccCCCCccCCFFCncccccncCwCwCccnnnnnnCCCCCccccnfFF",
  "FFfCCcccncccccCCCCnccccncccCwCCccCwFFCncccccncCCCCCccncccccCWCwCccccnfFF",
  "FFfCCcccncccccCwCCnccccncccCCCCccCCFFCncccccncCwCWCccCCCCccCCCCCccccnfFF",
  "FFfCCcccncccccCCCCnccccncccCCCCccCwFFCncccccncCCCCCccCCCCccCwCwCccccnfFF",
  "FFfCCcccncccccCCCCncCCCCCccCCCCccCCFFCncccccncCWCwCccCwCCccCCCCCccccnfFF",
  "FFfCCcccncccccCCCCncCCCCCccCwCCccCwFFCncCCCCncCCCCCccCCCCccCwCwCccccnfFF",
  "FFfCCccCCCCCccCWCCncCwCwCccCCCCccCCFFCncCCCCncCwCwCccCwCCccCCCCCccCCCfFF",
  "FFfCCccCCCCCccCCCCncCCCCCccCCCCccCWFFCncCwCCncCCCCCccCCCCccCwCwCccCCCfFF",
  "FFfCCccCCCwCccCCCCncCwCWCccCCCCccCCFFCncCCCCncCwCwCccCwCCccCCCCCccCCCfFF",
  "FFfCCccCCCCCccCCCCncCCCCCccCwCCccCwFFCncCwCCncCCCCCccCCCCccCwCWCccCCCfFF",
  "FFfCCccCwCCCccCwCCncCWCwCccCCCCccCCFFCncCCCCncCwCwCccCwCCccCCCCCccCwCfFF",
  "FFfCCccCCCCCccCCCCncCCCCCccCCCCccCwFFCncCwCCncCCCCCccCCCCccCWCwCccCCCfFF",
  "FFfCCccCCCwCccCCCCncCwCwCccCCCCccCCFFCncCCCCncCwCWCccCWCCccCCCCCccCCCfFF",
  "FFfCCccCCCCCccCCCCncCCCCCccCWCCccCwFFCncCwCCncCCCCCccCCCCccCwCwCccCCCfFF",
  "FFfCCccCwCCCccCwCCncCwCwCccCCCCccCCFFCncCCCCncCWCwCccCwCCccCCCCCccCWCfFF",
  "FFfCCnnCCCCCnnCCCCnnCCCCCnnCCCCnnCwFFCnnCWCCnnCCCCCnnCCCCnnCwCwCnnCCCfFF",
  "FFfCCnnCCCWCnnCCCCnnCwCwCnnCCCCnnCCFFCnnCCCCnnCwCwCnnCwCCnnCCCCCnnCCCfFF",
  "FFfCCnnCCCCCnnCCCCnnCCCCCnnCwCCnnCWFFCnnCwCCnnCCCCCnnCCCCnnCwCwCnnCCCfFF",
  "FFffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffFF",
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
]
