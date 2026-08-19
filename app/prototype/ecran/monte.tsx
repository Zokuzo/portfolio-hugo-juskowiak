"use client"

import dynamic from "next/dynamic"

/* Le montage décidé en #17/#25 : page serveur → wrapper client →
   dynamic ssr:false. Le paquet 3D ne charge que sur cette route. */
const Scene = dynamic(() => import("./scene"), {
  ssr: false,
  loading: () => (
    <p
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "#0a0912",
        color: "#e8dff5",
        fontFamily: "var(--f-mono)",
        fontSize: 13,
        letterSpacing: "0.08em",
      }}
    >
      l&apos;écran s&apos;éveille…
    </p>
  ),
})

export default function Monte() {
  return <Scene />
}
