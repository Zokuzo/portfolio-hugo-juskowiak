"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Center, Environment, Lightformer, Loader, SpotLight as SpotVolumetrique, Text3D, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { habilleNuit } from "../rue/voiture-rue"
import Fond from "../rue/fond"
import DecorGlb from "../rue/decor-glb"
import VieNocturne from "../rue/ville-vivante"

/* La scène du prototype #23 — l'écran média de l'habitacle. Verdict du
   gate : l'écran NATIF du GT86 (quad `Car_16`, mat `Display`, 512×256 —
   le ratio 2:1 est gravé pour l'UI écran, GPS #26 et Musiques #33) ; la
   variante PSP a perdu et est sortie du code avec son GLB.
   Vue par défaut : ASSIS CONDUCTEUR (demande Hugo) ; clic sur l'écran →
   la caméra vient s'y cadrer ; re-clic → retour au siège.
   Conduite à droite (Speedo à x>0) — relevé de l'analyse #16. */

const REDUIT =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* le quad Display relevé dans le GLB : x -0,14..-0,01, y 0,75..0,82,
   z 0,32..0,34 — centre et inclinaison (dossier ~16° vers l'arrière) */
const ECRAN_NATIF = {
  centre: new THREE.Vector3(-0.075, 0.785, 0.328),
  bascule: -0.28,
}

/* ---- la maquette de hub peinte en canvas --------------------------- */
/* la maquette de hub jugée au gate — le vrai hub arrive avec #32 */
function textureHub(l: number, h: number, sousTitre: string, mode?: "gltf") {
  const c = document.createElement("canvas")
  c.width = l
  c.height = h
  const g = c.getContext("2d")!
  const u = h / 100 /* unité : pourcent de hauteur */

  g.fillStyle = "#0b0d14"
  g.fillRect(0, 0, l, h)
  g.strokeStyle = "#252a3c"
  g.lineWidth = Math.max(2, u * 1.2)
  g.strokeRect(u * 2, u * 2, l - u * 4, h - u * 4)

  g.textBaseline = "middle"
  g.font = `${Math.round(u * 8)}px monospace`
  g.fillStyle = "#8f97b3"
  g.fillText("HUGO JUSKOWIAK — MEDIA", u * 8, u * 10)
  g.textAlign = "right"
  g.fillText("23:42", l - u * 8, u * 10)
  g.textAlign = "left"
  g.font = `${Math.round(u * 5)}px monospace`
  g.fillStyle = "#4c5470"
  g.fillText(sousTitre, u * 8, u * 19)

  const arrondi = (x: number, y: number, la: number, ha: number, r: number) => {
    g.beginPath()
    g.roundRect(x, y, la, ha, r)
  }
  const tuile = (x: number, titre: string, teinte: string, glyphe: (cx: number, cy: number, r: number) => void) => {
    const y = u * 27
    const la = l / 2 - u * 12
    const ha = h - y - u * 10
    arrondi(x, y, la, ha, u * 4)
    g.fillStyle = "#12151f"
    g.fill()
    g.strokeStyle = teinte
    g.lineWidth = u * 1.4
    g.stroke()
    const cx = x + la / 2
    const cy = y + ha * 0.42
    g.strokeStyle = teinte
    g.fillStyle = teinte
    glyphe(cx, cy, ha * 0.2)
    g.textAlign = "center"
    g.font = `bold ${Math.round(u * 9)}px monospace`
    g.fillStyle = "#dfe4f2"
    g.fillText(titre, cx, y + ha * 0.82)
    g.textAlign = "left"
  }
  /* GPS : un jalon de carte */
  tuile(u * 8, "GPS", "#ff7a45", (cx, cy, r) => {
    g.lineWidth = r * 0.24
    g.beginPath()
    g.arc(cx, cy - r * 0.25, r * 0.55, Math.PI * 0.92, Math.PI * 2.08)
    g.lineTo(cx, cy + r)
    g.closePath()
    g.stroke()
    g.beginPath()
    g.arc(cx, cy - r * 0.25, r * 0.2, 0, Math.PI * 2)
    g.fill()
  })
  /* MUSIQUES : une double croche */
  tuile(l / 2 + u * 4, "MUSIQUES", "#7aa7ff", (cx, cy, r) => {
    g.lineWidth = r * 0.24
    g.beginPath()
    g.moveTo(cx - r * 0.45, cy + r * 0.7)
    g.lineTo(cx - r * 0.45, cy - r * 0.8)
    g.lineTo(cx + r * 0.65, cy - r)
    g.lineTo(cx + r * 0.65, cy + r * 0.5)
    g.stroke()
    g.beginPath()
    g.arc(cx - r * 0.6, cy + r * 0.7, r * 0.28, 0, Math.PI * 2)
    g.arc(cx + r * 0.5, cy + r * 0.5, r * 0.28, 0, Math.PI * 2)
    g.fill()
  })

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  /* orientation RELEVÉE en capture, pas déduite : le quad Display du GT86
     échantillonne v ∈ [1,2] → Repeat obligatoire (le clamp étalait la
     dernière rangée en aplat), et le flipY par défaut remet l'image à
     l'endroit.  */
  if (mode === "gltf") {
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
  }
  return tex
}

/* ---- la voiture, écran natif habillé --------------------------------- */
/* verdict Hugo : l'écran NATIF gagne — le ratio 2:1 (512×256) est gravé
   pour l'UI écran (GPS #26, Musiques #33) ; la PSP a perdu le gate et
   sort du code avec son GLB (l'historique git les garde) */
function Voiture() {
  const { scene } = useGLTF("/prototype/gt86.glb")
  const modele = useMemo(() => {
    /* la robe de nuit COMMUNE aux scènes (Argent, verre teinté, livrée
       neutralisée, feux allumés) — la voiture de l'habitacle est la même
       que celle de la rue (retour Hugo : plus jamais la livrée d'usine) */
    habilleNuit(scene)
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      const mat = mesh.material as THREE.MeshStandardMaterial
      /* pare-brise éclairci pour laisser passer le nom (demande Hugo) —
         réglage propre à l'habitacle, la rue garde son verre à 0,8 */
      if (mat?.name === "Glass") {
        const verre = mat as THREE.MeshPhysicalMaterial
        verre.opacity = 0.4
        verre.color.set("#1a2027")
      }
      if (mat?.name === "Display") {
        const m = mat.clone()
        const tex = textureHub(512, 256, "écran natif GT86 — 512×256 (2:1)", "gltf")
        m.map = tex
        m.emissiveMap = tex
        m.emissive = new THREE.Color("#ffffff")
        m.emissiveIntensity = 1.1
        mesh.material = m
      }
    })
    return scene
  }, [scene])

  /* plafonnier éteint, suite : l'Environment plein repeignait plastiques
     et planche en fin d'après-midi — l'intérieur reçoit l'environnement
     en envMap propre à dose de veille (leçon du #22 : sans envMap posé
     sur le matériau, envMapIntensity est INERTE) ; la robe garde le sien */
  const envPose = useRef(false)
  useFrame(({ scene: sc }) => {
    if (envPose.current || !sc.environment) return
    envPose.current = true
    const INTERIEUR = new Set(["MoreInterior", "InteriorBlack", "InteriorStuff", "SilverPlastic", "Pedals", "DashboardArtwork", "Carbon"])
    modele.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const mat = m as THREE.MeshStandardMaterial
        if (!mat || !INTERIEUR.has(mat.name)) continue
        mat.envMap = sc.environment
        mat.envMapIntensity = 0.12
        mat.needsUpdate = true
      }
    })
  })
  return <primitive object={modele} />
}

