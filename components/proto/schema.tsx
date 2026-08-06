import { useId } from "react"

/* ==================================================================
   PRIMITIVES DE SCHÉMA — la géométrie se CALCULE, elle ne se pose pas.

   POURQUOI CE MODULE EXISTE. Les trois schémas qui tiennent déjà dans
   ce document (`experience.tsx` et son objet G, `telemetrie.tsx` et ses
   BASE/BANDES, `etudes.tsx` et sa fonction x()) partagent une seule
   discipline : aucune coordonnée n'est écrite à la main, tout descend
   de constantes nommées. Chacun l'a réinventée dans son coin, et
   `atelier.tsx` — le seul qui pose ses chiffres à la main — est aussi
   le seul dont un libellé plus long casserait le dessin. Ce module
   donne la discipline une fois pour toutes.

   LA RÈGLE DU MODULE : un auteur de schéma déclare des ANCRES —
   une colonne, une rangée, un identifiant de nœud — jamais un x ni un
   y. Toute coordonnée est dérivée. Changer un libellé, ajouter un
   nœud ou traduire le schéma ne peut donc pas décaler une flèche.

   L'ACCROCHAGE. Une flèche entre deux boîtes coupe les BORDS, jamais
   les centres : on prend le vecteur centre→centre et on l'intersecte
   avec chaque rectangle. C'est ce que fait `bord()`, et c'est le
   défaut exact que la recherche 01 relève sur l'AnimatedBeam de
   magicui (besoin 4), qui vise les centres et laisse la pointe flotter
   dans la boîte.

   PIÈGE MAISON — collision CSS/SVG. En SVG2 les propriétés CSS
   width/height/x/y/r battent les attributs de présentation : une règle
   HTML homonyme réécrit la géométrie d'un <rect>. Le piège est déjà
   documenté deux fois dans le dépôt (`ortho.tsx:19-23`,
   `telemetrie.tsx:35-36`, et rappelé par `specifications.tsx:18-20`).
   D'où le `prefixe` obligatoire de <Planche> : chaque schéma garde son
   espace de noms, et AUCUNE règle `.<prefixe>-*` ne déclare width,
   height, x, y ni r.

   ANIMATION : aucune ici. Ce module ne produit que de la géométrie
   statique ; le mouvement autour d'un schéma est une décision de
   feuille, pas de primitive.
   ================================================================== */

/* ------------------------------------------------------------------
   1. MÉTRIQUES DU TEXTE

   Le seul endroit du module qui SUPPOSE quelque chose du rendu. La
   police mono du document (JetBrains Mono) a une avance constante, donc
   la largeur d'un libellé est calculable — mais une valeur fausse
   ferait déborder le texte de sa boîte sans prévenir. Ces trois
   nombres sont donc MESURÉS au navigateur, police chargée, et non
   supposés : voir `.scratch/planche-profonde/recherches/10-primitives-svg.md`
   §2 pour la commande et le relevé.
   ------------------------------------------------------------------ */
export const MONO = {
  taille: 9, // px, aligné sur .xp-t / .tel-t
  avance: 0.701, // em par caractère : 0,600 d'avance JetBrains Mono + 0,100 de letter-spacing
  montee: 1.07, // em du haut de la boîte de texte au baseline
  hauteur: 1.39, // em de hauteur totale de la boîte de texte
}

export const largeurTexte = (s: string) => s.length * MONO.taille * MONO.avance
export const hauteurTexte = () => MONO.taille * MONO.hauteur

/* ------------------------------------------------------------------
   2. COTES DU GABARIT

   Ce sont les seules valeurs choisies du module. Tout le reste en
   descend. Elles vivent ici et nulle part ailleurs.
   ------------------------------------------------------------------ */
const PAD_X = 10 // air horizontal dans une boîte
const PAD_Y = 7 // air vertical dans une boîte
/* Interligne : il DOIT dépasser la hauteur mesurée d'une ligne
   (1,39 em = 12,5 px à 9 px) sinon deux lignes d'une même boîte se
   touchent — le défaut que `etudes.tsx:122-124` a payé une fois. */
