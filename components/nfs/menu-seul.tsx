"use client"

import { MenuNfs } from "./menu-nfs"
import { useDepartSeul } from "./course"

/* le menu sans 3D (machine incapable, ou /da/a) : les destinations
   s'ouvrent avec le volet en biais seul */
export function MenuSeul() {
  const { part, voile } = useDepartSeul()
  return (
    <>
      <MenuNfs variante="seul" surDestination={part} />
      {voile}
    </>
  )
}
