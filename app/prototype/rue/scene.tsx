"use client"

import { Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Canvas } from "@react-three/fiber"
import { Environment, Lightformer, Loader, OrbitControls, SpotLight as SpotVolumetrique } from "@react-three/drei"
import * as THREE from "three"
import Rue, { halo } from "./rue"
import VoitureRue from "./voiture-rue"

/* La scène du prototype #22 : la GT86 vient d'atterrir dans la rue.
   Bouton de réglage : ?cam=x,y,z (même idiome que le ciel). dpr ≤ 1,5 :
   le miroir de l'asphalte re-rend la scène, même doctrine de fluidité
   qu'au #21. */

/* cap de la voiture dans la rue, et ses phares posés en monde : le GLB
   regarde +Z à cap 0 (vérifié en capture — l'avant venait à la caméra).
   Cap en travers de la rue : l'atterrissage vient de finir, les phares
   balaient vers les façades de gauche, jamais vers l'objectif */
const CAP = -Math.PI * 0.38
const AVANT = new THREE.Vector3(Math.sin(CAP), 0, Math.cos(CAP))
/* la pose de la voiture — les phares s'y ancrent */
const POSE = new THREE.Vector3(0.8, 0, -3)

function Phares() {
  /* les feux de croisement mordent l'asphalte : deux spots serrés + un
     cône additif chacun pour le faisceau dans l'air humide */
  const origine = POSE.clone().add(new THREE.Vector3(0, 0.68, 0)).addScaledVector(AVANT, 1.9)
  const gauche = new THREE.Vector3(-AVANT.z, 0, AVANT.x)
  return (
    <group>
      {([1, -1] as const).map((c) => (
        <Phare key={c} cote={c} origine={origine} gauche={gauche} />
      ))}
    </group>
  )
}

function Phare({ cote, origine, gauche }: { cote: 1 | -1; origine: THREE.Vector3; gauche: THREE.Vector3 }) {
  /* même contrainte que les lampadaires : la cible du spot vit dans le graphe */
  const cible = useMemo(() => new THREE.Object3D(), [])
  const { p, vise } = useMemo(() => {
    const p = origine.clone().addScaledVector(gauche, cote * 0.62)
    const vise = p.clone().addScaledVector(AVANT, 9).setY(0)
    return { p, vise }
  }, [cote, origine, gauche])
  return (
    <group>
      <primitive object={cible} position={vise.toArray()} />
      {/* le faisceau volumétrique de drei : falloff doux (anglePower),
          fondu en profondeur (attenuation) — fini le cône géométrique */}
      <SpotVolumetrique
        position={p.toArray()}
        target={cible}
        color="#ffeecb"
        intensity={380}
        angle={0.5}
        penumbra={0.6}
        decay={1.8}
        distance={40}
        attenuation={9}
        anglePower={5}
        radiusTop={0.14}
      />
      {/* l'optique brille : cœur vif serré + éblouissement large et doux */}
      <sprite position={p.toArray()} scale={[0.55, 0.55, 1]}>
        <spriteMaterial map={halo()} color="#fffaf0" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite position={p.toArray()} scale={[2.2, 2.2, 1]}>
        <spriteMaterial map={halo()} color="#ffeecb" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  )
}

export default function Scene() {
  const params = useSearchParams()
  const brut = params.get("cam")?.split(",").map(Number)
  const cam: [number, number, number] =
    brut && brut.length === 3 && brut.every(Number.isFinite)
      ? (brut as [number, number, number])
      : [4.2, 2.0, 6.5]

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0d0b16" }}>
      <Canvas
        camera={{ position: cam, fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance" }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("#0d0b16")
          scene.fog = new THREE.Fog("#0d0b16", 16, 70)
        }}
      >
        <Suspense fallback={null}>
          {/* l'environnement de nuit : pas de HDRI — trois lueurs urbaines
              construites, juste de quoi faire vivre le métal de la robe */}
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={1.2} color="#ffb46b" position={[0, 8, 0]} scale={[30, 4, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.8} color="#ff4f9a" position={[8, 2, -6]} scale={[6, 2, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.7} color="#35d6ff" position={[-8, 2, -12]} scale={[6, 2, 1]} target={[0, 0, 0]} />
          </Environment>
          <hemisphereLight args={["#2a2440", "#0c0a10", 0.35]} />
          <ambientLight intensity={0.06} color="#c8d4ff" />
          <Rue />
          <VoitureRue position={POSE.toArray() as [number, number, number]} rotationY={CAP} />
          <Phares />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableDamping
          minDistance={3.5}
          maxDistance={20}
          maxPolarAngle={Math.PI * 0.49}
          target={[0, 0.8, -3]}
        />
      </Canvas>
      <Loader />
    </div>
  )
}