const LH = 14
const GOUT = 46 // gouttière entre deux colonnes — doit loger une flèche + sa pointe
const INTERRANG = 26 // entre deux rangées d'une même bande
const SAUT = 26 // supplément entre deux bandes, pour loger le titre de groupe
const MARGE = 14 // air autour du dessin dans le viewBox
const TETE = 7 // longueur de la pointe de flèche
const ECART = 5 // air minimal exigé autour d'une étiquette
const PAD_G = 11 // air entre un cadre de groupe et ses membres
const RECUL_COTE = 22 // sous la boîte la plus basse, la ligne de cote
/* La rangée d'un bus loge ses DEUX lignes de libellé au-dessus du
   tronc, jamais en dessous : en dessous, elles tomberaient dans la
   descente des embranchements de sortie. */
const BUS_H = 2 * LH + 4

/* `Math.max(...[])` rend -Infinity, et le viewBox émis contient alors
   Infinity ou NaN : le SVG sort VIDE, pas faux — rien ne lève, rien ne
   le dit, `next build` passe. Une rangée sans nœud, une colonne sans
   nœud (« sauter une colonne pour espacer deux blocs ») ou un nœud sans
   ligne sont des erreurs d'auteur : on refuse de dessiner, comme pour
   les embranchements superposés et le groupe vide. */
const maxi = (vals: number[], quoi: string) => {
  if (vals.length === 0) throw new Error(`schema : ${quoi}`)
  return Math.max(...vals)
}

/* Arrondi d'émission. Deux décimales suffisent au dessin et bornent
   l'écart d'accrochage : une extrémité et un bord arrondis chacun à
   ±0,005 ne peuvent pas s'écarter de plus de 0,01 unité de dessin. */
const n = (v: number) => Math.round(v * 100) / 100

/* ------------------------------------------------------------------
   3. TYPES — ce que l'auteur d'un schéma déclare
   ------------------------------------------------------------------ */
export type Rect = { x: number; y: number; l: number; h: number }
export type Pt = { x: number; y: number }

/** Un nœud : une position dans la grille, et ses lignes de texte.
 *  La première ligne est le titre, les suivantes sont des précisions. */
export type Noeud = { id: string; col: number; rang: number; lignes: string[]; accent?: boolean }

/** Un lien : deux identifiants de nœud. Aucune coordonnée. */
export type Lien = { de: string; vers: string; etiquette?: string }

/** Un bus : un tronc horizontal sur une rangée à lui, alimenté par des
 *  nœuds du dessus (`entrees`) et alimentant des nœuds du dessous
 *  (`sorties`). Chaque raccordement est un EMBRANCHEMENT. */
export type Bus = { rang: number; lignes: [string, string]; entrees: string[]; sorties: string[] }

/** Un groupe : une bande de rangées. Le cadre se déduit des membres. */
export type Groupe = { num: string; titre: string; rangs: [number, number] }

/** Une cote : la mesure de l'écart entre deux nœuds. */
export type Cote = { de: string; vers: string; texte: string }

export type Plan = {
  noeuds: Noeud[]
  liens: Lien[]
  bus?: Bus
  groupes?: Groupe[]
  cotes?: Cote[]
  legende?: [string, string][]
}

/* ------------------------------------------------------------------
   4. TYPES — ce que le module rend
   ------------------------------------------------------------------ */
