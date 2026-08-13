# Recherche — L'embed Spotify par-dessus une scène 3D (ticket #18)

Date : 2026-08-13. Sources primaires : docs Spotify for Developers, API oEmbed interrogée en direct (curl), docs three.js, docs drei, MDN.

## Verdict

**Faisable.** L'embed Spotify s'affiche dans l'expérience sans la quitter, mais **pas en le plaquant en perspective dans la scène** : l'approche recommandée est le **« plan 2D une fois zoomé »** — l'écran 3D de la GT86 affiche une texture froide, le clic « Musiques » zoome la caméra jusqu'à cadrer l'écran de face, puis un iframe DOM **plat, non transformé** se superpose exactement sur l'écran. Netteté parfaite, événements natifs, zéro occlusion à gérer, indépendant du choix de stack du #17.

Deux contraintes à assumer : le visiteur **non connecté à Spotify n'entend que des extraits (~30 s)**, et l'iframe **pose des cookies dès son chargement** → façade click-to-load obligatoire (RGPD).

---

## 1. L'embed Spotify aujourd'hui (vérifié)

### oEmbed et snippet iframe

Endpoint : `GET https://open.spotify.com/oembed?url=<URL Spotify encodée>` — sans authentification, ni clé. ([Réf. oEmbed](https://developer.spotify.com/documentation/embeds/reference/oembed))

Snippet exact retourné (interrogé en direct le 2026-08-13) :

```html
<iframe style="border-radius: 12px" width="100%" height="152"
  title="Spotify Embed: …" frameborder="0" allowfullscreen
  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
  loading="lazy"
  src="https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT?utm_source=oembed"></iframe>
```

La réponse inclut aussi `iframe_url` (utilisable directement, sans parser le HTML) et `thumbnail_url` (300×300) — **parfait pour la texture froide de l'écran 3D**.

### Types de contenu supportés (vérifié empiriquement)

| Type | oEmbed | Hauteur par défaut |
|---|---|---|
| Track | ✅ | **152 px** |
| Playlist | ✅ | **352 px** |
| Artiste | ✅ | **352 px** |
| Album | ✅ | **352 px** |
| Podcast / épisode | ✅ (doc officielle) | 352 px |
| **Profil utilisateur** | ❌ **HTTP 400** | — |

Le [tutoriel officiel](https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed) confirme : « You can create an Embed for a podcast, an episode, a track, a playlist, an artist, or an album ». Le profil n'y figure pas et l'API le rejette. **Pour « Musiques » : viser une playlist ou un artiste, pas le profil.**

Dimensions : largeur par défaut 456 px (le snippet met `width="100%"` — responsive), pas de minimum documenté ; considérer 152 px (track) / 352 px (playlist) comme plancher de hauteur — en dessous, le player tronque ses contrôles.

### Thème

Non documenté officiellement, mais stable depuis des années : `?theme=0` = sombre (défaut), `?theme=1` = clair, ajouté à l'URL `/embed/…`. L'iFrame API accepte une option `theme`. Pas d'accent color, pas de CSS custom — Spotify garde la main sur le chrome du player. ([Community Spotify](https://community.spotify.com/t5/Spotify-for-Developers/Iframe-API-player-background-color/td-p/5587261)) Le sombre par défaut colle à un habitacle de GT86.

### Lecture : extrait vs complet

D'après le [guide de troubleshooting officiel](https://developer.spotify.com/documentation/embeds/guides/troubleshooting/) :

- Sans `allow="encrypted-media"` sur l'iframe → **extraits uniquement** (« without this, the Embed will only allow users to listen to previews »). Ne pas modifier le snippet généré.
- Même avec l'attribut : le visiteur **non connecté à Spotify dans son navigateur** n'a que des extraits ~30 s ; connecté, il a la lecture complète (DRM via Widevine, d'où `encrypted-media`). C'est le comportement normal, pas un bug — à assumer dans le design (l'extrait suffit pour une vibe « autoradio »).
- Navigateurs : Chrome, Firefox, Edge, Opera, Safari.

### Autoplay

Le clic « Musiques » constitue l'activation utilisateur exigée par la [politique autoplay des navigateurs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), et `allow="autoplay"` délègue la permission à l'iframe cross-origin. Mais la [doc iFrame API](https://developer.spotify.com/documentation/embeds/references/iframe-api) prévient elle-même que `play()` « might not be supported in all browsers and for all users ». **Ne pas construire l'expérience sur un autoplay garanti** : afficher le player prêt, laisser le visiteur presser play. L'[iFrame API](https://open.spotify.com/embed/iframe-api/v1) (`createController`, `loadUri`, événements `ready`/`playback_update`) reste disponible si on veut piloter le player depuis les boutons 3D de l'habitacle plus tard.

### Cookies / consentement (vérifié aux en-têtes)

`GET https://open.spotify.com/embed/track/…` répond avec :

```
set-cookie: sp_t=… ; Max-Age=31536000; Domain=.spotify.com; Secure; SameSite=none
set-cookie: sp_landing=… ; Max-Age=86400; Domain=.spotify.com; HttpOnly; SameSite=none
```

Un cookie **d'un an, cross-site, posé dès le chargement de l'iframe**, avant toute interaction. En France (CNIL/RGPD), charger cet iframe sans consentement n'est pas défendable. **La façade click-to-load règle tout** : l'écran 3D montre la texture froide (le `thumbnail_url` de l'oEmbed, hébergé sur le CDN images de Spotify, ne pose pas de cookie de tracking équivalent — ou mieux : une capture statique locale), et l'iframe ne se monte qu'au clic « Musiques », accompagné d'une mention discrète. Le clic est à la fois le geste d'activation autoplay et le consentement contextuel.

Aucun `X-Frame-Options` ni `frame-ancestors` : la page `/embed/` est conçue pour être iframée partout. Côté portfolio, si une CSP est un jour ajoutée : `frame-src https://open.spotify.com`.

---

## 2. Superposer l'iframe sur le canvas WebGL

Trois approches, un fait incontournable d'abord : **un iframe cross-origin capture intégralement clic et scroll dès qu'il est au-dessus du canvas** — impossible de « traverser » un iframe pour atteindre la scène, et impossible d'interagir avec un iframe placé sous le canvas. Il faut donc choisir : quand le player est visible, la zone qu'il couvre appartient au player.

### a) CSS3DRenderer (three vanilla)

Deux renderers empilés : le canvas WebGL derrière, un layer DOM transformé en `matrix3d` devant, synchronisés sur la même caméra. La [doc three.js](https://threejs.org/docs/#examples/en/renderers/CSS3DRenderer) est claire sur les limites : **aucune occlusion par profondeur entre le DOM et les meshes** (le DOM est toujours devant ou derrière, en bloc), pas de matériaux, blending impossible. Si le tableau de bord ou le volant doit passer devant l'écran pendant l'orbite, ça se voit immédiatement. Texte rendu par le navigateur mais **sous transform 3D perspective → sous-pixel, flou selon zoom et navigateur**.

### b) drei `<Html transform occlude>` (si le #17 choisit R3F)

Même mécanique que CSS3DRenderer, emballée en composant. La [doc drei](https://drei.docs.pmnd.rs/misc/html) ajoute deux modes d'occlusion : `occlude` (raycast — l'élément entier disparaît quand un mesh le couvre, binaire) et `occlude="blending"` (« real occlusion », l'élément semble intégré à la scène via un matériau de punch-through — mais réservé aux éléments rectangulaires, coûteux, et la doc avertit elle-même : « on some devices and browsers, the rendered html may appear blurry »). Correct pour des labels ; **fragile pour un iframe interactif de 352 px qu'on veut net et scrollable**.

### c) « Plan 2D une fois zoomé » — recommandée

1. **État froid** : l'écran média de la GT86 est un mesh avec une texture (capture statique du player, ou `thumbnail_url` oEmbed). Zéro DOM, zéro cookie, zéro coût.
2. **Clic « Musiques »** : la caméra anime jusqu'à cadrer l'écran perpendiculairement (plein cadre ou presque), contrôles caméra désactivés.
3. **Arrivée** : un `<div>` en `position: fixed`, calé sur le rectangle écran-à-l'écran (calculable par projection des coins du mesh, ou simplement plein-centre stylé), monte l'iframe Spotify **à plat, sans transform 3D**. Fondu court pour masquer le raccord.
4. **Sortie** (bouton retour / Échap) : démonter l'iframe, réactiver les contrôles, dézoomer.

Pourquoi elle gagne : texte **net** (aucun transform → rendu DOM natif, le caveat de flou de drei/CSS3D disparaît), événements **natifs** (l'iframe est légitimement au-dessus, les contrôles caméra sont coupés — aucun conflit), occlusion **sans objet** (rien ne passe devant un écran cadré de face), perf **nulle** (pas de second renderer, pas de resync par frame), et **indépendante du #17** : en vanilla c'est un overlay DOM + une animation de caméra ; en R3F, pareil (au besoin `<Html>` *sans* `transform` fait l'overlay, mais un simple portal React suffit).

L'inconvénient assumé : l'iframe ne « vit » pas dans la scène pendant l'orbite libre. C'est un faux inconvénient — en perspective oblique un player de 456×352 serait illisible et inutilisable de toute façon ; l'écran froid + zoom est exactement le pattern « on reste dans l'expérience ».

---

## 3. Hors-ligne / embed bloqué : le repli

Cas : pas de réseau, adblock/anti-tracking qui bloque `open.spotify.com`, refus de la façade de consentement.

- **Détection** : faire le fetch oEmbed (ou un `fetch` HEAD sur `iframe_url`) au moment du clic ; échec réseau → repli immédiat. En ceinture de sécurité, un timeout sur le `load` de l'iframe (~4 s) couvre le blocage silencieux par extension.
- **Repli : l'écran custom qui linke.** Même cadrage zoomé, mais un composant maison stylé « autoradio » : pochette + titres (données statiques dans le repo — c'est un portfolio, la playlist ne change pas tous les jours), chaque ligne étant un lien `https://open.spotify.com/...` ouvert dans un nouvel onglet. Pas d'audio, pas de cookie, fonctionne hors-ligne (assets locaux), et l'expérience reste cohérente.
- Le refus de consentement affiche directement ce repli — le visiteur n'est jamais devant un écran mort.

---

## 4. Recommandation

1. **Approche c)** : texture froide sur l'écran 3D → clic « Musiques » → zoom caméra → iframe plat en overlay, `theme=0`, **playlist** (352 px) plutôt que profil (impossible) ou track seul.
2. **Façade click-to-load** = consentement RGPD + geste d'activation autoplay, en un seul clic déjà présent dans le design.
3. **Snippet oEmbed non modifié** (garder `allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"`) sous peine de rétrograder en preview-only.
4. **Assumer l'extrait 30 s** pour les visiteurs non connectés à Spotify — c'est la règle du jeu, pas un défaut de l'implémentation.
5. **Repli écran custom + liens** branché sur échec réseau/blocage/refus — à construire en même temps que le nominal, c'est lui qui garantit qu'aucun visiteur ne voit un écran cassé.

## Sources

- [Spotify — Embeds (accueil)](https://developer.spotify.com/documentation/embeds)
- [Spotify — référence oEmbed](https://developer.spotify.com/documentation/embeds/reference/oembed) + interrogation directe de `https://open.spotify.com/oembed` (track/playlist/artist/album/user, 2026-08-13)
- [Spotify — référence iFrame API](https://developer.spotify.com/documentation/embeds/references/iframe-api) et [tutoriel iFrame API](https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api)
- [Spotify — troubleshooting Embeds](https://developer.spotify.com/documentation/embeds/guides/troubleshooting/) (encrypted-media, previews)
- [Spotify — créer un Embed](https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed) (types supportés)
- En-têtes HTTP de `open.spotify.com/embed/…` observés en direct (cookies `sp_t`/`sp_landing`, absence de X-Frame-Options)
- [three.js — CSS3DRenderer](https://threejs.org/docs/#examples/en/renderers/CSS3DRenderer)
- [drei — Html](https://drei.docs.pmnd.rs/misc/html) (transform, occlude, caveat de flou)
- [MDN — guide Autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) (activation utilisateur, Permissions Policy `allow="autoplay"`)
- [Community Spotify — thème du player](https://community.spotify.com/t5/Spotify-for-Developers/Iframe-API-player-background-color/td-p/5587261) (theme=0/1, non documenté officiellement)
