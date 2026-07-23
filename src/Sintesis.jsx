/* ─────────────────────────────────────────────────────────────────
   src/Sintesis.jsx — Síntesis estratégica (Fase 1, cierre)
   Única llamada a IA de la capa estratégica: genera mensaje central,
   4 ángulos de comunicación y canales priorizados (acotados a los
   marcados en el perfil). Todo editable. North star y embudo se
   muestran como tarjetas fijas (determinísticos, sin IA).
   ───────────────────────────────────────────────────────────────── */
import { useState, useEffect, useCallback } from "react";
import {
  RUBROS, ETAPAS, OBJETIVOS_NEGOCIO, OBJETIVOS_MKT, CANALES, HORIZONTES,
  BUYER_TIPOS, BUYER_MOTIVADORES, BUYER_FRENOS, EMBUDOS,
} from "./strategy.js";
import { PERFIL_KEY, mapPerfilToForm } from "./Wizard.jsx";
import { pilaresFormDe } from "./Diagnostico.jsx";

/* Tema — espejo del objeto C de App.jsx */
const C = {
  bg: "#0C0C0F", surface: "#13131A", surf2: "#1A1A24", surf3: "#22222E",
  border: "#2C2C3C", text: "#F2EDE4", muted: "#6B6B80",
  accent: "#7B35D4", accentLt: "#9F5FF0", accentDim: "#7B35D433",
  teal: "#2A9D8F", amber: "#E9C46A",
};
const FONT = "Georgia,serif";
const labelDe = (list, key) => list.find((o) => o.key === key)?.label || key || "";
const ANGULO_LABEL = { dolor: "Dolor", aspiracion: "Aspiración", prueba: "Prueba", diferencial: "Diferencial" };

/* ── API helper (mismo contrato que el resto del front) ── */
const cleanJSON = (txt) => txt.replace(/```json|```/g, "").trim();
async function callChat(prompt, maxTokens = 2500) {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }], max_tokens: maxTokens }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Error de API");
  return d.text;
}

/* ── Prompt ── */
function perfilTexto(p) {
  const d = p.diagnostico || {};
  const embudo = d.embudo ? EMBUDOS[d.embudo] : null;
  return [
    `NEGOCIO: ${p.negocio}${p.sitioWeb ? ` (${p.sitioWeb})` : ""}`,
    `RUBRO: ${p.rubro === "otro" ? p.rubroOtro : labelDe(RUBROS, p.rubro)}`,
    `ETAPA: ${labelDe(ETAPAS, p.etapa)}`,
    `OBJETIVO DE NEGOCIO: ${labelDe(OBJETIVOS_NEGOCIO, p.objetivoNegocio)}`,
    p.objetivoSecundario ? `OBJETIVO SECUNDARIO: ${labelDe(OBJETIVOS_NEGOCIO, p.objetivoSecundario)}` : "",
    `BUYER: ${p.buyer.descripcion} (${p.buyer.edad || "—"}, ${labelDe(BUYER_TIPOS, p.buyer.tipo)})`,
    `MOTIVADOR DE COMPRA: ${labelDe(BUYER_MOTIVADORES, p.buyer.motivador)}`,
    `FRENO DE COMPRA: ${labelDe(BUYER_FRENOS, p.buyer.freno)}`,
    `PROPUESTA DE VALOR: ${p.propuestaValor.frase}`,
    `OBJETIVO DE MARKETING: ${labelDe(OBJETIVOS_MKT, p.objetivoMkt.tipo)} — meta: ${p.objetivoMkt.meta} en ${p.objetivoMkt.plazo}`,
    `CANALES MARCADOS: ${p.canales.map((k) => `${k} (${labelDe(CANALES, k)})`).join(", ")}`,
    `HORIZONTE: ${labelDe(HORIZONTES, p.horizonte)}${p.fechaClave ? ` — fecha clave: ${p.fechaClave}` : ""}`,
    d.lectura ? `DIAGNÓSTICO: ${d.lectura}` : "",
    embudo ? `ENFOQUE DEL PLAN: ${embudo.nombre}. Pilares: ${embudo.pilares.join(", ")}` : "",
  ].filter(Boolean).join("\n");
}