export type Texte = { texte: string; x: number; y: number; ancrage: "start" | "middle" }
export type Boite = { id: string; rect: Rect; lignes: Texte[]; accent: boolean }
export type Fleche = { de: string; vers: string; d: string; tete: string; etiquette: Texte | null }
export type Branche = { noeud: string; sens: "entree" | "sortie"; d: string; tete: string; bout: Pt }
export type DessinBus = { x1: number; x2: number; y: number; titre: Texte; roles: Texte; branches: Branche[] }
export type DessinCote = { attaches: [string, string]; x1: number; x2: number; y: number; fleches: [string, string]; etiquette: Texte }
export type DessinGroupe = { rect: Rect; num: Texte; titre: Texte }
export type DessinLegende = { puce: Rect; num: Texte; texte: Texte }
export type Dessin = {
  viewBox: string
  boites: Boite[]
  bus: DessinBus | null
  fleches: Fleche[]
  cotes: DessinCote[]
  groupes: DessinGroupe[]
  legende: DessinLegende[]
}

/* ------------------------------------------------------------------
   5. GÉOMÉTRIE ÉLÉMENTAIRE
   ------------------------------------------------------------------ */
const cx = (r: Rect) => r.x + r.l / 2
const cy = (r: Rect) => r.y + r.h / 2

/** LE point d'accrochage : intersection du rayon (dx,dy) partant du
 *  centre de `r` avec le bord de `r`. Exact pour toute direction, y
 *  compris les diagonales d'un faisceau convergent — c'est ce qui
 *  interdit à une pointe de flotter dans la boîte. */
function bord(r: Rect, dx: number, dy: number): Pt {
  const tx = dx === 0 ? Number.POSITIVE_INFINITY : r.l / 2 / Math.abs(dx)
  const ty = dy === 0 ? Number.POSITIVE_INFINITY : r.h / 2 / Math.abs(dy)
  const t = Math.min(tx, ty)
  return { x: cx(r) + dx * t, y: cy(r) + dy * t }
}

/** Pointe de flèche : sommet en P, orientée par le vecteur unitaire u.
 *  L'orientation vient donc du tracé, jamais d'un angle écrit. */
function tete(p: Pt, ux: number, uy: number): string {
  const bx = p.x - ux * TETE
  const by = p.y - uy * TETE
  const w = TETE * 0.38
  return `M${n(p.x)} ${n(p.y)} L${n(bx - uy * w)} ${n(by + ux * w)} L${n(bx + uy * w)} ${n(by - ux * w)} Z`
}

const chevauche = (a: Rect, b: Rect, m = 0) =>
  a.x - m < b.x + b.l + m && b.x - m < a.x + a.l + m && a.y - m < b.y + b.h + m && b.y - m < a.y + a.h + m

/** Boîte englobante d'un texte, à partir de son baseline. */
function bbox(t: Texte): Rect {
  const l = largeurTexte(t.texte)
  const h = hauteurTexte()
  return { x: t.ancrage === "middle" ? t.x - l / 2 : t.x, y: t.y - MONO.taille * MONO.montee, l, h }
}

const union = (a: Rect, b: Rect): Rect => {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, l: Math.max(a.x + a.l, b.x + b.l) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }
}

/* ------------------------------------------------------------------
   6. LE CALCUL

   Ordre imposé : les boîtes d'abord (elles fixent la grille), puis ce
   qui s'y accroche, et les étiquettes libres en DERNIER — elles sont
   les seules à pouvoir se déplacer, donc les seules à céder.
   ------------------------------------------------------------------ */
