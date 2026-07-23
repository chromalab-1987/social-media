/* ─────────────────────────────────────────────────────────────────
   src/WhatsAppKit.jsx — Kit de mensajes de WhatsApp (producción)
   6 momentos: 5 universales + 1 confirmación adaptada al rubro.
   Disparadores y timing son determinísticos (definidos acá);
   la IA solo redacta los mensajes con el perfil estratégico.
   El kit se guarda en el perfil (localStorage) al aprobar.
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

/* ── Momentos universales (disparador y timing fijos) ── */
export const MOMENTOS_UNIVERSALES = [
  { key: "primer_contacto", nombre: "Primer contacto",
    disparador: "La persona escribe por primera vez o hace una consulta",
    timing: "Respuesta inmediata" },
  { key: "seguimiento", nombre: "Seguimiento",
    disparador: "Hubo conversación pero no respondió o no avanzó",
    timing: "24-48 hs después del último mensaje" },
  { key: "cierre", nombre: "Cierre / oferta",
    disparador: "Mostró interés concreto (preguntó precio, disponibilidad, cómo comprar)",
    timing: "En el momento, mientras el interés está caliente" },
  { key: "postventa", nombre: "Post-venta",
    disparador: "Compró o recibió el servicio",
    timing: "24 hs después de la entrega" },
  { key: "reactivacion", nombre: "Reactivación",
    disparador: "Cliente que dejó de comprar o interactuar",
    timing: "A los 30-60 días de inactividad" },
];

/* ── Momento 6: confirmación adaptada al rubro ── */
const CONFIRMACION_PEDIDO = {
  key: "confirmacion", nombre: "Confirmación de pedido",
  disparador: "El pedido fue recibido / está listo / salió en camino",
  timing: "En cada cambio de estado del pedido" };
const CONFIRMACION_TURNO = {
  key: "confirmacion", nombre: "Confirmación de turno",
  disparador: "La persona reservó un turno",
  timing: "Al reservar + recordatorio 24 hs antes (reduce ausencias)" };
const CONFIRMACION_REUNION = {
  key: "confirmacion", nombre: "Confirmación de reunión",
  disparador: "Se agendó una reunión o llamada",
  timing: "Al agendar + recordatorio el día anterior" };
const CONFIRMACION_RESERVA = {
  key: "confirmacion", nombre: "Confirmación de reserva",
  disparador: "La persona hizo una reserva",
  timing: "Al reservar + recordatorio previo a la fecha" };

export const CONFIRMACION_POR_RUBRO = {
  gastronomia: CONFIRMACION_PEDIDO, retail: CONFIRMACION_PEDIDO,
  moda: CONFIRMACION_PEDIDO, arte: { ...CONFIRMACION_PEDIDO, nombre: "Confirmación de encargo" },
  belleza: CONFIRMACION_TURNO, salud: CONFIRMACION_TURNO, deportes: CONFIRMACION_TURNO,
  servicios: CONFIRMACION_REUNION, educacion: CONFIRMACION_REUNION,
  tecnologia: CONFIRMACION_REUNION,
  inmobiliario: { ...CONFIRMACION_REUNION, nombre: "Confirmación de visita" },
  turismo: CONFIRMACION_RESERVA,
  otro: { key: "confirmacion", nombre: "Confirmación",
    disparador: "La persona concretó un pedido, turno o reserva",
    timing: "Al concretarse + recordatorio si aplica" },
};

export function momentosDelPerfil(perfil) {
  const conf = CONFIRMACION_POR_RUBRO[perfil?.rubro] || CONFIRMACION_POR_RUBRO.otro;
  return [...MOMENTOS_UNIVERSALES, conf];
}

/* ── API ── */
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

