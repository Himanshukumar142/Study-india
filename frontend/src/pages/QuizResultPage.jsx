import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  CheckCircle2, XCircle, Minus, Trophy, RotateCcw, BookOpen,
  Clock, Crown, BarChart2, ChevronDown, ChevronUp, Zap, Target,
  Sparkles, AlertCircle, Star, TrendingUp, Award, Flame, Medal
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ── helpers ── */
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/* ── grade config ── */
function gradeOf(pct) {
  if (pct >= 90) return { label: 'Outstanding!',   emoji: '🏆', h1: '#10b981', accent: '#34d399', bg: 'from-[#022c22] via-[#0f172a] to-[#0f172a]' }
  if (pct >= 70) return { label: 'Excellent!',      emoji: '🎯', h1: '#60a5fa', accent: '#93c5fd', bg: 'from-[#0c1a3a] via-[#0f172a] to-[#0f172a]' }
  if (pct >= 40) return { label: 'Good Effort!',    emoji: '💪', h1: '#f59e0b', accent: '#fcd34d', bg: 'from-[#2d1b00] via-[#0f172a] to-[#0f172a]' }
  return          { label: 'Keep Practicing!', emoji: '📚', h1: '#f87171', accent: '#fca5a5', bg: 'from-[#2d0606] via-[#0f172a] to-[#0f172a]' }
}

