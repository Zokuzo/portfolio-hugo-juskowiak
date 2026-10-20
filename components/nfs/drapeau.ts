import { useSyncExternalStore } from "react"

/* le drapeau ?menu=nfs, lu sans écart d'hydratation : faux au serveur et
   pendant l'hydratation, la vraie valeur au rendu suivant */
const sansAbonnement = () => () => {}
const lit = () => new URLSearchParams(location.search).get("menu") === "nfs"
const serveur = () => false

export const useMenuNfs = () => useSyncExternalStore(sansAbonnement, lit, serveur)
