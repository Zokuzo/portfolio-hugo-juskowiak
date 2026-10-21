import { useSyncExternalStore } from "react"

/* LE SEUIL TÉLÉPHONE (#42) : sous 768 px la fusion mobile, au-dessus le
   site desktop. Le même seuil que components/gt86/capable.ts, que
   components/nfs/drapeau.ts et que les règles .seul-mobile / .seul-desktop
   de app/globals.css, qui choisissent la version AVANT la première
   peinture. Ces crochets ne servent qu'à ne pas monter ce qui est masqué :
   faux au serveur et pendant l'hydratation, la vraie valeur au rendu suivant. */
const REQUETE_LARGE = "(min-width: 768px)"

const estLarge = () => matchMedia(REQUETE_LARGE).matches
const serveur = () => false

function abonner(signaler: () => void) {
  const requete = matchMedia(REQUETE_LARGE)
  requete.addEventListener("change", signaler)
  return () => requete.removeEventListener("change", signaler)
}

export const useEcranLarge = () => useSyncExternalStore(abonner, estLarge, serveur)
export const useTelephone = () => useSyncExternalStore(abonner, () => !estLarge(), serveur)
