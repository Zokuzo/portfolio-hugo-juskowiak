# La musique de l'intro : pistes libres et règles du web

Recherche du ticket [#57](https://github.com/Zokuzo/portfolio-hugo-juskowiak/issues/57), 2026-10-14. Débloque le prototype [#58](https://github.com/Zokuzo/portfolio-hugo-juskowiak/issues/58).
Sources primaires : les pages des pistes elles-mêmes (licence lue sur la page, le 2026-10-14), le texte légal CC BY 4.0, la licence Pixabay, les docs Chrome, MDN, WebKit, Apple et W3C. Aucune piste n'a été écoutée par l'auteur de ce document : le choix à l'oreille revient à Hugo dans #58.

## Recommandation

1. **Piste 1 à prototyper : « Festa no Ritmo III (Slowed) » de DRMaxWave** (Pixabay). C'est la plus proche de la référence : du phonk brésilien ralenti, comme la piste du short. Licence Pixabay : aucun crédit exigé, pas de marquage Content ID sur la page.
2. **Piste de secours, plus calme : « Memphis Synthwave Night Drive » d'Alex Morgan** (FMA, CC BY 4.0). L'artiste la décrit comme un fond sonore, avec la batterie en retrait. Crédit obligatoire.
3. **Format : un seul fichier AAC `.m4a`**, extrait de 30 à 45 s bouclable, 128 kbit/s, soit environ 0,5 à 0,7 Mo. Lu par Web Audio (`AudioBufferSourceNode`, `loop = true`), en réutilisant l'`AudioContext` unique de `components/gt86/spotify.tsx`.
4. **Départ au clic de décollage, jamais au chargement.** Ce clic est un geste utilisateur : il débloque le son sur Chrome, Safari et Firefox, et il satisfait le WCAG 1.4.2. Bouton couper le son visible dès que le son part.
5. **Crédit dans le pied de page ou une page « crédits »**, même pour les pistes Pixabay (pas obligatoire, mais gratuit et honnête).

## La piste de la référence est sous droits

Le short [BMW Falling from Sky](https://www.youtube.com/shorts/5Wa0YnwZmv0) (Patonkiii) affiche dans son attribution sonore YouTube : **« VISION (Slowed) · UdieNnx, HXVSAGE & Duduzinho »** (relevé dans le HTML de la page, champ `titleFormatted` du bouton audio). C'est une sortie commerciale de phonk brésilien, sans licence libre annoncée : inutilisable sur le site. On cherche donc dans le même esprit : phonk brésilien ralenti, basse lourde, ambiance coucher de soleil.

## Les pistes candidates

| # | Piste | Artiste | Source | Durée | Licence (lue sur la page) | Crédit exigé |
|---|---|---|---|---|---|---|
| 1 | [Festa no Ritmo III (Slowed)](https://pixabay.com/music/beats-festa-no-ritmo-iii-slowed-dr-maxwave-448356/) | DRMaxWave | Pixabay | 1:54 | Pixabay Content License | Non |
| 2 | [Memphis Synthwave Night Drive](https://freemusicarchive.org/music/alex-morgan/phonk-drift/memphis-synthwave-night-drive/) | Alex Morgan | FMA | 2:22 | CC BY 4.0 | Oui |
| 3 | [Atmospheric Phonk Synthwave (Password Infinity)](https://pixabay.com/music/beats-atmospheric-phonk-synthwave-password-infinity-123276/) | Evgeny_Bardyuzha | Pixabay | 2:26 | Pixabay Content License, Content ID | Non |
| 4 | [Phonk Drift Racing Montage](https://freemusicarchive.org/music/alex-morgan/phonk-drift/phonk-drift-racing-montage/) | Alex Morgan | FMA | 2:05 | CC BY 4.0 | Oui |
| 5 | [Bellbones (Slowed) Phonk Energy](https://pixabay.com/music/phonk-bellbones-slowed-phonk-energy-616816/) | sametspasha | Pixabay | 1:40 | Pixabay Content License | Non |
| 6 | [Brazilian Phonk Instrumental](https://pixabay.com/music/phonk-brazilian-phonk-instrumental-607624/) | Sub_Clair | Pixabay | 1:17 | Pixabay Content License, Content ID | Non |
| 7 | [Drift (Strong Anime Phonk)](https://pixabay.com/music/phonk-drift-strong-anime-phonk-511423/) | 9JackJack8 | Pixabay | 3:25 | Pixabay Content License, Content ID | Non (l'artiste demande à être tagué) |

Notes par piste :

- **1. Festa no Ritmo III** : version « slowed » d'un phonk brésilien, le registre exact de « VISION (Slowed) ». Ni Content ID ni mention IA sur la page.
- **2. Memphis Synthwave Night Drive** : phonk + nappes synthwave, l'artiste écrit que la batterie en retrait la rend « usable as a bed ». Page marquée **générée (en tout ou partie) par IA**.
- **3. Password Infinity** : phonk atmosphérique synthwave, bon candidat pour le ciel rose. L'artiste indique que beaucoup de ses pistes sont dans Content ID.
- **4. Phonk Drift Racing Montage** : phonk de course, « any two-minute stretch works » selon l'artiste, donc facile à découper. Page marquée **IA**. Pas de vraie fin.
- **5. Bellbones (Slowed)** : phonk ralenti, énergique.
- **6. Brazilian Phonk Instrumental** : phonk brésilien court (1:17), producteur établi selon sa bio.
- **7. Drift (Strong Anime Phonk)** : agressif et sombre, le plus « drift » de la liste, sans doute trop dur pour un coucher de soleil.

Crédit à afficher pour les pistes CC BY (CC BY 4.0, section 3(a)(1) : auteur, titre, lien vers la licence, lien vers l'œuvre, mention des modifications) :

```
« Memphis Synthwave Night Drive » par Alex Morgan, CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/), extrait bouclé.
Source : https://freemusicarchive.org/music/alex-morgan/phonk-drift/memphis-synthwave-night-drive/
```

La section 3(a)(2) admet un crédit « in any reasonable manner based on the medium » : une page ou un pied de page « crédits » avec ces liens suffit.

## Ce qui a été écarté, et pourquoi

- **CC BY-ND (« pas de modification »)** : la plupart des pistes « phonk » du FMA (Lite Saturation, VibeDepot, Happiness In Music) sont sous BY-ND. Or la licence CC 4.0 dit, section 1 : *« Adapted Material is always produced where the Licensed Material is synched in timed relation with a moving image »*. Une musique calée sur l'animation de l'intro devient donc une adaptation, ce que ND interdit. Couper un extrait en boucle en est une aussi.
- **Uppbeat** : la licence gratuite vise les vidéos, podcasts et lives (« Free to use in your videos, podcasts and live-streams »), avec un code de crédit à coller dans la description YouTube. Les sites web ne sont pas couverts.
- **NCS** : l'usage gratuit vaut pour « YouTube & Twitch » et les créateurs indépendants. Un site web passe par leur formulaire de licence commerciale.
- **Sites qui se disent « libres de droits » sans licence claire** (pages agrégées, packs « gratuits » de banques payantes) : rien de vérifiable, donc exclus.

## Ce que valent les deux licences retenues

**Pixabay Content License** ([résumé](https://pixabay.com/service/license-summary/)) : usage gratuit, **sans attribution** (« credit is appreciated »), modification permise. Interdits qui nous concernent : redistribuer le fichier seul sans apport créatif (le fichier servi dans `public/` n'est pas une redistribution « standalone » tant qu'il accompagne l'intro, mais ne pas le proposer au téléchargement), usage trompeur. La licence rappelle que le contenu peut porter d'autres droits : c'est à nous de vérifier. Le marquage **« Content ID Registered »** ne joue que sur YouTube : si Hugo publie un jour une capture vidéo du site, une revendication peut tomber (levable auprès de l'artiste). Préférer les pistes sans Content ID (1 et 5) évite ce souci.

**CC BY 4.0** ([texte légal](https://creativecommons.org/licenses/by/4.0/legalcode.en)) : usage commercial et modification permis, crédit obligatoire (voir le modèle ci-dessus). Les deux pistes d'Alex Morgan sont marquées IA sur le FMA : la licence affichée reste CC BY 4.0, mais le statut d'auteur d'une musique générée par IA est juridiquement flou. Pour un portfolio, le risque pratique est faible ; il se signale quand même.

**Prudence commune** : faire une capture datée de chaque page de licence au moment du choix, et la garder dans le dépôt (`docs/captures/`). Une page Pixabay ou FMA peut changer ou disparaître.

## Les règles d'autoplay

Les trois moteurs disent la même chose : **le son ne part qu'après un geste de l'utilisateur sur le site.**

- **Chrome** ([politique d'autoplay](https://developer.chrome.com/blog/autoplay)) : « Muted autoplay is always allowed. » Le son est permis si « The user has interacted with the domain (click, tap, etc.) », si le Media Engagement Index est dépassé (desktop seulement) ou si le site est installé en PWA. Un `AudioContext` créé avant le geste naît « suspended » : il faut appeler `resume()` après le geste.
- **Safari macOS** ([WebKit](https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/)) : bloque par défaut les médias avec son ; « Websites should assume any use of <video> or <audio> requires a user gesture click to play ». Lire la promesse de `play()` pour détecter le refus.
- **Safari iOS** ([Apple](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html)) : `play()` ne marche que déclenché par une action de l'utilisateur. Et **`volume` n'est pas réglable en JavaScript** (« Reading the volume property always returns 1 ») : les fondus passent obligatoirement par un `GainNode`.
- **Firefox** ([MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)) : `media.autoplay.block-webaudio` vaut `true` par défaut, donc un `AudioContext` ne joue qu'après une « sticky activation ». Les onglets en arrière-plan ne lancent rien avant d'être au premier plan.
- **Détection** : un refus rejette `play()` avec `NotAllowedError` ; `navigator.getAutoplayPolicy("audiocontext")` donne la politique en amont, là où il existe (MDN).

Conséquence pour le site : **le clic de décollage est le bon déclencheur.** Il faut que le `resume()` (ou le `start()`) soit appelé dans le gestionnaire de ce clic, de façon synchrone, et pas après un `await` de chargement : précharger et décoder le fichier pendant que l'intro attend le clic.

## Accessibilité : WCAG 1.4.2 et reduce motion

- **WCAG 1.4.2** ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html)) : un son qui part tout seul plus de 3 s exige un moyen de le couper ou d'en régler le volume. Un son lancé par un bouton clairement libellé n'est pas « automatique » au sens du critère, et le W3C encourage justement ce départ « initiated by the user ». Le bouton couper le son reste nécessaire pour la suite de la visite.
- **Bouton couper le son** : un vrai `<button>` avec `aria-pressed` et un libellé (« Couper le son » / « Remettre le son »), visible dès que le son démarre, atteignable au clavier. Mémoriser le choix (`localStorage`, en `try/catch`) pour ne pas relancer le son à la visite suivante. Couper = rampe du `GainNode` vers 0 en ~200 ms, pas un arrêt sec.
- **Reduce motion** : `prefers-reduced-motion` parle de mouvement, pas de son. Mais `components/gt86/capable.ts` coupe déjà l'intro 3D sous `reduce`. Sans intro, pas de clic de décollage, donc pas de musique : rien à ajouter, la règle tombe d'elle-même. Ne pas lancer la musique ailleurs dans ce cas.

## Format, poids, boucle

- **Codec : AAC-LC dans un `.m4a`.** Lisible partout. Opus serait plus léger à qualité égale, mais caniuse ne donne à Safari macOS qu'un support « partial » (seul iOS 18.4+ est complet) : un second fichier pour gagner quelques centaines de Ko ne vaut pas la complexité. À reconsidérer si le poids devient un problème.
- **Poids** : un extrait de 30 à 45 s à 128 kbit/s pèse 128 / 8 × 40 ≈ 640 Ko. À 96 kbit/s, ≈ 480 Ko. Pas besoin de la piste entière (1:54 à 3:25).
- **Boucle sans couture** : l'`<audio loop>` laisse souvent un blanc à la jonction (le remplissage de l'encodeur en tête et en fin de fichier). Décoder le fichier entier avec `decodeAudioData` puis le jouer avec un `AudioBufferSourceNode` en `loop = true` ; `loopStart` / `loopEnd` permettent de recaler la boucle sur des temps musicaux et d'enjamber un éventuel silence d'encodeur ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/loop)). Couper l'extrait sur une mesure entière, au même point du temps fort, pour que la jonction tombe en rythme.
- **Réutiliser l'existant** : `components/gt86/spotify.tsx` tient déjà un `AudioContext` unique pour la session (créé après le premier geste, avec gain). La musique de l'intro doit se brancher sur ce même contexte plutôt qu'en ouvrir un second.
- **Onglet masqué** : baisser le gain à 0 sur `visibilitychange` (ou `ctx.suspend()`), le remonter au retour.

## Ce qui reste à décider dans #58

- La piste, à l'oreille (piste 1 ou 2 d'abord).
- Le point de départ de la boucle et sa longueur, calés sur la durée du zoom.
- Le comportement après l'intro : boucle dans l'habitacle ou fondu vers le silence.
