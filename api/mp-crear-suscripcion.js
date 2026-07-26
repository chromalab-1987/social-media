/* ─────────────────────────────────────────────────────────────────
   /api/mp-crear-suscripcion.js
   Con planes pre-creados en el panel de MP, el pago se hace en el
   CHECKOUT HOSTEADO del plan (el link del plan), no vía API directa.
   Este endpoint arma ese link con el external_reference del usuario
   y guarda el vínculo para que el webhook sepa a quién activar.
   Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE.
   ───────────────────────────────────────────────────────────────── */
import { createClient } from "@supabase/supabase-js";

/* Link de checkout de cada plan (los que copiaste del panel de MP).
   Es la pantalla hosteada donde el usuario carga su tarjeta. */
const PLAN_CHECKOUT = {
  empresa:     "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=6a234288eaa841eab60766a4f61d8510",
  estudio:     "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=1c1dab80479740b0b5a43d34450a85aa",
  agencia:     "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=723945258ef9423e85f0a5b2d183aeff",
  agencia_pro: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=22eb127748784d188216dbdb080492e0",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { plan, userId, email } = req.body || {};
  if (!plan || !userId) return res.status(400).json({ error: "faltan datos" });

  const base = PLAN_CHECKOUT[plan];
  if (!base) return res.status(400).json({ error: "plan inválido" });

  try {
    /* Guardar el vínculo user ↔ plan (aún no activa).
       El webhook, cuando MP confirme, cruza por external_reference. */
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    await supabase.from("suscripciones").upsert({
      user_id: userId,
      plan,
      estado: "vencida",
      origen: "mercadopago",
    }, { onConflict: "user_id" });

    /* Agregamos external_reference al link del checkout: así el
       webhook sabe qué usuario pagó. */
    const url = `${base}&external_reference=${encodeURIComponent(userId)}`;
    return res.status(200).json({ init_point: url });
  } catch (e) {
    console.error("[mp-crear] excepción:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
