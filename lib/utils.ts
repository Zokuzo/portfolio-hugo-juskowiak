import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/* `cn` n'existe QUE pour les composants importés du catalogue 21st :
   ils appellent tous `cn` depuis `@/lib/utils`, et sans ce fichier ils
   ne compilent pas. Le reste du dépôt n'en a pas l'usage — la planche
   n'écrit pas ses classes en Tailwind, elle les déclare dans
   `app/planche.css`. `twMerge` par-dessus `clsx` sert à ce que la
   dernière classe utilitaire passée gagne réellement : deux utilitaires
   Tailwind de la même famille ont la même spécificité, donc sans fusion
   c'est l'ordre du fichier CSS qui tranche, pas l'ordre des props. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
