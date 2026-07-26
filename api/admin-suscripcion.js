/* ─────────────────────────────────────────────────────────────────
   /api/admin-suscripcion.js
   Activación/baja manual de planes (para cobros por PayPal u otros).
   Protegido: solo el ADMIN_EMAIL puede usarlo, verificando el token
   de sesión de Supabase que envía el front.
   Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE, ADMIN_EMAIL.
   ───────────────────────────────────────────────────────────────── */
import { createClient } from "@supabase/supabase-js";

function vencimientoMeses(meses) {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return d.toISOString();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  /* Verificar que quien llama es el admin (por su token de sesión) */
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: authErr } = await admin.auth.getUser(token);
  if (authErr || userData?.user?.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "No autorizado" });
  }

  const { email, plan, meses = 1, accion = "activar" } = req.body || {};
  if (!email) return res.status(400).json({ error: "falta email" });

  try {
    /* Buscar el user_id por email */
    const { data: list } = await admin.auth.admin.listUsers();
    const target = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!target) return res.status(404).json({ error: "No existe un usuario con ese email" });

    if (accion === "activar") {
      if (!plan) return res.status(400).json({ error: "falta plan" });
      await admin.from("suscripciones").upsert({
        user_id: target.id,
        plan,
        estado: "activa",
        origen: "manual",
        vence_el: vencimientoMeses(meses),
      }, { onConflict: "user_id" });
      return res.status(200).json({ ok: true, msg: `${email} → ${plan} por ${meses} mes(es)` });
    }

    if (accion === "baja") {
      await admin.from("suscripciones").update({
        plan: "free", estado: "activa", origen: "manual", vence_el: null,
      }).eq("user_id", target.id);
      return res.status(200).json({ ok: true, msg: `${email} → free` });
    }

    return res.status(400).json({ error: "acción inválida" });
  } catch (e) {
    console.error("[admin] excepción:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
