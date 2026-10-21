import type { Metadata, Viewport } from "next"
import { APPS, FAMILLES, type NomFamille } from "@/components/mobile-ab/icones"

export const metadata: Metadata = { title: "Icônes · revue" }
export const viewport: Viewport = { width: "device-width", initialScale: 1 }

const TITRES: Record<NomFamille, string> = {
  chrome: "Chrome Y2K · クローム",
  pixel: "PS1 / 95 · ピクセル",
  garage: "Garage S13 · ガレージ",
}

const DOCK: (typeof APPS)[number][] = ["accueil", "projets", "contact", "radio"]
const TAILLE_GRILLE = 60
const TAILLE_DOCK = 28

/* Planche de revue : chaque famille en grille à 60 px et en dock à 28 px,
   sur fond sombre puis clair. Le thème passe par `color-scheme`, que les
   tuiles lisent avec `light-dark()`. */
export default function Page() {
  return (
    <main style={{ display: "grid", fontFamily: "var(--f-mono), monospace", fontSize: 10 }}>
      {(["dark", "light"] as const).map((theme) => (
        <section key={theme} style={{ colorScheme: theme, background: "light-dark(#f4f2ee, #08070f)", color: "light-dark(#14121a, #ece9f2)", padding: "20px 16px" }}>
          {(Object.keys(FAMILLES) as NomFamille[]).map((nom) => {
            const famille = FAMILLES[nom]
            return (
              <div key={nom} style={{ marginBottom: 22 }}>
                <h2 style={{ fontFamily: "var(--f-vitesse), sans-serif", fontStyle: "italic", fontWeight: 800, fontSize: 18, margin: "0 0 10px", borderLeft: "4px solid #e561d3", paddingLeft: 8 }}>{TITRES[nom]}</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px 6px", justifyItems: "center" }}>
                  {APPS.map((app) => {
                    const Icone = famille[app]
                    return (
                      <figure key={app} style={{ margin: 0, display: "grid", justifyItems: "center", gap: 4 }}>
                        <Icone size={TAILLE_GRILLE} />
                        <figcaption>{app}</figcaption>
                      </figure>
                    )
                  })}
                  <div style={{ gridColumn: "span 2", alignSelf: "center", display: "flex", gap: 10, padding: 8, borderRadius: 18, background: "light-dark(rgb(0 0 0 / .06), rgb(255 255 255 / .06))" }}>
                    {DOCK.map((app) => {
                      const Icone = famille[app]
                      return <Icone key={app} size={TAILLE_DOCK} />
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      ))}
    </main>
  )
}