function buildPrompt(p, seccion = "todo", anguloTipo = null) {
  const base = `Sos un estratega de marca senior. Con este perfil estratégico, generá la síntesis de estrategia.

${perfilTexto(p)}

INSTRUCCIONES:
- mensajeCentral: una frase de posicionamiento en el tono implícito del negocio, concreta, máximo 18 palabras. Prohibidos los clichés de agencia: "potenciar", "impulsar", "llevar al siguiente nivel", "soluciones integrales".
- angulos: exactamente 4, uno por tipo: dolor, aspiracion, prueba, diferencial. Cada uno con "descripcion" (1 oración sobre cómo usar ese ángulo con este buyer) y "hook" (una primera línea de post lista para usar, que suene al buyer descripto, no a un manual).
- canalesPriorizados: elegí 2 o 3 SOLO entre las keys de CANALES MARCADOS, ordenados por prioridad. "rol" es "principal" o "secundario". "razon": 1 oración basada en el buyer y el rubro.`;

  const schemas = {
    todo: `Devolvé SOLO JSON válido con esta estructura exacta:
{"mensajeCentral":"...","angulos":[{"tipo":"dolor","descripcion":"...","hook":"..."}],"canalesPriorizados":[{"canal":"key","rol":"principal","razon":"..."}]}`,
    mensaje: `Devolvé SOLO JSON válido con esta estructura exacta:
{"mensajeCentral":"..."}`,
    angulo: `Generá una versión nueva y distinta SOLO del ángulo de tipo "${anguloTipo}". Devolvé SOLO JSON válido:
{"angulo":{"tipo":"${anguloTipo}","descripcion":"...","hook":"..."}}`,
  };
  return `${base}\n\n${schemas[seccion]}`;
}

/* ── UI helpers ── */
const inputStyle = {
  width: "100%", boxSizing: "border-box", background: C.surf2,
  border: `1px solid ${C.border}`, borderRadius: 10, color: C.text,
  fontSize: 14, padding: "12px 14px", fontFamily: FONT, outline: "none", lineHeight: 1.5,
};

function Card({ children, style }) {
  return (
    <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", ...style }}>
      {children}
    </div>
  );
}
function Etiqueta({ children }) {
  return <p style={{ fontSize: 11, color: C.muted, margin: "0 0 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{children}</p>;
}
function BtnMini({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: "transparent", border: `1px solid ${C.border}`, borderRadius: 100,
      color: disabled ? C.surf3 : C.muted, fontSize: 12, padding: "5px 12px",
      cursor: disabled ? "default" : "pointer", fontFamily: FONT,
    }}>{children}</button>
  );
}

