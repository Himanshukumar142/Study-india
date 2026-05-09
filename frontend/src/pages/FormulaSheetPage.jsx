import { useState, useMemo } from 'react'
import { Search, BookOpen, Copy, CheckCircle2, Star, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const FORMULAS = {
  Physics: {
    'Mechanics': [
      { name: "Newton's Second Law", formula: "F = ma", desc: "Force = mass × acceleration", tags: ['force', 'newton', 'motion'] },
      { name: 'Work Done', formula: "W = F·d·cosθ", desc: "Work = Force × displacement × cosine of angle", tags: ['work', 'energy'] },
      { name: 'Kinetic Energy', formula: "KE = ½mv²", desc: "Energy due to motion", tags: ['energy', 'motion'] },
      { name: 'Potential Energy (Gravity)', formula: "PE = mgh", desc: "Energy due to height", tags: ['energy', 'gravity'] },
      { name: 'Equations of Motion — 1', formula: "v = u + at", desc: "Final velocity, u=initial, a=acceleration, t=time", tags: ['motion', 'kinematics'] },
      { name: 'Equations of Motion — 2', formula: "s = ut + ½at²", desc: "Displacement formula", tags: ['motion', 'kinematics'] },
      { name: 'Equations of Motion — 3', formula: "v² = u² + 2as", desc: "Velocity-displacement relation", tags: ['motion', 'kinematics'] },
      { name: 'Gravitational Force', formula: "F = Gm₁m₂/r²", desc: "Newton's Law of Gravitation", tags: ['gravity', 'newton'] },
      { name: 'Momentum', formula: "p = mv", desc: "Linear momentum", tags: ['momentum', 'motion'] },
      { name: 'Impulse', formula: "J = F·t = Δp", desc: "Impulse equals change in momentum", tags: ['impulse', 'momentum'] },
      { name: 'Torque', formula: "τ = r × F = rF sinθ", desc: "Rotational force", tags: ['rotation', 'torque'] },
      { name: 'Moment of Inertia (Ring)', formula: "I = MR²", desc: "Rotational inertia of a ring", tags: ['rotation', 'inertia'] },
      { name: 'Centripetal Acceleration', formula: "a = v²/r = ω²r", desc: "Acceleration in circular motion", tags: ['circular', 'motion'] },
    ],
    'Waves & Oscillations': [
      { name: 'Time Period (SHM)', formula: "T = 2π√(m/k)", desc: "Period of simple harmonic motion", tags: ['shm', 'oscillation'] },
      { name: 'Time Period (Pendulum)', formula: "T = 2π√(l/g)", desc: "Period of simple pendulum", tags: ['pendulum', 'oscillation'] },
      { name: 'Wave Speed', formula: "v = fλ", desc: "Speed = frequency × wavelength", tags: ['wave', 'frequency'] },
      { name: 'Doppler Effect', formula: "f' = f(v ± v₀)/(v ∓ vs)", desc: "Observed frequency due to relative motion", tags: ['doppler', 'wave'] },
    ],
    'Electrostatics': [
      { name: "Coulomb's Law", formula: "F = kq₁q₂/r²", desc: "k = 9×10⁹ N·m²/C²", tags: ['charge', 'coulomb'] },
      { name: 'Electric Field', formula: "E = F/q = kq/r²", desc: "Force per unit charge", tags: ['electric', 'field'] },
      { name: 'Capacitance', formula: "C = Q/V = ε₀A/d", desc: "Charge stored per unit voltage", tags: ['capacitor', 'electric'] },
      { name: 'Energy in Capacitor', formula: "U = ½CV² = Q²/2C", desc: "Energy stored in capacitor", tags: ['capacitor', 'energy'] },
    ],
    'Current Electricity': [
      { name: "Ohm's Law", formula: "V = IR", desc: "Voltage = Current × Resistance", tags: ['ohm', 'circuit'] },
      { name: 'Power', formula: "P = VI = I²R = V²/R", desc: "Electrical power", tags: ['power', 'circuit'] },
      { name: 'Resistors in Series', formula: "R = R₁ + R₂ + R₃", desc: "Total series resistance", tags: ['resistance', 'circuit'] },
      { name: 'Resistors in Parallel', formula: "1/R = 1/R₁ + 1/R₂ + 1/R₃", desc: "Total parallel resistance", tags: ['resistance', 'circuit'] },
    ],
    'Optics': [
      { name: "Snell's Law", formula: "n₁sinθ₁ = n₂sinθ₂", desc: "Law of refraction", tags: ['refraction', 'light'] },
      { name: 'Mirror Formula', formula: "1/f = 1/v + 1/u", desc: "Focal length, image & object distance", tags: ['mirror', 'optics'] },
      { name: 'Lens Formula', formula: "1/f = 1/v - 1/u", desc: "Thin lens equation", tags: ['lens', 'optics'] },
      { name: 'Magnification', formula: "m = -v/u = h'/h", desc: "Image to object size ratio", tags: ['optics', 'magnification'] },
    ],
    'Modern Physics': [
      { name: "Einstein's Mass-Energy", formula: "E = mc²", desc: "Mass-energy equivalence", tags: ['einstein', 'nuclear'] },
      { name: "de Broglie Wavelength", formula: "λ = h/mv = h/p", desc: "Matter wave relation", tags: ['quantum', 'wave'] },
      { name: "Bohr's Radius", formula: "rₙ = 0.529 × n² Å", desc: "nth orbit radius of hydrogen", tags: ['bohr', 'atom'] },
      { name: "Energy of nth Orbit", formula: "Eₙ = -13.6/n² eV", desc: "Hydrogen energy levels", tags: ['bohr', 'atom'] },
    ],
  },
  Chemistry: {
    'Physical Chemistry': [
      { name: 'Ideal Gas Law', formula: "PV = nRT", desc: "P=pressure, V=volume, n=moles, R=8.314, T=temperature", tags: ['gas', 'thermodynamics'] },
      { name: "Boyle's Law", formula: "P₁V₁ = P₂V₂", desc: "At constant T and n", tags: ['gas'] },
      { name: "Charles's Law", formula: "V₁/T₁ = V₂/T₂", desc: "At constant P and n", tags: ['gas'] },
      { name: 'Molarity', formula: "M = moles of solute / volume (L)", desc: "Concentration in mol/L", tags: ['solution', 'concentration'] },
      { name: 'pH Formula', formula: "pH = -log[H⁺]", desc: "Hydrogen ion concentration measure", tags: ['acid', 'base', 'ph'] },
      { name: "Arrhenius Equation", formula: "k = Ae^(-Ea/RT)", desc: "Rate constant temperature dependence", tags: ['kinetics', 'rate'] },
      { name: "Nernst Equation", formula: "E = E° - (RT/nF)ln Q", desc: "Cell potential at non-standard conditions", tags: ['electrochemistry'] },
      { name: "Gibbs Free Energy", formula: "ΔG = ΔH - TΔS", desc: "Spontaneity criterion", tags: ['thermodynamics'] },
    ],
    'Electrochemistry': [
      { name: "Faraday's 1st Law", formula: "m = ZIt = (M/nF)It", desc: "Mass deposited during electrolysis", tags: ['electrolysis', 'faraday'] },
      { name: 'Cell EMF', formula: "E°cell = E°cathode - E°anode", desc: "Standard electrode potential", tags: ['electrochemistry', 'cell'] },
    ],
    'Organic Chemistry': [
      { name: 'Degree of Unsaturation', formula: "DBE = (2C + 2 + N - H - X) / 2", desc: "Double bond equivalents", tags: ['organic', 'structure'] },
    ],
  },
  Mathematics: {
    'Algebra': [
      { name: 'Quadratic Formula', formula: "x = (-b ± √(b²-4ac)) / 2a", desc: "Roots of ax² + bx + c = 0", tags: ['quadratic', 'roots'] },
      { name: 'Discriminant', formula: "D = b² - 4ac", desc: "D>0: real roots, D=0: equal roots, D<0: complex", tags: ['quadratic'] },
      { name: 'Arithmetic Progression Sum', formula: "Sₙ = n/2 (2a + (n-1)d)", desc: "Sum of n terms of AP", tags: ['sequence', 'ap'] },
      { name: 'Geometric Progression Sum', formula: "Sₙ = a(rⁿ-1)/(r-1)", desc: "Sum of n terms of GP", tags: ['sequence', 'gp'] },
      { name: 'Binomial Theorem', formula: "(a+b)ⁿ = Σ ⁿCr · aⁿ⁻ʳ · bʳ", desc: "General term: Tr+1 = ⁿCr · aⁿ⁻ʳ · bʳ", tags: ['binomial'] },
      { name: 'Permutation', formula: "P(n,r) = n!/(n-r)!", desc: "Ordered arrangement", tags: ['permutation', 'combination'] },
      { name: 'Combination', formula: "C(n,r) = n!/(r!(n-r)!)", desc: "Unordered selection", tags: ['combination'] },
    ],
    'Trigonometry': [
      { name: 'sin²θ + cos²θ', formula: "sin²θ + cos²θ = 1", desc: "Fundamental Pythagorean identity", tags: ['identity', 'trig'] },
      { name: 'tan θ', formula: "tan θ = sin θ / cos θ", desc: "Tangent definition", tags: ['trig'] },
      { name: 'sin(A+B)', formula: "sin(A+B) = sinA cosB + cosA sinB", desc: "Addition formula", tags: ['identity', 'trig'] },
      { name: 'cos(A+B)', formula: "cos(A+B) = cosA cosB - sinA sinB", desc: "Addition formula", tags: ['identity', 'trig'] },
      { name: 'sin 2A', formula: "sin 2A = 2 sinA cosA", desc: "Double angle formula", tags: ['identity', 'trig'] },
      { name: 'cos 2A', formula: "cos 2A = cos²A - sin²A = 1 - 2sin²A", desc: "Double angle formula", tags: ['identity', 'trig'] },
    ],
    'Calculus': [
      { name: 'Derivative (Power Rule)', formula: "d/dx (xⁿ) = nxⁿ⁻¹", desc: "Power rule of differentiation", tags: ['derivative', 'calculus'] },
      { name: 'Chain Rule', formula: "dy/dx = dy/du · du/dx", desc: "Composite function derivative", tags: ['derivative', 'calculus'] },
      { name: 'Integration (Power Rule)', formula: "∫xⁿ dx = xⁿ⁺¹/(n+1) + C", desc: "Basic integration rule", tags: ['integral', 'calculus'] },
      { name: 'Fundamental Theorem', formula: "∫ₐᵇ f(x)dx = F(b) - F(a)", desc: "Definite integral evaluation", tags: ['integral', 'calculus'] },
      { name: "L'Hôpital's Rule", formula: "lim(f/g) = lim(f'/g') when 0/0 or ∞/∞", desc: "Resolving indeterminate forms", tags: ['limits', 'calculus'] },
    ],
    'Coordinate Geometry': [
      { name: 'Distance Formula', formula: "d = √((x₂-x₁)² + (y₂-y₁)²)", desc: "Distance between two points", tags: ['coordinate', 'distance'] },
      { name: 'Midpoint Formula', formula: "M = ((x₁+x₂)/2, (y₁+y₂)/2)", desc: "Midpoint of a line segment", tags: ['coordinate'] },
      { name: 'Slope of Line', formula: "m = (y₂-y₁)/(x₂-x₁) = tanθ", desc: "Slope of a line", tags: ['line', 'coordinate'] },
      { name: 'Equation of Circle', formula: "(x-h)² + (y-k)² = r²", desc: "Standard form, center (h,k), radius r", tags: ['circle', 'conic'] },
    ],
    'Statistics & Probability': [
      { name: 'Mean', formula: "x̄ = Σxᵢ/n", desc: "Arithmetic average", tags: ['statistics', 'mean'] },
      { name: 'Variance', formula: "σ² = Σ(xᵢ-x̄)²/n", desc: "Measure of spread", tags: ['statistics', 'variance'] },
      { name: 'Bayes Theorem', formula: "P(A|B) = P(B|A)·P(A)/P(B)", desc: "Conditional probability", tags: ['probability', 'bayes'] },
    ],
  },
  Biology: {
    'Key Numbers': [
      { name: 'Normal Human Body Temperature', formula: "37°C / 98.6°F", desc: "Normal body temperature", tags: ['physiology'] },
      { name: 'Normal Blood Pressure', formula: "120/80 mmHg", desc: "Systolic/Diastolic", tags: ['circulatory', 'physiology'] },
      { name: 'Normal Heart Rate', formula: "72 beats/min", desc: "Resting heart rate", tags: ['circulatory', 'physiology'] },
      { name: 'Normal RBC Count', formula: "5 million/mm³", desc: "Red blood cells per cubic mm", tags: ['blood'] },
      { name: 'Normal WBC Count', formula: "4000–11000/mm³", desc: "White blood cells per cubic mm", tags: ['blood'] },
      { name: 'Human Chromosomes', formula: "46 (23 pairs)", desc: "Diploid chromosome number", tags: ['genetics', 'dna'] },
      { name: 'DNA Double Helix Pitch', formula: "3.4 nm (10 base pairs)", desc: "B-form DNA structure", tags: ['dna', 'genetics'] },
      { name: 'Cardiac Output', formula: "CO = HR × SV", desc: "Heart Rate × Stroke Volume", tags: ['circulatory', 'physiology'] },
    ],
    'Genetics': [
      { name: 'Hardy-Weinberg Equation', formula: "p² + 2pq + q² = 1", desc: "Allele frequency equilibrium", tags: ['genetics', 'evolution'] },
      { name: 'Allele Frequencies', formula: "p + q = 1", desc: "Sum of dominant + recessive allele freq", tags: ['genetics'] },
      { name: 'Chargaff Rule', formula: "A=T, G≡C (A+G = T+C)", desc: "Base pairing in DNA", tags: ['dna', 'genetics'] },
    ],
    'Photosynthesis': [
      { name: 'Photosynthesis Equation', formula: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", desc: "Overall photosynthesis reaction", tags: ['photosynthesis', 'plant'] },
      { name: 'Respiration', formula: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38ATP", desc: "Complete aerobic respiration", tags: ['respiration', 'atp'] },
    ],
  },
}

const SUBJECT_GRADIENT = {
  Physics:     'from-blue-600 to-cyan-600',
  Chemistry:   'from-emerald-600 to-teal-600',
  Mathematics: 'from-violet-600 to-purple-600',
  Biology:     'from-amber-500 to-orange-600',
}

export default function FormulaSheetPage() {
  const [activeSubject, setActiveSubject] = useState('Physics')
  const [search, setSearch] = useState('')
  const [expandedChapters, setExpandedChapters] = useState({})
  const [copied, setCopied] = useState(null)
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('formula-favs') || '[]') } catch { return [] }
  })
  const [showFavsOnly, setShowFavsOnly] = useState(false)

  const copyFormula = (formula, name) => {
    navigator.clipboard.writeText(formula)
    setCopied(name)
    toast.success(`Copied: ${formula}`)
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleFav = (key) => {
    setFavorites(prev => {
      const next = prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
      localStorage.setItem('formula-favs', JSON.stringify(next))
      return next
    })
  }

  const toggleChapter = (ch) => setExpandedChapters(prev => ({ ...prev, [ch]: !prev[ch] }))

  const chapters = FORMULAS[activeSubject] || {}
  const totalFormulas = Object.values(chapters).reduce((s, arr) => s + arr.length, 0)

  const filteredChapters = useMemo(() => {
    if (!search && !showFavsOnly) return chapters
    const result = {}
    for (const [ch, fms] of Object.entries(chapters)) {
      const filtered = fms.filter(f => {
        const key = `${activeSubject}:${ch}:${f.name}`
        if (showFavsOnly && !favorites.includes(key)) return false
        if (search) {
          const q = search.toLowerCase()
          return f.name.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q) ||
            f.desc.toLowerCase().includes(q) || f.tags?.some(t => t.includes(q))
        }
        return true
      })
      if (filtered.length > 0) result[ch] = filtered
    }
    return result
  }, [chapters, search, showFavsOnly, favorites, activeSubject])

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">

        {/* Hero */}
        <div className={`bg-gradient-to-br ${SUBJECT_GRADIENT[activeSubject]} rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-500`}>
          <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-white/60" />
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Quick Reference</span>
          </div>
          <h1 className="text-3xl font-black mb-2">Formula Sheet</h1>
          <p className="text-white/70 text-sm mb-4">Complete JEE / NEET formulas — {totalFormulas} formulas in {Object.keys(chapters).length} chapters.</p>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(FORMULAS).map(sub => (
              <button key={sub} onClick={() => { setActiveSubject(sub); setSearch(''); setExpandedChapters({}) }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeSubject === sub ? 'bg-white text-slate-900' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeSubject} formulas…`}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" />
          </div>
          <button onClick={() => setShowFavsOnly(!showFavsOnly)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${showFavsOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500'}`}>
            <Star size={13} /> Favorites {favorites.length > 0 && `(${favorites.length})`}
          </button>
        </div>

        {/* Formula chapters */}
        {Object.keys(filteredChapters).length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Search size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-500">No formulas found for "{search}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(filteredChapters).map(([chapter, formulas]) => {
              const isOpen = expandedChapters[chapter] !== false && (search || expandedChapters[chapter] === true || !Object.keys(expandedChapters).includes(chapter))
              return (
                <div key={chapter} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Chapter header */}
                  <button onClick={() => toggleChapter(chapter)}
                    className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition-all">
                    <div className={`w-2 h-5 rounded-full bg-gradient-to-b ${SUBJECT_GRADIENT[activeSubject]}`} />
                    <span className="flex-1 text-left font-black text-slate-900 text-sm">{chapter}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-lg">{formulas.length} formulas</span>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>

                  {/* Formulas */}
                  {isOpen && (
                    <div className="divide-y divide-slate-50">
                      {formulas.map(f => {
                        const key = `${activeSubject}:${chapter}:${f.name}`
                        const isFav = favorites.includes(key)
                        const isCopied = copied === f.name
                        return (
                          <div key={f.name} className="px-6 py-4 flex items-start gap-4 group hover:bg-blue-50/30 transition-all">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-black text-slate-500">{f.name}</p>
                                <div className="flex gap-1">
                                  {f.tags?.slice(0, 2).map(t => (
                                    <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-bold rounded">{t}</span>
                                  ))}
                                </div>
                              </div>
                              <p className="font-mono text-base font-black text-slate-900 mb-1 tracking-wide">{f.formula}</p>
                              <p className="text-[11px] text-slate-400">{f.desc}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button onClick={() => toggleFav(key)}
                                className={`p-2 rounded-xl transition-all ${isFav ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-300 hover:text-amber-400'}`}>
                                <Star size={13} className={isFav ? 'fill-amber-400' : ''} />
                              </button>
                              <button onClick={() => copyFormula(f.formula, f.name)}
                                className={`p-2 rounded-xl transition-all ${isCopied ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                                {isCopied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
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
