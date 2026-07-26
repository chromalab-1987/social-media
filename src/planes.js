/* ─────────────────────────────────────────────────────────────────
   src/planes.js — Definición de planes y lógica de permisos
   Los límites viven acá (no en la base) para ajustarlos sin migrar.
   Módulo puro: sin React, sin llamadas. La fuente de verdad del
   estado del usuario es la tabla `suscripciones` de Supabase; este
   archivo solo interpreta ese estado.
   ───────────────────────────────────────────────────────────────── */

/* ═══ Los 4 planes + free ═══
   precioUSD: se muestra en USD, se cobra en pesos al cambio del día.
   marcas: tope de marcas activas simultáneas.
   produccion: si permite generar los módulos de producción.        */
export const PLANES = {
  free: {
    key: "free", nombre: "Gratis", precioUSD: 0,
    marcas: 1, produccion: false,
    resumen: "Diagnóstico y síntesis estratégica de 1 marca.",
    incluye: [
      "Entrevista guiada de 8 pasos",
      "Diagnóstico estratégico",
      "Síntesis: mensaje central, ángulos y canales",
    ],
    noIncluye: ["Generación de contenido (redes, WhatsApp, email, artículos, pauta)"],
  },
  empresa: {
    key: "empresa", mpPlanId: "6a234288eaa841eab60766a4f61d8510", nombre: "Empresa", precioUSD: 30,
    marcas: 1, produccion: true,
    resumen: "Para tu propio negocio. Todo incluido, 1 marca.",
    incluye: [
      "Todo lo del plan Gratis",
      "Los 5 módulos de producción completos",
      "Calendario, WhatsApp, email, artículos y pauta",
      "Guardado en la nube",
    ],
  },
  estudio: {
    key: "estudio", mpPlanId: "1c1dab80479740b0b5a43d34450a85aa", nombre: "Estudio", precioUSD: 55,
    marcas: 3, produccion: true,
    resumen: "Para freelancers y CM con cartera chica. Hasta 3 marcas.",
    incluye: [
      "Todo lo del plan Empresa",
      "Hasta 3 marcas en paralelo",
      "Panel multi-cliente",
    ],
  },
  agencia: {
    key: "agencia", mpPlanId: "723945258ef9423e85f0a5b2d183aeff", nombre: "Agencia", precioUSD: 90,
    marcas: 5, produccion: true,
    resumen: "Para agencias establecidas. Hasta 5 marcas.",
    incluye: [
      "Todo lo del plan Estudio",
      "Hasta 5 marcas en paralelo",
    ],
  },
  agencia_pro: {
    key: "agencia_pro", mpPlanId: "22eb127748784d188216dbdb080492e0", nombre: "Agencia Pro", precioUSD: 150,
    marcas: 10, produccion: true,
    resumen: "Para agencias con volumen. Hasta 10 marcas.",
    incluye: [
      "Todo lo del plan Agencia",
      "Hasta 10 marcas en paralelo",
    ],
  },
};

/* Orden para mostrar en la pantalla de planes y comparar niveles. */
export const ORDEN_PLANES = ["free", "empresa", "estudio", "agencia", "agencia_pro"];

/* Los planes de pago, para la grilla de precios (sin free). */
export const PLANES_PAGOS = ["empresa", "estudio", "agencia", "agencia_pro"];

/* ═══ Interpretación del estado de suscripción ═══
   Recibe la fila de `suscripciones` (o null) y devuelve el plan
   efectivo: si está vencida o no existe, cae a free.               */
export function planEfectivo(suscripcion) {
  if (!suscripcion) return PLANES.free;
  const { plan, estado, vence_el } = suscripcion;
  const vigente =
    estado === "activa" &&
    (!vence_el || new Date(vence_el) > new Date());
  if (!vigente) return PLANES.free;
  return PLANES[plan] || PLANES.free;
}

/* ¿Puede generar producción (los 5 módulos)? */
export function puedeGenerarProduccion(suscripcion) {
  return planEfectivo(suscripcion).produccion === true;
}

/* ¿Puede crear una marca más, dado cuántas tiene hoy? */
export function puedeCrearMarca(suscripcion, marcasActuales) {
  return marcasActuales < planEfectivo(suscripcion).marcas;
}

/* Cuántas marcas más puede crear (para mostrar en la UI). */
export function marcasRestantes(suscripcion, marcasActuales) {
  return Math.max(0, planEfectivo(suscripcion).marcas - marcasActuales);
}

/* Sugerencia de upgrade: el siguiente plan que resuelve la necesidad.
   motivo = "produccion" | "marcas".                                */
export function planSugerido(suscripcion, motivo, marcasActuales = 0) {
  const actual = planEfectivo(suscripcion).key;
  const idx = ORDEN_PLANES.indexOf(actual);
  for (let i = idx + 1; i < ORDEN_PLANES.length; i++) {
    const p = PLANES[ORDEN_PLANES[i]];
    if (motivo === "produccion" && p.produccion) return p;
    if (motivo === "marcas" && p.marcas > marcasActuales) return p;
  }
  return PLANES.agencia_pro; // tope
}
