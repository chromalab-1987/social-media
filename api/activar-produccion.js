/* ─────────────────────────────────────────────────────────────────
   /api/activar-produccion.js
   Registra que un cliente se llevó a PRODUCCIÓN en el ciclo actual,
   validando el cupo del plan DEL LADO SERVIDOR (no se puede saltear
   desde el navegador). Idempotente por (user, cliente, ciclo).
   Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE.

   NOTA: incluye un modo diagnóstico temporal (?debug=1) para
   detectar problemas de configuración. Sacarlo una vez resuelto.
   ───────────────────────────────────────────────────────────────── */
import { createClient } from "@supabase/supabase-js";

const LIMITES = { free: 0, empresa: 1, estudio: 3, agencia: 5, agencia_pro: 10 };

function inicioCiclo(sub) {
  const hoy = new Date();
  if (!sub?.vence_el) {
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  }
  const fin = new Date(sub.vence_el);
  const ini = new Date(fin);
  ini.setMonth(ini.getMonth() - 1);
  return ini.toISOString().slice(0, 10);
}

function planEfectivo(sub) {
  if (!sub) return "free";
  const vigente = sub.estado === "activa" && (!sub.vence_el || new Date(sub.vence_el) > new Date());
  return vigente ? sub.plan : "free";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { userId, clienteId, clienteNombre } = req.body || {};
  if (!userId || !clienteId) return res.status(400).json({ error: "faltan datos" });

  /* Chequeo de configuración: si esto no está seteado, decilo claro
     en vez de fallar en silencio como "plan sin producción". */
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: "Variables de entorno faltantes en el servidor", falta: {
      SUPABASE_URL: !process.env.SUPABASE_URL, SUPABASE_SERVICE_ROLE: !process.env.SUPABASE_SERVICE_ROLE,
    }});
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

  try {
    const { data: sub, error: subError } = await supabase
      .from("suscripciones").select("plan, estado, vence_el").eq("user_id", userId).maybeSingle();

    const debug = true; // temporal: siempre activo hasta resolver el diagnóstico
    const plan = planEfectivo(sub);
    const limite = LIMITES[plan] ?? 0;
    const ciclo = inicioCiclo(sub);

    if (limite === 0) {
      return res.status(403).json({
        error: "plan sin producción", motivo: "produccion",
        ...(debug ? { debug: { subEncontrada: !!sub, subError: subError?.message || null, subCruda: sub, planCalculado: plan, urlUsada: process.env.SUPABASE_URL } } : {}),
      });
    }

    const { data: yaActivo } = await supabase
      .from("activaciones").select("id")
      .eq("user_id", userId).eq("cliente_id", clienteId).eq("ciclo", ciclo).maybeSingle();
    if (yaActivo) return res.status(200).json({ ok: true, yaActivo: true });

    const { count } = await supabase
      .from("activaciones").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("ciclo", ciclo);

    if ((count ?? 0) >= limite) {
      return res.status(403).json({ error: "cupo agotado", motivo: "cupo", ciclo, limite });
    }

    const { error } = await supabase.from("activaciones").insert({
      user_id: userId, cliente_id: clienteId, cliente_nombre: clienteNombre || null, ciclo,
    });
    if (error && !String(error.message).includes("duplicate")) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ok: true, usados: (count ?? 0) + 1, limite });
  } catch (e) {
    console.error("[activar] excepción:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
