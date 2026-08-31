/* ==================================================================
   LES DEUX MONDES — quelle fiche vit sous quelle route (#39).

   Une fiche est un enregistrement ; sa ROUTE dit à quelle partition
   elle appartient. Le bureau (`/work`) porte les trois fiches de
   métier, la chambre (`/home`) les six fiches personnelles — deux
   projets d'atelier et quatre cursus.

   POURQUOI UN FICHIER À PART, ET PAS DANS `projets.ts`. Parce que ce
   module-ci n'a AUCUNE donnée. Les deux hubs Y2K sont des composants
   client et n'ont besoin que de savoir écrire une adresse ; s'ils
   allaient la chercher dans `projets.ts`, ils embarqueraient au
   passage les neuf fiches en FR ET EN — ~93 Ko de chunks mesurés sur
   /home pour six chaînes de slug. Une constante de routage n'a pas à
   traîner un catalogue derrière elle.

   POURQUOI PAS DANS UN COMPOSANT NON PLUS. La liste se lit au
   `generateStaticParams` des deux routes, donc côté SERVEUR. Exportée
   d'un module « use client », elle n'y arriverait que comme référence
   opaque — payé au build du #38, sur un `.includes is not a function`.
   Ce fichier n'est ni l'un ni l'autre : il est lisible des deux côtés.

   MAISON EST LA LISTE ÉCRITE, TRAVAIL EST LE RESTE (voir
   `SLUGS_TRAVAIL` dans projets.ts). L'inverse laisserait une fiche
   neuve sans route : ajoutée aux données sans être inscrite nulle
   part, elle tomberait en 404 des deux côtés. Écrite ainsi, elle
   atterrit au bureau — visible, donc corrigible.
   ================================================================== */
export const SLUGS_MAISON = ["eternal", "trading-agent", "cpge", "estia", "hokkaido", "mbds"]

/* L'adresse d'une fiche, depuis n'importe où. Sans ce point unique,
   déménager une fiche demanderait de retrouver sept gabarits d'URL, et
   celui qu'on oublie devient un lien mort.

   UN SEUL APPELANT DEPUIS LE #40 : `lien-fiche.tsx`, qui est le
   composant par lequel s'ouvre TOUTE fiche (les sept points d'entrée
   passent par lui). Il fait deux choses d'un coup — écrire l'adresse
   et retenir d'où l'on part. Cette fonction reste ici et n'y déménage
   pas : `lien-fiche.tsx` est un module « use client », et la liste des
   slugs se lit aussi au `generateStaticParams` des deux routes, donc
   côté SERVEUR. */
export const hrefFiche = (slug: string) => (SLUGS_MAISON.includes(slug) ? `/home/${slug}` : `/work/${slug}`)
