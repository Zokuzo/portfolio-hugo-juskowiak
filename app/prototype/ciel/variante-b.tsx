"use client"

import { useLoader } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import { RGBELoader } from "three-stdlib"
import * as THREE from "three"

/* B — « Pellicule » : la vraie photo, gradée. HDRI qwantani_dusk_2_puresky
   (Poly Haven, CC0, 1k, 1,2 Mo) auto-hébergée — un crépuscule lavande au
   soleil bas, monté sur dôme et teinté chaud (multiply) : c'est le
   « HDRI teintée » du ticket. L'IBL reste la photo brute (reflets vrais).
   Les puresky natifs ne sont jamais rosé-orangé une fois tone-mappés —
   la teinte est le concept, pas un pis-aller. */

export default function VarianteB() {
  /* bouton de réglage du prototype : ?rot=0.25 (en unités de π) tourne le
     ciel pour placer le soleil — 0.25 retenu après balayage en captures */
  const rot = Math.PI * Number(new URLSearchParams(window.location.search).get("rot") ?? "0.25")
  const hdr = useLoader(RGBELoader, "/prototype/crepuscule.hdr")
  return (
    <>
      <mesh rotation-y={rot} frustumCulled={false}>
        <sphereGeometry args={[350, 48, 32]} />
        <meshBasicMaterial
          map={hdr}
          color="#d8927a"
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <Environment
        files="/prototype/crepuscule.hdr"
        environmentIntensity={0.6}
        environmentRotation={[0, rot, 0]}
      />
      <directionalLight position={[-8, 2, -10]} intensity={1.4} color="#ffa05a" />
      <hemisphereLight args={["#e8b8d8", "#ff9a6b", 0.4]} />
    </>
  )
}
