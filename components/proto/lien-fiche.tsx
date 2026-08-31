"use client"

import Link from "next/link"
import { hrefFiche } from "./mondes"

/* ==================================================================
   D'OÙ VIENT LE VISITEUR (#40).

   Une fiche ouverte DEPUIS LA PLANCHE `/` doit ramener à la card
   quittée ; ouverte depuis un hub, elle ramène au hub. L'URL ne peut
   pas le dire : une fiche a un slug et une route, pas deux.

   POURQUOI UNE MÉMOIRE DE MODULE, ET RIEN D'AUTRE. Les quatre pistes
   du ticket ont chacune leur défaut, et un seul est rédhibitoire —
   celui qui oblige le SERVEUR à mentir :

   - un paramètre de requête salirait six URLs qu'on vient de poser
     comme cibles de 308 permanents (#39), et `searchParams` rendrait
     dynamiques deux routes qui sortent en statique ;
   - `document.referrer` est vide sur une navigation client Next ;
   - `sessionStorage` (ou un fragment d'URL) SURVIT au rechargement —
     et c'est précisément le problème : le document servi dirait
     « TRAVAIL.SYS », le client corrigerait après coup, et le retour
     changerait de nom sous les yeux du lecteur. Sans compter qu'il
     ment quand l'onglet est réutilisé.

   Une mémoire de module ne peut PAS produire cet écart, par
   construction : elle n'est jamais non vide dans une session qui a
   connu un rendu serveur. La planche → fiche est une navigation
   CLIENT — le module est déjà chargé, le premier rendu de la fiche a
   déjà la réponse, il n'y a pas d'hydratation à faire mentir. Un F5
   sur la fiche vide la mémoire et on retombe sur le hub, qui est le
   défaut sûr écrit au ticket (point 4).

   L'ORIGINE N'EST PAS DÉCLARÉE, ELLE EST CONSTATÉE. Le lien lit
   `location.pathname` au clic : il sait où il est parce qu'il y est.
   Aucun des sept appelants n'a de drapeau à passer — donc aucun à
   oublier, et un futur point d'entrée s'inscrit tout seul.
   ================================================================== */

/* Le dernier départ vers une fiche. Un seul : on ne quitte qu'une page
   à la fois. Le slug est gardé avec, sinon « planche → eternal » puis
   « hub → estia » renverrait ESTIA à la planche. */
let venu: { slug: string; de: string } | null = null

/* LE POINT UNIQUE OÙ S'OUVRE UNE FICHE — le pendant de `hrefFiche`,
   qui est le point unique où s'ÉCRIT son adresse. Les deux vont
   ensemble : séparés, on remettrait un `<Link href={hrefFiche(…)}>` à
   la main quelque part, et ce lien-là serait le seul à ne pas dire
   d'où il part. C'est exactement ainsi que le retour vers la planche
   avait perdu son émetteur au #38. */
export function LienFiche({
  slug,
  className,
  children,
}: {
  slug: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={hrefFiche(slug)}
      className={className}
      /* Vaut aussi pour Entrée au clavier : `onClick` d'un <a> couvre
         l'activation, pas seulement la souris. Un clic milieu marque
         l'onglet COURANT — qui reste sur la planche — et le nouvel
         onglet démarre avec une mémoire vide : le repli hub, correct. */
      onClick={() => {
        venu = { slug, de: location.pathname }
      }}
    >
      {children}
    </Link>
  )
}

/* Vrai seulement si CETTE fiche vient d'être ouverte depuis `/`. */
export const venuDeLaPlanche = (slug: string) => venu?.slug === slug && venu.de === "/"