export function dessiner(plan: Plan): Dessin {
  const { noeuds, liens } = plan

  /* --- 6.1 taille intrinsèque de chaque nœud : elle vient du texte --- */
  const taille = new Map<string, { l: number; h: number }>()
  for (const nd of noeuds) {
    const l = maxi(nd.lignes.map(largeurTexte), `le nœud « ${nd.id} » n'a aucune ligne`) + 2 * PAD_X
    taille.set(nd.id, { l, h: nd.lignes.length * LH + 2 * PAD_Y })
  }

  /* --- 6.2 la grille : largeur d'une colonne = son nœud le plus large --- */
  const nbCol = Math.max(...noeuds.map((d) => d.col)) + 1
  const nbRang = Math.max(...noeuds.map((d) => d.rang), plan.bus?.rang ?? 0) + 1
  const colL = Array.from({ length: nbCol }, (_, c) =>
    maxi(noeuds.filter((d) => d.col === c).map((d) => taille.get(d.id)!.l), `la colonne ${c} n'a aucun nœud`),
  )
  const rangH = Array.from({ length: nbRang }, (_, r) =>
    r === plan.bus?.rang
      ? BUS_H
      : maxi(noeuds.filter((d) => d.rang === r).map((d) => taille.get(d.id)!.h), `la rangée ${r} n'a aucun nœud`),
  )

  const colX: number[] = []
  for (let c = 0, x = 0; c < nbCol; c++) {
    colX[c] = x
    x += colL[c] + GOUT
  }
  /* Une bande commence par un saut : c'est là que se pose son titre.
     Sans ce supplément le titre du groupe tomberait sur la rangée
     précédente — exactement le piège documenté par `etudes.tsx:122-124`
     (« deux textes à 10px d'écart, illisibles »). */
  const debutsDeBande = new Set((plan.groupes ?? []).slice(1).map((g) => g.rangs[0]))
  const rangY: number[] = []
  for (let r = 0, y = 0; r < nbRang; r++) {
    if (debutsDeBande.has(r)) y += SAUT
    rangY[r] = y
    y += rangH[r] + INTERRANG
  }

  /* --- 6.3 les boîtes --- */
  const rects = new Map<string, Rect>()
  const boites: Boite[] = noeuds.map((nd) => {
    const t = taille.get(nd.id)!
    const rect: Rect = {
      x: colX[nd.col] + (colL[nd.col] - t.l) / 2,
      y: rangY[nd.rang] + (rangH[nd.rang] - t.h) / 2,
      l: t.l,
      h: t.h,
    }
    rects.set(nd.id, rect)
    return {
      id: nd.id,
      rect,
      accent: !!nd.accent,
      lignes: nd.lignes.map((s, i) => ({
        texte: s,
        x: rect.x + PAD_X,
        y: rect.y + PAD_Y + MONO.taille * MONO.montee + i * LH,
        ancrage: "start" as const,
      })),
    }
  })

  const rectDe = (id: string): Rect => {
    const r = rects.get(id)
    if (!r) throw new Error(`schema : nœud inconnu « ${id} »`)
    return r
  }

  /* L'occupation sert au placement des étiquettes libres. Les boîtes y
     entrent d'office : une étiquette ne se pose jamais sur un nœud. */
  const occupation: Rect[] = boites.map((b) => b.rect)

  /* --- 6.4 le bus et ses embranchements --- */
  let bus: DessinBus | null = null
  if (plan.bus) {
    const b = plan.bus
    const y = rangY[b.rang] + 2 * LH + 2
    const branche = (id: string, sens: "entree" | "sortie"): Branche => {
      const r = rectDe(id)
      const x = cx(r)
      // l'embranchement part du bord, pas du centre — même règle que les flèches
      const depuis = sens === "entree" ? r.y + r.h : y
      const vers = sens === "entree" ? y : r.y
      const uy = Math.sign(vers - depuis)
      return {
        noeud: id,
        sens,
        d: `M${n(x)} ${n(depuis)} L${n(x)} ${n(vers)}`,
        tete: tete({ x, y: vers }, 0, uy),
        bout: { x: n(x), y: n(vers) },
      }
    }
    const branches = [...b.entrees.map((id) => branche(id, "entree")), ...b.sorties.map((id) => branche(id, "sortie"))]
    /* Deux embranchements du MÊME CÔTÉ sur la même verticale se
       superposeraient et le schéma mentirait sans qu'on le voie : on
       refuse de dessiner plutôt que de dessiner faux. Une entrée et une
       sortie alignées, en revanche, se lisent comme une traversée —
       elles sont de part et d'autre du tronc. */
    for (const s of ["entree", "sortie"] as const) {
      const xs = branches.filter((br) => br.sens === s).map((br) => br.bout.x)
      if (new Set(xs).size !== xs.length) throw new Error(`schema : deux embranchements « ${s} » sur la même verticale`)
    }

    // le tronc s'arrête au DERNIER raccordement — un bus qui continue
    // dans le vide annonce une suite qui n'existe pas (`experience.tsx:42-44`)
    const x1 = Math.min(...branches.map((br) => br.bout.x))
    const x2 = Math.max(...branches.map((br) => br.bout.x))
    const titre: Texte = { texte: b.lignes[0], x: x1 + 6, y: rangY[b.rang] + MONO.taille * MONO.montee, ancrage: "start" }
    const roles: Texte = { texte: b.lignes[1], x: x1 + 6, y: titre.y + LH, ancrage: "start" }
    bus = { x1, x2, y, titre, roles, branches }
    occupation.push(bbox(titre), bbox(roles))
  }

  /* --- 6.5 les groupes : une bande de rangées, cadre déduit --- */
  const contenuX = Math.min(...boites.map((b) => b.rect.x))
  const contenuX2 = Math.max(...boites.map((b) => b.rect.x + b.rect.l))
  const groupes: DessinGroupe[] = (plan.groupes ?? []).map((g) => {
    const membres = boites.filter((b) => {
      const nd = noeuds.find((d) => d.id === b.id)!
      return nd.rang >= g.rangs[0] && nd.rang <= g.rangs[1]
    })
    /* Une bande peut ne contenir que le bus (c'est le cas du transport
       d'Eternal) : le cadre se prend alors sur le tronc et ses libellés,
       sinon `Math.min` d'une liste vide rendrait l'infini. */
    let haut = Number.POSITIVE_INFINITY
    let bas = Number.NEGATIVE_INFINITY
    for (const m of membres) {
      haut = Math.min(haut, m.rect.y)
      bas = Math.max(bas, m.rect.y + m.rect.h)
    }
    if (bus && plan.bus!.rang >= g.rangs[0] && plan.bus!.rang <= g.rangs[1]) {
      haut = Math.min(haut, bbox(bus.titre).y)
      bas = Math.max(bas, bus.y)
    }
    if (!Number.isFinite(haut)) throw new Error(`schema : le groupe « ${g.titre} » ne contient rien`)
    const rect: Rect = { x: contenuX - PAD_G, y: haut - PAD_G, l: contenuX2 - contenuX + 2 * PAD_G, h: bas - haut + 2 * PAD_G }
    const num: Texte = { texte: g.num, x: rect.x, y: rect.y - 5, ancrage: "start" }
    const titre: Texte = { texte: g.titre, x: rect.x + largeurTexte(g.num) + 8, y: rect.y - 5, ancrage: "start" }
    occupation.push(bbox(num), bbox(titre))
    return { rect, num, titre }
  })

  /* --- 6.6 les cotes --- */
  const cotes: DessinCote[] = (plan.cotes ?? []).map((c) => {
    const a = rectDe(c.de)
    const b = rectDe(c.vers)
    const y = Math.max(a.y + a.h, b.y + b.h) + RECUL_COTE
    const xa = cx(a)
    const xb = cx(b)
    const [g, d] = xa < xb ? [xa, xb] : [xb, xa]
    const etiquette: Texte = { texte: c.texte, x: (g + d) / 2, y: y - 6, ancrage: "middle" }
    occupation.push(bbox(etiquette))
    return {
      attaches: [
        `M${n(xa)} ${n(a.y + a.h)} L${n(xa)} ${n(y + 6)}`,
        `M${n(xb)} ${n(b.y + b.h)} L${n(xb)} ${n(y + 6)}`,
      ],
      x1: g,
      x2: d,
      y,
      fleches: [tete({ x: g, y }, -1, 0), tete({ x: d, y }, 1, 0)],
      etiquette,
    }
  })

  /* --- 6.7 les flèches, et le placement des étiquettes libres --- */
  const fleches: Fleche[] = liens.map((li) => {
    const a = rectDe(li.de)
    const b = rectDe(li.vers)
    const dx = cx(b) - cx(a)
    const dy = cy(b) - cy(a)
    const p1 = bord(a, dx, dy)
    const p2 = bord(b, -dx, -dy)
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1
    const ux = (p2.x - p1.x) / len
    const uy = (p2.y - p1.y) / len

    let etiquette: Texte | null = null
    if (li.etiquette) {
      /* PLACEMENT PAR FORMULE, puis PREMIER LIBRE. Le milieu du trait
         décalé perpendiculairement — au-dessus d'abord, en dessous
         ensuite, puis plus loin. On essaie, on mesure, on garde la
         première position qui ne recoupe rien. Une intention de ne pas
         chevaucher n'est pas une règle ; celle-ci se vérifie.
         ponytail: premier-libre en O(n²) sur les étiquettes ; passer à
         un vrai placeur si un schéma dépasse la cinquantaine. */
      const mx = (p1.x + p2.x) / 2
      const my = (p1.y + p2.y) / 2
      const pas = hauteurTexte() / 2 + ECART
      // (-uy, ux) est la perpendiculaire au trait : le décalage suit le
      // vecteur, il ne suppose pas que la flèche est horizontale
      const cand = [1, -1, 2, -2, 3, -3].map((k) => {
        const centreX = mx - uy * pas * k
        const centreY = my + ux * pas * k
        return {
          texte: li.etiquette!,
          x: centreX,
          y: centreY - hauteurTexte() / 2 + MONO.taille * MONO.montee,
          ancrage: "middle" as const,
        }
      })
      etiquette = cand.find((t) => !occupation.some((o) => chevauche(bbox(t), o, ECART))) ?? cand[cand.length - 1]
      occupation.push(bbox(etiquette))
    }

    return {
      de: li.de,
      vers: li.vers,
      d: `M${n(p1.x)} ${n(p1.y)} L${n(p2.x)} ${n(p2.y)}`,
      tete: tete(p2, ux, uy),
      etiquette,
    }
  })

  /* --- 6.8 la légende, puis le viewBox --- */
  let cadre: Rect = boites.map((b) => b.rect).reduce(union)
  for (const g of groupes) cadre = union(union(cadre, g.rect), union(bbox(g.num), bbox(g.titre)))
  if (bus) cadre = union(cadre, { x: bus.x1, y: bus.y - 1, l: bus.x2 - bus.x1, h: 2 })
  for (const c of cotes) cadre = union(cadre, union(bbox(c.etiquette), { x: c.x1, y: c.y, l: c.x2 - c.x1, h: 1 }))
  for (const f of fleches) if (f.etiquette) cadre = union(cadre, bbox(f.etiquette))

  const legende: DessinLegende[] = (plan.legende ?? []).map(([num, texte], i) => {
    const y = cadre.y + cadre.h + 24 + i * (LH + 4)
    const puce: Rect = { x: cadre.x, y: y - 8, l: 11, h: 11 }
    return {
      puce,
      num: { texte: num, x: puce.x + 3, y: y, ancrage: "start" },
      texte: { texte, x: puce.x + 19, y, ancrage: "start" },
    }
  })
  for (const l of legende) cadre = union(cadre, union(l.puce, bbox(l.texte)))

  return {
    viewBox: `${n(cadre.x - MARGE)} ${n(cadre.y - MARGE)} ${n(cadre.l + 2 * MARGE)} ${n(cadre.h + 2 * MARGE)}`,
    boites,
    bus,
    fleches,
    cotes,
    groupes,
    legende,
  }
}

