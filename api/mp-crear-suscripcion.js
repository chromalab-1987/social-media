/* ─────────────────────────────────────────────────────────────────
   /api/mp-crear-suscripcion.js
   Crea una suscripción (preapproval) en Mercado Pago para el plan
   elegido y devuelve el init_point (link de pago). Los IDs de plan
   están fijos (ya creados en el panel de MP).
   Variables de entorno (Vercel):
     MP_ACCESS_TOKEN         — Access Token de PRODUCCIÓN
     SUPABASE_URL            — url del proyecto (sin VITE_)
     SUPABASE_SERVICE_ROLE   — service_role key (secreta)
   ───────────────────────────────────────────────────────────────── */
import { createClient } from "@supabase/supabase-js";

/* IDs de los planes creados en el panel de Mercado Pago (producción). */
const PLAN_IDS = {
  empresa:     "6a234288eaa841eab60766a4f61d8510",
  estudio:     "1c1dab80479740b0b5a43d34450a85aa",
  agencia:     "723945258ef9423e85f0a5b2d183aeff",
  agencia_pro: "22eb127748784d188216dbdb080492e0",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { plan, userId, email } = req.body || {};
  if (!plan || !userId || !email) return res.status(400).json({ error: "faltan datos" });

  const preapprovalPlanId = PLAN_IDS[plan];
  if (!preapprovalPlanId) return res.status(400).json({ error: "plan inválido" });

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: "MP_ACCESS_TOKEN no configurado" });

  try {
    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        preapproval_plan_id: preapprovalPlanId,
        payer_email: email,
        back_url: "https://estrategia.chromalab.com.ar",
        external_reference: userId,
        status: "pending",
      }),
    });
    const data = await mpRes.json();
    if (!mpRes.ok) {
      console.error("[mp-crear] error:", data);
      return res.status(502).json({ error: data.message || "Error de Mercado Pago" });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    await supabase.from("suscripciones").upsert({
      user_id: userId,
      plan,
      estado: "vencida",
      origen: "mercadopago",
      mp_preapproval_id: data.id,
    }, { onConflict: "user_id" });

    return res.status(200).json({ init_point: data.init_point });
  } catch (e) {
    console.error("[mp-crear] excepción:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
