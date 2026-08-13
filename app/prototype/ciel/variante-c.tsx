"use client"

import { Environment, Lightformer } from "@react-three/drei"
import * as THREE from "three"
import Dome from "./dome"
import MerDeNuages from "./mer-de-nuages"

/* C — « Mer de nuages » : le cinématique. La GT86 vole au-dessus d'une
   nappe de nuages raymarchée (partagée depuis mer-de-nuages.tsx),
   crêtes embrasées par le soleil bas. Zéro asset, coût GPU plus haut. */

const SOLEIL = new THREE.Vector3(-0.3, 0.02, -1)

export default function VarianteC() {
  return (
    <>
      <Dome
        zenith="#3d3370"
        haut="#a5628f"
        bas="#e88a68"
        horizon="#ff8c42"
        soleil={SOLEIL}
        halo={0.45}
      />
      <MerDeNuages soleil={SOLEIL} />

      {/* soleil bas derrière la voiture : contre-jour, liseré chaud —
          débouché côté caméra pour que la robe reste lisible */}
      <directionalLight position={[-4, 1, -14]} intensity={3.2} color="#ff9a4e" />
      <directionalLight position={[7, 3, 9]} intensity={1.5} color="#8a6fb5" />
      <hemisphereLight args={["#5c4a8a", "#ff8c5a", 0.9]} />

      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={4}
          color="#ffab6b"
          position={[-4, 0.5, -10]}
          scale={[12, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.7}
          color="#4a3d7a"
          position={[0, 8, 0]}
          rotation-x={Math.PI / 2}
          scale={[14, 14, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.0}
          color="#e88a68"
          position={[0, -5, 0]}
          rotation-x={-Math.PI / 2}
          scale={[16, 16, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#a988c9"
          position={[7, 1.5, 10]}
          scale={[8, 3, 1]}
        />
      </Environment>
    </>
  )
}
