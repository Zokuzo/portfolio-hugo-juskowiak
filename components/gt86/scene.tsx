"use client"

import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from "react"
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
import Rue from "./rue"
import Vol, { VOL_MS, type Trajectoire } from "./vol"
import Seuil, { SEUIL_MS } from "./seuil"
import { Pouls, cockpitVide, creeVeille, type Veille } from "./habitacle"

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
   dôme et sa voiture sans un octet de plus. Les textures de l'habitacle
   (#31) partent au même rang, depuis habitacle.tsx : elles habillent la
   voiture. La ville coupée du prototype (`decor-habitacle.glb`) ne sert
   plus — l'habitacle vit dans la rue entière, déjà montée. */

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

/* Le fondu avant la navigation — même ordre de grandeur que le départ GPS
   du prototype #26. */
const DEPART_MS = 650
/* le verre fumé gaté (#21/#24) : la couleur du voile de la plongée */
const VERRE = "#161b21"

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

  /* Le vol d'atterrissage (#30) : ses canaux vivent dans une ref — les
     scènes les consomment par frame, React ne re-rend rien. `chute: 1`
     au départ = la voiture de la rue est posée (skip, session revenante). */
  const vol = useRef<Trajectoire>({ t: 0, plonge: 0, chute: 1 })
  const voile = useRef<HTMLDivElement>(null)
  /* le seuil (#31) : son voile verre, son nom, et le cockpit — les poignées
     de la cascade, partagées entre la rue (qui les remplit) et le
     chorégraphe (qui les réveille) */
  const voileVerre = useRef<HTMLDivElement>(null)
  const nom = useRef<HTMLDivElement>(null)
  const cockpit = useRef(cockpitVide()).current
  /* l'écran en veille — une seule instance par montage (StrictMode
     fabriquait deux dalles au prototype, matériau et clics séparés) */
  const veilleRef = useRef<Veille | null>(null)
  if (!veilleRef.current) veilleRef.current = creeVeille()
  const veille = veilleRef.current
  /* voiture + ciel décodés → la rue se monte en sourdine pendant le CIEL
     (décodage meshopt synchrone : jamais pendant le rail) */
  const [cielPret, setCielPret] = useState(false)
  const surPret = useCallback(() => setCielPret(true), [])
  /* la bascule ciel → rue du vol, derrière le voile plein — un état React,
     pas un `visible` impératif : une seule source de vérité */
  const [enRue, setEnRue] = useState(false)
  const surBascule = useCallback(() => setEnRue(true), [])

  /* LES RAILS. Un `setTimeout` — une HORLOGE, pas des images : le
     `requestAnimationFrame` est étranglé quand la scène rame, piège payé au
     #26 sur la jauge du GPS. Le nettoyage annule le rail en cours, ce qui
     rend le skip immédiat et sûr même en plein atterrissage.
     ATTERRISSAGE et SEUIL : leurs chorégraphes (vol.tsx, seuil.tsx)
     envoient le vrai « fini » au bout de leur course, toujours en phase
     avec l'image — l'horloge ne reste qu'en FILET, large, au cas où la
     boucle de rendu meurt. */
  useEffect(() => {
    if (!RAILS[etat]) return
    const h = setTimeout(() => envoie({ t: "fini" }), (etat === "ATTERRISSAGE" ? VOL_MS : SEUIL_MS) + 4000)
    return () => clearTimeout(h)
  }, [etat])

  /* L'intro est vue dès qu'on atteint l'habitacle — par le rail comme par le
     skip. Idempotent, donc sans danger sous StrictMode. */
  useEffect(() => {
    if (etat === "HABITACLE") marqueVue()
  }, [etat])

  /* LA SUITE DE LA CASCADE (#28) : chaque état télécharge ce dont le
     SUIVANT aura besoin. Depuis le #31 l'habitacle vit dans la rue déjà
     chargée — il ne reste à l'habitacle qu'à précharger la route de
     sortie. `prefetch("/home")` attend que la route existe (#34). */
  useEffect(() => {
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
  /* après le seuil (habitacle et états suivants — skip et sessions
     revenantes compris) : voiture vivante, caméra assise */
  const apres = !passer

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
        onCreated={(st) => {
          st.scene.background = new THREE.Color(NUIT)
          /* poignée des outils de capture CDP (télémétrie, gates visuels) —
           même rôle que window.__scene des prototypes ; expose caméra,
           scène et invalidate() pour poser des vues en frameloop demand */
          Object.assign(window as object, { __gt86: st })
        }}
      >
        <Perte surRepli={surRepli} />
        {/* #29 a posé le ciel, #30 la rue et le vol — #31 l'habitacle, #32
            l'écran. Le ciel reste monté à vie (piège <Environment>, voir
            ciel.tsx), seul `visible` bascule ; la rue attend que le ciel
            soit décodé (ou qu'on l'ait déjà quitté) pour se monter, et
            devient le fond de TOUS les états d'après. */}
        <Vol etat={etat} vol={vol} voile={voile} surBascule={surBascule} fini={() => envoie({ t: "fini" })} />
        <Seuil etat={etat} cockpit={cockpit} voile={voileVerre} nom={nom} fini={() => envoie({ t: "fini" })} />
        <Pouls actif={etat === "SEUIL" || apres} veille={veille} />
        <Suspense fallback={null}>
          <Ciel
            visible={etat === "CIEL" || (etat === "ATTERRISSAGE" && !enRue)}
            surClic={() => envoie({ t: "clic" })}
            surPret={surPret}
            vol={vol}
          />
        </Suspense>
        {(cielPret || etat !== "CIEL") && (
          <Suspense fallback={null}>
            <Rue
              visible={enRue || (etat !== "CIEL" && etat !== "ATTERRISSAGE")}
              vol={vol}
              pose={etat === "SEUIL" ? "rue" : apres ? "assis" : null}
              cockpit={cockpit}
              veille={veille}
              vivant={apres}
            />
          </Suspense>
        )}
      </Canvas>

      {/* le voile de la bascule ciel → rue : crème des crêtes, piloté par
          le vol image par image, transparent aux clics */}
      <div
        ref={voile}
        style={{
          position: "absolute",
          inset: 0,
          background: "#ffe3c4",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* le nom du seuil (#24) : posé sur le claquement des phares, dans le
          tiers haut pour laisser la voiture au centre — opacité pilotée
          image par image par seuil.tsx */}
      {etat === "SEUIL" && (
        <div
          ref={nom}
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <div style={{ textAlign: "center", transform: "translateY(-15vh)" }}>
            <div
              style={{
                font: "500 clamp(22px, 3vw, 34px)/1.25 var(--f-mono)",
                letterSpacing: "0.1em",
                color: ENCRE,
                textShadow: "0 0 26px rgba(138, 92, 255, 0.4)",
              }}
            >
              {t(lang, "gt86Nom")}
            </div>
            <div
              style={{
                marginTop: 12,
                font: "500 12px/1 var(--f-mono)",
                letterSpacing: "0.34em",
                color: `${ENCRE}b3`,
              }}
            >
              {t(lang, "gt86Titre").toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* le voile de la plongée (#24) : le verre fumé emplit le cadre et
          son noir devient l'obscurité — couvre la traversée du near plane,
          se dissout en CSS sur la vue assise */}
      <div
        ref={voileVerre}
        style={{
          position: "absolute",
          inset: 0,
          background: VERRE,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

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

        {/* les commandes d'état : en bas du cadre depuis le #31 — la vue
            assise est la scène, les boutons DOM (placeholders jusqu'à
            l'écran du #32) n'ont plus à squatter son centre */}
        <div
          style={{
            position: "absolute",
            bottom: 64,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 14,
            pointerEvents: "auto",
          }}
        >
          {etat === "ATTERRISSAGE" && (
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
