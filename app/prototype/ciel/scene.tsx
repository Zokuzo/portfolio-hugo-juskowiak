"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Canvas } from "@react-three/fiber"
import { Loader, OrbitControls } from "@react-three/drei"
import Voiture from "./voiture"
import VarianteB from "./variante-b"

/* La scène finale du prototype : Pellicule + aura divine, robe Argent —
   les variantes A/C, le testeur de robes et l'interrupteur nuages ont été
   supprimés au verdict. Restent deux boutons de réglage : ?cam=x,y,z et
   ?rot= (unités de π). dpr plafonné à 1,5 : le raymarch double-couche
   coûtait trop cher en 2x (verdict fluidité du gate). */
export default function Scene() {
  const params = useSearchParams()
  const brut = params.get("cam")?.split(",").map(Number)
  const cam: [number, number, number] =
    brut && brut.length === 3 && brut.every(Number.isFinite)
      ? (brut as [number, number, number])
      : [-4.2, -0.4, 7.8]

  return (
    <div style={{ position: "fixed", inset: 0, background: "#241a3d" }}>
      <Canvas
        camera={{ position: cam, fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <VarianteB />
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
    </div>
  )
}
