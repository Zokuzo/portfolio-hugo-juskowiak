import Link from "next/link"
import { hrefFiche } from "./mondes"

/* LE POINT UNIQUE OÙ S'OUVRE UNE FICHE, le pendant de `hrefFiche`, qui
   est le point unique où s'ÉCRIT son adresse : séparés, on remettrait un
   `<Link href={hrefFiche(…)}>` à la main quelque part. La fiche ramène
   toujours à son monde (la route le lui passe) : il n'y a plus d'origine
   à retenir depuis que la planche de `/` n'existe plus. */
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
    <Link href={hrefFiche(slug)} className={className}>
      {children}
    </Link>
  )
}
