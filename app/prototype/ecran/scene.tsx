"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Lightformer, Loader, OrbitControls, useGLTF } from "@react-three/drei"
import * as THREE from "three"

/* La scène du prototype #23 — l'écran média de l'habitacle, deux options
   au banc (gate œil Hugo, la décision fixe ratio + résolution de l'UI
   écran pour le GPS #26 et les Musiques #33) :
   - défaut : l'écran NATIF du GT86 — le quad `Car_16` (mat `Display`,
     texture 512×256, ~13×7 cm) s'habille d'une maquette de hub ;
   - ?variant=psp : la PSP (échelle réelle 18,8 cm) posée en écran
     embarqué sur la console, dalle 16:9.
   Clic sur l'écran → la caméra vient s'y cadrer ; re-clic → retour.
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
/* même UI aux deux ratios : c'est exactement ce que le gate doit juger */
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
     l'endroit. La dalle PSP (quad maison) vit avec les défauts. */
  if (mode === "gltf") {
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
  }
  return tex
}

/* ---- la voiture, écran natif habillé ou en veille ------------------ */
function Voiture({ variante }: { variante: "natif" | "psp" }) {
  const { scene } = useGLTF("/prototype/gt86.glb")
  const modele = useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      const mat = mesh.material as THREE.MeshStandardMaterial
      /* le disque d'ombre au sol intégré au modèle n'a rien à faire ici */
      if (mat?.name === "Floor") mesh.visible = false
      if (mat?.name === "Display") {
        const m = mat.clone()
        if (variante === "natif") {
          const tex = textureHub(512, 256, "écran natif GT86 — 512×256 (2:1)", "gltf")
          m.map = tex
          m.emissiveMap = tex
          m.emissive = new THREE.Color("#ffffff")
          m.emissiveIntensity = 1.1
        } else {
          /* écran natif VRAIMENT éteint sous la PSP : l'émissif en veille
             ne suffit pas, la base éclairée par la lueur d'écran rejouait
             l'UI d'origine — on noircit aussi la teinte */
          m.emissiveIntensity = 0.04
          m.color = new THREE.Color("#16161c")
        }
        mesh.material = m
      }
    })
    return scene
  }, [scene, variante])
  return <primitive object={modele} />
}

/* ---- la PSP en écran embarqué -------------------------------------- */
function Psp() {
  const { scene } = useGLTF("/prototype/psp.glb")
  const modele = useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      /* notre dalle remplace l'écran du modèle : son quad éteint et sa
         vitre crasseuse (grime cuit dans l'atlas) brouillaient l'UI */
      if (/display|glass/i.test(mesh.name)) mesh.visible = false
    })
    return scene
  }, [scene])
  const ui = useMemo(() => textureHub(512, 290, "PSP embarquée — dalle 16:9"), [])
  /* dockée SUR la façade du poste natif, basculée avec la planche */
  return (
    <>
      <group position={[-0.075, 0.792, 0.322]} rotation={[ECRAN_NATIF.bascule, Math.PI, 0]}>
        <primitive object={modele} />
      </group>
      {/* la dalle vivante : un quad maison calqué sur le quad display du
          modèle, SONDÉ en monde : 11,0×6,4 cm centré (−0,075, 0,792,
          0,312), même bascule que la planche (ses UV à lui pointent dans
          l'atlas 4096 — remap plus coûteux qu'un quad, recherche #16) */}
      <mesh position={[-0.075, 0.7919, 0.3099]} rotation={[ECRAN_NATIF.bascule, Math.PI, 0]}>
        <planeGeometry args={[0.104, 0.059]} />
        <meshBasicMaterial map={ui} toneMapped={false} />
      </mesh>
    </>
  )
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

/* ---- le rail de caméra : zoom vers l'écran au clic ------------------ */
function Rail({ but, arrive }: { but: { cam: THREE.Vector3; vise: THREE.Vector3 } | null; arrive: () => void }) {
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null
  useFrame(({ camera }) => {
    if (!but || !controls) return
    const k = REDUIT ? 1 : 0.09
    camera.position.lerp(but.cam, k)
    controls.target.lerp(but.vise, k)
    controls.update()
    if (camera.position.distanceTo(but.cam) < 0.005) arrive()
  })
  return null
}

const VUES = {
  /* assis côté conducteur (à droite), l'écran dans le champ */
  habitacle: { cam: new THREE.Vector3(0.32, 1.04, -0.42), vise: new THREE.Vector3(-0.1, 0.78, 0.4) },
  /* le nez sur l'écran, dans son axe incliné */
  natif: { cam: new THREE.Vector3(-0.075, 0.9, -0.05), vise: ECRAN_NATIF.centre.clone() },
  psp: { cam: new THREE.Vector3(-0.075, 0.98, -0.08), vise: new THREE.Vector3(-0.075, 0.86, 0.31) },
}

export default function Scene() {
  const params = useSearchParams()
  const variante = params.get("variant") === "psp" ? "psp" : "natif"
  const [zoome, setZoome] = useState(false)
  const [but, setBut] = useState<{ cam: THREE.Vector3; vise: THREE.Vector3 } | null>(null)

  const brut = params.get("cam")?.split(",").map(Number)
  const cam: [number, number, number] =
    brut && brut.length === 3 && brut.every(Number.isFinite) ? (brut as [number, number, number]) : VUES.habitacle.cam.toArray() as [number, number, number]
  const brutVise = params.get("vise")?.split(",").map(Number)
  const cible: [number, number, number] =
    brutVise && brutVise.length === 3 && brutVise.every(Number.isFinite) ? (brutVise as [number, number, number]) : VUES.habitacle.vise.toArray() as [number, number, number]

  const surEcran = () => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __clics: number }).__clics = ((window as unknown as { __clics?: number }).__clics ?? 0) + 1
    setBut(zoome ? VUES.habitacle : VUES[variante])
    setZoome(!zoome)
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0912" }}>
      <Canvas
        camera={{ position: cam, fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance" }}
        onCreated={({ scene, camera, gl }) => {
          scene.background = new THREE.Color("#0a0912")
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
          <hemisphereLight args={["#2a2440", "#0a080e", 0.5]} />
          <ambientLight intensity={0.3} color="#a9b4d4" />
          {/* la lueur de l'écran mange le tableau de bord */}
          <pointLight
            position={[-0.075, 0.9, 0.18]}
            color={variante === "psp" ? "#9db4e8" : "#ffb98a"}
            intensity={0.6}
            distance={1.4}
            decay={2}
          />
          <Voiture variante={variante} />
          {variante === "psp" && <Psp />}
          {/* la zone cliquable de l'écran : un plan invisible posé sur la
              dalle active — le seul point chaud de la scène */}
          <ClicEcran centre={variante === "psp" ? VUES.psp.vise : ECRAN_NATIF.centre} surClic={surEcran} />
          <Rail but={but} arrive={() => setBut(null)} />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          minDistance={0.12}
          maxDistance={6}
          maxPolarAngle={Math.PI * 0.6}
          target={cible}
        />
      </Canvas>
      <Loader />
    </div>
  )
}
