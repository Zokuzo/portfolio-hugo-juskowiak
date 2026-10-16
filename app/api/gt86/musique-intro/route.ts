import { entiteEmbed, estPreversion } from "../embed-spotify"

/* LA MUSIQUE DE L'INTRO (#58) : renvoie vers la préversion VIVANTE de
   « VISION (Slowed) ». Le lien p.scdn.co n'est pas un contrat, la page
   embed de la piste le redonne à jour ; le client ne parle qu'à nous,
   l'audio vient du CDN (CORS ouvert), après le clic de décollage. */
const PISTE = "7fx9paDdMEk5xrF5yVWUfW"
/* relevée le 2026-10-16 : le repli si la page embed ne répond plus */
const PREVERSION_CONNUE = "https://p.scdn.co/mp3-preview/7fb250cd985d7beeaad88f05390d59a123fb6da3"
/* le vol dure 4,6 s et le client attend cette redirection pour jouer :
   au-delà, mieux vaut la préversion connue qu'une chute muette */
const DELAI_EMBED_MS = 1500

export async function GET() {
  try {
    const url = (await entiteEmbed<{ audioPreview?: { url?: string } | null }>(`track/${PISTE}`, DELAI_EMBED_MS)).audioPreview?.url
    if (!estPreversion(url)) throw new Error("pas de préversion")
    return Response.redirect(url, 302)
  } catch (e) {
    console.warn("[gt86] musique de l'intro : repli sur la préversion connue", e)
    return Response.redirect(PREVERSION_CONNUE, 302)
  }
}
