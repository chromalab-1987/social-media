/* ─────────────────────────────────────────────────────────────────
   src/EmailSecuencia.jsx — Secuencias de email (producción)
   La estructura de la secuencia (pasos, días, disparadores) es
   determinística y depende del objetivo de marketing del perfil.
   La IA solo redacta asunto, preheader y cuerpo de cada correo.
   Se guarda en el perfil al aprobar.
   ───────────────────────────────────────────────────────────────── */
import { useState, useEffect, useCallback } from "react";
import {
  RUBROS, ETAPAS, BUYER_TIPOS, BUYER_MOTIVADORES, BUYER_FRENOS,
  OBJETIVOS_MKT, EMBUDOS,
} from "./strategy.js";
import { PERFIL_KEY } from "./Wizard.jsx";

const C = {
  bg: "#0C0C0F", surface: "#13131A", surf2: "#1A1A24", surf3: "#22222E",
  border: "#2C2C3C", text: "#F2EDE4", muted: "#6B6B80",
  accent: "#7B35D4", accentLt: "#9F5FF0", accentDim: "#7B35D433",
  teal: "#2A9D8F", amber: "#E9C46A",
};
const FONT = "Georgia,serif";
const labelDe = (list, key) => list.find((o) => o.key === key)?.label || key || "";

/* ── Secuencias por objetivo de marketing (workflow determinístico) ── */
export const SECUENCIAS_POR_MKT = {
  awareness: {
    nombre: "Newsletter de marca",
    entrada: "La persona se suma a la lista",
    pasos: [
      { key: "e1", nombre: "Presentación", dia: 0,
        objetivo: "Presentar la marca con su mensaje central y fijar qué va a recibir y cada cuánto" },
      { key: "e2", nombre: "Historia / detrás de escena", dia: 4,
        objetivo: "Construir cercanía contando cómo y por qué existe el negocio" },
      { key: "e3", nombre: "Contenido educativo", dia: 9,
        objetivo: "Aportar un consejo accionable del rubro que el buyer pueda aplicar hoy" },
      { key: "e4", nombre: "Invitación a la comunidad", dia: 14,
        objetivo: "Llevar a la persona a los canales priorizados de la marca" },
    ],
  },
  leads: {
    nombre: "Bienvenida + nurture",
    entrada: "La persona dejó su contacto o descargó el lead magnet",
    pasos: [
      { key: "e1", nombre: "Entrega + bienvenida", dia: 0,
        objetivo: "Entregar lo prometido de inmediato y presentar la marca en dos líneas" },
      { key: "e2", nombre: "Valor extra", dia: 2,
        objetivo: "Profundizar el tema del lead magnet con un consejo aplicable que no estaba incluido" },
      { key: "e3", nombre: "Prueba social", dia: 5,
        objetivo: "Mostrar un caso o testimonio que desarme el freno de compra del buyer" },
      { key: "e4", nombre: "Oferta de entrada", dia: 8,
        objetivo: "Invitar a la primera compra o consulta con una oferta concreta de bajo compromiso" },
    ],
  },
  conversion: {
    nombre: "Secuencia de conversión",
    entrada: "La persona mostró interés (consulta, carrito, registro)",
    pasos: [
      { key: "e1", nombre: "Bienvenida + diferencial", dia: 0,
        objetivo: "Responder al interés y dejar claro por qué esta marca y no otra" },
      { key: "e2", nombre: "Prueba social / caso", dia: 3,
        objetivo: "Desarmar el freno de compra con evidencia concreta (caso, testimonio, resultado)" },
      { key: "e3", nombre: "Oferta", dia: 7,
        objetivo: "Presentar la oferta con un CTA directo y urgencia natural" },
      { key: "e4", nombre: "Última llamada", dia: 10,
        objetivo: "Cerrar la oferta con escasez honesta; dejar la puerta abierta si no es el momento" },
    ],
  },
  retencion: {
    nombre: "Post-compra + recompra",
    entrada: "La persona compró o recibió el servicio",
    pasos: [
      { key: "e1", nombre: "Gracias + qué esperar", dia: 0,
        objetivo: "Agradecer, confirmar y anticipar los próximos pasos para reducir dudas post-compra" },
      { key: "e2", nombre: "Sacale el jugo", dia: 7,
        objetivo: "Tips de uso o aprovechamiento que aumenten la satisfacción con lo comprado" },
      { key: "e3", nombre: "Reseña / referido", dia: 14,
        objetivo: "Pedir reseña o recomendación apalancando la buena experiencia" },
      { key: "e4", nombre: "Recompra", dia: 30,
        objetivo: "Invitar a volver con un incentivo o novedad alineada a lo que ya compró" },
    ],
  },
};