/* ---- le clic écran : écouteur DOM + raycast maison ------------------ */
/* le pipeline d'événements R3F restait sourd sur cette page (vérifié :
   proxy en place, handler enregistré, rayon manuel au centre — zéro
   appel) ; un écouteur natif sur le canvas ne dépend de rien */
function ClicEcran({ centre, surClic }: { centre: THREE.Vector3; surClic: () => void }) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const refClic = useRef(surClic)
  refClic.current = surClic
  useEffect(() => {
    const el = gl.domElement
    const normale = new THREE.Vector3(0, Math.sin(ECRAN_NATIF.bascule), Math.cos(ECRAN_NATIF.bascule)).normalize()
    const axeY = normale.clone().cross(new THREE.Vector3(-1, 0, 0)).normalize()
    const rayon = new THREE.Raycaster()
    const clic = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      rayon.setFromCamera(
        new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)),
        camera,
      )
      const plan = new THREE.Plane().setFromNormalAndCoplanarPoint(normale, centre)
      const impact = new THREE.Vector3()
      if (!rayon.ray.intersectPlane(plan, impact)) return
      const d = impact.sub(centre)
      if (Math.abs(d.x) < 0.1 && Math.abs(d.dot(axeY)) < 0.065) refClic.current()
    }
    el.addEventListener("click", clic)
    return () => el.removeEventListener("click", clic)
  }, [gl, camera, centre])
  return null
}

