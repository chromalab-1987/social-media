/* ─────────────────────────────────────────────────────────────────
   src/supabase.js — Cliente de Supabase + capa de datos
   Si las variables VITE_SUPABASE_* no están configuradas, exporta
   null y la app funciona en modo local (localStorage) como siempre.
   ───────────────────────────────────────────────────────────────── */
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

/* ── Auth ── */
export async function loginConGoogle() {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
}

export async function cerrarSesion() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/* ── Clientes ── */
export async function fetchClientes() {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, rubro, updated_at, perfiles(updated_at), estrategias(mes, updated_at)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function crearCliente(nombre, rubro) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Sin sesión");
  /* Si ya existe un cliente con ese nombre para este usuario, lo
     reusamos (evita duplicados por doble llamada). */
  const { data: existente } = await supabase
    .from("clientes")
    .select("id, nombre, rubro")
    .eq("user_id", user.id)
    .ilike("nombre", nombre.trim())
    .maybeSingle();
  if (existente) return existente;
  const { data, error } = await supabase
    .from("clientes")
    .insert({ user_id: user.id, nombre: nombre.trim(), rubro: rubro || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* Limpia duplicados: para cada nombre repetido, conserva el que
   tiene perfil (o el más reciente) y borra los vacíos. */
export async function limpiarDuplicados() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { borrados: 0 };
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, updated_at, perfiles(cliente_id)")
    .eq("user_id", user.id);
  if (!clientes) return { borrados: 0 };

  const porNombre = {};
  for (const c of clientes) {
    const k = c.nombre.trim().toLowerCase();
    (porNombre[k] ||= []).push(c);
  }
  const aBorrar = [];
  for (const grupo of Object.values(porNombre)) {
    if (grupo.length < 2) continue;
    /* ordenar: primero los que tienen perfil, luego más recientes */
    grupo.sort((a, b) => {
      const pa = a.perfiles?.length ? 1 : 0, pb = b.perfiles?.length ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
    aBorrar.push(...grupo.slice(1).map((c) => c.id)); // conservar el primero
  }
  if (aBorrar.length) {
    await supabase.from("clientes").delete().in("id", aBorrar);
  }
  return { borrados: aBorrar.length };
}

export async function borrarCliente(clienteId) {
  const { error } = await supabase.from("clientes").delete().eq("id", clienteId);
  if (error) throw error;
}

/* ── Perfil (una versión viva por cliente: se pisa) ── */
export async function upsertPerfil(clienteId, data) {
  const { error } = await supabase
    .from("perfiles")
    .upsert({ cliente_id: clienteId, data }, { onConflict: "cliente_id" });
  if (error) throw error;
}

/* ── Estrategia RRSS (una fila por cliente y mes) ── */
export async function upsertEstrategia(clienteId, mes, data) {
  const { error } = await supabase
    .from("estrategias")
    .upsert({ cliente_id: clienteId, mes: mes || "Sin mes", data }, { onConflict: "cliente_id,mes" });
  if (error) throw error;
}

/* ── Suscripción del usuario actual ── */
export async function fetchSuscripcion() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("suscripciones")
    .select("plan, estado, origen, vence_el, mp_preapproval_id")
    .maybeSingle();
  if (error) { console.warn("[sub] fetch:", error.message); return null; }
  return data;
}

/* Inicia el checkout de Mercado Pago: devuelve el link de pago. */
export async function crearSuscripcionMP(plan) {
  const { data: u } = await supabase.auth.getUser();
  const user = u?.user;
  if (!user) throw new Error("Sin sesión");
  const r = await fetch("/api/mp-crear-suscripcion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, userId: user.id, email: user.email }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "No se pudo iniciar el pago");
  return d.init_point;
}

/* Token de sesión (para llamadas autenticadas al backend admin). */
export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

/* ── Carga completa de un cliente (perfil + última estrategia) ── */
export async function fetchDatosCliente(clienteId) {
  const [p, e] = await Promise.all([
    supabase.from("perfiles").select("data").eq("cliente_id", clienteId).maybeSingle(),
    supabase.from("estrategias").select("mes, data, updated_at")
      .eq("cliente_id", clienteId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (p.error) throw p.error;
  if (e.error) throw e.error;
  return {
    perfil: p.data?.data || null,
    estrategia: e.data?.data || null,
    estrategiaMes: e.data?.mes || null,
  };
}