/* ═══════════════════════════════════════════════
   ANIMATED COUNTER
═══════════════════════════════════════════════ */
function Counter({ to, decimals = 0, suffix = '', duration = 1000 }) {
  const [val, setVal] = useState(0)
  const n = parseFloat(to) || 0
  useEffect(() => {
    let raf, start, prev = 0
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(+(n * ease).toFixed(decimals))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [n])
  return <>{val.toFixed(decimals)}{suffix}</>
}

/* ═══════════════════════════════════════════════
   CONFETTI
═══════════════════════════════════════════════ */
function Confetti({ active, pct }) {
  const palette = pct >= 70
    ? ['#34d399','#6ee7b7','#fbbf24','#fde68a','#a78bfa','#c4b5fd']
    : pct >= 40
    ? ['#fbbf24','#f97316','#fb923c','#fde68a']
    : ['#f87171','#fca5a5','#fb923c','#fbbf24']

  if (!active) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {Array.from({ length: 28 }).map((_, i) => {
        const color = palette[i % palette.length]
        const left = `${(i * 3.7) % 100}%`
        const size = 5 + (i % 5) * 2
        const delay = `${(i * 0.09).toFixed(2)}s`
        const dur   = `${2.2 + (i % 4) * 0.5}s`
        const shape = i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%'
        return (
          <span key={i} style={{
            position: 'absolute', top: -12, left,
            width: size, height: size, borderRadius: shape,
            background: color, opacity: 0.9,
            animation: `qr-fall ${dur} ${delay} ease-in infinite`,
          }} />
        )
      })}
      <style>{`
        @keyframes qr-fall {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: .9; }
          80%  { opacity: .7; }
          100% { transform: translateY(105vh) rotate(600deg) scale(.6); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SCORE RING
═══════════════════════════════════════════════ */
function ScoreRing({ pct, accent }) {
  const [dash, setDash] = useState(0)
  const R = 58, C = 2 * Math.PI * R

  useEffect(() => {
    const t = setTimeout(() => setDash((pct / 100) * C), 300)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div className="relative flex items-center justify-center" style={{ width: 168, height: 168, flexShrink: 0 }}>
      {/* outer glow */}
      <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 60px ${accent}33`, borderRadius: '50%' }} />
      {/* glass backing */}
      <div className="absolute inset-3 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.07)' }} />

      <svg width={168} height={168} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        {/* track */}
        <circle cx={84} cy={84} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        {/* progress */}
        <circle
          cx={84} cy={84} r={R}
          fill="none"
          stroke={accent}
          strokeWidth={10}
          strokeDasharray={C}
          strokeDashoffset={C - dash}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)',
            filter: `drop-shadow(0 0 10px ${accent}cc)`,
          }}
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center">
        <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1.5px' }}>
          <Counter to={pct} />%
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4 }}>
          Accuracy
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   STAT TILE  (hero dark)
═══════════════════════════════════════════════ */
function DarkStatTile({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: `${color}10`,
      border: `1px solid ${color}28`,
      borderRadius: 16,
      padding: '14px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      transition: 'transform .2s',
      cursor: 'default',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <Icon size={17} color={color} />
      <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   LIGHT STAT TILE (body)
═══════════════════════════════════════════════ */
function LightTile({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{
      background: bg, borderRadius: 20, padding: '20px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      transition: 'transform .2s, box-shadow .2s', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${color}22` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
      <span style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   TOPIC BAR
═══════════════════════════════════════════════ */
function TopicBar({ topic, correct, total }) {
  const [w, setW] = useState(0)
  const pct   = total > 0 ? Math.round((correct / total) * 100) : 0
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'

  useEffect(() => { const t = setTimeout(() => setW(pct), 500); return () => clearTimeout(t) }, [pct])

  return (
    <div style={{ padding: '14px 16px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{topic}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{correct}/{total}</span>
          <span style={{
            fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8,
            background: `${color}15`, color, border: `1px solid ${color}30`,
          }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg,${color},${color}99)`,
          boxShadow: `0 0 8px ${color}55`,
          width: `${w}%`, transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   QUESTION REVIEW CARD
═══════════════════════════════════════════════ */
function QCard({ q, ans, idx, bookmarks, onToggle }) {
  const [open, setOpen] = useState(false)
  const correct  = ans?.isCorrect
  const skipped  = !ans?.selectedOption

  const status = correct ? 'correct' : skipped ? 'skip' : 'wrong'
  const meta = {
    correct: { icon: CheckCircle2, ic: '#10b981', bg: '#ecfdf5', border: '#10b98130', label: 'Correct',  lc: '#059669', lbg: '#ecfdf5', lborder: '#a7f3d0' },
    skip:    { icon: Minus,       ic: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0',   label: 'Skipped',  lc: '#64748b', lbg: '#f8fafc', lborder: '#e2e8f0' },
    wrong:   { icon: XCircle,     ic: '#ef4444', bg: '#fff1f2', border: '#ef444430', label: 'Wrong',    lc: '#ef4444', lbg: '#fff1f2', lborder: '#fecaca' },
  }[status]

  const StatusIcon = meta.icon

  return (
    <div style={{
      borderRadius: 18,
      border: `1.5px solid ${open ? meta.ic + '50' : '#e2e8f0'}`,
      background: '#fff',
      boxShadow: open ? `0 6px 32px ${meta.ic}18` : '0 1px 4px rgba(0,0,0,0.05)',
      transition: 'border-color .25s, box-shadow .25s',
      overflow: 'hidden',
    }}>
      {/* header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {/* status icon */}
        <div style={{ width: 38, height: 38, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <StatusIcon size={19} color={meta.ic} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Q{idx + 1}</span>
            <span style={{
              fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '2px 8px', borderRadius: 99,
              color: meta.lc, background: meta.lbg, border: `1px solid ${meta.lborder}`,
            }}>
              {correct ? '✓ ' : skipped ? '— ' : '✗ '}{meta.label}
            </span>
            {q.difficulty && (
              <span style={{
                fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '2px 8px', borderRadius: 99,
                ...(q.difficulty === 'hard'
                  ? { color: '#ef4444', background: '#fff1f2', border: '1px solid #fecaca' }
                  : q.difficulty === 'medium'
                  ? { color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a' }
                  : { color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' })
              }}>{q.difficulty}</span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: 8 }}>
              {q.marks > 0 ? `+${q.marks}` : q.marks} / {q.negativeMarking ?? '−1'} pts
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.6, margin: 0 }}>{q.question}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, alignSelf: 'center', marginLeft: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); onToggle(q._id) }}
            style={{
              width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...(bookmarks.includes(q._id)
                ? { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6' }
                : { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }),
              cursor: 'pointer', transition: 'all .2s',
            }}
          ><BookOpen size={13} /></button>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {open ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
          </div>
        </div>
      </button>

      {/* expanded */}
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ height: 14 }} />
          {q.options ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
              {Object.entries(q.options).map(([key, val]) => {
                const sel  = ans?.selectedOption === key
                const corr = String(q.correct).trim().toUpperCase() === key.toUpperCase()
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: '2px solid',
                    ...(corr
                      ? { background: '#f0fdf4', borderColor: '#86efac', color: '#14532d' }
                      : sel
                      ? { background: '#fff1f2', borderColor: '#fca5a5', color: '#7f1d1d' }
                      : { background: '#f8fafc', borderColor: '#f1f5f9', color: '#475569' }),
                    fontSize: 13, fontWeight: 500,
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 900, flexShrink: 0,
                      ...(corr ? { background: '#22c55e', color: '#fff' }
                        : sel  ? { background: '#ef4444', color: '#fff' }
                        :        { background: '#e2e8f0', color: '#64748b' }),
                    }}>{key}</span>
                    <span style={{ flex: 1, lineHeight: 1.45 }}>{val}</span>
                    {corr && <CheckCircle2 size={15} color="#22c55e" />}
                    {sel && !corr && <XCircle size={15} color="#ef4444" />}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, display: 'flex', gap: 16 }}>
              <span style={{ color: '#64748b' }}>Your answer: <strong style={{ color: '#1e293b' }}>{ans?.selectedOption || '—'}</strong></span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ color: '#10b981' }}>Correct: <strong>{q.correct}</strong></span>
            </div>
          )}

          {q.explanation && (
            <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1px solid #c7d2fe', display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.6 }}>
              <Sparkles size={15} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
              <div><span style={{ fontWeight: 800, color: '#3730a3' }}>AI Explanation: </span><span style={{ color: '#475569' }}>{q.explanation}</span></div>
            </div>
          )}

          {skipped && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
              This question was skipped — no negative marks applied.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function QuizResultPage() {
  const { id } = useParams()
  const nav    = useNavigate()
  const [result, setResult]       = useState(null)
  const [rank, setRank]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [bookmarks, setBookmarks] = useState([])
  const [showAll, setShowAll]     = useState(false)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get(`/quizzes/result/${id}`)
        setResult(data.data)
        if (data.data.mockTestId) {
          const lb  = await api.get(`/mock-tests/${data.data.mockTestId}/leaderboard`)
          const idx = lb.data.data?.findIndex(a => a._id === id)
          if (idx !== -1) setRank(idx + 1)
        }
      } catch { toast.error('Failed to load result') }
      finally  { setLoading(false) }
    })()
    ;(async () => {
      try {
        const { data } = await api.get('/bookmarks')
        setBookmarks(data.data.filter(b => b.type === 'question').map(b => b.itemId?._id || b.itemId))
      } catch {}
    })()
  }, [id])

  useEffect(() => { if (!loading) setTimeout(() => setMounted(true), 60) }, [loading])

  const toggleBM = async qid => {
    const isB = bookmarks.includes(qid)
    try {
      if (isB) { await api.delete(`/bookmarks/question/${qid}`); setBookmarks(p => p.filter(x => x !== qid)) }
      else      { await api.post(`/bookmarks/question/${qid}`);   setBookmarks(p => [...p, qid]) }
      toast.success(isB ? 'Removed from Bookmarks' : 'Saved to Bookmarks')
    } catch { toast.error('Failed to update bookmark') }
  }

  /* ── loading ── */
  if (loading) return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f1a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 48, height: 48 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.15)' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Loading your results…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  /* ── not found ── */
  if (!result) return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, background: '#0b0f1a' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: '#ff00001a', border: '1px solid #ff000030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={32} color="#ef4444" />
      </div>
      <p style={{ color: '#64748b', fontWeight: 600 }}>Result not found.</p>
      <button onClick={() => nav('/quiz')} style={{ padding: '10px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
        Back to Quiz Center
      </button>
    </div>
  )

  const { questions, xpAwarded, obtainedMarks, totalMarks, accuracy, correct, wrong, skipped, timeTakenSeconds, mode } = result
  const pct     = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0
  const grade   = gradeOf(pct)
  const ansMap  = {}
  result.answers?.forEach(a => { ansMap[a.questionId] = a })
  const displayed = showAll ? questions : questions?.slice(0, 5)

  return (
    <div style={{ minHeight: '100%', background: '#f1f5f9', opacity: mounted ? 1 : 0, transition: 'opacity 0.45s ease' }}>

      {/* ════════════ HERO ════════════ */}
      <div className={`bg-gradient-to-br ${grade.bg}`} style={{ position: 'relative', overflow: 'hidden', paddingBottom: 56 }}>
        <Confetti active={mounted} pct={pct} />

        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: `${grade.accent}0c`, filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: -60, width: 240, height: 240, borderRadius: '50%', background: '#7c3aed0c', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 760, margin: '0 auto', padding: '48px 24px 0' }}>

          {/* breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 36 }}>
            <Crown size={12} color={grade.accent} />
            <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
              {mode || 'Quiz'} · Result Report
            </span>
          </div>

          {/* main hero content */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
            {/* ring */}
            <ScoreRing pct={pct} accent={grade.accent} />

            {/* headline */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-1px', lineHeight: 1.1 }}>
                {grade.emoji} {grade.label}
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', fontWeight: 600, margin: 0 }}>
                <Counter to={obtainedMarks} decimals={1} /> / {totalMarks} Marks · <Counter to={accuracy} />% Accuracy
              </p>
            </div>

            {/* stat tiles row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, width: '100%', maxWidth: 560 }}>
              <DarkStatTile icon={CheckCircle2} label="Correct"  value={correct}               color="#34d399" />
              <DarkStatTile icon={XCircle}      label="Wrong"    value={wrong}                  color="#f87171" />
              <DarkStatTile icon={Minus}        label="Skipped"  value={skipped}                color="#94a3b8" />
              <DarkStatTile icon={Clock}        label="Time"     value={fmt(timeTakenSeconds||0)} color="#60a5fa" />
            </div>

            {/* XP / rank / fire badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 99, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)', color: '#fbbf24', fontSize: 12, fontWeight: 800 }}>
                <Zap size={14} fill="#fbbf24" /> +<Counter to={xpAwarded || 0} /> XP Earned
              </div>
              {rank && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 99, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(245,158,11,0.28)', color: '#f59e0b', fontSize: 12, fontWeight: 800 }}>
                  <Trophy size={14} /> Rank #{rank}
                </div>
              )}
              {pct >= 70 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 99, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 12, fontWeight: 800 }}>
                  <Flame size={14} /> On Fire!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* wave divider */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 52" preserveAspectRatio="none" style={{ width: '100%', height: 52, display: 'block' }}>
            <path d="M0,52 C360,0 1080,0 1440,52 L1440,52 L0,52 Z" fill="#f1f5f9" />
          </svg>
        </div>
      </div>

      {/* ════════════ BODY ════════════ */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Performance Breakdown card ── */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#6366f1" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Performance Breakdown</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            <LightTile icon={Star}   label="Total Score" value={`${obtainedMarks?.toFixed(1)} / ${totalMarks}`} color="#6366f1" bg="#eef2ff" />
            <LightTile icon={Target} label="Accuracy"    value={`${accuracy}%`}                                color="#10b981" bg="#ecfdf5" />
            <LightTile icon={Award}  label="XP Earned"   value={`+${xpAwarded || 0}`}                          color="#f59e0b" bg="#fffbeb" />
          </div>
        </div>

        {/* ── Topic Analysis ── */}
        {result.topicAnalysis?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={18} color="#3b82f6" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Topic-wise Analysis</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10 }}>
              {result.topicAnalysis.map((t, i) => (
                <TopicBar key={i} topic={t.topic} correct={t.correct} total={t.total} />
              ))}
            </div>
          </div>
        )}

        {/* ── Question Review ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', padding: '14px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={17} color="#8b5cf6" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Question Review</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { c: '#059669', bg: '#ecfdf5', b: '#a7f3d0', v: `✓ ${correct}` },
                { c: '#ef4444', bg: '#fff1f2', b: '#fecaca', v: `✗ ${wrong}` },
                { c: '#64748b', bg: '#f8fafc', b: '#e2e8f0', v: `— ${skipped}` },
              ].map(x => (
                <span key={x.v} style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, color: x.c, background: x.bg, border: `1px solid ${x.b}` }}>
                  {x.v}
                </span>
              ))}
            </div>
          </div>

          {/* cards */}
          {displayed?.map((q, idx) => (
            <QCard key={q._id} q={q} ans={ansMap[q._id]} idx={idx} bookmarks={bookmarks} onToggle={toggleBM} />
          ))}

          {/* show more */}
          {questions?.length > 5 && (
            <button
              onClick={() => setShowAll(v => !v)}
              style={{
                width: '100%', padding: '15px', borderRadius: 16,
                background: '#fff', border: '1.5px dashed #cbd5e1',
                fontSize: 13, fontWeight: 700, color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer', transition: 'all .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#334155' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b' }}
            >
              {showAll
                ? <><ChevronUp size={15} /> Show less</>
                : <><ChevronDown size={15} /> Show all {questions.length} questions</>}
            </button>
          )}
        </div>

        {/* ── CTA Buttons ── */}
        <div style={{ display: 'grid', gridTemplateColumns: result.mockTestId ? 'repeat(3,1fr)' : '1fr 1fr', gap: 12 }}>
          {result.mockTestId && (
            <button
              onClick={() => nav(`/mock-test/leaderboard/${result.mockTestId}`)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '15px 12px', borderRadius: 16, cursor: 'pointer', border: '1.5px solid #fde68a',
                background: 'linear-gradient(135deg,#fffbeb,#fef9c3)',
                color: '#92400e', fontSize: 13, fontWeight: 800,
                boxShadow: '0 4px 16px rgba(251,191,36,0.15)', transition: 'all .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Trophy size={16} /> Leaderboard
            </button>
          )}

          <button
            onClick={() => nav('/quiz')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '15px 12px', borderRadius: 16, cursor: 'pointer',
              border: '1.5px solid #e2e8f0', background: '#f8fafc',
              color: '#475569', fontSize: 13, fontWeight: 800,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#f8fafc' }}
          >
            <BookOpen size={16} /> Quiz Center
          </button>

          <button
            onClick={() => nav(-1)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '15px 12px', borderRadius: 16, cursor: 'pointer', border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', fontSize: 13, fontWeight: 800,
              boxShadow: '0 8px 24px rgba(99,102,241,0.35)', transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.35)' }}
          >
            <RotateCcw size={16} /> Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
