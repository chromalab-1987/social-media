/* ─────────────────────────────────────────────────────────────────
   src/strategy.js — Capa estratégica de datos (Fase 0-1)
   Esquema de los 8 inputs core + matriz etapa × objetivo (35 celdas)
   Módulo puro de datos: sin React, sin llamadas a API.
   ───────────────────────────────────────────────────────────────── */

/* ═══ INPUT 1 — Rubro / Industria ═══ */
export const RUBROS = [
  { key: "gastronomia",  label: "Gastronomía y alimentos" },
  { key: "moda",         label: "Moda e indumentaria" },
  { key: "belleza",      label: "Belleza y cuidado personal" },
  { key: "salud",        label: "Salud y bienestar" },
  { key: "educacion",    label: "Educación y formación" },
  { key: "tecnologia",   label: "Tecnología / Software" },
  { key: "servicios",    label: "Servicios profesionales" },
  { key: "inmobiliario", label: "Inmobiliario" },
  { key: "turismo",      label: "Turismo y hotelería" },
  { key: "retail",       label: "Retail / E-commerce general" },
  { key: "arte",         label: "Arte, diseño y creatividad" },
  { key: "deportes",     label: "Deportes y fitness" },
  { key: "otro",         label: "Otro" },
];

/* ═══ INPUT 2 — Etapa del negocio ═══ */
export const ETAPAS = [
  { key: "prelanzamiento", label: "Idea / Todavía no lancé" },
  { key: "lanzamiento",    label: "Lanzamiento reciente (menos de 6 meses vendiendo)" },
  { key: "crecimiento",    label: "Crecimiento (ya vendo, busco escalar)" },
  { key: "consolidado",    label: "Consolidado (estable, busco optimizar)" },
  { key: "estancado",      label: "Estancado / En crisis (busco reactivar)" },
];

/* ═══ INPUT 3 — Objetivo de negocio principal ═══ */
export const OBJETIVOS_NEGOCIO = [
  { key: "validar",           label: "Validar si el negocio/producto funciona" },
  { key: "primeros_clientes", label: "Conseguir los primeros clientes" },
  { key: "aumentar_ventas",   label: "Aumentar ventas / facturación" },
  { key: "escalar",           label: "Escalar a nuevos mercados o públicos" },
  { key: "retener",           label: "Retener y fidelizar clientes actuales" },
  { key: "marca",             label: "Fortalecer la marca / diferenciarme" },
  { key: "ordenar",           label: "Ordenar y optimizar lo que ya vengo haciendo" },
];

/* ═══ INPUT 4 — Buyer persona (versión resumida) ═══ */
export const BUYER_EDADES = ["18-24", "25-34", "35-44", "45-54", "55+"];

export const BUYER_TIPOS = [
  { key: "b2c",   label: "Consumidor final (B2C)" },
  { key: "b2b",   label: "Otra empresa / negocio (B2B)" },
  { key: "ambos", label: "Ambos" },
];

export const BUYER_MOTIVADORES = [
  { key: "precio",      label: "Precio / ahorro" },
  { key: "calidad",     label: "Calidad / durabilidad" },
  { key: "comodidad",   label: "Comodidad / ahorro de tiempo" },
  { key: "status",      label: "Status / imagen" },
  { key: "confianza",   label: "Confianza / seguridad" },
  { key: "experiencia", label: "Experiencia / disfrute" },
];

export const BUYER_FRENOS = [
  { key: "precio_alto",   label: "Precio alto" },
  { key: "desconfianza",  label: "Falta de confianza en la marca" },
  { key: "sin_necesidad", label: "No ve la necesidad todavía" },
  { key: "diy",           label: "Prefiere resolverlo solo" },
  { key: "comparador",    label: "Compara mucho antes de decidir" },
];

/* ═══ INPUT 5 — Propuesta de valor ═══ */
export const DIFERENCIALES = [
  { key: "precio",          label: "Precio más bajo" },
  { key: "calidad",         label: "Mejor calidad / mejor producto" },
  { key: "atencion",        label: "Mejor atención / experiencia de cliente" },
  { key: "rapidez",         label: "Mayor rapidez / comodidad" },
  { key: "especializacion", label: "Especialización / expertise en un nicho" },
  { key: "innovacion",      label: "Innovación / algo que nadie más ofrece" },
  { key: "cercania",        label: "Cercanía / trato personalizado" },
];

/* Plantilla guiada de la frase de propuesta de valor */
export const PV_TEMPLATE =
  "Para {buyer}, que {problema}, {negocio} es {que_hace}, a diferencia de {competencia}, porque {diferencial}.";

