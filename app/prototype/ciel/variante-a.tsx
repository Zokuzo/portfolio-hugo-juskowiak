"use client"

import { Cloud, Clouds, Environment, Lightformer } from "@react-three/drei"
import * as THREE from "three"
import Dome from "./dome"
import { REDUIT } from "./voiture"

/* A — « Aplat » : le ciel peint. Dégradé shader façon générique d'anime,
   nuages billboards qui dérivent, lumière chaude stylisée. Zéro asset. */

const SOLEIL = new THREE.Vector3(-0.4, 0.14, -1)

export default function VarianteA() {
  return (
    <>
      <Dome
        zenith="#7a5fae"
        haut="#ee9cb2"
        bas="#ffb984"
        horizon="#ff9450"
        soleil={SOLEIL}
        halo={0.3}
      />

      {/* une couronne lâche, sous la ligne d'horizon et au loin :
          le dégradé reste maître du cadre, la voiture émerge des nuages */}
      <Clouds limit={220}>
        <Cloud
          seed={2}
          bounds={[10, 2, 5]}
          segments={16}
          volume={7}
          growth={4}
          speed={REDUIT ? 0 : 0.07}
          opacity={0.5}
          color="#ffe3ea"
          position={[-14, -4, -16]}
        />
        <Cloud
          seed={7}
          bounds={[12, 2, 6]}
          segments={16}
          volume={8}
          growth={4}
          speed={REDUIT ? 0 : 0.06}
          opacity={0.45}
          color="#ffd6c4"
          position={[16, -5, -12]}
        />
        <Cloud
          seed={11}
          bounds={[14, 2, 7]}
          segments={18}
          volume={9}
          growth={5}
          speed={REDUIT ? 0 : 0.05}
          opacity={0.4}
          color="#f9c4d4"
          position={[-4, -5.5, 12]}
        />
        <Cloud
          seed={4}
          bounds={[16, 2.5, 6]}
          segments={20}
          volume={10}
          growth={5}
          speed={REDUIT ? 0 : 0.05}
          opacity={0.35}
          color="#ffe9d8"
          position={[4, -3.5, -28]}
        />
        <Cloud
          seed={9}
          bounds={[6, 1.5, 4]}
          segments={10}
          volume={5}
          growth={3}
          speed={REDUIT ? 0 : 0.1}
          opacity={0.3}
          color="#fff3e6"
          position={[22, 2, -22]}
        />
        <Cloud
          seed={5}
          bounds={[7, 1.5, 4]}
          segments={10}
          volume={5}
          growth={3}
          speed={REDUIT ? 0 : 0.08}
          opacity={0.35}
          color="#ffe0d0"
          position={[-24, 0.5, -10]}
        />
      </Clouds>

      <directionalLight position={[-6, 2.5, -14]} intensity={2.2} color="#ffb26b" />
      <ambientLight intensity={1.1} color="#ffdfd0" />
      <hemisphereLight args={["#c9a0d8", "#ffb08a", 1.2]} />

      {/* Reflets stylisés sur la carrosserie : un studio de lightformers,
          pas de HDRI — cohérent avec le parti pris « peint ». */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={3}
          color="#ffc9a0"
          position={[-4, 1.5, -9]}
          scale={[10, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#8f7bc0"
          position={[0, 8, 0]}
          rotation-x={Math.PI / 2}
          scale={[12, 12, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#ff8f6b"
          position={[0, -6, 0]}
          rotation-x={-Math.PI / 2}
          scale={[14, 14, 1]}
        />
      </Environment>
    </>
  )
}
