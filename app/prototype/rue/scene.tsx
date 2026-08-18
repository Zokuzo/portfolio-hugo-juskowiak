"use client"

import { Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Canvas } from "@react-three/fiber"
import { Environment, Lightformer, Loader, OrbitControls, SpotLight as SpotVolumetrique } from "@react-three/drei"
import * as THREE from "three"
import Rue, { halo } from "./rue"
import DecorGlb from "./decor-glb"
import Fond from "./fond"
import VieNocturne from "./ville-vivante"
import VoitureRue from "./voiture-rue"

/* La scène du prototype #22 — verdict Hugo : la city procédurale (défaut,
   ?variant=e) rangée au bord de la route, ville vivante ; ?variant=a garde
   la rue construite en référence. Les décors b/c/d ont perdu le gate et
   sont sortis du code (l'historique git les garde).
   Boutons de réglage : ?cam=x,y,z — dpr ≤ 1,5, doctrine fluidité du #21. */

type Variante = {
  fichier?: string
  echelle?: number
  decorPosition?: [number, number, number]
  decorRotationY?: number
  /* la pose de la voiture et son cap — les phares s'y ancrent */
  pose: [number, number, number]
  cap: number
  cam: [number, number, number]
  cible: [number, number, number]
  brume: [string, number, number]
  /* les décors à nuit cuite dans les textures ont besoin d'une ambiante
     franche, nos lampes seules les laissent noirs */
  ambiance?: number
  /* la ville s'anime : lampadaires allumés + vitrages émissifs */
  vie?: boolean
  /* mises en scène alternatives (?pose=1|2|3) — même décor, autre garage */
  poses?: Record<string, Pick<Variante, "pose" | "cap" | "cam" | "cible">>
}

const VARIANTES: Record<string, Variante> = {
  a: {
    pose: [1.6, 0, -3],
    cap: Math.PI,
    cam: [4.2, 2.0, 6.5],
    cible: [0, 0.8, -3],
    brume: ["#0d0b16", 16, 70],
  },
  e: {
    /* la city procédurale importée par Hugo (96,5 → 16,1 Mo, échelle
       métrique native). Sonde : carrefour à l'origine — rue E-O (z -4..4),
       rue N-S (x -6..6), socle de 4,5 m à z≈15 sous un mur de tours de
       57 m. Défaut : nez au socle des tours, phares sur son mur */
    fichier: "/prototype/decor-procedural.glb",
    /* verdict Hugo : rangée au bas-côté, à un endroit SANS barrière —
       le bord ouest de la rue N-S (carte des barrières de l'analyseur),
       le mât d'en face à -15,5 la borde de lumière */
    pose: [-4.4, -0.05, -19],
    cap: Math.PI,
    cam: [-1.2, 2.0, -12.5],
    cible: [-4.4, 1, -19],
    brume: ["#0d0b16", 25, 180],
    ambiance: 0.4,
    vie: true,
    poses: {
      /* 1 — sur le parvis, nez à la vitrine échafaudée */
      "1": { pose: [-2.6, -0.05, 7.6], cap: 0, cam: [-7, 2.2, 2], cible: [-2.3, 1, 8.1] },
      /* 2 — au bord du trottoir, en biais vers la vitrine */
      "2": { pose: [1.7, -0.05, 6.5], cap: -0.3, cam: [5.7, 2.3, 2.6], cible: [1.2, 1, 7] },
    },
  },
}

function Phares({ pose, cap }: { pose: [number, number, number]; cap: number }) {
  /* les feux de croisement mordent l'asphalte : deux spots volumétriques
     ancrés à la pose de la voiture */
  const { origine, gauche } = useMemo(() => {
    const avant = new THREE.Vector3(Math.sin(cap), 0, Math.cos(cap))
    const origine = new THREE.Vector3(...pose).add(new THREE.Vector3(0, 0.68, 0)).addScaledVector(avant, 1.9)
    const gauche = new THREE.Vector3(-avant.z, 0, avant.x)
    return { avant, origine, gauche }
  }, [pose, cap])
  return (
    <group>
      {([1, -1] as const).map((c) => (
        <Phare key={c} cote={c} cap={cap} origine={origine} gauche={gauche} />
      ))}
    </group>
  )
}

