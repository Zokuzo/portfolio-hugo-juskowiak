/* ==================================================================
   STUDIO PARTAGÉ — la scène d'éclairage, les retouches matériaux, les
   réglages du moteur et la mise en place du modèle, extraits de
   scene.html pour être consommés par l'outil de rendu ET par le régime
   drag du client (chantier #12).

   Le risque central du drag est un écart visible au raccord. La parade
   n'est pas de « reproduire » le studio côté client, c'est de NE PLUS
   AVOIR DEUX STUDIOS — deux copies, c'est une copie qui pourrit, la
   règle que rendu.mjs s'applique déjà à trouveChrome.

   THREE ARRIVE EN PARAMÈTRE, jamais importé ici : l'outil le tire du
   CDN (importmap de scene.html), le client de node_modules — importer
   ici figerait une des deux sources et dédoublerait le moteur. La
   version est ÉPINGLÉE À 0.169.0 DES DEUX CÔTÉS : three change sa
   gestion de la couleur d'une version à l'autre, et un pipeline en
   0.169 contre un client d'une autre version serait un raccord qui
   dérive sans qu'aucun code n'ait bougé.
   ================================================================== */

/* Les réglages solidaires du raccord : en changer un invalide à la
   fois la séquence rendue et le rendu client — jamais l'un sans
   l'autre. ELEVATION est celle de la séquence en production
   (CREDIT.txt) ; scene.html garde son défaut d'URL à 13 pour ne pas
   changer le comportement de l'outil, la production passe --elevation=30. */
export const FOV = 22
export const ELEVATION = 30
export const FLOU_PMREM = 0.02
export const INTENSITE_ENV = 1
export const CARROSSERIE = "0b0e14"
/* 0,08 et non les 0,14 de la GT86. La GT86 tenait sa brillance de ses
   chromes et de ses jantes argent ; la P1 MSO n'a que du carbone mat et
   des jantes noires, et à 0,14 les neuf bandes s'y étalaient en nappe
   grise au lieu de dessiner un trait. Mesuré sur le rendu d'essai à 8
   vues : le p99 de luminance des pixels opaques passe de 93 à 120 sur
   `000` et de 120 à 138 sur `007`, pendant que la médiane DESCEND de 12,0
   à 9,4 — plus de noir ET plus de trait, c'est-à-dire du galbe. */
export const RUGOSITE = 0.08

/* ── RETOUCHES MATÉRIAUX ──────────────────────────────────────────
   Propres au modèle McLaren P1 MSO de bohmerang. Contrairement à la
   GT86, le .glb arrive TEXTURÉ (34 textures) : on ne recolore que les
   matériaux de couleur pure qui portent la livrée. La carrosserie
   blanche et l'accent bleu MSO passent au carbone sombre parce que le
   système du site est mono-accent : le bleu y serait une teinte
   étrangère, et une carrosserie blanche un phare derrière le titre.
   La livrée MSO d'origine est réservée au futur thème clair.
   Aucun des trois matériaux ci-dessous ne porte de texture — les 34
   textures du modèle restent donc toutes intactes. Si on change de
   modèle, on réécrit ce tableau, c'est le seul endroit. */
export function retouches({ carrosserie = CARROSSERIE, rugosite = RUGOSITE } = {}) {
  return {
    WhitePaintjob: { couleur: carrosserie, metal: 0.90, rugo: rugosite, vernis: 1 },
    Blue:          { couleur: "121317", metal: 0.30, rugo: 0.45 }, // accent MSO neutralisé
    Glass:         { couleur: "04060a", metal: 0.00, rugo: 0.06 }, // vitrage teinté, même geste que la GT86
  }
}

/* Réglages du moteur : mêmes valeurs des deux côtés, sinon la couleur
   du client n'est pas celle des images. L'appelant garde la CRÉATION
   du renderer (alpha, antialias, canvas, preserveDrawingBuffer) : ces
   choix-là diffèrent légitimement entre l'outil et le client. */
