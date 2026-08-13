"use client"

import { useLoader } from "@react-three/fiber"
import { Environment, Lightformer } from "@react-three/drei"
import { RGBELoader } from "three-stdlib"
import * as THREE from "three"
import MerDeNuages from "./mer-de-nuages"
import Aura from "./aura"

/* B — « Pellicule » : la vraie photo, gradée. HDRI qwantani_dusk_2_puresky
   (Poly Haven, CC0, 1k, 1,2 Mo) auto-hébergée — un crépuscule lavande au
   soleil bas, monté sur dôme et teinté chaud (multiply) : c'est le
   « HDRI teintée » du ticket. L'IBL reste la photo brute (reflets vrais).
   Les puresky natifs ne sont jamais rosé-orangé une fois tone-mappés —
   la teinte est le concept, pas un pis-aller. */

/* le soleil de la pellicule, placé en haut-gauche du cadre de chargement —
   il sculpte les crêtes par le dessus et porte le sunburst (réf. Porsche) */
const SOLEIL = new THREE.Vector3(0.25, 0.6, -1.0)

export default function VarianteB() {
  /* bouton de réglage du prototype : ?rot=0.25 (en unités de π) tourne le
     ciel pour placer le soleil — 0.25 retenu après balayage en captures */
  const rot = Math.PI * Number(new URLSearchParams(window.location.search).get("rot") ?? "0.25")
  const hdr = useLoader(RGBELoader, "/prototype/crepuscule.hdr")
  return (
    <>
      <mesh rotation-y={rot} frustumCulled={false}>
        <sphereGeometry args={[350, 48, 32]} />
        <meshBasicMaterial
          map={hdr}
          color="#d8927a"
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      {/* le ciel brumeux n'a rien de net à mirer — même poli, le métal
          paraît satin. Les lames de lumière découpent des éclats francs
          dans la robe et le verre, le fond ne bouge pas. */}
      <Environment
        files="/prototype/crepuscule.hdr"
        environmentIntensity={0.6}
        environmentRotation={[0, rot, 0]}
        resolution={512}
      >
        <Lightformer
          form="rect"
          intensity={12}
          color="#fff4e2"
          position={[0, 7, -3]}
          target={[0, 0, 0]}
          scale={[20, 2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={8}
          color="#ffd9b0"
          position={[-7, 2, -7]}
          target={[0, 0, 0]}
          scale={[12, 1.5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={4}
          color="#cdbce8"
          position={[7, -2.5, 6]}
          target={[0, 0, 0]}
          scale={[12, 1.2, 1]}
        />
      </Environment>
      <directionalLight position={[3, 7, -12]} intensity={1.4} color="#ffa05a" />
      <hemisphereLight args={["#e8b8d8", "#ff9a6b", 0.6]} />
      {/* débouche l'habitacle derrière le verre fumé */}
      <ambientLight intensity={0.55} color="#ffe2d2" />

      {/* le verdict « aura divine » (réf. Porsche dans les cumulus) : un
          banc épais et sculpté sous la voiture, des masses éparses
          au-dessus, le sunburst qui perce */}
      <MerDeNuages
        soleil={SOLEIL}
        crete="#ffe3c4"
        ombre="#c28f92"
        loin="#eba48e"
        sommet={-2}
        fond={-14}
        couverture={0.1}
        echelle={0.03}
      />
      <MerDeNuages
        sens="plafond"
        soleil={SOLEIL}
        crete="#fff0da"
        ombre="#d8a49c"
        loin="#eba48e"
        sommet={8}
        fond={20}
        couverture={0.5}
        echelle={0.045}
      />
      <Aura direction={SOLEIL} taille={230} />
    </>
  )
}
