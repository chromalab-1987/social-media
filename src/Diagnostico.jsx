/* ─────────────────────────────────────────────────────────────────
   src/Diagnostico.jsx — Pantalla de diagnóstico estratégico (Fase 1)
   Lee el perfil del wizard, consulta la matriz etapa × objetivo,
   dispara la repregunta si existe, ofrece la redirección a un clic
   y cierra el perfil con su embudo asignado. Nunca bloquea.
   ───────────────────────────────────────────────────────────────── */
import { useState } from "react";
import {
  ETAPAS, OBJETIVOS_NEGOCIO, EMBUDOS,
  evaluarDiagnostico, resolverRepregunta,
} from "./strategy.js";
import { PERFIL_KEY } from "./Wizard.jsx";

/* Tema — espejo del objeto C de App.jsx */
const C = {
  bg: "#0C0C0F", surface: "#13131A", surf2: "#1A1A24", surf3: "#22222E",
  border: "#2C2C3C", text: "#F2EDE4", muted: "#6B6B80",
  accent: "#7B35D4", accentLt: "#9F5FF0", accentDim: "#7B35D433",
  teal: "#2A9D8F", amber: "#E9C46A", red: "#E63946",
};
const FONT = "Georgia,serif";

const ESTADO_UI = {
  coherente:   { color: C.teal,  label: "Objetivo coherente" },
  alerta:      { color: C.amber, label: "Atención" },
  incoherente: { color: C.red,   label: "Incoherencia detectada" },
};

const labelDe = (list, key) => list.find((o) => o.key === key)?.label || key;

/* Pilares del embudo → pilares del form existente (para pre-selección) */
const PILAR_FORM = {
  "Educativo": "Educativo", "Prueba social": "UGC", "Oferta": "Promocional",
  "Oferta de lanzamiento": "Promocional", "Oferta de retorno": "Promocional",
  "Detrás de escena": "Behind the scenes", "Comunidad": "UGC",
  "Expectativa": "Inspiracional", "Historia de marca": "Inspiracional",
  "Autoridad": "Educativo", "Lead magnet": "Promocional", "Recompra": "Promocional",
  "Contenido exclusivo": "Behind the scenes", "Novedad": "Promocional",
  "Entretenimiento": "Entretenimiento", "Diferencial": "Promocional",
  "Awareness segmento nuevo": "Inspiracional",
};
export const pilaresFormDe = (embudoKey) => {
  const pilares = EMBUDOS[embudoKey]?.pilares || [];
  return [...new Set(pilares.map((p) => PILAR_FORM[p]).filter(Boolean))];
};

function Card({ children, borderColor }) {
  return (
    <div style={{
      background: C.surf2, border: `1px solid ${borderColor || C.border}`,
      borderRadius: 12, padding: "18px 20px",
    }}>{children}</div>
  );
}

function Btn({ onClick, children, primary, quiet }) {
  return (
    <button onClick={onClick} style={{
      background: primary ? C.accent : "transparent",
      border: primary ? "none" : `1px solid ${quiet ? "transparent" : C.border}`,
      borderRadius: 100, color: primary ? C.text : C.muted,
      fontSize: 13, padding: "11px 22px", cursor: "pointer", fontFamily: FONT,
      textDecoration: quiet ? "underline" : "none",
    }}>{children}</button>
  );
}