export const secuenciaDelPerfil = (perfil) =>
  SECUENCIAS_POR_MKT[perfil?.objetivoMkt?.tipo] || SECUENCIAS_POR_MKT.conversion;

/* ── API ── */
const cleanJSON = (txt) => txt.replace(/```json|```/g, "").trim();
async function callChat(prompt, maxTokens = 3500) {
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
function contextoPerfil(p) {
  const embudo = p.diagnostico?.embudo ? EMBUDOS[p.diagnostico.embudo] : null;
  return [
    `NEGOCIO: ${p.negocio} — ${p.rubro === "otro" ? p.rubroOtro : labelDe(RUBROS, p.rubro)}`,
    `ETAPA: ${labelDe(ETAPAS, p.etapa)}`,
    `BUYER: ${p.buyer.descripcion} (${p.buyer.edad || "—"}, ${labelDe(BUYER_TIPOS, p.buyer.tipo)})`,
    `MOTIVADOR DE COMPRA: ${labelDe(BUYER_MOTIVADORES, p.buyer.motivador)}`,
    `FRENO DE COMPRA: ${labelDe(BUYER_FRENOS, p.buyer.freno)}`,
    p.propuestaValor?.frase ? `PROPUESTA DE VALOR: ${p.propuestaValor.frase}` : "",
    p.sintesis?.mensajeCentral ? `MENSAJE CENTRAL: "${p.sintesis.mensajeCentral}"` : "",
    `OBJETIVO DE MARKETING: ${labelDe(OBJETIVOS_MKT, p.objetivoMkt.tipo)} — meta: ${p.objetivoMkt.meta} en ${p.objetivoMkt.plazo}`,
    embudo ? `ENFOQUE DEL PLAN: ${embudo.nombre}` : "",
  ].filter(Boolean).join("\n");
}

function buildEmailPrompt(p, soloPaso = null) {
  const sec = secuenciaDelPerfil(p);
  const pasos = soloPaso ? sec.pasos.filter((x) => x.key === soloPaso) : sec.pasos;
  const listado = pasos.map((x) =>
    `- "${x.key}" (${x.nombre}, día ${x.dia}): ${x.objetivo}.`
  ).join("\n");

  return `Sos un experto en email marketing para negocios chicos. Redactá los correos de esta secuencia.

${contextoPerfil(p)}

SECUENCIA: ${sec.nombre}. Entrada al workflow: ${sec.entrada.toLowerCase()}.
CORREOS A REDACTAR:
${listado}

INSTRUCCIONES:
- Por correo: "asunto" (máx 50 caracteres, concreto, sin clickbait vacío), "preheader" (máx 80 caracteres, complementa el asunto sin repetirlo), "cuerpo" (120-180 palabras, listo para enviar).
- Tono humano y directo, primera persona del negocio — nada de plantilla corporativa.
- Usá variables entre llaves donde corresponda: {nombre}. Solo si suma.
- Un solo CTA por correo, coherente con el objetivo del paso.
- El correo de prueba social desarma el FRENO DE COMPRA sin nombrarlo literalmente; los CTA apalancan el MOTIVADOR.
- Prohibidos los clichés: "potenciar", "impulsar", "llevar al siguiente nivel".

Devolvé SOLO JSON válido:
{"correos":[{"paso":"e1","asunto":"...","preheader":"...","cuerpo":"..."}]}`;
}

/* ── UI ── */
const inputStyle = {
  width: "100%", boxSizing: "border-box", background: C.surf2,
  border: `1px solid ${C.border}`, borderRadius: 10, color: C.text,
  fontSize: 14, padding: "12px 14px", fontFamily: FONT, outline: "none", lineHeight: 1.55,
};
function BtnMini({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: "transparent", border: `1px solid ${C.border}`, borderRadius: 100,
      color: disabled ? C.surf3 : C.muted, fontSize: 12, padding: "5px 12px",
      cursor: disabled ? "default" : "pointer", fontFamily: FONT,
    }}>{children}</button>
  );
}

