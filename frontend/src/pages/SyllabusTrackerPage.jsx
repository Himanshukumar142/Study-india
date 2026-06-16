import { useState, useEffect } from 'react'
import { BookOpen, CheckCircle2, Clock, RotateCcw, Star, ChevronDown, ChevronUp, Target, TrendingUp, Circle, Loader2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']

const STATUS_CONFIG = {
  'not-started': { label:'Not Started', color:'#64748b', bg:'#f8fafc', border:'#e2e8f0', dot:'#94a3b8' },
  'reading':     { label:'In Progress', color:'#d97706', bg:'#fffbeb', border:'#fde68a', dot:'#f59e0b' },
  'done':        { label:'Done',        color:'#059669', bg:'#ecfdf5', border:'#6ee7b7', dot:'#10b981' },
  'revision':    { label:'Revision',    color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe', dot:'#3b82f6' },
}

const SUB_STYLE = {
  Physics:     { color:'#3b82f6', grad:'linear-gradient(135deg,#1d4ed8,#0ea5e9)' },
  Chemistry:   { color:'#10b981', grad:'linear-gradient(135deg,#065f46,#0d9488)' },
  Mathematics: { color:'#8b5cf6', grad:'linear-gradient(135deg,#4c1d95,#7c3aed)' },
  Biology:     { color:'#f59e0b', grad:'linear-gradient(135deg,#92400e,#d97706)' },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .sy-root * { box-sizing:border-box; font-family:'Inter',system-ui,sans-serif; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .sy-fade-up { animation:fadeUp .35s ease both; }
  .sy-spin    { animation:spin .8s linear infinite; }

  .sy-tab { padding:10px 0; border-radius:14px; font-size:13px; font-weight:800; cursor:pointer; border:none; transition:all .2s ease; font-family:'Inter',sans-serif; text-align:center; }
  .sy-tab.active   { color:white; box-shadow:0 4px 16px rgba(0,0,0,.2); }
  .sy-tab.inactive { background:transparent; color:#64748b; }
  .sy-tab.inactive:hover { background:rgba(0,0,0,.04); color:#1e293b; }

  .sy-chapter-row {
    display:flex; align-items:center; gap:14px; padding:14px 20px;
    border-bottom:1px solid #f8fafc; transition:background .15s ease; cursor:default;
  }
  .sy-chapter-row:hover { background:#fafbff; }
  .sy-chapter-row:last-child { border-bottom:none; }

  .sy-status-dot {
    width:34px; height:34px; border-radius:50%; flex-shrink:0; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all .2s ease;
  }
  .sy-status-dot:hover { transform:scale(1.12); }

  .sy-stat-pill {
    border-radius:14px; padding:16px 20px; text-align:center; border:1.5px solid;
    transition:transform .15s ease;
  }
  .sy-stat-pill:hover { transform:translateY(-2px); }

  .sy-shimmer {
    border-radius:12px; height:52px;
    background:linear-gradient(90deg,#f1f5f9 25%,#e8eef8 50%,#f1f5f9 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite;
  }
`

export default function SyllabusTrackerPage() {
  const [activeSubject,    setActiveSubject]    = useState('Physics')
  const [syllabusData,     setSyllabusData]     = useState({})
  const [stats,            setStats]            = useState({})
  const [overall,          setOverall]          = useState({ total:0, done:0, pct:0 })
  const [loading,          setLoading]          = useState(true)
  const [updating,         setUpdating]         = useState({})
  const [expandedChapter,  setExpandedChapter]  = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [syllRes, statsRes] = await Promise.all([api.get('/syllabus'), api.get('/syllabus/stats')])
      setSyllabusData(syllRes.data.data || {})
      setStats(statsRes.data.data || {})
      setOverall(statsRes.data.overall || { total:0, done:0, pct:0 })
    } catch { toast.error('Failed to load syllabus') }
    finally { setLoading(false) }
  }

  const updateChapter = async (subject, chapter, patch) => {
    const key = `${subject}:${chapter}`
    setUpdating(p => ({ ...p, [key]:true }))
    try {
      await api.patch('/syllabus', { subject, chapter, ...patch })
      setSyllabusData(prev => {
        const updated = { ...prev }
        updated[subject] = updated[subject].map(c => c.chapter === chapter ? { ...c, ...patch } : c)
        return updated
      })
      const sub = syllabusData[subject] || []
      const updatedSub = sub.map(c => c.chapter === chapter ? { ...c, ...patch } : c)
      const done = updatedSub.filter(c=>c.status==='done').length
      const revision = updatedSub.filter(c=>c.status==='revision').length
      const reading = updatedSub.filter(c=>c.status==='reading').length
      const total = updatedSub.length
      setStats(p => ({ ...p, [subject]:{ total, done, revision, reading, notStarted:total-done-revision-reading, pct:Math.round(((done+revision)/total)*100) } }))
    } catch { toast.error('Failed to update') }
    finally { setUpdating(p => ({ ...p, [key]:false })) }
  }

  const cycleStatus = (subject, chapter, current) => {
    const ORDER = ['not-started','reading','done','revision']
    const next = ORDER[(ORDER.indexOf(current)+1)%ORDER.length]
    updateChapter(subject, chapter, { status:next })
  }

  const chapters  = syllabusData[activeSubject] || []
  const subStats  = stats[activeSubject] || { total:0, done:0, revision:0, reading:0, pct:0 }
  const ss        = SUB_STYLE[activeSubject]

  return (
    <div className="sy-root" style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#f0f2ff 50%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui" }}>
      <style>{css}</style>
      <div style={{ maxWidth:980, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Hero */}
        <div className="sy-fade-up" style={{ background:ss.grad, borderRadius:28, padding:'44px 48px', color:'white', position:'relative', overflow:'hidden', boxShadow:`0 20px 60px ${ss.color}44` }}>
          <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,.07)', filter:'blur(40px)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Target size={18} style={{color:'rgba(255,255,255,.8)'}} />
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.55)', letterSpacing:'.1em', textTransform:'uppercase' }}>Syllabus Tracker</span>
            </div>
            <h1 style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:900, margin:'0 0 6px', lineHeight:1.1 }}>JEE / NEET Syllabus</h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.6)', margin:'0 0 28px' }}>{overall.done} of {overall.total} chapters completed across all subjects</p>

            {/* Overall progress bar */}
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.7)' }}>Overall Completion</span>
                <span style={{ fontSize:16, fontWeight:900 }}>{overall.pct}%</span>
              </div>
              <div style={{ height:8, background:'rgba(255,255,255,.2)', borderRadius:999, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'white', borderRadius:999, width:`${overall.pct}%`, transition:'width .7s ease' }} />
              </div>
            </div>

            {/* Subject selector tiles */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {SUBJECTS.map(sub => {
                const s = stats[sub] || { pct:0, done:0, total:0 }
                const isActive = activeSubject === sub
                return (
                  <button key={sub} onClick={() => setActiveSubject(sub)} style={{
                    background: isActive?'rgba(255,255,255,.25)':'rgba(255,255,255,.1)',
                    border: isActive?'2px solid rgba(255,255,255,.5)':'2px solid transparent',
                    borderRadius:16, padding:'14px 12px', textAlign:'left', cursor:'pointer',
                    backdropFilter:'blur(8px)', transition:'all .2s ease', fontFamily:'inherit'
                  }}>
                    <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{sub}</div>
                    <div style={{ fontSize:22, fontWeight:900, color:'white', lineHeight:1 }}>{s.pct}%</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,.5)', marginTop:2 }}>{(s.done||0)+(s.revision||0)}/{s.total} done</div>
                    <div style={{ height:3, background:'rgba(255,255,255,.2)', borderRadius:999, overflow:'hidden', marginTop:8 }}>
                      <div style={{ height:'100%', background:'white', borderRadius:999, width:`${s.pct}%` }} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Subject Tabs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, background:'rgba(255,255,255,.7)', borderRadius:16, padding:6, border:'1px solid rgba(226,232,240,.6)' }}>
          {SUBJECTS.map(sub => {
            const s = SUB_STYLE[sub]
            return (
              <button key={sub} className={`sy-tab${activeSubject===sub?' active':'inactive'}`}
                onClick={() => setActiveSubject(sub)}
                style={{ background: activeSubject===sub ? s.grad : 'transparent', color: activeSubject===sub?'white':'#64748b' }}>
                {sub}
              </button>
            )
          })}
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { label:'Done',        val:subStats.done,                                                    color:'#059669', bg:'#ecfdf5', border:'#6ee7b7' },
            { label:'Revision',    val:subStats.revision||0,                                             color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
            { label:'In Progress', val:subStats.reading||0,                                             color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
            { label:'Remaining',   val:(subStats.notStarted||(subStats.total-subStats.done)||0),        color:'#64748b', bg:'#f8fafc', border:'#e2e8f0' },
          ].map(s => (
            <div key={s.label} className="sy-stat-pill" style={{ background:s.bg, borderColor:s.border }}>
              <div style={{ fontSize:26, fontWeight:900, color:s.color, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:10, fontWeight:800, color:s.color, textTransform:'uppercase', letterSpacing:'.05em', marginTop:4, opacity:.8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chapter list */}
        <div style={{ background:'white', borderRadius:20, border:'1px solid rgba(226,232,240,.8)', boxShadow:'0 4px 20px rgba(0,0,0,.05)', overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#1e293b' }}>{activeSubject} · {chapters.length} Chapters</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:ss.color }}>{subStats.pct}% complete</div>
              <div style={{ width:80, height:5, background:'#f1f5f9', borderRadius:999, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:999, background:ss.color, width:`${subStats.pct}%`, transition:'width .5s ease' }} />
              </div>
            </div>
          </div>

          <div>
            {loading ? (
              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:8 }}>
                {[0,1,2,3,4].map(i => <div key={i} className="sy-shimmer" style={{ animationDelay:`${i*.1}s` }} />)}
              </div>
            ) : chapters.map((ch, idx) => {
              const cfg = STATUS_CONFIG[ch.status] || STATUS_CONFIG['not-started']
              const key = `${activeSubject}:${ch.chapter}`
              const isUpdating = updating[key]
              const isExpanded = expandedChapter === key

              return (
                <div key={ch.chapter} style={{ background: isExpanded?'#fafbff':'white', borderBottom:'1px solid #f8fafc', transition:'background .15s ease' }}>
                  <div className="sy-chapter-row">
                    <span style={{ fontSize:11, fontWeight:800, color:'#cbd5e1', width:24, textAlign:'right', flexShrink:0 }}>{idx+1}</span>

                    {/* Status dot */}
                    <button className="sy-status-dot" onClick={() => cycleStatus(activeSubject, ch.chapter, ch.status)}
                      disabled={isUpdating} style={{ background:cfg.dot, opacity:isUpdating?.5:1 }} title={`Status: ${cfg.label} — click to cycle`}>
                      {isUpdating
                        ? <span className="sy-spin" style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block' }} />
                        : ch.status==='done'      ? <CheckCircle2 size={16} style={{color:'white'}} />
                        : ch.status==='revision'  ? <RotateCcw    size={14} style={{color:'white'}} />
                        : ch.status==='reading'   ? <Clock        size={14} style={{color:'white'}} />
                        : <Circle size={14} style={{color:'rgba(255,255,255,.5)'}} />}
                    </button>

                    {/* Name */}
                    <p style={{ flex:1, fontSize:14, fontWeight:600, color:ch.status==='done'?'#94a3b8':'#1e293b', textDecoration:ch.status==='done'?'line-through':'none' }}>{ch.chapter}</p>

                    {/* Stars */}
                    <div style={{ display:'flex', gap:2 }}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => updateChapter(activeSubject, ch.chapter, { confidence:s })} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px' }}>
                          <Star size={13} style={{ color: s<=ch.confidence?'#f59e0b':'#e2e8f0', fill: s<=ch.confidence?'#f59e0b':'none', transition:'color .1s' }} />
                        </button>
                      ))}
                    </div>

                    {/* Status badge */}
                    <span style={{ padding:'4px 10px', borderRadius:8, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, fontSize:10, fontWeight:800, flexShrink:0, letterSpacing:'.03em' }}>{cfg.label}</span>

                    {/* Expand toggle */}
                    <button onClick={() => setExpandedChapter(isExpanded?null:key)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'4px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {isExpanded?<ChevronUp size={15}/>:<ChevronDown size={15}/>}
                    </button>
                  </div>

                  {/* Expanded status picker */}
                  {isExpanded && (
                    <div style={{ padding:'12px 20px 16px 80px', display:'flex', gap:8, flexWrap:'wrap', animation:'fadeIn .2s ease' }}>
                      {Object.entries(STATUS_CONFIG).map(([s, c]) => (
                        <button key={s} onClick={() => { updateChapter(activeSubject, ch.chapter, { status:s }); setExpandedChapter(null) }} style={{
                          padding:'6px 14px', borderRadius:10, border:`1.5px solid ${c.border}`, background:ch.status===s?c.bg:'white',
                          color:c.color, fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'all .15s ease'
                        }}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', padding:'4px 0' }}>
          <p style={{ fontSize:11, color:'#94a3b8', fontWeight:600, width:'100%', textAlign:'center' }}>Click the circle to cycle → In Progress → Done → Revision</p>
          {Object.entries(STATUS_CONFIG).map(([s, c]) => (
            <div key={s} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, color:'#64748b' }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:c.dot }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