/* ═══ INPUT 6 — Objetivo de marketing + meta numérica ═══ */
export const OBJETIVOS_MKT = [
  { key: "awareness",  label: "Awareness (que más gente conozca la marca)" },
  { key: "leads",      label: "Generación de leads (conseguir contactos)" },
  { key: "conversion", label: "Conversión / Ventas" },
  { key: "retencion",  label: "Retención / Fidelización" },
];

export const PLAZOS_META = ["1 mes", "3 meses", "6 meses", "12 meses"];

/* ═══ INPUT 7 — Canales ═══ */
export const CANALES = [
  { key: "instagram",   label: "Instagram" },
  { key: "tiktok",      label: "TikTok" },
  { key: "facebook",    label: "Facebook" },
  { key: "linkedin",    label: "LinkedIn" },
  { key: "youtube",     label: "YouTube" },
  { key: "google",      label: "Google (búsqueda / SEO)" },
  { key: "whatsapp",    label: "WhatsApp" },
  { key: "email",       label: "Email" },
  { key: "referidos",   label: "Recomendación / referidos" },
  { key: "fisico",      label: "Puntos de venta físicos" },
  { key: "marketplace", label: "Marketplaces (Mercado Libre, etc.)" },
  { key: "otro",        label: "Otro" },
];

/* ═══ INPUT 8 — Horizonte temporal ═══ */
export const HORIZONTES = [
  { key: "3m",  label: "3 meses (corto plazo / urgente)",  meses: 3 },
  { key: "6m",  label: "6 meses (mediano plazo)",          meses: 6 },
  { key: "12m", label: "12 meses (largo plazo / anual)",   meses: 12 },
];

/* ═══ EMBUDOS — plantillas referenciadas por la matriz ═══
   Los pilares default son el punto de partida de la síntesis;
   el detalle completo de cada plantilla es la próxima pieza de contenido. */
export const EMBUDOS = {
  validacion:          { nombre: "Validación",           pilares: ["Expectativa", "Educativo", "Comunidad"] },
  conversion_temprana: { nombre: "Conversión temprana",  pilares: ["Diferencial", "Oferta de lanzamiento", "Detrás de escena"] },
  conversion:          { nombre: "Conversión",           pilares: ["Educativo", "Prueba social", "Oferta", "Detrás de escena"] },
  awareness:           { nombre: "Awareness",            pilares: ["Educativo", "Entretenimiento", "Historia de marca"] },
  leads:               { nombre: "Generación de leads",  pilares: ["Educativo", "Lead magnet", "Prueba social"] },
  retencion:           { nombre: "Retención",            pilares: ["Comunidad", "Recompra", "Contenido exclusivo"] },
  reactivacion:        { nombre: "Reactivación",         pilares: ["Oferta de retorno", "Novedad", "Prueba social"] },
  expansion:           { nombre: "Expansión",            pilares: ["Awareness segmento nuevo", "Prueba social", "Educativo"] },
  posicionamiento:     { nombre: "Posicionamiento",      pilares: ["Autoridad", "Prueba social", "Historia de marca"] },
  sistematizacion:     { nombre: "Sistematización",      pilares: ["Educativo", "Prueba social", "Oferta"] },
};

/* ═══ MATRIZ ETAPA × OBJETIVO — 35 celdas ═══
   estado: "coherente" | "alerta" | "incoherente"
   matchIdeal: refuerzo positivo en la UI
   lectura: texto que ve el usuario
   embudo: key de EMBUDOS (solo celdas que avanzan)
   repregunta: { texto, opciones } — paso intermedio en la UI
   redireccion: key de OBJETIVOS_NEGOCIO sugerido
   objetivoSecundario: el objetivo declarado baja a capa secundaria
   encadenado: [embudo fase 1, embudo fases siguientes]                */
