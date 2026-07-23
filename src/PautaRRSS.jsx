/* ─────────────────────────────────────────────────────────────────
   src/PautaRRSS.jsx — Módulo de pauta en redes (producción)
   La app NO pauta: arma la campaña lista para cargar en Ads Manager.
   Capa determinística: piso de inversión ($50 mil ARS/mes),
   mini-matriz de conveniencia por etapa, plataforma y tipo de
   campaña por objetivo, split prospección/remarketing por etapa.
   Capa IA: segmentación sugerida + 3 conceptos de anuncio (uno por
   ángulo de la síntesis). Se guarda en el perfil al aprobar.
   ───────────────────────────────────────────────────────────────── */
import { useState, useCallback } from "react";
import {
  RUBROS, ETAPAS, BUYER_TIPOS, BUYER_MOTIVADORES, BUYER_FRENOS,
  OBJETIVOS_MKT, EMBUDOS,
} from "./strategy.js";
import { PERFIL_KEY } from "./Wizard.jsx";

const C = {
  bg: "#0C0C0F", surface: "#13131A", surf2: "#1A1A24", surf3: "#22222E",
  border: "#2C2C3C", text: "#F2EDE4", muted: "#6B6B80",
  accent: "#7B35D4", accentLt: "#9F5FF0", accentDim: "#7B35D433",
  teal: "#2A9D8F", amber: "#E9C46A", red: "#E63946",
};
const FONT = "Georgia,serif";
const labelDe = (list, key) => list.find((o) => o.key === key)?.label || key || "";
const fmt = (n) => "$" + n.toLocaleString("es-AR");

/* ── Rangos de presupuesto mensual (ARS) — piso: $50 mil ── */
export const RANGOS_PRESUPUESTO = [
  { key: "menos_50", label: "Menos de $50 mil", min: 0, max: 50000, viable: false },
  { key: "r1", label: "$50 a $100 mil", min: 50000, max: 100000, viable: true },
  { key: "r2", label: "$100 a $300 mil", min: 100000, max: 300000, viable: true },
  { key: "r3", label: "$300 mil a $1 millón", min: 300000, max: 1000000, viable: true },
  { key: "r4", label: "Más de $1 millón", min: 1000000, max: 3000000, viable: true },
];

/* ── Mini-matriz: ¿conviene pautar? (por etapa) ── */
export const EVALUACION_POR_ETAPA = {
  prelanzamiento: {
    estado: "coherente",
    lectura: "Pautar para validar es de las mejores inversiones de esta etapa: una campaña chica de mensajes te dice en dos semanas si el mercado responde, antes de invertir de más.",
  },
  lanzamiento: {
    estado: "coherente",
    lectura: "La pauta acelera lo que el orgánico tarda meses: llegar a los primeros clientes. Con el proceso de venta todavía fresco, empezá chico y duplicá solo lo que convierte.",
  },
  crecimiento: {
    estado: "coherente",
    lectura: "El momento ideal: ya sabés qué mensaje convierte en orgánico — la pauta lo amplifica sobre un proceso probado.",
  },
  consolidado: {
    estado: "coherente",
    lectura: "Con base estable, la pauta rinde mejor en remarketing y expansión que en prospección fría masiva. La distribución de abajo lo refleja.",
  },
  estancado: {
    estado: "alerta",
    lectura: "Antes de pagar por gente nueva, reactivá gratis la base que ya tenés (el kit de WhatsApp y la secuencia de email hacen eso). Si pautás igual, que el grueso sea remarketing a quienes ya te conocen — es más barato y convierte más — no prospección fría.",
  },
};

/* ── Split prospección / remarketing por etapa ── */
const SPLIT_POR_ETAPA = {
  prelanzamiento: [90, 10], lanzamiento: [80, 20], crecimiento: [70, 30],
  consolidado: [60, 40], estancado: [30, 70],
};

/* ── Plataforma y tipo de campaña (determinísticos) ── */
function plataformaDelPerfil(p, rango) {
  const notas = [];
  let principal = "Meta (Instagram + Facebook)";
  if (p.buyer?.tipo === "b2b") {
    notas.push("Tu buyer es B2B: LinkedIn Ads es el canal natural pero su costo por resultado es varias veces el de Meta — con este presupuesto, Meta con segmentación por cargo/interés profesional suele rendir más.");
  }
  const secundaria = p.canales?.includes("google") && ["r2", "r3", "r4"].includes(rango)
    ? "Google Search (captura la demanda que ya te busca — activala como segunda campaña)"
    : null;
  if (p.canales?.includes("google") && rango === "r1") {
    notas.push("Marcaste Google como canal: con este presupuesto no conviene dividir entre plataformas — concentrá todo en Meta y sumá Search cuando puedas subir la inversión.");
  }
  return { principal, secundaria, notas };
}

