import * as THREE from "three"
import { pmremDuCiel, type Robe } from "./carrosserie"

/* PROTOTYPE JETABLE (#62) : quatre rendus du verre et du vernis au ciel,
   commutables par ?reflets=a|b|c|d (sans paramètre : la prod). Cible de
   Hugo (2026-10-21) : « photoréaliste ». Verdict à l'œil, puis la
   gagnante rejoint ciel.tsx et carrosserie.tsx et ce fichier disparaît.

   Le photoréel tient en trois corrections physiques :
   - un verre est diélectrique (metalness 0, IOR 1,5) : son reflet vient
     du Fresnel, faible de face, franc en rasant, jamais teinté ;
   - il mire SA PMREM propre (pmremDuCiel), sinon three r169 impose
     l'environmentIntensity de la scène et ignore la sienne ;
   - vernis et verre mirent le ciel à la même intensité que tout le reste
     (0,6 de l'<Environment>), là où la prod sous-dose la caisse à 0,28.

   Rien que des uniformes et une envMap de même type (cube UV, même
   taille) : aucun programme de plus. Appliqué au montage, avant le
   rideau, sur la voiture du ciel seule : la rue clone ses matériaux et
   repose les siens. */

type Reglage = {
  verre: { couleur: string; metal: number; rugosite: number; reflet: number; opacite: number }
  vernis: { reflet: number; rugosite: number }
}
type Cle = "a" | "b" | "c" | "d"

/* 1er tour écarté : vernis et verre à 0,6 ou 1 délavaient tout, le
   crépuscule est clair partout, la voiture blanche virait laiteuse. Le
   2e tour garde le vernis de la prod (0,28) et assombrit les vitres : en
   photo, une vitre est sombre parce qu'elle mire le bas et l'habitacle,
   le ciel n'y passe qu'en éclat net. */
const REGLAGES: Record<Cle, Reglage> = {
  /* a, vitre noire diélectrique, éclat du ciel dosé */
  a: {
    verre: { couleur: "#050608", metal: 0, rugosite: 0, reflet: 0.5, opacite: 0.92 },
    vernis: { reflet: 0.28, rugosite: 0.03 },
  },
  /* b, a avec un éclat plus franc */
  b: {
    verre: { couleur: "#050608", metal: 0, rugosite: 0, reflet: 0.85, opacite: 0.92 },
    vernis: { reflet: 0.28, rugosite: 0.03 },
  },
  /* c, a et un vernis plus net, à peine plus mirant */
  c: {
    verre: { couleur: "#050608", metal: 0, rugosite: 0, reflet: 0.5, opacite: 0.92 },
    vernis: { reflet: 0.35, rugosite: 0.008 },
  },
  /* d, c avec des vitres fumé bleu acier, l'habitacle s'y devine */
  d: {
    verre: { couleur: "#0c1118", metal: 0, rugosite: 0, reflet: 0.7, opacite: 0.86 },
    vernis: { reflet: 0.35, rugosite: 0.008 },
  },
}

function reglageVoulu(): Reglage | undefined {
  const cle = new URLSearchParams(window.location.search).get("reflets")
  return cle && cle in REGLAGES ? REGLAGES[cle as Cle] : undefined
}

export function poseReflets(modele: THREE.Object3D, robe: Robe, scene: THREE.Scene, gl: THREE.WebGLRenderer) {
  const reglage = reglageVoulu()
  if (!reglage || !scene.environment) return
  const propre = pmremDuCiel(scene, gl)
  modele.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (m?.name !== "Glass") continue
      const verre = m as THREE.MeshPhysicalMaterial
      verre.color.set(reglage.verre.couleur)
      verre.metalness = reglage.verre.metal
      verre.roughness = reglage.verre.rugosite
      verre.ior = 1.5
      verre.clearcoatRoughness = 0
      verre.opacity = reglage.verre.opacite
      verre.envMap = propre
      verre.envMapRotation.copy(scene.environmentRotation)
      verre.envMapIntensity = reglage.verre.reflet
    }
  })
  robe.caisse.envMapIntensity = reglage.vernis.reflet
  robe.caisse.clearcoatRoughness = reglage.vernis.rugosite
}