export const MATRIZ = {
  /* ── Etapa 1: Pre-lanzamiento ── */
  "prelanzamiento|validar": {
    estado: "coherente", matchIdeal: true, embudo: "validacion",
    lectura: "Es exactamente el objetivo correcto para esta etapa. Todo el plan se orienta a obtener señales reales del mercado antes de invertir de más.",
  },
  "prelanzamiento|primeros_clientes": {
    estado: "coherente", embudo: "conversion_temprana",
    lectura: "Vender es la mejor forma de validar. Coherente si el producto ya está definido y se puede entregar.",
  },
  "prelanzamiento|aumentar_ventas": {
    estado: "incoherente", redireccion: "primeros_clientes",
    lectura: "Todavía no hay ventas que aumentar. El objetivo real en esta etapa es conseguir las primeras.",
  },
  "prelanzamiento|escalar": {
    estado: "incoherente", redireccion: "validar",
    lectura: "No hay nada validado que escalar. Escalar antes de validar multiplica el costo del error.",
  },
  "prelanzamiento|retener": {
    estado: "incoherente", redireccion: "primeros_clientes",
    lectura: "Sin clientes activos no existe retención posible.",
  },
  "prelanzamiento|marca": {
    estado: "alerta", embudo: "validacion", objetivoSecundario: "marca",
    lectura: "Definir identidad y mensaje es necesario ahora, pero como cimiento, no como objetivo principal: la marca se termina de afinar con clientes reales.",
    repregunta: {
      texto: "¿Qué esperás que pase cuando la marca esté \"fuerte\"?",
      opciones: [
        { label: "Que la gente empiece a comprarme", redireccion: "validar" },
        { label: "Verme profesional antes de lanzar", mantener: true },
      ],
    },
  },
  "prelanzamiento|ordenar": {
    estado: "incoherente", redireccion: "validar",
    lectura: "No hay operación previa que ordenar.",
  },

  /* ── Etapa 2: Lanzamiento reciente ── */
  "lanzamiento|validar": {
    estado: "coherente", embudo: "validacion",
    lectura: "Con menos de 6 meses de ventas, todavía se está confirmando que el negocio se sostiene. Objetivo sano y realista.",
  },
  "lanzamiento|primeros_clientes": {
    estado: "coherente", matchIdeal: true, embudo: "conversion_temprana",
    lectura: "El objetivo natural de esta etapa: pasar de ventas aisladas a un flujo inicial constante.",
  },
  "lanzamiento|aumentar_ventas": {
    estado: "alerta", embudo: "conversion",
    lectura: "Viable si ya hay ventas recurrentes, aunque el riesgo típico es querer crecer antes de que la venta sea repetible. El plan mide volumen y repetición del proceso a la vez.",
  },
  "lanzamiento|escalar": {
    estado: "alerta",
    lectura: "Prematuro: escalar exige un proceso de venta probado, y con menos de 6 meses rara vez existe. Riesgo de dispersión alta.",
    repregunta: {
      texto: "¿Tu proceso de venta funciona sin que estés vos encima de cada cliente?",
      opciones: [
        { label: "Sí, ya es repetible", mantener: true, embudo: "expansion" },
        { label: "Todavía no", redireccion: "aumentar_ventas" },
      ],
    },
  },
  "lanzamiento|retener": {
    estado: "alerta", embudo: "conversion", objetivoSecundario: "retener", redireccion: "aumentar_ventas",
    lectura: "La base de clientes es chica; la retención importa como higiene (buen servicio, seguimiento), no como objetivo principal de marketing todavía. El plan la incorpora como capa post-venta.",
  },
  "lanzamiento|marca": {
    estado: "alerta", embudo: "conversion", objetivoSecundario: "marca",
    lectura: "El diferencial se descubre vendiendo: qué valoran los que ya compraron. El plan refuerza el pilar de marca dentro de un objetivo de conversión.",
    repregunta: {
      texto: "¿Qué te preocupa más hoy?",
      opciones: [
        { label: "Que no me conocen / no me distingo", mantener: true },
        { label: "Que no estoy vendiendo lo suficiente", redireccion: "primeros_clientes" },
      ],
    },
  },
  "lanzamiento|ordenar": {
    estado: "alerta",
    lectura: "Hay poco histórico que optimizar. Suele esconder abrumación operativa más que un objetivo de marketing.",
    repregunta: {
      texto: "¿Qué es lo que sentís desordenado?",
      opciones: [
        { label: "La comunicación / redes", redireccion: "primeros_clientes" },
        { label: "La operación del negocio", mantener: true, embudo: "sistematizacion" },
      ],
    },
  },

  /* ── Etapa 3: Crecimiento ── */
  "crecimiento|validar": {
    estado: "alerta",
    lectura: "El negocio ya está validado. Si aparece este objetivo, casi siempre refiere a algo nuevo: un producto, un servicio o un segmento distinto.",
    repregunta: {
      texto: "¿Qué querés validar exactamente?",
      opciones: [
        { label: "Una línea / producto nuevo", mantener: true, embudo: "validacion" },
        { label: "Si lo que hago sigue teniendo sentido", redireccion: "marca" },
      ],
    },
  },
  "crecimiento|primeros_clientes": {
    estado: "alerta", redireccion: "escalar",
    lectura: "Los primeros clientes ya existen. Lo más probable es que se refiera a un público o mercado nuevo — el plan correcto es de expansión, no de arranque.",
  },
  "crecimiento|aumentar_ventas": {
    estado: "coherente", matchIdeal: true, embudo: "conversion",
    lectura: "El objetivo natural del crecimiento: más volumen sobre un proceso que ya funciona.",
  },
  "crecimiento|escalar": {
    estado: "coherente", embudo: "expansion",
    lectura: "Coherente: hay base probada desde donde expandirse. El plan sostiene el mercado actual y abre el nuevo en paralelo.",
  },
  "crecimiento|retener": {
    estado: "coherente", embudo: "retencion",
    lectura: "Inteligente: el crecimiento sostenible se apoya en que los clientes vuelvan, no solo en que entren nuevos.",
  },
  "crecimiento|marca": {
    estado: "coherente", embudo: "posicionamiento",
    lectura: "Coherente: al crecer aparece la competencia directa y la diferenciación deja de ser opcional.",
  },
  "crecimiento|ordenar": {
    estado: "alerta", embudo: "sistematizacion", objetivoSecundario: "aumentar_ventas",
    lectura: "Válido cuando el crecimiento fue caótico, pero ordenar es un medio. El plan agrega una fase de sistematización al servicio del objetivo de fondo.",
    repregunta: {
      texto: "¿Ordenar para qué?",
      opciones: [
        { label: "Para vender más sin volverme loco", redireccion: "aumentar_ventas" },
        { label: "Para que todo sea consistente y medible", mantener: true },
      ],
    },
  },

  /* ── Etapa 4: Consolidado ── */
  "consolidado|validar": {
    estado: "incoherente", redireccion: "ordenar",
    lectura: "Un negocio consolidado ya está validado. Si hay algo por validar, es un producto o mercado nuevo — y eso cambia el plan por completo.",
    repregunta: {
      texto: "¿Qué querés validar?",
      opciones: [
        { label: "Un producto / línea nueva", mantener: true, embudo: "validacion" },
        { label: "Nada puntual, revisar el rumbo", redireccion: "ordenar" },
      ],
    },
  },
  "consolidado|primeros_clientes": {
    estado: "incoherente", redireccion: "escalar",
    lectura: "Aplica solo a una línea o sucursal nueva. Como objetivo del negocio consolidado, el plan correcto es de expansión.",
  },
  "consolidado|aumentar_ventas": {
    estado: "coherente", embudo: "conversion",
    lectura: "Coherente: con la operación estable, empujar facturación es un objetivo sano. Subir ticket y frecuencia suele rendir más que buscar solo clientes nuevos.",
  },
  "consolidado|escalar": {
    estado: "coherente", matchIdeal: true, embudo: "expansion",
    lectura: "El momento ideal para expandir: hay base estable que financia la apuesta.",
  },
  "consolidado|retener": {
    estado: "coherente", matchIdeal: true, embudo: "retencion",
    lectura: "Máximo apalancamiento: la base de clientes acumulada es el activo más valioso y el más barato de activar.",
  },
  "consolidado|marca": {
    estado: "coherente", embudo: "posicionamiento",
    lectura: "Coherente: la consolidación permite invertir en posicionamiento de largo plazo, que es lo que protege al negocio de la competencia por precio.",
  },
  "consolidado|ordenar": {
    estado: "coherente", matchIdeal: true, embudo: "sistematizacion",
    lectura: "El objetivo literal de la etapa: profesionalizar lo que ya funciona.",
  },

  /* ── Etapa 5: Estancado / En crisis ── */
  "estancado|validar": {
    estado: "alerta", encadenado: ["validacion", "reactivacion"],
    lectura: "Re-validar tiene sentido: si las ventas cayeron, algo cambió — el mercado, la competencia o la relevancia de la oferta. El plan arranca con un mes de diagnóstico y sigue con reactivación.",
  },
  "estancado|primeros_clientes": {
    estado: "alerta", redireccion: "aumentar_ventas",
    lectura: "No son los \"primeros\": es recuperar el flujo. El reencuadre importa porque la base de clientes pasados es un activo que un plan de arranque ignoraría.",
  },
  "estancado|aumentar_ventas": {
    estado: "coherente", matchIdeal: true, embudo: "reactivacion",
    lectura: "El objetivo natural de la reactivación: recuperar y superar el nivel anterior. Lo más rápido y barato es empezar por la base existente.",
  },
  "estancado|escalar": {
    estado: "incoherente", redireccion: "aumentar_ventas",
    lectura: "Escalar un negocio que está cayendo amplifica el problema: se traslada a un mercado nuevo algo que dejó de funcionar en el actual.",
    repregunta: {
      texto: "¿Tu mercado actual todavía existe como antes?",
      opciones: [
        { label: "Sí, pero me compran menos", redireccion: "aumentar_ventas" },
        { label: "No, cambió estructuralmente", mantener: true, embudo: "validacion" },
      ],
    },
  },
  "estancado|retener": {
    estado: "coherente", embudo: "retencion",
    lectura: "Coherente y urgente: frenar la fuga es más barato que reemplazar clientes. Si el estancamiento viene de clientes que no vuelven, este es el objetivo correcto.",
  },
  "estancado|marca": {
    estado: "alerta",
    lectura: "Puede ser la causa real del estancamiento (mensaje desgastado, competencia que copió el diferencial), pero solo si el diagnóstico lo confirma; si no, es una forma elegante de postergar el problema de ventas.",
    repregunta: {
      texto: "¿Por qué creés que dejaron de elegirte?",
      opciones: [
        { label: "Mi propuesta ya no se distingue", mantener: true, embudo: "posicionamiento" },
        { label: "No lo tengo claro", redireccion: "aumentar_ventas" },
      ],
    },
  },
  "estancado|ordenar": {
    estado: "alerta", redireccion: "aumentar_ventas",
    lectura: "Ordenar no reactiva ventas por sí solo. El plan correcto arranca auditando qué se hacía cuando funcionaba vs. ahora — a veces la respuesta está ahí — y sigue con reactivación.",
  },
};

