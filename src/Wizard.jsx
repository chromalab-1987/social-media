/* ─────────────────────────────────────────────────────────────────
   src/Wizard.jsx — Wizard de captura del perfil estratégico
   16 pantallas / 3 bloques. Consume los esquemas de strategy.js.
   Persistencia parcial en localStorage. Al confirmar, entrega el
   perfil completo + el mapeo a los campos del form existente.
   ───────────────────────────────────────────────────────────────── */
import { useState, useEffect } from "react";
import {
  RUBROS, ETAPAS, OBJETIVOS_NEGOCIO,
  BUYER_EDADES, BUYER_TIPOS, BUYER_MOTIVADORES, BUYER_FRENOS,
  DIFERENCIALES, OBJETIVOS_MKT, PLAZOS_META, CANALES, HORIZONTES,
  PERFIL_VACIO, validarPerfil,
} from "./strategy.js";

/* Tema — espejo del objeto C de App.jsx */
const C = {
  bg: "#0C0C0F", surface: "#13131A", surf2: "#1A1A24", surf3: "#22222E",
  border: "#2C2C3C", text: "#F2EDE4", muted: "#6B6B80",
  accent: "#7B35D4", accentLt: "#9F5FF0", accentDim: "#7B35D433",
};
const FONT = "Georgia,serif";
const WIZARD_KEY = "chroma_wizard_v1";
export const PERFIL_KEY = "chroma_perfil_v1";

/* ── Mapeo perfil → campos del form existente (desembocadura provisoria) ── */
const TONO_POR_MOTIVADOR = {
  precio: "Minimalista y directo",
  calidad: "Educativo y experto",
  comodidad: "Minimalista y directo",
  status: "Lujoso y exclusivo",
  confianza: "Profesional pero cercano",
  experiencia: "Divertido y casual",
};
const PILARES_POR_MKT = {
  awareness:  ["Educativo", "Entretenimiento", "Inspiracional"],
  leads:      ["Educativo", "Promocional"],
  conversion: ["Promocional", "Educativo", "UGC"],
  retencion:  ["UGC", "Behind the scenes", "Inspiracional"],
};
const label = (list, key) => list.find((o) => o.key === key)?.label || "";

export function mapPerfilToForm(p) {
  const mkt = label(OBJETIVOS_MKT, p.objetivoMkt.tipo);
  const objetivo = [
    label(OBJETIVOS_NEGOCIO, p.objetivoNegocio),
    mkt && `Marketing: ${mkt}`,
    p.objetivoMkt.meta && `Meta: ${p.objetivoMkt.meta} en ${p.objetivoMkt.plazo}`,
  ].filter(Boolean).join(". ");
  const audiencia = [
    p.buyer.descripcion,
    p.buyer.edad && `Edad: ${p.buyer.edad}`,
    p.buyer.tipo && label(BUYER_TIPOS, p.buyer.tipo),
    p.buyer.motivador && `Compra por: ${label(BUYER_MOTIVADORES, p.buyer.motivador)}`,
    p.buyer.freno && `Freno: ${label(BUYER_FRENOS, p.buyer.freno)}`,
  ].filter(Boolean).join(". ");
  return {
    negocio: p.negocio,
    sitioWeb: p.sitioWeb || "",
    industria: p.rubro === "otro" ? p.rubroOtro : label(RUBROS, p.rubro),
    audiencia,
    objetivo,
    tono: TONO_POR_MOTIVADOR[p.buyer.motivador] || "Profesional pero cercano",
    pilares: PILARES_POR_MKT[p.objetivoMkt.tipo] || [],
  };
}

/* ── UI helpers ── */
const inputStyle = {
  width: "100%", boxSizing: "border-box", background: C.surf2,
  border: `1px solid ${C.border}`, borderRadius: 10, color: C.text,
  fontSize: 15, padding: "14px 16px", fontFamily: FONT, outline: "none",
};

function Opt({ selected, onClick, children, small }) {
  return (
    <button onClick={onClick} style={{
      display: "block", width: "100%", textAlign: "left", boxSizing: "border-box",
      background: selected ? C.accentDim : C.surf2,
      border: `1px solid ${selected ? C.accent : C.border}`,
      borderRadius: 10, color: selected ? C.accentLt : C.text,
      fontSize: small ? 13 : 14, padding: small ? "11px 14px" : "14px 16px",
      cursor: "pointer", fontFamily: FONT, transition: "all .15s",
    }}>{children}</button>
  );
}

