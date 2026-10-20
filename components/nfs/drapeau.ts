import { useSyncExternalStore } from "react"

/* le menu NFS, par défaut ; ?menu=ancien rend l'habitacle d'avant. Lu sans écart d'hydratation : faux au serveur et
   pendant l'hydratation, la vraie valeur au rendu suivant */
const sansAbonnement = () => () => {}
/* les téléphones gardent la version simple : le menu est pensé pour le PC,
   le mobile aura le sien (#63) */
const lit = () =>
  new URLSearchParams(location.search).get("menu") !== "ancien" && matchMedia("(min-width: 768px)").matches
const serveur = () => false

export const useMenuNfs = () => useSyncExternalStore(sansAbonnement, lit, serveur)
