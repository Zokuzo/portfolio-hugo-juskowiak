"use client"

import { Suspense, useEffect, useReducer } from "react"
import { useRouter } from "next/navigation"
import { Canvas, useLoader, useThree } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { RGBELoader } from "three-stdlib"
import * as THREE from "three"
import type { CSSProperties } from "react"
import { t, type Lang } from "@/components/proto/dict"
import { parametre } from "./capable"
import { INTRO, RAILS, REPOS, depart, marqueVue, suivant } from "./machine"
import Ciel, { CIEL_HDR, VOITURE } from "./ciel"

/* LES ASSETS ET LEUR CASCADE — ticket #28.

   Le décodeur Draco est CHEZ NOUS : drei pointe par défaut sur gstatic.com
   (`@react-three/drei/core/Gltf.js:8`). Aucun de nos GLB n'est Draco
   aujourd'hui (tout est meshopt, décodeur embarqué dans three-stdlib) — donc
   zéro requête dans les deux cas — mais le chemin est armé pour le jour où un
   export en produirait un. `public/voiture/draco/` est déjà dans le dépôt,
   octets identiques à ceux de three (vérifié). La sonde 7/7 de
   `tools/gt86/verifie.mjs` prouve qu'aucun octet ne part chez un tiers.

   La cascade (spec #25) : ce module ne charge au montage que ce que le CIEL
   demandera — la voiture et le ciel. `RGBELoader` vient de three-stdlib comme
   dans `<Environment>` de drei : même constructeur, donc MÊME clé de cache —
   les chaînes viennent de `ciel.tsx`, le préchargement d'ici sert donc son
   dôme et sa voiture sans un octet de plus. */
const VILLE = "/prototype/decor-habitacle.glb"

useGLTF.setDecoderPath("/voiture/draco/")
useGLTF.preload(VOITURE)
useLoader.preload(RGBELoader, CIEL_HDR)

/* LA COQUILLE MONTÉE — ticket #27 de la carte #15.

   Les scènes sont VIDES : ce ticket ne pose pas un triangle. Ce qu'il pose,
   c'est le squelette que #29 à #33 viendront remplir — le canvas, la machine
   à états, les rails, le skip, le départ vers les vraies routes, et le
   démontage propre. Le critère du ticket est exactement là : « vérifiable
   sans aucun contenu 3D ».

   TOUT LE TEXTE EST DU DOM EN OVERLAY, jamais porté par la 3D (doctrine de
   la spec #25) : netteté native, bilingue par le dictionnaire existant,
   accessible au clavier. Les boutons ci-dessous sont donc la forme
   définitive du mécanisme, seule leur peinture changera. */

const NUIT = "#08070f"
const ENCRE = "#e8dff5"

/* Tant que les scènes sont vides, un rail de caméra est une DURÉE, pas un
   parcours. La valeur vient du #26 : les vols de caméra y ont quitté le lerp
   par image pour une course à durée fixe, précisément parce qu'une
   interpolation par image hache dès que la cadence tombe. */
const RAIL_MS = 1100
/* Le fondu avant la navigation — même ordre de grandeur que le départ GPS
   du prototype #26. */
const DEPART_MS = 650

/* Le contexte peut être perdu à chaud (onglet en arrière-plan longtemps,
   pilote qui se réinitialise). three AVALE l'événement — `preventDefault`,
   drapeau interne, `render()` sort sans rien dire : aucune exception ne
   remonte, la scène se fige en silence. Il faut donc l'écouter soi-même.
   Dans un effet, jamais dans `onCreated` qui n'a pas de nettoyage. */
function Perte({ surRepli }: { surRepli: () => void }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const toile = gl.domElement
    const perdu = () => {
      console.warn("[gt86] contexte WebGL perdu, repli")
      surRepli()
    }
    toile.addEventListener("webglcontextlost", perdu)
    return () => toile.removeEventListener("webglcontextlost", perdu)
  }, [gl, surRepli])
  return null
}

const bouton: CSSProperties = {
  font: "500 13px/1 var(--f-mono)",
  letterSpacing: "0.14em",
  color: ENCRE,
  background: "transparent",
  border: `1px solid ${ENCRE}59`,
  borderRadius: 2,
  padding: "12px 22px",
  cursor: "pointer",
}