/* ═══ Helper principal ═══
   Devuelve la celda de la matriz para una combinación etapa/objetivo.
   La UI decide qué mostrar según estado + repregunta + redireccion.  */
export function evaluarDiagnostico(etapaKey, objetivoKey) {
  const celda = MATRIZ[`${etapaKey}|${objetivoKey}`];
  if (!celda) return null;
  return { etapa: etapaKey, objetivo: objetivoKey, ...celda };
}

/* Resuelve la repregunta: dado el índice de la opción elegida,
   devuelve el diagnóstico final (mantiene o redirige).            */
export function resolverRepregunta(diagnostico, opcionIdx) {
  const op = diagnostico?.repregunta?.opciones?.[opcionIdx];
  if (!op) return diagnostico;
  if (op.redireccion) {
    const nuevo = evaluarDiagnostico(diagnostico.etapa, op.redireccion);
    return { ...nuevo, redirigidoDesde: diagnostico.objetivo };
  }
  return { ...diagnostico, embudo: op.embudo || diagnostico.embudo, repreguntaResuelta: true };
}

/* Estructura del perfil estratégico — la fuente de verdad
   que alimenta síntesis, plan táctico y generación (Fase 3). */
export const PERFIL_VACIO = {
  rubro: null,            // key de RUBROS
  rubroOtro: "",
  etapa: null,            // key de ETAPAS
  objetivoNegocio: null,  // key de OBJETIVOS_NEGOCIO (post-diagnóstico)
  objetivoSecundario: null,
  buyer: {
    edad: null, tipo: null, motivador: null, freno: null,
    descripcion: "",      // texto corto obligatorio
  },
  propuestaValor: { diferencial: null, frase: "" },
  objetivoMkt: { tipo: null, meta: null, plazo: null },
  canales: [],            // keys de CANALES
  horizonte: null,        // key de HORIZONTES
  fechaClave: "",
  diagnostico: null,      // output de evaluarDiagnostico (+ repregunta resuelta)
};

/* Validación mínima antes de avanzar a la síntesis (Fase 0). */
export function validarPerfil(p) {
  const faltantes = [];
  if (!p.rubro) faltantes.push("rubro");
  if (!p.etapa) faltantes.push("etapa");
  if (!p.objetivoNegocio) faltantes.push("objetivo de negocio");
  if (!p.buyer?.descripcion?.trim()) faltantes.push("descripción del cliente ideal");
  if (!p.propuestaValor?.frase?.trim()) faltantes.push("propuesta de valor");
  if (!p.objetivoMkt?.tipo) faltantes.push("tipo de objetivo de marketing");
  if (!p.objetivoMkt?.meta || Number(p.objetivoMkt.meta) <= 0) faltantes.push("meta numérica");
  if (!p.objetivoMkt?.plazo) faltantes.push("plazo de la meta");
  if (!p.canales?.length) faltantes.push("al menos un canal");
  if (!p.horizonte) faltantes.push("horizonte temporal");
  return { valido: faltantes.length === 0, faltantes };
}
