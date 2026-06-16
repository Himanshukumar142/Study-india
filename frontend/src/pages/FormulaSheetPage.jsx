import { useState, useMemo } from 'react'
import { Search, Copy, CheckCircle2, Star, ChevronDown, ChevronUp, Zap, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const FORMULAS = {
  Physics: {
    'Mechanics': [
      { name:"Newton's Second Law", formula:"F = ma", desc:"Force = mass × acceleration", tags:['force','newton','motion'] },
      { name:'Work Done', formula:"W = F·d·cosθ", desc:"Work = Force × displacement × cosine of angle", tags:['work','energy'] },
      { name:'Kinetic Energy', formula:"KE = ½mv²", desc:"Energy due to motion", tags:['energy','motion'] },
      { name:'Potential Energy (Gravity)', formula:"PE = mgh", desc:"Energy due to height", tags:['energy','gravity'] },
      { name:'Equations of Motion — 1', formula:"v = u + at", desc:"Final velocity, u=initial, a=acceleration, t=time", tags:['motion','kinematics'] },
      { name:'Equations of Motion — 2', formula:"s = ut + ½at²", desc:"Displacement formula", tags:['motion','kinematics'] },
      { name:'Equations of Motion — 3', formula:"v² = u² + 2as", desc:"Velocity-displacement relation", tags:['motion','kinematics'] },
      { name:'Gravitational Force', formula:"F = Gm₁m₂/r²", desc:"Newton's Law of Gravitation", tags:['gravity','newton'] },
      { name:'Momentum', formula:"p = mv", desc:"Linear momentum", tags:['momentum','motion'] },
      { name:'Impulse', formula:"J = F·t = Δp", desc:"Impulse equals change in momentum", tags:['impulse','momentum'] },
      { name:'Torque', formula:"τ = r × F = rF sinθ", desc:"Rotational force", tags:['rotation','torque'] },
      { name:'Moment of Inertia (Ring)', formula:"I = MR²", desc:"Rotational inertia of a ring", tags:['rotation','inertia'] },
      { name:'Centripetal Acceleration', formula:"a = v²/r = ω²r", desc:"Acceleration in circular motion", tags:['circular','motion'] },
    ],
    'Waves & Oscillations': [
      { name:'Time Period (SHM)', formula:"T = 2π√(m/k)", desc:"Period of simple harmonic motion", tags:['shm','oscillation'] },
      { name:'Time Period (Pendulum)', formula:"T = 2π√(l/g)", desc:"Period of simple pendulum", tags:['pendulum','oscillation'] },
      { name:'Wave Speed', formula:"v = fλ", desc:"Speed = frequency × wavelength", tags:['wave','frequency'] },
      { name:"Doppler Effect", formula:"f' = f(v ± v₀)/(v ∓ vs)", desc:"Observed frequency due to relative motion", tags:['doppler','wave'] },
    ],
    'Electrostatics': [
      { name:"Coulomb's Law", formula:"F = kq₁q₂/r²", desc:"k = 9×10⁹ N·m²/C²", tags:['charge','coulomb'] },
      { name:'Electric Field', formula:"E = F/q = kq/r²", desc:"Force per unit charge", tags:['electric','field'] },
      { name:'Capacitance', formula:"C = Q/V = ε₀A/d", desc:"Charge stored per unit voltage", tags:['capacitor','electric'] },
      { name:'Energy in Capacitor', formula:"U = ½CV² = Q²/2C", desc:"Energy stored in capacitor", tags:['capacitor','energy'] },
    ],
    'Current Electricity': [
      { name:"Ohm's Law", formula:"V = IR", desc:"Voltage = Current × Resistance", tags:['ohm','circuit'] },
      { name:'Power', formula:"P = VI = I²R = V²/R", desc:"Electrical power", tags:['power','circuit'] },
      { name:'Resistors in Series', formula:"R = R₁ + R₂ + R₃", desc:"Total series resistance", tags:['resistance','circuit'] },
      { name:'Resistors in Parallel', formula:"1/R = 1/R₁ + 1/R₂ + 1/R₃", desc:"Total parallel resistance", tags:['resistance','circuit'] },
    ],
    'Optics': [
      { name:"Snell's Law", formula:"n₁sinθ₁ = n₂sinθ₂", desc:"Law of refraction", tags:['refraction','light'] },
      { name:'Mirror Formula', formula:"1/f = 1/v + 1/u", desc:"Focal length, image & object distance", tags:['mirror','optics'] },
      { name:'Lens Formula', formula:"1/f = 1/v - 1/u", desc:"Thin lens equation", tags:['lens','optics'] },
      { name:'Magnification', formula:"m = -v/u = h'/h", desc:"Image to object size ratio", tags:['optics','magnification'] },
    ],
    'Modern Physics': [
      { name:"Einstein's Mass-Energy", formula:"E = mc²", desc:"Mass-energy equivalence", tags:['einstein','nuclear'] },
      { name:"de Broglie Wavelength", formula:"λ = h/mv = h/p", desc:"Matter wave relation", tags:['quantum','wave'] },
      { name:"Bohr's Radius", formula:"rₙ = 0.529 × n² Å", desc:"nth orbit radius of hydrogen", tags:['bohr','atom'] },
      { name:"Energy of nth Orbit", formula:"Eₙ = -13.6/n² eV", desc:"Hydrogen energy levels", tags:['bohr','atom'] },
    ],
  },
  Chemistry: {
    'Physical Chemistry': [
      { name:'Ideal Gas Law', formula:"PV = nRT", desc:"P=pressure, V=volume, n=moles, R=8.314, T=temperature", tags:['gas','thermodynamics'] },
      { name:"Boyle's Law", formula:"P₁V₁ = P₂V₂", desc:"At constant T and n", tags:['gas'] },
      { name:"Charles's Law", formula:"V₁/T₁ = V₂/T₂", desc:"At constant P and n", tags:['gas'] },
      { name:'Molarity', formula:"M = moles of solute / volume (L)", desc:"Concentration in mol/L", tags:['solution','concentration'] },
      { name:'pH Formula', formula:"pH = -log[H⁺]", desc:"Hydrogen ion concentration measure", tags:['acid','base','ph'] },
      { name:"Arrhenius Equation", formula:"k = Ae^(-Ea/RT)", desc:"Rate constant temperature dependence", tags:['kinetics','rate'] },
      { name:"Nernst Equation", formula:"E = E° - (RT/nF)ln Q", desc:"Cell potential at non-standard conditions", tags:['electrochemistry'] },
      { name:"Gibbs Free Energy", formula:"ΔG = ΔH - TΔS", desc:"Spontaneity criterion", tags:['thermodynamics'] },
    ],
    'Electrochemistry': [
      { name:"Faraday's 1st Law", formula:"m = ZIt = (M/nF)It", desc:"Mass deposited during electrolysis", tags:['electrolysis','faraday'] },
      { name:'Cell EMF', formula:"E°cell = E°cathode - E°anode", desc:"Standard electrode potential", tags:['electrochemistry','cell'] },
    ],
    'Organic Chemistry': [
      { name:'Degree of Unsaturation', formula:"DBE = (2C + 2 + N - H - X) / 2", desc:"Double bond equivalents", tags:['organic','structure'] },
    ],
  },
  Mathematics: {
    'Algebra': [
      { name:'Quadratic Formula', formula:"x = (-b ± √(b²-4ac)) / 2a", desc:"Roots of ax² + bx + c = 0", tags:['quadratic','roots'] },
      { name:'Discriminant', formula:"D = b² - 4ac", desc:"D>0: real roots, D=0: equal, D<0: complex", tags:['quadratic'] },
      { name:'Arithmetic Progression Sum', formula:"Sₙ = n/2 (2a + (n-1)d)", desc:"Sum of n terms of AP", tags:['sequence','ap'] },
      { name:'Geometric Progression Sum', formula:"Sₙ = a(rⁿ-1)/(r-1)", desc:"Sum of n terms of GP", tags:['sequence','gp'] },
      { name:'Binomial Theorem', formula:"(a+b)ⁿ = Σ ⁿCr · aⁿ⁻ʳ · bʳ", desc:"General term: Tr+1 = ⁿCr · aⁿ⁻ʳ · bʳ", tags:['binomial'] },
      { name:'Permutation', formula:"P(n,r) = n!/(n-r)!", desc:"Ordered arrangement", tags:['permutation','combination'] },
      { name:'Combination', formula:"C(n,r) = n!/(r!(n-r)!)", desc:"Unordered selection", tags:['combination'] },
    ],
    'Trigonometry': [
      { name:'Pythagorean Identity', formula:"sin²θ + cos²θ = 1", desc:"Fundamental trigonometric identity", tags:['identity','trig'] },
      { name:'tan θ', formula:"tan θ = sin θ / cos θ", desc:"Tangent definition", tags:['trig'] },
      { name:'sin(A+B)', formula:"sin(A+B) = sinA cosB + cosA sinB", desc:"Addition formula", tags:['identity','trig'] },
      { name:'cos(A+B)', formula:"cos(A+B) = cosA cosB - sinA sinB", desc:"Addition formula", tags:['identity','trig'] },
      { name:'sin 2A', formula:"sin 2A = 2 sinA cosA", desc:"Double angle formula", tags:['identity','trig'] },
      { name:'cos 2A', formula:"cos 2A = cos²A - sin²A = 1 - 2sin²A", desc:"Double angle formula", tags:['identity','trig'] },
    ],
    'Calculus': [
      { name:'Derivative (Power Rule)', formula:"d/dx (xⁿ) = nxⁿ⁻¹", desc:"Power rule of differentiation", tags:['derivative','calculus'] },
      { name:'Chain Rule', formula:"dy/dx = dy/du · du/dx", desc:"Composite function derivative", tags:['derivative','calculus'] },
      { name:'Integration (Power Rule)', formula:"∫xⁿ dx = xⁿ⁺¹/(n+1) + C", desc:"Basic integration rule", tags:['integral','calculus'] },
      { name:'Fundamental Theorem', formula:"∫ₐᵇ f(x)dx = F(b) - F(a)", desc:"Definite integral evaluation", tags:['integral','calculus'] },
      { name:"L'Hôpital's Rule", formula:"lim(f/g) = lim(f'/g') when 0/0 or ∞/∞", desc:"Resolving indeterminate forms", tags:['limits','calculus'] },
    ],
    'Coordinate Geometry': [
      { name:'Distance Formula', formula:"d = √((x₂-x₁)² + (y₂-y₁)²)", desc:"Distance between two points", tags:['coordinate','distance'] },
      { name:'Midpoint Formula', formula:"M = ((x₁+x₂)/2, (y₁+y₂)/2)", desc:"Midpoint of a line segment", tags:['coordinate'] },
      { name:'Slope of Line', formula:"m = (y₂-y₁)/(x₂-x₁) = tanθ", desc:"Slope of a line", tags:['line','coordinate'] },
      { name:'Equation of Circle', formula:"(x-h)² + (y-k)² = r²", desc:"Standard form, center (h,k), radius r", tags:['circle','conic'] },
    ],
    'Statistics & Probability': [
      { name:'Mean', formula:"x̄ = Σxᵢ/n", desc:"Arithmetic average", tags:['statistics','mean'] },
      { name:'Variance', formula:"σ² = Σ(xᵢ-x̄)²/n", desc:"Measure of spread", tags:['statistics','variance'] },
      { name:'Bayes Theorem', formula:"P(A|B) = P(B|A)·P(A)/P(B)", desc:"Conditional probability", tags:['probability','bayes'] },
    ],
  },
  Biology: {
    'Key Numbers': [
      { name:'Normal Body Temperature', formula:"37°C / 98.6°F", desc:"Normal human body temperature", tags:['physiology'] },
      { name:'Normal Blood Pressure', formula:"120/80 mmHg", desc:"Systolic/Diastolic", tags:['circulatory','physiology'] },
      { name:'Normal Heart Rate', formula:"72 beats/min", desc:"Resting heart rate", tags:['circulatory','physiology'] },
      { name:'Normal RBC Count', formula:"5 million/mm³", desc:"Red blood cells per cubic mm", tags:['blood'] },
      { name:'Normal WBC Count', formula:"4000–11000/mm³", desc:"White blood cells per cubic mm", tags:['blood'] },
      { name:'Human Chromosomes', formula:"46 (23 pairs)", desc:"Diploid chromosome number", tags:['genetics','dna'] },
      { name:'DNA Double Helix Pitch', formula:"3.4 nm (10 base pairs)", desc:"B-form DNA structure", tags:['dna','genetics'] },
      { name:'Cardiac Output', formula:"CO = HR × SV", desc:"Heart Rate × Stroke Volume", tags:['circulatory','physiology'] },
    ],
    'Genetics': [
      { name:'Hardy-Weinberg Equation', formula:"p² + 2pq + q² = 1", desc:"Allele frequency equilibrium", tags:['genetics','evolution'] },
      { name:'Allele Frequencies', formula:"p + q = 1", desc:"Sum of dominant + recessive allele freq", tags:['genetics'] },
      { name:"Chargaff's Rule", formula:"A=T, G≡C (A+G = T+C)", desc:"Base pairing in DNA", tags:['dna','genetics'] },
    ],
    'Biochemistry': [
      { name:'Photosynthesis', formula:"6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", desc:"Overall photosynthesis reaction", tags:['photosynthesis','plant'] },
      { name:'Aerobic Respiration', formula:"C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38ATP", desc:"Complete aerobic respiration", tags:['respiration','atp'] },
    ],
  },
}

const SUB_STYLE = {
  Physics:     { grad:'linear-gradient(135deg,#1d4ed8,#0ea5e9)', accent:'#3b82f6', light:'#eff6ff' },
  Chemistry:   { grad:'linear-gradient(135deg,#065f46,#0d9488)', accent:'#10b981', light:'#ecfdf5' },
  Mathematics: { grad:'linear-gradient(135deg,#4c1d95,#7c3aed)', accent:'#8b5cf6', light:'#f5f3ff' },
  Biology:     { grad:'linear-gradient(135deg,#92400e,#d97706)', accent:'#f59e0b', light:'#fffbeb' },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .fs-root * { box-sizing:border-box; font-family:'Inter',system-ui,sans-serif; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  .fs-fade-up { animation:fadeUp .35s ease both; }

  .fs-sub-btn { padding:10px 20px; border-radius:12px; font-size:13px; font-weight:800; cursor:pointer; border:none; transition:all .2s ease; font-family:'Inter',sans-serif; }
  .fs-sub-btn.active   { color:white; }
  .fs-sub-btn.inactive { background:rgba(255,255,255,.12); color:rgba(255,255,255,.7); }
  .fs-sub-btn.inactive:hover { background:rgba(255,255,255,.22); color:white; }

  .fs-chapter { background:white; border-radius:18px; border:1.5px solid #f1f5f9; overflow:hidden; transition:border-color .2s ease; }
  .fs-chapter:hover { border-color:#e2e8f0; }

  .fs-chapter-header {
    width:100%; display:flex; align-items:center; gap:14px; padding:18px 22px;
    background:none; border:none; cursor:pointer; text-align:left; transition:background .15s ease;
    font-family:'Inter',sans-serif;
  }
  .fs-chapter-header:hover { background:#fafbff; }

  .fs-formula-row {
    display:flex; align-items:flex-start; gap:14px; padding:16px 22px;
    border-top:1px solid #f8fafc; transition:background .15s ease;
  }
  .fs-formula-row:hover { background:#fafbff; }

  .fs-icon-btn {
    width:32px; height:32px; border-radius:9px; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all .15s ease; flex-shrink:0;
  }
  .fs-icon-btn.fav    { background:#fffbeb; color:#d97706; }
  .fs-icon-btn.unfav  { background:#f8fafc; color:#cbd5e1; }
  .fs-icon-btn.unfav:hover { background:#fffbeb; color:#f59e0b; }
  .fs-icon-btn.copy   { background:#f8fafc; color:#94a3b8; }
  .fs-icon-btn.copy:hover { background:#ecfdf5; color:#10b981; }
  .fs-icon-btn.copied { background:#ecfdf5; color:#10b981; }

  .fs-input {
    width:100%; padding:12px 16px; border:1.5px solid #e2e8f0; border-radius:12px;
    font-size:14px; font-weight:500; color:#1e293b; background:white; outline:none;
    transition:all .2s ease; font-family:'Inter',sans-serif;
  }
  .fs-input:focus { border-color:var(--accent); box-shadow:0 0 0 4px color-mix(in srgb, var(--accent) 15%, transparent); }
`

export default function FormulaSheetPage() {
  const [activeSubject,    setActiveSubject]    = useState('Physics')
  const [search,           setSearch]           = useState('')
  const [expandedChapters, setExpandedChapters] = useState({})
  const [copied,           setCopied]           = useState(null)
  const [favorites,        setFavorites]        = useState(() => {
    try { return JSON.parse(localStorage.getItem('formula-favs')||'[]') } catch { return [] }
  })
  const [showFavsOnly, setShowFavsOnly] = useState(false)

  const ss = SUB_STYLE[activeSubject]

  const copyFormula = (formula, name) => {
    navigator.clipboard.writeText(formula)
    setCopied(name); toast.success(`Copied!`)
    setTimeout(()=>setCopied(null), 2000)
  }

  const toggleFav = (key) => {
    setFavorites(prev => {
      const next = prev.includes(key) ? prev.filter(f=>f!==key) : [...prev,key]
      localStorage.setItem('formula-favs', JSON.stringify(next)); return next
    })
  }

  const toggleChapter = (ch) => setExpandedChapters(prev=>({...prev,[ch]:!prev[ch]}))

  const chapters      = FORMULAS[activeSubject] || {}
  const totalFormulas = Object.values(chapters).reduce((s,arr)=>s+arr.length, 0)

  const filteredChapters = useMemo(() => {
    if (!search && !showFavsOnly) return chapters
    const result = {}
    for (const [ch, fms] of Object.entries(chapters)) {
      const filtered = fms.filter(f => {
        const key = `${activeSubject}:${ch}:${f.name}`
        if (showFavsOnly && !favorites.includes(key)) return false
        if (search) {
          const q = search.toLowerCase()
          return f.name.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q) || f.tags?.some(t=>t.includes(q))
        }
        return true
      })
      if (filtered.length > 0) result[ch] = filtered
    }
    return result
  }, [chapters, search, showFavsOnly, favorites, activeSubject])

  return (
    <div className="fs-root" style={{ '--accent':ss.accent, minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#f0f2ff 50%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui" }}>
      <style>{css}</style>
      <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Hero */}
        <div className="fs-fade-up" style={{ background:ss.grad, borderRadius:28, padding:'44px 48px', color:'white', position:'relative', overflow:'hidden', boxShadow:`0 20px 60px ${ss.accent}44`, transition:'all .4s ease' }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.07)', filter:'blur(40px)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Zap size={18} style={{color:'rgba(255,255,255,.8)'}} />
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.55)', letterSpacing:'.1em', textTransform:'uppercase' }}>Quick Reference</span>
            </div>
            <h1 style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:900, margin:'0 0 8px', lineHeight:1.1 }}>Formula Sheet</h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.65)', margin:'0 0 28px' }}>
              {totalFormulas} formulas · {Object.keys(chapters).length} chapters — JEE / NEET complete reference
            </p>

            {/* Subject tabs */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {Object.keys(FORMULAS).map(sub => (
                <button key={sub} className={`fs-sub-btn${activeSubject===sub?' active':' inactive'}`}
                  onClick={() => { setActiveSubject(sub); setSearch(''); setExpandedChapters({}) }}
                  style={{ background:activeSubject===sub?'rgba(255,255,255,.25)':undefined }}>
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search + Favorites */}
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="fs-input" style={{ paddingLeft:44 }} value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${activeSubject} formulas…`} />
          </div>
          <button onClick={()=>setShowFavsOnly(!showFavsOnly)} style={{
            padding:'11px 18px', borderRadius:12, border:`1.5px solid ${showFavsOnly?ss.accent:'#e2e8f0'}`,
            background:showFavsOnly?ss.light:'white', color:showFavsOnly?ss.accent:'#64748b',
            fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontFamily:'inherit',
            transition:'all .15s ease'
          }}>
            <Star size={14} style={{ fill:showFavsOnly?ss.accent:'none' }} />
            Favorites {favorites.length>0?`(${favorites.length})`:''}
          </button>
        </div>

        {/* Chapter count summary */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {Object.entries(filteredChapters).map(([ch, fms]) => (
            <span key={ch} style={{ padding:'5px 14px', borderRadius:20, background:ss.light, color:ss.accent, fontSize:11, fontWeight:700, border:`1px solid ${ss.accent}33`, cursor:'pointer' }}
              onClick={() => toggleChapter(ch)}>
              {ch} · {fms.length}
            </span>
          ))}
        </div>

        {/* Formula list */}
        {Object.keys(filteredChapters).length === 0 ? (
          <div style={{ background:'white', borderRadius:20, border:'1px solid #f1f5f9', padding:60, textAlign:'center' }}>
            <Search size={32} style={{ color:'#e2e8f0', margin:'0 auto 16px', display:'block' }} />
            <div style={{ fontSize:15, fontWeight:700, color:'#94a3b8' }}>No formulas found for "{search}"</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {Object.entries(filteredChapters).map(([chapter, formulas]) => {
              const isOpen = expandedChapters[chapter] !== false && (search || expandedChapters[chapter] === true || !Object.keys(expandedChapters).includes(chapter))
              return (
                <div key={chapter} className="fs-chapter">
                  {/* Chapter header */}
                  <button className="fs-chapter-header" onClick={()=>toggleChapter(chapter)}>
                    <div style={{ width:4, height:22, borderRadius:999, background:ss.grad, flexShrink:0 }} />
                    <span style={{ flex:1, fontSize:15, fontWeight:800, color:'#1e293b' }}>{chapter}</span>
                    <span style={{ padding:'4px 12px', borderRadius:8, background:ss.light, color:ss.accent, fontSize:11, fontWeight:800 }}>{formulas.length}</span>
                    {isOpen ? <ChevronUp size={16} style={{color:'#94a3b8',flexShrink:0}}/> : <ChevronDown size={16} style={{color:'#94a3b8',flexShrink:0}}/>}
                  </button>

                  {/* Formula rows */}
                  {isOpen && (
                    <div style={{ animation:'fadeIn .2s ease' }}>
                      {formulas.map(f => {
                        const key = `${activeSubject}:${chapter}:${f.name}`
                        const isFav    = favorites.includes(key)
                        const isCopied = copied === f.name
                        return (
                          <div key={f.name} className="fs-formula-row">
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                                <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{f.name}</span>
                                {f.tags?.slice(0,2).map(t=>(
                                  <span key={t} style={{ padding:'2px 8px', borderRadius:6, background:'#f1f5f9', color:'#94a3b8', fontSize:9, fontWeight:800, textTransform:'uppercase' }}>{t}</span>
                                ))}
                              </div>
                              <div style={{ fontFamily:'monospace', fontSize:17, fontWeight:900, color:'#1e293b', letterSpacing:'.02em', marginBottom:5 }}>{f.formula}</div>
                              <div style={{ fontSize:11, color:'#94a3b8' }}>{f.desc}</div>
                            </div>
                            <div style={{ display:'flex', gap:6, flexShrink:0, alignItems:'center' }}>
                              <button className={`fs-icon-btn ${isFav?'fav':'unfav'}`} onClick={()=>toggleFav(key)} title={isFav?'Remove favorite':'Add favorite'}>
                                <Star size={13} style={{ fill:isFav?'#d97706':'none' }} />
                              </button>
                              <button className={`fs-icon-btn ${isCopied?'copied':'copy'}`} onClick={()=>copyFormula(f.formula, f.name)} title="Copy formula">
                                {isCopied?<CheckCircle2 size={13}/>:<Copy size={13}/>}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