const CAMPANA_POR_MKT = {
  awareness:  { tipo: "Alcance / Reconocimiento", detalle: "Optimizada a alcance con frecuencia controlada (máx 2-3 por semana por persona)" },
  leads:      { tipo: "Clientes potenciales (formularios instantáneos) o Mensajes", detalle: "Formulario con 3 preguntas máximo, o conversación directa" },
  conversion: { tipo: "Mensajes a WhatsApp", detalle: "El CTA natural del mercado argentino: la conversión se cierra en la conversación" },
  retencion:  { tipo: "Remarketing", detalle: "Públicos de interacción (IG/FB 180 días) + lista de clientes subida como público personalizado" },
};

/* ── API ── */
const cleanJSON = (txt) => txt.replace(/```json|```/g, "").trim();
async function callChat(prompt, maxTokens = 3000) {
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

function buildPautaPrompt(p, campana, soloAngulo = null) {
  const angulos = p.sintesis?.angulos?.length
    ? p.sintesis.angulos.filter((a) => ["dolor", "prueba", "diferencial"].includes(a.tipo))
    : [{ tipo: "dolor" }, { tipo: "prueba" }, { tipo: "diferencial" }];
  const lista = (soloAngulo ? angulos.filter((a) => a.tipo === soloAngulo) : angulos)
    .map((a) => `- "${a.tipo}"${a.hook ? ` (hook orgánico de referencia, NO copiarlo: "${a.hook}")` : ""}`)
    .join("\n");

  return `Sos un media buyer senior especializado en Meta Ads para negocios chicos de Argentina. Armá los conceptos de anuncio de esta campaña.

${contextoPerfil(p)}

TIPO DE CAMPAÑA: ${campana.tipo} — ${campana.detalle}.
ÁNGULOS A CUBRIR (un anuncio por ángulo):
${lista}

INSTRUCCIONES:
- Por anuncio: "copy" (texto primario, 80-125 caracteres visibles antes del "ver más": el gancho va TODO ahí), "titular" (máx 40 caracteres), "descripcion" (máx 25 caracteres), "briefVisual" (concepto de la imagen/video en 1-2 oraciones: qué se ve, qué texto en placa), "botonCta" (uno de: "Enviar mensaje", "Más información", "Comprar", "Registrarte", "Reservar").
- El anuncio de "dolor" abre con la situación del buyer; el de "prueba" con evidencia concreta; el de "diferencial" con lo que nadie más ofrece.
- Cada copy desarma el FRENO o apalanca el MOTIVADOR — sin nombrarlos literalmente.
- Lenguaje de anuncio que no parece anuncio: directo, específico, cero "potenciar" ni "impulsar".
- "segmentacion": edades (rango), "ubicacion" (sugerencia de radio o zona según el rubro), "intereses" (5-8 intereses de Meta reales y específicos para este buyer), "nota" (1 consejo de segmentación).

Devolvé SOLO JSON válido:
{"segmentacion":{"edades":"...","ubicacion":"...","intereses":["..."],"nota":"..."},"anuncios":[{"angulo":"dolor","copy":"...","titular":"...","descripcion":"...","briefVisual":"...","botonCta":"..."}]}`;
}

/* ── UI ── */
const inputStyle = {
  width: "100%", boxSizing: "border-box", background: C.surf2,
  border: `1px solid ${C.border}`, borderRadius: 10, color: C.text,
  fontSize: 14, padding: "12px 14px", fontFamily: FONT, outline: "none", lineHeight: 1.55,
};
function Card({ children, borderColor }) {
  return (
    <div style={{ background: C.surf2, border: `1px solid ${borderColor || C.border}`, borderRadius: 12, padding: "16px 18px" }}>
      {children}
    </div>
  );
}
function Etiqueta({ children }) {
  return <p style={{ fontSize: 11, color: C.muted, margin: "0 0 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{children}</p>;
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
const ANGULO_LABEL = { dolor: "Dolor", prueba: "Prueba", diferencial: "Diferencial" };

export default function PautaRRSS({ perfil, onBack, onSave }) {
  const guardado = perfil.pautaPlan || null;
  const [rango, setRango] = useState(guardado?.rango || null);
  const [plan, setPlan] = useState(guardado ? { segmentacion: guardado.segmentacion, anuncios: guardado.anuncios } : null);
  const [loading, setLoading] = useState(false);
  const [regenerando, setRegenerando] = useState("");
  const [error, setError] = useState("");

  const rangoObj = RANGOS_PRESUPUESTO.find((r) => r.key === rango);
  const evaluacion = EVALUACION_POR_ETAPA[perfil.etapa] || EVALUACION_POR_ETAPA.crecimiento;
  const campana = CAMPANA_POR_MKT[perfil.objetivoMkt?.tipo] || CAMPANA_POR_MKT.conversion;
  const plataforma = rangoObj ? plataformaDelPerfil(perfil, rango) : null;
  const split = SPLIT_POR_ETAPA[perfil.etapa] || [70, 30];

  const parse = (raw) => JSON.parse(cleanJSON(raw));

  const generar = useCallback(async () => {
    setLoading(true); setError("");
    for (let intento = 0; intento < 3; intento++) {
      try {
        const data = parse(await callChat(buildPautaPrompt(perfil, campana)));
        if (!data.segmentacion || !Array.isArray(data.anuncios) || data.anuncios.length < 2) throw new Error("plan incompleto");
        setPlan(data);
        setLoading(false);
        return;
      } catch (e) {
        if (intento === 2) { setError("No pudimos generar los conceptos. " + e.message); setLoading(false); }
      }
    }
  }, [perfil, campana]); // eslint-disable-line

  const elegirRango = (key) => {
    setRango(key);
    const r = RANGOS_PRESUPUESTO.find((x) => x.key === key);
    if (r?.viable && !plan) generar();
  };

  const regenerarAnuncio = async (angulo) => {
    setRegenerando(angulo);
    try {
      const data = parse(await callChat(buildPautaPrompt(perfil, campana, angulo), 900));
      const nuevo = data.anuncios?.[0];
      if (nuevo?.copy) setPlan((p) => ({ ...p, anuncios: p.anuncios.map((a) => (a.angulo === angulo ? { ...nuevo, angulo } : a)) }));
    } catch { /* mantiene el actual */ }
    setRegenerando("");
  };

  const setCampo = (angulo, campo, v) =>
    setPlan((p) => ({ ...p, anuncios: p.anuncios.map((a) => (a.angulo === angulo ? { ...a, [campo]: v } : a)) }));

  const guardar = () => {
    const perfilFinal = {
      ...perfil,
      pautaPlan: { rango, ...plan, plataforma, campana, split, generadoEl: new Date().toISOString() },
    };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfilFinal));
    onSave(perfilFinal);
    onBack();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Pauta en redes · {perfil.negocio}
          </div>
          <button onClick={onBack} style={{
            background: "transparent", border: "none", color: C.muted,
            fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline",
          }}>← Volver al plan</button>
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px", lineHeight: 1.6 }}>
          La campaña lista para cargar en Ads Manager: estructura, segmentación, presupuesto y anuncios.
        </p>

        {/* Paso 1: presupuesto */}
        {!rango && (
          <div>
            <p style={{ fontSize: 15, margin: "0 0 14px" }}>¿Cuánto podés invertir por mes en pauta?</p>
            <div style={{ display: "grid", gap: 8 }}>
              {RANGOS_PRESUPUESTO.map((r) => (
                <button key={r.key} onClick={() => elegirRango(r.key)} style={{
                  display: "block", width: "100%", textAlign: "left", boxSizing: "border-box",
                  background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 10,
                  color: C.text, fontSize: 14, padding: "14px 16px", cursor: "pointer", fontFamily: FONT,
                }}>{r.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Presupuesto bajo el piso: honestidad, sin campaña */}
        {rango === "menos_50" && (
          <Card borderColor={`${C.amber}66`}>
            <Etiqueta>Nuestra recomendación honesta</Etiqueta>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 12px" }}>
              Con menos de $50 mil por mes, la pauta no alcanza el piso de aprendizaje de la plataforma: el algoritmo no junta datos suficientes para optimizar y la inversión se diluye sin resultados medibles. Ninguna estructura de campaña arregla eso.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 16px" }}>
              Ese dinero rinde más acumulado hasta cruzar el piso, mientras el trabajo orgánico que ya tenés generado (calendario, WhatsApp, email) hace el trabajo. Cuando puedas invertir desde $50 mil, esta pantalla te arma la campaña.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <BtnMini onClick={() => setRango(null)}>Cambiar presupuesto</BtnMini>
              <BtnMini onClick={onBack}>Volver al plan</BtnMini>
            </div>
          </Card>
        )}

        {/* Paso 2: evaluación + estructura + conceptos */}
        {rangoObj?.viable && (
          <div style={{ display: "grid", gap: 14 }}>

            <Card borderColor={evaluacion.estado === "alerta" ? `${C.amber}55` : `${C.teal}44`}>
              <Etiqueta>{evaluacion.estado === "alerta" ? "Atención antes de pautar" : "¿Conviene pautar en tu etapa?"}</Etiqueta>
              <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{evaluacion.lectura}</p>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Card>
                <Etiqueta>Plataforma</Etiqueta>
                <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5 }}>{plataforma.principal}</p>
                {plataforma.secundaria && (
                  <p style={{ fontSize: 12, color: C.teal, margin: "6px 0 0", lineHeight: 1.5 }}>+ {plataforma.secundaria}</p>
                )}
              </Card>
              <Card>
                <Etiqueta>Tipo de campaña</Etiqueta>
                <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5 }}>{campana.tipo}</p>
                <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0", lineHeight: 1.5 }}>{campana.detalle}</p>
              </Card>
            </div>

            <Card>
              <Etiqueta>Presupuesto — {rangoObj.label} / mes</Etiqueta>
              <p style={{ fontSize: 13, margin: "0 0 10px", color: C.muted }}>
                Diario aproximado: {fmt(Math.round(rangoObj.min / 30))} a {fmt(Math.round(rangoObj.max / 30))}
              </p>
              <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${split[0]}%`, background: C.accent }} />
                <div style={{ width: `${split[1]}%`, background: C.teal }} />
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                <span style={{ color: C.accentLt }}>■ Prospección {split[0]}%</span> · <span style={{ color: C.teal }}>■ Remarketing {split[1]}%</span>
                {rango === "r1" && " — con este presupuesto, una sola campaña y un solo objetivo: no fragmentar."}
              </p>
              {plataforma.notas.map((n, i) => (
                <p key={i} style={{ fontSize: 12, color: C.muted, margin: "8px 0 0", lineHeight: 1.5 }}>✦ {n}</p>
              ))}
            </Card>

            {loading && (
              <Card><p style={{ fontSize: 14, color: C.muted, margin: 0 }}>✦ Armando segmentación y anuncios con tu perfil…</p></Card>
            )}
            {error && !loading && (
              <Card borderColor={`${C.amber}66`}>
                <p style={{ fontSize: 14, margin: "0 0 12px" }}>{error}</p>
                <BtnMini onClick={generar}>Reintentar</BtnMini>
              </Card>
            )}

            {plan && !loading && (<>
              <Card>
                <Etiqueta>Segmentación sugerida</Etiqueta>
                <p style={{ fontSize: 13, margin: "0 0 6px", lineHeight: 1.6 }}>
                  <span style={{ color: C.teal }}>Edades:</span> {plan.segmentacion.edades} · <span style={{ color: C.teal }}>Ubicación:</span> {plan.segmentacion.ubicacion}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0" }}>
                  {(plan.segmentacion.intereses || []).map((i) => (
                    <span key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 100, color: C.muted, fontSize: 12, padding: "4px 12px" }}>{i}</span>
                  ))}
                </div>
                {plan.segmentacion.nota && <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0", lineHeight: 1.5 }}>✦ {plan.segmentacion.nota}</p>}
              </Card>

              {plan.anuncios.map((a) => (
                <Card key={a.angulo}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: C.accentLt }}>Anuncio · {ANGULO_LABEL[a.angulo] || a.angulo}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, border: `1px solid ${C.border}`, color: C.muted, padding: "3px 10px", borderRadius: 100 }}>{a.botonCta}</span>
                      <BtnMini onClick={() => regenerarAnuncio(a.angulo)} disabled={!!regenerando}>
                        {regenerando === a.angulo ? "…" : "↻"}
                      </BtnMini>
                    </div>
                  </div>
                  <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical", marginBottom: 8 }}
                    value={a.copy} onChange={(e) => setCampo(a.angulo, "copy", e.target.value)} placeholder="Texto primario" />
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input style={inputStyle} value={a.titular} onChange={(e) => setCampo(a.angulo, "titular", e.target.value)} placeholder="Titular" />
                    <input style={{ ...inputStyle, fontSize: 12 }} value={a.descripcion || ""} onChange={(e) => setCampo(a.angulo, "descripcion", e.target.value)} placeholder="Descripción" />
                  </div>
                  {a.briefVisual && <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.5 }}>✦ Visual: {a.briefVisual}</p>}
                </Card>
              ))}

              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
                <BtnMini onClick={() => { setRango(null); }}>← Cambiar presupuesto</BtnMini>
                <div style={{ display: "flex", gap: 10 }}>
                  <BtnMini onClick={generar} disabled={!!regenerando}>↻ Regenerar todo</BtnMini>
                  <button onClick={guardar} style={{
                    background: C.accent, border: "none", borderRadius: 100, color: C.text,
                    fontSize: 13, padding: "11px 24px", cursor: "pointer", fontFamily: FONT,
                  }}>Guardar campaña →</button>
                </div>
              </div>
            </>)}
          </div>
        )}
      </div>
    </div>
  );
}
