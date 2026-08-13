"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { REDUIT } from "./voiture"

/* La nappe de nuages raymarchée (FBM 2D + tranche verticale, ~22 pas),
   née dans la variante C, partagée depuis que la Pellicule l'a adoptée
   à la place des billboards cotonneux. Palette et altitude par props. */
export default function MerDeNuages({
  soleil,
  crete = "#ffce8f",
  ombre = "#8a5878",
  loin = "#ff8c42",
  sommet = -3.2,
  fond = -7.5,
}: {
  soleil: THREE.Vector3
  crete?: string
  ombre?: string
  loin?: string
  sommet?: number
  fond?: number
}) {
  const materiau = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTemps: { value: 0 },
          uSoleil: { value: soleil },
          uCrete: { value: new THREE.Color(crete) },
          uOmbre: { value: new THREE.Color(ombre) },
          uLoin: { value: new THREE.Color(loin) },
          uSommet: { value: sommet },
          uFond: { value: fond },
        },
        vertexShader: /* glsl */ `
          varying vec3 vMonde;
          void main() {
            vec4 m = modelMatrix * vec4(position, 1.0);
            vMonde = m.xyz;
            gl_Position = projectionMatrix * viewMatrix * m;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTemps; uniform vec3 uSoleil;
          uniform vec3 uCrete; uniform vec3 uOmbre; uniform vec3 uLoin;
          uniform float uSommet; uniform float uFond;
          varying vec3 vMonde;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          float bruit(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }
          float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            for (int k = 0; k < 4; k++) {
              v += a * bruit(p);
              p = p * 2.03 + vec2(17.0, 31.0);
              a *= 0.5;
            }
            return v;
          }
          /* densité de la nappe : FBM horizontal, atténué vers le haut
             de la tranche pour des sommets bombés */
          float densite(vec3 p, float sommet, float fond) {
            float n = fbm(p.xz * 0.055 + vec2(uTemps * 0.012, uTemps * 0.004));
            float niveau = mix(fond, sommet, n);
            return smoothstep(p.y, p.y + 1.2, niveau);
          }
          void main() {
            float sommet = uSommet;
            float fond = uFond;
            vec3 dir = normalize(vMonde - cameraPosition);
            if (dir.y > -0.005) discard;
            vec3 p = vMonde;
            float pas = (sommet - fond) / 22.0 / max(-dir.y, 0.12);
            pas = min(pas, 6.0);
            vec3 soleil = normalize(uSoleil);
            float transmis = 1.0;
            vec3 acc = vec3(0.0);
            for (int k = 0; k < 22; k++) {
              float d = densite(p, sommet, fond);
              if (d > 0.01) {
                float versSoleil = densite(p + soleil * 1.6, sommet, fond);
                float eclat = clamp(d - versSoleil, 0.0, 1.0);
                vec3 c = mix(uOmbre, uCrete, eclat * 2.2 + 0.12);
                float a = d * 0.38;
                acc += c * a * transmis;
                transmis *= 1.0 - a;
                if (transmis < 0.03) break;
              }
              p += dir * pas;
              if (p.y < fond) break;
            }
            float alpha = 1.0 - transmis;
            /* fondu vers l'horizon : la nappe se dissout dans le ciel */
            float dist = length(vMonde.xz - cameraPosition.xz);
            float brume = smoothstep(90.0, 300.0, dist);
            vec3 c = mix(acc / max(alpha, 0.001), uLoin, brume);
            alpha *= 1.0 - brume * 0.35;
            gl_FragColor = vec4(c, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [soleil, crete, ombre, loin, sommet, fond],
  )
  const ref = useRef(materiau)
  ref.current = materiau
  useFrame((etat) => {
    ref.current.uniforms.uTemps.value = REDUIT ? 40 : etat.clock.elapsedTime
  })
  return (
    <mesh material={materiau} rotation-x={-Math.PI / 2} position={[0, sommet, 0]}>
      <planeGeometry args={[600, 600]} />
    </mesh>
  )
}
