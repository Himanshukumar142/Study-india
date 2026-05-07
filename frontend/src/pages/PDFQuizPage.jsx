import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileText, Sparkles, Zap, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, BookOpen, Play, Save, Loader2, AlertCircle, Trash2
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'medium', label: 'Medium', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 'hard', label: 'Hard', color: 'bg-rose-50 text-rose-600 border-rose-200' },
]

const COUNTS = [5, 10, 15, 20]

export default function PDFQuizPage() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  // Upload state
  const [file, setFile] = useState(null)
  const [subject, setSubject] = useState('')
  const [chapter, setChapter] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [count, setCount] = useState(10)

  // Generation state
  const [phase, setPhase] = useState('upload') // upload | generating | preview | quiz-started
  const [progress, setProgress] = useState(0)
  const [questions, setQuestions] = useState([])
  const [pdfInfo, setPdfInfo] = useState(null)
  const [error, setError] = useState(null)

  // Quiz state
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [expandedQ, setExpandedQ] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return }
    if (f.size > 20 * 1024 * 1024) { toast.error('Max 20 MB'); return }
    setFile(f)
    setError(null)
  }

  const handleGenerate = async () => {
    if (!file) { toast.error('Upload a PDF first'); return }
    setPhase('generating')
    setError(null)
    setProgress(10)

    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('count', count)
    formData.append('difficulty', difficulty)
    if (subject) formData.append('subject', subject)
    if (chapter) formData.append('chapter', chapter)

    // Simulate progress
    const progTimer = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 600)

    try {
      const { data } = await api.post('/ai/generate-from-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      clearInterval(progTimer)
      setProgress(100)
      setQuestions(data.data.questions)
      setPdfInfo(data.data.pdfInfo)
      toast.success(`${data.data.questions.length} questions generated!`)
      setTimeout(() => setPhase('preview'), 500)
    } catch (err) {
      clearInterval(progTimer)
      setError(err.response?.data?.message || 'Generation failed. Try again.')
      setPhase('upload')
      toast.error('Failed to generate')
    }
  }

  const startQuiz = () => {
    setPhase('quiz-started')
    setCurrent(0)
    setAnswers({})
    setShowResults(false)
  }

  const selectAnswer = (opt) => {
    setAnswers(prev => ({ ...prev, [current]: opt }))
  }

  const submitQuiz = () => setShowResults(true)

  const saveToBank = async () => {
    setSaving(true)
    try {
      const payload = { questions: questions.map(q => ({ ...q, createdBy: undefined })) }
      await api.post('/quizzes/questions/bulk', payload)
      toast.success(`${questions.length} questions saved to Question Bank!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const reset = () => {
    setFile(null)
    setQuestions([])
    setPdfInfo(null)
    setPhase('upload')
    setProgress(0)
    setAnswers({})
    setShowResults(false)
    setError(null)
  }

  // ─── UPLOAD PHASE ───────────────────────────────────────────
  if (phase === 'upload') {
    return (
      <div className="min-h-full bg-[#f8fafc]">
        <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
          {/* Hero */}
          <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl shadow-violet-500/20 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-yellow-300" />
              <span className="text-violet-200 text-xs font-bold uppercase tracking-widest">AI-Powered</span>
            </div>
            <h1 className="text-2xl font-black mb-2">PDF → Mock Test</h1>
            <p className="text-violet-200 text-sm">Upload any PDF — our AI reads it and generates MCQ questions instantly.</p>
          </div>

          {/* Upload area */}
          <div onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all hover:shadow-lg
              ${file ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/30'}`}>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
            {file ? (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto">
                  <FileText size={28} className="text-violet-600" />
                </div>
                <p className="font-black text-violet-800">{file.name}</p>
                <p className="text-xs text-violet-500">{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Upload size={28} className="text-slate-400" />
                </div>
                <p className="font-bold text-slate-600">Click to upload PDF</p>
                <p className="text-xs text-slate-400">Max 20 MB · Study material, notes, textbook chapters</p>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
            <h3 className="font-black text-slate-900 text-sm">Generation Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Subject (optional)</p>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Chapter (optional)</p>
                <input value={chapter} onChange={e => setChapter(e.target.value)} placeholder="e.g. Kinematics"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400" />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Difficulty</p>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button key={d.id} onClick={() => setDifficulty(d.id)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all
                      ${difficulty === d.id ? d.color + ' shadow-md scale-105' : 'border-slate-200 text-slate-400 bg-white'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Number of Questions</p>
              <div className="flex gap-2">
                {COUNTS.map(n => (
                  <button key={n} onClick={() => setCount(n)}
                    className={`w-14 h-10 rounded-xl border-2 font-black text-sm transition-all
                      ${count === n ? 'bg-violet-600 border-violet-600 text-white shadow-lg' : 'border-slate-200 text-slate-500'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <button onClick={handleGenerate} disabled={!file}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-black text-base shadow-xl shadow-violet-500/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed">
            <Zap size={20} /> Generate {count} Questions with AI
          </button>
        </div>
      </div>
    )
  }

  // ─── GENERATING PHASE ───────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div className="min-h-full bg-[#f8fafc] flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-10 text-center space-y-6">
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 border-4 border-violet-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-3 bg-violet-50 rounded-full flex items-center justify-center">
              <Sparkles size={24} className="text-violet-600 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-2">AI is reading your PDF…</h2>
            <p className="text-sm text-slate-400">Extracting text → Analyzing concepts → Generating MCQs</p>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-400 font-semibold">{progress}% · This may take 15-30 seconds</p>
        </div>
      </div>
    )
  }

  // ─── PREVIEW PHASE ──────────────────────────────────────────
  if (phase === 'preview') {
    return (
      <div className="min-h-full bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">
          {/* Success banner */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl flex items-center gap-5">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h2 className="text-lg font-black">{questions.length} Questions Generated!</h2>
              <p className="text-emerald-100 text-sm">From: {pdfInfo?.title || file?.name} · {pdfInfo?.pages || '?'} pages</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={startQuiz}
              className="py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              <Play size={16} /> Start Quiz
            </button>
            <button onClick={saveToBank} disabled={saving}
              className="py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save to Bank'}
            </button>
            <button onClick={reset}
              className="py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Upload size={14} /> New PDF
            </button>
          </div>

          {/* Question previews */}
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                  className="w-full p-4 flex items-start gap-3 text-left">
                  <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 font-black text-xs flex-shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2">{q.question}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase">{q.subject}</span>
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded">{q.chapter}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${q.difficulty === 'hard' ? 'bg-rose-50 text-rose-600' : q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{q.difficulty}</span>
                    </div>
                  </div>
                  {expandedQ === i ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                {expandedQ === i && (
                  <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-2">
                    {Object.entries(q.options).map(([k, v]) => (
                      <div key={k} className={`flex items-center gap-3 p-2.5 rounded-xl text-sm ${k === q.correct ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-slate-50 text-slate-600'}`}>
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black ${k === q.correct ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{k}</span>
                        {v}
                        {k === q.correct && <CheckCircle2 size={14} className="ml-auto text-emerald-500" />}
                      </div>
                    ))}
                    {q.explanation && (
                      <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-800 leading-relaxed mt-2">
                        <strong>💡 Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── QUIZ PHASE ─────────────────────────────────────────────
  if (phase === 'quiz-started') {
    if (showResults) {
      let correct = 0
      questions.forEach((q, i) => { if (answers[i] === q.correct) correct++ })
      const pct = Math.round((correct / questions.length) * 100)
      const color = pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-600'

      return (
        <div className="min-h-full bg-[#f8fafc]">
          <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
              <div className={`text-5xl font-black mb-2 ${color}`}>{pct}%</div>
              <h2 className="text-xl font-black text-slate-900 mb-1">{pct >= 70 ? 'Great Job!' : pct >= 40 ? 'Keep Practicing!' : 'Needs Work'}</h2>
              <p className="text-slate-400 text-sm mb-6">{correct}/{questions.length} correct</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setAnswers({}); setShowResults(false); setCurrent(0) }}
                  className="py-3 bg-violet-600 text-white rounded-xl font-bold text-sm">Retry</button>
                <button onClick={reset}
                  className="py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm">New PDF</button>
              </div>
            </div>

            {/* Review */}
            <div className="space-y-3">
              {questions.map((q, i) => {
                const userAns = answers[i]
                const isCorrect = userAns === q.correct
                return (
                  <div key={i} className={`bg-white rounded-xl border-2 p-4 ${isCorrect ? 'border-emerald-100' : 'border-rose-100'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      {isCorrect ? <CheckCircle2 size={18} className="text-emerald-500 mt-0.5" /> : <XCircle size={18} className="text-rose-500 mt-0.5" />}
                      <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-7">
                      {Object.entries(q.options).map(([k, v]) => (
                        <div key={k} className={`p-2 rounded-lg text-xs border
                          ${k === q.correct ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : k === userAns ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                          <strong>{k}.</strong> {v}
                        </div>
                      ))}
                    </div>
                    {q.explanation && <p className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg mt-2 ml-7">💡 {q.explanation}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    const q = questions[current]
    return (
      <div className="min-h-full bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-xl w-full space-y-5">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">Q{current + 1}/{questions.length}</span>
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-400">{Object.keys(answers).length} answered</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
            <div className="flex gap-1.5 mb-4">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase">{q.subject}</span>
              <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${q.difficulty === 'hard' ? 'bg-rose-50 text-rose-600' : q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{q.difficulty}</span>
            </div>
            <p className="text-base font-semibold text-slate-900 leading-relaxed mb-6">{q.question}</p>
            <div className="space-y-2.5">
              {Object.entries(q.options).map(([k, v]) => {
                const isSelected = answers[current] === k
                return (
                  <button key={k} onClick={() => selectAnswer(k)}
                    className={`w-full text-left px-5 py-3.5 rounded-xl border-2 flex items-center gap-4 text-sm font-medium transition-all
                      ${isSelected ? 'bg-violet-600 border-violet-600 text-white shadow-lg' : 'border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50'}`}>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{k}</span>
                    <span className="flex-1">{v}</span>
                    {isSelected && <CheckCircle2 size={16} className="text-white/80" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setCurrent(c => c - 1)} disabled={current === 0}
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 disabled:opacity-30">Prev</button>
            <div className="flex-1" />
            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent(c => c + 1)}
                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold shadow-lg">Next →</button>
            ) : (
              <button onClick={submitQuiz}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-black shadow-lg">Submit</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
