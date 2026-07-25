/* ─────────────────────────────────────────────────────────────────
   src/Login.jsx — Pantalla de acceso (pantalla 1 del mapa)
   Google OAuth vía Supabase, o continuar sin cuenta (modo local).
   ───────────────────────────────────────────────────────────────── */
import { loginConGoogle } from "./supabase.js";

const C = {
  bg: "#0C0C0F", surf2: "#1A1A24", border: "#2C2C3C",
  text: "#F2EDE4", muted: "#6B6B80", accent: "#7B35D4", accentLt: "#9F5FF0",
  accentDim: "#7B35D433",
};
const FONT = "Georgia,serif";

export default function Login({ onLocal }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: C.accentDim, border: `1px solid ${C.accent}40`, color: C.accentLt, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 100, marginBottom: 20 }}>
          Chroma · Estrategia
        </div>
        <h1 style={{ fontSize: "clamp(24px,5vw,34px)", fontWeight: 400, letterSpacing: "-0.02em", margin: "0 0 10px", lineHeight: 1.2 }}>
          Tu cartera de clientes,<br />una estrategia por vez.
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: "0 0 32px", lineHeight: 1.7 }}>
          Iniciá sesión para guardar perfiles, planes y kits de todos tus clientes en la nube.
        </p>

        <button onClick={loginConGoogle} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", boxSizing: "border-box", background: C.text, border: "none",
          borderRadius: 100, color: "#111", fontSize: 15, padding: "14px 20px",
          cursor: "pointer", fontFamily: FONT, marginBottom: 14,
        }}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>

        <button onClick={onLocal} style={{
          background: "transparent", border: "none", color: C.muted,
          fontSize: 13, cursor: "pointer", fontFamily: FONT, textDecoration: "underline",
        }}>
          Continuar sin cuenta (solo este navegador)
        </button>
      </div>
    </div>
  );
}
