/* ─────────────────────────────────────────────────────────────────
   src/MesesPlan.jsx — Meses planificados de un cliente (multi-mes)
   Lista los meses guardados en `estrategias` para el cliente actual.
   Pasado = solo lectura. Actual/futuro = editable. Techo de 6 meses
   visibles/planificables por cliente.
   ───────────────────────────────────────────────────────────────── */
import { useState, useEffect } from "react";
import { fetchMesesEstrategia } from "./supabase.js";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const parseMonthStart = (mesStr) => {
  const [mesNombre, año] = (mesStr || "").split(" ");
  const idx = MESES.indexOf(mesNombre);
  if (idx < 0 || !año) return null;
  return new Date(parseInt(año), idx, 1);
};
const TOPE_MESES = 6;

const C = {
  bg: "#0C0C0F", surf2: "#1A1A24", surf3: "#22222E", border: "#2C2C3C",
  text: "#F2EDE4", muted: "#6B6B80", accent: "#7B35D4", accentLt: "#9F5FF0",
  accentDim: "#7B35D433", teal: "#2A9D8F", amber: "#E9C46A",
};
const FONT = "Georgia,serif";

export default function MesesPlan({ cliente, onAbrirMes, onNuevoMes, onVolver }) {
  const [meses, setMeses] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try { setMeses(await fetchMesesEstrategia(cliente.id)); }
      catch (e) { setError("No pudimos cargar los meses. " + e.message); setMeses([]); }
    })();
  }, [cliente.id]);

  const hoyInicio = (() => { const h = new Date(); return new Date(h.getFullYear(), h.getMonth(), 1); })();

  const estadoDe = (mesStr) => {
    const d = parseMonthStart(mesStr);
    if (!d) return "actual";
    if (d.getTime() < hoyInicio.getTime()) return "pasado";
    if (d.getTime() === hoyInicio.getTime()) return "actual";
    return "futuro";
  };

  const alTope = meses !== null && meses.length >= TOPE_MESES;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Meses planificados · {cliente.nombre}
          </div>
          <button onClick={onVolver} style={{
            background: "transparent", border: "none", color: C.muted,
            fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline",
          }}>← Plan</button>
        </div>
        <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 400, letterSpacing: "-0.02em", margin: "0 0 8px", lineHeight: 1.2 }}>
          ¿Qué mes revisamos?
        </h1>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 28px", lineHeight: 1.6 }}>
          Los meses pasados quedan como archivo, de solo lectura. Se conservan hasta {TOPE_MESES} meses por cliente.
        </p>

        {error && (
          <div style={{ background: C.surf2, border: `1px solid ${C.amber}66`, borderRadius: 10, padding: "12px 16px", fontSize: 13, marginBottom: 14 }}>{error}</div>
        )}

        {meses === null && <p style={{ fontSize: 14, color: C.muted }}>✦ Cargando…</p>}

        {meses !== null && (
          <div style={{ display: "grid", gap: 10 }}>
            {meses.map((m) => {
              const est = estadoDe(m.mes);
              const badge = est === "pasado"
                ? { txt: "Solo lectura", color: C.muted }
                : est === "actual"
                ? { txt: "Mes actual", color: C.teal }
                : { txt: "Planificado", color: C.accentLt };
              return (
                <button key={m.mes} onClick={() => onAbrirMes(m.mes, est === "pasado")}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    width: "100%", textAlign: "left", boxSizing: "border-box",
                    background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 12,
                    padding: "16px 18px", cursor: "pointer", fontFamily: FONT, color: C.text,
                  }}>
                  <div>
                    <p style={{ fontSize: 15, margin: "0 0 3px" }}>{m.mes}</p>
                    <p style={{ fontSize: 11, color: badge.color, margin: 0 }}>{badge.txt}</p>
                  </div>
                  <span style={{ fontSize: 13, color: C.accentLt }}>
                    {est === "pasado" ? "Ver →" : "Ver / editar →"}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => alTope ? null : onNuevoMes()}
              disabled={alTope}
              style={{
                background: "transparent",
                border: `1px dashed ${alTope ? C.border : C.accent}66`,
                borderRadius: 12, color: alTope ? C.muted : C.accentLt,
                fontSize: 14, padding: "16px 18px", cursor: alTope ? "default" : "pointer",
                fontFamily: FONT, textAlign: "center", opacity: alTope ? 0.6 : 1,
              }}>
              {alTope ? `Llegaste al máximo de ${TOPE_MESES} meses por cliente` : "+ Planificar otro mes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
