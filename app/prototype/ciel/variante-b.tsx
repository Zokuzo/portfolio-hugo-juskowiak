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

      {/* gate bis : plus doux, repoussés à l'horizon — une ceinture basse
          et lointaine, opacités faibles, croissance large pour l'effet
          vaporeux ; rien près de la voiture */}
      <Clouds limit={160}>
        <Cloud
          seed={3}
          bounds={[20, 2.5, 8]}
          segments={14}
          volume={11}
          growth={6}
          speed={REDUIT ? 0 : 0.04}
          opacity={0.12}
          color="#fff3ea"
          position={[-44, -11, -46]}
        />
        <Cloud
          seed={8}
          bounds={[18, 2, 8]}
          segments={12}
          volume={10}
          growth={6}
          speed={REDUIT ? 0 : 0.03}
          opacity={0.11}
          color="#ffe9e0"
          position={[40, -12, -42]}
        />
        <Cloud
          seed={13}
          bounds={[22, 2.5, 9]}
          segments={14}
          volume={12}
          growth={7}
          speed={REDUIT ? 0 : 0.03}
          opacity={0.11}
          color="#fff0e6"
          position={[-32, -12, 42]}
        />
        <Cloud
          seed={5}
          bounds={[16, 2, 7]}
          segments={10}
          volume={9}
          growth={6}
          speed={REDUIT ? 0 : 0.04}
          opacity={0.1}
          color="#fff6ee"
          position={[12, -10, -62]}
        />
        <Cloud
          seed={17}
          bounds={[20, 2, 8]}
          segments={12}
          volume={11}
          growth={6}
          speed={REDUIT ? 0 : 0.03}
          opacity={0.11}
          color="#ffeee4"
          position={[56, -11, 16]}
        />
        <Cloud
          seed={21}
          bounds={[18, 2, 8]}
          segments={12}
          volume={10}
          growth={6}
          speed={REDUIT ? 0 : 0.03}
          opacity={0.11}
          color="#fff3ea"
          position={[-58, -11, 4]}
        />
      </Clouds>
    </>
  )
}
