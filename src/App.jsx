import { useState } from "react";

/* ─── THEME ─────────────────────────────────────────────────────── */
const C = {
  bg:       "#0C0C0F",
  surface:  "#13131A",
  surf2:    "#1A1A24",
  surf3:    "#22222E",
  border:   "#2C2C3C",
  text:     "#F2EDE4",
  muted:    "#6B6B80",
  accent:   "#7B35D4",
  accentLt: "#9F5FF0",
  accentDim:"#7B35D433",
};

const NET_COLOR = {
  "Instagram":   "#E1306C",
  "LinkedIn":    "#0A7CB5",
  "TikTok":      "#FF004F",
  "Facebook":    "#1877F2",
  "X (Twitter)": "#1DA1F2",
  "Pinterest":   "#E60023",
};

const TIPOS_POR_RED = {
  "Instagram":   ["Posts", "Historias", "Reels"],
  "LinkedIn":    ["Posts", "Historias", "Artículos"],
  "TikTok":      ["Videos", "Lives"],
  "Facebook":    ["Posts", "Historias", "Reels"],
  "X (Twitter)": ["Tweets", "Hilos"],
  "Pinterest":   ["Pines"],
};

const REDES   = Object.keys(TIPOS_POR_RED);
const PILARES = ["Educativo","Inspiracional","Entretenimiento","Promocional","Behind the scenes","UGC"];
const MESES   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const TONOS   = ["Profesional pero cercano","Inspiracional y aspiracional","Educativo y experto","Divertido y casual","Lujoso y exclusivo","Minimalista y directo","Empático y humano"];
const PALETTE_PRESETS = ["#7B35D4","#F2EDE4","#0C0C0F","#E63946","#2A9D8F","#F4A261","#264653","#E9C46A","#A8DADC","#FF6B6B"];
const DEFAULTS_BY_INDEX = [3, 5, 2, 1];

const getMonthOptions = () => {
  const d = new Date();
  return Array.from({length:13},(_,i)=>{
    const m = new Date(d.getFullYear(), d.getMonth()+i, 1);
    return { label:`${MESES[m.getMonth()]} ${m.getFullYear()}`, value:`${MESES[m.getMonth()]} ${m.getFullYear()}` };
  });
};

/* ─── API ────────────────────────────────────────────────────────── */
const cleanJSON = txt => txt.replace(/```json|```/g,"").trim();

const callClaude = async (messages, maxTokens=4000) => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: maxTokens }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error de API");
  return data.text;
};

/* ─── COMPONENTS ─────────────────────────────────────────────────── */
function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      width:42, height:22, borderRadius:11, flexShrink:0,
      background: on ? C.accent : C.border,
      position:"relative", cursor:"pointer", transition:"background .2s"
    }}>
      <div style={{
        position:"absolute", width:16, height:16, borderRadius:8,
        background:C.text, top:3, left: on ? 23 : 3, transition:"left .2s"
      }}/>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", padding:"3px 9px",
      borderRadius:100, fontSize:11, fontFamily:"Georgia,serif",
      background:`${color}1A`, color:color, border:`1px solid ${color}40`,
      whiteSpace:"nowrap", letterSpacing:"0.04em"
    }}>{label}</span>
  );
}

function Stepper({ value, onChange, min=0, max=14 }) {
  const btn = (side) => ({
    width:26, height:26, background:C.surf3, border:"none", color:C.text,
    borderRadius: side==="l" ? "6px 0 0 6px" : "0 6px 6px 0",
    cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center"
  });
  return (
    <div style={{display:"flex",alignItems:"center"}}>
      <button style={btn("l")} onClick={()=>onChange(Math.max(min,value-1))}>−</button>
      <span style={{
        width:34, height:26, background:C.bg, fontFamily:"Georgia,serif",
        borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:13, color: value===0 ? C.muted : C.accentLt
      }}>{value}</span>
      <button style={btn("r")} onClick={()=>onChange(Math.min(max,value+1))}>+</button>
    </div>
  );
}