/* ---- le nom dans les phares (aperçu du ticket #31) ------------------ */
/* « Hugo Juskowiak / SDE-IA Engineer » flotte en chrome dans la rue, face
   au pare-brise, éclairé par deux faisceaux volumétriques partis des
   optiques (axe voiture x = −0,075, optiques natives à ±0,62) */
function NomChrome() {
  const cibles = useMemo(() => [new THREE.Object3D(), new THREE.Object3D()], [])
  /* le nom FLOTTE (demande Hugo) — houle lente + roulis infime ; les
     faisceaux restent fixes : la lumière glisse sur les lettres. Figé
     sous prefers-reduced-motion. */
  const flotte = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!flotte.current) return
    const t = REDUIT ? 0 : clock.elapsedTime
    flotte.current.position.y = Math.sin(t * 0.7) * 0.07
    flotte.current.rotation.z = Math.sin(t * 0.45 + 1.3) * 0.008
  })
  return (
    <group>
      <group ref={flotte}>
      <Center position={[-0.45, 1.4, 13]} rotation-y={Math.PI}>
        <Text3D
          font="/prototype/helvetiker_bold.typeface.json"
          size={0.5}
          height={0.12}
          curveSegments={8}
          bevelEnabled
          bevelThickness={0.015}
          bevelSize={0.01}
        >
          HUGO JUSKOWIAK
          <meshStandardMaterial color="#e8ecf2" metalness={0.9} roughness={0.28} envMapIntensity={1.8} emissive="#fff3dc" emissiveIntensity={0.2} />
        </Text3D>
      </Center>
      <Center position={[-0.45, 0.82, 13]} rotation-y={Math.PI}>
        <Text3D font="/prototype/helvetiker_regular.typeface.json" size={0.26} height={0.05} curveSegments={6}>
          SDE / IA Engineer
          <meshStandardMaterial color="#cfd5de" metalness={0.9} roughness={0.3} envMapIntensity={1.7} emissive="#fff3dc" emissiveIntensity={0.16} />
        </Text3D>
      </Center>
      </group>
      {([1, -1] as const).map((c, i) => (
        <group key={c}>
          <primitive object={cibles[i]} position={[-0.45 + c * 1.3, 1.25, 13]} />
          <SpotVolumetrique
            position={[-0.075 + c * 0.62, 0.76, 1.85]}
            target={cibles[i]}
            color="#ffeecb"
            intensity={900}
            angle={0.38}
            penumbra={0.6}
            decay={1.2}
            distance={30}
            attenuation={10}
            anglePower={5}
            radiusTop={0.14}
          />
        </group>
      ))}
    </group>
  )
}

/* ---- le rail de caméra : la SEULE façon de bouger ------------------- */
/* pas d'orbite libre (demande Hugo) : la caméra vit sur un rail, seuls
   les clics la déplacent — le rail tient sa propre cible et verrouille
   le regard à chaque frame */
function Rail({ but, arrive, viseInitiale }: { but: { cam: THREE.Vector3; vise: THREE.Vector3 } | null; arrive: () => void; viseInitiale: [number, number, number] }) {
  const vise = useRef(new THREE.Vector3(...viseInitiale))
  useFrame(({ camera }) => {
    if (but) {
      const k = REDUIT ? 1 : 0.09
      camera.position.lerp(but.cam, k)
      vise.current.lerp(but.vise, k)
      if (camera.position.distanceTo(but.cam) < 0.005) arrive()
    }
    camera.lookAt(vise.current)
  })
  return null
}

