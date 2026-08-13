"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Billboard } from "@react-three/drei"
import * as THREE from "three"
import { REDUIT } from "./voiture"

/* L'aura divine : un sunburst additif face caméra — cœur incandescent,
   voile large, rayons angulaires qui frémissent lentement. Posé sur la
   direction du soleil, derrière la voiture, devant le dôme. */
export default function Aura({
  direction,
  taille = 190,
  teinte = "#fff1d8",
}: {
  direction: THREE.Vector3
  taille?: number
  teinte?: string
}) {
  const materiau = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTemps: { value: 0 },
          uTeinte: { value: new THREE.Color(teinte) },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTemps; uniform vec3 uTeinte;
          varying vec2 vUv;
          void main() {
            vec2 c = vUv - 0.5;
            float r = length(c) * 2.0;
            float a = atan(c.y, c.x);
            float rayons =
              pow(abs(sin(a * 9.0 + sin(a * 3.0 + uTemps * 0.05) * 1.5)), 3.0) * 0.5 +
              pow(abs(sin(a * 17.0 - uTemps * 0.03)), 6.0) * 0.35;
            float coeur = exp(-r * 3.2) * 1.6;
            float voile = exp(-r * 1.2) * 0.35;
            float alpha = coeur + voile + rayons * smoothstep(1.0, 0.15, r) * 0.5;
            /* vignette circulaire : le quad additif meurt avant ses bords,
               sinon son rectangle se lit en filigrane dans le ciel */
            alpha *= smoothstep(1.0, 0.7, r);
            gl_FragColor = vec4(uTeinte * alpha, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [teinte],
  )
  const ref = useRef(materiau)
  ref.current = materiau
  useFrame((etat) => {
    ref.current.uniforms.uTemps.value = REDUIT ? 0 : etat.clock.elapsedTime
  })
  const position = useMemo(
    () => direction.clone().normalize().multiplyScalar(300),
    [direction],
  )
  return (
    <Billboard position={position.toArray()}>
      {/* rendue après les nappes : les rayons percent les nuages */}
      <mesh material={materiau} renderOrder={10}>
        <planeGeometry args={[taille, taille]} />
      </mesh>
    </Billboard>
  )
}
