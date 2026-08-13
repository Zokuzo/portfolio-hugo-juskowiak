"use client"

import { useLoader } from "@react-three/fiber"
import { Cloud, Clouds, Environment } from "@react-three/drei"
import { RGBELoader } from "three-stdlib"
import * as THREE from "three"
import { REDUIT } from "./voiture"

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
      <hemisphereLight args={["#e8b8d8", "#ff9a6b", 0.6]} />
      {/* les nuages Lambert tournent le dos au soleil : sans ambiante ils
          virent fumée — on les garde crème */}
      <ambientLight intensity={0.55} color="#ffe2d2" />

      {/* demande du gate : remplir un peu le fond — nuages légers au loin,
          teintes de la pellicule, dérive lente */}
      <Clouds limit={160}>
        <Cloud
          seed={3}
          bounds={[12, 2, 5]}
          segments={14}
          volume={7}
          growth={4}
          speed={REDUIT ? 0 : 0.05}
          opacity={0.22}
          color="#fff1e6"
          position={[-12, -5, -18]}
        />
        <Cloud
          seed={8}
          bounds={[10, 1.5, 5]}
          segments={12}
          volume={6}
          growth={3}
          speed={REDUIT ? 0 : 0.04}
          opacity={0.2}
          color="#ffe3da"
          position={[14, -6, -14]}
        />
        <Cloud
          seed={13}
          bounds={[14, 2, 6]}
          segments={14}
          volume={8}
          growth={4}
          speed={REDUIT ? 0 : 0.04}
          opacity={0.18}
          color="#fff0e4"
          position={[-7, -6, 10]}
        />
        <Cloud
          seed={5}
          bounds={[8, 1.2, 4]}
          segments={10}
          volume={5}
          growth={3}
          speed={REDUIT ? 0 : 0.06}
          opacity={0.18}
          color="#fff5ec"
          position={[-4, 3.5, -24]}
        />
        <Cloud
          seed={17}
          bounds={[12, 1.8, 5]}
          segments={14}
          volume={7}
          growth={4}
          speed={REDUIT ? 0 : 0.05}
          opacity={0.2}
          color="#ffeadd"
          position={[0, -6, -28]}
        />
        <Cloud
          seed={21}
          bounds={[10, 1.5, 5]}
          segments={12}
          volume={6}
          growth={3}
          speed={REDUIT ? 0 : 0.04}
          opacity={0.18}
          color="#fff1e6"
          position={[-16, -4, 6]}
        />
      </Clouds>
    </>
  )
}
