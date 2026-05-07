import { useState, useEffect } from 'react'
import { Flame, Zap, CheckCircle2, XCircle, Clock, Trophy, ChevronRight, ChevronLeft, Star, RotateCcw, Sparkles, Target, Calendar } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function DailyChallengePage() {
  const [phase, setPhase] = useState('loading') // loading | intro | playing | result
  const [challenge, setChallenge] = useState(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    loadChallenge()
    api.get('/daily-challenge/history').then(r => setHistory(r.data.data || [])).catch(() => {})
  }, [])

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => setTimer(p => p + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const loadChallenge = async () => {
    try {
      const { data } = await api.get('/daily-challenge')
      setChallenge(data.data)
      if (data.data.userAttempted) {
        setResult(data.data.userResult)
        setPhase('result')
      } else {
        setPhase('intro')
      }
    } catch {
      setPhase('intro')
      toast.error('Failed to load challenge')
    }
  }

  const startChallenge = () => {
    setPhase('playing')
    setCurrent(0)
    setAnswers({})
    setTimer(0)
  }

  const selectAnswer = (opt) => setAnswers(prev => ({ ...prev, [current]: opt }))

  const submitChallenge = async () => {
    if (!challenge) return
    setSubmitting(true)
    const ansArray = challenge.questions.map((q, i) => ({
      questionId: q._id,
      selectedOption: answers[i] || null,
    }))
    try {
      const { data } = await api.post('/daily-challenge/submit', { answers: ansArray })
      setResult(data.data)
      setPhase('result')
      toast.success(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed')
    } finally { setSubmitting(false) }
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const streak = history.length

  // ─── LOADING ─────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="min-h-full flex items-center justify-center bg-[#f8fafc]">
      <div className="w-12 h-12 relative"><div className="absolute inset-0 border-4 border-slate-200 rounded-full" /><div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
    </div>
  )

  // ─── INTRO ───────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-8 text-white shadow-2xl shadow-orange-500/25 relative overflow-hidden text-center">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Flame size={40} className="text-yellow-200" />
          </div>
          <h1 className="text-3xl font-black mb-2">Daily Challenge</h1>
          <p className="text-orange-100 text-sm">{today}</p>
          <div className="flex justify-center gap-4 mt-6">
            <div className="bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
              <p className="text-lg font-black">{challenge?.questions?.length || 5}</p>
              <p className="text-[10px] font-bold text-orange-100">Questions</p>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
              <p className="text-lg font-black">+{challenge?.bonusXP || 50}</p>
              <p className="text-[10px] font-bold text-orange-100">Bonus XP</p>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
              <p className="text-lg font-black">{streak}</p>
              <p className="text-[10px] font-bold text-orange-100">Day Streak</p>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
          {['5 random questions from all subjects', 'No negative marking — answer freely!', `Complete for +${challenge?.bonusXP || 50} bonus XP`, 'Available once per day — don\'t miss it!'].map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Star size={12} className="text-amber-600" />
              </div>
              <p className="text-sm text-slate-600">{r}</p>
            </div>
          ))}
        </div>

        <button onClick={startChallenge} disabled={!challenge?.questions?.length}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-base shadow-xl shadow-orange-500/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-40">
          <Zap size={20} /> Accept Challenge
        </button>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-slate-900 text-sm mb-3 flex items-center gap-2"><Calendar size={14} className="text-slate-400" /> Recent History</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.slice(0, 10).map((h, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 w-20">{h.chapter}</span>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${h.accuracy}%` }} />
                  </div>
                  <span className="text-xs font-black text-slate-700">{h.accuracy}%</span>
                  <span className="text-[10px] text-amber-600 font-bold">+{h.xpAwarded}XP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ─── PLAYING ─────────────────────────────────────────────────
  if (phase === 'playing') {
    const q = challenge?.questions?.[current]
    if (!q) return null
    const answeredCount = Object.keys(answers).length

    return (
      <div className="min-h-full bg-[#f8fafc] flex items-center justify-center p-5">
        <div className="max-w-xl w-full space-y-5">
          {/* Top bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-xs font-black border border-amber-100">
              <Flame size={13} /> Daily Challenge
            </div>
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all" style={{ width: `${((current + 1) / challenge.questions.length) * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-400 tabular-nums">{fmt(timer)}</span>
          </div>

          {/* Question card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg border border-amber-100 uppercase">{q.subject}</span>
              {q.difficulty && <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase ${q.difficulty === 'hard' ? 'bg-rose-50 text-rose-600 border-rose-100' : q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{q.difficulty}</span>}
            </div>

            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-xs flex-shrink-0">{current + 1}</div>
              <p className="text-base font-semibold text-slate-900 leading-relaxed">{q.question}</p>
            </div>

            <div className="space-y-2.5">
              {q.options && Object.entries(q.options).map(([k, v]) => {
                const isSelected = answers[current] === k
                return (
                  <button key={k} onClick={() => selectAnswer(k)}
                    className={`w-full text-left px-5 py-3.5 rounded-xl border-2 flex items-center gap-4 text-sm font-medium transition-all
                      ${isSelected ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50'}`}>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{k}</span>
                    <span className="flex-1">{v}</span>
                    {isSelected && <CheckCircle2 size={16} className="text-white/80" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button onClick={() => setCurrent(c => c - 1)} disabled={current === 0}
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 disabled:opacity-30"><ChevronLeft size={16} className="inline" /> Prev</button>
            <div className="flex-1" />
            {current < challenge.questions.length - 1 ? (
              <button onClick={() => setCurrent(c => c + 1)}
                className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg">Next <ChevronRight size={16} className="inline" /></button>
            ) : (
              <button onClick={submitChallenge} disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-black shadow-lg disabled:opacity-50">
                {submitting ? 'Submitting…' : `Submit (${answeredCount}/${challenge.questions.length})`}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── RESULT ──────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const pct = result.totalMarks > 0 ? Math.round((result.obtainedMarks / result.totalMarks) * 100) : 0
    const grade = pct >= 80 ? { l: 'Excellent! 🔥', c: 'text-emerald-600' } : pct >= 50 ? { l: 'Good Job! 💪', c: 'text-amber-600' } : { l: 'Keep Trying! 📚', c: 'text-rose-600' }

    return (
      <div className="min-h-full bg-[#f8fafc]">
        <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/5 rounded-full" />
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
                <Trophy size={28} className="text-white" />
              </div>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Challenge Complete</p>
            <h2 className={`text-2xl font-black mb-2 ${grade.c}`}>{grade.l}</h2>
            <p className="text-4xl font-black text-white mb-4">{pct}%</p>

            <div className="flex justify-center gap-4">
              {[
                { l: 'Correct', v: result.correct, c: 'bg-emerald-500/20 text-emerald-400' },
                { l: 'Wrong', v: result.wrong, c: 'bg-rose-500/20 text-rose-400' },
                { l: 'XP Earned', v: `+${result.xpAwarded}`, c: 'bg-yellow-500/20 text-yellow-400' },
              ].map(s => (
                <div key={s.l} className={`px-4 py-2 rounded-xl ${s.c}`}>
                  <p className="text-lg font-black">{s.v}</p>
                  <p className="text-[10px] font-bold opacity-70">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => window.location.reload()}
              className="py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Back
            </button>
            <button onClick={() => window.location.href = '/quiz'}
              className="py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2">
              <Target size={14} /> More Quizzes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