export function regleRenderer(THREE, renderer) {
  renderer.setClearAlpha(0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
}

/* ── STUDIO SOMBRE ────────────────────────────────────────────────
   Pas d'HDRI téléchargée : une boîte noire et quelques bandes
   lumineuses suffisent, et c'est exactement ce qu'on veut. Ce qui
   fait lire le chrome, ce n'est pas la quantité de lumière, c'est le
   CONTRASTE entre des bandes très claires et un noir profond : une
   arête ne se voit que si elle a une bande à réfléchir. Une lumière
   diffuse remplirait la carrosserie d'un gris uniforme et effacerait
   précisément ce qu'on cherche. */
export function studio(THREE) {
  const s = new THREE.Scene()
  s.add(new THREE.Mesh(
    new THREE.BoxGeometry(40, 24, 40),
    new THREE.MeshBasicMaterial({ color: 0x04060a, side: THREE.BackSide })
  ))
  const bande = (w, h, pos, rot, force) => {
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    m.color.multiplyScalar(force)  // >1 : on alimente le PMREM en valeurs HDR
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)
    p.position.set(...pos); p.rotation.set(...rot); s.add(p)
  }
  const H = Math.PI / 2
  /* Les bandes sont FINES et HAUTES, et c'est tout le réglage. Une bande
     large se reflète en nappe : elle noie le capot et le pare-brise d'un
     dégradé blanc et efface le galbe, exactement ce qu'on ne veut pas.
     Une bande fine se reflète en TRAIT, qui suit l'arête et la dessine.
     Trop fine en revanche (moins de ~3° vus du sujet) elle passe sous la
     résolution du cube PMREM et se met à scintiller d'une image à
     l'autre — d'où ces largeurs-là et pas moins. */
  bande(0.8, 30, [    0, 12.0,  0], [ H,  0, 0], 9)
  bande(0.6, 28, [-3.4, 12.0,  0], [ H,  0, 0], 6)
  bande(0.6, 28, [ 3.4, 12.0,  0], [ H,  0, 0], 6)
  // Flancs : le trait qui court le long de la caisse et détache l'épaule.
  bande(0.9, 30, [-9.5, 2.6,  0], [ 0,  H, 0], 8)
  bande(0.9, 30, [ 9.5, 2.6,  0], [ 0, -H, 0], 8)
  /* Deux traits bas, et RAPPROCHÉS. Sans eux les bas de caisse, les
     pneus et les jantes tombent dans le noir : la voiture se lit comme
     une masse coupée aux genoux. Rapprochés parce que ce qui compte
     n'est pas la puissance mais la taille angulaire vue du sujet — une
     bande lointaine, même forte, n'éclaire qu'un liseré. */
  bande(1.1, 30, [-7.0, 0.35, 0], [ 0,  H, 0], 7)
  bande(1.1, 30, [ 7.0, 0.35, 0], [ 0, -H, 0], 7)
  // Fond et face : décollent la silhouette du noir de profil.
  bande(16, 0.7, [ 0, 3.0, -12], [0, 0, 0], 3)
  bande(16, 0.7, [ 0, 3.0,  12], [0, Math.PI, 0], 3)
  return s
}

/* ── LE STUDIO CLAIR (#13) ────────────────────────────────────────
   Boîte CLAIRE, bandes SOMBRES : sur une carrosserie blanche, c'est
   la bande sombre qui dessine l'arête — « une arête ne se voit que
   si elle a une bande à réfléchir », le principe survit au signe.
   GÉOMÉTRIE IDENTIQUE au studio sombre (mêmes positions, mêmes
   tailles : le cadrage et le galbe sont calés dessus) ; seules la
   boîte et la teinte des bandes s'inversent — la force HDR du sombre
   devient une PROFONDEUR d'encre : la bande la plus forte (9) est la
   plus sombre. Teintes CANDIDATES, réglées à l'œil à l'essai 8 vues
   — gate Hugo. */
