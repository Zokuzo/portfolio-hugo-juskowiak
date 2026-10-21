import { Planche } from "@/components/proto/planche"
import { DeuxCorps } from "@/components/mobile-ab/deux-corps"

/* La racine : la planche (et la 3D par-dessus) sur desktop, le hub de la
   fusion sur téléphone (#42). */
export default function Page() {
  return (
    <DeuxCorps>
      <Planche />
    </DeuxCorps>
  )
}
