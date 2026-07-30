/* ─────────────────────────────────────────────────────────────────
   src/AdminPanel.jsx — Activación manual de planes (cobros PayPal)
   Visible solo para el admin. Llama a /api/admin-suscripcion con el
   token de sesión; el backend revalida que sea el admin.
   ───────────────────────────────────────────────────────────────── */
import { useState } from "react";
import { PLANES, PLANES_PAGOS } from "./planes.js";
import { getAccessToken } from "./supabase.js";

const C = {
  bg: "#0C0C0F", surf2: "#1A1A24", surf3: "#22222E", border: "#2C2C3C",
  text: "#F2EDE4", muted: "#6B6B80", accent: "#7B35D4", accentLt: "#9F5FF0",
  teal: "#2A9D8F", amber: "#E9C46A",
};
const FONT = "Georgia,serif";
const inputStyle = {
  width: "100%", boxSizing: "border-box", background: C.surf2,
  border: `1px solid ${C.border}`, borderRadius: 10, color: C.text,
  fontSize: 14, padding: "12px 14px", fontFamily: FONT, outline: "none",
};

export default function AdminPanel({ onVolver }) {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("empresa");
  const [meses, setMeses] = useState(1);
  const [msg, setMsg] = useState(null);
  const [cargando, setCargando] = useState(false);

  const llamar = async (accion) => {
    setCargando(true); setMsg(null);
    try {
      const token = await getAccessToken();
      const r = await fetch("/api/admin-suscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim(), plan, meses: Number(meses), accion }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setMsg({ ok: true, txt: d.msg });
    } catch (e) {
      setMsg({ ok: false, txt: e.message });
    }
    setCargando(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Admin · activación manual
          </div>
          <button onClick={onVolver} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline" }}>← Volver</button>
        </div>

        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px", lineHeight: 1.6 }}>
          Para activar un plan tras un pago por PayPal u otro medio. El usuario ya tiene que haber entrado al menos una vez con Google.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Email del cliente</label>
            <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Plan</label>
            <select style={inputStyle} value={plan} onChange={(e) => setPlan(e.target.value)}>
              {PLANES_PAGOS.map((k) => (
                <option key={k} value={k}>{PLANES[k].nombre} — US${PLANES[k].precioUSD}/mes</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Meses a activar</label>
            <input type="number" min="1" style={inputStyle} value={meses} onChange={(e) => setMeses(e.target.value)} />
          </div>

          {msg && (
            <div style={{ background: C.surf2, border: `1px solid ${msg.ok ? C.teal : C.amber}66`, borderRadius: 10, padding: "12px 16px", fontSize: 13 }}>
              {msg.ok ? "✓ " : "✗ "}{msg.txt}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => llamar("activar")} disabled={cargando || !email} style={{
              flex: 1, background: C.accent, border: "none", borderRadius: 100, color: C.text,
              fontSize: 13, padding: "12px 18px", cursor: cargando ? "default" : "pointer", fontFamily: FONT,
            }}>{cargando ? "…" : "Activar plan"}</button>
            <button onClick={() => llamar("baja")} disabled={cargando || !email} style={{
              background: "transparent", border: `1px solid ${C.border}`, borderRadius: 100, color: C.muted,
              fontSize: 13, padding: "12px 18px", cursor: cargando ? "default" : "pointer", fontFamily: FONT,
            }}>Dar de baja</button>
          </div>
          <button onClick={() => llamar("liberar_cupo")} disabled={cargando || !email} style={{
            background: "transparent", border: `1px solid ${C.teal}66`, borderRadius: 100, color: C.teal,
            fontSize: 13, padding: "11px 18px", cursor: cargando ? "default" : "pointer", fontFamily: FONT, marginTop: 4,
          }}>Liberar cupos del ciclo (por error del cliente)</button>
        </div>
      </div>
    </div>
  );
}
