"use client"

import { useMemo } from "react"
import * as THREE from "three"

/* Le dôme peint : dégradé vertical à quatre tons + disque solaire + halo,
   dithering contre le banding. Servi par les variantes A et C avec leurs
   palettes respectives. */
export default function Dome({
  zenith,
  haut,
  bas,
  horizon,
  soleil,
  halo = 0.35,
}: {
  zenith: string
  haut: string
  bas: string
  horizon: string
  soleil: THREE.Vector3
  halo?: number
}) {
  const materiau = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uZenith: { value: new THREE.Color(zenith) },
          uHaut: { value: new THREE.Color(haut) },
          uBas: { value: new THREE.Color(bas) },
          uHorizon: { value: new THREE.Color(horizon) },
          uSoleil: { value: soleil },
          uHalo: { value: halo },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uZenith; uniform vec3 uHaut; uniform vec3 uBas;
          uniform vec3 uHorizon; uniform vec3 uSoleil; uniform float uHalo;
          varying vec3 vDir;
          float hachure(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 c = mix(uHorizon, uBas, smoothstep(-0.18, 0.06, h));
            c = mix(c, uHaut, smoothstep(0.02, 0.24, h));
            c = mix(c, uZenith, smoothstep(0.20, 0.60, h));
            float s = max(dot(d, normalize(uSoleil)), 0.0);
            c += vec3(1.0, 0.85, 0.62) * pow(s, 220.0) * 1.05;
            c += vec3(1.0, 0.60, 0.36) * pow(s, 6.0) * uHalo;
            c += (hachure(gl_FragCoord.xy) - 0.5) / 255.0;
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [zenith, haut, bas, horizon, soleil, halo],
  )

  return (
    <mesh material={materiau} frustumCulled={false}>
      <sphereGeometry args={[350, 32, 24]} />
    </mesh>
  )
}