export default function EmailSecuencia({ perfil, onBack, onSave }) {
  const sec = secuenciaDelPerfil(perfil);
  const [correos, setCorreos] = useState(perfil.emailSecuencia?.correos || null);
  const [loading, setLoading] = useState(!perfil.emailSecuencia);
  const [regenerando, setRegenerando] = useState("");
  const [copiado, setCopiado] = useState("");
  const [error, setError] = useState("");

  const parse = (raw) => JSON.parse(cleanJSON(raw));

  const generar = useCallback(async () => {
    setLoading(true); setError("");
    for (let intento = 0; intento < 3; intento++) {
      try {
        const data = parse(await callChat(buildEmailPrompt(perfil)));
        const validos = (data.correos || []).filter((c) => sec.pasos.some((x) => x.key === c.paso));
        if (validos.length < sec.pasos.length) throw new Error("secuencia incompleta");
        setCorreos(validos);
        setLoading(false);
        return;
      } catch (e) {
        if (intento === 2) { setError("No pudimos generar la secuencia. " + e.message); setLoading(false); }
      }
    }
  }, [perfil]); // eslint-disable-line

  useEffect(() => { if (!correos) generar(); }, []); // eslint-disable-line

  const regenerarPaso = async (key) => {
    setRegenerando(key);
    try {
      const data = parse(await callChat(buildEmailPrompt(perfil, key), 900));
      const nuevo = data.correos?.[0];
      if (nuevo?.cuerpo) setCorreos((cs) => cs.map((c) => (c.paso === key ? { ...nuevo, paso: key } : c)));
    } catch { /* mantiene el actual */ }
    setRegenerando("");
  };

  const setCampo = (key, campo, v) => setCorreos((cs) => cs.map((c) => (c.paso === key ? { ...c, [campo]: v } : c)));

  const copiar = async (key, c) => {
    try {
      await navigator.clipboard.writeText(`Asunto: ${c.asunto}\n\n${c.cuerpo}`);
      setCopiado(key); setTimeout(() => setCopiado(""), 1500);
    } catch { /* sin permiso */ }
  };

  const guardar = () => {
    const perfilFinal = { ...perfil, emailSecuencia: { tipo: perfil.objetivoMkt.tipo, correos, generadoEl: new Date().toISOString() } };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfilFinal));
    onSave(perfilFinal);
    onBack();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Secuencia de email · {perfil.negocio}
          </div>
          <button onClick={onBack} style={{
            background: "transparent", border: "none", color: C.muted,
            fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline",
          }}>← Volver al plan</button>
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px", lineHeight: 1.6 }}>
          <span style={{ color: C.accentLt }}>{sec.nombre}</span> — el workflow arranca cuando {sec.entrada.toLowerCase()}.
        </p>

        {loading && (
          <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>✦ Redactando los {sec.pasos.length} correos con tu perfil…</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ background: C.surf2, border: `1px solid ${C.amber}66`, borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 14, margin: "0 0 12px" }}>{error}</p>
            <BtnMini onClick={generar}>Reintentar</BtnMini>
          </div>
        )}

        {correos && !loading && (
          <div style={{ display: "grid", gap: 14 }}>
            {sec.pasos.map((paso, i) => {
              const c = correos.find((x) => x.paso === paso.key);
              return (
                <div key={paso.key} style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, color: C.accentLt }}>
                      {i + 1}. {paso.nombre}
                      <span style={{ color: C.teal, fontSize: 12, marginLeft: 10 }}>
                        {paso.dia === 0 ? "Día 0 (al entrar)" : `Día ${paso.dia}`}
                      </span>
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <BtnMini onClick={() => regenerarPaso(paso.key)} disabled={!!regenerando}>
                        {regenerando === paso.key ? "…" : "↻"}
                      </BtnMini>
                      {c && (
                        <BtnMini onClick={() => copiar(paso.key, c)}>
                          {copiado === paso.key ? "✓ Copiado" : "Copiar"}
                        </BtnMini>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: C.muted, margin: "0 0 10px", lineHeight: 1.5 }}>{paso.objetivo}.</p>
                  {c ? (<>
                    <input style={{ ...inputStyle, marginBottom: 8 }} value={c.asunto}
                      onChange={(e) => setCampo(paso.key, "asunto", e.target.value)} placeholder="Asunto" />
                    <input style={{ ...inputStyle, marginBottom: 8, fontSize: 12, color: C.muted }} value={c.preheader || ""}
                      onChange={(e) => setCampo(paso.key, "preheader", e.target.value)} placeholder="Preheader" />
                    <textarea style={{ ...inputStyle, minHeight: 130, resize: "vertical" }}
                      value={c.cuerpo} onChange={(e) => setCampo(paso.key, "cuerpo", e.target.value)} />
                  </>) : (
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>No se generó este correo — usá ↻ para reintentarlo.</p>
                  )}
                </div>
              );
            })}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
              <BtnMini onClick={generar} disabled={!!regenerando}>↻ Regenerar todo</BtnMini>
              <button onClick={guardar} style={{
                background: C.accent, border: "none", borderRadius: 100, color: C.text,
                fontSize: 13, padding: "11px 24px", cursor: "pointer", fontFamily: FONT,
              }}>Guardar secuencia →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
