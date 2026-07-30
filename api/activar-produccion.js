/* ─────────────────────────────────────────────────────────────────
   /api/activar-produccion.js
   Registra que un cliente se llevó a PRODUCCIÓN en el ciclo actual,
   validando el cupo del plan DEL LADO SERVIDOR (no se puede saltear
   desde el navegador). Idempotente por (user, cliente, ciclo).
   Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE.
   ───────────────────────────────────────────────────────────────── */
import { createClient } from "@supabase/supabase-js";

/* Límites por plan (espejo de planes.js, del lado servidor). */
const LIMITES = { free: 0, empresa: 1, estudio: 3, agencia: 5, agencia_pro: 10 };

/* Calcula el inicio del ciclo actual a partir de la suscripción.
   El ciclo arranca en la fecha de suscripción y dura 1 mes; para
   free (sin fecha) usamos el mes calendario. Devuelve "YYYY-MM-DD". */
function inicioCiclo(sub) {
  const hoy = new Date();
  if (!sub?.vence_el) {
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  }
  /* vence_el es el fin del ciclo actual; el inicio es un mes antes */
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

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

  try {
    /* Traer suscripción y calcular plan + ciclo */
    const { data: sub } = await supabase
      .from("suscripciones").select("plan, estado, vence_el").eq("user_id", userId).maybeSingle();
    const plan = planEfectivo(sub);
    const limite = LIMITES[plan] ?? 0;
    const ciclo = inicioCiclo(sub);

    if (limite === 0) return res.status(403).json({ error: "plan sin producción", motivo: "produccion" });

    /* ¿Este cliente ya está activado en este ciclo? → gratis */
    const { data: yaActivo } = await supabase
      .from("activaciones").select("id")
      .eq("user_id", userId).eq("cliente_id", clienteId).eq("ciclo", ciclo).maybeSingle();
    if (yaActivo) return res.status(200).json({ ok: true, yaActivo: true });

    /* ¿Cuántos cupos usó este ciclo? */
    const { count } = await supabase
      .from("activaciones").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("ciclo", ciclo);

    if ((count ?? 0) >= limite) {
      return res.status(403).json({ error: "cupo agotado", motivo: "cupo", ciclo, limite });
    }

    /* Registrar activación */
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
