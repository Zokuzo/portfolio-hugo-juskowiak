import { t, type Lang } from "./dict"
import { Planche, type Plan } from "./schema"

/* ==================================================================
   SCHÉMA D'ARCHITECTURE — ETERNAL

   CE QU'IL DIT, ET POURQUOI CE DÉCOUPAGE. Le relevé du ticket 02
   compte 23 nœuds et 28 arêtes, mais il conclut aussi que la lecture
   tient en trois lignes (`recherches/02-eternal.md` §10). Dessiner les
   23 nœuds donnerait une carte exacte que personne ne lit ; ce sont
   les trois lignes qui sont dessinées :

     1. une CHAÎNE D'ÉCRITURE — un interrupteur, un contrat, une
        matière première, un rédacteur, et deux fichiers déposés ;
     2. un TRANSPORT qui n'est que du git — d'où le BUS : le dépôt est
        à la fois la base de données, le canal entre machines et
        l'hébergement, donc une seule pièce, pas trois flèches ;
     3. un RUNTIME À DEUX VUES ET UN SEUL MOTEUR — et la seule cote du
        schéma mesure l'écart entre ces deux vues : zéro règle
        dupliquée (`monde.html:1005-1006`, `grep -c setItem monde.html`
        → 0).

   La forme qui manquait à `atelier.tsx:26-50` (un cycle code → leçon →
   travail) est là : une chaîne qui se TERMINE sur un dépôt, et un
   runtime en miroir dont une des deux vues n'a aucune règle.

   AUCUNE COORDONNÉE ICI. Ce fichier ne déclare que des ancres :
   une colonne, une rangée, des identifiants. Toute la géométrie est
   calculée par `schema.tsx` — donc traduire le schéma, rallonger un
   libellé ou ajouter un nœud ne peut pas décaler une flèche.

   POURQUOI CES COLONNES-LÀ. La colonne d'un nœud n'est pas un choix
   graphique, c'est ce qui garantit que deux embranchements du bus ne
   se superposent pas : `moteur` et `manifeste` occupent des colonnes
   distinctes parce qu'ils se raccordent au même tronc. `manifeste` et
   `vue` partagent la colonne 3 EXPRÈS — la traversée qu'on lit alors
   est vraie, `monde.html` va bien chercher le manifeste
   (`recherches/02-eternal.md` E23).

   PIÈGE MAISON. Préfixe `etn-`, et aucune règle `.etn-*` de
   `planche.css` ne déclare width, height, x, y ni r.
   ================================================================== */

export function SchemaEternal({ lang }: { lang: Lang }) {
  const mots = new Map((t(lang, "etnNoeuds") as unknown as string[][]).map((l) => [l[0], l.slice(1)]))
  const groupes = t(lang, "etnGroupes") as unknown as [string, string][]
  const legende = t(lang, "etnLegende") as unknown as [string, string][]
  const lignes = (id: string) => mots.get(id) ?? []

  const plan: Plan = {
    noeuds: [
      // bande 1 — la chaîne d'écriture
      { id: "etat", col: 0, rang: 0, lignes: lignes("etat") },
      { id: "projet", col: 0, rang: 1, lignes: lignes("projet") },
      { id: "contrat", col: 0, rang: 2, lignes: lignes("contrat") },
      { id: "agent", col: 1, rang: 1, lignes: lignes("agent"), accent: true },
      { id: "fragment", col: 2, rang: 0, lignes: lignes("fragment") },
      { id: "manifeste", col: 3, rang: 2, lignes: lignes("manifeste") },
      // bande 3 — le runtime
      { id: "moteur", col: 0, rang: 4, lignes: lignes("moteur"), accent: true },
      { id: "vue", col: 3, rang: 4, lignes: lignes("vue") },
    ],
    liens: [
      // trois entrées convergent sur le rédacteur : c'est exactement le
      // faisceau qui trahit un accrochage au centre plutôt qu'au bord
      { de: "etat", vers: "agent" },
      { de: "projet", vers: "agent" },
      { de: "contrat", vers: "agent" },
      // et il dépose deux fichiers, pas un
      { de: "agent", vers: "fragment" },
      { de: "agent", vers: "manifeste" },
      // le pont : la vue appelle le moteur, jamais l'inverse
      { de: "vue", vers: "moteur", etiquette: t(lang, "etnPont") },
    ],
    bus: {
      rang: 3,
      lignes: t(lang, "etnBus") as unknown as [string, string],
      entrees: ["fragment", "manifeste"],
      sorties: ["moteur", "vue"],
    },
    groupes: [
      { num: groupes[0][0], titre: groupes[0][1], rangs: [0, 2] },
      { num: groupes[1][0], titre: groupes[1][1], rangs: [3, 3] },
      { num: groupes[2][0], titre: groupes[2][1], rangs: [4, 4] },
    ],
    cotes: [{ de: "moteur", vers: "vue", texte: t(lang, "etnCote") }],
    legende,
  }

  return <Planche plan={plan} prefixe="etn" titre={t(lang, "etnTitre")} />
}