const VUES = {
  /* ASSIS au poste de conduite (à droite), le regard vers la route —
     volant, combiné et écran dans le champ */
  conducteur: { cam: new THREE.Vector3(0.3, 1.05, -0.42), vise: new THREE.Vector3(0.0, 0.8, 1.2) },
  /* le nez sur l'écran, dans son axe incliné */
  ecran: { cam: new THREE.Vector3(-0.075, 0.9, -0.05), vise: ECRAN_NATIF.centre.clone() },
}

export default function Scene() {
  const params = useSearchParams()
  const [zoome, setZoome] = useState(false)
  const [but, setBut] = useState<{ cam: THREE.Vector3; vise: THREE.Vector3 } | null>(null)

  const brut = params.get("cam")?.split(",").map(Number)
  const cam: [number, number, number] =
    brut && brut.length === 3 && brut.every(Number.isFinite) ? (brut as [number, number, number]) : VUES.conducteur.cam.toArray() as [number, number, number]
  const brutVise = params.get("vise")?.split(",").map(Number)
  const cible: [number, number, number] =
    brutVise && brutVise.length === 3 && brutVise.every(Number.isFinite) ? (brutVise as [number, number, number]) : VUES.conducteur.vise.toArray() as [number, number, number]

  const surEcran = () => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __clics: number }).__clics = ((window as unknown as { __clics?: number }).__clics ?? 0) + 1
    setBut(zoome ? VUES.conducteur : VUES.ecran)
    setZoome(!zoome)
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#08070f" }}>
      <Canvas
        camera={{ position: cam, fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance" }}
        onCreated={({ scene, camera, gl }) => {
          /* la même nuit que la rue (#22) : fond, brume et palette — vus
             à travers les vitres, les deux scènes doivent se répondre */
          scene.background = new THREE.Color("#08070f")
          /* brume serrée : la ville est COUPÉE à 50 m (fluidité, demande
             Hugo) — le bord de coupe fond dans la nuit, la skyline du
             Fond (peinte hors brume) tient l'horizon derrière */
          scene.fog = new THREE.Fog("#08070f", 15, 70)
          /* poignées des outils de capture (tools/, gates visuels) */
          if (process.env.NODE_ENV !== "production")
            Object.assign(window as object, { __scene: scene, __camera: camera, __gl: gl })
        }}
      >
        <Suspense fallback={null}>
          {/* nuit d'habitacle : les mêmes lueurs urbaines que la rue,
              en sourdine — juste de quoi lire les volumes et la robe */}
          <Environment resolution={128}>
            <Lightformer form="rect" intensity={0.5} color="#ffb46b" position={[0, 6, 0]} scale={[20, 3, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.25} color="#9aa4c8" position={[6, 2, -4]} scale={[6, 2, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.2} color="#6b7490" position={[-6, 2, 4]} scale={[6, 2, 1]} target={[0, 0, 0]} />
          </Environment>
          {/* plafonnier ÉTEINT (demande Hugo) : mêmes ambiantes que la nuit
              de la rue — l'habitacle ne vit plus que de l'écran, du combiné
              et de la ville */}
          <hemisphereLight args={["#232038", "#0a080e", 0.22]} />
          <ambientLight intensity={0.21} color="#a9b4d4" />
          {/* la lueur de l'écran mange le tableau de bord */}
                    {/* le monde derrière les vitres : LA ville de la rue (#22), pas
              une silhouette — le décor entier avec ses fenêtres émissives,
              ses 90 luminaires et ses feux, transformé pour que la voiture
              soit garée à SA place de la scène précédente (pose (−4,4,
              −0,05, −19), cap π → rotation π, translation −R·pose) */}
          <group rotation-y={Math.PI} position={[-4.4, 0.02, -19]}>
            <DecorGlb fichier="/prototype/decor-habitacle.glb" nuit />
            <VieNocturne autour={[-4.4, -19, 50]} />
          </group>
          <Fond />
          <NomChrome />
          <Voiture />
          <ClicEcran centre={ECRAN_NATIF.centre} surClic={surEcran} />
          <Rail but={but} arrive={() => setBut(null)} viseInitiale={cible} />
        </Suspense>
      </Canvas>
      <Loader />
    </div>
  )
}
