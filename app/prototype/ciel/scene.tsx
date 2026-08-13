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
import Robes from "./robes"

export default function Scene() {
  const router = useRouter()
  const params = useSearchParams()
  const cle = params.get("variant") ?? "b"
  const robe = params.get("robe") ?? "argent"
  /* bouton de réglage du prototype : ?cam=x,y,z place la caméra de départ */
  const brut = params.get("cam")?.split(",").map(Number)
  const cam: [number, number, number] =
    brut && brut.length === 3 && brut.every(Number.isFinite)
      ? (brut as [number, number, number])
      : [-4.2, -0.4, 7.8]

  const maj = useCallback(
    (patch: Record<string, string>) => {
      const q = new URLSearchParams(params)
      for (const [k, v] of Object.entries(patch)) q.set(k, v)
      router.replace(`?${q}`, { scroll: false })
    },
    [router, params],
  )

  return (
    <div style={{ position: "fixed", inset: 0, background: "#241a3d" }}>
      <Canvas camera={{ position: cam, fov: 38 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          {cle === "a" ? <VarianteA /> : cle === "c" ? <VarianteC /> : <VarianteB />}
          <Voiture robe={robe} />
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
      <Switcher courante={cle} choisir={(c) => maj({ variant: c })} />
      <Robes courante={robe} choisir={(r) => maj({ robe: r })} />
    </div>
  )
}
