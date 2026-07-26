/* ─────────────────────────────────────────────────────────────────
   src/Planes.jsx — Pantalla de planes / upgrade
   Aparece al chocar un muro (crear marca de más, o generar en free)
   o desde el menú. Muestra los 4 planes con precio USD. El botón de
   pago queda inerte hasta la Pieza 3 (Mercado Pago).
   ───────────────────────────────────────────────────────────────── */
import { PLANES, PLANES_PAGOS, planEfectivo, planSugerido } from "./planes.js";

const C = {
  bg: "#0C0C0F", surf2: "#1A1A24", surf3: "#22222E", border: "#2C2C3C",
  text: "#F2EDE4", muted: "#6B6B80", accent: "#7B35D4", accentLt: "#9F5FF0",
  accentDim: "#7B35D433", teal: "#2A9D8F",
};
const FONT = "Georgia,serif";

/* Motivo del muro → encabezado contextual */
const MOTIVOS = {
  produccion: {
    titulo: "Para generar el contenido, elegí un plan",
    sub: "El diagnóstico y la síntesis son gratis. La producción — redes, WhatsApp, email, artículos y pauta — viene con los planes de pago.",
  },
  marcas: {
    titulo: "Llegaste al límite de marcas de tu plan",
    sub: "Para sumar otra marca a tu cartera, pasá a un plan con más lugar.",
  },
  ver: {
    titulo: "Planes de Chroma Estrategia",
    sub: "Precios en dólares. Se cobran en pesos al cambio del día.",
  },
};

export default function Planes({ suscripcion, motivo = "ver", marcasActuales = 0, onElegir, onVolver }) {
  const actual = planEfectivo(suscripcion);
  const sugerido = motivo !== "ver" ? planSugerido(suscripcion, motivo, marcasActuales) : null;
  const enc = MOTIVOS[motivo] || MOTIVOS.ver;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "44px 24px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Planes
          </div>
          {onVolver && (
            <button onClick={onVolver} style={{
              background: "transparent", border: "none", color: C.muted,
              fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline",
            }}>← Volver</button>
          )}
        </div>

        <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 400, letterSpacing: "-0.02em", margin: "0 0 10px", lineHeight: 1.2 }}>
          {enc.titulo}
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: "0 0 8px", maxWidth: "60ch", lineHeight: 1.6 }}>{enc.sub}</p>
        <p style={{ fontSize: 12, color: C.muted, margin: "0 0 32px" }}>
          Tu plan actual: <span style={{ color: C.accentLt }}>{actual.nombre}</span>
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16 }}>
          {PLANES_PAGOS.map((key) => {
            const p = PLANES[key];
            const esActual = actual.key === key;
            const esSugerido = sugerido?.key === key;
            return (
              <div key={key} style={{
                background: C.surf2,
                border: `1px solid ${esSugerido ? C.accent : C.border}`,
                borderRadius: 16, padding: "22px 20px",
                display: "flex", flexDirection: "column",
                position: "relative",
                boxShadow: esSugerido ? `0 0 0 1px ${C.accent}` : "none",
              }}>
                {esSugerido && (
                  <div style={{
                    position: "absolute", top: -10, left: 20,
                    background: C.accent, color: C.text, fontSize: 11,
                    padding: "3px 12px", borderRadius: 100,
                  }}>Recomendado</div>
                )}
                <div style={{ fontSize: 17, marginBottom: 4 }}>{p.nombre}</div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 30, color: C.text }}>US${p.precioUSD}</span>
                  <span style={{ fontSize: 13, color: C.muted }}> /mes</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.5, minHeight: 34 }}>
                  {p.marcas} {p.marcas === 1 ? "marca" : "marcas"}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", flex: 1 }}>
                  {p.incluye.map((it, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: C.text, marginBottom: 7, lineHeight: 1.5, display: "flex", gap: 7 }}>
                      <span style={{ color: C.teal, flexShrink: 0 }}>✓</span>{it}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => !esActual && onElegir(key)}
                  disabled={esActual}
                  style={{
                    background: esActual ? C.surf3 : (esSugerido ? C.accent : "transparent"),
                    border: esActual ? "none" : `1px solid ${esSugerido ? C.accent : C.border}`,
                    borderRadius: 100, color: esActual ? C.muted : C.text,
                    fontSize: 13, padding: "11px 18px",
                    cursor: esActual ? "default" : "pointer", fontFamily: FONT,
                  }}>
                  {esActual ? "Tu plan actual" : "Elegir plan →"}
                </button>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 12, color: C.muted, margin: "28px 0 0", lineHeight: 1.6, maxWidth: "62ch" }}>
          El plan Gratis te deja usar el diagnóstico y la síntesis estratégica de 1 marca, sin generar contenido.
          ¿Necesitás cobrar desde el exterior o tenés dudas? Escribinos y lo resolvemos.
        </p>
      </div>
    </div>
  );
}