export function studioClair(THREE) {
  const s = new THREE.Scene()
  s.add(new THREE.Mesh(
    new THREE.BoxGeometry(40, 24, 40),
    new THREE.MeshBasicMaterial({ color: 0xf2f0ec, side: THREE.BackSide })
  ))
  const bande = (w, h, pos, rot, teinte) => {
    const m = new THREE.MeshBasicMaterial({ color: teinte, side: THREE.DoubleSide })
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)
    p.position.set(...pos); p.rotation.set(...rot); s.add(p)
  }
  const H = Math.PI / 2
  bande(0.8, 30, [    0, 12.0,  0], [ H,  0, 0], 0x07080b)
  bande(0.6, 28, [-3.4, 12.0,  0], [ H,  0, 0], 0x171b2e)
  bande(0.6, 28, [ 3.4, 12.0,  0], [ H,  0, 0], 0x171b2e)
  // Flancs : le trait sombre qui court le long de la caisse blanche.
  bande(0.9, 30, [-9.5, 2.6,  0], [ 0,  H, 0], 0x0b0e14)
  bande(0.9, 30, [ 9.5, 2.6,  0], [ 0, -H, 0], 0x0b0e14)
  bande(1.1, 30, [-7.0, 0.35, 0], [ 0,  H, 0], 0x10131c)
  bande(1.1, 30, [ 7.0, 0.35, 0], [ 0, -H, 0], 0x10131c)
  // Fond et face : décollent la silhouette claire du papier.
  bande(16, 0.7, [ 0, 3.0, -12], [0, 0, 0], 0x2a2d36)
  bande(16, 0.7, [ 0, 3.0,  12], [0, Math.PI, 0], 0x2a2d36)
  return s
}

/* La livrée MSO d'origine EST le but du thème clair : ni
   WhitePaintjob ni Blue ne se retouchent — le blanc du modèle est le
   défaut glTF, le bleu est le #0080e7 que le thème prend pour accent.
   Table vide ; si l'essai 8 vues montre un vitrage ou un accent à
   reprendre, il s'ajoute ICI, seul endroit. */
export function retouchesClair() {
  return {}
}

/* Normalisation du modèle : échelle à 4 unités D'ABORD, recentrage
   ENSUITE — L'ORDRE COMPTE. `position` s'applique dans l'espace du
   parent tandis que `scale` s'applique à la géométrie : recentrer
   avant de mettre à l'échelle décale d'un facteur (k-1) et envoie la
   voiture hors cadre. On mesure donc la boîte une seconde fois, après
   mise à l'échelle. Rend le rayon de la sphère englobante, dont le
   placement caméra a besoin. */
export function prepareModele(THREE, m) {
  const t0 = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3())
  m.scale.setScalar(4 / Math.max(t0.x, t0.y, t0.z))
  m.updateMatrixWorld(true)
  // Recentrer sur l'origine : c'est l'axe de rotation. Un modèle décentré
  // décrirait un cercle au lieu de pivoter.
  const boite = new THREE.Box3().setFromObject(m)
  m.position.sub(boite.getCenter(new THREE.Vector3()))
  m.updateMatrixWorld(true)
  return boite.getBoundingSphere(new THREE.Sphere()).radius
}

/* Applique la table de retouches, rend l'inventaire des matériaux
   rencontrés (l'introspection --materiaux de l'outil s'en sert).
   Vider la texture est OPT-IN : d'office, recolorer un matériau
   texturé détruirait sa texture — la GT86 n'en avait aucune, la P1 en
   a 34. `masquer` éteint un matériau entier sans toucher à la
   géométrie. */
export function appliqueRetouches(m, table) {
  const releves = []
  m.traverse((o) => {
    if (!o.isMesh) return
    o.frustumCulled = false
    for (const mat of (Array.isArray(o.material) ? o.material : [o.material])) {
      if (!mat) continue
      releves.push({ mesh: o.name, mat: mat.name, type: mat.type })
      if (!mat.isMeshStandardMaterial) continue
      mat.envMapIntensity = 1
      const r = table[mat.name]
      if (!r) continue
      if (r.couleur !== undefined) { mat.color.setHex(parseInt(r.couleur, 16)); if (r.sansTexture) mat.map = null }
      if (r.masquer) mat.visible = false
      if (r.metal !== undefined) mat.metalness = r.metal
      if (r.rugo !== undefined) mat.roughness = r.rugo
      if (r.vernis !== undefined && "clearcoat" in mat) { mat.clearcoat = r.vernis; mat.clearcoatRoughness = 0.04 }
    }
  })
  return releves
}

/* Place la caméra sur l'arc d'élévation, à la distance où la sphère
   englobante rentre dans le champ — le recadrage se charge du reste.
   Appelée par frame côté client quand l'élévation bouge : trois
   lignes de trigonométrie, rien à mémoïser. */
export function placeCamera(THREE, camera, rayon, elevationDeg) {
  const d = (rayon / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.25
  const e = THREE.MathUtils.degToRad(elevationDeg)
  camera.position.set(0, Math.sin(e) * d, Math.cos(e) * d)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
}
