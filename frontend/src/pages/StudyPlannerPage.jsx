import { useState, useEffect } from 'react'
import {
  Calendar, Plus, CheckCircle2, Circle, Clock, Trash2, Edit3, X, Save,
  ChevronLeft, ChevronRight, BookOpen, Zap, Flame, Target, Layers, BarChart2
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']
const DURATIONS = [15, 30, 45, 60, 90, 120]

const SUBJECT_STYLES = {
  Physics:     { color:'#3b82f6', bg:'#eff6ff', border:'#bfdbfe', dot:'#3b82f6' },
  Chemistry:   { color:'#10b981', bg:'#ecfdf5', border:'#6ee7b7', dot:'#10b981' },
  Mathematics: { color:'#8b5cf6', bg:'#f5f3ff', border:'#c4b5fd', dot:'#8b5cf6' },
  Biology:     { color:'#f59e0b', bg:'#fffbeb', border:'#fcd34d', dot:'#f59e0b' },
}

const getDateStr  = (d) => d.toISOString().split('T')[0]
const formatDate  = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

export default function StudyPlannerPage() {
  const today = getDateStr(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [plan,         setPlan]         = useState(null)
  const [weekData,     setWeekData]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showAdd,      setShowAdd]      = useState(false)
  const [editIndex,    setEditIndex]    = useState(null)
  const [form,         setForm]         = useState({ subject:'Physics', chapter:'', description:'', duration:60 })

  useEffect(() => { fetchPlan(); fetchWeek() }, [selectedDate])

  const fetchPlan = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/study-plan?date=${selectedDate}`)
      setPlan(data.data)
    } catch { setPlan({ date:selectedDate, tasks:[], totalPlanned:0, totalCompleted:0 }) }
    finally { setLoading(false) }
  }

  const fetchWeek = async () => {
    try { const { data } = await api.get('/study-plan/week'); setWeekData(data.data || []) } catch {}
  }

  const saveTasks = async (tasks) => {
    try {
      const { data } = await api.post('/study-plan', { date:selectedDate, tasks, note:plan?.note||'' })
      setPlan(data.data); fetchWeek()
    } catch { toast.error('Failed to save') }
  }

  const handleAddTask = () => {
    if (!form.description.trim()) { toast.error('Task description required'); return }
    saveTasks([...(plan?.tasks||[]), { ...form, completed:false }])
    setShowAdd(false); setForm({ subject:'Physics', chapter:'', description:'', duration:60 })
    toast.success('Task added!')
  }

  const handleEditTask = () => {
    if (editIndex === null) return
    const tasks = [...(plan?.tasks||[])]
    tasks[editIndex] = { ...tasks[editIndex], ...form }
    saveTasks(tasks); setEditIndex(null); setShowAdd(false); toast.success('Task updated!')
  }

  const handleToggle = async (idx) => {
    try { await api.patch(`/study-plan/task/${idx}`, { date:selectedDate }); fetchPlan(); fetchWeek() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async (idx) => {
    try { await api.delete(`/study-plan/task/${idx}`, { data:{ date:selectedDate } }); fetchPlan(); fetchWeek(); toast.success('Task removed') }
    catch { toast.error('Failed') }
  }

  const openEdit = (idx) => {
    const t = plan.tasks[idx]
    setForm({ subject:t.subject, chapter:t.chapter||'', description:t.description, duration:t.duration })
    setEditIndex(idx); setShowAdd(true)
  }

  const changeDate = (delta) => {
    const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() + delta)
    setSelectedDate(getDateStr(d))
  }

  const tasks      = plan?.tasks || []
  const totalMin   = tasks.reduce((s,t) => s+(t.duration||0), 0)
  const doneMin    = tasks.filter(t=>t.completed).reduce((s,t) => s+(t.duration||0), 0)
  const pct        = totalMin > 0 ? Math.round((doneMin/totalMin)*100) : 0
  const isToday    = selectedDate === today
  const doneCount  = tasks.filter(t=>t.completed).length
  const subjects   = [...new Set(tasks.map(t=>t.subject))]

  /* week strip */
  const weekDays = []
  for (let i=6; i>=0; i--) {
    const d=new Date(); d.setDate(d.getDate()-i); const ds=getDateStr(d)
    const wd=weekData.find(w=>w.date===ds)
    weekDays.push({ date:ds, day:d.toLocaleDateString('en-IN',{weekday:'narrow'}),
      planned:wd?.totalPlanned||0, completed:wd?.totalCompleted||0,
      isToday:ds===today, isSelected:ds===selectedDate })
  }

  const pctColor = pct>=80?'#10b981':pct>=40?'#0ea5e9':'#94a3b8'

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#ecfdf5 50%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes slideIn  { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes checkPop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes progressFill { from{width:0} to{width:var(--w)} }
        .sp-page { animation:fadeIn .35s ease; }
        .sp-card { background:white; border-radius:20px; border:1px solid rgba(226,232,240,.8); box-shadow:0 4px 20px rgba(0,0,0,.05); }
        .sp-task {
          background:white; border-radius:16px; border:1.5px solid #f1f5f9;
          padding:18px 20px; display:flex; align-items:center; gap:14px;
          transition:all .2s ease; animation:fadeUp .3s ease;
        }
        .sp-task:hover { border-color:#a7f3d0; box-shadow:0 6px 20px rgba(16,185,129,.08); transform:translateY(-1px); }
        .sp-task.done  { opacity:.65; border-color:#d1fae5; background:#fafffe; }
        .sp-toggle { background:none; border:none; cursor:pointer; padding:0; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:transform .15s ease; }
        .sp-toggle:hover { transform:scale(1.15); }
        .sp-action-btn { width:32px; height:32px; border-radius:9px; border:none; background:#f8fafc; color:#94a3b8; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s ease; }
        .sp-action-btn:hover.edit   { background:#eff6ff; color:#3b82f6; }
        .sp-action-btn:hover.delete { background:#fff1f2; color:#ef4444; }
        .sp-shimmer {
          border-radius:16px; height:76px;
          background:linear-gradient(90deg,#f1f5f9 25%,#e8eef8 50%,#f1f5f9 75%);
          background-size:200% 100%; animation:shimmer 1.5s infinite;
        }
        .sp-duration-btn { padding:8px 16px; border-radius:10px; border:1.5px solid #e2e8f0; background:white; font-size:12px; font-weight:700; cursor:pointer; transition:all .2s ease; font-family:inherit; }
        .sp-duration-btn:hover  { border-color:#0ea5e9; background:#f0f9ff; color:#0ea5e9; }
        .sp-duration-btn.active { background:linear-gradient(135deg,#0ea5e9,#6366f1); border-color:transparent; color:white; box-shadow:0 4px 12px rgba(14,165,233,.3); }
        .sp-input { width:100%; padding:12px 16px; border:1.5px solid #e2e8f0; border-radius:12px; font-size:14px; font-weight:500; color:#1e293b; background:#f8fafc; outline:none; transition:all .2s ease; font-family:inherit; resize:none; }
        .sp-input:focus { border-color:#0ea5e9; background:white; box-shadow:0 0 0 4px rgba(14,165,233,.1); }
        .sp-input::placeholder { color:#94a3b8; }
        .sp-select { width:100%; padding:10px 14px; border:1.5px solid #e2e8f0; border-radius:12px; font-size:13px; font-weight:600; color:#1e293b; background:white; outline:none; transition:border-color .2s; cursor:pointer; font-family:inherit; }
        .sp-select:focus { border-color:#0ea5e9; }
        .week-btn { flex:1; padding:10px 4px; border-radius:14px; border:none; cursor:pointer; text-align:center; transition:all .2s ease; }
        .week-btn.selected { background:rgba(255,255,255,.25); box-shadow:0 0 0 2px rgba(255,255,255,.5); }
        .week-btn:hover:not(.selected) { background:rgba(255,255,255,.12); }
        .fab { position:fixed; bottom:28px; right:28px; width:56px; height:56px; border-radius:18px; border:none; background:linear-gradient(135deg,#0ea5e9,#6366f1); color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 28px rgba(14,165,233,.45); transition:all .2s ease; z-index:30; }
        .fab:hover { transform:scale(1.08) translateY(-2px); box-shadow:0 12px 36px rgba(14,165,233,.5); }
      `}</style>

      <div className="sp-page" style={{ maxWidth:720, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* ━━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━ */}
        <div style={{
          background:'linear-gradient(135deg,#0c4a6e 0%,#0369a1 40%,#065f46 100%)',
          borderRadius:28, padding:'40px 40px 32px', color:'white', position:'relative', overflow:'hidden',
          boxShadow:'0 20px 60px rgba(6,95,70,.25)'
        }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.06)', filter:'blur(20px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-30, left:'25%', width:160, height:160, borderRadius:'50%', background:'rgba(14,165,233,.12)', filter:'blur(30px)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:1 }}>
            {/* Title row */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Calendar size={18} style={{color:'#7dd3fc'}} />
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.55)', letterSpacing:'.1em', textTransform:'uppercase' }}>Daily Planner</span>
            </div>
            <h1 style={{ fontSize:'clamp(24px,4vw,38px)', fontWeight:900, margin:'0 0 24px', lineHeight:1.1 }}>Study Plan</h1>

            {/* Week strip */}
            <div style={{ display:'flex', gap:6 }}>
              {weekDays.map(w => {
                const barH = Math.min(Math.max((w.planned/4), 3), 28)
                const fillH = w.planned > 0 ? (w.completed/w.planned)*100 : 0
                return (
                  <button key={w.date} className={`week-btn${w.isSelected?' selected':''}`} onClick={() => setSelectedDate(w.date)}>
                    <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,.5)', letterSpacing:'.04em', textTransform:'uppercase', marginBottom:4 }}>{w.day}</div>
                    <div style={{ height:36, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                      <div style={{ width:8, borderRadius:4, background:'rgba(255,255,255,.2)', position:'relative', height:`${barH}px` }}>
                        {fillH > 0 && (
                          <div style={{ position:'absolute', bottom:0, width:'100%', borderRadius:4, background:'#34d399', height:`${fillH}%`, transition:'height .5s ease' }} />
                        )}
                      </div>
                    </div>
                    {w.isToday && <div style={{ width:4, height:4, borderRadius:'50%', background:'#fbbf24', margin:'4px auto 0' }} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━ DATE NAV ━━━━━━━━━━━━━━━━━ */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <button onClick={() => changeDate(-1)} style={{ width:40, height:40, borderRadius:12, border:'1.5px solid #e2e8f0', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', transition:'all .15s ease' }}>
            <ChevronLeft size={18} />
          </button>

          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#1e293b' }}>{formatDate(selectedDate)}</div>
            {isToday && <div style={{ fontSize:10, fontWeight:800, color:'#0ea5e9', letterSpacing:'.06em', textTransform:'uppercase', marginTop:2 }}>📅 Today</div>}
          </div>

          <button onClick={() => changeDate(1)} style={{ width:40, height:40, borderRadius:12, border:'1.5px solid #e2e8f0', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', transition:'all .15s ease' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* ━━━━━━━━━━━━━━━━━ PROGRESS CARD ━━━━━━━━━━━━━━━━━ */}
        <div className="sp-card" style={{ padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#1e293b' }}>Daily Progress</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:22, fontWeight:900, color:pctColor }}>{pct}%</span>
              <span style={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>{doneMin}m / {totalMin}m done</span>
            </div>
          </div>

          {/* Progress track */}
          <div style={{ height:10, background:'#f1f5f9', borderRadius:999, overflow:'hidden', marginBottom:16 }}>
            <div style={{ height:'100%', borderRadius:999, background: pct>=80?'linear-gradient(90deg,#10b981,#059669)':pct>=40?'linear-gradient(90deg,#0ea5e9,#6366f1)':'#e2e8f0', width:`${pct}%`, transition:'width .6s cubic-bezier(.34,1.56,.64,1)' }} />
          </div>

          {/* Quick stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {[
              { icon:Target,   label:'Tasks',    value:`${doneCount}/${tasks.length}`,         color:'#6366f1', bg:'#ede9fe' },
              { icon:Clock,    label:'Total',    value:`${totalMin}m`,                          color:'#0ea5e9', bg:'#e0f2fe' },
              { icon:Zap,      label:'Done',     value:`${doneMin}m`,                           color:'#10b981', bg:'#dcfce7' },
              { icon:BookOpen, label:'Subjects', value:subjects.length,                         color:'#f59e0b', bg:'#fef3c7' },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'10px 12px', textAlign:'center' }}>
                <div style={{ width:24, height:24, borderRadius:7, background:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 6px' }}>
                  <s.icon size={13} style={{ color:s.color }} />
                </div>
                <div style={{ fontSize:15, fontWeight:900, color:'#1e293b' }}>{s.value}</div>
                <div style={{ fontSize:9, fontWeight:700, color:s.color, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Subject bars */}
          {subjects.length > 0 && (
            <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:8 }}>
              {subjects.map(sub => {
                const subTasks = tasks.filter(t=>t.subject===sub)
                const subDone  = subTasks.filter(t=>t.completed).length
                const subPct   = Math.round((subDone/subTasks.length)*100)
                const s = SUBJECT_STYLES[sub] || { color:'#64748b', bg:'#f8fafc', border:'#e2e8f0', dot:'#94a3b8' }
                return (
                  <div key={sub} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
                    <span style={{ fontSize:11, fontWeight:700, color:'#374151', width:80, flexShrink:0 }}>{sub}</span>
                    <div style={{ flex:1, height:5, background:'#f1f5f9', borderRadius:999, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:s.dot, borderRadius:999, width:`${subPct}%`, transition:'width .6s ease', opacity:.8 }} />
                    </div>
                    <span style={{ fontSize:11, fontWeight:800, color:s.color, width:36, textAlign:'right', flexShrink:0 }}>{subDone}/{subTasks.length}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━ TASK LIST ━━━━━━━━━━━━━━━━━ */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[0,1,2].map(i => <div key={i} className="sp-shimmer" style={{ animationDelay:`${i*.1}s` }} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="sp-card" style={{ padding:60, textAlign:'center' }}>
            <div style={{ width:60, height:60, borderRadius:18, background:'linear-gradient(135deg,#e0f2fe,#bae6fd)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Calendar size={28} style={{ color:'#0369a1' }} />
            </div>
            <div style={{ fontSize:17, fontWeight:800, color:'#1e293b', marginBottom:6 }}>No tasks planned</div>
            <div style={{ fontSize:13, color:'#94a3b8', marginBottom:24 }}>Add tasks to plan your study session for this day</div>
            <button onClick={() => { setShowAdd(true); setEditIndex(null) }} style={{
              padding:'11px 24px', borderRadius:12, border:'none',
              background:'linear-gradient(135deg,#0ea5e9,#6366f1)', color:'white',
              fontWeight:800, fontSize:14, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8,
              boxShadow:'0 4px 16px rgba(14,165,233,.3)', fontFamily:'inherit'
            }}>
              <Plus size={16} /> Add First Task
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {/* Section header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4px' }}>
              <span style={{ fontSize:13, fontWeight:800, color:'#1e293b' }}>Tasks · {tasks.length}</span>
              <span style={{ fontSize:11, fontWeight:700, color: doneCount===tasks.length && tasks.length>0 ? '#10b981' : '#94a3b8' }}>
                {doneCount===tasks.length && tasks.length>0 ? '🎉 All done!' : `${tasks.length-doneCount} remaining`}
              </span>
            </div>

            {tasks.map((t, i) => {
              const s = SUBJECT_STYLES[t.subject] || { color:'#64748b', bg:'#f8fafc', border:'#e2e8f0', dot:'#94a3b8' }
              return (
                <div key={i} className={`sp-task${t.completed?' done':''}`} style={{ borderColor: t.completed?'#d1fae5':'#f1f5f9' }}>
                  {/* Toggle */}
                  <button className="sp-toggle" onClick={() => handleToggle(i)}>
                    {t.completed
                      ? <CheckCircle2 size={24} style={{ color:'#10b981' }} />
                      : <Circle      size={24} style={{ color:'#d1d5db' }} />}
                  </button>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:t.completed?'#94a3b8':'#1e293b', textDecoration:t.completed?'line-through':'none', marginBottom:7, lineHeight:1.4 }}>
                      {t.description}
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:8, background:s.bg, color:s.color, border:`1px solid ${s.border}`, fontSize:10, fontWeight:800, letterSpacing:'.03em' }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot }} /> {t.subject}
                      </span>
                      {t.chapter && (
                        <span style={{ padding:'3px 10px', borderRadius:8, background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0', fontSize:10, fontWeight:700 }}>{t.chapter}</span>
                      )}
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:8, background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0', fontSize:10, fontWeight:700 }}>
                        <Clock size={9} /> {t.duration}m
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="sp-action-btn edit" onClick={() => openEdit(i)} title="Edit"><Edit3 size={13} /></button>
                    <button className="sp-action-btn delete" onClick={() => handleDelete(i)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* FAB */}
        {!showAdd && tasks.length > 0 && (
          <button className="fab" onClick={() => { setShowAdd(true); setEditIndex(null); setForm({ subject:'Physics', chapter:'', description:'', duration:60 }) }}>
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━ ADD / EDIT MODAL ━━━━━━━━━━━━━━━━━ */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'white', borderRadius:24, width:'100%', maxWidth:460, padding:32, boxShadow:'0 24px 64px rgba(0,0,0,.18)', animation:'slideIn .3s cubic-bezier(.34,1.56,.64,1)' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:900, color:'#1e293b' }}>
                  {editIndex !== null ? '✏️ Edit Task' : '➕ New Task'}
                </div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{formatDate(selectedDate)}</div>
              </div>
              <button onClick={() => { setShowAdd(false); setEditIndex(null) }} style={{ width:36, height:36, borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
                <X size={16} />
              </button>
            </div>

            {/* Task description */}
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>What will you study?</label>
              <textarea className="sp-input" value={form.description} onChange={e => setForm({...form, description:e.target.value})}
                rows={3} placeholder="e.g. Solve 30 problems on Kinematics…" />
            </div>

            {/* Subject + Chapter */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Subject</label>
                <select className="sp-select" value={form.subject} onChange={e => setForm({...form, subject:e.target.value})}>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Chapter</label>
                <input className="sp-input" style={{ height:44 }} value={form.chapter} onChange={e => setForm({...form, chapter:e.target.value})} placeholder="Optional" />
              </div>
            </div>

            {/* Duration */}
            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:10 }}>Duration</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {DURATIONS.map(d => (
                  <button key={d} className={`sp-duration-btn${form.duration===d?' active':''}`} onClick={() => setForm({...form, duration:d})}>
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            {/* Subject preview badge */}
            {form.subject && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:12, background: SUBJECT_STYLES[form.subject]?.bg||'#f8fafc', border:`1px solid ${SUBJECT_STYLES[form.subject]?.border||'#e2e8f0'}`, marginBottom:20 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background: SUBJECT_STYLES[form.subject]?.dot||'#94a3b8' }} />
                <span style={{ fontSize:12, fontWeight:700, color: SUBJECT_STYLES[form.subject]?.color||'#64748b' }}>{form.subject} · {form.duration} min session</span>
              </div>
            )}

            {/* Submit */}
            <button onClick={editIndex !== null ? handleEditTask : handleAddTask} style={{
              width:'100%', padding:'14px', borderRadius:14, border:'none',
              background:'linear-gradient(135deg,#0ea5e9,#6366f1)', color:'white',
              fontWeight:800, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow:'0 4px 20px rgba(14,165,233,.35)', fontFamily:'inherit'
            }}>
              <Save size={16} />
              {editIndex !== null ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