export default function Sintesis({ perfil, onFinish }) {
  const [sintesis, setSintesis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerando, setRegenerando] = useState(""); // "todo" | "mensaje" | tipo de ángulo
  const [error, setError] = useState("");

  const parse = (raw) => JSON.parse(cleanJSON(raw));

  const generar = useCallback(async () => {
    setLoading(true); setError("");
    for (let intento = 0; intento < 3; intento++) {
      try {
        const data = parse(await callChat(buildPrompt(perfil)));
        /* Sanidad mínima: canales solo entre los marcados */
        data.canalesPriorizados = (data.canalesPriorizados || []).filter((c) => perfil.canales.includes(c.canal)).slice(0, 3);
        if (!data.mensajeCentral || !Array.isArray(data.angulos) || data.angulos.length < 3) throw new Error("estructura incompleta");
        setSintesis(data);
        setLoading(false);
        return;
      } catch (e) {
        if (intento === 2) { setError("No pudimos generar la síntesis. " + e.message); setLoading(false); }
      }
    }
  }, [perfil]);

  useEffect(() => { generar(); }, [generar]);

  const regenerarMensaje = async () => {
    setRegenerando("mensaje");
    try {
      const data = parse(await callChat(buildPrompt(perfil, "mensaje"), 400));
      if (data.mensajeCentral) setSintesis((s) => ({ ...s, mensajeCentral: data.mensajeCentral }));
    } catch { /* mantiene el actual */ }
    setRegenerando("");
  };

  const regenerarAngulo = async (tipo) => {
    setRegenerando(tipo);
    try {
      const data = parse(await callChat(buildPrompt(perfil, "angulo", tipo), 500));
      if (data.angulo?.hook) setSintesis((s) => ({
        ...s,
        angulos: s.angulos.map((a) => (a.tipo === tipo ? data.angulo : a)),
      }));
    } catch { /* mantiene el actual */ }
    setRegenerando("");
  };

  const setMensaje = (v) => setSintesis((s) => ({ ...s, mensajeCentral: v }));
  const setHook = (tipo, v) => setSintesis((s) => ({
    ...s, angulos: s.angulos.map((a) => (a.tipo === tipo ? { ...a, hook: v } : a)),
  }));
  const quitarCanal = (key) => setSintesis((s) => ({
    ...s, canalesPriorizados: s.canalesPriorizados.filter((c) => c.canal !== key),
  }));

  const finish = (conSintesis) => {
    const perfilFinal = { ...perfil, sintesis: conSintesis ? sintesis : null };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfilFinal));

    const mapped = mapPerfilToForm(perfilFinal);
    const extras = [];
    const embudo = perfil.diagnostico?.embudo ? EMBUDOS[perfil.diagnostico.embudo] : null;
    if (embudo) {
      mapped.pilares = pilaresFormDe(perfil.diagnostico.embudo);
      extras.push(`Enfoque del plan: ${embudo.nombre}. Pilares estratégicos: ${embudo.pilares.join(", ")}.`);
    }
    if (perfil.diagnostico?.encadenado?.length) {
      extras.push(`Plan en dos tiempos: ${perfil.diagnostico.encadenado.map((k) => EMBUDOS[k]?.nombre).filter(Boolean).join(" → ")}.`);
    }
    if (conSintesis && sintesis) {
      extras.push(`Mensaje central: "${sintesis.mensajeCentral}".`);
      extras.push(`Ángulos de comunicación: ${sintesis.angulos.map((a) => `${ANGULO_LABEL[a.tipo] || a.tipo}: "${a.hook}"`).join(" | ")}.`);
      if (sintesis.canalesPriorizados?.length) {
        extras.push(`Canales priorizados: ${sintesis.canalesPriorizados.map((c) => `${labelDe(CANALES, c.canal)} (${c.rol})`).join(", ")}.`);
      }
    }
    if (extras.length) mapped.objetivo = `${mapped.objetivo}. ${extras.join(" ")}`;
    onFinish(perfilFinal, mapped);
  };

  const embudo = perfil.diagnostico?.embudo ? EMBUDOS[perfil.diagnostico.embudo] : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Síntesis estratégica · {perfil.negocio}
          </div>
          <button onClick={() => finish(false)} style={{
            background: "transparent", border: "none", color: C.muted,
            fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline",
          }}>Saltar este paso →</button>
        </div>

        {loading && (
          <Card><p style={{ fontSize: 14, color: C.muted, margin: 0 }}>✦ Generando la síntesis con tu perfil completo…</p></Card>
        )}

        {error && !loading && (
          <Card style={{ borderColor: `${C.amber}66` }}>
            <p style={{ fontSize: 14, margin: "0 0 12px" }}>{error}</p>
            <BtnMini onClick={generar}>Reintentar</BtnMini>
          </Card>
        )}

        {sintesis && !loading && (
          <div style={{ display: "grid", gap: 14 }}>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Etiqueta>Mensaje central</Etiqueta>
                <BtnMini onClick={regenerarMensaje} disabled={!!regenerando}>
                  {regenerando === "mensaje" ? "…" : "↻ Regenerar"}
                </BtnMini>
              </div>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontSize: 16 }}
                value={sintesis.mensajeCentral} onChange={(e) => setMensaje(e.target.value)} />
            </Card>

            <Card>
              <Etiqueta>Ángulos de comunicación</Etiqueta>
              <div style={{ display: "grid", gap: 12 }}>
                {sintesis.angulos.map((a) => (
                  <div key={a.tipo} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: C.accentLt }}>{ANGULO_LABEL[a.tipo] || a.tipo}</span>
                      <BtnMini onClick={() => regenerarAngulo(a.tipo)} disabled={!!regenerando}>
                        {regenerando === a.tipo ? "…" : "↻"}
                      </BtnMini>
                    </div>
                    <p style={{ fontSize: 12, color: C.muted, margin: "0 0 8px", lineHeight: 1.5 }}>{a.descripcion}</p>
                    <textarea style={{ ...inputStyle, minHeight: 48, resize: "vertical" }}
                      value={a.hook} onChange={(e) => setHook(a.tipo, e.target.value)} />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <Etiqueta>Canales priorizados</Etiqueta>
              <div style={{ display: "grid", gap: 8 }}>
                {sintesis.canalesPriorizados.map((c) => (
                  <div key={c.canal} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{
                      flexShrink: 0, border: `1px solid ${c.rol === "principal" ? C.accent : C.border}`,
                      color: c.rol === "principal" ? C.accentLt : C.muted,
                      borderRadius: 100, fontSize: 12, padding: "4px 12px",
                    }}>{labelDe(CANALES, c.canal)}</span>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.5, flex: 1 }}>{c.razon}</p>
                    <button onClick={() => quitarCanal(c.canal)} style={{
                      background: "transparent", border: "none", color: C.muted, cursor: "pointer",
                      fontSize: 13, fontFamily: FONT, padding: 0,
                    }}>✕</button>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Card>
                <Etiqueta>North star</Etiqueta>
                <p style={{ fontSize: 15, margin: 0 }}>
                  {perfil.objetivoMkt.meta} <span style={{ color: C.muted, fontSize: 13 }}>en {perfil.objetivoMkt.plazo}</span>
                </p>
                <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>{labelDe(OBJETIVOS_MKT, perfil.objetivoMkt.tipo)}</p>
              </Card>
              {embudo && (
                <Card>
                  <Etiqueta>Enfoque</Etiqueta>
                  <p style={{ fontSize: 15, margin: "0 0 6px" }}>{embudo.nombre}</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.5 }}>{embudo.pilares.join(" · ")}</p>
                </Card>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <BtnMini onClick={generar} disabled={!!regenerando}>↻ Regenerar todo</BtnMini>
              <button onClick={() => finish(true)} style={{
                background: C.accent, border: "none", borderRadius: 100, color: C.text,
                fontSize: 13, padding: "11px 24px", cursor: "pointer", fontFamily: FONT,
              }}>Aprobar y generar plan →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
