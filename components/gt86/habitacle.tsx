"use client"

import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { useThree } from "@react-three/fiber"
import { SpotLight as SpotVolumetrique, useTexture } from "@react-three/drei"
import * as THREE from "three"
import { t, type Lang } from "@/components/proto/dict"
import { envNuit, halo } from "./rue"

/* L'HABITACLE — ticket #31 : l'habillage gaté aux #23/#26 (combiné violet,
   rétroéclairage par glyphe, planche Haunter, alcantara, moquette, néons),
   porté du prototype `app/prototype/ecran/` sur LA voiture de la rue.

   UNE SEULE VOITURE : le clone de rue.tsx reçoit l'intérieur en plus de sa
   robe — quand la caméra plonge dans le verre fumé (#24), l'habitacle qui
   « luisait à travers » est littéralement le même objet. Le prototype
   montait pour ça une ville coupée à 50 m (`decor-habitacle.glb`) : la
   coquille n'en a plus besoin, la rue entière est déjà montée et payée.

   TOUT NAÎT ÉTEINT. La voiture est morte depuis l'atterrissage (#30) ;
   `habilleInterieur` prépare chaque émissif à sa valeur gatée mais à
   INTENSITÉ ZÉRO, et range les matériaux dans le `Cockpit` — c'est le
   chorégraphe du seuil (seuil.tsx) qui les réveille en cascade, et
   `allumeHabitacle` qui pose l'état final d'un coup (skip, session
   revenante) : idempotent, appelable après la cascade sans rien changer.

   L'ENVIRONNEMENT : le prototype vivait de ses trois Lightformer via
   `scene.environment` — ici c'est le crépuscule du ciel qui y règne, et
   tout matériau touché reçoit donc l'équirect de nuit de rue.tsx en envMap
   PROPRE (priorité stricte, three r169) aux doses du prototype. */

export const TEXTURES_HABITACLE = {
  art: "/prototype/haunter-dash.jpg",
  lueur: "/prototype/haunter-dash-lueur.jpg",
  compteur: "/prototype/compteur-violet.jpg",
  retro: "/prototype/retro.jpg",
  fondEcran: "/prototype/ecran-fond.jpg",
}

/* les valeurs gatées (#22 pour les optiques, #23/#26 pour l'intérieur) —
   la cible des rampes du seuil ET de l'allumage direct */
export const ALLUME = {
  aiguille: 1.0,
  cadran: 1.0,
  boutons: 0.55,
  planche: 0.55,
  ecran: 1.1,
  optiques: 8,
  signature: 1.6,
  braises: 0.6,
  /* l'intensité gatée des spots volumétriques (#22) */
  faisceau: 380,
}

/* ---- l'écran en veille -------------------------------------------------- */

/* La dalle 512×256 (ratio 2:1 gravé au #23) en deux états : VEILLE
   (Rayquaza + « CLICK HERE » clignotant) et un HUB minimal (deux tuiles
   GPS/MUSIQUES par le dictionnaire — le clic sur la dalle doit répondre,
   3e retour de gate). Le GPS complet et le zoom sont le périmètre du #32,
   qui portera la fabrique entière du prototype. */
export type Veille = {
  tex: THREE.CanvasTexture
  bat: () => void
  hub: () => void
  veille: () => void
  mode: () => "veille" | "hub"
  langue: (l: Lang) => void
}

