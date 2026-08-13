"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Environment, Lightformer } from "@react-three/drei"
import * as THREE from "three"
import Dome from "./dome"
import { REDUIT } from "./voiture"

/* C — « Mer de nuages » : le cinématique. La GT86 vole au-dessus d'une
   nappe de nuages raymarchée (FBM 2D + tranche verticale, ~22 pas),
   crêtes embrasées par le soleil bas. Zéro asset, coût GPU plus haut. */

const SOLEIL = new THREE.Vector3(-0.3, 0.02, -1)

function MerDeNuages() {
  const materiau = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTemps: { value: 0 },
          uSoleil: { value: SOLEIL },
          uCrete: { value: new THREE.Color("#ffce8f") },
          uOmbre: { value: new THREE.Color("#8a5878") },
          uLoin: { value: new THREE.Color("#ff8c42") },
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
            float sommet = -3.2;
            float fond = -7.5;
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
            /* fondu vers l'horizon : la nappe se dissout dans la braise */
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
    [],
  )
  const ref = useRef(materiau)
  useFrame((etat) => {
    ref.current.uniforms.uTemps.value = REDUIT ? 40 : etat.clock.elapsedTime
  })
  return (
    <mesh material={materiau} rotation-x={-Math.PI / 2} position={[0, -3.2, 0]}>
      <planeGeometry args={[600, 600]} />
    </mesh>
  )
}

export default function VarianteC() {
  return (
    <>
      <Dome
        zenith="#3d3370"
        haut="#a5628f"
        bas="#e88a68"
        horizon="#ff8c42"
        soleil={SOLEIL}
        halo={0.45}
      />
      <MerDeNuages />

      {/* soleil bas derrière la voiture : contre-jour, liseré chaud —
          débouché côté caméra pour que la robe reste lisible */}
      <directionalLight position={[-4, 1, -14]} intensity={3.2} color="#ff9a4e" />
      <directionalLight position={[7, 3, 9]} intensity={1.5} color="#8a6fb5" />
      <hemisphereLight args={["#5c4a8a", "#ff8c5a", 0.9]} />

      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={4}
          color="#ffab6b"
          position={[-4, 0.5, -10]}
          scale={[12, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.7}
          color="#4a3d7a"
          position={[0, 8, 0]}
          rotation-x={Math.PI / 2}
          scale={[14, 14, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.0}
          color="#e88a68"
          position={[0, -5, 0]}
          rotation-x={-Math.PI / 2}
          scale={[16, 16, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#a988c9"
          position={[7, 1.5, 10]}
          scale={[8, 3, 1]}
        />
      </Environment>
    </>
  )
}
