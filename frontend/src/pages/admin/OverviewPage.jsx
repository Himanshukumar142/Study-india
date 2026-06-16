import { useEffect, useState, useRef } from 'react'
import {
  Users, CheckCircle2, BookOpen, Clock, Zap, ArrowUpRight,
  TrendingUp, AlertTriangle, Crown, Activity, RefreshCw,
  Download, BarChart2, Star, Flame, Target, Shield
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'
import api from '../../services/api'

/* ─────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────── */
function Counter({ to, suffix = '', decimals = 0, duration = 1400 }) {
  const [val, setVal] = useState(0)
  const rafRef = useRef(null)
  const n = parseFloat(String(to).replace(/[^0-9.]/g, '')) || 0

  useEffect(() => {
    let start = null
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setVal(+(n * eased).toFixed(decimals))
      if (p < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [n, decimals, duration])

  return <>{Number.isInteger(n) ? Math.round(val).toLocaleString() : val.toFixed(decimals)}{suffix}</>
}

/* ─────────────────────────────────────────────
   CHART TOOLTIP
───────────────────────────────────────────── */
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 14, padding: '12px 16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.stroke || p.fill }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{p.name}:</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   WEEKLY DEMO DATA
───────────────────────────────────────────── */
const weekData = [
  { d: 'Mon', users: 124, quizzes: 86  },
  { d: 'Tue', users: 198, quizzes: 134 },
  { d: 'Wed', users: 162, quizzes: 148 },
  { d: 'Thu', users: 254, quizzes: 207 },
  { d: 'Fri', users: 226, quizzes: 238 },
  { d: 'Sat', users: 318, quizzes: 284 },
  { d: 'Sun', users: 424, quizzes: 382 },
]

const SUBJ_COLORS = {
  Physics: '#6366f1', Chemistry: '#10b981', Mathematics: '#f59e0b',
  Biology: '#ec4899', 'Mock Test': '#64748b', 'Daily Challenge': '#f97316',
  Mixed: '#8b5cf6',
}

/* ─────────────────────────────────────────────
   MAIN
───────────────────────────────────────────── */
export default function OverviewPage({ stats, onCreateTest, onAddQuestion }) {
  const [perf, setPerf] = useState(null)
  const [topUsers, setTopUsers] = useState([])
  const [spinning, setSpinning] = useState(false)

  const now     = new Date()
  const hour    = now.getHours()
  const greet   = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const load = async () => {
    try {
      const [p, u] = await Promise.all([
        api.get('/admin/analytics/performance'),
        api.get('/admin/users?limit=5'),
      ])
      setPerf(p.data.data)
      setTopUsers(p.data.data?.topUsers?.length ? p.data.data.topUsers : u.data.data || [])
    } catch {}
  }

  useEffect(() => { load() }, [])

  const refresh = async () => {
    setSpinning(true)
    await load()
    setTimeout(() => setSpinning(false), 700)
  }

  const subjData = perf?.subjectStats
    ?.filter(s => s._id && s._id !== 'null')
    .slice(0, 6)
    .map(s => ({ name: s._id?.length > 10 ? s._id.slice(0, 9) + '…' : s._id, full: s._id, count: s.count || 0 }))
    || [
      { name: 'Physics',   full: 'Physics',   count: 420 },
      { name: 'Chemistry', full: 'Chemistry', count: 382 },
      { name: 'Maths',     full: 'Mathematics', count: 514 },
      { name: 'Biology',   full: 'Biology',   count: 293 },
    ]

  /* ── KPI tiles ── */
  const kpis = [
    { label: 'Total Students',  val: stats?.totalUsers ?? 0,            icon: Users,        grad: 'linear-gradient(135deg,#2563eb,#4f46e5)', glow: 'rgba(99,102,241,0.4)' },
    { label: 'Quiz Attempts',   val: stats?.totalAttempts ?? 0,          icon: CheckCircle2, grad: 'linear-gradient(135deg,#7c3aed,#9333ea)', glow: 'rgba(147,51,234,0.4)' },
    { label: 'Content Files',   val: stats?.totalContent ?? 0,           icon: BookOpen,     grad: 'linear-gradient(135deg,#059669,#0d9488)', glow: 'rgba(5,150,105,0.4)'  },
    { label: 'Study Sessions',  val: stats?.totalStudySessions ?? 0,     icon: Clock,        grad: 'linear-gradient(135deg,#db2777,#e11d48)', glow: 'rgba(219,39,119,0.4)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ════════════════════════════════════
          HERO BANNER
      ════════════════════════════════════ */}
      <div style={{
        borderRadius: 24,
        background: 'linear-gradient(135deg,#020617 0%,#0f172a 35%,#1e1b4b 65%,#0f172a 100%)',
        padding: '36px 40px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.35)',
      }}>
        {/* ambient glows */}
        <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320, borderRadius:'50%', background:'rgba(99,102,241,0.15)', filter:'blur(80px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:80,  width:260, height:260, borderRadius:'50%', background:'rgba(139,92,246,0.12)', filter:'blur(70px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:40, left:'40%', width:200, height:200, borderRadius:'50%', background:'rgba(16,185,129,0.07)', filter:'blur(60px)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:10 }}>
          {/* Top bar */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:20, marginBottom:32 }}>
            <div>
              {/* label chip */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:99, padding:'6px 14px', marginBottom:14 }}>
                <Crown size={12} color="#a78bfa" />
                <span style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.2em' }}>Admin Control Center</span>
              </div>
              <h1 style={{ fontSize:32, fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1.1, margin:0 }}>
                {greet}, Admin 👋
              </h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.38)', fontWeight:600, marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
                {dateStr}
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'#34d399', background:'rgba(52,211,153,0.1)', padding:'3px 10px', borderRadius:99, border:'1px solid rgba(52,211,153,0.25)' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#34d399', animation:'pulse 2s infinite', display:'inline-block' }} />
                  All systems live
                </span>
              </p>
            </div>

            {/* action buttons */}
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={refresh} style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.5)', transition:'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
                <RefreshCw size={15} style={spinning ? { animation:'spin .7s linear infinite' } : {}} />
              </button>
              <button style={{ display:'flex', alignItems:'center', gap:8, height:40, padding:'0 18px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', cursor:'pointer', transition:'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}>
                <Download size={14} /> Export
              </button>
              <button onClick={onCreateTest} style={{ display:'flex', alignItems:'center', gap:8, height:40, padding:'0 22px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:12, fontSize:12, fontWeight:800, color:'#fff', cursor:'pointer', boxShadow:'0 8px 24px rgba(99,102,241,0.45)', transition:'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.04)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(99,102,241,0.6)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(99,102,241,0.45)' }}>
                <Zap size={14} fill="#fff" /> New Mock Test
              </button>
            </div>
          </div>

          {/* Mini stat chips inside banner */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[
              { label:'Total Students',   val: stats?.totalUsers ?? 0,            c:'#60a5fa' },
              { label:'Quiz Attempts',    val: stats?.totalAttempts ?? 0,          c:'#34d399' },
              { label:'Study Sessions',   val: stats?.totalStudySessions ?? 0,     c:'#fbbf24' },
              { label:'Avg Accuracy',     val: Math.round(perf?.overall?.avgAccuracy || 0), suffix:'%', c:'#c084fc' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.045)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'18px 20px', backdropFilter:'blur(10px)', transition:'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.045)'}>
                <p style={{ fontSize:26, fontWeight:900, color:s.c, letterSpacing:'-1px', lineHeight:1, margin:0 }}>
                  <Counter to={s.val} suffix={s.suffix||''} />
                </p>
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.18em', marginTop:6 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>

      {/* ════════════════════════════════════
          KPI CARDS
      ════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            borderRadius:20, padding:'24px 22px', background:k.grad,
            boxShadow:`0 12px 32px ${k.glow}`, position:'relative', overflow:'hidden',
            transition:'all .3s', cursor:'default',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px) scale(1.01)'; e.currentTarget.style.boxShadow=k.glow.replace('0.4','0.6').replace('32px','48px') }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.boxShadow=`0 12px 32px ${k.glow}` }}
          >
            <div style={{ position:'absolute', right:-14, bottom:-14, opacity:0.1 }}><k.icon size={90} color="#fff" /></div>
            <div style={{ width:42, height:42, borderRadius:12, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, backdropFilter:'blur(8px)' }}>
              <k.icon size={20} color="#fff" />
            </div>
            <p style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:4 }}>{k.label}</p>
            <p style={{ fontSize:30, fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1 }}>
              <Counter to={k.val} />
            </p>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════
          QUICK ACTIONS
      ════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>

        {/* Deploy Mock Test */}
        <div onClick={onCreateTest} style={{ borderRadius:20, padding:'28px 26px', background:'linear-gradient(145deg,#1d4ed8,#4338ca)', boxShadow:'0 16px 40px rgba(29,78,216,0.35)', position:'relative', overflow:'hidden', cursor:'pointer', transition:'all .25s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px) scale(1.015)'; e.currentTarget.style.boxShadow='0 24px 56px rgba(29,78,216,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(29,78,216,0.35)' }}>
          <div style={{ position:'absolute', right:-20, bottom:-20, opacity:0.1 }}><Zap size={110} color="#fff" /></div>
          <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
            <Zap size={22} color="#fff" fill="rgba(255,255,255,0.4)" />
          </div>
          <p style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.18em', marginBottom:8 }}>Quick Deploy</p>
          <h3 style={{ fontSize:20, fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:8 }}>Create Mock Test</h3>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.65, marginBottom:24 }}>Deploy JEE/NEET pattern exams to all students instantly with 3-step wizard.</p>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'0.15em' }}>
            Launch Wizard <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Add Question */}
        <div onClick={onAddQuestion} style={{ borderRadius:20, padding:'28px 26px', background:'#fff', border:'2px dashed #e2e8f0', position:'relative', overflow:'hidden', cursor:'pointer', transition:'all .25s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.boxShadow='0 16px 40px rgba(99,102,241,0.12)'; e.currentTarget.style.background='#fafafe' }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.background='#fff' }}>
          <div style={{ position:'absolute', right:-20, bottom:-20, opacity:0.04 }}><BookOpen size={110} color="#6366f1" /></div>
          <div style={{ width:44, height:44, borderRadius:14, background:'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
            <BookOpen size={22} color="#6366f1" />
          </div>
          <p style={{ fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.18em', marginBottom:8 }}>Repository</p>
          <h3 style={{ fontSize:20, fontWeight:900, color:'#0f172a', lineHeight:1.2, marginBottom:8 }}>Add Question</h3>
          <p style={{ fontSize:12, color:'#94a3b8', lineHeight:1.65, marginBottom:24 }}>Expand the question bank with curated, difficulty-tagged JEE/NEET items.</p>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:800, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.15em' }}>
            Open Bank <ArrowUpRight size={14} />
          </div>
        </div>

        {/* System Health */}
        <div style={{ borderRadius:20, padding:'28px 26px', background:'#0f172a', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 16px 40px rgba(0,0,0,0.25)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(52,211,153,0.08)', filter:'blur(40px)' }} />
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:'rgba(52,211,153,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Shield size={22} color="#34d399" />
            </div>
            <div>
              <p style={{ fontSize:15, fontWeight:800, color:'#fff', lineHeight:1 }}>System Health</p>
              <p style={{ fontSize:10, color:'#34d399', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', marginTop:4 }}>● All Operational</p>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { name:'API Gateway', val:99.98, color:'#34d399' },
              { name:'Auth Layer',  val:99.90,  color:'#60a5fa' },
              { name:'B2 Storage',  val:100,   color:'#a78bfa' },
              { name:'DB Cluster',  val:99.99, color:'#fbbf24' },
            ].map(s => (
              <div key={s.name}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{s.name}</span>
                  <span style={{ fontSize:12, color:s.color, fontWeight:800 }}>{s.val}%</span>
                </div>
                <div style={{ height:5, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${s.val}%`, borderRadius:99, background:s.color, boxShadow:`0 0 10px ${s.color}66`, transition:'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          CHARTS ROW
      ════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:16 }}>

        {/* Area Chart — Growth */}
        <div style={{ background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', padding:'28px 28px 22px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28 }}>
            <div>
              <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', margin:0 }}>Platform Growth</h3>
              <p style={{ fontSize:12, color:'#94a3b8', fontWeight:600, marginTop:4 }}>Weekly active users & quiz sessions</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ display:'flex', gap:4, background:'#f8fafc', padding:'4px', borderRadius:12, border:'1px solid #e2e8f0' }}>
                {['7D','1M','3M'].map((t, i) => (
                  <button key={t} style={{ padding:'6px 14px', borderRadius:9, fontSize:11, fontWeight:700, border:'none', cursor:'pointer', background: i===0 ? '#fff' : 'transparent', color: i===0 ? '#6366f1' : '#94a3b8', boxShadow: i===0 ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition:'all .15s' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weekData} margin={{ top:5, right:5, bottom:5, left:-20 }}>
              <defs>
                <linearGradient id="gu2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gq2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="0" />
              <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fontSize:11, fontWeight:700, fill:'#94a3b8' }} dy={10} />
              <YAxis hide />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="users"   name="Students" stroke="#6366f1" strokeWidth={2.5} fill="url(#gu2)" dot={false} activeDot={{ r:5, fill:'#6366f1', stroke:'#fff', strokeWidth:2.5 }} />
              <Area type="monotone" dataKey="quizzes" name="Quizzes"  stroke="#10b981" strokeWidth={2.5} fill="url(#gq2)" dot={false} activeDot={{ r:5, fill:'#10b981', stroke:'#fff', strokeWidth:2.5 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:24, marginTop:4 }}>
            {[{l:'Students', c:'#6366f1'},{l:'Quiz Attempts', c:'#10b981'}].map(x => (
              <div key={x.l} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#64748b', fontWeight:600 }}>
                <div style={{ width:28, height:3, borderRadius:99, background:x.c }} /> {x.l}
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart — subjects */}
        <div style={{ background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', padding:'28px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <BarChart2 size={18} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', margin:0 }}>Subject Stats</h3>
              <p style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginTop:2 }}>Attempts by subject</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={subjData} margin={{ top:0, right:0, bottom:0, left:-28 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:10, fontWeight:700, fill:'#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize:9, fill:'#cbd5e1' }} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="count" name="Attempts" radius={[6,6,0,0]} maxBarSize={48}>
                {subjData.map((e, i) => <Cell key={i} fill={SUBJ_COLORS[e.full] || '#6366f1'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:16 }}>
            {subjData.slice(0,4).map(s => (
              <div key={s.name} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, background:'#f8fafc', border:'1px solid #e2e8f0', fontSize:10, fontWeight:700, color:'#475569' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:SUBJ_COLORS[s.full]||'#6366f1' }} />
                {s.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          BOTTOM ROW: Top Students + KPI
      ════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Top Students */}
        <div style={{ background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', padding:'28px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Star size={18} color="#f59e0b" fill="#f59e0b" />
              </div>
              <div>
                <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', margin:0 }}>Top Students</h3>
                <p style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginTop:2 }}>Ranked by XP earned</p>
              </div>
            </div>
            <button style={{ fontSize:11, fontWeight:700, color:'#6366f1', background:'none', border:'none', cursor:'pointer', padding:'6px 12px', borderRadius:8, transition:'all .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#eef2ff'}
              onMouseLeave={e => e.currentTarget.style.background='none'}>
              View All →
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(topUsers.length ? topUsers.slice(0,5) : Array(5).fill(null)).map((s, i) => {
              const colors = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6']
              const rankBg = i===0?'linear-gradient(135deg,#fbbf24,#f59e0b)':i===1?'linear-gradient(135deg,#94a3b8,#64748b)':i===2?'linear-gradient(135deg,#cd7f32,#b45309)':'#f1f5f9'
              const rankColor = i<3?'#fff':'#64748b'
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 16px', borderRadius:14, background: i===0?'linear-gradient(135deg,#fffbeb,#fff)':'#f8fafc', border:`1px solid ${i===0?'#fde68a':'#f1f5f9'}`, transition:'all .2s', cursor:'default' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateX(4px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateX(0)'; e.currentTarget.style.boxShadow='none' }}>
                  {/* rank */}
                  <div style={{ width:30, height:30, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:rankColor, background:rankBg, flexShrink:0, boxShadow: i<3?'0 4px 10px rgba(0,0,0,0.15)':'none' }}>
                    {i<3?['🥇','🥈','🥉'][i]:i+1}
                  </div>
                  {/* avatar */}
                  <div style={{ width:38, height:38, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:'#fff', background:`linear-gradient(135deg,${colors[i]},${colors[(i+1)%colors.length]})`, boxShadow:`0 4px 12px ${colors[i]}44` }}>
                    {s?s.name?.[0]:'?'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', margin:0 }}>
                      {s?s.name:<span style={{ display:'inline-block', height:12, width:90, background:'#e2e8f0', borderRadius:6 }} />}
                    </p>
                    <p style={{ fontSize:10, color:'#94a3b8', fontWeight:600, marginTop:3 }}>
                      {s?`Level ${s.level||1} · ${s.exam||'N/A'}`:'—'}
                    </p>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontSize:14, fontWeight:900, color:'#0f172a', margin:0 }}>
                      {s?(s.xp||0).toLocaleString():'—'}
                    </p>
                    <p style={{ fontSize:9, fontWeight:800, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:2 }}>XP</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Platform KPIs + alert tiles */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* 2×2 small tiles */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { label:'Pending Reviews', val: stats?.pendingContent??0,                          icon:AlertTriangle, c:'#f59e0b', bg:'#fffbeb', b:'#fde68a' },
              { label:'Active Reports',  val:3,                                                  icon:Flame,         c:'#ef4444', bg:'#fff1f2', b:'#fecaca' },
              { label:'Total Questions', val: stats?.totalContent??0,                            icon:Target,        c:'#10b981', bg:'#ecfdf5', b:'#a7f3d0' },
              { label:'Avg Accuracy',    val: Math.round(perf?.overall?.avgAccuracy||0), suffix:'%', icon:Activity, c:'#6366f1', bg:'#eef2ff', b:'#c7d2fe' },
            ].map(t => (
              <div key={t.label} style={{ background:t.bg, border:`1px solid ${t.b}`, borderRadius:16, padding:'18px 20px', display:'flex', alignItems:'center', gap:14, transition:'all .2s', cursor:'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.boxShadow=`0 8px 24px ${t.c}22` }}
                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none' }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`${t.c}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <t.icon size={20} color={t.c} />
                </div>
                <div>
                  <p style={{ fontSize:22, fontWeight:900, color:t.c, letterSpacing:'-0.5px', lineHeight:1, margin:0 }}>
                    <Counter to={t.val} suffix={t.suffix||''} />
                  </p>
                  <p style={{ fontSize:10, color:`${t.c}88`, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginTop:4 }}>{t.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dark platform KPI panel */}
          <div style={{ flex:1, background:'linear-gradient(145deg,#0f172a,#1e1b4b)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'24px 26px', boxShadow:'0 16px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:'rgba(167,139,250,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <TrendingUp size={18} color="#a78bfa" />
              </div>
              <div>
                <p style={{ fontSize:15, fontWeight:800, color:'#fff', margin:0 }}>Platform KPIs</p>
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:600, marginTop:2 }}>Live performance metrics</p>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:'Avg Accuracy',  val:`${Math.round(perf?.overall?.avgAccuracy||0)}%`,              c:'#34d399' },
                { label:'Mistakes Logged', val:(perf?.mistakes??'—').toLocaleString(),                      c:'#f87171' },
                { label:'Top XP',        val:`${((perf?.topUsers?.[0]?.xp)||0).toLocaleString()}`,          c:'#fbbf24' },
                { label:'Total Marks',   val:`${Math.round((perf?.overall?.totalMarks||0)/1000)}K`,         c:'#60a5fa' },
              ].map(k => (
                <div key={k.label} style={{ padding:'14px 16px', borderRadius:14, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', transition:'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
                  <p style={{ fontSize:20, fontWeight:900, color:k.c, letterSpacing:'-0.5px', lineHeight:1, margin:0 }}>{k.val}</p>
                  <p style={{ fontSize:9, color:'rgba(255,255,255,0.28)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.18em', marginTop:6 }}>{k.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