/* ------------------------------------------------------------------
   7. LE RENDU

   Un seul composant pour tous les schémas. `prefixe` est obligatoire :
   c'est lui qui isole l'espace de noms CSS (voir l'en-tête).
   ------------------------------------------------------------------ */
export function Planche({ plan, prefixe, titre }: { plan: Plan; prefixe: string; titre: string }) {
  const d = dessiner(plan)
  const p = prefixe
  /* L'identifiant du <title> ne peut PAS descendre du seul préfixe :
     deux instances du même schéma sur une page (FR + EN, par exemple)
     donneraient deux `id` identiques — HTML invalide, et les deux <svg>
     seraient étiquetés par le premier titre, donc le schéma anglais
     annoncé en français au lecteur d'écran. `useId` rend un identifiant
     par instance, stable entre serveur et client. */
  const id = `${p}-titre-${useId()}`

  /* L'ancrage est émis en ATTRIBUT et jamais laissé au CSS : c'est lui
     qui décide où tombe la boîte englobante du texte, donc la règle de
     non-chevauchement le calcule. Le laisser à une feuille de style
     rendrait le calcul faux sans rien casser de visible tout de suite. */
  const Mot = ({ t, classe }: { t: Texte; classe: string }) => (
    <text className={classe} x={t.x} y={t.y} textAnchor={t.ancrage}>
      {t.texte}
    </text>
  )

  return (
    <svg viewBox={d.viewBox} className={`${p}-svg`} role="img" aria-labelledby={id}>
      <title id={id}>{titre}</title>

      {d.groupes.map((g, i) => (
        <g key={i}>
          <rect className={`${p}-groupe`} x={g.rect.x} y={g.rect.y} width={g.rect.l} height={g.rect.h} />
          <Mot t={g.num} classe={`${p}-t ${p}-t-num`} />
          <Mot t={g.titre} classe={`${p}-t ${p}-t-groupe`} />
        </g>
      ))}

      {d.bus && (
        <g>
          <line className={`${p}-bus`} x1={d.bus.x1} y1={d.bus.y} x2={d.bus.x2} y2={d.bus.y} />
          <Mot t={d.bus.titre} classe={`${p}-t ${p}-t-titre`} />
          <Mot t={d.bus.roles} classe={`${p}-t ${p}-t-sous`} />
          {d.bus.branches.map((b) => (
            <g key={`${b.noeud}-${b.sens}`} data-branche={b.noeud} data-sens={b.sens}>
              <path className={`${p}-fil`} d={b.d} />
              <path className={`${p}-tete`} d={b.tete} />
            </g>
          ))}
        </g>
      )}

      {d.fleches.map((f) => (
        <g key={`${f.de}-${f.vers}`} data-de={f.de} data-vers={f.vers}>
          <path className={`${p}-fil`} d={f.d} />
          <path className={`${p}-tete`} d={f.tete} />
          {f.etiquette && <Mot t={f.etiquette} classe={`${p}-t ${p}-t-etq`} />}
        </g>
      ))}

      {d.cotes.map((c, i) => (
        <g key={i}>
          {c.attaches.map((a, j) => (
            <path key={j} className={`${p}-attache`} d={a} />
          ))}
          <line className={`${p}-cote`} x1={c.x1} y1={c.y} x2={c.x2} y2={c.y} />
          {c.fleches.map((f, j) => (
            <path key={j} className={`${p}-cote-f`} d={f} />
          ))}
          <Mot t={c.etiquette} classe={`${p}-t ${p}-t-cote`} />
        </g>
      ))}

      {d.boites.map((b) => (
        <g key={b.id} data-boite={b.id}>
          <rect className={`${p}-boite${b.accent ? ` ${p}-accent` : ""}`} x={b.rect.x} y={b.rect.y} width={b.rect.l} height={b.rect.h} />
          {b.lignes.map((t, i) => (
            <Mot key={i} t={t} classe={`${p}-t ${i === 0 ? `${p}-t-titre` : `${p}-t-sous`}`} />
          ))}
        </g>
      ))}

      {d.legende.map((l, i) => (
        <g key={i}>
          <rect className={`${p}-puce`} x={l.puce.x} y={l.puce.y} width={l.puce.l} height={l.puce.h} />
          <Mot t={l.num} classe={`${p}-t ${p}-t-num`} />
          <Mot t={l.texte} classe={`${p}-t ${p}-t-leg`} />
        </g>
      ))}
    </svg>
  )
}
