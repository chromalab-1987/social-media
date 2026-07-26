/* ─────────────────────────────────────────────────────────────────
   /api/mp-webhook.js  (PRODUCCIÓN — con validación de firma)
   Mercado Pago llama acá cuando cambia una suscripción. Valida la
   firma HMAC de MP antes de confiar en la notificación, consulta el
   estado real y actualiza `suscripciones`.
   Variables: MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, SUPABASE_URL,
              SUPABASE_SERVICE_ROLE.
   ───────────────────────────────────────────────────────────────── */
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function vencimientoDesde(fechaISO) {
  const d = fechaISO ? new Date(fechaISO) : new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(d.getDate() + 2); // margen para el reintento de MP
  return d.toISOString();
}

/* Valida la firma x-signature que envía Mercado Pago.
   Si no hay secret configurado, no bloquea (útil en pruebas). */
function firmaValida(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sin secret configurado: no validar (test)

  const xSignature = req.headers["x-signature"];
  const xRequestId = req.headers["x-request-id"];
  if (!xSignature) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=").map((s) => s.trim()))
  );
  const ts = parts.ts, hash = parts.v1;
  if (!ts || !hash) return false;

  const dataId = req.query?.["data.id"] || req.query?.id || req.body?.data?.id || "";
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const computed = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return computed === hash;
}

export default async function handler(req, res) {
  const token = process.env.MP_ACCESS_TOKEN;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

  try {
    if (!firmaValida(req)) {
      console.warn("[webhook] firma inválida — ignorado");
      return res.status(200).json({ ok: true, badSignature: true });
    }

    const type = req.body?.type || req.query?.type;
    const id = req.body?.data?.id || req.query?.id || req.query?.["data.id"];

    if (type !== "subscription_preapproval" && type !== "preapproval") {
      return res.status(200).json({ ok: true, ignored: type });
    }
    if (!id) return res.status(200).json({ ok: true, noId: true });

    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const sub = await mpRes.json();
    if (!mpRes.ok) {
      console.error("[webhook] no se pudo leer preapproval:", sub);
      return res.status(200).json({ ok: true });
    }

    const userId = sub.external_reference;
    if (!userId) return res.status(200).json({ ok: true, noRef: true });

    let estado, vence_el = null;
    if (sub.status === "authorized") {
      estado = "activa";
      vence_el = vencimientoDesde(sub.last_modified || sub.date_created);
    } else if (sub.status === "paused" || sub.status === "cancelled") {
      estado = "cancelada";
    } else {
      estado = "vencida";
    }

    await supabase.from("suscripciones").update({
      estado, vence_el, mp_preapproval_id: sub.id,
    }).eq("user_id", userId);

    return res.status(200).json({ ok: true, estado });
  } catch (e) {
    console.error("[webhook] excepción:", e.message);
    return res.status(200).json({ ok: true }); // siempre 200: evita reintentos en loop
  }
}
