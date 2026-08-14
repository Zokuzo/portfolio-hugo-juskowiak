"use client"

import { useEffect, useMemo } from "react"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

/* Le décor sourcé (variantes B/C/D du gate #22) : un GLB optimisé posé tel
   quel. La bbox part en console au montage — c'est la sonde qui donne
   l'échelle et le centre pour caler la voiture dans chaque décor. */
export default function DecorGlb({
  fichier,
  echelle = 1,
  position = [0, 0, 0],
  rotationY = 0,
  sonde,
  nuit,
}: {
  fichier: string
  echelle?: number
  position?: [number, number, number]
  rotationY?: number
  /* centre de la sonde de sol : imprime en console la hauteur du premier
     impact d'un rayon vertical, sur une grille de ±10 m — c'est la carte
     qui dit où une voiture peut poser ses roues */
  sonde?: [number, number, number]
  /* la ville s'habite : les vitrages du décor s'allument de l'intérieur
     (émissif chaud voilé par leur propre texture — patchwork de fenêtres) */
  nuit?: boolean
}) {
  const { scene } = useGLTF(fichier)

  const modele = useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      /* les décors d'auteurs arrivent avec des réglages disparates — on
         normalise ce qui coûte : pas d'ombres, frustum culling actif */
      mesh.castShadow = false
      mesh.receiveShadow = false
      if (nuit) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const m of mats) {
          const mat = m as THREE.MeshStandardMaterial
          /* les fenêtres de ce décor sont PEINTES dans les textures de
             façade (24 sommets pour tout un mur de brique — vérifié à
             l'analyse) : impossible d'aligner des quads dessus. Alors ce
             sont les pixels sombres de la texture eux-mêmes qui s'allument
             — inversion de luminance en émissif, modulée par un bruit
             cellulaire (~1 fenêtre) pour que seules certaines vivent.
             Alignement parfait par construction. */
          if (mat?.name === "CityGen_LR_Facades" || mat?.name === "CityGenGlass.001") {
            mat.onBeforeCompile = (shader) => {
              shader.vertexShader = shader.vertexShader
                .replace("#include <common>", "#include <common>\nvarying vec3 vPosMonde;")
                .replace(
                  "#include <begin_vertex>",
                  "#include <begin_vertex>\nvPosMonde = (modelMatrix * vec4(position, 1.0)).xyz;",
                )
              shader.fragmentShader = shader.fragmentShader
                .replace(
                  "#include <common>",
                  "#include <common>\nvarying vec3 vPosMonde;\nfloat hachageFen(vec2 p){return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);}",
                )
                .replace(
                  "#include <emissivemap_fragment>",
                  `#include <emissivemap_fragment>
                  {
                    float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
                    /* seules les vraies vitres (très sombres) comptent */
                    float vitre = smoothstep(0.10, 0.04, lum);
                    vec2 cellule = vec2(floor(vPosMonde.y / 1.5), floor((vPosMonde.x + vPosMonde.z) / 1.7));
                    /* une ville dort : ~10 % de fenêtres vivent, moitié
                       moins au rez-de-chaussée, chacune à sa luminosité */
                    float seuil = vPosMonde.y < 5.0 ? 0.95 : 0.90;
                    float allume = step(seuil, hachageFen(cellule));
                    float dose = 0.25 + 0.55 * hachageFen(cellule + 7.3);
                    vec3 teinteFen = mix(vec3(1.0, 0.72, 0.42), vec3(0.75, 0.83, 1.0), step(0.7, hachageFen(cellule + 3.1)));
                    totalEmissiveRadiance += teinteFen * vitre * allume * dose;
                  }`,
                )
            }
            mat.needsUpdate = true
          }
        }
      }
    })
    return scene
  }, [scene, nuit])

  useEffect(() => {
    const boite = new THREE.Box3().setFromObject(modele)
    const taille = boite.getSize(new THREE.Vector3())
    const centre = boite.getCenter(new THREE.Vector3())
    console.log(
      `[decor] ${fichier} bbox taille=(${taille.x.toFixed(1)}, ${taille.y.toFixed(1)}, ${taille.z.toFixed(1)}) centre=(${centre.x.toFixed(1)}, ${centre.y.toFixed(1)}, ${centre.z.toFixed(1)}) minY=${boite.min.y.toFixed(2)}`,
    )
    if (!sonde) return
    modele.parent?.updateWorldMatrix(true, true)
    const ray = new THREE.Raycaster()
    const bas = new THREE.Vector3(0, -1, 0)
    for (let dz = -24; dz <= 24; dz += 3) {
      let ligne = `z=${String(sonde[2] + dz).padStart(4)} |`
      for (let dx = -24; dx <= 24; dx += 3) {
        ray.set(new THREE.Vector3(sonde[0] + dx, 60, sonde[2] + dz), bas)
        const impact = ray.intersectObject(modele, true)[0]
        ligne += (impact ? (60 - impact.distance).toFixed(1) : "·").padStart(6)
      }
      console.log("[sol] " + ligne)
    }
    let entete = "[sol] x =    |"
    for (let dx = -24; dx <= 24; dx += 3) entete += String(sonde[0] + dx).padStart(6)
    console.log(entete)
  }, [modele, fichier, sonde])

  return (
    <group position={position} rotation-y={rotationY} scale={echelle}>
      <primitive object={modele} />
    </group>
  )
}
