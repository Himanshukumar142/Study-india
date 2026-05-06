import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  CheckCircle2, XCircle, Minus, Trophy, RotateCcw, BookOpen,
  Clock, Crown, BarChart2, ChevronDown, ChevronUp, Zap, Target, TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// ─── Score ring ───────────────────────────────────────────────
function ScoreRing({ pct }) {
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'
  const data = [{ value: pct, fill: color }, { value: 100 - pct, fill: '#f1f5f9' }]
  return (
    <div className="relative w-40 h-40 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={data[i].fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{pct}%</span>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Score</span>
      </div>
    </div>
  )
}

// ─── Individual question review ───────────────────────────────
function QuestionReview({ q, ans, idx, bookmarks, onToggleBookmark }) {
  const [open, setOpen] = useState(false)
  const isCorrect = ans?.isCorrect
  const skipped   = !ans?.selectedOption

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all ${isCorrect ? 'border-emerald-100' : skipped ? 'border-slate-100' : 'border-rose-100'}`}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} className="w-full p-5 flex items-start gap-4 text-left">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect ? 'bg-emerald-100' : skipped ? 'bg-slate-100' : 'bg-rose-100'}`}>
          {isCorrect ? <CheckCircle2 size={18} className="text-emerald-600" /> : skipped ? <Minus size={18} className="text-slate-400" /> : <XCircle size={18} className="text-rose-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-slate-400 uppercase">Q{idx + 1}</span>
            {q.difficulty && (
              <span className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase ${q.difficulty === 'hard' ? 'bg-rose-50 text-rose-500' : q.difficulty === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-600'}`}>{q.difficulty}</span>
            )}
            <span className="text-[10px] text-slate-300">{q.marks > 0 ? `+${q.marks}` : ''} / {q.negativeMarking ?? '-1'}</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-relaxed line-clamp-2">{q.question}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onToggleBookmark(q._id) }}
            className={`p-1.5 rounded-lg transition-all ${bookmarks.includes(q._id) ? 'bg-blue-100 text-blue-600' : 'text-slate-300 hover:text-blue-400'}`}>
            <BookOpen size={14} />
          </button>
          {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded options */}
      {open && (
        <div className="px-5 pb-5 border-t border-slate-50 pt-4 space-y-3 animate-in fade-in duration-150">
          {q.options ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(q.options).map(([key, val]) => {
                const isSelected = ans?.selectedOption === key
                const isCorrectOpt = String(q.correct).trim().toUpperCase() === key.toUpperCase()
                return (
                  <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border-2 text-sm
                    ${isCorrectOpt ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : isSelected && !isCorrectOpt ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-slate-50 border-transparent text-slate-600'}`}>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${isCorrectOpt ? 'bg-emerald-500 text-white' : isSelected ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{key}</span>
                    <span className="flex-1 leading-snug">{val}</span>
                    {isCorrectOpt && <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />}
                    {isSelected && !isCorrectOpt && <XCircle size={14} className="text-rose-500 flex-shrink-0" />}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 text-sm">
              <span className="text-slate-500">Your answer: <strong>{ans?.selectedOption || '—'}</strong></span>
              <span className="mx-2">·</span>
              <span className="text-emerald-600">Correct: <strong>{q.correct}</strong></span>
            </div>
          )}

          {q.explanation && (
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-800 leading-relaxed">
              <span className="font-black">💡 Explanation: </span>{q.explanation}
            </div>
          )}

          {skipped && (
            <p className="text-xs text-slate-400 italic">This question was skipped — no marks deducted.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function QuizResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [result, setResult]     = useState(null)
  const [rank, setRank]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [bookmarks, setBookmarks] = useState([])
  const [showAll, setShowAll]   = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/quizzes/result/${id}`)
        setResult(data.data)
        if (data.data.mockTestId) {
          const lb = await api.get(`/mock-tests/${data.data.mockTestId}/leaderboard`)
          const idx = lb.data.data?.findIndex(a => a._id === id)
          if (idx !== -1) setRank(idx + 1)
        }
      } catch { toast.error('Failed to load result') }
      finally { setLoading(false) }
    }
    const loadBM = async () => {
      try {
        const { data } = await api.get('/bookmarks')
        setBookmarks(data.data.filter(b => b.type === 'question').map(b => b.itemId?._id || b.itemId))
      } catch {}
    }
    load(); loadBM()
  }, [id])

  const toggleBM = async (qid) => {
    const isB = bookmarks.includes(qid)
    try {
      if (isB) { await api.delete(`/bookmarks/question/${qid}`); setBookmarks(p => p.filter(x => x !== qid)) }
      else { await api.post(`/bookmarks/question/${qid}`); setBookmarks(p => [...p, qid]) }
      toast.success(isB ? 'Removed' : 'Bookmarked!')
    } catch { toast.error('Failed') }
  }

  if (loading) return (
    <div className="min-h-full flex items-center justify-center bg-[#f8fafc]">
      <div className="w-12 h-12 relative">
        <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!result) return (
    <div className="min-h-full flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-slate-400">Result not found.</p>
      <button onClick={() => navigate('/quiz')} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Back to Quiz</button>
    </div>
  )

  const { questions, xpAwarded, obtainedMarks, totalMarks, accuracy, correct, wrong, skipped, timeTakenSeconds, mode } = result
  const pct   = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0
  const grade = pct >= 90 ? { l: 'Outstanding!', c: 'text-emerald-600' } : pct >= 70 ? { l: 'Great Job!', c: 'text-blue-600' } : pct >= 40 ? { l: 'Keep Practicing!', c: 'text-amber-600' } : { l: 'Needs Improvement', c: 'text-rose-600' }

  const ansMap = {}
  result.answers?.forEach(a => { ansMap[a.questionId] = a })

  const displayed = showAll ? questions : questions?.slice(0, 5)

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">

        {/* ── Hero Result Card ── */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute right-20 bottom-0 w-20 h-20 bg-white/5 rounded-full" />

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <ScoreRing pct={pct} />
            <div className="flex-1 text-center md:text-left">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{mode || 'Quiz'} Complete</p>
              <h1 className={`text-3xl font-black mb-1 ${grade.c}`}>{grade.l}</h1>
              <p className="text-slate-300 text-sm mb-5">{obtainedMarks?.toFixed(1)} / {totalMarks} marks · {accuracy}% accuracy</p>

              {/* Stats chips */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {[
                  { icon: CheckCircle2, l: 'Correct',  v: correct, c: 'bg-emerald-500/20 text-emerald-400' },
                  { icon: XCircle,      l: 'Wrong',    v: wrong,   c: 'bg-rose-500/20 text-rose-400' },
                  { icon: Minus,        l: 'Skipped',  v: skipped, c: 'bg-slate-600/40 text-slate-400' },
                  { icon: Clock,        l: 'Time',     v: fmt(timeTakenSeconds || 0), c: 'bg-blue-500/20 text-blue-400' },
                ].map(s => (
                  <div key={s.l} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${s.c}`}>
                    <s.icon size={13} /> {s.l}: {s.v}
                  </div>
                ))}
              </div>

              {/* XP + Rank */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/20 text-yellow-300 rounded-xl text-sm font-black">
                  <Zap size={15} /> +{xpAwarded} XP
                </div>
                {rank && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-400/20 text-amber-300 rounded-xl text-sm font-black">
                    <Crown size={15} /> Rank #{rank}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Topic Analysis ── */}
        {result.topicAnalysis?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-black text-slate-900 mb-5 flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-500" /> Topic-wise Analysis
            </h2>
            <div className="space-y-4">
              {result.topicAnalysis.map((t, i) => {
                const tp = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0
                const color = tp >= 80 ? 'bg-emerald-500' : tp >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                const textC  = tp >= 80 ? 'text-emerald-600' : tp >= 50 ? 'text-amber-600' : 'text-rose-600'
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-800">{t.topic}</span>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{t.correct}/{t.total}</span>
                        <span className={`font-black ${textC}`}>{tp}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${tp}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Question Review ── */}
        <div>
          <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <Target size={18} className="text-violet-500" /> Question Review
            <span className="text-xs text-slate-400 font-normal ml-auto">{questions?.length} questions</span>
          </h2>
          <div className="space-y-3">
            {displayed?.map((q, idx) => (
              <QuestionReview key={q._id} q={q} ans={ansMap[q._id]} idx={idx} bookmarks={bookmarks} onToggleBookmark={toggleBM} />
            ))}
          </div>
          {questions?.length > 5 && (
            <button onClick={() => setShowAll(v => !v)}
              className="w-full mt-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              {showAll ? <><ChevronUp size={15} /> Show less</> : <><ChevronDown size={15} /> Show all {questions.length} questions</>}
            </button>
          )}
        </div>

        {/* ── CTA Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4">
          {result.mockTestId && (
            <button onClick={() => navigate(`/mock-test/leaderboard/${result.mockTestId}`)}
              className="flex items-center justify-center gap-2 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl text-sm font-bold hover:bg-amber-100 transition-all">
              <Trophy size={15} /> Leaderboard
            </button>
          )}
          <button onClick={() => navigate('/quiz')}
            className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all">
            <BookOpen size={15} /> Quiz Center
          </button>
          <button onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all col-span-1 sm:col-span-1">
            <RotateCcw size={15} /> Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