function Phare({ cote, cap, origine, gauche }: { cote: 1 | -1; cap: number; origine: THREE.Vector3; gauche: THREE.Vector3 }) {
  /* la cible du spot doit vivre dans le graphe, sinon three la laisse à
     l'origine du monde */
  const cible = useMemo(() => new THREE.Object3D(), [])
  const { p, vise } = useMemo(() => {
    const avant = new THREE.Vector3(Math.sin(cap), 0, Math.cos(cap))
    const p = origine.clone().addScaledVector(gauche, cote * 0.62)
    const vise = p.clone().addScaledVector(avant, 9).setY(0)
    return { p, vise }
  }, [cote, cap, origine, gauche])
  return (
    <group>
      <primitive object={cible} position={vise.toArray()} />
      {/* le faisceau volumétrique de drei : falloff doux (anglePower),
          fondu en profondeur (attenuation) */}
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
  const base = VARIANTES[params.get("variant") ?? "e"] ?? VARIANTES.e
  const surcharge = base.poses?.[params.get("pose") ?? ""]
  const v = surcharge ? { ...base, ...surcharge } : base
  const brut = params.get("cam")?.split(",").map(Number)
  const cam: [number, number, number] =
    brut && brut.length === 3 && brut.every(Number.isFinite) ? (brut as [number, number, number]) : v.cam
  /* ?vise=x,y,z : oriente la caméra de contrôle ailleurs que sur la voiture */
  const brutVise = params.get("vise")?.split(",").map(Number)
  const cible: [number, number, number] =
    brutVise && brutVise.length === 3 && brutVise.every(Number.isFinite) ? (brutVise as [number, number, number]) : v.cible

  return (
    <div style={{ position: "fixed", inset: 0, background: v.brume[0] }}>
      <Canvas
        camera={{ position: cam, fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance" }}
        onCreated={({ scene, camera, gl }) => {
          scene.background = new THREE.Color(v.brume[0])
          scene.fog = new THREE.Fog(v.brume[0], v.brume[1], v.brume[2])
          /* poignées des outils de capture (tools/, gates visuels) */
          if (process.env.NODE_ENV !== "production")
            Object.assign(window as object, { __scene: scene, __camera: camera, __gl: gl })
        }}
      >
        <Suspense fallback={null}>
          {/* l'environnement de nuit : pas de HDRI — trois lueurs urbaines
              construites, juste de quoi faire vivre le métal de la robe */}
          {/* leçon du débogage livrée : la robe est un MIROIR — tout
              rectangle saturé de l'environnement se lit en aplat sur la
              carrosserie. Nuit neutre : bande chaude des lampadaires au
              zénith, fills froids discrets, zéro couleur franche */}
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={0.9} color="#ffb46b" position={[0, 8, 0]} scale={[30, 4, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.35} color="#9aa4c8" position={[8, 2, -6]} scale={[8, 3, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.3} color="#6b7490" position={[-8, 2, -12]} scale={[8, 3, 1]} target={[0, 0, 0]} />
          </Environment>
          <hemisphereLight args={["#2a2440", "#0c0a10", 0.35]} />
          <ambientLight intensity={0.06 + (v.ambiance ?? 0)} color={v.ambiance ? "#cdb8a8" : "#c8d4ff"} />
          {v.fichier ? (
            <DecorGlb
              fichier={v.fichier}
              echelle={v.echelle}
              position={v.decorPosition}
              rotationY={v.decorRotationY}
              sonde={v.pose}
              nuit={v.vie}
            />
          ) : (
            <Rue />
          )}
          <VoitureRue position={v.pose} rotationY={v.cap} />
          <Phares pose={v.pose} cap={v.cap} />
          {v.vie && <VieNocturne />}
          {v.vie && <Fond />}
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableDamping
          minDistance={3.5}
          maxDistance={v.fichier ? 60 : 20}
          maxPolarAngle={Math.PI * 0.49}
          target={cible}
        />
      </Canvas>
      <Loader />
    </div>
  )
}