export function creeVeille(lang: Lang): Veille {
  const c = document.createElement("canvas")
  c.width = 512
  c.height = 256
  const g = c.getContext("2d")!
  const u = 256 / 100
  let fond: HTMLImageElement | null = null
  let allume = true
  let mode: "veille" | "hub" = "veille"
  /* la bascule FR/EN vit sous l'overlay et reste atteignable au clavier :
     la dalle suit la langue, elle ne fige pas celle du montage */
  let langue = lang

  const tuile = (x: number, titre: string, teinte: string, glyphe: (cx: number, cy: number, r: number) => void) => {
    const y = u * 20
    const la = 512 / 2 - u * 12
    const ha = 256 - y - u * 12
    g.beginPath()
    g.roundRect(x, y, la, ha, u * 4)
    g.fillStyle = "rgba(16, 12, 28, 0.7)"
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
    g.fillStyle = "#efe8fb"
    g.fillText(titre, cx, y + ha * 0.82)
    g.textAlign = "left"
  }

  const peint = () => {
    g.fillStyle = "#0b0d14"
    g.fillRect(0, 0, 512, 256)
    if (fond) {
      g.drawImage(fond, 0, 0, 512, 256)
      g.fillStyle = "rgba(7, 9, 16, 0.42)"
      g.fillRect(0, 0, 512, 256)
    }
    g.strokeStyle = "#2b2440"
    g.lineWidth = Math.max(2, u * 1.2)
    g.strokeRect(u * 2, u * 2, 512 - u * 4, 256 - u * 4)
    g.textBaseline = "middle"
    g.font = `${Math.round(u * 8)}px monospace`
    g.fillStyle = "#b7a8d8"
    g.textAlign = "right"
    g.fillText("23:42", 512 - u * 8, u * 10)
    g.textAlign = "left"
    if (mode === "hub") {
      /* tuiles du hub (gate #23) : GPS violet, MUSIQUES magenta */
      tuile(u * 8, t(langue, "gt86Gps").toUpperCase(), "#b57aff", (cx, cy, r) => {
        g.lineWidth = u * 1.6
        g.beginPath()
        g.arc(cx, cy, r * 0.75, 0, Math.PI * 2)
        g.stroke()
        g.beginPath()
        g.arc(cx, cy, r * 0.22, 0, Math.PI * 2)
        g.fill()
      })
      tuile(512 / 2 + u * 4, t(langue, "gt86Musiques").toUpperCase(), "#f473e8", (cx, cy, r) => {
        g.font = `bold ${Math.round(r * 2.4)}px monospace`
        g.textAlign = "center"
        g.fillText("♪", cx, cy)
        g.textAlign = "left"
      })
    } else if (allume) {
      g.textAlign = "center"
      g.font = `bold ${Math.round(u * 15)}px monospace`
      g.shadowColor = "#9b5cff"
      g.shadowBlur = u * 6
      g.fillStyle = "#d8beff"
      g.fillText("CLICK HERE", 256, 256 * 0.52)
      g.shadowBlur = 0
      g.textAlign = "left"
    }
    tex.needsUpdate = true
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  /* UV du quad Display : v ∈ [1,2] (relevé au GLB brut) → Repeat
     obligatoire, flipY par défaut remet l'image à l'endroit */
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  const img = new Image()
  img.onload = () => {
    fond = img
    peint()
  }
  img.src = TEXTURES_HABITACLE.fondEcran
  peint()

  return {
    tex,
    bat() {
      if (mode !== "veille") return
      allume = !allume
      peint()
    },
    hub() {
      mode = "hub"
      peint()
    },
    veille() {
      mode = "veille"
      allume = true
      peint()
    },
    mode: () => mode,
    langue(l: Lang) {
      langue = l
      peint()
    },
  }
}

/* ---- le cockpit : les poignées de la cascade ---------------------------- */

/* Les matériaux du clone sont clonés PAR MESH (rue.tsx) : un même nom peut
   vivre en plusieurs exemplaires — tout est rangé en tableaux.

   TOPOLOGIE DE LUMIÈRES CONSTANTE (retour de gate #31) : la clé de cache
   des programmes de three r169 inclut le NOMBRE de lumières, et un
   sous-arbre `visible=false` n'est pas collecté — basculer `visible` sur
   un groupe qui CONTIENT des lumières recompilait donc tous les matériaux
   éclairés en pleine cascade, gel synchrone pile sur le claquement
   (confirmé par revue three, invisible sur SwiftShader). Les vraies
   lumières (`neonLums`, `phareLums`) vivent DONC toujours dans le graphe à
   intensité 0 — la cascade et l'allumage ne pilotent que des UNIFORMS —
   et seuls les visuels non éclairés (`neons` : nappe + éclats ; `phares` :
   éclats d'optiques ; `phareCones` : cônes volumétriques de drei)
   basculent en `visible`. */
export type Cockpit = {
  voiture: THREE.Object3D | null
  verre: THREE.MeshPhysicalMaterial[]
  aiguille: THREE.MeshStandardMaterial[]
  cadran: THREE.MeshStandardMaterial[]
  boutons: THREE.MeshStandardMaterial[]
  planche: THREE.MeshStandardMaterial[]
  ecran: THREE.MeshStandardMaterial[]
  optiques: THREE.MeshStandardMaterial[]
  signature: THREE.MeshStandardMaterial[]
  braises: THREE.MeshStandardMaterial[]
  neons: THREE.Group | null
  neonLums: { lum: THREE.SpotLight | THREE.PointLight; plein: number }[]
  phares: THREE.Group | null
  phareLums: THREE.SpotLight[]
  phareCones: THREE.Object3D[]
}

export function cockpitVide(): Cockpit {
  return {
    voiture: null,
    verre: [],
    aiguille: [],
    cadran: [],
    boutons: [],
    planche: [],
    ecran: [],
    optiques: [],
    signature: [],
    braises: [],
    neons: null,
    neonLums: [],
    phares: null,
    phareLums: [],
    phareCones: [],
  }
}

/* la pose assise conducteur (conduite à droite, relevé #16) et la visée
   route — dans le repère BRUT du GLB, celui où le prototype écran a calé
   toutes ses vues (il montait la primitive sans recentrage) */
export const ASSISE = {
  cam: new THREE.Vector3(0.3, 1.05, -0.42),
  vise: new THREE.Vector3(0.0, 0.8, 1.2),
}

/* ---- l'habillage intérieur --------------------------------------------- */

export function habilleInterieur(
  clone: THREE.Object3D,
  textures: { art: THREE.Texture; lueur: THREE.Texture; compteur: THREE.Texture },
  veille: THREE.CanvasTexture,
  aniso: number,
  cockpit: Cockpit,
) {
  /* StrictMode et le HMR rejouent le useMemo appelant sur un clone NEUF :
     les tableaux repartent de zéro, sinon l'allumage arroserait des
     matériaux de clones jetés (les refs neons/phares, elles, tiennent au
     montage réel) */
  cockpit.verre = []
  cockpit.aiguille = []
  cockpit.cadran = []
  cockpit.boutons = []
  cockpit.planche = []
  cockpit.ecran = []
  cockpit.optiques = []
  cockpit.signature = []
  cockpit.braises = []

  const { art, lueur, compteur } = textures
  for (const t of [art, lueur, compteur]) {
    t.flipY = false
    t.colorSpace = THREE.SRGBColorSpace
  }
  /* même piège que le quad Display : les UV du combiné débordent de
     [0,1] — sans Repeat, le clamp rend le cadran noir */
  compteur.wrapS = THREE.RepeatWrapping
  compteur.wrapT = THREE.RepeatWrapping

  const env = envNuit()
  const INTERIEUR = new Set(["InteriorBlack", "InteriorStuff", "SilverPlastic", "Pedals", "Carbon"])
  let planche: THREE.Mesh | null = null

  clone.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const mat = m as THREE.MeshStandardMaterial
      if (!mat) continue
      /* le combiné passe au violet (gate #23) : même cadran à la teinte
         près, et l'aiguille suit. Le GLB n'offre AUCUN pivot d'aiguille
         (bbox du nœud Car_1 symétrique autour de son origine, les deux
         cadrans fusionnés) : le « balayage » du #24 est une surtension
         d'émissif, pas une rotation. */
      if (mat.name === "Speedo") {
        mat.map = compteur
        mat.emissiveMap = compteur
        mat.emissive = new THREE.Color("#ffffff")
        mat.emissiveIntensity = 0
        cockpit.cadran.push(mat)
      }
      if (mat.name === "Speedoneedle") {
        mat.color.set("#1a1022")
        mat.emissive.set("#a86bff")
        mat.emissiveIntensity = 0
        cockpit.aiguille.push(mat)
      }
      /* le tableau de bord s'uniformise sur la palette du HAUNTER (gate
         #26) : la luminance de la texture d'origine re-teintée en prune */
      if (mat.name === "InteriorBlack") {
        mat.roughness = 0.82
        mat.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <map_fragment>",
            `#include <map_fragment>
            {
              float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
              diffuseColor.rgb = mix(vec3(0.055, 0.035, 0.095), vec3(0.36, 0.26, 0.50), pow(lum, 0.85));
            }`,
          )
        }
        planche = mesh
      }
      /* rétroéclairage concentré PAR BOUTON (gate #26) : InteriorStuff
         porte toutes les faces de boutons — sa propre texture en carte
         émissive violette, sérigraphies claires brillantes */
      if (mat.name === "InteriorStuff") {
        mat.emissiveMap = mat.map
        mat.emissive = new THREE.Color("#8a5cff")
        mat.emissiveIntensity = 0
        cockpit.boutons.push(mat)
      }
      if (mat.name === "DashboardArtwork") {
        mat.map = art
        mat.emissiveMap = lueur
        mat.emissive = new THREE.Color("#ffffff")
        mat.emissiveIntensity = 0
        cockpit.planche.push(mat)
      }
      /* dalle éteinte = verre noir : la couleur à zéro éteint aussi la
         diffuse du Rayquaza, l'allumage la rendra blanche */
      if (mat.name === "Display") {
        mat.map = veille
        mat.emissiveMap = veille
        mat.emissive = new THREE.Color("#ffffff")
        mat.emissiveIntensity = 0
        mat.color.set("#000000")
        cockpit.ecran.push(mat)
      }
      /* les optiques : réglages gatés du #22 posés dès maintenant, mais à
         intensité ZÉRO — le claquement du seuil n'a plus qu'à monter le son */
      if (mat.name === "LightsFront") {
        mat.emissive?.set("#fff3dc")
        mat.toneMapped = false
        mat.emissiveIntensity = 0
        cockpit.optiques.push(mat)
      }
      if (mat.name === "HeadlightsTex") {
        mat.emissive?.set("#bcd6f0")
        mat.emissiveMap = mat.map
        mat.emissiveIntensity = 0
        cockpit.signature.push(mat)
      }
      if (mat.name === "RedGlow") cockpit.braises.push(mat)
      if (mat.name === "Glass") cockpit.verre.push(mat as THREE.MeshPhysicalMaterial)

      /* textures affûtées (retour Hugo #26 : l'anisotropie à 1 délavait
         tout ce qui se voit en angle rasant) */
      for (const tex of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.emissiveMap, mat.aoMap]) {
        if (tex && tex.anisotropy < aniso) {
          tex.anisotropy = aniso
          tex.needsUpdate = true
        }
      }
      /* l'intérieur mire la nuit en propre, à dose de veille — et sa
         teinte descend d'un cran (réglages gatés #26, calés alors sur les
         Lightformer que l'équirect portraiture) */
      if (INTERIEUR.has(mat.name)) {
        mat.envMap = env
        const console_ = mat.name === "InteriorStuff" || mat.name === "SilverPlastic"
        mat.envMapIntensity = console_ ? 0.35 : 0.1
        if (console_) mat.roughness = Math.min(mat.roughness, 0.45)
        mat.color.multiplyScalar(0.5)
      }
      mat.needsUpdate = true
    }
  })

  /* L'ALCANTARA du haut de planche (gate #26) — taillé dans la GÉOMÉTRIE
     (le masque shader ne se déclenchait pas au prototype) : triangles
     au-dessus de 86 cm et à plat, sheen natif de MeshPhysicalMaterial.
     Le clone n'est pas encore posé (position zéro) : matrixWorld = repère
     brut, celui où les seuils 0,86/0,36 ont été calés. */
  if (planche) {
    const cible = planche as THREE.Mesh
    cible.updateWorldMatrix(true, false)
    const geo = cible.geometry
    const pos = geo.attributes.position
    const index = geo.index
    const total = index ? index.count : pos.count
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
    const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3()
    const gardes: number[] = []
    const sommets: number[] = []
    const normales: number[] = []
    const uvs: number[] = []
    /* 1 mètre ↔ 3 tuiles de moquette */
    const K = 3
    for (let t = 0; t + 2 < total; t += 3) {
      const i0 = index ? index.getX(t) : t
      const i1 = index ? index.getX(t + 1) : t + 1
      const i2 = index ? index.getX(t + 2) : t + 2
      a.fromBufferAttribute(pos, i0).applyMatrix4(cible.matrixWorld)
      b.fromBufferAttribute(pos, i1).applyMatrix4(cible.matrixWorld)
      c.fromBufferAttribute(pos, i2).applyMatrix4(cible.matrixWorld)
      const my = (a.y + b.y + c.y) / 3
      ab.subVectors(b, a)
      ac.subVectors(c, a)
      n.crossVectors(ab, ac).normalize()
      /* haut et à plat : l'alcantara (les contre-portes montent aussi
         haut mais restent verticales) */
      if (my >= 0.86 && Math.abs(n.y) >= 0.5) gardes.push(i0, i1, i2)
      /* bas et à plat : les tapis de sol — au-dessus de 36 cm on mordait
         sur l'assise des sièges et le tunnel (vu en capture #26) */
      if (my <= 0.36 && Math.abs(n.y) >= 0.55) {
        for (const v of [a, b, c]) {
          sommets.push(v.x, v.y, v.z)
          normales.push(0, 1, 0)
          uvs.push(v.x * K, v.z * K)
        }
      }
    }
    if (gardes.length) {
      const geoAlc = new THREE.BufferGeometry()
      geoAlc.setAttribute("position", pos)
      if (geo.attributes.normal) geoAlc.setAttribute("normal", geo.attributes.normal)
      if (geo.attributes.uv) geoAlc.setAttribute("uv", geo.attributes.uv)
      geoAlc.setIndex(gardes)
      const velours = new THREE.MeshPhysicalMaterial({
        color: "#140c20",
        roughness: 1,
        metalness: 0,
        sheen: 1.5,
        sheenColor: new THREE.Color("#b79bff"),
        sheenRoughness: 0.28,
        envMap: env,
        envMapIntensity: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
      const meshAlc = new THREE.Mesh(geoAlc, velours)
      meshAlc.name = "alcantara"
      meshAlc.position.copy(cible.position)
      meshAlc.quaternion.copy(cible.quaternion)
      meshAlc.scale.copy(cible.scale)
      cible.parent?.add(meshAlc)
    }
    if (sommets.length) {
      const geoTapis = new THREE.BufferGeometry()
      geoTapis.setAttribute("position", new THREE.Float32BufferAttribute(sommets, 3))
      geoTapis.setAttribute("normal", new THREE.Float32BufferAttribute(normales, 3))
      geoTapis.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
      const moquette = new THREE.MeshStandardMaterial({
        map: textureMoquette(),
        roughness: 1,
        metalness: 0,
        envMap: env,
        envMapIntensity: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
      const meshTapis = new THREE.Mesh(geoTapis, moquette)
      meshTapis.name = "moquette"
      /* sommets déjà dans le repère du clone : le mesh vit à sa racine */
      clone.add(meshTapis)
    }
  }
}

/* l'état FINAL, d'un coup — le chemin du skip et des sessions revenantes,
   et le filet après la cascade (idempotent) */
export function allumeHabitacle(cockpit: Cockpit) {
  for (const m of cockpit.aiguille) m.emissiveIntensity = ALLUME.aiguille
  for (const m of cockpit.cadran) m.emissiveIntensity = ALLUME.cadran
  for (const m of cockpit.boutons) m.emissiveIntensity = ALLUME.boutons
  for (const m of cockpit.planche) m.emissiveIntensity = ALLUME.planche
  for (const m of cockpit.ecran) {
    m.emissiveIntensity = ALLUME.ecran
    m.color.set("#ffffff")
  }
  for (const m of cockpit.optiques) m.emissiveIntensity = ALLUME.optiques
  for (const m of cockpit.signature) m.emissiveIntensity = ALLUME.signature
  for (const m of cockpit.braises) m.emissiveIntensity = ALLUME.braises
  /* assis dedans, le verre s'éclaircit pour laisser voir la rue (réglage
     habitacle du #23 — dehors il gardait le fumé 0,8 de la plongée) */
  for (const v of cockpit.verre) {
    v.opacity = 0.4
    v.color.set("#1a2027")
  }
  /* les lumières par leurs intensités, les visuels par `visible` —
     topologie constante, aucune recompilation (voir Cockpit) */
  for (const l of cockpit.phareLums) l.intensity = ALLUME.faisceau
  for (const n of cockpit.neonLums) n.lum.intensity = n.plein
  for (const c of cockpit.phareCones) c.visible = true
  if (cockpit.neons) cockpit.neons.visible = true
  if (cockpit.phares) cockpit.phares.visible = true
}

/* l'inverse EXACT — le rejeu de la scène (4e retour de gate) rend la
   voiture à son état d'avant la mise sous contact : morte, verre fumé
   extérieur, faisceaux éteints. Idempotent comme l'allumage. */
export function eteindreHabitacle(cockpit: Cockpit) {
  for (const m of cockpit.aiguille) m.emissiveIntensity = 0
  for (const m of cockpit.cadran) m.emissiveIntensity = 0
  for (const m of cockpit.boutons) m.emissiveIntensity = 0
  for (const m of cockpit.planche) m.emissiveIntensity = 0
  for (const m of cockpit.ecran) {
    m.emissiveIntensity = 0
    m.color.set("#000000")
  }
  for (const m of cockpit.optiques) m.emissiveIntensity = 0
  for (const m of cockpit.signature) m.emissiveIntensity = 0
  for (const m of cockpit.braises) m.emissiveIntensity = 0
  for (const v of cockpit.verre) {
    v.opacity = 0.8
    v.color.set("#161b21")
  }
  for (const l of cockpit.phareLums) l.intensity = 0
  for (const n of cockpit.neonLums) n.lum.intensity = 0
  for (const c of cockpit.phareCones) c.visible = false
  if (cockpit.neons) cockpit.neons.visible = false
  if (cockpit.phares) cockpit.phares.visible = false
}

/* ---- la moquette des tapis de sol (portée du #26) ----------------------- */

let moquettePartagee: THREE.CanvasTexture | null = null
function textureMoquette(taille = 512) {
  if (moquettePartagee) return moquettePartagee
  const c = document.createElement("canvas")
  c.width = taille
  c.height = taille
  const g = c.getContext("2d")!
  g.fillStyle = "#171122"
  g.fillRect(0, 0, taille, taille)
  /* déterministe : la même moquette à chaque chargement */
  let graine = 1337
  const alea = () => {
    graine = (graine * 1103515245 + 12345) & 0x7fffffff
    return graine / 0x7fffffff
  }
  const fibres = ["#221a33", "#2b2140", "#1c1529", "#332748"]
  g.lineCap = "round"
  for (let i = 0; i < 26000; i++) {
    const x = alea() * taille
    const y = alea() * taille
    const a = alea() * Math.PI * 2
    const l = 2 + alea() * 3.5
    g.strokeStyle = fibres[(alea() * fibres.length) | 0]
    g.lineWidth = 0.7 + alea() * 0.9
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
    g.stroke()
  }
  for (let i = 0; i < 900; i++) {
    const x = alea() * taille
    const y = alea() * taille
    const a = alea() * Math.PI * 2
    g.strokeStyle = alea() > 0.55 ? "rgba(150, 118, 214, 0.5)" : "rgba(92, 74, 138, 0.45)"
    g.lineWidth = 0.8
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3)
    g.stroke()
  }
  moquettePartagee = new THREE.CanvasTexture(c)
  moquettePartagee.colorSpace = THREE.SRGBColorSpace
  moquettePartagee.wrapS = THREE.RepeatWrapping
  moquettePartagee.wrapT = THREE.RepeatWrapping
  moquettePartagee.anisotropy = 8
  return moquettePartagee
}

/* ---- la vie autour de la voiture (repère BRUT du GLB) ------------------- */

/* Le rétroviseur : POV assis fixe → le reflet est une vraie capture de la
   vue arrière plaquée sur la glace (gate #26). Toujours visible — un
   miroir n'a pas besoin de contact. */
function Retro() {
  const tex = useTexture(TEXTURES_HABITACLE.retro)
  tex.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh position={[-0.03, 1.128, 0.147]} rotation={[-0.14, 2.618, 0]}>
      <planeGeometry args={[0.23, 0.076]} />
      <meshBasicMaterial map={tex} toneMapped={false} color="#b6bfd2" />
    </mesh>
  )
}

/* les néons violets gatés (#23) : nappe additive au sol + spots plongeants
   sous caisse + accents d'habitacle. Les LUMIÈRES vivent toujours dans le
   graphe à intensité 0 (topologie constante, voir Cockpit) — seuls la
   nappe et les éclats naissent invisibles. RÉGIME du 3e retour de gate
   (« au moins 100 fps ») : les 4 pointLight d'accents deviennent des
   sprites seuls — NUM_POINT_LIGHTS tombe à ZÉRO pour toute la scène, la
   boucle disparaît de chaque shader éclairé — et les spots sous caisse
   passent de 4 à 2 (avant/arrière), la nappe additive porte la flaque. */
function Neons({ cockpit }: { cockpit: Cockpit }) {
  const cibles = useMemo(() => Array.from({ length: 2 }, () => new THREE.Object3D()), [])
  const lums = useRef<({ lum: THREE.SpotLight | THREE.PointLight; plein: number } | null)[]>([])
  const sol: [number, number][] = [[-0.075, 1.5], [-0.075, -1.4]]
  const dedans: [number, number, number][] = [
    [0.3, 0.38, 0.5],
    [-0.5, 0.38, 0.5],
    [0.1, 0.48, -0.12],
    [-0.28, 0.48, -0.12],
  ]
  /* en LAYOUT : l'allumage direct (rue.tsx, layout aussi) court au même
     montage sur le chemin vivant — les enfants collectent d'abord */
  useLayoutEffect(() => {
    cockpit.neonLums = lums.current.filter((e): e is NonNullable<typeof e> => e !== null)
  }, [cockpit])
  return (
    <group>
      {sol.map(([x, z], i) => (
        <group key={i}>
          <primitive object={cibles[i]} position={[x, 0, z]} />
          <spotLight
            ref={(l) => { lums.current[i] = l && { lum: l, plein: 5 } }}
            position={[x, 0.28, z]} target={cibles[i]} color="#8a3cff" intensity={0} angle={1.1} penumbra={0.7} distance={1.6} decay={2}
          />
        </group>
      ))}
      <group visible={false} ref={(g) => { cockpit.neons = g }}>
        <mesh position={[-0.075, 0.045, 0.05]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[3.3, 5.6]} />
          <meshBasicMaterial map={halo()} color="#7a2cf0" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {dedans.map(([x, y, z], i) => (
          <sprite key={i} position={[x, y, z]} scale={[0.16, 0.16, 1]}>
            <spriteMaterial map={halo()} color="#9b4dff" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
        ))}
      </group>
    </group>
  )
}

/* les phares qui MORDENT la rue (réglage Hugo au gizmo, #22) : deux spots
   volumétriques aux optiques, cibles 9 m devant sur l'asphalte — en repère
   voiture, ils héritent de la pose de la rue. Les LUMIÈRES sont montées à
   demeure à intensité 0 ; leurs cônes (mesh enfant du SpotLight de drei,
   dont l'éclat ne dépend PAS de l'intensité) et les éclats d'optiques
   naissent invisibles et claquent avec la cascade. */
function Phares({ cockpit }: { cockpit: Cockpit }) {
  const cibles = useMemo(() => [new THREE.Object3D(), new THREE.Object3D()], [])
  const lums = useRef<(THREE.SpotLight | null)[]>([])
  const optiques: [number, number, number][] = [
    [-0.075 + 0.63, 0.61, 1.78],
    [-0.075 - 0.63, 0.61, 1.78],
  ]
  /* en LAYOUT, même raison que Neons */
  useLayoutEffect(() => {
    cockpit.phareLums = []
    cockpit.phareCones = []
    for (const lum of lums.current) {
      if (!lum) continue
      cockpit.phareLums.push(lum)
      lum.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          o.visible = false
          cockpit.phareCones.push(o)
        }
      })
    }
  }, [cockpit])
  return (
    <group>
      {optiques.map(([x, y, z], i) => (
        <group key={i}>
          <primitive object={cibles[i]} position={[x, 0, z + 9]} />
          <SpotVolumetrique
            ref={(l: THREE.SpotLight | null) => { lums.current[i] = l }}
            position={[x, y, z]}
            target={cibles[i]}
            color="#ffeecb"
            intensity={0}
            angle={0.5}
            penumbra={0.6}
            decay={1.8}
            distance={40}
            attenuation={9}
            anglePower={5}
            radiusTop={0.14}
          />
        </group>
      ))}
      <group visible={false} ref={(g) => { cockpit.phares = g }}>
        {optiques.map(([x, y, z], i) => (
          <group key={i}>
            <sprite position={[x, y, z]} scale={[0.55, 0.55, 1]}>
              <spriteMaterial map={halo()} color="#fffaf0" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
            <sprite position={[x, y, z]} scale={[2.2, 2.2, 1]}>
              <spriteMaterial map={halo()} color="#ffeecb" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
          </group>
        ))}
      </group>
    </group>
  )
}

/* monté par rue.tsx dans le repère brut de la voiture garée */
export function VieVoiture({ cockpit }: { cockpit: Cockpit }) {
  return (
    <group>
      <Retro />
      <Neons cockpit={cockpit} />
      <Phares cockpit={cockpit} />
    </group>
  )
}

/* ---- le pouls de la veille ---------------------------------------------- */

/* Le « CLICK HERE » clignote à 650 ms (gate #23). La boucle tourne en
   continu depuis le 3e retour de gate (frameloop "always") — l'invalidate
   du battement est devenu un no-op inoffensif, gardé pour le jour où un
   régime "demand" reviendrait. */
export function Pouls({ actif, veille }: { actif: boolean; veille: Veille }) {
  const invalide = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!actif) return
    const h = setInterval(() => {
      veille.bat()
      invalide()
    }, 650)
    return () => clearInterval(h)
  }, [actif, veille, invalide])
  return null
}

/* la cascade #28 : ces textures habillent la voiture, même rang que le GLB
   voiture — préchargées au chargement du module */
useTexture.preload([TEXTURES_HABITACLE.art, TEXTURES_HABITACLE.lueur, TEXTURES_HABITACLE.compteur])
useTexture.preload(TEXTURES_HABITACLE.retro)