const discret: CSSProperties = {
  ...bouton,
  border: "none",
  padding: "8px 10px",
  color: `${ENCRE}8c`,
  fontSize: 11,
}

export default function Scene({ lang, surRepli }: { lang: Lang; surRepli: () => void }) {
  const router = useRouter()
  const [scene, envoie] = useReducer(suivant, null, depart)
  const { etat, dest } = scene
  const boom = parametre() === "boom"

  /* LES RAILS. Un `setTimeout` — une HORLOGE, pas des images : le
     `requestAnimationFrame` est étranglé quand la scène rame, piège payé au
     #26 sur la jauge du GPS. Le nettoyage annule le rail en cours, ce qui
     rend le skip immédiat et sûr même en plein atterrissage. */
  useEffect(() => {
    if (!RAILS[etat]) return
    const h = setTimeout(() => envoie({ t: "fini" }), RAIL_MS)
    return () => clearTimeout(h)
  }, [etat])

  /* L'intro est vue dès qu'on atteint l'habitacle — par le rail comme par le
     skip. Idempotent, donc sans danger sous StrictMode. */
  useEffect(() => {
    if (etat === "HABITACLE") marqueVue()
  }, [etat])

  /* LA SUITE DE LA CASCADE (#28) : chaque état télécharge ce dont le SUIVANT
     aura besoin. Le fetch de la ville part dès l'atterrissage — et aussi à
     l'habitacle, parce que le skip et les sessions revenantes y arrivent sans
     passer par l'atterrissage. Le décor ne sera MONTÉ qu'en état de repos
     (frameloop "demand") : le décodage meshopt, synchrone sur le thread
     principal, tombe boucle arrêtée — jamais pendant un rail où chaque image
     compte. `prefetch("/home")` attend que la route existe (#34). */
  useEffect(() => {
    if (etat === "ATTERRISSAGE" || etat === "HABITACLE") useGLTF.preload(VILLE)
    if (etat === "HABITACLE") router.prefetch("/work")
  }, [etat, router])

  /* DÉPART est terminal : la sortie de la machine est une VRAIE navigation
     Next, pas un état du canvas (spec #25). */
  useEffect(() => {
    if (etat !== "DEPART" || !dest) return
    const h = setTimeout(() => router.push(dest), DEPART_MS)
    return () => clearTimeout(h)
  }, [etat, dest, router])

  /* Échap rassoit — UN SEUL chemin de sortie, le même que le ‹ de l'overlay.
     Le prototype #26 en avait deux, et ils ont divergé. */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") envoie({ t: "retour" })
    }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [])

  /* Le harnais de test (`?gt86=boom`) : jeté APRÈS les hooks, pour que
     l'ordre des hooks reste constant d'un rendu à l'autre. */
  if (boom) throw new Error("gt86 : échec de montage simulé (?gt86=boom)")

  const passer = INTRO.includes(etat)

  return (
    <div
      data-etat={etat}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: NUIT }}
    >
      <Canvas
        /* En pose, la boucle s'arrête : rien à repeindre tant que le
           visiteur ne bouge pas. Elle ne tourne que sur les transitions —
           et au CIEL : c'est une pose VIVANTE (respiration de la voiture,
           houle des nuages), la machine y est au repos mais pas l'image. */
        frameloop={etat === "CIEL" || !REPOS.has(etat) ? "always" : "demand"}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", antialias: true, alpha: true }}
        camera={{ position: [0, 0, 6], fov: 45 }}
        onCreated={({ scene: s }) => {
          s.background = new THREE.Color(NUIT)
        }}
      >
        <Perte surRepli={surRepli} />
        {/* #29 a posé le ciel — #30 pose la rue, #31 l'habitacle, #32
            l'écran. Le ciel reste monté à vie (piège <Environment>, voir
            ciel.tsx), seul `visible` bascule quand on quitte le vol. */}
        <Suspense fallback={null}>
          <Ciel
            visible={etat === "CIEL" || etat === "ATTERRISSAGE"}
            surClic={() => envoie({ t: "clic" })}
          />
        </Suspense>
      </Canvas>

      {/* L'OVERLAY. `inset: 0` par-dessus le canvas, mais transparent aux
          clics : seuls les boutons en reçoivent — c'est ce qui laisse le
          clic sur la voiture flottante (#29) atteindre le canvas et son
          raycast. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 20,
            left: 22,
            font: "500 11px/1 var(--f-mono)",
            letterSpacing: "0.18em",
            color: `${ENCRE}59`,
          }}
        >
          {t(lang, "gt86Chantier")} · {etat}
        </span>

        {/* La consigne du gate #21 : sous la mer de nuages, encre sombre sur
            les crêtes claires — un bouton, pas un décor : même signal que le
            clic sur la carrosserie, et accessible au clavier. Elle quitte le
            centre du cadre pour ne pas voler le clic 3D à la voiture. */}
        {etat === "CIEL" && (
          <button
            type="button"
            style={{
              position: "absolute",
              bottom: 28,
              left: "50%",
              transform: "translateX(-50%)",
              font: "500 18px/1 var(--f-mono)",
              letterSpacing: "0.04em",
              color: "#241a3d",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              pointerEvents: "auto",
            }}
            data-gt86="demarrer" onClick={() => envoie({ t: "clic" })}
          >
            {t(lang, "gt86Demarrer")}
          </button>
        )}

        <div style={{ display: "flex", gap: 14, pointerEvents: "auto" }}>
          {(etat === "ATTERRISSAGE" || etat === "SEUIL") && (
            <span style={{ ...discret, pointerEvents: "none" }}>{t(lang, "gt86EnRoute")}</span>
          )}

          {etat === "HABITACLE" && (
            <>
              <button type="button" style={bouton} data-gt86="gps" onClick={() => envoie({ t: "va", ou: "GPS" })}>
                {t(lang, "gt86Gps")}
              </button>
              <button type="button" style={bouton} data-gt86="musiques" onClick={() => envoie({ t: "va", ou: "MUSIQUES" })}>
                {t(lang, "gt86Musiques")}
              </button>
            </>
          )}

          {etat === "GPS" && (
            <>
              <button type="button" style={bouton} data-gt86="maison" onClick={() => envoie({ t: "choisit", dest: "/home" })}>
                {t(lang, "gt86Maison")}
              </button>
              <button type="button" style={bouton} data-gt86="travail" onClick={() => envoie({ t: "choisit", dest: "/work" })}>
                {t(lang, "gt86Travail")}
              </button>
            </>
          )}

          {etat === "CHOIX" && (
            <button type="button" style={bouton} data-gt86="partir" onClick={() => envoie({ t: "confirme" })}>
              {t(lang, "gt86Partir")} → {dest}
            </button>
          )}

          {etat === "MUSIQUES" && (
            <button type="button" style={bouton} data-gt86="spotify" onClick={() => envoie({ t: "confirme" })}>
              Spotify
            </button>
          )}

          {etat === "SPOTIFY" && <span style={{ ...discret, pointerEvents: "none" }}>Spotify</span>}

          {etat === "DEPART" && (
            <span style={{ ...discret, pointerEvents: "none" }}>
              {t(lang, "gt86Partir")} → {dest}
            </span>
          )}
        </div>

        {/* Le skip, discret, présent de CIEL à SEUIL — et lui seul mène à
            l'habitacle-hub, qui EST le menu du site (spec #25). */}
        {passer && (
          <button
            type="button"
            style={{ ...discret, position: "absolute", right: 20, bottom: 18, pointerEvents: "auto" }}
            data-gt86="passer" onClick={() => envoie({ t: "passer" })}
          >
            {t(lang, "gt86Passer")}
          </button>
        )}

        {etat !== "HABITACLE" && !passer && etat !== "DEPART" && (
          <button
            type="button"
            style={{ ...discret, position: "absolute", left: 20, bottom: 18, pointerEvents: "auto" }}
            data-gt86="retour" onClick={() => envoie({ t: "retour" })}
          >
            ‹ {t(lang, "gt86Retour")}
          </button>
        )}
      </div>
    </div>
  )
}
