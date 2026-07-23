/* ─────────────────────────────────────────────────────────────────
   src/PlanProduccion.jsx — Hub del plan de producción (pantalla 8)
   Módulos de producción por canal, ordenados según los canales
   priorizados de la síntesis. RRSS rutea al generador existente;
   WhatsApp al kit; Email y Artículos quedan anunciados (fases
   siguientes). Sin llamadas a IA: puro ruteo.
   ───────────────────────────────────────────────────────────────── */
import { CANALES } from "./strategy.js";

const C = {
  bg: "#0C0C0F", surface: "#13131A", surf2: "#1A1A24", surf3: "#22222E",
  border: "#2C2C3C", text: "#F2EDE4", muted: "#6B6B80",
  accent: "#7B35D4", accentLt: "#9F5FF0", accentDim: "#7B35D433",
  teal: "#2A9D8F",
};
const FONT = "Georgia,serif";
const labelDe = (key) => CANALES.find((o) => o.key === key)?.label || key;

/* Qué módulo cubre cada canal del perfil */
const MODULO_POR_CANAL = {
  instagram: "rrss", tiktok: "rrss", facebook: "rrss", linkedin: "rrss", youtube: "rrss",
  whatsapp: "whatsapp",
  email: "email",
  google: "articulos",
};

const MODULOS = [
  { key: "rrss", nombre: "Redes sociales", icono: "◈",
    desc: "Calendario mensual de posts, historias y reels con copys, flyers y videos.",
    activo: true },
  { key: "whatsapp", nombre: "Kit de WhatsApp", icono: "✆",
    desc: "6 mensajes con disparadores y timing: del primer contacto a la reactivación.",
    activo: true },
  { key: "email", nombre: "Secuencias de email", icono: "✉",
    desc: "Correos con asunto y cuerpo + workflow de envío por días.",
    activo: true },
  { key: "articulos", nombre: "Artículos / SEO", icono: "¶",
    desc: "Plan de artículos con keyword objetivo, título y estructura.",
    activo: true },
  { key: "pauta", nombre: "Pauta en redes", icono: "◎",
    desc: "Campaña lista para cargar en Ads Manager: estructura, segmentación, presupuesto y anuncios.",
    activo: true },
];

export default function PlanProduccion({ perfil, onAbrir }) {
  /* Canales que cada módulo cubre, cruzados con los priorizados de la síntesis */
  const priorizados = perfil?.sintesis?.canalesPriorizados || [];
  const modulosPriorizados = new Set(
    priorizados.map((c) => MODULO_POR_CANAL[c.canal]).filter(Boolean)
  );
  const canalesDeModulo = (modKey) =>
    priorizados.filter((c) => MODULO_POR_CANAL[c.canal] === modKey)
      .map((c) => labelDe(c.canal));

  const ordenados = [...MODULOS].sort((a, b) =>
    (modulosPriorizados.has(b.key) ? 1 : 0) - (modulosPriorizados.has(a.key) ? 1 : 0)
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          Plan de producción · {perfil?.negocio}
        </div>
        <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 400, letterSpacing: "-0.02em", margin: "0 0 8px", lineHeight: 1.2 }}>
          ¿Qué generamos?
        </h1>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 28px", lineHeight: 1.6 }}>
          Cada módulo usa tu estrategia aprobada. Los priorizados salen primero.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          {ordenados.map((mod) => {
            const prio = modulosPriorizados.has(mod.key);
            const canales = canalesDeModulo(mod.key);
            const generado =
              (mod.key === "whatsapp" && perfil?.whatsappKit) ||
              (mod.key === "email" && perfil?.emailSecuencia) ||
              (mod.key === "articulos" && perfil?.articulosPlan) ||
              (mod.key === "pauta" && perfil?.pautaPlan);
            return (
              <button key={mod.key}
                onClick={() => mod.activo && onAbrir(mod.key)}
                disabled={!mod.activo}
                style={{
                  display: "block", width: "100%", textAlign: "left", boxSizing: "border-box",
                  background: C.surf2,
                  border: `1px solid ${prio ? C.accent + "66" : C.border}`,
                  borderRadius: 12, padding: "18px 20px",
                  cursor: mod.activo ? "pointer" : "default",
                  opacity: mod.activo ? 1 : 0.55, fontFamily: FONT, color: C.text,
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
                  <span style={{ fontSize: 15 }}>
                    <span style={{ color: C.accentLt, marginRight: 8 }}>{mod.icono}</span>{mod.nombre}
                  </span>
                  <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {prio && (
                      <span style={{ fontSize: 11, background: C.accentDim, border: `1px solid ${C.accent}40`, color: C.accentLt, padding: "3px 10px", borderRadius: 100 }}>
                        Priorizado{canales.length ? `: ${canales.join(", ")}` : ""}
                      </span>
                    )}
                    {generado && (
                      <span style={{ fontSize: 11, border: `1px solid ${C.teal}66`, color: C.teal, padding: "3px 10px", borderRadius: 100 }}>✓ Generado</span>
                    )}
                    {!mod.activo && (
                      <span style={{ fontSize: 11, border: `1px solid ${C.border}`, color: C.muted, padding: "3px 10px", borderRadius: 100 }}>Próximamente</span>
                    )}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.55 }}>{mod.desc}</p>
                {mod.activo && (
                  <p style={{ fontSize: 13, color: C.accentLt, margin: "10px 0 0" }}>
                    {generado ? "Ver / editar →" : mod.key === "rrss" ? "Abrir generador →" : "Generar →"}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
