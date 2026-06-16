import { useState, useEffect } from 'react'
import {
  BarChart2, TrendingUp, Target, Clock, Zap, CheckCircle2, XCircle,
  BookOpen, Flame, Award, Brain, Activity, Star, ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import api from '../services/api'

/* ── Custom Tooltip ──────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,.1)', fontSize:12 }}>
      <p style={{ fontWeight:800, color:'#1e293b', marginBottom:4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, fontWeight:700, margin:'2px 0' }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

/* ── Stat Card ───────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, gradient, delay = 0 }) => (
  <div style={{
    background: gradient, borderRadius:20, padding:'24px 24px', color:'white',
    position:'relative', overflow:'hidden', animation:`fadeUp .4s ease ${delay}s both`,
    boxShadow:'0 4px 20px rgba(0,0,0,.1)'
  }}>
    <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,.08)', pointerEvents:'none' }} />
    <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
      <Icon size={20} />
    </div>
    <div style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:900, lineHeight:1, marginBottom:4 }}>{value}</div>
    <div style={{ fontSize:12, fontWeight:700, opacity:.75, marginBottom:2 }}>{label}</div>
    {sub && <div style={{ fontSize:10, opacity:.55, fontWeight:600 }}>{sub}</div>}
  </div>
)

/* ── Chart Section Wrapper ────────────────────────────────────── */
const ChartCard = ({ title, icon: Icon, iconColor, children, style = {} }) => (
  <div style={{
    background:'white', borderRadius:20, border:'1px solid rgba(226,232,240,.8)',
    boxShadow:'0 4px 24px rgba(0,0,0,.04)', padding:28, ...style
  }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:`${iconColor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={18} style={{ color:iconColor }} />
      </div>
      <span style={{ fontSize:14, fontWeight:800, color:'#1e293b' }}>{title}</span>
    </div>
    {children}
  </div>
)

/* ── Empty State ─────────────────────────────────────────────── */
const EmptyState = ({ msg }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', gap:10 }}>
    <div style={{ width:48, height:48, borderRadius:14, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <BarChart2 size={22} style={{ color:'#cbd5e1' }} />
    </div>
    <p style={{ fontSize:13, fontWeight:600, color:'#94a3b8', textAlign:'center' }}>{msg}</p>
  </div>
)

/* ════════════════════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const [attempts, setAttempts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/quizzes/attempts').then(r => setAttempts(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8f9fc', fontFamily:"'Inter',system-ui" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:52, height:52, position:'relative', margin:'0 auto 16px' }}>
          <div style={{ position:'absolute', inset:0, border:'3px solid #e0e7ff', borderRadius:'50%' }} />
          <div style={{ position:'absolute', inset:0, border:'3px solid transparent', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
        </div>
        <p style={{ fontSize:13, fontWeight:700, color:'#94a3b8' }}>Loading analytics…</p>
      </div>
    </div>
  )

  /* ── Compute ── */
  const completed      = attempts.filter(a => a.status === 'completed')
  const totalQuizzes   = completed.length
  const totalCorrect   = completed.reduce((s, a) => s + (a.correct   || 0), 0)
  const totalWrong     = completed.reduce((s, a) => s + (a.wrong     || 0), 0)
  const totalSkipped   = completed.reduce((s, a) => s + (a.skipped   || 0), 0)
  const totalQuestions = totalCorrect + totalWrong + totalSkipped
  const avgAccuracy    = totalQuizzes > 0 ? Math.round(completed.reduce((s,a) => s+(a.accuracy||0),0)/totalQuizzes) : 0
  const totalXP        = completed.reduce((s, a) => s + (a.xpAwarded || 0), 0)
  const avgTime        = totalQuizzes > 0 ? Math.round(completed.reduce((s,a) => s+(a.timeTakenSeconds||0),0)/totalQuizzes) : 0

  /* Trend */
  const trendData = completed.slice(-15).map((a, i) => ({
    name: `Q${i+1}`, accuracy: a.accuracy||0, marks: a.obtainedMarks||0
  }))

  /* Recent trend direction */
  const trendDir = trendData.length >= 3
    ? (trendData[trendData.length-1].accuracy - trendData[trendData.length-3].accuracy)
    : 0

  /* Subject map */
  const subjectMap = {}
  completed.forEach(a => {
    const sub = a.subject || 'Other'
    if (!subjectMap[sub]) subjectMap[sub] = { correct:0, wrong:0, skipped:0, count:0, totalAcc:0 }
    subjectMap[sub].correct   += (a.correct  || 0)
    subjectMap[sub].wrong     += (a.wrong    || 0)
    subjectMap[sub].skipped   += (a.skipped  || 0)
    subjectMap[sub].count++
    subjectMap[sub].totalAcc  += (a.accuracy || 0)
  })
  const subjectData = Object.entries(subjectMap).map(([name, d]) => ({
    name, correct: d.correct, wrong: d.wrong,
    avg: Math.round(d.totalAcc / d.count)
  }))

  /* Pie */
  const pieData = [
    { name:'Correct', value:totalCorrect, color:'#10b981' },
    { name:'Wrong',   value:totalWrong,   color:'#ef4444'  },
    { name:'Skipped', value:totalSkipped, color:'#94a3b8'  },
  ].filter(d => d.value > 0)

  /* Weekly */
  const weekData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const da = completed.filter(a => a.createdAt?.startsWith(ds))
    weekData.push({
      day: d.toLocaleDateString('en-IN',{weekday:'short'}),
      quizzes: da.length,
      accuracy: da.length > 0 ? Math.round(da.reduce((s,a)=>s+(a.accuracy||0),0)/da.length) : 0
    })
  }

  /* Weak chapters */
  const chapterMap = {}
  completed.forEach(a => {
    const ch = a.chapter || 'General'
    if (!chapterMap[ch]) chapterMap[ch] = { correct:0, total:0 }
    chapterMap[ch].correct += (a.correct || 0)
    chapterMap[ch].total   += (a.correct || 0) + (a.wrong || 0)
  })
  const weakChapters = Object.entries(chapterMap)
    .map(([name,d]) => ({ name, accuracy: d.total > 0 ? Math.round((d.correct/d.total)*100) : 0, total:d.total }))
    .filter(c => c.total >= 2).sort((a,b) => a.accuracy - b.accuracy).slice(0,5)

  const accColor = (v) => v >= 70 ? '#10b981' : v >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#f0f2ff 50%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box; }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes barGrow { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        .an-page { animation: fadeIn .4s ease; }
      `}</style>

      <div className="an-page" style={{ maxWidth:1100, margin:'0 auto', padding:'36px 24px', display:'flex', flexDirection:'column', gap:24 }}>

        {/* ━━━━━━━━━━━━━━━━━━ HERO BANNER ━━━━━━━━━━━━━━━━━━ */}
        <div style={{
          background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#1e3a5f 100%)',
          borderRadius:28, padding:'44px 48px', color:'white', position:'relative', overflow:'hidden',
          boxShadow:'0 20px 60px rgba(99,102,241,.25)'
        }}>
          <div style={{ position:'absolute', top:-60, right:-60, width:280, height:280, borderRadius:'50%', background:'rgba(139,92,246,.15)', filter:'blur(60px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-40, left:'30%', width:200, height:200, borderRadius:'50%', background:'rgba(6,182,212,.1)', filter:'blur(50px)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:20, marginBottom:32 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(139,92,246,.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <BarChart2 size={18} style={{color:'#a5b4fc'}} />
                  </div>
                  <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.5)', letterSpacing:'.1em', textTransform:'uppercase' }}>Performance Overview</span>
                </div>
                <h1 style={{ fontSize:'clamp(26px,4vw,42px)', fontWeight:900, margin:'0 0 8px', lineHeight:1.1 }}>Analytics Dashboard</h1>
                <p style={{ fontSize:13, color:'rgba(255,255,255,.55)', margin:0 }}>
                  {totalQuizzes > 0 ? `Based on ${totalQuizzes} completed quizzes` : 'Complete quizzes to see your insights'}
                </p>
              </div>
              {/* Trend indicator */}
              {trendDir !== 0 && (
                <div style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:16, padding:'12px 20px', textAlign:'center', backdropFilter:'blur(8px)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center', marginBottom:4 }}>
                    {trendDir > 0
                      ? <ArrowUp size={18} style={{ color:'#6ee7b7' }} />
                      : <ArrowDown size={18} style={{ color:'#fca5a5' }} />}
                    <span style={{ fontSize:20, fontWeight:900, color: trendDir > 0 ? '#6ee7b7' : '#fca5a5' }}>
                      {Math.abs(trendDir).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.06em' }}>
                    Recent trend
                  </div>
                </div>
              )}
            </div>

            {/* 4 stat cards inside hero */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
              {[
                { icon:Target,   label:'Quizzes Done',  value:totalQuizzes,                          sub:'total completed',            bg:'rgba(255,255,255,.1)' },
                { icon:Activity, label:'Avg Accuracy',  value:`${avgAccuracy}%`,                     sub:avgAccuracy>=60?'On track 🎯':'Needs work 📚', bg:'rgba(255,255,255,.1)' },
                { icon:Zap,      label:'Total XP',      value:totalXP.toLocaleString(),              sub:'experience earned',          bg:'rgba(251,191,36,.15)' },
                { icon:Clock,    label:'Avg Quiz Time', value:`${Math.floor(avgTime/60)}m ${avgTime%60}s`, sub:'per session',          bg:'rgba(255,255,255,.1)' },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:16, padding:'18px 20px', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.1)' }}>
                  <s.icon size={18} style={{ color:'rgba(255,255,255,.6)', marginBottom:10 }} />
                  <div style={{ fontSize:'clamp(18px,3vw,26px)', fontWeight:900, color:'white', lineHeight:1, marginBottom:4 }}>{s.value}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.6)' }}>{s.label}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:2, fontWeight:600 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━ ROW 1: Quick Stats ━━━━━━━━━━━━━━━━ */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14 }}>
          {[
            { icon:CheckCircle2, label:'Correct',  value:totalCorrect,   gradient:'linear-gradient(135deg,#059669,#10b981)', delay:.05 },
            { icon:XCircle,      label:'Wrong',    value:totalWrong,     gradient:'linear-gradient(135deg,#dc2626,#ef4444)', delay:.10 },
            { icon:Minus,        label:'Skipped',  value:totalSkipped,   gradient:'linear-gradient(135deg,#475569,#64748b)', delay:.15 },
            { icon:BookOpen,     label:'Attempted',value:totalQuestions, gradient:'linear-gradient(135deg,#2563eb,#3b82f6)', delay:.20 },
          ].map(s => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* ━━━━━━━━━━━━━━━━ ROW 2: Trend + Pie ━━━━━━━━━━━━━━━━ */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, alignItems:'start' }}>

          <ChartCard title="Accuracy Trend (Last 15 Quizzes)" icon={TrendingUp} iconColor="#6366f1">
            {trendData.length > 0 ? (
              <div style={{ height:220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top:5, right:5, bottom:0, left:-10 }}>
                    <defs>
                      <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#94a3b8', fontWeight:600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#cbd5e1' }} domain={[0,100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#6366f1" strokeWidth={2.5}
                      fill="url(#accGrad)" dot={{ r:4, fill:'#6366f1', stroke:'white', strokeWidth:2 }}
                      activeDot={{ r:6, fill:'#6366f1', stroke:'white', strokeWidth:2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState msg="Complete quizzes to see your accuracy trend" />}
          </ChartCard>

          {/* Pie + Legend */}
          <ChartCard title="Answer Breakdown" icon={Target} iconColor="#10b981">
            {pieData.length > 0 ? (
              <>
                <div style={{ height:180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        dataKey="value" strokeWidth={3} stroke="white" paddingAngle={3}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:10, background:'#f8f9fc', border:'1px solid #f1f5f9' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:10, height:10, borderRadius:3, background:d.color }} />
                        <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:900, color:'#1e293b' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <EmptyState msg="No data yet" />}
          </ChartCard>
        </div>

        {/* ━━━━━━━━━━━━━━━━ ROW 3: Subject + Weekly ━━━━━━━━━━━━━━━━ */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          <ChartCard title="Subject Performance" icon={BookOpen} iconColor="#8b5cf6">
            {subjectData.length > 0 ? (
              <div style={{ height:220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData} margin={{ top:5, right:5, bottom:0, left:-10 }}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#94a3b8', fontWeight:600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#cbd5e1' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="correct" name="Correct" fill="#10b981" radius={[6,6,0,0]} maxBarSize={30} />
                    <Bar dataKey="wrong"   name="Wrong"   fill="#ef4444" radius={[6,6,0,0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState msg="No subject data yet" />}
            {/* Subject accuracy pills */}
            {subjectData.length > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:14 }}>
                {subjectData.map(s => (
                  <div key={s.name} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:999, border:'1px solid #e2e8f0', background:'#f8f9fc', fontSize:11, fontWeight:700, color:'#374151' }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background: accColor(s.avg) }} />
                    {s.name}: {s.avg}%
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Weekly Activity" icon={Flame} iconColor="#f59e0b">
            <div style={{ height:220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ top:5, right:5, bottom:0, left:-10 }}>
                  <defs>
                    <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#94a3b8', fontWeight:600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#cbd5e1' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="quizzes" name="Quizzes" fill="url(#weekGrad)" radius={[8,8,0,0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* This week summary */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:14 }}>
              <div style={{ background:'#fffbeb', borderRadius:12, padding:'12px 14px', border:'1px solid #fde68a' }}>
                <div style={{ fontSize:18, fontWeight:900, color:'#b45309' }}>{weekData.reduce((s,d)=>s+d.quizzes,0)}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'#d97706', textTransform:'uppercase', letterSpacing:'.06em' }}>This week</div>
              </div>
              <div style={{ background:'#f0fdf4', borderRadius:12, padding:'12px 14px', border:'1px solid #6ee7b7' }}>
                <div style={{ fontSize:18, fontWeight:900, color:'#065f46' }}>
                  {weekData.some(d=>d.quizzes>0) ? Math.round(weekData.filter(d=>d.quizzes>0).reduce((s,d)=>s+d.accuracy,0)/weekData.filter(d=>d.quizzes>0).length) : 0}%
                </div>
                <div style={{ fontSize:10, fontWeight:700, color:'#059669', textTransform:'uppercase', letterSpacing:'.06em' }}>Avg accuracy</div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* ━━━━━━━━━━━━━━━━ ROW 4: Weak Chapters + Summary ━━━━━━━━━━━━━━━━ */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          <ChartCard title="Weakest Chapters" icon={Brain} iconColor="#ef4444">
            {weakChapters.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {weakChapters.map((ch, i) => {
                  const c = accColor(ch.accuracy)
                  return (
                    <div key={i}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ width:22, height:22, borderRadius:6, background: ch.accuracy < 40 ? '#fff1f2' : ch.accuracy < 60 ? '#fffbeb' : '#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:c }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize:13, fontWeight:700, color:'#1e293b', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ch.name}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>{ch.total}q</span>
                          <span style={{ fontSize:13, fontWeight:900, color:c }}>{ch.accuracy}%</span>
                        </div>
                      </div>
                      <div style={{ height:6, background:'#f1f5f9', borderRadius:999, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:999, background:c, width:`${ch.accuracy}%`, transition:'width .8s cubic-bezier(.34,1.56,.64,1)' }} />
                      </div>
                    </div>
                  )
                })}
                <div style={{ marginTop:4, padding:'10px 14px', background:'#fff7ed', borderRadius:12, border:'1px solid #fed7aa', fontSize:12, fontWeight:600, color:'#c2410c' }}>
                  💡 Focus on these chapters to improve your overall score
                </div>
              </div>
            ) : <EmptyState msg="Need 2+ quizzes per chapter to identify weak areas" />}
          </ChartCard>

          <ChartCard title="Performance Summary" icon={Award} iconColor="#6366f1">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { icon:BookOpen,     label:'Total Attempted',  value:totalQuestions, color:'#3b82f6', bg:'#eff6ff' },
                { icon:CheckCircle2, label:'Correct Answers',  value:totalCorrect,   color:'#10b981', bg:'#ecfdf5' },
                { icon:XCircle,      label:'Wrong Answers',    value:totalWrong,     color:'#ef4444', bg:'#fff1f2' },
                { icon:Minus,        label:'Skipped',          value:totalSkipped,   color:'#64748b', bg:'#f8fafc' },
                { icon:Zap,          label:'Total XP Earned',  value:totalXP,        color:'#f59e0b', bg:'#fffbeb' },
              ].map(s => (
                <div key={s.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:14, border:'1px solid #f1f5f9', background:'#fafbff', transition:'all .15s ease' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <s.icon size={16} style={{ color:s.color }} />
                  </div>
                  <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#374151' }}>{s.label}</span>
                  <span style={{ fontSize:15, fontWeight:900, color:'#1e293b' }}>{s.value.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Accuracy ring summary */}
            {totalQuizzes > 0 && (
              <div style={{ marginTop:16, padding:'14px 16px', background:'linear-gradient(135deg,#ede9fe,#f5f3ff)', borderRadius:14, border:'1px solid #ddd6fe', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
                  <svg width="52" height="52" style={{ transform:'rotate(-90deg)' }}>
                    <circle cx="26" cy="26" r="21" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                    <circle cx="26" cy="26" r="21" fill="none" stroke="#6366f1" strokeWidth="5"
                      strokeDasharray={132}
                      strokeDashoffset={132 - (132 * avgAccuracy) / 100}
                      strokeLinecap="round" style={{ transition:'stroke-dashoffset 1s ease' }} />
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#4f46e5' }}>{avgAccuracy}%</div>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#4f46e5' }}>Overall Accuracy</div>
                  <div style={{ fontSize:11, color:'#7c3aed', marginTop:2 }}>
                    {avgAccuracy >= 70 ? '🏆 Excellent — JEE Ready!' : avgAccuracy >= 50 ? '📈 Good — Keep pushing!' : '📚 Needs improvement'}
                  </div>
                </div>
              </div>
            )}
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
