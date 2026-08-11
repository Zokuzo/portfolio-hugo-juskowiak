"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react"
import { azimutVersIndex, offsetAuRelachement } from "./geste.mjs"

/* ==================================================================
   VOITURE — une séquence d'images pour la pose et le drag, un
   engloutissement au défilement. LA ROTATION APPARTIENT À LA MAIN
   depuis le retour Hugo du 2026-08-11 (#13) : le scroll ne tourne
   plus l'objet — le cran de 2,25° se voyait au défilement lent — le
   FOND LE MANGE (un iris qui se referme pendant qu'il s'enfonce,
   façon transition de wallpaper Hyprland). La séquence sert la pose de départ, le drag d'amorce
   (#12) et l'angle où la main l'a posée.

   POURQUOI PAS DE 3D TEMPS RÉEL. Le décor consomme déjà la totalité du
   budget par frame : mesuré en production, p90 16,7ms avec le monde
   contre 8,4ms sans. Un canvas WebGL rendant un matériau réfléchissant
   à chaque frame ajouterait une passe complète et annulerait le travail
   de fluidité. Une séquence d'images ne coûte qu'un DÉCODAGE, une fois,
   et un `drawImage` quand l'index change — pas à chaque frame.

   ET PAS DE VIDÉO : le scrubbing vidéo n'est pas fiable d'un navigateur
   à l'autre, la recherche n'étant pas garantie exacte à l'image près
   (Safari en particulier). Ici la rotation SUIT le scroll, donc il faut
   pouvoir se poser sur une image précise. Des fichiers, pas un flux.

   CONTRAT D'INTÉGRATION — les images vivent dans /public/voiture/ et
   se nomment 000.webp à 159.webp, fond transparent. La rotation en
   parcourt la TOTALITÉ ; c'est l'absence de l'image de départ qui fait
   renoncer le composant : il ne rend alors RIEN et la page est intacte.

   BUDGET : aucun mix-blend-mode, aucun filter, aucun masque. Un seul
   canvas, redessiné uniquement quand l'index change. Le reste ne touche
   jamais au canvas : seuls `transform` et `opacity` bougent, les deux
   seules propriétés que le compositeur anime sans repeindre.
   ================================================================== */

/* ── INTERRUPTEUR ─────────────────────────────────────────────────
   Passer à `false` pour retirer la voiture sans toucher au reste.

   Pourquoi un booléen plutôt qu'une sonde réseau : sans les images, un
   test de présence laisse une requête en échec dans la console de
   chaque visiteur. Une erreur 404 permanente en production pour
   deviner ce qu'on sait déjà, ça ne se paie pas.
   ───────────────────────────────────────────────────────────────── */
const SEQUENCE_LIVREE = true

/* Chaque thème a SA séquence (#13) : la sombre à la racine, la MSO
   claire dans clair/ — et chaque thème ne télécharge que la sienne,
   propriété acquise : tout part d'un fetch à la demande. */
const SRC = (i: number, clair: boolean) => `/voiture/${clair ? "clair/" : ""}${String(i).padStart(3, "0")}.webp`

/* Le canvas est plafonné à 1,5× le CSS et non au devicePixelRatio réel :
   sur un écran 3×, une toile de 3000px coûterait trois fois plus de
   remplissage pour un gain invisible derrière un titre. */
const DPR_MAX = 1.5

/* ── LE TRAJET ────────────────────────────────────────────────────
   La voiture traverse les trois premières feuilles — plaque,
   nomenclature, tracé — soit environ cinq hauteurs d'écran.

   On mesure jusqu'au bas de #trace plutôt que d'empiler trois refs :
   ces sections sont SŒURS, et les envelopper pour les mesurer d'un
   bloc insérerait un ancêtre entre la voiture et la page. Or un
   ancêtre est exactement ce qui casse un `position: fixed` dès qu'il
   porte un transform — page.tsx prévient déjà du piège pour le décor.

   ELLE NE SE DÉPLACE PLUS. La spirale d'avant — orbite en vw/vh,
   éloignement en puissance, balancement accroché à l'angle d'orbite —
   est retirée : il ne reste qu'une rotation sur l'axe, au centre. Une
   chose qui tourne sur place se lit d'un coup d'œil ; la même chose
   qui tourne EN se déplaçant demande à l'œil de suivre deux mouvements
   à la fois, et c'est ce qui donnait l'impression de tourbillon.
   ───────────────────────────────────────────────────────────────── */
const NB = 160           // images de la séquence, une tous les 2,25°
const TOURS = 1          // tours complets sur l'axe pendant le trajet

/* ── LA POSE DE DÉPART ────────────────────────────────────────────
   Le tour est COMPLET, mais il ne commence pas n'importe où. L'image
   000 est une plongée de face — le toit, et rien d'autre : ouvrir la
   page dessus, c'est ouvrir sur la plus mauvaise vue de la séquence.

   L'image 140 (azimut 315°) est la meilleure : trois-quarts avant,
   pare-chocs avant en bas à gauche, arrière en haut à droite, capot,
   flanc et les quatre roues lisibles d'un coup. Le tour part donc
   d'elle et, faisant exactement 360°, y revient à la fin.

   L'ASSIETTE est désormais FIXE. Elle valait -65° du temps où l'image
   de départ était une plongée qu'il fallait coucher, puis elle
   balançait autour de l'orbite ; sans orbite, il n'y a plus rien à
   balancer. Ces -12° redressent la diagonale naturelle de l'image de
   départ, environ 28° sur l'horizontale, à 40° plus franche.

   LE CHANGEMENT DE VOITURE N'A PAS DÉPLACÉ CETTE DIAGONALE. Mesurée sur
   la silhouette de la pose, l'écart avec celle de la séquence qu'elle
   remplace vaut 0,4 à 0,6° selon la méthode de mesure (axe PCA ou
   diagonale de boîte) — sous ce que l'œil distingue sur une image en
   retrait. L'assiette se reporte donc telle quelle : rien à réajuster.

   CES CHIFFRES SONT SOLIDAIRES DU RENDU. Changer l'élévation ou le
   `--depart` dans tools/voiture décale l'azimut de chaque image : POSE
   ne désignerait plus la même vue, et l'assiette ne compenserait plus
   la bonne diagonale. Les revoir ensemble, jamais l'un sans l'autre.
   ───────────────────────────────────────────────────────────────── */
const POSE = 140         // image de départ : le trois-quarts avant
const INCLINAISON = -12  // assiette fixe : redresse la diagonale à 40°

