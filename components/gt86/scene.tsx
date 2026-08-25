"use client"

import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Canvas, useLoader, useThree } from "@react-three/fiber"
import { Stats, useGLTF, useProgress } from "@react-three/drei"
import { RGBELoader } from "three-stdlib"
import * as THREE from "three"
import type { CSSProperties } from "react"
import { t, type Lang } from "@/components/proto/dict"
import { parametre } from "./capable"
import { INTRO, RAILS, depart, marqueVue, suivant } from "./machine"
import Ciel, { CIEL_HDR, VOITURE } from "./ciel"
import Rue from "./rue"
import Vol, { VOL_MS, type Trajectoire } from "./vol"
import Seuil, { SEUIL_MS } from "./seuil"
import { Pouls, cockpitVide } from "./habitacle"
import { PLAYLISTS, PROFIL_SPOTIFY, creeEcran, type Ecran, type ModeEcran, type Zone } from "./ecran"
import { MoteurSpotify, RythmeAmp, type CommandesSpotify } from "./spotify"

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

/* la sentinelle du chargement : montée DANS le Suspense de la rue, elle
   ne commit que quand tous les chargeurs du même bord ont résolu — c'est
   le « rue décodée » de l'écran de chargement */
function Sentinelle({ surPret }: { surPret: () => void }) {
  useEffect(() => surPret(), [surPret])
  return null
}

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
  /* les commandes du player (le moteur audio maison, 7e retour #33) */
  const commandesSpotify = useRef<CommandesSpotify | null>(null)
  const cockpit = useRef(cockpitVide()).current
  /* L'ÉCRAN MÉDIA (#32) — une seule instance par montage (StrictMode
     fabriquait deux dalles au prototype, matériau et clics séparés) */
  const ecranRef = useRef<Ecran | null>(null)
  if (!ecranRef.current) ecranRef.current = creeEcran(lang)
  const ecran = ecranRef.current
  /* la bascule FR/EN reste atteignable au clavier sous l'overlay : la
     dalle suit (l'instance, elle, ne se recrée jamais — StrictMode) */
  useEffect(() => {
    ecran.langue(lang)
  }, [ecran, lang])
  /* poignée de test (harnais CDP) — même rôle que window.__gt86 */
  useEffect(() => {
    Object.assign(window as object, { __gt86ecran: ecran })
  }, [ecran])
  /* le compteur de cadence à la demande (?fps) — pour mesurer chez Hugo ;
     ?nodepart fige l'itinéraire à l'écran (gates visuels, recette #26) */
  const [fpsVoulu] = useState(() => new URLSearchParams(window.location.search).has("fps"))
  const [nodepart] = useState(() => new URLSearchParams(window.location.search).has("nodepart"))
  /* le ZOOM sur la dalle (hub/horloge/stats, machine à l'habitacle) et
     les feux de détresse — des états d'ÉCRAN, pas de navigation : la
     machine garde GPS/CHOIX/MUSIQUES/DÉPART, l'écran garde son poste */
  const [zoome, setZoome] = useState(false)
  const [warning, setWarning] = useState(false)
  const [mixCourant, setMixCourant] = useState(0)
  const zoomeRef = useRef(zoome)
  zoomeRef.current = zoome

  /* rejoindre un écran : GPS et MUSIQUES passent par la machine (deux
     dispatchs en file — `retour` est inerte à l'habitacle), les
     accessoires (hub, horloge, stats) restent au poste */
  const versEcran = (mode: ModeEcran) => {
    setZoome(true)
    envoie({ t: "retour" })
    if (mode === "gps") envoie({ t: "va", ou: "GPS" })
    else if (mode === "musiques") envoie({ t: "va", ou: "MUSIQUES" })
    else if (mode === "hub") ecran.hub()
    else if (mode === "horloge") ecran.horloge()
    else if (mode === "stats") ecran.stats()
  }

  /* la molette VOLUME (7e retour #33) : un cran par geste de roulette,
     vers le haut = plus fort — vivante seulement quand le player joue */
  const surMolette = (deltaY: number) => {
    /* proportionnel au delta, borné à un cran : la molette de souris
       (±120) donne son cran plein, le trackpad (petits deltas en rafale)
       règle finement au lieu de claquer la plage (revue adversariale) */
    if (etat === "SPOTIFY") commandesSpotify.current?.volume(Math.max(-0.07, Math.min(0.07, -deltaY / 1200)))
  }

  /* LE POSTE RÉPOND (#32) : zones calibrées remontées par la rue — la
     dalle, les boutons de façade posés par Hugo, le dehors qui rassoit */
  const surZone = (zone: Zone) => {
    if (INTRO.includes(etat) || etat === "DEPART") return
    if (zone.type === "dehors") {
      if (zoome || etat !== "HABITACLE") {
        envoie({ t: "retour" })
        setZoome(false)
        ecran.veille()
      }
      return
    }
    const mode = ecran.mode()
    if (zone.type === "bouton") {
      if (zone.nom === "warning") {
        setWarning((w) => !w)
        return
      }
      if (zone.nom === "power") {
        envoie({ t: "retour" })
        setZoome(true)
        if (mode === "eteint") ecran.hub()
        else ecran.eteint()
        return
      }
      if (mode === "eteint") return
      if (zone.nom === "media") versEcran("musiques")
      else if (zone.nom === "map") versEcran("gps")
      else if (zone.nom === "setup") versEcran("stats")
      else {
        const CYCLE: ModeEcran[] = ["hub", "gps", "musiques", "horloge", "stats"]
        const i = Math.max(0, CYCLE.indexOf(mode))
        versEcran(CYCLE[(i + (zone.nom === "suivant" ? 1 : CYCLE.length - 1)) % CYCLE.length])
      }
      return
    }
    /* un CLIC sur la molette est muet — elle se TOURNE (roulette) */
    if (zone.type === "molette") return
    /* la dalle */
    if (mode === "eteint") return
    if (etat === "HABITACLE" && !zoome) {
      setZoome(true)
      ecran.hub()
      return
    }
    if (etat === "HABITACLE" && mode === "hub") {
      if (zone.u < 0.48) versEcran("gps")
      else if (zone.u > 0.52) versEcran("musiques")
      return
    }
    if (etat === "SPOTIFY") {
      /* le player est PEINT dans la dalle : ses zones sont celles du
         peintre (clicSpotify), ses commandes celles de l'hôte invisible */
      const r = ecran.clicSpotify(zone.u, zone.v)
      if (!r) return
      if (r === "retour") {
        envoie({ t: "retour" })
        setZoome(true)
        ecran.hub()
      } else if (r === "lecture") commandesSpotify.current?.bascule()
      else if (r === "piste-prec") commandesSpotify.current?.reprend()
      else if (r === "piste-suiv") commandesSpotify.current?.saute()
      else if (r === "mix-prec" || r === "mix-suiv") {
        const i = (mixCourant + (r === "mix-suiv" ? 1 : PLAYLISTS.length - 1)) % PLAYLISTS.length
        setMixCourant(i)
        commandesSpotify.current?.chargeMix(i)
      } else if (r === "ouvrir") window.open(PROFIL_SPOTIFY, "_blank", "noopener")
      else if (r === "ouvrir-mix") window.open(PLAYLISTS[mixCourant].url, "_blank", "noopener")
      else if (typeof r === "object") {
        setMixCourant(r.mix)
        commandesSpotify.current?.chargeMix(r.mix)
      }
      return
    }
    if (etat === "MUSIQUES") {
      /* la FAÇADE click-to-load (#33) : c'est CE clic qui autorise
         l'embed — avant lui, pas un octet ne part chez Spotify */
      envoie({ t: "confirme" })
      return
    }
    if (etat === "GPS" || etat === "CHOIX") {
      const r = ecran.clicGps(zone.u, zone.v)
      if (r === "retour") {
        envoie({ t: "retour" })
        setZoome(true)
        ecran.hub()
      } else if (r === "maison") envoie({ t: "choisit", dest: "/home" })
      else if (r === "travail") envoie({ t: "choisit", dest: "/work" })
    }
  }

  /* la machine PEINT l'écran : un état, un dessin — les clics ne font
     que dispatcher (sauf les accessoires locaux du poste) */
  useEffect(() => {
    if (etat === "GPS") ecran.gps()
    else if (etat === "MUSIQUES") ecran.musiques()
    else if (etat === "SPOTIFY") ecran.spotify()
    else if (etat === "CHOIX" && dest) ecran.choisit(dest === "/home" ? "maison" : "travail")
    else if (etat === "HABITACLE" && !zoomeRef.current) ecran.veille()
  }, [etat, dest, ecran])

  /* la jauge pleine (2,6 s, horloge) confirme le départ — ?nodepart la
     fige à l'écran pour les gates visuels */
  useEffect(() => {
    ecran.surDepart(() => {
      if (!nodepart) envoie({ t: "confirme" })
    })
  }, [ecran, nodepart])

  /* les points de l'itinéraire avancent — 90 ms, une horloge (recette #26) */
  useEffect(() => {
    if (etat !== "GPS" && etat !== "CHOIX") return
    const h = setInterval(() => ecran.tic(), 90)
    return () => clearInterval(h)
  }, [etat, ecran])
  /* voiture + ciel décodés → la rue se monte en sourdine pendant le CIEL
     (décodage meshopt synchrone : jamais pendant le rail) */
  const [cielPret, setCielPret] = useState(false)
  const surPret = useCallback(() => setCielPret(true), [])
  /* L'ÉCRAN DE CHARGEMENT (7e retour #33) : tant que ciel ET rue ne sont
     pas décodés, un voile CHARGEMENT couvre le dôme — l'animation ne se
     découvre que prête (compilations lancées, plus d'accroc en vol). Il
     n'apparaît qu'après 250 ms (« si nécessaire » : cache plein = rien),
     ne mange AUCUN clic, et ne concerne que le chemin d'intro. */
  const [ruePrete, setRuePrete] = useState(false)
  const surRuePrete = useCallback(() => setRuePrete(true), [])
  const chargePret = cielPret && ruePrete
  const [chargeVisible, setChargeVisible] = useState(false)
  useEffect(() => {
    if (etat !== "CIEL" || chargePret) {
      setChargeVisible(false)
      return
    }
    const t0 = setTimeout(() => setChargeVisible(true), 250)
    return () => clearTimeout(t0)
  }, [etat, chargePret])
  const { progress: chargeProgres } = useProgress()
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

  /* Le REJEU (4e retour de gate) : revenir au CIEL rend la main au dôme —
     la bascule ciel → rue doit se réarmer, sinon le ciel resterait caché
     au prochain vol (enRue n'était posé qu'une fois). L'extinction de la
     voiture, elle, vit dans la rue (effet `vivant`). */
  useEffect(() => {
    if (etat !== "CIEL") return
    setEnRue(false)
    setZoome(false)
    setWarning(false)
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
    /* la route /home naît au #34 — d'ici là, Maison plonge sur la home
       simple (le choix du prototype #26) */
    const h = setTimeout(() => router.push(dest === "/home" ? "/" : dest), DEPART_MS)
    return () => clearTimeout(h)
  }, [etat, dest, router])

  /* Échap rassoit — UN SEUL chemin de sortie, le même que le ‹ de l'overlay.
     Le prototype #26 en avait deux, et ils ont divergé. */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      envoie({ t: "retour" })
      setZoome(false)
      ecran.veille()
    }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [ecran])

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
      data-pret={chargePret ? "1" : "0"}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: NUIT }}
    >
      <Canvas
        /* Boucle TOUJOURS vivante (3e retour de gate #31, « au moins
           100 fps ») : le "demand" des états de repos ne repeignait qu'au
           clignotement de veille — ~1,5 image/s à l'habitacle, c'est ce
           qu'un compteur y mesurait. Toute la scène vit (feux tricolores,
           veille, néons) et chaque interaction répond à la cadence de
           l'écran ; les invalidate() semés restent, inoffensifs. */
        frameloop="always"
        dpr={[1, 1.5]}
        /* alpha:false : la toile est OPAQUE (scene.background est posé) —
           le compositeur n'a plus à la fondre sur le DOM, c'est une frame
           moins chère sur beaucoup de GPU */
        gl={{ powerPreference: "high-performance", antialias: true, alpha: false }}
        camera={{ position: [0, 0, 6], fov: 45 }}
        onCreated={(st) => {
          st.scene.background = new THREE.Color(NUIT)
          /* poignée des outils de capture CDP (télémétrie, gates visuels) —
           même rôle que window.__scene des prototypes ; expose caméra,
           scène et invalidate() pour poser des vues à la main */
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
        <Pouls actif={etat === "SEUIL" || apres} ecran={ecran} />
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
              pose={
                etat === "SEUIL"
                  ? "rue"
                  : etat === "HABITACLE"
                    ? zoome
                      ? "ecran"
                      : "assis"
                    : apres
                      ? "ecran"
                      : null
              }
              cockpit={cockpit}
              ecran={ecran}
              vivant={apres}
              warning={warning}
              surZone={surZone}
              surMolette={surMolette}
            />
            <Sentinelle surPret={surRuePrete} />
          </Suspense>
        )}
        {fpsVoulu && <Stats />}
        <RythmeAmp actif={etat === "SPOTIFY"} ecran={ecran} />
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

        {/* le seul texte d'état restant : « en route… » pendant le vol —
            les cases DOM provisoires (#27) sont mortes, le POSTE 3D est
            l'interface (retour de gate #32) */}
        {etat === "ATTERRISSAGE" && (
          <span
            style={{
              ...discret,
              position: "absolute",
              bottom: 64,
              left: "50%",
              transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
          >
            {t(lang, "gt86EnRoute")}
          </span>
        )}

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

        {/* revoir la scène (4e retour de gate) : l'habitacle rend la main
            au CIEL, toute la boucle se rejoue — la place du ‹ est libre à
            l'habitacle, le geste y vit */}
        {etat === "HABITACLE" && (
          <button
            type="button"
            style={{ ...discret, position: "absolute", left: 20, bottom: 18, pointerEvents: "auto" }}
            data-gt86="rejouer" onClick={() => envoie({ t: "rejoue" })}
          >
            ↺ {t(lang, "gt86Rejouer")}
          </button>
        )}
      </div>

      {/* le MOTEUR du player (#33, 7e retour) : plus d'iframe du tout —
          un <audio> maison sur les préversions du CDN, gain (molette) et
          analyseur (spectre) ; il ne rend rien, il nourrit le peintre */}
      {etat === "SPOTIFY" && <MoteurSpotify ecran={ecran} commandes={commandesSpotify} mix={mixCourant} />}

      {/* le voile CHARGEMENT (7e retour #33) : couvre le ciel tant que
          les ressources décodent — transparent aux clics (le harnais et
          le skip passent au travers), fondu dès que tout est prêt */}
      {etat === "CIEL" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: NUIT,
            opacity: chargeVisible && !chargePret ? 1 : 0,
            transition: "opacity 450ms ease",
            /* opaque = il MANGE les clics (un DÉMARRER invisible cliquable
               lançait le vol sur une rue non décodée — revue) ; levé, il
               redevient transparent aux gestes pendant son fondu */
            pointerEvents: chargeVisible && !chargePret ? "auto" : "none",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                font: "500 12px/1 var(--f-mono)",
                letterSpacing: "0.34em",
                color: `${ENCRE}8c`,
              }}
            >
              {t(lang, "gt86Chargement").toUpperCase()}
            </div>
            <div
              style={{
                margin: "18px auto 0",
                width: 180,
                height: 2,
                background: `${ENCRE}26`,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: ENCRE,
                  transform: `scaleX(${Math.round(chargeProgres) / 100})`,
                  transformOrigin: "left",
                  transition: "transform 300ms ease",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 12,
                font: "500 11px/1 var(--f-mono)",
                letterSpacing: "0.18em",
                color: `${ENCRE}59`,
              }}
            >
              {Math.round(chargeProgres)}%
            </div>
          </div>
        </div>
      )}

      {/* le voile de la plongée (#24) : le verre fumé emplit le cadre et
          son noir devient l'obscurité — se dissout en CSS sur la vue
          assise. DERNIER-né du DOM, donc AU-DESSUS de l'overlay : sinon
          les boutons de l'habitacle claquaient à pleine opacité sur le
          noir pendant sa dissipation (retour de gate). `pointerEvents:
          none` — le skip reste cliquable dessous. */}
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

      {/* le fondu du DÉPART : la jauge est pleine, on plonge dans le
          portfolio relié (recette #26 — 600 ms, puis la navigation) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#050408",
          opacity: etat === "DEPART" ? 1 : 0,
          transition: "opacity 600ms ease",
          pointerEvents: "none",
        }}
      />
    </div>
  )
}