function NavBtns({ onBack, onNext, nextLabel = "Siguiente", nextDisabled, hideNext }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
      <button onClick={onBack} style={{
        background: "transparent", border: `1px solid ${C.border}`, borderRadius: 100,
        color: C.muted, fontSize: 13, padding: "10px 22px", cursor: "pointer", fontFamily: FONT,
        visibility: onBack ? "visible" : "hidden",
      }}>← Atrás</button>
      {!hideNext && (
        <button onClick={onNext} disabled={nextDisabled} style={{
          background: nextDisabled ? C.surf3 : C.accent, border: "none", borderRadius: 100,
          color: nextDisabled ? C.muted : C.text, fontSize: 13, padding: "10px 26px",
          cursor: nextDisabled ? "default" : "pointer", fontFamily: FONT,
        }}>{nextLabel}</button>
      )}
    </div>
  );
}

const BLOQUES = [
  { desde: 0,  hasta: 3,  nombre: "Contexto" },
  { desde: 4,  hasta: 10, nombre: "Audiencia y mensaje" },
  { desde: 11, hasta: 15, nombre: "Objetivos y ejecución" },
];
const TOTAL = 16;

/* ═══ Componente principal ═══ */
export default function Wizard({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [perfil, setPerfil] = useState({ ...PERFIL_VACIO, negocio: "", sitioWeb: "" });
  const [restored, setRestored] = useState(false);

  /* Restaurar progreso parcial */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WIZARD_KEY));
      if (saved?.perfil) { setPerfil(saved.perfil); setStep(saved.step || 0); setRestored(true); }
    } catch { /* sin progreso previo */ }
  }, []);

  /* Guardar a cada cambio */
  useEffect(() => {
    localStorage.setItem(WIZARD_KEY, JSON.stringify({ step, perfil }));
  }, [step, perfil]);

  const set = (patch) => setPerfil((p) => ({ ...p, ...patch }));
  const setBuyer = (patch) => setPerfil((p) => ({ ...p, buyer: { ...p.buyer, ...patch } }));

  const next = () => setStep((s) => Math.min(s + 1, TOTAL - 1));
  const back = step > 0 ? () => setStep((s) => s - 1) : null;
  /* Selección única: guarda y auto-avanza */
  const pick = (patch) => { set(patch); setTimeout(next, 220); };
  const pickBuyer = (patch) => { setBuyer(patch); setTimeout(next, 220); };

  const confirmar = () => {
    const { valido } = validarPerfil(perfil);
    if (!valido) return;
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
    localStorage.removeItem(WIZARD_KEY);
    onComplete(perfil, mapPerfilToForm(perfil));
  };

  const bloque = BLOQUES.find((b) => step >= b.desde && step <= b.hasta);
  const pv = perfil.propuestaValor;

  /* ── Contenido por paso ── */
  let body = null, title = "", hint = "";

  if (step === 0) {
    title = "¿Cómo se llama tu negocio?";
    body = (<>
      <input style={inputStyle} value={perfil.negocio} placeholder="Nombre del negocio"
        onChange={(e) => set({ negocio: e.target.value })} autoFocus />
      <input style={{ ...inputStyle, marginTop: 12 }} value={perfil.sitioWeb} placeholder="Sitio web o Instagram (opcional)"
        onChange={(e) => set({ sitioWeb: e.target.value })} />
      <NavBtns onBack={back} onNext={next} nextDisabled={!perfil.negocio.trim()} />
    </>);
  }

  if (step === 1) {
    title = "¿En qué rubro está?";
    body = (<>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {RUBROS.map((r) => (
          <Opt key={r.key} small selected={perfil.rubro === r.key}
            onClick={() => r.key === "otro" ? set({ rubro: "otro" }) : pick({ rubro: r.key, rubroOtro: "" })}>
            {r.label}
          </Opt>
        ))}
      </div>
      {perfil.rubro === "otro" && (<>
        <input style={{ ...inputStyle, marginTop: 12 }} value={perfil.rubroOtro} placeholder="¿Cuál?"
          onChange={(e) => set({ rubroOtro: e.target.value })} autoFocus />
        <NavBtns onBack={back} onNext={next} nextDisabled={!perfil.rubroOtro.trim()} />
      </>)}
      {perfil.rubro !== "otro" && <NavBtns onBack={back} hideNext />}
    </>);
  }

  if (step === 2) {
    title = "¿En qué etapa está el negocio?";
    body = (<>
      <div style={{ display: "grid", gap: 8 }}>
        {ETAPAS.map((e) => (
          <Opt key={e.key} selected={perfil.etapa === e.key} onClick={() => pick({ etapa: e.key })}>{e.label}</Opt>
        ))}
      </div>
      <NavBtns onBack={back} hideNext />
    </>);
  }

  if (step === 3) {
    title = "Si esto funciona perfecto, ¿qué cambia en 6 meses?";
    hint = "El objetivo de fondo del negocio — el marketing es el medio.";
    body = (<>
      <div style={{ display: "grid", gap: 8 }}>
        {OBJETIVOS_NEGOCIO.map((o) => (
          <Opt key={o.key} selected={perfil.objetivoNegocio === o.key} onClick={() => pick({ objetivoNegocio: o.key })}>{o.label}</Opt>
        ))}
      </div>
      <NavBtns onBack={back} hideNext />
    </>);
  }

  if (step === 4) {
    title = "Pensá en tu mejor cliente. ¿Qué edad tiene?";
    body = (<>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {BUYER_EDADES.map((e) => (
          <Opt key={e} small selected={perfil.buyer.edad === e} onClick={() => pickBuyer({ edad: e })}>{e}</Opt>
        ))}
      </div>
      <NavBtns onBack={back} hideNext />
    </>);
  }

  if (step === 5) {
    title = "¿A quién le vendés?";
    body = (<>
      <div style={{ display: "grid", gap: 8 }}>
        {BUYER_TIPOS.map((t) => (
          <Opt key={t.key} selected={perfil.buyer.tipo === t.key} onClick={() => pickBuyer({ tipo: t.key })}>{t.label}</Opt>
        ))}
      </div>
      <NavBtns onBack={back} hideNext />
    </>);
  }

  if (step === 6) {
    title = "¿Qué es lo que más pesa cuando te compra?";
    body = (<>
      <div style={{ display: "grid", gap: 8 }}>
        {BUYER_MOTIVADORES.map((m) => (
          <Opt key={m.key} selected={perfil.buyer.motivador === m.key} onClick={() => pickBuyer({ motivador: m.key })}>{m.label}</Opt>
        ))}
      </div>
      <NavBtns onBack={back} hideNext />
    </>);
  }

  if (step === 7) {
    title = "¿Qué es lo que más lo frena antes de comprarte?";
    body = (<>
      <div style={{ display: "grid", gap: 8 }}>
        {BUYER_FRENOS.map((f) => (
          <Opt key={f.key} selected={perfil.buyer.freno === f.key} onClick={() => pickBuyer({ freno: f.key })}>{f.label}</Opt>
        ))}
      </div>
      <NavBtns onBack={back} hideNext />
    </>);
  }

  if (step === 8) {
    title = "Describí a tu cliente ideal en una línea";
    hint = "Ej: \"Mujeres 30-45 que buscan ropa cómoda para trabajar desde casa\".";
    body = (<>
      <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
        value={perfil.buyer.descripcion} placeholder="Tu cliente ideal…"
        onChange={(e) => setBuyer({ descripcion: e.target.value })} autoFocus />
      <NavBtns onBack={back} onNext={next} nextDisabled={!perfil.buyer.descripcion.trim()} />
    </>);
  }

  if (step === 9) {
    title = "¿Por qué te eligen a vos y no a otro?";
    body = (<>
      <div style={{ display: "grid", gap: 8 }}>
        {DIFERENCIALES.map((d) => (
          <Opt key={d.key} selected={pv.diferencial === d.key}
            onClick={() => pick({ propuestaValor: { ...pv, diferencial: d.key } })}>{d.label}</Opt>
        ))}
      </div>
      <NavBtns onBack={back} hideNext />
    </>);
  }

  if (step === 10) {
    title = "Tu propuesta de valor, en una frase";
    hint = "Pre-armada con lo que ya contaste — completá los huecos y ajustala a tu voz.";
    const sugerida = `Para ${perfil.buyer.descripcion || "[cliente ideal]"}, que [problema o necesidad], ${perfil.negocio || "[negocio]"} es [qué es / qué hace], a diferencia de [competencia], porque ${label(DIFERENCIALES, pv.diferencial).toLowerCase() || "[diferencial]"}.`;
    body = (<>
      <textarea style={{ ...inputStyle, minHeight: 130, resize: "vertical", lineHeight: 1.6 }}
        value={pv.frase} placeholder={sugerida}
        onChange={(e) => set({ propuestaValor: { ...pv, frase: e.target.value } })} autoFocus />
      {!pv.frase && (
        <button onClick={() => set({ propuestaValor: { ...pv, frase: sugerida } })} style={{
          marginTop: 10, background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 100,
          color: C.accentLt, fontSize: 12, padding: "8px 16px", cursor: "pointer", fontFamily: FONT,
        }}>✦ Usar la frase pre-armada y editarla</button>
      )}
      <NavBtns onBack={back} onNext={next} nextDisabled={!pv.frase.trim()} />
    </>);
  }

  if (step === 11) {
    title = "¿Qué tiene que lograr el marketing?";
    hint = "Una sola cosa. De acá se desprende todo lo táctico.";
    body = (<>
      <div style={{ display: "grid", gap: 8 }}>
        {OBJETIVOS_MKT.map((o) => (
          <Opt key={o.key} selected={perfil.objetivoMkt.tipo === o.key}
            onClick={() => pick({ objetivoMkt: { ...perfil.objetivoMkt, tipo: o.key } })}>{o.label}</Opt>
        ))}
      </div>
      <NavBtns onBack={back} hideNext />
    </>);
  }

  if (step === 12) {
    const META_POR_MKT = {
      awareness:  { titulo: "¿Cuántos seguidores nuevos querés sumar?",       ph: "ej: 500",  hint: "Seguidores o alcance nuevo — el número que dice que más gente te conoce." },
      leads:      { titulo: "¿Cuántos contactos querés conseguir?",           ph: "ej: 100",  hint: "Personas que dejan su contacto o piden info — tu lista de interesados." },
      conversion: { titulo: "¿Cuántas ventas querés lograr?",                 ph: "ej: 30",   hint: "Ventas o pedidos concretos. Vago no sirve — medible sí." },
      retencion:  { titulo: "¿Cuántos clientes querés que vuelvan a comprar?", ph: "ej: 20",  hint: "Recompras o clientes reactivados de tu base actual." },
    };
    const meta = META_POR_MKT[perfil.objetivoMkt.tipo] || {
      titulo: "Ponele un número y un plazo", ph: "ej: 30",
      hint: "Ej: 30 ventas, 100 leads, 500 seguidores. Vago no sirve — medible sí.",
    };
    title = meta.titulo;
    hint = `${meta.hint} ¿Y en cuánto tiempo?`;
    body = (<>
      <input type="number" min="1" style={inputStyle} value={perfil.objetivoMkt.meta || ""}
        placeholder={meta.ph}
        onChange={(e) => set({ objetivoMkt: { ...perfil.objetivoMkt, meta: e.target.value } })} autoFocus />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        {PLAZOS_META.map((p) => (
          <Opt key={p} small selected={perfil.objetivoMkt.plazo === p}
            onClick={() => set({ objetivoMkt: { ...perfil.objetivoMkt, plazo: p } })}>{p}</Opt>
        ))}
      </div>
      <NavBtns onBack={back} onNext={next}
        nextDisabled={!perfil.objetivoMkt.meta || Number(perfil.objetivoMkt.meta) <= 0 || !perfil.objetivoMkt.plazo} />
    </>);
  }

  if (step === 13) {
    title = "¿Dónde pasa tiempo tu cliente ideal?";
    hint = "Elegí todos los que apliquen — después el sistema prioriza.";
    const toggle = (key) => set({
      canales: perfil.canales.includes(key)
        ? perfil.canales.filter((c) => c !== key)
        : [...perfil.canales, key],
    });
    body = (<>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {CANALES.map((c) => (
          <Opt key={c.key} small selected={perfil.canales.includes(c.key)} onClick={() => toggle(c.key)}>
            {perfil.canales.includes(c.key) ? "✓ " : ""}{c.label}
          </Opt>
        ))}
      </div>
      <NavBtns onBack={back} onNext={next} nextDisabled={perfil.canales.length === 0} />
    </>);
  }

  if (step === 14) {
    title = "¿Para qué plazo pensamos esta estrategia?";
    body = (<>
      <div style={{ display: "grid", gap: 8 }}>
        {HORIZONTES.map((h) => (
          <Opt key={h.key} selected={perfil.horizonte === h.key} onClick={() => set({ horizonte: h.key })}>{h.label}</Opt>
        ))}
      </div>
      <input style={{ ...inputStyle, marginTop: 14 }} value={perfil.fechaClave}
        placeholder="¿Alguna fecha clave? Lanzamiento, temporada alta… (opcional)"
        onChange={(e) => set({ fechaClave: e.target.value })} />
      <NavBtns onBack={back} onNext={next} nextDisabled={!perfil.horizonte} />
    </>);
  }

  if (step === 15) {
    title = "Así queda tu perfil estratégico";
    hint = "Revisá que refleje bien tu negocio antes de continuar.";
    const { valido, faltantes } = validarPerfil(perfil);
    const filas = [
      ["Negocio", perfil.negocio + (perfil.sitioWeb ? ` · ${perfil.sitioWeb}` : "")],
      ["Rubro", perfil.rubro === "otro" ? perfil.rubroOtro : label(RUBROS, perfil.rubro)],
      ["Etapa", label(ETAPAS, perfil.etapa)],
      ["Objetivo de negocio", label(OBJETIVOS_NEGOCIO, perfil.objetivoNegocio)],
      ["Cliente ideal", `${perfil.buyer.descripcion} (${perfil.buyer.edad || "—"} · ${label(BUYER_TIPOS, perfil.buyer.tipo)})`],
      ["Compra por / lo frena", `${label(BUYER_MOTIVADORES, perfil.buyer.motivador)} / ${label(BUYER_FRENOS, perfil.buyer.freno)}`],
      ["Propuesta de valor", pv.frase],
      ["Objetivo de marketing", `${label(OBJETIVOS_MKT, perfil.objetivoMkt.tipo)} — ${perfil.objetivoMkt.meta} en ${perfil.objetivoMkt.plazo}`],
      ["Canales", perfil.canales.map((k) => label(CANALES, k)).join(", ")],
      ["Horizonte", label(HORIZONTES, perfil.horizonte) + (perfil.fechaClave ? ` · Fecha clave: ${perfil.fechaClave}` : "")],
    ];
    body = (<>
      <div style={{ display: "grid", gap: 10 }}>
        {filas.map(([k, v], i) => (
          <div key={i} style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{v || "—"}</div>
          </div>
        ))}
      </div>
      {!valido && (
        <div style={{ marginTop: 14, fontSize: 13, color: "#E9C46A" }}>
          Falta completar: {faltantes.join(", ")}.
        </div>
      )}
      <NavBtns onBack={back} onNext={confirmar} nextLabel="Confirmar y continuar →" nextDisabled={!valido} />
    </>);
  }

  /* ── Layout ── */
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {bloque.nombre} · paso {step + 1} de {TOTAL}
          </div>
          <button onClick={onSkip} style={{
            background: "transparent", border: "none", color: C.muted,
            fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline",
          }}>Modo rápido →</button>
        </div>

        <div style={{ display: "flex", gap: 3, marginBottom: 36 }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? C.accent : C.surf3, transition: "background .2s",
            }} />
          ))}
        </div>

        {restored && step > 0 && (
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>
            ✦ Retomaste donde lo dejaste.
          </div>
        )}

        <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 400, letterSpacing: "-0.02em", margin: "0 0 8px", lineHeight: 1.2 }}>
          {title}
        </h1>
        {hint && <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px", lineHeight: 1.6 }}>{hint}</p>}
        {!hint && <div style={{ height: 24 }} />}

        {body}
      </div>
    </div>
  );
}
