/* ─────────────────────────────────────────────────────────────────
   src/ArticulosSEO.jsx — Plan de artículos / SEO (producción)
   Genera un plan de 4 artículos (uno por semana) a partir de las
   búsquedas reales del buyer: keyword objetivo, intención, título
   y estructura de H2. Mix determinístico: 3 informacionales que
   responden al dolor del buyer + 1 comercial alineado al objetivo.
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

const INTENCION_LABEL = {
  informacional: "Informacional",
  comercial: "Comercial",
  transaccional: "Transaccional",
};

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
    `NEGOCIO: ${p.negocio}${p.sitioWeb ? ` (${p.sitioWeb})` : ""} — ${p.rubro === "otro" ? p.rubroOtro : labelDe(RUBROS, p.rubro)}`,
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

function buildArticulosPrompt(p, soloId = null) {
  const cantidad = soloId ? 1 : 4;
  const mix = soloId
    ? `Generá 1 artículo nuevo y distinto con id "${soloId}". Elegí la intención que mejor complete un plan mensual.`
    : `Generá exactamente 4 artículos (ids "a1" a "a4"), uno por semana del mes:
- 3 con intención "informacional": responden preguntas y problemas que el buyer busca en Google ANTES de saber que este negocio existe. Pensá qué escribiría literalmente en el buscador.
- 1 con intención "comercial" o "transaccional": captura la búsqueda de alguien listo para elegir proveedor, alineado al objetivo de marketing.`;

  return `Sos un especialista en SEO y contenidos para negocios chicos. Armá el plan de artículos del mes.

${contextoPerfil(p)}

${mix}

INSTRUCCIONES:
- "keyword": la frase de búsqueda objetivo tal como la escribiría el buyer (en minúsculas, lenguaje natural, español rioplatense si aplica). Nada de keywords imposibles de rankear para un negocio chico: preferí long-tail específicas.
- "titulo": título del artículo (máx 65 caracteres) que contenga la keyword de forma natural y dé ganas de clickear sin clickbait.
- "descripcion": meta description de máx 150 caracteres.
- "estructura": 4-6 títulos H2 que ordenen el artículo de la pregunta al CTA. El último H2 conecta con el negocio sin que el artículo sea una publicidad.
- "cta": qué acción propone el cierre del artículo, coherente con el objetivo de marketing.

Devolvé SOLO JSON válido:
{"articulos":[{"id":"a1","keyword":"...","intencion":"informacional","titulo":"...","descripcion":"...","estructura":["H2...","H2..."],"cta":"..."}]}`;
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

export default function ArticulosSEO({ perfil, onBack, onSave }) {
  const [articulos, setArticulos] = useState(perfil.articulosPlan?.articulos || null);
  const [loading, setLoading] = useState(!perfil.articulosPlan);
  const [regenerando, setRegenerando] = useState("");
  const [copiado, setCopiado] = useState("");
  const [error, setError] = useState("");

  const parse = (raw) => JSON.parse(cleanJSON(raw));

  const generar = useCallback(async () => {
    setLoading(true); setError("");
    for (let intento = 0; intento < 3; intento++) {
      try {
        const data = parse(await callChat(buildArticulosPrompt(perfil)));
        const validos = (data.articulos || []).filter((a) => a.keyword && a.titulo && Array.isArray(a.estructura));
        if (validos.length < 3) throw new Error("plan incompleto");
        setArticulos(validos.slice(0, 4));
        setLoading(false);
        return;
      } catch (e) {
        if (intento === 2) { setError("No pudimos generar el plan. " + e.message); setLoading(false); }
      }
    }
  }, [perfil]); // eslint-disable-line

  useEffect(() => { if (!articulos) generar(); }, []); // eslint-disable-line

  const regenerarUno = async (id) => {
    setRegenerando(id);
    try {
      const data = parse(await callChat(buildArticulosPrompt(perfil, id), 1000));
      const nuevo = data.articulos?.[0];
      if (nuevo?.titulo) setArticulos((as) => as.map((a) => (a.id === id ? { ...nuevo, id } : a)));
    } catch { /* mantiene el actual */ }
    setRegenerando("");
  };

  const setCampo = (id, campo, v) => setArticulos((as) => as.map((a) => (a.id === id ? { ...a, [campo]: v } : a)));
  const setEstructura = (id, v) => setCampo(id, "estructura", v.split("\n"));

  const copiar = async (id, a) => {
    try {
      await navigator.clipboard.writeText(
        `${a.titulo}\nKeyword: ${a.keyword}\nMeta: ${a.descripcion || ""}\n\n${a.estructura.map((h) => `## ${h}`).join("\n")}\n\nCTA: ${a.cta || ""}`
      );
      setCopiado(id); setTimeout(() => setCopiado(""), 1500);
    } catch { /* sin permiso */ }
  };

  const guardar = () => {
    const perfilFinal = { ...perfil, articulosPlan: { articulos, generadoEl: new Date().toISOString() } };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfilFinal));
    onSave(perfilFinal);
    onBack();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Plan de artículos · {perfil.negocio}
          </div>
          <button onClick={onBack} style={{
            background: "transparent", border: "none", color: C.muted,
            fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline",
          }}>← Volver al plan</button>
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px", lineHeight: 1.6 }}>
          4 artículos del mes: 3 que responden lo que tu buyer busca en Google + 1 que captura al que ya está eligiendo.
        </p>

        {loading && (
          <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>✦ Armando el plan desde las búsquedas de tu buyer…</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ background: C.surf2, border: `1px solid ${C.amber}66`, borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 14, margin: "0 0 12px" }}>{error}</p>
            <BtnMini onClick={generar}>Reintentar</BtnMini>
          </div>
        )}

        {articulos && !loading && (
          <div style={{ display: "grid", gap: 14 }}>
            {articulos.map((a, i) => (
              <div key={a.id} style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: C.accentLt }}>
                    Semana {i + 1}
                    <span style={{
                      marginLeft: 10, fontSize: 11, border: `1px solid ${a.intencion === "informacional" ? C.border : C.teal + "66"}`,
                      color: a.intencion === "informacional" ? C.muted : C.teal,
                      padding: "3px 10px", borderRadius: 100,
                    }}>{INTENCION_LABEL[a.intencion] || a.intencion}</span>
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <BtnMini onClick={() => regenerarUno(a.id)} disabled={!!regenerando}>
                      {regenerando === a.id ? "…" : "↻"}
                    </BtnMini>
                    <BtnMini onClick={() => copiar(a.id, a)}>
                      {copiado === a.id ? "✓ Copiado" : "Copiar"}
                    </BtnMini>
                  </div>
                </div>
                <input style={{ ...inputStyle, marginBottom: 8, fontSize: 15 }} value={a.titulo}
                  onChange={(e) => setCampo(a.id, "titulo", e.target.value)} placeholder="Título" />
                <input style={{ ...inputStyle, marginBottom: 8, fontSize: 12, color: C.teal }} value={a.keyword}
                  onChange={(e) => setCampo(a.id, "keyword", e.target.value)} placeholder="keyword objetivo" />
                <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical", fontSize: 13 }}
                  value={a.estructura.join("\n")} onChange={(e) => setEstructura(a.id, e.target.value)} />
                {a.cta && <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0", lineHeight: 1.5 }}>✦ CTA: {a.cta}</p>}
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
              <BtnMini onClick={generar} disabled={!!regenerando}>↻ Regenerar todo</BtnMini>
              <button onClick={guardar} style={{
                background: C.accent, border: "none", borderRadius: 100, color: C.text,
                fontSize: 13, padding: "11px 24px", cursor: "pointer", fontFamily: FONT,
              }}>Guardar plan →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
