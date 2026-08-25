/* LES PISTES D'UN MIX — ticket #33, 7e retour de gate (« tourner la
   molette pour baisser le son ») : le protocole de l'iframe Spotify n'a
   AUCUNE commande volume (énum vérifiée des deux côtés, wrapper et page
   embed — play/pause/resume/toggle/seek/ack/fullscreen, c'est tout). Le
   son passe donc par un moteur À NOUS : cette route lit, CÔTÉ SERVEUR,
   la page embed publique du mix et en tire les préversions MP3 servies
   par le CDN de Spotify (p.scdn.co, CORS ouvert — vérifié) ; le client
   n'appelle que NOUS pour les métadonnées, et le CDN pour l'audio —
   après le clic de façade, comme avant (doctrine RGPD des #18/#33).

   Fragile par nature (le JSON __NEXT_DATA__ de la page embed n'est pas
   un contrat) : toute défaillance rend { pistes: [] } et le client
   affiche le repli « écran custom qui linke » — jamais une erreur. */

/* les QUATRE mixes du poste, et rien d'autre (revue : un id libre fait
   du serveur un proxy de scraping Spotify — cache non borné, IP à
   bannir) — à garder en phase avec PLAYLISTS de components/gt86/ecran.ts */
const MIXES = new Set([
  "37i9dQZF1E4vFjPhXGCpFQ",
  "37i9dQZF1EIdXhbTpFjYwG",
  "37i9dQZF1E4ytDbsAetara",
  "37i9dQZF1E4wUbdv72Tm7c",
])

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!MIXES.has(id)) return Response.json({ pistes: [] }, { status: 400 })
  try {
    const page = await fetch(`https://open.spotify.com/embed/playlist/${id}`, {
      headers: { "user-agent": "Mozilla/5.0 (portfolio hugojuskowiak.com)" },
      next: { revalidate: 3600 },
      /* un réseau qui BLOQUE (DROP silencieux) suspendait la route ~300 s
         (revue) : au-delà de 8 s on rend le repli */
      signal: AbortSignal.timeout(8000),
    })
    if (!page.ok) throw new Error(String(page.status))
    const html = await page.text()
    const brut = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!brut) throw new Error("pas de __NEXT_DATA__")
    type Entree = {
      title?: string
      subtitle?: string
      isPlayable?: boolean
      audioPreview?: { url?: string } | null
    }
    const liste: Entree[] =
      JSON.parse(brut[1])?.props?.pageProps?.state?.data?.entity?.trackList ?? []
    const pistes = liste
      .filter((p) => p.isPlayable && p.audioPreview?.url?.startsWith("https://p.scdn.co/"))
      .map((p) => ({ titre: p.title ?? "", artiste: p.subtitle ?? "", apercu: p.audioPreview!.url! }))
    return Response.json({ pistes })
  } catch {
    return Response.json({ pistes: [] }, { status: 502 })
  }
}
