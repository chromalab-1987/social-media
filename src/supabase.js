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
  const { data, error } = await supabase
    .from("clientes")
    .insert({ user_id: user.id, nombre, rubro: rubro || null })
    .select()
    .single();
  if (error) throw error;
  return data;
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
    .select("plan, estado, origen, vence_el")
    .maybeSingle();
  if (error) { console.warn("[sub] fetch:", error.message); return null; }
  return data;
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