/* ── LE RESSORT ───────────────────────────────────────────────────
   La progression n'attaque plus la rotation en direct. Un scroll n'est
   pas lisse : molette crantée, trackpad par à-coups, barre d'espace
   qui saute un écran. Branché tel quel, chaque secousse devenait une
   secousse de la voiture, et sur une séquence d'images le défaut est
   deux fois visible puisque le volume saute d'un cran de 2,25° d'un coup.

   Le ressort absorbe ça : il POURSUIT la valeur du scroll au lieu de
   l'épouser.

   RÉGLÉ AU CRITIQUE, ζ = 1,04. C'est le seul point du domaine où la
   valeur rejoint sa cible au plus vite SANS la dépasser — donc sans
   rebond, ce qu'une voiture qui tourne ne pardonnerait pas. Le premier
   jet était à ζ = 2,32 : sur-amorti d'un facteur deux, il mettait deux
   secondes et demie à converger et la rotation traînait visiblement
   derrière le doigt. Ici ω = 22 rad/s donne environ 175 ms.

   ζ = amortissement / (2·√(raideur × masse)). Les trois nombres se
   tiennent : en changer un seul déplace l'amortissement réel. */
const RESSORT = { stiffness: 170, damping: 16, mass: 0.35, restDelta: 0.0002 }

/* ── LE FLOTTEMENT ────────────────────────────────────────────────
   À 160 images pour un tour, le cran vaut 2,25° : il ne se voit plus au
   scroll, mais il reste visible à l'arrêt, quand plus rien ne bouge et
   que l'œil s'installe sur une image fixe. Le remède n'est pas un
   compositing plus malin — le fondu enchaîné a été essayé et rejeté au
   côte-à-côte du 2026-08-10, il dédoublait les arêtes au lieu de les
   fondre. C'est de donner à l'œil autre chose à suivre : l'objet respire
   sur place, indépendamment du scroll.

   IL Y AVAIT DÉJÀ UNE FLOTTAISON, EN CSS, et elle ne suffisait pas :
   jugée trop discrète à l'œil, elle portait en plus une échelle qui
   pulse. Elle est retirée de planche.css ; deux couches qui flottent
   auraient cumulé leurs tangages, et c'est exactement la danse que la
   suppression de l'orbite avait chassée. Une seule couche, ici.

   DEUX SINUS D'ASSIETTE ET UNE DÉRIVE VERTICALE, RIEN D'AUTRE — ni
   translation horizontale ni échelle : une respiration, pas une danse.
   La ligne de crête est celle du tourbillon : tout mouvement ajouté à
   une chose qui tourne déjà se paie en lisibilité.

   LES PÉRIODES N'ONT PAS DE RAPPORT SIMPLE ENTRE ELLES (7,1 / 11,3 /
   9,7 s) et c'est le point : le motif combiné ne se referme pas devant
   l'œil. Les toucher raccourcirait la boucle, donc la rendrait
   reconnaissable — et accélérer une respiration la rend haletante là où
   l'amplifier la rend ample. Ces amplitudes-ci sont le DOUBLE de la base
   prototypée, calibrées à l'œil par Hugo au même côte-à-côte. */
const FLOT = {
  a1: 2.4, p1: 7.1,   // assiette : degrés, secondes
  a2: 1.0, p2: 11.3,
  dy: 8, p3: 9.7,     // dérive verticale : pixels, secondes
}
const TAU = Math.PI * 2

/* ── LE RÉGIME DRAG (#12) ─────────────────────────────────────────
   La doctrine anti-3D de l'en-tête ne tombe pas, elle se précise :
   c'est un argument de RÉGIME. Pendant un drag la page ne défile pas,
   la parallaxe est immobile, la respiration est suspendue, et le rendu
   3D est déclenché par l'événement de pointeur — au plus un rendu par
   frame quand la main bouge, ZÉRO quand elle ne bouge pas. Le même
   motif marche/arrêt que la respiration.

   Rien ne se télécharge sans un geste de saisie : mousedown sur un
   pixel opaque + déplacement au-delà du seuil. Pendant que le modèle
   arrive, le geste pilote la SÉQUENCE en azimut (zéro octet nouveau) ;
   la promotion WebGL attend le relâchement — jamais de changement de
   régime en cours de geste. Ce mode séquence est aussi le repli
   permanent : contexte refusé, perdu, chargement en échec — le drag
   azimut-seul reste, sans un message. */
const DRAG_LIVRE = true  // retirer le régime drag sans toucher au reste
const ELEV_REPOS = 30    // l'élévation de la séquence (CREDIT.txt) : la seule où elle existe
const ELEV_MIN = 18      // bornes de l'axe d'élévation — PROPOSÉES, à régler à l'œil par Hugo
const ELEV_MAX = 42      //   (décision n°2 du spec) : trop d'amplitude montre le dessous et le toit
const SENS_AZIMUT = 0.45 // °/px — un tour en ~800 px de glissement, à régler à l'œil
const SENS_ELEV = 0.12   // °/px vertical
const CRAN = 360 / NB    // 2,25°
const SEUIL_DRAG = 4     // px avant qu'un mousedown ne devienne un drag avéré — un clic reste un clic
const SEUIL_ALPHA = 32   // alpha minimal d'un pixel « saisissable » : le halo anti-aliasé ne compte pas
const SEUIL_FONDU = 0.05 // sous ce fondu la voiture est invisible : rien à saisir
const AMORTI = 0.94      // décroissance de l'inertie par frame — coupée sous reduce
const RETOUR_ELEV = 0.8  // fraction d'écart d'élévation restante par frame au retour
const INTERACTIFS = "a,button,input,textarea,select,summary,label,[contenteditable],[role=button]"

/* Le wrapper exporté : la bascule de thème REMONTE la séquence par la
   clé — le démontage ferme déjà tous les bitmaps et détruit la scène
   GL (acquis de #12), le remontage lit le thème frais. Coût d'une
   bascule : le refenêtrage, ~660 Ko. */
export function Voiture() {
  const [cle, setCle] = useState(0)
  useEffect(() => {
    const f = () => setCle((c) => c + 1)
    window.addEventListener("themechange", f)
    return () => window.removeEventListener("themechange", f)
  }, [])
  return <VoitureSequence key={cle} />
}

