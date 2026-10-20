/* UN SEUL AudioContext pour la session (revue adversariale : un contexte
   par visite fuyait, jamais fermé, chacun retenant son <audio> ; et
   Safari plafonne les contextes simultanés). Les nœuds, eux, vivent par
   montage et se déconnectent au démontage.
   Module sans React ni three : le menu Need for Speed le partage aussi
   avec la version sans 3D. */
let ctxAudio: AudioContext | null = null

export const contexteAudio = () => (ctxAudio ??= new AudioContext())

/* le contexte s'il joue déjà, sinon rien : un survol n'est pas un geste,
   y créer un contexte le laisserait suspendu avec un avertissement */
export const contexteActif = () => (ctxAudio?.state === "running" ? ctxAudio : null)
