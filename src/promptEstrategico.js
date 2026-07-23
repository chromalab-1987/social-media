/* ─────────────────────────────────────────────────────────────────
   src/promptEstrategico.js — Contexto estratégico para la generación
   Construye el bloque de perfil que consume buildWeekPrompt cuando
   existe un perfil estratégico. Lógica pura, sin React ni API.
   - Rotación de ángulos: semana 1 dolor, 2 aspiración, 3 prueba,
     4 diferencial (el arco clásico de un mes de conversión).
   - CTA derivado del tipo de objetivo de marketing.
   Devuelve null si el perfil no está completo → el prompt legacy
   sigue funcionando igual que siempre (modo rápido).
   ───────────────────────────────────────────────────────────────── */
import {
  RUBROS, ETAPAS, BUYER_TIPOS, BUYER_MOTIVADORES, BUYER_FRENOS,
  OBJETIVOS_MKT, CANALES, EMBUDOS,
} from "./strategy.js";

const labelDe = (list, key) => list.find((o) => o.key === key)?.label || key || "";

export const ANGULOS_SEMANA = ["dolor", "aspiracion", "prueba", "diferencial"];
const ANGULO_LABEL = { dolor: "Dolor", aspiracion: "Aspiración", prueba: "Prueba", diferencial: "Diferencial" };

const CTA_POR_MKT = {
  awareness:  "que la persona conozca la marca, siga la cuenta, comparta o guarde — nada de venta dura",
  leads:      "que la persona deje su contacto, se registre o pida más info",
  conversion: "que la persona compre o escriba por WhatsApp para pedir, con urgencia natural",
  retencion:  "que un cliente existente vuelva a comprar, refiera o se sume a la comunidad",
};

export function buildContextoEstrategico(perfil, semanaNum) {
  if (!perfil?.negocio || !perfil?.buyer?.descripcion || !perfil?.objetivoMkt?.tipo) return null;

  const d = perfil.diagnostico || {};
  const s = perfil.sintesis || null;
  const embudo = d.embudo ? EMBUDOS[d.embudo] : null;
  const anguloTipo = ANGULOS_SEMANA[(semanaNum - 1) % 4];
  const angulo = s?.angulos?.find((a) => a.tipo === anguloTipo) || null;

  const contexto = [
    `NEGOCIO: ${perfil.negocio}${perfil.sitioWeb ? ` (${perfil.sitioWeb})` : ""} — ${perfil.rubro === "otro" ? perfil.rubroOtro : labelDe(RUBROS, perfil.rubro)}`,
    `ETAPA DEL NEGOCIO: ${labelDe(ETAPAS, perfil.etapa)}`,
    `BUYER: ${perfil.buyer.descripcion} (${perfil.buyer.edad || "—"}, ${labelDe(BUYER_TIPOS, perfil.buyer.tipo)})`,
    `MOTIVADOR DE COMPRA: ${labelDe(BUYER_MOTIVADORES, perfil.buyer.motivador)}`,
    `FRENO DE COMPRA: ${labelDe(BUYER_FRENOS, perfil.buyer.freno)}`,
    perfil.propuestaValor?.frase ? `PROPUESTA DE VALOR: ${perfil.propuestaValor.frase}` : "",
    s?.mensajeCentral ? `MENSAJE CENTRAL: "${s.mensajeCentral}"` : "",
    `OBJETIVO DE MARKETING: ${labelDe(OBJETIVOS_MKT, perfil.objetivoMkt.tipo)} — meta: ${perfil.objetivoMkt.meta} en ${perfil.objetivoMkt.plazo}`,
    embudo ? `ENFOQUE DEL PLAN: ${embudo.nombre} (pilares estratégicos: ${embudo.pilares.join(", ")})` : "",
    s?.canalesPriorizados?.length
      ? `CANALES PRIORIZADOS: ${s.canalesPriorizados.map((c) => `${labelDe(CANALES, c.canal)} (${c.rol})`).join(", ")}`
      : "",
    perfil.fechaClave ? `FECHA CLAVE DEL PERÍODO: ${perfil.fechaClave}` : "",
    angulo
      ? `ÁNGULO DE LA SEMANA (${ANGULO_LABEL[anguloTipo]}): ${angulo.descripcion} Hook de referencia: "${angulo.hook}"`
      : `ÁNGULO DE LA SEMANA: ${ANGULO_LABEL[anguloTipo]}`,
  ].filter(Boolean).join("\n");

  const instrucciones = [
    `- Cada copy apalanca el MOTIVADOR del buyer y desarma su FRENO, sin nombrarlos literalmente`,
    `- La mayoría de los posts de la semana giran alrededor del ÁNGULO DE LA SEMANA (los demás pueden variar); no repitas el hook de referencia textual`,
    `- El CTA de cada post busca: ${CTA_POR_MKT[perfil.objetivoMkt.tipo] || "una acción específica y accionable"}`,
  ].join("\n");

  return { contexto, instrucciones };
}