export default function Diagnostico({ perfil, onFinish }) {
  const inicial = evaluarDiagnostico(perfil.etapa, perfil.objetivoNegocio);
  const [diag, setDiag] = useState(inicial);
  /* fase: "lectura" → (repregunta) → "resuelto" */
  const [fase, setFase] = useState("lectura");

  const ui = ESTADO_UI[diag.estado];
  const embudo = diag.embudo ? EMBUDOS[diag.embudo] : null;
  const encadenado = diag.encadenado?.map((k) => EMBUDOS[k]).filter(Boolean);
  const tieneRepregunta = !!diag.repregunta && !diag.repreguntaResuelta && !diag.redirigidoDesde;
  const esperaDecision = fase === "lectura" && (tieneRepregunta || (diag.estado === "incoherente" && diag.redireccion));

  const responderRepregunta = (idx) => {
    setDiag((d) => resolverRepregunta(d, idx));
    setFase("resuelto");
  };

  const aceptarRedireccion = () => {
    const nuevo = evaluarDiagnostico(diag.etapa, diag.redireccion);
    setDiag({ ...nuevo, redirigidoDesde: diag.objetivo });
    setFase("resuelto");
  };

  const mantenerObjetivo = () => setFase("resuelto");

  const continuar = () => {
    const diagnosticoFinal = { ...diag };
    const perfilFinal = {
      ...perfil,
      objetivoNegocio: diag.objetivo,
      objetivoSecundario: diag.objetivoSecundario || perfil.objetivoSecundario,
      diagnostico: diagnosticoFinal,
    };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfilFinal));

    /* Enriquecimiento para el form/prompt existente, sin tocar buildWeekPrompt */
    const extra = {};
    if (embudo) {
      extra.pilares = pilaresFormDe(diag.embudo);
      extra.objetivoExtra = `Enfoque del plan: ${embudo.nombre}. Pilares estratégicos: ${embudo.pilares.join(", ")}.`;
    }
    if (encadenado?.length) {
      extra.objetivoExtra = `Plan en dos tiempos: ${encadenado.map((e) => e.nombre).join(" → ")}.`;
    }
    onFinish(perfilFinal, extra);
  };

  const embudoFinalKey = diag.embudo;
  const puedeContinuar = !esperaDecision;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 28 }}>
          Diagnóstico estratégico
        </div>

        {/* Estado + lectura */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-block", background: `${ui.color}22`, border: `1px solid ${ui.color}66`,
            color: ui.color, fontSize: 12, padding: "5px 14px", borderRadius: 100,
          }}>{ui.label}</span>
          {diag.matchIdeal && (
            <span style={{
              display: "inline-block", background: C.accentDim, border: `1px solid ${C.accent}40`,
              color: C.accentLt, fontSize: 12, padding: "5px 14px", borderRadius: 100,
            }}>✦ Match ideal para tu etapa</span>
          )}
        </div>

        <h1 style={{ fontSize: "clamp(20px,4vw,28px)", fontWeight: 400, letterSpacing: "-0.02em", margin: "0 0 10px", lineHeight: 1.25 }}>
          {labelDe(OBJETIVOS_NEGOCIO, diag.objetivo)}
        </h1>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 22px" }}>
          Etapa: {labelDe(ETAPAS, diag.etapa)}
        </p>

        <Card borderColor={`${ui.color}44`}>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{diag.lectura}</p>
        </Card>

        {/* Aviso de redirección aplicada */}
        {diag.redirigidoDesde && (
          <div style={{ marginTop: 14, fontSize: 13, color: C.muted }}>
            ↻ Ajustamos el foco: {labelDe(OBJETIVOS_NEGOCIO, diag.redirigidoDesde)} → <span style={{ color: C.accentLt }}>{labelDe(OBJETIVOS_NEGOCIO, diag.objetivo)}</span>
          </div>
        )}

        {/* Repregunta */}
        {esperaDecision && tieneRepregunta && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 15, margin: "0 0 14px" }}>{diag.repregunta.texto}</p>
            <div style={{ display: "grid", gap: 8 }}>
              {diag.repregunta.opciones.map((op, i) => (
                <button key={i} onClick={() => responderRepregunta(i)} style={{
                  display: "block", width: "100%", textAlign: "left", boxSizing: "border-box",
                  background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 10,
                  color: C.text, fontSize: 14, padding: "14px 16px", cursor: "pointer", fontFamily: FONT,
                }}>{op.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Redirección de celda incoherente (sin repregunta) */}
        {esperaDecision && !tieneRepregunta && diag.estado === "incoherente" && (
          <div style={{ marginTop: 24 }}>
            <Card borderColor={`${C.accent}55`}>
              <p style={{ fontSize: 12, color: C.muted, margin: "0 0 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Sugerencia del sistema</p>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 16px" }}>
                Armar el plan con foco en <span style={{ color: C.accentLt }}>{labelDe(OBJETIVOS_NEGOCIO, diag.redireccion).toLowerCase()}</span>.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn primary onClick={aceptarRedireccion}>Aceptar sugerencia →</Btn>
                <Btn quiet onClick={mantenerObjetivo}>Mantener mi objetivo igual</Btn>
              </div>
            </Card>
          </div>
        )}

        {/* Resultado final: embudo asignado */}
        {puedeContinuar && (
          <div style={{ marginTop: 24 }}>
            {embudo && (
              <Card>
                <p style={{ fontSize: 12, color: C.muted, margin: "0 0 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Enfoque del plan</p>
                <p style={{ fontSize: 16, margin: "0 0 10px" }}>{embudo.nombre}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {embudo.pilares.map((p) => (
                    <span key={p} style={{
                      border: `1px solid ${C.border}`, borderRadius: 100, color: C.muted,
                      fontSize: 12, padding: "5px 12px",
                    }}>{p}</span>
                  ))}
                </div>
              </Card>
            )}
            {encadenado?.length > 0 && (
              <Card>
                <p style={{ fontSize: 12, color: C.muted, margin: "0 0 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Plan en dos tiempos</p>
                <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  {encadenado.map((e) => e.nombre).join(" → ")}
                </p>
              </Card>
            )}
            {!embudo && !encadenado?.length && (
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                Mantenés tu objetivo original. El plan se arma con ese foco, con la advertencia registrada.
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <Btn primary onClick={continuar}>Continuar →</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
