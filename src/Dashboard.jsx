/* ─────────────────────────────────────────────────────────────────
   src/Dashboard.jsx — Dashboard de clientes (pantalla 2 del mapa)
   Lista la cartera, permite abrir un cliente (carga perfil +
   última estrategia), crear uno nuevo, importar el perfil local
   del navegador como cliente, y cerrar sesión.
   ───────────────────────────────────────────────────────────────── */
import { useState, useEffect, useCallback } from "react";
import {
  fetchClientes, fetchDatosCliente, crearCliente, upsertPerfil,
  upsertEstrategia, borrarCliente, cerrarSesion,
} from "./supabase.js";
import { PERFIL_KEY } from "./Wizard.jsx";

const C = {
  bg: "#0C0C0F", surf2: "#1A1A24", surf3: "#22222E", border: "#2C2C3C",
  text: "#F2EDE4", muted: "#6B6B80", accent: "#7B35D4", accentLt: "#9F5FF0",
  accentDim: "#7B35D433", teal: "#2A9D8F", amber: "#E9C46A",
};
const FONT = "Georgia,serif";
const STRATEGY_KEY = "chroma_strategy_v1";

export default function Dashboard({ session, onElegir, onNuevo }) {
  const [clientes, setClientes] = useState(null);
  const [error, setError] = useState("");
  const [abriendo, setAbriendo] = useState("");
  const [importando, setImportando] = useState(false);

  const cargar = useCallback(async () => {
    try { setClientes(await fetchClientes()); setError(""); }
    catch (e) { setError("No pudimos cargar tus clientes. " + e.message); setClientes([]); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  /* Perfil local del navegador (para ofrecer importarlo) */
  const perfilLocal = (() => {
    try {
      const p = JSON.parse(localStorage.getItem(PERFIL_KEY));
      return p?.negocio && p?.diagnostico ? p : null;
    } catch { return null; }
  })();
  const yaImportado = perfilLocal && clientes?.some(
    (c) => c.nombre.trim().toLowerCase() === perfilLocal.negocio.trim().toLowerCase()
  );

  const abrir = async (cliente) => {
    setAbriendo(cliente.id);
    try {
      const datos = await fetchDatosCliente(cliente.id);
      onElegir(cliente, datos);
    } catch (e) { setError("No pudimos abrir el cliente. " + e.message); }
    setAbriendo("");
  };

  const importarLocal = async () => {
    if (!perfilLocal) return;
    setImportando(true);
    try {
      const c = await crearCliente(perfilLocal.negocio, perfilLocal.rubro || null);
      await upsertPerfil(c.id, perfilLocal);
      try {
        const est = JSON.parse(localStorage.getItem(STRATEGY_KEY));
        if (est?.strategy) await upsertEstrategia(c.id, est.form?.mes || "Sin mes", est);
      } catch { /* sin estrategia local */ }
      await cargar();
    } catch (e) { setError("No pudimos importar. " + e.message); }
    setImportando(false);
  };

  const eliminar = async (cliente) => {
    if (!window.confirm(`¿Eliminar a "${cliente.nombre}" y todos sus datos? Esta acción no se puede deshacer.`)) return;
    try { await borrarCliente(cliente.id); await cargar(); }
    catch (e) { setError("No pudimos eliminar. " + e.message); }
  };

  const estadoDe = (c) => {
    const tienePerfil = c.perfiles && (Array.isArray(c.perfiles) ? c.perfiles.length > 0 : true);
    const meses = (c.estrategias || []).length;
    if (meses > 0) return { txt: `${meses} ${meses === 1 ? "mes planificado" : "meses planificados"}`, color: C.teal };
    if (tienePerfil) return { txt: "Estrategia lista", color: C.accentLt };
    return { txt: "Sin perfil", color: C.muted };
  };

  const email = session?.user?.email || "";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Tus clientes
          </div>
          <button onClick={cerrarSesion} style={{
            background: "transparent", border: "none", color: C.muted,
            fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline",
          }}>Salir ({email})</button>
        </div>
        <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 400, letterSpacing: "-0.02em", margin: "0 0 24px", lineHeight: 1.2 }}>
          ¿Con quién trabajamos hoy?
        </h1>

        {error && (
          <div style={{ background: C.surf2, border: `1px solid ${C.amber}66`, borderRadius: 10, padding: "12px 16px", fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {clientes === null && (
          <p style={{ fontSize: 14, color: C.muted }}>✦ Cargando tu cartera…</p>
        )}

        {clientes !== null && (
          <div style={{ display: "grid", gap: 10 }}>

            {perfilLocal && !yaImportado && (
              <div style={{ background: C.surf2, border: `1px dashed ${C.accent}66`, borderRadius: 12, padding: "16px 18px" }}>
                <p style={{ fontSize: 14, margin: "0 0 4px" }}>
                  Encontramos <span style={{ color: C.accentLt }}>{perfilLocal.negocio}</span> en este navegador
                </p>
                <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
                  El perfil (y la estrategia si existe) se puede subir a tu cuenta como primer cliente.
                </p>
                <button onClick={importarLocal} disabled={importando} style={{
                  background: C.accent, border: "none", borderRadius: 100, color: C.text,
                  fontSize: 13, padding: "9px 20px", cursor: "pointer", fontFamily: FONT,
                }}>{importando ? "Importando…" : "Importar a mi cuenta →"}</button>
              </div>
            )}

            {clientes.map((c) => {
              const est = estadoDe(c);
              return (
                <div key={c.id} style={{
                  background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 12,
                  padding: "16px 18px", display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, margin: "0 0 2px" }}>{c.nombre}</p>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                      {c.rubro ? `${c.rubro} · ` : ""}<span style={{ color: est.color }}>{est.txt}</span>
                    </p>
                  </div>
                  <button onClick={() => eliminar(c)} title="Eliminar cliente" style={{
                    background: "transparent", border: "none", color: C.muted,
                    fontSize: 13, cursor: "pointer", fontFamily: FONT, padding: "4px 6px",
                  }}>✕</button>
                  <button onClick={() => abrir(c)} disabled={!!abriendo} style={{
                    background: C.accent, border: "none", borderRadius: 100, color: C.text,
                    fontSize: 13, padding: "9px 18px", cursor: "pointer", fontFamily: FONT, flexShrink: 0,
                  }}>{abriendo === c.id ? "Abriendo…" : "Abrir →"}</button>
                </div>
              );
            })}

            <button onClick={onNuevo} style={{
              background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 12,
              color: C.muted, fontSize: 14, padding: "16px 18px", cursor: "pointer",
              fontFamily: FONT, textAlign: "center",
            }}>+ Nuevo cliente</button>

            {clientes.length === 0 && !perfilLocal && (
              <p style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 8, lineHeight: 1.6 }}>
                Tu cartera está vacía. Creá tu primer cliente y el modo guiado arma su estrategia.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
