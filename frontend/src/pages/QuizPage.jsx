import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  Clock, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle,
  ShieldAlert, BookOpen, Send, Flag
} from 'lucide-react'
import toast from 'react-hot-toast'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// ─── Question status colors for palette ──────────────────────
const Q_STATUS = {
  answered:  'bg-blue-600 text-white border-blue-600',
  flagged:   'bg-amber-400 text-white border-amber-400',
  visited:   'bg-slate-200 text-slate-600 border-slate-200',
  current:   'ring-2 ring-offset-1 ring-blue-500 bg-white text-blue-600 border-blue-300',
  unanswered:'bg-white text-slate-400 border-slate-200',
}

export default function QuizPage({ isMockTest = false }) {
  const { subject, chapter, mockTestId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const mode  = isMockTest ? 'exam' : (searchParams.get('mode') || 'practice')
  const limit = parseInt(searchParams.get('limit') || '10')

  const [phase, setPhase]       = useState('instructions') // instructions | loading | playing | submitting
  const [questions, setQuestions] = useState([])
  const [attemptId, setAttemptId] = useState(null)
  const [current, setCurrent]   = useState(0)
  const [answers, setAnswers]   = useState({})   // { qId: option }
  const [flagged, setFlagged]   = useState({})   // { qId: bool }
  const [visited, setVisited]   = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [saving, setSaving]     = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [bookmarks, setBookmarks] = useState([])

  const qStartRef = useRef(Date.now())
  const timerRef  = useRef(null)

  // Load bookmarks
  useEffect(() => {
    api.get('/bookmarks').then(r => {
      setBookmarks(r.data.data.filter(b => b.type === 'question').map(b => b.itemId?._id || b.itemId))
    }).catch(() => {})
  }, [])

  // Anti-cheat: tab switch detection in exam mode
  useEffect(() => {
    if (phase !== 'playing' || mode !== 'exam') return
    const handler = () => {
      if (document.hidden) {
        toast.error('Tab switch detected! Submitting automatically.', { duration: 3000 })
        if (attemptId) {
          api.post('/quizzes/violation', { attemptId }).catch(() => {})
          doSubmit(attemptId)
        }
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [phase, mode, attemptId])

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || mode === 'practice' || timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          toast('Time is up! Auto-submitting…', { icon: '⏰' })
          doSubmit(attemptId)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, mode, timeLeft, attemptId])

  const startQuiz = async () => {
    setPhase('loading')
    try {
      let data
      if (isMockTest) {
        const r = await api.post(`/mock-tests/${mockTestId}/start`)
        data = r.data
      } else {
        const r = await api.post('/quizzes/start', { subject, chapter, mode, limit })
        data = r.data
      }
      setQuestions(data.data.questions)
      setAttemptId(data.data.attemptId)
      const duration = isMockTest ? data.data.duration * 60 : data.data.questions.length * 90
      setTimeLeft(duration)
      setPhase('playing')
      setVisited({ [data.data.questions[0]?._id]: true })
      qStartRef.current = Date.now()
      if (mode === 'exam') document.documentElement.requestFullscreen().catch(() => {})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start. Try again.')
      setPhase('instructions')
    }
  }

  const selectAnswer = async (option) => {
    const q = questions[current]
    const timeTaken = Math.round((Date.now() - qStartRef.current) / 1000)
    setAnswers(prev => ({ ...prev, [q._id]: option }))
    qStartRef.current = Date.now()
    setSaving(true)
    try {
      await api.post('/quizzes/answer', { attemptId, questionId: q._id, selectedOption: option, timeTakenSeconds: timeTaken })
    } catch { toast.error('Answer save failed') }
    finally { setSaving(false) }
  }

  const doSubmit = useCallback(async (aid) => {
    const id = aid || attemptId
    if (!id) return
    setPhase('submitting')
    clearInterval(timerRef.current)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    try {
      await api.post('/quizzes/submit', { attemptId: id })
      navigate(`/quiz/result/${id}`, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed')
      setPhase('playing')
    }
  }, [attemptId, navigate])

  const goTo = (idx) => {
    setCurrent(idx)
    setVisited(prev => ({ ...prev, [questions[idx]?._id]: true }))
    qStartRef.current = Date.now()
  }

  const toggleFlag = () => {
    const q = questions[current]
    setFlagged(prev => ({ ...prev, [q._id]: !prev[q._id] }))
  }

  const toggleBookmark = async (qid) => {
    const isB = bookmarks.includes(qid)
    try {
      if (isB) { await api.delete(`/bookmarks/question/${qid}`); setBookmarks(p => p.filter(x => x !== qid)) }
      else { await api.post(`/bookmarks/question/${qid}`); setBookmarks(p => [...p, qid]) }
      toast.success(isB ? 'Bookmark removed' : 'Bookmarked!')
    } catch { toast.error('Failed') }
  }

  const isLowTime = timeLeft < 120
  const answeredCount = Object.keys(answers).length
  const flaggedCount  = Object.values(flagged).filter(Boolean).length

  // ─── INSTRUCTIONS ───────────────────────────────────────────
  if (phase === 'instructions') {
    const rules = mode === 'practice'
      ? ['No timer — take your time on each question.', 'Answers are saved automatically.', 'You can bookmark questions for revision.', 'Navigate freely between questions.']
      : mode === 'exam' || isMockTest
      ? ['Fullscreen mode is required throughout the exam.', 'Switching tabs or minimizing ends the test immediately.', 'Timer begins as soon as you start — no pauses.', 'All answers are auto-saved. Submit when done.', 'Negative marking applies: +4 correct, -1 wrong.']
      : ['Timer starts immediately after you begin.', 'Navigate freely — all answers are auto-saved.', 'You can flag questions and revisit them.', 'Submit when you are ready or when time runs out.']

    return (
      <div className="min-h-full bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/60 max-w-lg w-full p-8">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase mb-6 ${mode === 'exam' || isMockTest ? 'bg-rose-50 text-rose-600 border border-rose-200' : mode === 'test' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
            {mode === 'exam' || isMockTest ? <ShieldAlert size={13} /> : <Clock size={13} />}
            {isMockTest ? 'Mock Test — Exam Mode' : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`}
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-1">
            {isMockTest ? 'Mock Test' : `${subject}`}
          </h1>
          <p className="text-slate-400 text-sm mb-6">{isMockTest ? 'Read the instructions carefully before starting.' : `Chapter: ${chapter} · ${limit} questions`}</p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { l: 'Questions', v: isMockTest ? '—' : limit },
              { l: 'Duration',  v: mode === 'practice' ? 'No limit' : isMockTest ? '3 hrs' : `${limit * 1.5} min` },
              { l: 'Marking',   v: mode === 'practice' ? '+4 / 0' : '+4 / -1' },
            ].map(s => (
              <div key={s.l} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.l}</p>
                <p className="font-black text-slate-900 text-sm mt-0.5">{s.v}</p>
              </div>
            ))}
          </div>

          {/* Rules */}
          <div className="space-y-2.5 mb-8">
            {rules.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[9px] font-black text-blue-600">{i + 1}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{r}</p>
              </div>
            ))}
          </div>

          <button onClick={startQuiz}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl font-black text-base shadow-xl shadow-blue-500/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
            <Send size={18} /> I Understand — Start Now
          </button>
          <button onClick={() => navigate(-1)} className="w-full mt-3 py-2.5 text-slate-400 text-sm font-semibold hover:text-slate-600 transition-colors">
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  // ─── LOADING ─────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div className="min-h-full bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 relative mx-auto">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm font-bold text-slate-400">{phase === 'loading' ? 'Loading questions…' : 'Submitting your answers…'}</p>
        </div>
      </div>
    )
  }

  // ─── EMPTY ───────────────────────────────────────────────────
  if (phase === 'playing' && questions.length === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-5 p-8">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center">
          <AlertCircle size={32} className="text-rose-500" />
        </div>
        <h3 className="text-xl font-black text-slate-900">No Questions Found</h3>
        <p className="text-slate-400 text-sm text-center max-w-xs">No questions exist for this topic yet. Ask your admin to add questions to the question bank.</p>
        <button onClick={() => navigate('/quiz')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all">
          Back to Quiz Center
        </button>
      </div>
    )
  }

  // ─── PLAYING ─────────────────────────────────────────────────
  const q = questions[current]
  if (!q) return null

  const answered  = answers[q._id]
  const isFlagged = flagged[q._id]

  const getQStatus = (idx) => {
    const qid = questions[idx]?._id
    if (idx === current)       return Q_STATUS.current
    if (answers[qid])          return Q_STATUS.answered
    if (flagged[qid])          return Q_STATUS.flagged
    if (visited[qid])          return Q_STATUS.visited
    return Q_STATUS.unanswered
  }

  return (
    <div className="flex h-full bg-[#f8fafc]" style={{ minHeight: '100vh' }}>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="bg-white border-b border-slate-100 px-5 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 text-sm truncate">{isMockTest ? 'Mock Test' : `${subject} · ${chapter}`}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Q{current + 1}/{questions.length} · {answeredCount} answered · {flaggedCount} flagged
              {saving && <span className="ml-2 text-blue-500 animate-pulse">saving…</span>}
            </p>
          </div>

          {/* Progress bar */}
          <div className="hidden sm:block w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>

          {/* Timer */}
          {mode !== 'practice' && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition-all duration-300 tabular-nums flex-shrink-0
              ${isLowTime ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 scale-105' : 'bg-slate-100 text-slate-700'}`}>
              <Clock size={15} className={isLowTime ? 'animate-pulse' : ''} />
              {fmt(timeLeft)}
            </div>
          )}

          <button onClick={() => setShowPanel(p => !p)}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-all flex-shrink-0">
            {showPanel ? 'Hide' : 'Show'} Panel
          </button>
        </div>

        {/* Question area */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="max-w-2xl mx-auto">

            {/* Question card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
              {/* Tags */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 uppercase">{q.subject}</span>
                <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-lg border border-slate-100 uppercase">{q.chapter}</span>
                {q.difficulty && (
                  <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase ${q.difficulty === 'hard' ? 'bg-rose-50 text-rose-600 border-rose-100' : q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{q.difficulty}</span>
                )}
                <div className="ml-auto flex gap-2">
                  <button onClick={toggleFlag} title="Flag for review"
                    className={`p-2 rounded-xl border transition-all ${isFlagged ? 'bg-amber-400 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500'}`}>
                    <Flag size={14} />
                  </button>
                  <button onClick={() => toggleBookmark(q._id)} title="Bookmark"
                    className={`p-2 rounded-xl border transition-all ${bookmarks.includes(q._id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500'}`}>
                    <BookOpen size={14} />
                  </button>
                </div>
              </div>

              {/* Question number + text */}
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-md">
                  {current + 1}
                </div>
                <p className="text-slate-900 font-semibold text-base leading-relaxed">{q.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {q.options ? Object.entries(q.options).map(([key, val]) => {
                  const isSelected = answered === key
                  return (
                    <button key={key} onClick={() => selectAnswer(key)}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 flex items-center gap-4 transition-all duration-150 font-medium text-sm
                        ${isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'}`}>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 transition-all
                        ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {key}
                      </span>
                      <span className="flex-1">{val}</span>
                      {isSelected && <CheckCircle2 size={18} className="text-white/80 flex-shrink-0" />}
                    </button>
                  )
                }) : (
                  <input type="text" value={answered || ''} onChange={e => selectAnswer(e.target.value)}
                    placeholder="Type your answer…"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => goTo(current - 1)} disabled={current === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                <ChevronLeft size={16} /> Prev
              </button>

              <button onClick={toggleFlag}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${isFlagged ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'}`}>
                <Flag size={13} /> {isFlagged ? 'Flagged' : 'Flag'}
              </button>

              {current < questions.length - 1 ? (
                <button onClick={() => goTo(current + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all">
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={() => doSubmit()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all">
                  <Send size={15} /> Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Question Palette ── */}
      {showPanel && (
        <div className="hidden md:flex flex-col w-72 bg-white border-l border-slate-100 flex-shrink-0 shadow-lg">
          <div className="p-4 border-b border-slate-100">
            <p className="font-black text-slate-900 text-sm">Question Palette</p>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600 inline-block" />Answered</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />Flagged</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 inline-block" />Visited</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-slate-300 inline-block" />Not visited</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((ques, idx) => (
                <button key={ques._id} onClick={() => goTo(idx)}
                  className={`w-10 h-10 rounded-xl border-2 text-xs font-black transition-all hover:scale-110 ${getQStatus(idx)}`}>
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 border-t border-slate-100 space-y-2">
            {[
              { l: 'Answered',   v: answeredCount,                                         c: 'text-blue-600' },
              { l: 'Flagged',    v: flaggedCount,                                           c: 'text-amber-600' },
              { l: 'Remaining',  v: questions.length - answeredCount,                       c: 'text-slate-500' },
            ].map(s => (
              <div key={s.l} className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">{s.l}</span>
                <span className={`font-black ${s.c}`}>{s.v}</span>
              </div>
            ))}
            <button onClick={() => doSubmit()}
              className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
              <Send size={13} /> Submit Test
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