function VoitureSequence() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const conteneur = useRef<HTMLDivElement>(null)
  const toileGl = useRef<HTMLCanvasElement>(null)
  const tenue = useRef(false)   // la main tient la voiture — et RIEN d'autre : l'inertie, c'est `roule`
  const roule = useRef(false)   // la décrue d'inertie court (main partie) — confondre les deux empilait des boucles
  const sceneGl = useRef<import("./voiture-drag").SceneDrag | null>(null)
  const chargementGl = useRef<Promise<void> | null>(null)
  const dernier = useRef(-1)
  const fin = useRef(0)
  const [pretes, setPretes] = useState(false)
  const [absente, setAbsente] = useState(false)
  const reduit = useReducedMotion()
  /* Le thème au MONTAGE, une fois — la bascule à mi-session remonte le
     composant par la clé du wrapper, qui relit. Lazy initializer :
     l'état ne sert qu'aux fetches, jamais au HTML, donc pas d'écart
     d'hydratation (le serveur rend false, le client aussi au premier
     rendu... côté client la valeur est lue AVANT le premier fetch). */
  const [clair] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("clair"))

  const { scrollY } = useScroll()

  /* La progression est PILOTÉE, pas dérivée. Un `useTransform(scrollY, …)`
     aurait été plus court, mais il ne se recalcule qu'au changement de
     scrollY : une page rechargée à mi-hauteur — le F5 ordinaire — resterait
     coincée à 0 jusqu'au premier geste, et la voiture apparaîtrait d'un
     coup au mauvais endroit. Ici la mesure pousse elle-même la nouvelle
     valeur.

     `fin` reste dans une ref et non dans un état : elle est lue à chaque
     frame de scroll, et un rendu React à chaque redimensionnement ne lui
     apporterait rien. */
  const p = useMotionValue(0)

  /* Tout ce qui suit part du ressort, PAS de `p` : mélanger les deux
     désynchroniserait la rotation et le fondu, et on verrait la voiture
     finir de tourner après s'être effacée.

     Déclaré AVANT l'effet de mesure, qui en a besoin — voir `saut`. */
  const lisse = useSpring(p, RESSORT)

  /* L'offset en crans laissé par la main au relâchement (#12) : la
     voiture reste où on l'a posée, et le scroll continue de la tourner
     à partir de là. MotionValue et non ref : l'index en dépend, et
     c'est son changement qui déclenche la repeinture au relâchement. */
  const decalage = useMotionValue(0)
  /* 1 pendant la prise : la respiration s'arrête (une chose que la
     main tient ne flotte pas) et la peinture au fil de l'index se
     suspend — pendant le geste c'est la main qui peint, pas le scroll. */
  const saisie = useMotionValue(0)

  useEffect(() => {
    const avance = () => {
      const f = fin.current
      // Sans ce garde, une division par zéro donnerait NaN — que ni
      // Math.min ni Math.max ne rattrapent. On écrirait `translateX(NaNvw)`
      // et la voiture disparaîtrait sans la moindre erreur en console.
      p.set(f > 0 ? Math.min(1, Math.max(0, window.scrollY / f)) : 0)
    }
    /* `saut` DIT AU RESSORT DE NE PAS ANIMER, et c'est indispensable.

       `useSpring` naît à `p.get()` pendant le RENDU, où `p` vaut encore 0
       puisqu'il n'est renseigné qu'ici, dans un effet qui s'exécute après.
       Sans ce saut, toute page ouverte ailleurs qu'en haut — un F5 à
       mi-page, un retour depuis une fiche projet, un lien profond — faisait
       rattraper au ressort la totalité de la course : mesuré, l'opacité
       partait de 1 et restait au-dessus de 0,05 pendant 1,5 s, la voiture
       traversait 223° toute seule alors que le scroll ne bougeait pas d'un
       pixel, et `veille` téléchargeait 128 images pour un objet que
       personne ne devait voir. C'est très exactement le défaut que le
       commentaire de `p` ci-dessus dit vouloir empêcher, restitué au
       ralenti et donc bien plus visible.

       Les mesures de MISE EN PAGE sautent — montage, polices, pin du
       tracé, redimensionnement : rien n'a bougé pour le visiteur, il n'y a
       donc rien à animer. Seul le SCROLL passe par le ressort. */
    const mesure = (saut = false) => {
      const t = document.querySelector("#trace")
      if (!t) return
      const bas = t.getBoundingClientRect().bottom + window.scrollY
      // La course s'achève quand le bas du tracé atteint le bas de
      // l'écran : la voiture a fini son trajet pile quand la feuille
      // suivante entre, pas trois écrans plus tôt.
      fin.current = Math.max(1, bas - window.innerHeight)
      avance()
      if (saut) lisse.jump(p.get())
    }
    const remesure = () => mesure(true)
    mesure(true)
    const stop = scrollY.on("change", avance)
    window.addEventListener("resize", remesure)
    // Les polices et le pin du tracé décalent la mise en page après
    // coup ; une seconde mesure évite une course figée trop courte.
    const t = setTimeout(remesure, 1200)
    return () => {
      stop()
      window.removeEventListener("resize", remesure)
      clearTimeout(t)
    }
  }, [p, lisse, scrollY])

  /* LE SCROLL NE TOURNE PLUS LA VOITURE (retour Hugo, #13) : à 160
     images, le cran de 2,25° se voyait au défilement lent — le remède
     n'était ni un fondu (rejeté, il dédouble les arêtes) ni plus
     d'images (le poids), c'était de retirer la rotation au scroll.
     LA ROTATION APPARTIENT À LA MAIN : le drag (séquence puis WebGL
     continu, régime #12) est le seul à tourner l'objet — et lui n'a
     pas de crans une fois promu. Le scroll, lui, fait DÉCOLLER la
     voiture (voir L'ENVOL plus bas).

     L'index ne dépend donc plus que de l'offset laissé par la main.
     Le second `+ NB` couvre les valeurs négatives, que le `%` de
     JavaScript propagerait. */
  const index = useTransform(decalage, (off: number) => ((POSE + off) % NB + NB) % NB)

  /* UNE SEULE DISPARITION (#13, retour Hugo) : l'engloutissement.
     L'ancien fondu par paliers faisait pâlir la voiture PENDANT que
     l'iris la mangeait — recouverte puis évanouie, deux animations
     pour une seule mort. Pleine présence jusqu'à la fermeture (0,5),
     puis l'opacité tombe sur ce qui n'existe déjà plus (fermé à 22 %
     de la course : ensevelie avant que l'index n'occupe l'écran —
     retours Hugo) : en mode
     normal cette chute est invisible (l'iris a tout mangé), sous
     reduce — où l'iris est coupé — elle EST la sortie, brève et liée
     au scroll comme le veut la doctrine du repère de position.
     Ce facteur se multiplie toujours au dosage CSS de la toile. */
  const fondu = useTransform(lisse, [0, 0.22, 0.3, 1], [1, 1, 0, 0])

  /* ── L'ENGLOUTISSEMENT (#13, retour Hugo) ─────────────────────────
     Au défilement, LE FOND MANGE LA VOITURE — un iris se referme sur
     elle pendant qu'elle s'enfonce et recule d'un souffle : la
     transition de wallpaper d'Hyprland, transposée. Le cercle part
     au-delà de la demi-diagonale (75 % > 70,7 % : rien n'est rogné au
     repos) et se ferme à 30 % de la course, le centre glissant vers le bas —
     on l'ensevelit, on ne l'efface pas.

     LE PRIX EST DIT : un clip-path qui bouge repeint la couche de la
     voiture à chaque frame de défilement où elle est visible — le
     même ordre de coût que l'ancienne rotation par images (un
     drawImage par cran), et c'est MESURÉ au banc, pas supposé. Le
     fondu continue de faire le repère de position. SOUS REDUCE,
     l'engloutissement est un mouvement que le défilement CAUSE :
     coupé (doctrine de l'issue #9) — l'iris reste ouvert, le fondu
     seul raconte la profondeur. Bornes identiques dans les deux cas :
     le style du premier rendu est le même, serveur et client. */
  const envY = useTransform(lisse, [0, 0.22], reduit ? ["0vh", "0vh"] : ["0vh", "14vh"])
    /* L'engloutissement vit DANS la toile (destination-in au dessin) et
     jamais en clip-path CSS : un clip-path animé re-rasterise toute la
     couche transformée à chaque frame — mesuré au banc : 11,85 % de
     frames hors budget, rejeté. Le repeint de la toile par frame, lui,
     est l'ancien coût de la rotation par crans : 2 %, validé. */
  const irisRef = useRef(1)
  const irisPrevu = useRef(0)

  /* ── LA RESPIRATION ───────────────────────────────────────────────
     ELLE COÛTE UNE FRACTION DE FRAME, SUR LE FIL PRINCIPAL, et c'est le
     prix consenti au gate du 2026-08-10. La flottaison CSS qu'elle
     remplace tournait, elle, sur le compositeur — gratuite pour le fil
     principal — mais elle était jugée trop discrète et son amplitude ne
     se règle pas sans réécrire des keyframes. Ici : deux sinus, deux
     `.set()` et un pas de rendu de framer par frame. La PEINTURE reste
     absorbée par le compositeur, puisqu'on n'écrit que du transform et
     qu'on ne touche jamais à la toile — mais le CALCUL, lui, est bien
     sur le fil principal. Le budget est déjà tendu (témoin du
     2026-08-06 : p90 7,40 ms, 6,13 % de frames au-dessus de 8,3 ms) :
     c'est la Tâche 8 qui dit si ce prix passe, pas ce commentaire.

     ELLE NE TOURNE QUE QUAND LA VOITURE SE VOIT. `fondu` tombe à 0 au
     bout du tracé, et il reste huit feuilles de page après : y faire
     battre une boucle à 60 fps pour un élément à `opacity: 0`, ce serait
     payer le seul coût qu'on vient d'admettre là où il n'achète rien.
     On s'abonne donc au fondu — il ne bouge que pendant le scroll, la
     bascule est gratuite le reste du temps.

     Elle ne dépend PAS du scroll pour autant : une chose qui flotte
     flotte aussi quand on ne touche à rien, et c'est tout l'intérêt ici
     — entre deux images, l'œil garde du mouvement à suivre.

     UN rAF NU PLUTÔT QUE `useAnimationFrame` : le hook s'enregistre
     toujours, donc la boucle de frames tournerait même quand il n'y a
     rien à faire, pour n'y faire qu'un retour anticipé. Ici, mouvement
     réduit ou voiture effacée = rien ne tourne du tout.

     LE TRANSFORM RESTE SUR L'ÉLÉMENT QUI PORTE DÉJÀ L'ASSIETTE.
     L'envelopper dans une couche de plus insérerait un ancêtre
     transformé entre la page et un `position: fixed` — le piège que
     page.tsx signale pour le décor comme pour la voiture. */
  const assiette = useMotionValue(INCLINAISON)
  const derive = useMotionValue(0)
  /* la dérive de respiration (px) et l'envol (vh) se composent en un
     seul canal y — deux valeurs, une écriture */
  const yTotal = useTransform([derive, envY] as unknown as MotionValue<number>[], (v: unknown[]) => `calc(${v[0]}px + ${v[1]})`)

  useEffect(() => {
    // `absente` peut passer à true tard (404 après montage) : sans elle ici
    // ET dans les dépendances, la boucle déjà lancée continuerait de battre
    // pour un composant qui ne rend plus rien.
    if (reduit || absente) return
    let id = 0
    const battre = (t: number) => {
      const s = t / 1000
      assiette.set(INCLINAISON + FLOT.a1 * Math.sin((s * TAU) / FLOT.p1) + FLOT.a2 * Math.sin((s * TAU) / FLOT.p2))
      derive.set(FLOT.dy * Math.sin((s * TAU) / FLOT.p3))
      id = requestAnimationFrame(battre)
    }
    // Les deux gardes sur `id` rendent marche/arrêt IDEMPOTENTS : le
    // fondu émet plusieurs valeurs non nulles d'affilée pendant le
    // scroll, et sans elles chacune lancerait une boucle de plus.
    const marche = () => { if (!id) id = requestAnimationFrame(battre) }
    const arret = () => {
      if (!id) return
      cancelAnimationFrame(id)
      id = 0
      // Reposer l'assiette : sans ça, un arrêt en plein sinus laisserait
      // la pose figée de travers pour le retour en arrière.
      assiette.set(INCLINAISON)
      derive.set(0)
    }
    /* Deux raisons de s'arrêter, une seule règle : la respiration ne
       tourne que si la voiture se voit ET que la main ne la tient pas
       — une chose tenue ne flotte pas (spec #12, décision 3). */
    const evalue = () => ((fondu.get() > 0 && !saisie.get()) ? marche() : arret())
    evalue()
    const stopF = fondu.on("change", evalue)
    const stopS = saisie.on("change", evalue)
    return () => {
      stopF()
      stopS()
      arret()
    }
  }, [reduit, absente, assiette, derive, fondu, saisie])

  /* ── POURQUOI DES ImageBitmap ET PAS DES BALISES IMAGE ────────────
     MESURÉ, sur build de production, trois essais alternés dans le même
     onglet : avec des HTMLImageElement, la traversée montait à 16,6ms de
     p90 et 9,5% de frames au-dessus du budget, contre 3,2ms et 0% sans
     la voiture. Le coupable n'est ni la mémoire ni le réseau : c'est le
     DÉCODAGE. Un `drawImage` sur une image dont le bitmap n'est pas déjà
     dans le cache du moteur déclenche un décodage SYNCHRONE sur le fil
     principal. Sur 378 frames de traversée, les 120 changements d'index
     tombent une frame sur trois (mesuré sur la séquence de 120 images
     d'alors) — donc un décodage une frame sur trois.

     `decoding = "async"` ne protège pas : cet attribut concerne le rendu
     d'une balise image par le moteur, pas un appel manuel à drawImage.

     `createImageBitmap` décode HORS du fil principal et rend un objet
     déjà décodé : le drawImage qui suit ne peut plus bloquer. On ne les
     garde pas tous — 160 bitmaps de 1000×1000 feraient 640 Mo — mais une
     FENÊTRE glissante autour de la tête de lecture, refermée derrière.

     La fenêtre revient AVEC le tour complet, et c'est la même raison qui
     l'avait fait partir : elle suppose une tête de lecture qui AVANCE.
     Un lacet qui oscille sur un arc étroit refermait derrière lui des
     images redemandées à l'aller suivant, et charger l'arc entier coûtait
     moins. Une rotation de 360° reparcourt les 160 : les garder toutes
     ferait plus d'un demi-gigaoctet, la fenêtre redevient le bon outil. */
  const bitmaps = useRef<(ImageBitmap | undefined)[]>([])
  const enVol = useRef<Set<number>>(new Set())
  /* LES IMAGES ABANDONNÉES, et le compte des échecs qui y mène.

     `veille` est rejouée à chaque changement d'index. Sans mémoire des
     échecs, elle redemandait sans fin ce qui ne répond pas : mesuré,
     1 422 requêtes sur une descente au lieu de 120 quand le réseau tombe
     (mesuré à 120 images).
     Mais abandonner au PREMIER échec est l'excès inverse — un hoquet
     serveur condamnait l'image pour toute la session. D'où un compte :
     trois essais, puis on laisse tomber cette image-là. */
  const perdues = useRef<Set<number>>(new Set())
  const echecs = useRef<Map<number, number>>(new Map())
  const ESSAIS = 3
  const vivant = useRef(true)

  const charge = (i: number) => {
    if (bitmaps.current[i] || enVol.current.has(i) || perdues.current.has(i)) return
    enVol.current.add(i)
    fetch(SRC(i, clair))
      /* On distingue « le fichier n'existe pas » de « ça n'a pas marché ».
         Rejeter tout statut non-ok sous le même nom faisait traiter un 503
         — un redémarrage de serveur, une purge de CDN — comme un 404 : la
         voiture disparaissait définitivement de la page sur un incident
         d'une seconde. */
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(r.status === 404 || r.status === 410 ? "404" : "hoquet " + r.status))))
      .then(createImageBitmap)
      .then((bm) => {
        if (!vivant.current) return bm.close()
        bitmaps.current[i] = bm
        /* DEUX RAISONS DE REPEINDRE, et il faut les deux.

           L'image voulue vient d'arriver — sans ça elle n'apparaîtrait
           qu'au prochain mouvement de scroll.

           Ou bien RIEN n'a encore été peint. Comparer au seul index voulu
           suspendait le premier pixel à une image précise : si celle-là
           traînait ou tombait, les douze autres pouvaient être décodées
           sans que la toile s'allume. Et en mouvement réduit, où l'on ne
           repeint plus jamais ensuite, la voiture ne serait tout
           simplement jamais apparue. On repeint donc l'index VOULU, pas
           `i` : `disponible` sait se rabattre sur la voisine qui vient
           d'arriver, et c'est ce qui rend vraie la promesse d'afficher
           dès la première image reçue. */
        if (i === index.get() || dernier.current < 0) peindre(index.get(), true)
      })
      /* SEUL UN 404 VEUT DIRE « SÉQUENCE ABSENTE ». Couper sur n'importe
         quelle erreur confondait le contrat d'intégration avec un hoquet
         réseau : une seule requête tombée démontait toute la voiture,
         alors que les autres étaient là.

         Un fichier qui n'existe pas est abandonné tout de suite et lui
         seul déclenche le renoncement. Tout le reste — transport, 5xx,
         décodage — a droit à trois essais, après quoi on abandonne cette
         image sans toucher au composant : `disponible` se rabattra sur sa
         voisine, ce qui est très préférable à une voiture qui s'évapore. */
      .catch((e) => {
        if (!vivant.current) return
        if (e?.message === "404") {
          perdues.current.add(i)
          if (i === POSE) setAbsente(true)
          return
        }
        const n = (echecs.current.get(i) ?? 0) + 1
        echecs.current.set(i, n)
        if (n >= ESSAIS) perdues.current.add(i)
      })
      .finally(() => enVol.current.delete(i))
  }

  /* La fenêtre est asymétrique : large DEVANT, courte derrière. On
     descend la page bien plus souvent qu'on ne la remonte, et une image
     déjà dépassée ne resservira qu'en cas de retour en arrière.

     CES DEUX NOMBRES SONT DES IMAGES, PAS DES DEGRÉS, et la séquence a
     changé de densité sous eux : à 120 images ils couvraient 60° devant,
     ils n'en couvrent plus que 45. Réduire la PORTÉE d'un quart aurait
     pu laisser le scroll rapide dépasser la fenêtre et montrer un trou —
     c'est ce qu'on a regardé au côte-à-côte du 2026-08-10, en conditions
     réelles : aucun pop-in. Ils restent donc à 20 et 5. Les monter à
     27/7 pour rendre les 60° coûterait un tiers d'empreinte mémoire en
     plus pour un défaut qui ne se produit pas.

     Rejouée à chaque changement d'index, elle RATTRAPE au passage : une
     requête tombée sur une coupure réseau serait sinon un trou définitif
     dans le tour. Les 404 avérés, eux, ne sont pas retentés — c'est
     `perdues` qui borne la reprise. */
  const AVANT = 20
  const ARRIERE = 5

  const veille = (i: number) => {
    for (let d = -ARRIERE; d <= AVANT; d++) charge((i + d + NB) % NB)
    for (let k = 0; k < NB; k++) {
      const bm = bitmaps.current[k]
      if (!bm) continue
      const devant = (k - i + NB) % NB
      const derriere = (i - k + NB) % NB
      // Fermer explicitement : un ImageBitmap détient de la mémoire
      // graphique que le ramasse-miettes ne rend pas de lui-même.
      if (devant > AVANT && derriere > ARRIERE) { bm.close(); bitmaps.current[k] = undefined }
    }
  }

  useEffect(() => {
    if (!SEQUENCE_LIVREE) {
      setAbsente(true)
      return
    }
    vivant.current = true
    /* On affiche dès la première image arrivée, sans attendre les
       autres : à 160 images, exiger la séquence complète imposerait
       ~4,2 Mo avant le premier pixel.

       La veille part de l'index VOULU et non de zéro : le tour commence
       à la pose de départ, et amorcer la fenêtre ailleurs téléchargerait
       vingt images qu'on ne montrera qu'à la fin du trajet.

       EN MOUVEMENT RÉDUIT, une seule. La voiture ne tournera jamais, donc
       les vingt-cinq voisines de la fenêtre ne serviront à rien : à 26 Ko
       de moyenne mesurée sur la séquence, les télécharger serait faire
       payer six cent soixante kilooctets à quelqu'un qui a précisément
       demandé qu'on lui en fasse moins. */
    setPretes(true)
    if (reduit) charge(index.get())
    else veille(index.get())
    return () => {
      vivant.current = false
      if (irisPrevu.current) cancelAnimationFrame(irisPrevu.current)
      irisPrevu.current = 0
      for (const bm of bitmaps.current) bm?.close()
      bitmaps.current = []
      /* La scène du drag vit avec le COMPOSANT, pas avec l'effet de
         saisie : le détruire à chaque re-exécution de l'effet (un
         basculement de `reduit`) recréerait un renderer sur la même
         toile — deux moteurs pour un seul contexte. */
      sceneGl.current?.detruit()
      sceneGl.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Repli : tant que la fenêtre se remplit, on affiche le bitmap le plus
     proche plutôt que rien. Le parcours est modulo, comme la rotation
     qu'il sert : chercher autour de l'image 002 doit pouvoir trouver la
     159, sa voisine de 2,25°, et non sortir de la plage.

     ON CHERCHE DES DEUX CÔTÉS, et l'écart croît d'un cran à la fois. Ne
     reculer que d'un seul côté paraissait suffisant — les images arrivent
     dans l'ordre du tour, la précédente est presque toujours là. C'est
     vrai EN DESCENTE seulement. À la remontée, le sens de marche n'a plus
     que les cinq images d'ARRIERE devant lui ; passé ces cinq, le parcours
     arrière faisait le tour complet et retombait sur le bord AVANT de la
     fenêtre, à vingt images de là. Mesuré : 12 peintures sur 130 à 60° de
     la bonne (mesuré à 120 images), alternant avec les bonnes — un
     stroboscope, pas un repli grossier. En descente, zéro sur 109.

     Le `??` garde la préférence pour l'arrière à écart égal, ce qui reste
     le bon pari ; il BORNE simplement l'erreur à l'image réellement la
     plus proche au lieu de la laisser courir sur toute la fenêtre. */
  const disponible = (i: number) => {
    for (let d = 0; d < NB; d++) {
      const bm = bitmaps.current[(i - d + NB) % NB] ?? bitmaps.current[(i + d) % NB]
      if (bm) return bm
    }
    return null
  }

  const peindre = (i: number, force = false) => {
    const c = canvas.current
    const ctx = c?.getContext("2d", { alpha: true })
    if (!c || !ctx) return
    if (!force && i === dernier.current) return
    const im = disponible(i)
    if (!im) return
    dernier.current = i
    const { width: w, height: h } = c
    ctx.clearRect(0, 0, w, h)
    /* Iris FERMÉ : on ne peint rien du tout. Le piège est réel et
       mesuré : arc(rayon 0) est un chemin VIDE, son fill() un no-op —
       le destination-in ne s'appliquait jamais et le drawImage frais
       restait entier : la voiture REVENAIT pile après la fermeture. */
    if (irisRef.current <= 0) return
    // `contain` : la voiture ne doit jamais être rognée par le cadre
    const e = Math.min(w / im.width, h / im.height)
    ctx.drawImage(im, (w - im.width * e) / 2, (h - im.height * e) / 2, im.width * e, im.height * e)
    /* L'ENGLOUTISSEMENT (#13) : sous 1, un iris se referme sur la
       voiture — destination-in circulaire, le fond la recouvre par les
       bords pendant qu'elle s'enfonce, façon transition de wallpaper
       Hyprland. Deux variantes montrées à Hugo le 2026-08-11 : la
       ligne de sol qui monte, et ce cercle — LE CERCLE EST SON CHOIX.
       0,78×côté : juste au-dessus de la demi-diagonale, à 1 rien n'est
       rogné ; le centre glisse vers le bas en se fermant. */
    const f = irisRef.current
    if (f < 1) {
      ctx.globalCompositeOperation = "destination-in"
      ctx.beginPath()
      ctx.arc(w / 2, h * (0.55 + 0.07 * (1 - f)), Math.max(0, f * 0.78 * Math.max(w, h)), 0, TAU)
      ctx.fill()
      ctx.globalCompositeOperation = "source-over"
    }
  }

  /* Dessin. Séparé du chargement : il doit pouvoir se relancer au
     redimensionnement sans retélécharger quoi que ce soit. */
  useEffect(() => {
    if (!pretes) return
    const c = canvas.current
    if (!c) return
    const cadre = () => {
      const r = c.getBoundingClientRect()
      const d = Math.min(DPR_MAX, window.devicePixelRatio || 1)
      c.width = Math.round(r.width * d)
      c.height = Math.round(r.height * d)
      peindre(index.get(), true)
    }
    cadre()
    const ro = new ResizeObserver(cadre)
    ro.observe(c)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pretes, index])

  /* LE POINT CLÉ DE LA PERFORMANCE : on ne redessine QUE lorsque
     l'index change. Le scroll émet en continu ; sans ce garde, on
     repeindrait la même image des dizaines de fois par seconde. */
  useMotionValueEvent(index as MotionValue<number>, "change", (i) => {
    /* `prefers-reduced-motion` fige la voiture sur la pose de départ :
       une rotation liée au scroll est exactement le genre de mouvement
       que ce réglage demande d'éteindre. Le volume reste, il ne tourne
       plus. Ce que ce réglage laisse voir est le trois-quarts avant et
       non la plongée de face de l'image 000 : la vue figée est lisible.

       On sort AVANT la veille, et c'est voulu : ne jamais tourner, c'est
       ne jamais avoir besoin des 159 autres images. Une seule requête au
       montage au lieu de cent soixante.

       PENDANT LE GESTE ET SA DÉCRUE, LA MAIN PEINT — pas le scroll
       (voir l'effet de saisie) : sans ces gardes, un coup de molette
       en pleine prise ou pendant l'inertie repeindrait l'image que le
       ressort dicte sous celle que la main a laissée. */
    if (reduit || !pretes || tenue.current || roule.current) return
    peindre(i)
    veille(i)
  })

  /* L'iris suit le ressort : AU PLUS UN repeint par frame, et
     seulement quand la fraction change — au repos comme passé la
     mi-course, zéro travail (les deux bouts de la rampe se figent).
     Sous reduce : rien, l'engloutissement est un mouvement que le
     défilement cause. Pendant un geste, la main peint déjà : l'iris
     s'appliquera à son dessin. */
  useMotionValueEvent(lisse, "change", (v) => {
    if (reduit || !pretes) return
    const f = v <= 0.03 ? 1 : v >= 0.22 ? 0 : 1 - (v - 0.03) / 0.19
    if (f === irisRef.current) return
    irisRef.current = f
    if (tenue.current || roule.current) return
    if (irisPrevu.current) return
    irisPrevu.current = requestAnimationFrame(() => {
      irisPrevu.current = 0
      peindre(index.get(), true)
    })
  })

  /* ── LA SAISIE (#12) ──────────────────────────────────────────────
     Écoutée au DOCUMENT : `pointer-events: none` de la couche ne bouge
     pas (c'est ce qui protège le texte que la voiture traverse), donc
     c'est la page qu'on écoute, et la géométrie qui décide — cible non
     interactive ET pixel opaque de la toile. Desktop au pointeur fin
     seulement : au tactile, le drag se disputerait la page avec le
     scroll, le contraire d'une bascule invisible. */
  useEffect(() => {
    if (!DRAG_LIVRE || !pretes || absente) return
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    const cont = conteneur.current
    const c2d = canvas.current
    if (!cont || !c2d) return

    /* Coordonnées de page → pixel de toile. getBoundingClientRect
       subit l'assiette : on passe par le CENTRE (invariant par
       rotation) puis on tourne le vecteur de -assiette ; la dérive
       verticale est déjà dans le rect, et offsetWidth donne la taille
       CSS non transformée. Un getImageData d'un pixel — pas de coût
       mesurable, et jamais plus d'un par frame (voir survole). */
    const surVoiture = (x: number, y: number) => {
      if (fondu.get() <= SEUIL_FONDU) return false // invisible = insaisissable
      const r = cont.getBoundingClientRect()
      const vx = x - (r.left + r.width / 2)
      const vy = y - (r.top + r.height / 2)
      const a = (-assiette.get() * Math.PI) / 180
      const ech = c2d.width / cont.offsetWidth
      const px = Math.round((vx * Math.cos(a) - vy * Math.sin(a) + cont.offsetWidth / 2) * ech)
      const py = Math.round((vx * Math.sin(a) + vy * Math.cos(a) + cont.offsetHeight / 2) * ech)
      if (px < 0 || py < 0 || px >= c2d.width || py >= c2d.height) return false
      const ctx = c2d.getContext("2d", { alpha: true })
      return !!ctx && ctx.getImageData(px, py, 1, 1).data[3] >= SEUIL_ALPHA
    }

    let candidat: { x: number; y: number } | null = null
    let azimut = 0        // degrés, continu pendant le geste et l'inertie
    let elevation = ELEV_REPOS
    let vitesse = 0       // °/frame, pour l'inertie du relâchement
    let dernierX = 0
    let dernierY = 0
    let enGl = false      // CE geste-ci est rendu en WebGL
    let inertie = 0       // rAF de la décrue en cours, 0 sinon
    let renduPrevu = 0    // au plus un rendu WebGL par frame
    let sondePrevue = 0   // au plus un test de survol par frame

    const chargeRegime = () => {
      if (chargementGl.current) return
      /* Le premier geste avéré est le SEUL déclencheur du chunk et du
         modèle — jamais le survol (tout le monde survole le centre de
         l'écran), jamais l'idle, jamais le clic nu. */
      chargementGl.current = import("./voiture-drag")
        .then(async (m) => {
          const t = toileGl.current
          if (!t) return
          const s = await m.creeScene(t, () => {
            /* Perte de contexte : retour SILENCIEUX au mode séquence,
               jamais un écran vide — le renoncement propre de
               l'en-tête, appliqué au WebGL. */
            delete cont.dataset.regime
            if (tenue.current && enGl) {
              enGl = false
              c2d.style.visibility = "visible"
              t.style.visibility = "hidden"
              peindre(azimutVersIndex(azimut, NB), true)
            }
          })
          if (!s) return // contexte refusé ou modèle en échec : le drag azimut-seul reste
          if (!vivant.current) return s.detruit() // démonté pendant le téléchargement : rien ne fuit
          sceneGl.current = s
          /* Relevés par le banc (--drag) : le régime et l'empreinte
             GPU réelle — des chiffres mesurés, pas estimés. */
          cont.dataset.regime = "gl"
          const inf = s.info()
          cont.dataset.glGeometries = String(inf.geometries)
          cont.dataset.glTextures = String(inf.textures)
        })
        .catch(() => {})
    }

    /* AU PLUS UN TRAVAIL PAR FRAME, séquence comme WebGL. La souris
       émet plus vite que l'écran (mesuré au banc : 125 mousemove/s) :
       peindre ou faire glisser la veille PAR ÉVÉNEMENT, c'était
       plusieurs drawImage pleine toile et des dizaines de fetches par
       frame — 31 % de frames au-dessus du budget. Les événements ne
       font que poser l'état ; cette frame-ci le consomme une fois. */
    const rendUneFrame = () => {
      if (renduPrevu) return
      renduPrevu = requestAnimationFrame(() => {
        renduPrevu = 0
        if (!tenue.current) return
        if (enGl) sceneGl.current?.rend(azimut, elevation)
        else peindre(azimutVersIndex(azimut, NB))
        /* La veille suit l'azimut du drag POUR QUE L'IMAGE DU
           RELÂCHEMENT SOIT DÉCODÉE — c'est à la pose qu'elle sert,
           pas pendant le balayage. Sous un cran par frame, la main
           ralentit : on recentre. Au-dessus, on laisse filer — suivre
           un balayage à 450°/s coûtait 200 fetches et décodages par
           seconde, et c'était les pointes du banc (mesuré : p90 à
           17,7 ms, pics de ramasse-miettes). */
        if (Math.abs(vitesse) < CRAN) veille(azimutVersIndex(azimut, NB))
      })
    }

    const saisit = (x: number, y: number) => {
      tenue.current = true
      saisie.set(1)
      document.documentElement.classList.remove("voiture-survol")
      document.documentElement.classList.add("voiture-saisie")
      window.getSelection()?.removeAllRanges()
      chargeRegime()
      if (inertie) {
        /* Reprise en pleine décrue : la main récupère la voiture LÀ OÙ
           ELLE EST — azimut et élévation gardent leurs valeurs. */
        cancelAnimationFrame(inertie)
        inertie = 0
        roule.current = false
      } else {
        /* On part de l'image AFFICHÉE (`dernier`), pas de l'index que
           le scroll dicte : sous reduce la toile est figée pendant que
           le ressort continue de suivre la page — saisir depuis
           index.get() téléportait la voiture d'un demi-tour. */
        azimut = (dernier.current >= 0 ? dernier.current : index.get()) * CRAN
        elevation = ELEV_REPOS
      }
      vitesse = 0
      dernierX = x
      dernierY = y
      /* La promotion s'est décidée ENTRE les gestes : si le modèle est
         arrivé, ce geste-ci est WebGL — bascule sèche, au même azimut,
         même cadre. Sinon, séquence — et jamais de changement en cours
         de geste : une main qui découvre un axe de plus au milieu d'un
         mouvement, c'est une surprise, pas une bascule invisible. */
      enGl = !!sceneGl.current && !sceneGl.current.estPerdu()
      if (enGl) {
        const t = toileGl.current!
        const d = Math.min(DPR_MAX, window.devicePixelRatio || 1)
        sceneGl.current!.taille(Math.round(t.offsetWidth * d), Math.round(t.offsetHeight * d))
        sceneGl.current!.rend(azimut, elevation)
        t.style.visibility = "visible"
        c2d.style.visibility = "hidden"
      }
    }

    const bouge = (x: number, y: number) => {
      vitesse = (x - dernierX) * SENS_AZIMUT
      azimut += vitesse
      if (enGl) elevation = Math.min(ELEV_MAX, Math.max(ELEV_MIN, elevation + (dernierY - y) * SENS_ELEV))
      dernierX = x
      dernierY = y
      rendUneFrame()
    }

    /* Réconciliation au relâchement : inertie (coupée sous reduce),
       retour d'élévation vers ELEV_REPOS (instantané sous reduce — la
       séquence n'existe qu'à cette élévation), aimantation au cran, et
       L'ANGLE LAISSÉ PAR LA MAIN PERSISTE via l'offset. Pas de retour
       élastique vers l'azimut du scroll : ramener l'objet annulerait
       le geste qu'on vient d'offrir. */
    const pose = () => {
      /* La main est PARTIE — l'inertie n'est pas une prise. Confondre
         les deux (un seul drapeau) faisait ré-entrer pose() à chaque
         mousemove de la décrue et empilait des boucles concurrentes. */
      tenue.current = false
      document.documentElement.classList.remove("voiture-saisie")
      const fini = () => {
        inertie = 0
        roule.current = false
        /* le scroll ne dicte plus d'azimut (l'envol a remplacé la
           rotation) : l'offset EST le cran posé, sans terme de ressort */
        decalage.set(offsetAuRelachement(azimut, 0, { nb: NB, pose: POSE, tours: TOURS }))
        if (enGl) {
          c2d.style.visibility = "visible"
          toileGl.current!.style.visibility = "hidden"
        }
        /* On peint l'azimut QUE LA MAIN A LAISSÉ, jamais index.get() :
           la transform combinée ne consomme decalage qu'à la frame
           suivante (framer la planifie), et sous reduce jamais — lire
           l'index ici repeignait l'image d'AVANT le geste et
           l'annulait visuellement. */
        peindre(azimutVersIndex(azimut, NB), true)
        veille(azimutVersIndex(azimut, NB)) // la fenêtre se recentre sur l'image posée
        saisie.set(0)
      }
      if (reduit) {
        /* Sous reduce, rien ne continue après la main : pas d'inertie,
           élévation reposée d'un coup. Le drag lui-même reste — c'est
           de l'interaction, pas une animation. */
        elevation = ELEV_REPOS
        if (enGl) sceneGl.current?.rend(azimut, elevation)
        return fini()
      }
      const decroit = () => {
        azimut += vitesse
        vitesse *= AMORTI
        elevation = ELEV_REPOS + (elevation - ELEV_REPOS) * RETOUR_ELEV
        const posee = Math.abs(elevation - ELEV_REPOS) < 0.05
        if (posee) elevation = ELEV_REPOS
        if (enGl) sceneGl.current?.rend(azimut, elevation)
        else peindre(azimutVersIndex(azimut, NB))
        if (Math.abs(vitesse) < CRAN) veille(azimutVersIndex(azimut, NB))
        if (Math.abs(vitesse) < 0.02 && posee) return fini()
        inertie = requestAnimationFrame(decroit)
      }
      roule.current = true
      inertie = requestAnimationFrame(decroit)
    }

    const survole = (e: MouseEvent) => {
      if (sondePrevue) return
      const { clientX: x, clientY: y } = e
      const cible = e.target as Element | null
      sondePrevue = requestAnimationFrame(() => {
        sondePrevue = 0
        const dessus = !cible?.closest?.(INTERACTIFS) && surVoiture(x, y)
        document.documentElement.classList.toggle("voiture-survol", dessus)
      })
    }

    const surMousedown = (e: MouseEvent) => {
      if (e.button !== 0 || tenue.current) return
      if ((e.target as Element | null)?.closest?.(INTERACTIFS)) return
      if (!surVoiture(e.clientX, e.clientY)) return
      /* Pas le mousedown nu : un clic pour poser le focus ou dissiper
         une sélection ne doit pas coûter des mégaoctets. Candidat
         seulement — le drag est avéré au-delà du seuil. */
      candidat = { x: e.clientX, y: e.clientY }
    }

    const surMousemove = (e: MouseEvent) => {
      /* Un relâchement HORS de la fenêtre ne produit ni mouseup ni
         blur : sans ce contrôle du bouton, le pointeur revenait avec
         une prise fantôme — la voiture collée à une main ouverte.
         `tenue` seul : pendant la décrue la main est déjà partie, et
         rappeler pose() ici empilait une boucle par mousemove. */
      if ((tenue.current || candidat) && !(e.buttons & 1)) {
        candidat = null
        if (tenue.current) pose()
        return
      }
      if (tenue.current) return bouge(e.clientX, e.clientY)
      if (candidat) {
        if (Math.hypot(e.clientX - candidat.x, e.clientY - candidat.y) < SEUIL_DRAG) return
        const dep = candidat
        candidat = null
        saisit(dep.x, dep.y)
        bouge(e.clientX, e.clientY)
        return
      }
      survole(e)
    }

    const surMouseup = () => {
      candidat = null
      if (tenue.current) pose()
    }

    document.addEventListener("mousedown", surMousedown)
    document.addEventListener("mousemove", surMousemove)
    window.addEventListener("mouseup", surMouseup)
    window.addEventListener("blur", surMouseup) // un alt-tab en pleine prise est un relâchement

    return () => {
      document.removeEventListener("mousedown", surMousedown)
      document.removeEventListener("mousemove", surMousemove)
      window.removeEventListener("mouseup", surMouseup)
      window.removeEventListener("blur", surMouseup)
      if (inertie) cancelAnimationFrame(inertie)
      if (renduPrevu) cancelAnimationFrame(renduPrevu)
      if (sondePrevue) cancelAnimationFrame(sondePrevue)
      document.documentElement.classList.remove("voiture-saisie", "voiture-survol")
      tenue.current = false
      roule.current = false
      saisie.set(0)
      /* Rendre les toiles à leur CSS : un re-run en pleine prise GL
         laissait la 2D cachée en inline — voiture invisible. La scène
         et son chargement, eux, survivent : ils appartiennent au
         composant (voir l'effet de montage). */
      c2d.style.visibility = ""
      if (toileGl.current) toileGl.current.style.visibility = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pretes, absente, reduit])

  if (absente) return null

  return (
    <motion.div
      ref={conteneur}
      className="voiture"
      aria-hidden="true"
      /* PLUS DE BRANCHE SUR `reduit` ICI, et c'est la suppression de la
         spirale qui l'a rendue inutile. Il ne reste que trois valeurs :
         l'assiette, la dérive et le fondu. En mouvement réduit la boucle
         de respiration ne démarre pas, donc `assiette` garde INCLINAISON
         et `derive` reste à zéro : la même expression rend exactement la
         pose fixe d'avant, sans avoir à l'écrire deux fois. Toute la
         différence tient au canvas et à cette boucle-là.

         LE FONDU DOIT RESTER LIÉ DANS LES DEUX CAS. La version d'avant
         ne liait rien du tout en mouvement réduit, ce qui débranchait
         `fondu` avec le reste : la toile étant `position: fixed`, la
         voiture restait épinglée au centre de l'écran, pleine taille et
         pleine opacité, sur les onze mille pixels de page qui suivent le
         tracé — par-dessus huit feuilles de texte. Le réglage censé
         calmer la page la rendait plus envahissante que l'animation
         qu'il éteint.

         Accessoirement, un objet de style unique supprime l'écart
         d'hydratation : le serveur et le client écrivent la même chose,
         quel que soit le réglage du visiteur. Un `data-fige` traînait ici,
         qui promettait d'exposer l'état au CSS ; il ne l'a jamais fait —
         `matchMedia` n'existant pas au rendu serveur, l'attribut était
         toujours absent du HTML et React ne réconcilie pas les attributs
         à l'hydratation. Aucune règle ne le ciblait, il est parti. Les
         deux MotionValues de la respiration ne rouvrent pas cet écart :
         elles naissent à INCLINAISON et 0, serveur comme client, et la
         boucle ne les touche qu'après le montage.

         LA RESPIRATION ÉCRIT ICI, sur l'élément qui porte déjà l'assiette
         et le fondu, et pas dans une couche à elle. Framer compose les
         MotionValues d'un même `style` en un seul transform : il n'y a
         rien à se disputer, et surtout pas un ancêtre transformé de plus
         devant un `position: fixed`. */
      style={{ rotate: assiette, y: yTotal, opacity: fondu }}
    >
      <canvas ref={canvas} className="voiture-toile" />
      {/* La toile du régime drag (#12) : même cadre, même dosage,
          échangée SEC avec la 2D à la saisie. Toujours dans le DOM —
          un canvas sans contexte ne coûte rien, et serveur et client
          écrivent ainsi le même HTML. */}
      <canvas ref={toileGl} className="voiture-toile-gl" />
    </motion.div>
  )
}
