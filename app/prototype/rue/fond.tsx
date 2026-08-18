"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { halo } from "./rue"

/* Le fond de la ville — le décor s'arrête à ~70 m et l'horizon était un
   vide (capture Hugo, gate #22) : dôme de ciel en dégradé + étoiles
   voilées, skyline lointaine procédurale aux fenêtres éparses, sol
   d'horizon qui comble l'entre-deux, lune voilée. Tout est peint « déjà
   dans la brume » (ShaderMaterial sans fog) : pas une lumière de plus. */

const CIEL = {
  vertexShader: `
    varying vec3 vDir;
    void main() {
      vDir = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    varying vec3 vDir;
    float hachage(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec3 d = normalize(vDir);
      float h = max(d.y, 0.0);
      /* zénith bleu nuit → horizon voilé, pollution chaude au ras —
         dosé sombre : le ciel clair donnait un air de crépuscule */
      vec3 ciel = mix(vec3(0.075, 0.065, 0.11), vec3(0.022, 0.02, 0.04), smoothstep(0.0, 0.5, h));
      ciel += vec3(0.085, 0.05, 0.022) * pow(1.0 - h, 9.0);
      /* étoiles : une par cellule angulaire, la plupart éteintes, tuées
         près de l'horizon par le voile urbain */
      vec2 a = vec2(atan(d.z, d.x) * 40.0, d.y * 60.0);
      vec2 c = floor(a);
      vec2 p = vec2(hachage(c + 1.3), hachage(c + 2.7)) * 0.6 + 0.2;
      float etoile = smoothstep(0.07, 0.0, length(fract(a) - p)) * step(0.93, hachage(c)) * smoothstep(0.12, 0.45, d.y);
      ciel += vec3(0.75, 0.8, 1.0) * etoile * (0.2 + 0.4 * hachage(c + 5.1));
      gl_FragColor = vec4(ciel, 1.0);
    }`,
}

const SKYLINE = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    varying vec2 vUv;
    float hachage(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      float col = vUv.x * 220.0;
      float id = floor(col);
      float haut = 0.12 + 0.7 * pow(hachage(vec2(id, 3.7)), 1.6);
      if (vUv.y > haut) discard;
      /* silhouette à peine détachée du ciel d'horizon — de la brume, pas
         un mur */
      vec3 teinte = mix(vec3(0.028, 0.025, 0.048), vec3(0.04, 0.036, 0.065), vUv.y / haut);
      /* fenêtres éparses, jamais aux bords des tours */
      vec2 fen = vec2(col * 4.0, vUv.y * 60.0);
      vec2 cf = floor(fen);
      vec2 ff = fract(fen);
      float allume = step(0.96, hachage(cf)) * step(0.06, fract(col)) * step(fract(col), 0.94);
      float dedans = step(0.25, ff.x) * step(ff.x, 0.75) * step(0.3, ff.y) * step(ff.y, 0.7);
      teinte += vec3(0.5, 0.35, 0.17) * allume * dedans * (0.35 + 0.5 * hachage(cf + 2.2));
      gl_FragColor = vec4(teinte, 1.0);
    }`,
}

export default function Fond() {
  const [ciel, ligne] = useMemo(
    () => [
      new THREE.ShaderMaterial({ ...CIEL, side: THREE.BackSide, depthWrite: false }),
      new THREE.ShaderMaterial({ ...SKYLINE, side: THREE.BackSide }),
    ],
    [],
  )
  return (
    <group>
      <mesh material={ciel}>
        <sphereGeometry args={[350, 32, 16]} />
      </mesh>
      <mesh material={ligne} position={[0, 17, 0]}>
        <cylinderGeometry args={[210, 210, 34, 96, 1, true]} />
      </mesh>
      {/* le sol d'horizon comble le vide entre le bord du décor et la
          skyline ; le brouillard de scène le fond dans la nuit */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.12, 0]}>
        <circleGeometry args={[400, 48]} />
        <meshBasicMaterial color="#07060a" />
      </mesh>
      {/* la lune voilée, haute au sud-ouest — assez pour exister, pas
          assez pour concurrencer les lampadaires */}
      <sprite position={[-140, 150, -240]} scale={[11, 11, 1]}>
        <spriteMaterial map={halo()} color="#e8ecf6" transparent opacity={0.85} depthWrite={false} />
      </sprite>
      <sprite position={[-140, 150, -240]} scale={[38, 38, 1]}>
        <spriteMaterial map={halo()} color="#aeb6d4" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  )
}
