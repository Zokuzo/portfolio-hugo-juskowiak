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
  const nuages = params.get("nuages") ?? "plein"
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
          {cle === "a" ? <VarianteA /> : cle === "c" ? <VarianteC /> : <VarianteB nuages={nuages} />}
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
      {/* l'alternative du gate : couronne de nuages ou ciel nu */}
      <div
        style={{
          position: "fixed",
          bottom: 18,
          right: 18,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "8px 10px",
          borderRadius: 999,
          background: "rgba(12, 9, 24, 0.78)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          backdropFilter: "blur(10px)",
          color: "#f2ecff",
          fontFamily: "var(--f-mono)",
          fontSize: 12,
          zIndex: 10,
        }}
      >
        <span style={{ opacity: 0.65, padding: "0 4px" }}>nuages</span>
        {(["plein", "sans"] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => maj({ nuages: n })}
            style={{
              background: nuages === n ? "rgba(255,255,255,0.22)" : "transparent",
              border: "none",
              color: "inherit",
              font: "inherit",
              fontWeight: nuages === n ? 700 : 400,
              padding: "4px 10px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
