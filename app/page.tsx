import { FusionDuSite } from "@/components/mobile-ab/deux-corps"
import { Intro3d } from "@/components/gt86/intro-3d"

/* La racine : la fusion à toute largeur (téléphone, et desktop sans 3D),
   l'intro GT86 posée par-dessus quand la machine en est capable (#42). */
export default function Page() {
  return (
    <>
      <FusionDuSite pleineLargeur />
      <Intro3d />
    </>
  )
}
