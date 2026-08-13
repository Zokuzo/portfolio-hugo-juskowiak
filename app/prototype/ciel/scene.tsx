"use client"

import { Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Canvas } from "@react-three/fiber"
import { Loader, OrbitControls } from "@react-three/drei"
import Voiture from "./voiture"
import VarianteA from "./variante-a"
import VarianteB from "./variante-b"
import VarianteC from "./variante-c"
import Switcher from "./switcher"

export default function Scene() {
  const router = useRouter()
  const params = useSearchParams()
  const cle = params.get("variant") ?? "b"
  /* bouton de réglage du prototype : ?cam=x,y,z place la caméra de départ */
  const brut = params.get("cam")?.split(",").map(Number)
  const cam: [number, number, number] =
    brut && brut.length === 3 && brut.every(Number.isFinite)
      ? (brut as [number, number, number])
      : [8.2, 0, 3]
  const choisir = useCallback(
    (c: string) => router.replace(`?variant=${c}`, { scroll: false }),
    [router],
  )

  return (
    <div style={{ position: "fixed", inset: 0, background: "#241a3d" }}>
      <Canvas camera={{ position: cam, fov: 38 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          {cle === "b" ? <VarianteB /> : cle === "c" ? <VarianteC /> : <VarianteA />}
          <Voiture />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableDamping
          minDistance={3.5}
          maxDistance={16}
          maxPolarAngle={Math.PI * 0.64}
          target={[0, 0, 0]}
        />
      </Canvas>
      <Loader />
      <Switcher courante={cle} choisir={choisir} />
    </div>
  )
}
