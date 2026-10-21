import type { Metadata, Viewport } from "next"
import { PALETTES, PALETTE_PAR_DEFAUT } from "@/components/mobile-ab/palettes"

export const metadata: Metadata = { title: "Palettes · revue" }
export const viewport: Viewport = { width: "device-width", initialScale: 1 }

const THEMES = [
  { theme: "light", nom: "clair" },
  { theme: "dark", nom: "sombre" },
] as const
const LARGEUR_ECRAN = 390
const HAUTEUR_ECRAN = 844

/* Planche de revue : l'accueil de la fusion dans chaque palette, en
   écran de téléphone 390 x 844, clair en haut, sombre en bas. Défiler
   à l'horizontale pour comparer. */
export default function Page() {
  return (
    <main style={{ minHeight: "100svh", padding: "20px 16px", background: "#1b1b1f", color: "#ececf0", fontFamily: "var(--f-mono), monospace", fontSize: 12, overflowX: "auto" }}>
      {THEMES.map(({ theme, nom }) => (
        <section key={theme} style={{ display: "flex", gap: 20, marginBottom: 28, width: "max-content" }}>
          {PALETTES.map((palette) => (
            <figure key={palette} style={{ margin: 0, display: "grid", gap: 8 }}>
              <figcaption>
                {palette} · {nom}
                {palette === PALETTE_PAR_DEFAUT && " · défaut"}
              </figcaption>
              <iframe
                title={`Accueil ${palette} ${nom}`}
                src={`/da/m/ab?palette=${palette}&theme=${theme}`}
                width={LARGEUR_ECRAN}
                height={HAUTEUR_ECRAN}
                loading="lazy"
                style={{ border: "1px solid #3a3a42", borderRadius: 24, background: "#000" }}
              />
            </figure>
          ))}
        </section>
      ))}
    </main>
  )
}
