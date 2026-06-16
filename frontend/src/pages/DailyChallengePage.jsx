import { useState, useEffect, useRef } from 'react'
import {
  Flame, Zap, CheckCircle2, XCircle, Clock, Trophy, ChevronRight, ChevronLeft,
  Star, RotateCcw, Sparkles, Target, Calendar, Award, TrendingUp, Shield, Brain
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

const diffStyle = (d) => {
  if (d === 'hard') return { bg: '#fff1f2', color: '#e11d48', border: '#fca5a5' }
  if (d === 'easy') return { bg: '#ecfdf5', color: '#059669', border: '#6ee7b7' }
  return { bg: '#fffbeb', color: '#d97706', border: '#fcd34d' }
}

export default function DailyChallengePage() {
  const [phase,      setPhase]      = useState('loading')
  const [challenge,  setChallenge]  = useState(null)
  const [current,    setCurrent]    = useState(0)
  const [answers,    setAnswers]    = useState({})
  const [result,     setResult]     = useState(null)
  const [history,    setHistory]    = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [timer,      setTimer]      = useState(0)

  useEffect(() => {
    loadChallenge()
    api.get('/daily-challenge/history').then(r => setHistory(r.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => setTimer(p => p + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const loadChallenge = async () => {
    try {
      const { data } = await api.get('/daily-challenge')
      setChallenge(data.data)
      if (data.data.userAttempted) { setResult(data.data.userResult); setPhase('result') }
      else setPhase('intro')
    } catch { setPhase('intro'); toast.error('Failed to load challenge') }
  }

  const startChallenge = () => { setPhase('playing'); setCurrent(0); setAnswers({}); setTimer(0) }
  const selectAnswer = (opt) => setAnswers(prev => ({ ...prev, [current]: opt }))

  const submitChallenge = async () => {
    if (!challenge) return
    setSubmitting(true)
    const ansArray = challenge.questions.map((q, i) => ({ questionId: q._id, selectedOption: answers[i] || null }))
    try {
      const { data } = await api.post('/daily-challenge/submit', { answers: ansArray })
      setResult(data.data); setPhase('result'); toast.success(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Submit failed') }
    finally { setSubmitting(false) }
  }

  const streak = history.length
  const answeredCount = Object.keys(answers).length

  /* ───────────────────────────── STYLES ───────────────────────── */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    .dc-root * { box-sizing:border-box; font-family:'Inter',system-ui,sans-serif; }
    @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
    @keyframes ping     { 75%,100%{transform:scale(2);opacity:0} }
    @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes glow     { 0%,100%{box-shadow:0 0 20px rgba(251,191,36,.3)} 50%{box-shadow:0 0 40px rgba(251,191,36,.6)} }
    @keyframes countUp  { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:scale(1)} }
    .dc-fade-up  { animation:fadeUp  .4s ease forwards; }
    .dc-fade-in  { animation:fadeIn  .3s ease forwards; }
    .dc-spin     { animation:spin   .8s linear infinite; }
    .dc-float    { animation:float   3s ease-in-out infinite; }
    .dc-glow     { animation:glow    2s ease-in-out infinite; }
    .dc-count-up { animation:countUp .5s cubic-bezier(.34,1.56,.64,1) forwards; }

    .dc-card {
      background:white; border-radius:20px; border:1px solid rgba(226,232,240,.8);
      box-shadow:0 4px 24px rgba(0,0,0,.05);
    }
    .dc-option {
      width:100%; text-align:left; display:flex; align-items:center; gap:14px;
      padding:16px 20px; border-radius:16px; border:2px solid #e8eaf6;
      background:white; cursor:pointer; transition:all .2s cubic-bezier(.16,1,.3,1);
      font-size:14px; font-weight:500; color:#374151; font-family:inherit;
      box-shadow:0 1px 4px rgba(0,0,0,.04);
    }
    .dc-option:hover { border-color:#fbbf24; background:#fffbeb; transform:translateX(3px); }
    .dc-option.selected {
      border-color:#f59e0b; background:linear-gradient(135deg,#f59e0b,#f97316);
      color:white; box-shadow:0 8px 24px rgba(245,158,11,.3); transform:translateX(0);
    }
    .dc-option.selected .dc-opt-key { background:rgba(255,255,255,.2); color:white; }
    .dc-opt-key {
      width:36px; height:36px; border-radius:10px; background:#f1f5f9; color:#6b7280;
      display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0;
    }

    .dc-nav-dot {
      width:10px; height:10px; border-radius:50%; cursor:pointer;
      transition:all .2s ease; border:none; padding:0;
    }
    .dc-nav-dot.answered { background:#f59e0b; }
    .dc-nav-dot.current  { background:#f97316; transform:scale(1.4); box-shadow:0 0 0 3px rgba(249,115,22,.2); }
    .dc-nav-dot.empty    { background:#e2e8f0; }
  `

  /* ───────────────────────────── LOADING ──────────────────────── */
  if (phase === 'loading') return (
    <div className="dc-root" style={{ minHeight:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8f9fc' }}>
      <style>{css}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:56, height:56, position:'relative', margin:'0 auto 16px' }}>
          <div style={{ position:'absolute', inset:0, border:'3px solid #fde68a', borderRadius:'50%' }} />
          <div className="dc-spin" style={{ position:'absolute', inset:0, border:'3px solid transparent', borderTopColor:'#f59e0b', borderRadius:'50%' }} />
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8' }}>Loading today's challenge…</div>
      </div>
    </div>
  )

  /* ───────────────────────────── INTRO ────────────────────────── */
  if (phase === 'intro') return (
    <div className="dc-root" style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#fef3c7 40%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui" }}>
      <style>{css}</style>
      <div style={{ maxWidth:580, margin:'0 auto', padding:'36px 24px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Hero Banner */}
        <div className="dc-fade-up" style={{
          background: 'linear-gradient(135deg,#92400e 0%,#b45309 30%,#d97706 60%,#f59e0b 100%)',
          borderRadius:28, padding:'40px 40px 36px', color:'white', textAlign:'center',
          position:'relative', overflow:'hidden',
          boxShadow:'0 20px 60px rgba(245,158,11,.35)'
        }}>
          {/* Decorative blobs */}
          <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.08)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-30, left:-30, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />

          {/* Flame Icon */}
          <div className="dc-float" style={{ width:80, height:80, borderRadius:24, background:'rgba(255,255,255,.15)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', border:'1px solid rgba(255,255,255,.2)' }}>
            <Flame size={40} style={{ color:'#fef08a' }} />
          </div>

          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.7)', marginBottom:8 }}>
            🗓️ {today}
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,42px)', fontWeight:900, margin:'0 0 8px', lineHeight:1.1 }}>
            Daily Challenge
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.7)', margin:'0 0 28px' }}>
            Fresh questions every day · No negative marking
          </p>

          {/* Stats Row */}
          <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
            {[
              { label:'Questions',  val: challenge?.questions?.length || 5, icon:'📝' },
              { label:'Bonus XP',   val: `+${challenge?.bonusXP || 50}`,    icon:'⚡' },
              { label:'Day Streak', val: streak,                             icon:'🔥' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,.15)', backdropFilter:'blur(8px)', borderRadius:16, padding:'14px 20px', textAlign:'center', border:'1px solid rgba(255,255,255,.15)', minWidth:90 }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontSize:20, fontWeight:900, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.65)', marginTop:3, letterSpacing:'.05em', textTransform:'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules Card */}
        <div className="dc-card dc-fade-up" style={{ padding:24 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#1e293b', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#fef3c7,#fde68a)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Star size={14} style={{ color:'#b45309' }} />
            </div>
            Challenge Rules
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { icon:'🎯', text:`${challenge?.questions?.length || 5} curated questions from all subjects` },
              { icon:'✅', text:'No negative marking — attempt freely!' },
              { icon:'⚡', text:`Complete to earn +${challenge?.bonusXP || 50} bonus XP` },
              { icon:'📅', text:"New challenge drops every day at midnight" },
            ].map((r, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:18 }}>{r.icon}</span>
                <span style={{ fontSize:13, fontWeight:500, color:'#374151', lineHeight:1.5 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button onClick={startChallenge} disabled={!challenge?.questions?.length} style={{
          width:'100%', padding:'18px 32px', borderRadius:18, border:'none',
          background: challenge?.questions?.length ? 'linear-gradient(135deg,#f59e0b,#f97316)' : '#e2e8f0',
          color: challenge?.questions?.length ? 'white' : '#94a3b8',
          fontWeight:900, fontSize:16, cursor: challenge?.questions?.length ? 'pointer' : 'not-allowed',
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          boxShadow: challenge?.questions?.length ? '0 8px 32px rgba(245,158,11,.4)' : 'none',
          transition:'all .2s ease', fontFamily:'inherit'
        }}>
          <Zap size={20} style={{ fill: challenge?.questions?.length ? '#fef08a' : 'transparent' }} />
          Accept Today's Challenge
        </button>

        {/* History */}
        {history.length > 0 && (
          <div className="dc-card dc-fade-up" style={{ padding:24 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#1e293b', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Calendar size={15} style={{ color:'#94a3b8' }} />
                Recent History
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:'#f59e0b', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'3px 10px' }}>
                🔥 {streak} day streak
              </span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:200, overflowY:'auto' }}>
              {history.slice(0, 8).map((h, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12, background:'#fafafa', border:'1px solid #f1f5f9' }}>
                  <div style={{ width:28, height:28, borderRadius:8, background: h.accuracy >= 70 ? '#ecfdf5' : h.accuracy >= 40 ? '#fffbeb' : '#fff1f2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>
                    {h.accuracy >= 70 ? '🏆' : h.accuracy >= 40 ? '👍' : '📚'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:4 }}>{h.chapter || 'Daily Challenge'}</div>
                    <div style={{ height:5, background:'#e2e8f0', borderRadius:999, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:999, background: h.accuracy >= 70 ? 'linear-gradient(90deg,#10b981,#059669)' : h.accuracy >= 40 ? 'linear-gradient(90deg,#f59e0b,#f97316)' : 'linear-gradient(90deg,#f43f5e,#e11d48)', width:`${h.accuracy}%`, transition:'width .6s ease' }} />
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:900, color:'#1e293b' }}>{h.accuracy}%</div>
                    <div style={{ fontSize:10, fontWeight:700, color:'#f59e0b' }}>+{h.xpAwarded}XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  /* ───────────────────────────── PLAYING ──────────────────────── */
  if (phase === 'playing') {
    const q = challenge?.questions?.[current]
    if (!q) return null
    const progress = ((current + 1) / challenge.questions.length) * 100
    const ds = diffStyle(q.difficulty)

    return (
      <div className="dc-root" style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#fef3c7 40%,#f8f9fc 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
        <style>{css}</style>
        <div style={{ maxWidth:620, width:'100%', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Top progress bar */}
          <div className="dc-card dc-fade-in" style={{ padding:'16px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              {/* Badge */}
              <div style={{ background:'linear-gradient(135deg,#f59e0b,#f97316)', borderRadius:10, padding:'6px 12px', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                <Flame size={13} style={{ color:'#fef08a' }} />
                <span style={{ fontSize:11, fontWeight:800, color:'white', letterSpacing:'.04em', textTransform:'uppercase' }}>Daily</span>
              </div>

              {/* Progress */}
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8' }}>Question {current + 1} of {challenge.questions.length}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8' }}>{answeredCount} answered</span>
                </div>
                <div style={{ height:6, background:'#e8eaf6', borderRadius:999, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'linear-gradient(90deg,#f59e0b,#f97316)', borderRadius:999, width:`${progress}%`, transition:'width .4s ease' }} />
                </div>
              </div>

              {/* Timer */}
              <div style={{ background:'#1e293b', borderRadius:10, padding:'6px 14px', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                <Clock size={12} style={{ color:'#94a3b8' }} />
                <span style={{ fontSize:13, fontWeight:900, color:'white', fontFamily:'monospace' }}>{fmt(timer)}</span>
              </div>
            </div>

            {/* Navigation dots */}
            <div style={{ display:'flex', gap:6, marginTop:12, justifyContent:'center' }}>
              {challenge.questions.map((_, i) => (
                <button key={i}
                  className={`dc-nav-dot ${i === current ? 'current' : answers[i] ? 'answered' : 'empty'}`}
                  onClick={() => setCurrent(i)}
                  title={`Q${i+1}`}
                />
              ))}
            </div>
          </div>

          {/* Question Card */}
          <div className="dc-card dc-fade-up" style={{ padding:32 }}>
            {/* Q header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <div style={{ display:'flex', gap:8 }}>
                <span style={{ background:'#fff7ed', color:'#c2410c', border:'1px solid #fed7aa', borderRadius:8, padding:'4px 12px', fontSize:11, fontWeight:800, letterSpacing:'.04em' }}>
                  {q.subject || 'General'}
                </span>
                {q.difficulty && (
                  <span style={{ background:ds.bg, color:ds.color, border:`1px solid ${ds.border}`, borderRadius:8, padding:'4px 12px', fontSize:11, fontWeight:800, letterSpacing:'.04em', textTransform:'capitalize' }}>
                    {q.difficulty}
                  </span>
                )}
              </div>
              <div style={{ width:36, height:36, borderRadius:12, background:'linear-gradient(135deg,#f59e0b,#f97316)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color:'white', boxShadow:'0 4px 12px rgba(245,158,11,.4)' }}>
                {current + 1}
              </div>
            </div>

            {/* Question text */}
            <p style={{ fontSize:17, fontWeight:600, color:'#1e293b', lineHeight:1.7, marginBottom:24 }}>{q.question}</p>

            {/* Options */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {q.options && Object.entries(q.options).map(([k, v]) => {
                const isSelected = answers[current] === k
                return (
                  <button key={k} className={`dc-option${isSelected?' selected':''}`} onClick={() => selectAnswer(k)}>
                    <span className="dc-opt-key">{k}</span>
                    <span style={{ flex:1, lineHeight:1.6 }}>{v}</span>
                    {isSelected && <CheckCircle2 size={18} style={{ color:'rgba(255,255,255,.9)', flexShrink:0 }} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setCurrent(c => c - 1)} disabled={current === 0} style={{
              padding:'12px 24px', borderRadius:14, border:'1.5px solid #e2e8f0', background:'white',
              fontSize:13, fontWeight:700, color:'#374151', cursor: current === 0 ? 'not-allowed' : 'pointer',
              opacity: current === 0 ? .4 : 1, display:'flex', alignItems:'center', gap:6, fontFamily:'inherit'
            }}>
              <ChevronLeft size={16} /> Prev
            </button>

            <div style={{ flex:1 }} />

            {current < challenge.questions.length - 1 ? (
              <button onClick={() => setCurrent(c => c + 1)} style={{
                padding:'12px 28px', borderRadius:14, border:'none',
                background:'linear-gradient(135deg,#f59e0b,#f97316)', color:'white',
                fontSize:13, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                boxShadow:'0 4px 16px rgba(245,158,11,.35)', fontFamily:'inherit'
              }}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={submitChallenge} disabled={submitting} style={{
                padding:'12px 28px', borderRadius:14, border:'none',
                background: submitting ? '#e2e8f0' : 'linear-gradient(135deg,#10b981,#059669)',
                color: submitting ? '#94a3b8' : 'white',
                fontSize:13, fontWeight:800, cursor: submitting ? 'wait' : 'pointer',
                display:'flex', alignItems:'center', gap:8,
                boxShadow: submitting ? 'none' : '0 4px 16px rgba(16,185,129,.35)', fontFamily:'inherit'
              }}>
                {submitting
                  ? <><span className="dc-spin" style={{ width:14, height:14, border:'2px solid #94a3b8', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block' }} /> Submitting…</>
                  : <><CheckCircle2 size={16} /> Submit ({answeredCount}/{challenge.questions.length})</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ───────────────────────────── RESULT ───────────────────────── */
  if (phase === 'result' && result) {
    const pct   = result.totalMarks > 0 ? Math.round((result.obtainedMarks / result.totalMarks) * 100) : 0
    const grade = pct >= 80
      ? { emoji:'🔥', label:'Excellent!',    scoreColor:'#10b981' }
      : pct >= 50
      ? { emoji:'💪', label:'Good Job!',     scoreColor:'#f59e0b' }
      : { emoji:'📚', label:'Keep Trying!',  scoreColor:'#f43f5e' }

    return (
      <div className="dc-root" style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#fef3c7 40%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui" }}>
        <style>{css}</style>
        <div style={{ maxWidth:580, margin:'0 auto', padding:'36px 24px', display:'flex', flexDirection:'column', gap:20 }}>

          {/* Score Banner */}
          <div className="dc-fade-up" style={{
            background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 45%,#1c3252 100%)',
            borderRadius:28, padding:'40px', color:'white', textAlign:'center', position:'relative', overflow:'hidden',
            boxShadow:'0 20px 60px rgba(99,102,241,.25)'
          }}>
            <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220, borderRadius:'50%', background:'rgba(245,158,11,.12)', filter:'blur(40px)', pointerEvents:'none' }} />

            {/* Trophy */}
            <div style={{ position:'relative', margin:'0 auto 24px', width:80, height:80 }}>
              <div className="dc-glow" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'linear-gradient(135deg,#fbbf24,#f97316)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
                <Trophy size={36} style={{ color:'white' }} />
              </div>
            </div>

            <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.5)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>
              Challenge Complete
            </div>

            <div className="dc-count-up" style={{ fontSize:64, fontWeight:900, color: grade.scoreColor, lineHeight:1, marginBottom:8 }}>
              {pct}%
            </div>

            <div style={{ fontSize:22, fontWeight:800, marginBottom:20 }}>
              {grade.emoji} {grade.label}
            </div>

            {/* Stats row */}
            <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
              {[
                { label:'Correct',  val: result.correct,         bg:'rgba(16,185,129,.2)',  color:'#6ee7b7' },
                { label:'Wrong',    val: result.wrong,           bg:'rgba(244,63,94,.2)',   color:'#fca5a5' },
                { label:'XP Earned',val: `+${result.xpAwarded}`,bg:'rgba(251,191,36,.2)',  color:'#fde68a' },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:16, padding:'14px 20px', border:`1px solid ${s.color}25`, textAlign:'center', minWidth:90 }}>
                  <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:'.06em', marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance breakdown */}
          {challenge?.questions && (
            <div className="dc-card dc-fade-up" style={{ padding:24 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#1e293b', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <Brain size={15} style={{ color:'#6366f1' }} /> Question Review
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {challenge.questions.map((q, i) => {
                  const userAns   = result?.answers?.[i]?.selectedOption
                  const isCorrect = userAns === q.correct
                  const isSkipped = !userAns
                  return (
                    <div key={i} style={{
                      display:'flex', alignItems:'flex-start', gap:12, padding:'12px 14px',
                      borderRadius:12, background: isSkipped ? '#f8fafc' : isCorrect ? '#f0fdf4' : '#fff1f2',
                      border:`1px solid ${isSkipped ? '#e2e8f0' : isCorrect ? '#6ee7b7' : '#fca5a5'}`
                    }}>
                      <div style={{ width:26, height:26, borderRadius:8, background: isSkipped ? '#e2e8f0' : isCorrect ? '#10b981' : '#ef4444', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:900, color:'white' }}>
                        {i + 1}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:600, color:'#374151', lineHeight:1.5, margin:'0 0 4px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{q.question}</p>
                        {!isSkipped && (
                          <div style={{ fontSize:11, color: isCorrect ? '#059669' : '#dc2626', fontWeight:700 }}>
                            Your answer: {userAns} · {isCorrect ? '✓ Correct' : `✗ Wrong (Correct: ${q.correct})`}
                          </div>
                        )}
                        {isSkipped && <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>Skipped</div>}
                      </div>
                      {isCorrect && !isSkipped && <CheckCircle2 size={16} style={{ color:'#10b981', flexShrink:0 }} />}
                      {!isCorrect && !isSkipped && <XCircle size={16} style={{ color:'#ef4444', flexShrink:0 }} />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }} className="dc-fade-up">
            <button onClick={() => window.location.reload()} style={{
              padding:'14px', borderRadius:14, border:'1.5px solid #e2e8f0', background:'white',
              fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              color:'#374151', fontFamily:'inherit'
            }}>
              <RotateCcw size={16} /> Back
            </button>
            <button onClick={() => window.location.href = '/quiz'} style={{
              padding:'14px', borderRadius:14, border:'none',
              background:'linear-gradient(135deg,#f59e0b,#f97316)', color:'white',
              fontWeight:800, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow:'0 4px 16px rgba(245,158,11,.35)', fontFamily:'inherit'
            }}>
              <Target size={16} /> More Quizzes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