function buildKitPrompt(p, soloMomento = null) {
  const momentos = soloMomento
    ? momentosDelPerfil(p).filter((m) => m.key === soloMomento)
    : momentosDelPerfil(p);
  const listado = momentos.map((m) =>
    `- "${m.key}" (${m.nombre}): se envía cuando ${m.disparador.toLowerCase()}. Timing: ${m.timing.toLowerCase()}.`
  ).join("\n");

  return `Sos un experto en conversión por WhatsApp para negocios. Redactá los mensajes del kit de WhatsApp de este negocio.

${contextoPerfil(p)}

MOMENTOS A REDACTAR:
${listado}

INSTRUCCIONES:
- Un mensaje por momento, listo para copiar y usar. Máximo 350 caracteres cada uno.
- Tono humano y directo, como escribe un dueño de negocio que atiende bien — nada de lenguaje corporativo ni de bot.
- Usá variables entre llaves donde corresponda: {nombre}, {pedido}, {fecha}, {hora}. Solo las necesarias.
- El SEGUIMIENTO debe desarmar el FRENO DE COMPRA del buyer sin nombrarlo literalmente.
- El CIERRE apalanca el MOTIVADOR y alinea el CTA al objetivo de marketing.
- El POST-VENTA prepara la recompra o pide reseña/referido según el enfoque del plan.
- Emojis: máximo 1-2 por mensaje, solo si suman.
- "nota": un consejo de uso de 1 oración para el dueño (cuándo NO enviarlo, qué personalizar).

Devolvé SOLO JSON válido:
{"mensajes":[{"momento":"key_del_momento","mensaje":"...","nota":"..."}]}`;
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

export default function WhatsAppKit({ perfil, onBack, onSave }) {
  const momentos = momentosDelPerfil(perfil);
  const [mensajes, setMensajes] = useState(perfil.whatsappKit?.mensajes || null);
  const [loading, setLoading] = useState(!perfil.whatsappKit);
  const [regenerando, setRegenerando] = useState("");
  const [copiado, setCopiado] = useState("");
  const [error, setError] = useState("");

  const parse = (raw) => JSON.parse(cleanJSON(raw));

  const generar = useCallback(async () => {
    setLoading(true); setError("");
    for (let intento = 0; intento < 3; intento++) {
      try {
        const data = parse(await callChat(buildKitPrompt(perfil)));
        const validos = (data.mensajes || []).filter((m) => momentos.some((x) => x.key === m.momento));
        if (validos.length < momentos.length - 1) throw new Error("kit incompleto");
        setMensajes(validos);
        setLoading(false);
        return;
      } catch (e) {
        if (intento === 2) { setError("No pudimos generar el kit. " + e.message); setLoading(false); }
      }
    }
  }, [perfil]); // eslint-disable-line

  useEffect(() => { if (!mensajes) generar(); }, []); // eslint-disable-line

  const regenerarMomento = async (key) => {
    setRegenerando(key);
    try {
      const data = parse(await callChat(buildKitPrompt(perfil, key), 600));
      const nuevo = data.mensajes?.[0];
      if (nuevo?.mensaje) setMensajes((ms) => ms.map((m) => (m.momento === key ? { ...nuevo, momento: key } : m)));
    } catch { /* mantiene el actual */ }
    setRegenerando("");
  };

  const setMensaje = (key, v) => setMensajes((ms) => ms.map((m) => (m.momento === key ? { ...m, mensaje: v } : m)));

  const copiar = async (key, texto) => {
    try { await navigator.clipboard.writeText(texto); setCopiado(key); setTimeout(() => setCopiado(""), 1500); } catch { /* sin permiso */ }
  };

  const guardar = () => {
    const perfilFinal = { ...perfil, whatsappKit: { mensajes, generadoEl: new Date().toISOString() } };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfilFinal));
    onSave(perfilFinal);
    onBack();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Kit de WhatsApp · {perfil.negocio}
          </div>
          <button onClick={onBack} style={{
            background: "transparent", border: "none", color: C.muted,
            fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline",
          }}>← Volver al plan</button>
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px", lineHeight: 1.6 }}>
          Cada mensaje con su disparador y su momento. Copiá, personalizá las {"{variables}"} y usá.
        </p>

        {loading && (
          <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>✦ Redactando los {momentos.length} mensajes con tu perfil…</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ background: C.surf2, border: `1px solid ${C.amber}66`, borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 14, margin: "0 0 12px" }}>{error}</p>
            <BtnMini onClick={generar}>Reintentar</BtnMini>
          </div>
        )}

        {mensajes && !loading && (
          <div style={{ display: "grid", gap: 14 }}>
            {momentos.map((mo) => {
              const m = mensajes.find((x) => x.momento === mo.key);
              return (
                <div key={mo.key} style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, color: C.accentLt }}>{mo.nombre}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <BtnMini onClick={() => regenerarMomento(mo.key)} disabled={!!regenerando}>
                        {regenerando === mo.key ? "…" : "↻"}
                      </BtnMini>
                      {m && (
                        <BtnMini onClick={() => copiar(mo.key, m.mensaje)}>
                          {copiado === mo.key ? "✓ Copiado" : "Copiar"}
                        </BtnMini>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: C.muted, margin: "0 0 10px", lineHeight: 1.5 }}>
                    <span style={{ color: C.teal }}>Cuándo:</span> {mo.disparador}. <span style={{ color: C.teal }}>Timing:</span> {mo.timing}.
                  </p>
                  {m ? (<>
                    <textarea style={{ ...inputStyle, minHeight: 84, resize: "vertical" }}
                      value={m.mensaje} onChange={(e) => setMensaje(mo.key, e.target.value)} />
                    {m.nota && <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0", lineHeight: 1.5 }}>✦ {m.nota}</p>}
                  </>) : (
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>No se generó este momento — usá ↻ para reintentarlo.</p>
                  )}
                </div>
              );
            })}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
              <BtnMini onClick={generar} disabled={!!regenerando}>↻ Regenerar todo</BtnMini>
              <button onClick={guardar} style={{
                background: C.accent, border: "none", borderRadius: 100, color: C.text,
                fontSize: 13, padding: "11px 24px", cursor: "pointer", fontFamily: FONT,
              }}>Guardar kit →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
