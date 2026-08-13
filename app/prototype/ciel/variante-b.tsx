"use client"

import { useLoader } from "@react-three/fiber"
import { Cloud, Clouds, Environment, Lightformer } from "@react-three/drei"
import { RGBELoader } from "three-stdlib"
import * as THREE from "three"
import { REDUIT } from "./voiture"

/* B — « Pellicule » : la vraie photo, gradée. HDRI qwantani_dusk_2_puresky
   (Poly Haven, CC0, 1k, 1,2 Mo) auto-hébergée — un crépuscule lavande au
   soleil bas, monté sur dôme et teinté chaud (multiply) : c'est le
   « HDRI teintée » du ticket. L'IBL reste la photo brute (reflets vrais).
   Les puresky natifs ne sont jamais rosé-orangé une fois tone-mappés —
   la teinte est le concept, pas un pis-aller. */

/* la ceinture « plein » : une couronne complète autour de l'horizon, seize
   nappes vaporeuses à rayon/hauteur/teinte variés — douce mais habitée */
const CEINTURE = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2
  const rayon = 38 + (i % 4) * 8
  return {
    seed: i * 7 + 3,
    position: [Math.sin(angle) * rayon, -7 - (i % 3) * 3, Math.cos(angle) * rayon] as [number, number, number],
    bounds: [14 + (i % 3) * 4, 2 + (i % 2), 7 + (i % 2)] as [number, number, number],
    volume: 9 + (i % 4),
    opacity: 0.12 + (i % 3) * 0.03,
    color: ["#fff3ea", "#ffe9e0", "#fff0e6", "#ffeadd"][i % 4],
  }
})

export default function VarianteB({ nuages = "plein" }: { nuages?: string }) {
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
      {/* le ciel brumeux n'a rien de net à mirer — même poli, le métal
          paraît satin. Les lames de lumière découpent des éclats francs
          dans la robe et le verre, le fond ne bouge pas. */}
      <Environment
        files="/prototype/crepuscule.hdr"
        environmentIntensity={0.6}
        environmentRotation={[0, rot, 0]}
        resolution={512}
      >
        <Lightformer
          form="rect"
          intensity={12}
          color="#fff4e2"
          position={[0, 7, -3]}
          target={[0, 0, 0]}
          scale={[20, 2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={8}
          color="#ffd9b0"
          position={[-7, 2, -7]}
          target={[0, 0, 0]}
          scale={[12, 1.5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={4}
          color="#cdbce8"
          position={[7, -2.5, 6]}
          target={[0, 0, 0]}
          scale={[12, 1.2, 1]}
        />
      </Environment>
      <directionalLight position={[-8, 2, -10]} intensity={1.4} color="#ffa05a" />
      <hemisphereLight args={["#e8b8d8", "#ff9a6b", 0.6]} />
      {/* les nuages Lambert tournent le dos au soleil : sans ambiante ils
          virent fumée — on les garde crème */}
      <ambientLight intensity={0.55} color="#ffe2d2" />

      {/* gate ter : deux alternatives — « plein » (couronne complète) ou
          « sans » (ciel nu, la pellicule seule) ; l'entre-deux est mort */}
      {nuages !== "sans" && (
        <Clouds limit={400}>
          {CEINTURE.map((n) => (
            <Cloud
              key={n.seed}
              seed={n.seed}
              bounds={n.bounds}
              segments={12}
              volume={n.volume}
              growth={6}
              speed={REDUIT ? 0 : 0.03}
              opacity={n.opacity}
              color={n.color}
              position={n.position}
            />
          ))}
        </Clouds>
      )}
    </>
  )
}