function PostCard({ post, semanaNum, onEdit, onRegenerate, regeneratingId }) {
  const netColor = NET_COLOR[post.red] || C.accent;
  const isRegen  = regeneratingId === post.id;
  return (
    <div className="post-card" style={{
      background:C.surface, borderRadius:10, marginBottom:10,
      borderLeft:`3px solid ${netColor}`,
      opacity: isRegen ? 0.55 : 1, transition:"opacity .25s"
    }}>
      <div style={{ padding:"12px 16px 10px", display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", borderBottom:`1px solid ${C.border}` }}>
        <Badge label={post.red}   color={netColor} />
        <Badge label={post.tipo}  color={C.accent} />
        <Badge label={post.pilar} color={C.muted}  />
        {post.dia && <span style={{ fontSize:11, color:C.muted, fontFamily:"Georgia,serif", marginLeft:"auto", paddingRight:8 }}>{post.dia}</span>}
        <button onClick={()=>onRegenerate(semanaNum,post)} disabled={isRegen} style={{
          background:"transparent", border:`1px solid ${C.border}`, borderRadius:6,
          color: isRegen ? C.muted : C.accentLt, fontSize:11, padding:"4px 10px",
          cursor:"pointer", fontFamily:"Georgia,serif", marginLeft: post.dia ? 0 : "auto"
        }}>
          {isRegen ? "regenerando…" : "↺ Regenerar"}
        </button>
      </div>
      <div style={{ padding:"12px 16px 14px" }}>
        <textarea
          value={post.copy}
          onChange={e=>onEdit(semanaNum,post.id,"copy",e.target.value)}
          style={{
            width:"100%", background:C.surf2, border:`1px solid ${C.border}`,
            borderRadius:8, color:C.text, fontSize:13, lineHeight:1.75,
            padding:"10px 13px", resize:"vertical", minHeight:72,
            fontFamily:"Georgia,serif", boxSizing:"border-box", outline:"none"
          }}
        />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
          <div>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:5, fontFamily:"Georgia,serif" }}>Hashtags</div>
            <input value={post.hashtags} onChange={e=>onEdit(semanaNum,post.id,"hashtags",e.target.value)} style={{
              width:"100%", background:C.surf2, border:`1px solid ${C.border}`,
              borderRadius:6, color:C.accentLt, fontSize:12, padding:"8px 11px",
              fontFamily:"Georgia,serif", outline:"none", boxSizing:"border-box"
            }} />
          </div>
          <div>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:5, fontFamily:"Georgia,serif" }}>CTA</div>
            <input value={post.cta} onChange={e=>onEdit(semanaNum,post.id,"cta",e.target.value)} style={{
              width:"100%", background:C.surf2, border:`1px solid ${C.border}`,
              borderRadius:6, color:C.text, fontSize:12, padding:"8px 11px",
              fontFamily:"Georgia,serif", outline:"none", boxSizing:"border-box"
            }} />
          </div>
        </div>
        {post.promptImagen && (
          <div style={{ marginTop:10 }}>
            <div style={{ fontSize:10, color:'#9F5FF0', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5, fontFamily:'Georgia,serif' }}>🎨 Prompt de imagen</div>
            <textarea
              value={post.promptImagen}
              onChange={e=>onEdit(semanaNum,post.id,'promptImagen',e.target.value)}
              style={{
                width:'100%', background:'#1A1A24', border:`1px solid #9F5FF040`,
                borderRadius:6, color:'#C8A8F0', fontSize:12, lineHeight:1.6,
                padding:'8px 11px', resize:'vertical', minHeight:48,
                fontFamily:'Georgia,serif', boxSizing:'border-box', outline:'none'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── APP ────────────────────────────────────────────────────────── */
export default function App() {
  const MONTHS = getMonthOptions();
  const [form, setForm] = useState({
    negocio:"", industria:"", sitioWeb:"", audiencia:"", objetivo:"",
    mes: MONTHS[1].value, tono: TONOS[0], redes:[], pilares:[],
  });
  const [contenido, setContenido]     = useState({});
  const [usePalette, setUsePalette]   = useState(false);
  const [palette, setPalette]         = useState(["#7B35D4","#F2EDE4","#0C0C0F"]);
  const [colorInput, setColorInput]   = useState("");
  const [screen, setScreen]           = useState("form");
  const [strategy, setStrategy]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState("");
  const [error, setError]             = useState("");
  const [regeneratingId, setRegeneratingId] = useState(null);

  const setField = (k,v) => setForm(f=>({...f,[k]:v}));

  const toggleRed = r => {
    if (form.redes.includes(r)) {
      setForm(f=>({...f, redes:f.redes.filter(x=>x!==r)}));
      setContenido(p=>{ const n={...p}; delete n[r]; return n; });
    } else {
      setForm(f=>({...f, redes:[...f.redes,r]}));
      const d={};
      TIPOS_POR_RED[r].forEach((t,i)=>{ d[t]=DEFAULTS_BY_INDEX[i]??1; });
      setContenido(p=>({...p,[r]:d}));
    }
  };

  const togglePilar = p => setForm(f=>({
    ...f, pilares: f.pilares.includes(p) ? f.pilares.filter(x=>x!==p) : [...f.pilares,p]
  }));

  const setTipoCantidad = (red,tipo,val) => setContenido(p=>({
    ...p, [red]:{...p[red],[tipo]:Math.max(0,Math.min(14,val))}
  }));

  const updatePost = (semanaNum, postId, field, value) => setStrategy(prev=>({
    ...prev,
    semanas: prev.semanas.map(s => s.numero===semanaNum
      ? {...s, posts: s.posts.map(p => p.id===postId ? {...p,[field]:value} : p)}
      : s)
  }));

  const buildPrompt = () => {
    const redesInfo = form.redes.length > 0
      ? form.redes.map(r=>{
          const tipos = Object.entries(contenido[r]||{}).filter(([,v])=>v>0).map(([t,v])=>`${t}: ${v}`).join(", ");
          return `  - ${r}: ${tipos} por semana`;
        }).join("\n")
      : "  - Instagram: Posts: 3, Historias: 5, Reels: 2 por semana";
    const totalPorSemana = form.redes.reduce((acc,r)=>acc+Object.values(contenido[r]||{}).reduce((a,v)=>a+v,0),0)||10;
    return `Eres un estratega experto en redes sociales. Genera una estrategia mensual completa y CONCRETA.

NEGOCIO:
- Nombre: ${form.negocio}
- Industria: ${form.industria||"No especificada"}
${form.sitioWeb?`- Sitio web: ${form.sitioWeb} — analizá este sitio para entender el tono, servicios y propuesta de valor real`:""}
- Audiencia: ${form.audiencia||"Audiencia general"}
- Objetivo del mes: ${form.objetivo||"Aumentar presencia y engagement"}
- Mes: ${form.mes}
- Tono: ${form.tono}
${usePalette&&palette.length>0?`- Paleta: ${palette.join(", ")}`:""}

FRECUENCIA (por semana):
${redesInfo}
Total publicaciones por semana: ${totalPorSemana}

PILARES: ${form.pilares.join(", ")||"Educativo, Inspiracional, Promocional"}

INSTRUCCIONES:
- Copies REALES y listos para publicar, con emojis naturales según el tono
- Distribuir en días reales (Lunes a Domingo)
- Hashtags variados y relevantes (no repetir los mismos en cada post)
- CTA específico y accionable
- Considerar fechas/eventos relevantes de ${form.mes}
${form.sitioWeb?"- Basar el contenido en la propuesta de valor real según el sitio web":""}

DEVUELVE SOLO JSON VÁLIDO sin markdown:
{
  "resumen": "enfoque estratégico del mes en 2-3 oraciones",
  "semanas": [
    { "numero": 1, "posts": [
      { "id": "s1-1", "red": "Instagram", "tipo": "Post", "pilar": "Educativo",
        "copy": "texto completo listo para publicar", "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5",
        "cta": "call to action específico", "dia": "Lunes", "promptImagen": "prompt en inglés para generar la imagen con IA, estilo visual, composición, colores y mood. Máximo 2 oraciones." }
    ]},
    { "numero": 2, "posts": [...] },
    { "numero": 3, "posts": [...] },
    { "numero": 4, "posts": [...] }
  ]
}`;
  };

  const handleGenerate = async () => {
    if (!form.negocio) { setError("Ingresá el nombre del negocio para continuar."); return; }
    setError(""); setLoading(true);
    setLoadingMsg(form.sitioWeb ? "Analizando el sitio web y generando estrategia…" : "Generando tu estrategia mensual…");
    try {
      const raw  = await callClaude([{role:"user",content:buildPrompt()}], 4000, !!form.sitioWeb);
      const data = JSON.parse(cleanJSON(raw));
      if (!data.semanas) throw new Error("Respuesta inesperada de la IA");
      setStrategy(data); setScreen("result");
    } catch(e) {
      setError(`Error: ${e.message}. Intentá de nuevo.`);
    } finally { setLoading(false); }
  };

  const handleRegenerate = async (semanaNum, post) => {
    setRegeneratingId(post.id);
    try {
      const prompt = `Regenera este post para "${form.negocio}" (${form.industria||"negocio"}).
Red: ${post.red} | Tipo: ${post.tipo} | Pilar: ${post.pilar} | Mes: ${form.mes} | Tono: ${form.tono}
${usePalette?`Paleta: ${palette.join(", ")}`:""}
Devuelve SOLO JSON sin markdown: {"copy":"...","hashtags":"...","cta":"...","dia":"...","promptImagen":"prompt en inglés para generar imagen con IA"}`;
      const raw  = await callClaude([{role:"user",content:prompt}], 600);
      const data = JSON.parse(cleanJSON(raw));
      ["copy","hashtags","cta","dia","promptImagen"].forEach(f=>{if(data[f])updatePost(semanaNum,post.id,f,data[f]);});
    } catch(e){ console.error(e); }
    finally { setRegeneratingId(null); }
  };

  const inputS = {
    width:"100%", background:C.surf2, border:`1px solid ${C.border}`,
    borderRadius:8, color:C.text, fontSize:14, padding:"13px 16px",
    fontFamily:"Georgia,serif", boxSizing:"border-box", outline:"none",
  };
  const labelS = {
    display:"block", fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase",
    color:C.accentLt, marginBottom:11, fontFamily:"Georgia,serif"
  };
  const chipS = active => ({
    padding:"8px 15px", borderRadius:100, fontSize:13, cursor:"pointer",
    fontFamily:"Georgia,serif", transition:"all .15s", userSelect:"none",
    border:`1px solid ${active ? C.accent : C.border}`,
    background: active ? `${C.accent}28` : "transparent",
    color: active ? C.accentLt : C.muted,
  });

  const GLOBAL_CSS = `
    *{box-sizing:border-box}
    input::placeholder,textarea::placeholder{color:${C.muted}66}
    input:focus,textarea:focus,select:focus{border-color:${C.accent}!important}
    button:disabled{opacity:.5;cursor:not-allowed!important}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.bg}}
    ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
    @keyframes bounce{0%,80%,100%{transform:scale(.55);opacity:.35}40%{transform:scale(1);opacity:1}}
    @keyframes fadeIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
    @media print{
      .no-print{display:none!important}
      .post-card{break-inside:avoid;page-break-inside:avoid}
      body,html{background:white!important;color:#111!important}
      .post-card{background:#f5f5f5!important;border:1px solid #ddd!important;border-left-width:3px!important}
      textarea,input{border:none!important;background:transparent!important;resize:none!important}
    }
  `;

  const headerEl = (right) => (
    <header className="no-print" style={{
      borderBottom:`1px solid ${C.border}`, padding:"18px 32px",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      background:C.bg, position:"sticky", top:0, zIndex:10
    }}>
      <div style={{display:"flex",alignItems:"center",gap:13}}>
        <div style={{width:30,height:30,background:C.accent,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:"bold",color:C.text,flexShrink:0}}>C</div>
        <span style={{fontSize:12,letterSpacing:"0.13em",textTransform:"uppercase",opacity:.75}}>Chroma — Estrategia de Redes</span>
      </div>
      {right}
    </header>
  );

  /* ══ FORM ══════════════════════════════════════════════════════ */
  if (screen === "form") return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"Georgia,serif"}}>
      <style>{GLOBAL_CSS}</style>
      {headerEl(null)}
      <div style={{maxWidth:800,margin:"0 auto",padding:"48px 28px 80px"}}>

        {/* Hero */}
        <div style={{marginBottom:46,animation:"fadeIn .5s ease"}}>
          <div style={{display:"inline-block",background:C.accentDim,border:`1px solid ${C.accent}40`,color:C.accentLt,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",padding:"5px 14px",borderRadius:100,marginBottom:16}}>Generador IA</div>
          <h1 style={{fontSize:"clamp(26px,5vw,46px)",fontWeight:400,letterSpacing:"-0.02em",margin:"0 0 13px",lineHeight:1.1}}>Estrategia mensual<br/>de redes sociales</h1>
          <p style={{fontSize:15,color:C.muted,lineHeight:1.75,maxWidth:480,margin:0}}>Completá los datos de tu negocio y en segundos tendrás un plan de contenido completo, editable y listo para ejecutar.</p>
        </div>

        {/* 01 */}
        <section style={{marginBottom:32}}>
          <label style={labelS}>01 — Tu negocio</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <input style={inputS} placeholder="Nombre del negocio *" value={form.negocio} onChange={e=>setField("negocio",e.target.value)} />
            <input style={inputS} placeholder="Industria (ej: diseño, moda, tech)" value={form.industria} onChange={e=>setField("industria",e.target.value)} />
          </div>
          <div style={{position:"relative"}}>
            <input style={{...inputS,paddingLeft:38}} placeholder="Sitio web (opcional) — la IA lo analizará para personalizar el contenido" value={form.sitioWeb} onChange={e=>setField("sitioWeb",e.target.value)} />
            <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none"}}>🌐</span>
          </div>
          {form.sitioWeb&&<div style={{marginTop:8,fontSize:12,color:C.accentLt,display:"flex",alignItems:"center",gap:6}}><span>✦</span> La IA analizará este sitio para enfocar el contenido en tu propuesta de valor real</div>}
        </section>

        <div style={{height:1,background:C.border,margin:"4px 0 32px"}} />

        {/* 02 */}
        <section style={{marginBottom:32}}>
          <label style={labelS}>02 — Audiencia y objetivo del mes</label>
          <textarea style={{...inputS,resize:"vertical",minHeight:74,marginBottom:12}} placeholder="¿A quién le hablás? (ej: emprendedores 25-40 que quieren mejorar su imagen de marca)" value={form.audiencia} onChange={e=>setField("audiencia",e.target.value)} />
          <textarea style={{...inputS,resize:"vertical",minHeight:74}} placeholder="Objetivo del mes (ej: lanzar nuevo servicio, generar leads, aumentar seguidores)" value={form.objetivo} onChange={e=>setField("objetivo",e.target.value)} />
        </section>

        <div style={{height:1,background:C.border,margin:"4px 0 32px"}} />

        {/* 03 */}
        <section style={{marginBottom:32}}>
          <label style={labelS}>03 — Mes y tono de voz</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <select style={{...inputS,appearance:"none",cursor:"pointer"}} value={form.mes} onChange={e=>setField("mes",e.target.value)}>
              {MONTHS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select style={{...inputS,appearance:"none",cursor:"pointer"}} value={form.tono} onChange={e=>setField("tono",e.target.value)}>
              {TONOS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </section>

        <div style={{height:1,background:C.border,margin:"4px 0 32px"}} />

        {/* 04 */}
        <section style={{marginBottom:32}}>
          <label style={labelS}>04 — Redes sociales y frecuencia semanal</label>
          <p style={{fontSize:13,color:C.muted,margin:"0 0 14px",lineHeight:1.6}}>Seleccioná las redes y ajustá cuántas publicaciones querés por semana en cada tipo de contenido.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
            {REDES.map(r=><span key={r} style={chipS(form.redes.includes(r))} onClick={()=>toggleRed(r)}>{r}</span>)}
          </div>
          {form.redes.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {form.redes.map(r=>(
                <div key={r} style={{background:C.surf2,border:`1px solid ${C.border}`,borderLeft:`3px solid ${NET_COLOR[r]}`,borderRadius:9,padding:"14px 18px",animation:"fadeIn .25s ease"}}>
                  <div style={{fontSize:13,color:C.text,fontWeight:500,marginBottom:12,fontFamily:"Georgia,serif"}}>{r}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:14}}>
                    {TIPOS_POR_RED[r].map(tipo=>(
                      <div key={tipo} style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:12,color:C.muted,fontFamily:"Georgia,serif",minWidth:66}}>{tipo}</span>
                        <Stepper value={contenido[r]?.[tipo]??0} onChange={v=>setTipoCantidad(r,tipo,v)} />
                        <span style={{fontSize:11,color:C.muted,fontFamily:"Georgia,serif"}}>/sem</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{height:1,background:C.border,margin:"4px 0 32px"}} />

        {/* 05 */}
        <section style={{marginBottom:32}}>
          <label style={labelS}>05 — Pilares de contenido</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {PILARES.map(p=><span key={p} style={chipS(form.pilares.includes(p))} onClick={()=>togglePilar(p)}>{p}</span>)}
          </div>
        </section>

        <div style={{height:1,background:C.border,margin:"4px 0 32px"}} />

        {/* 06 */}
        <section style={{marginBottom:36}}>
          <label style={labelS}>06 — Identidad visual (opcional)</label>
          <div style={{background:C.surf2,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:usePalette?18:0}}>
              <div>
                <div style={{fontSize:13,color:C.text}}>Paleta de colores personalizada</div>
                <div style={{fontSize:12,color:C.muted,marginTop:3}}>Los prompts de imagen incluirán tus colores exactos</div>
              </div>
              <Toggle on={usePalette} onToggle={()=>setUsePalette(v=>!v)} />
            </div>
            {usePalette&&(
              <div style={{animation:"fadeIn .2s ease"}}>
                {palette.length>0&&(
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                    {palette.map((c,i)=>(
                      <div key={i} onClick={()=>setPalette(p=>p.filter((_,j)=>j!==i))} title="Click para quitar" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:c,border:`2px solid ${C.border}`}} />
                        <span style={{fontSize:9,color:C.muted}}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{fontSize:11,color:C.muted,marginBottom:8}}>Presets</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12}}>
                  {PALETTE_PRESETS.map(c=>(
                    <div key={c} onClick={()=>{if(palette.includes(c))setPalette(p=>p.filter(x=>x!==c));else if(palette.length<6)setPalette(p=>[...p,c]);}} style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:`3px solid ${palette.includes(c)?C.text:"transparent"}`,outline:palette.includes(c)?`2px solid ${C.accent}`:"none",transition:"all .15s"}} />
                  ))}
                </div>
                <input style={{...inputS,fontSize:13}} placeholder="Hex personalizado: #FF5733 → Enter" value={colorInput} onChange={e=>setColorInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"){const v=colorInput.trim();if(v.match(/^#[0-9A-Fa-f]{3,6}$/)&&!palette.includes(v)&&palette.length<6){setPalette(p=>[...p,v]);setColorInput("");}}}} />
              </div>
            )}
          </div>
        </section>

        {error&&<div style={{background:"#2A0808",border:"1px solid #7B1F1F",borderRadius:8,padding:"13px 17px",color:"#FF9999",fontSize:13,marginBottom:16}}>{error}</div>}

        <button onClick={handleGenerate} disabled={loading} style={{
          width:"100%",border:"none",borderRadius:10,fontSize:15,padding:"17px",
          cursor:loading?"not-allowed":"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.04em",
          background:loading?C.surf3:C.accent,color:C.text,transition:"background .2s"
        }}>
          {loading?(
            <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14}}>
              <span style={{display:"inline-flex",gap:5}}>
                {[0,1,2].map(i=><span key={i} style={{width:7,height:7,borderRadius:"50%",background:C.accentLt,display:"inline-block",animation:"bounce 1.2s infinite",animationDelay:`${i*.2}s`}}/>)}
              </span>
              <span style={{color:C.muted}}>{loadingMsg}</span>
            </span>
          ):"→ Generar estrategia mensual"}
        </button>
      </div>
    </div>
  );

  /* ══ RESULT ════════════════════════════════════════════════════ */
  if (!strategy) return null;
  const totalPosts = strategy.semanas?.reduce((a,s)=>a+(s.posts?.length||0),0)||0;

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"Georgia,serif"}}>
      <style>{GLOBAL_CSS}</style>
      {headerEl(
        <div style={{display:"flex",gap:10}}>
          <span style={{fontSize:12,color:C.muted,alignSelf:"center",display:"none"}}>{form.mes} · {totalPosts} publicaciones</span>
          <button onClick={()=>window.print()} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,padding:"8px 15px",cursor:"pointer",fontFamily:"Georgia,serif"}}>⬇ Exportar PDF</button>
          <button onClick={()=>{setScreen("form");setStrategy(null);}} style={{background:C.surf2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,padding:"8px 15px",cursor:"pointer",fontFamily:"Georgia,serif"}}>← Nueva estrategia</button>
        </div>
      )}

      <div style={{maxWidth:860,margin:"0 auto",padding:"36px 28px 80px"}}>

        {/* Summary */}
        <div style={{background:C.surf2,borderLeft:`3px solid ${C.accent}`,borderRadius:10,padding:"20px 24px",marginBottom:36,animation:"fadeIn .4s ease"}}>
          <div style={{fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:C.accentLt,marginBottom:10}}>Resumen estratégico — {form.mes}</div>
          <p style={{fontSize:14,lineHeight:1.85,color:C.text,margin:"0 0 12px"}}>{strategy.resumen}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            <Badge label={form.negocio} color={C.accent} />
            <Badge label={`${totalPosts} publicaciones totales`} color={C.muted} />
            <Badge label={form.mes} color={C.muted} />
          </div>
        </div>

        {/* Tip */}
        <div className="no-print" style={{background:C.surf2,border:`1px solid ${C.border}`,borderRadius:8,padding:"11px 16px",marginBottom:30,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:13}}>✏️</span>
          <span style={{fontSize:12,color:C.muted}}>Hacé clic en cualquier campo para editarlo. Usá <strong style={{color:C.accentLt}}>↺ Regenerar</strong> para reescribir un post individual con IA sin modificar el resto.</span>
        </div>

        {/* Weeks */}
        {strategy.semanas?.map(semana=>(
          <div key={semana.numero} style={{marginBottom:46,animation:"fadeIn .4s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
              <span style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,whiteSpace:"nowrap"}}>Semana {semana.numero}</span>
              <div style={{flex:1,height:1,background:C.border}}/>
              <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{semana.posts?.length||0} publicaciones</span>
            </div>
            {semana.posts?.map(post=>(
              <PostCard key={post.id} post={post} semanaNum={semana.numero} onEdit={updatePost} onRegenerate={handleRegenerate} regeneratingId={regeneratingId} />
            ))}
          </div>
        ))}

        {/* Bottom */}
        <div className="no-print" style={{display:"flex",gap:12,justifyContent:"center",paddingTop:12}}>
          <button onClick={()=>window.print()} style={{background:C.accent,border:"none",borderRadius:10,color:C.text,fontSize:14,padding:"14px 30px",cursor:"pointer",fontFamily:"Georgia,serif"}}>⬇ Exportar PDF</button>
          <button onClick={()=>{setScreen("form");setStrategy(null);}} style={{background:C.surf2,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,padding:"14px 26px",cursor:"pointer",fontFamily:"Georgia,serif"}}>← Nueva estrategia</button>
        </div>
      </div>
    </div>
  );
}
