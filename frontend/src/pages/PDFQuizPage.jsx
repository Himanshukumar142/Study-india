import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileText, Sparkles, Zap, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, BookOpen, Play, Save, Loader2, AlertCircle, Trash2,
  Edit3, Check, X, Search, ArrowRight, ShieldAlert, Award, Layers, Info,
  RotateCcw, Flag, Brain, Target, TrendingUp, BarChart3, Star
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   desc: 'Direct concept checks',      color: 'emerald' },
  { id: 'medium', label: 'Medium', desc: 'Conceptual problems',         color: 'amber'   },
  { id: 'hard',   label: 'Hard',   desc: 'Advanced mock challenges',    color: 'rose'    },
]

const COUNTS = [5, 10, 15, 20]

const fmtTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const diffColor = (d) => {
  if (d === 'easy')   return { bg: 'rgba(16,185,129,0.12)', text: '#059669', border: 'rgba(16,185,129,0.25)' }
  if (d === 'hard')   return { bg: 'rgba(239,68,68,0.12)',  text: '#dc2626', border: 'rgba(239,68,68,0.25)'  }
  return                     { bg: 'rgba(245,158,11,0.12)', text: '#d97706', border: 'rgba(245,158,11,0.25)' }
}

/* ─────────────────────────────────────────────────────────────── */
export default function PDFQuizPage() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  /* Setup */
  const [file,       setFile]       = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [subject,    setSubject]    = useState('')
  const [chapter,    setChapter]    = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [count,      setCount]      = useState(10)

  /* Phase machine */
  const [phase,     setPhase]     = useState('upload')
  const [progress,  setProgress]  = useState(0)
  const [questions, setQuestions] = useState([])
  const [pdfInfo,   setPdfInfo]   = useState(null)
  const [error,     setError]     = useState(null)

  /* Edit */
  const [editingIndex, setEditingIndex] = useState(null)
  const [editForm,     setEditForm]     = useState({
    question: '', options: { A:'', B:'', C:'', D:'' }, correct: 'A', explanation: '', subject: '', chapter: ''
  })

  /* Preview */
  const [previewSearch,     setPreviewSearch]     = useState('')
  const [previewDiffFilter, setPreviewDiffFilter] = useState('all')

  /* Simulator */
  const [attemptId,      setAttemptId]      = useState(null)
  const [current,        setCurrent]        = useState(0)
  const [answers,        setAnswers]        = useState({})
  const [flagged,        setFlagged]        = useState({})
  const [visited,        setVisited]        = useState({ 0: true })
  const [timeLeft,       setTimeLeft]       = useState(0)
  const [showResults,    setShowResults]    = useState(false)
  const [expandedQ,      setExpandedQ]      = useState(null)
  const [saving,         setSaving]         = useState(false)
  const [questionsSaved, setQuestionsSaved] = useState(false)
  const [quizResults,    setQuizResults]    = useState(null)
  const [showSubmitModal,setShowSubmitModal]= useState(false)
  const [violations,     setViolations]     = useState(0)

  const qStartRef = useRef(Date.now())
  const timerRef  = useRef(null)

  /* ── derived ── */
  const q             = questions[current] || {}
  const answeredCount = Object.keys(answers).length
  const flaggedCount  = Object.values(flagged).filter(Boolean).length
  const pct           = quizResults ? Math.round(quizResults.accuracy || 0) : 0

  /* ── handlers ── */
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    const f = e.dataTransfer.files?.[0]; if (f) validateAndSetFile(f)
  }
  const handleFileSelect = (e) => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f) }
  const validateAndSetFile = (f) => {
    if (f.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return }
    if (f.size > 20 * 1024 * 1024)   { toast.error('Max file size is 20 MB'); return }
    setFile(f); setError(null); toast.success(`Loaded: ${f.name}`)
  }

  const handleGenerate = async () => {
    if (!file) { toast.error('Please upload a PDF first'); return }
    setPhase('generating'); setError(null); setProgress(5)
    const fd = new FormData()
    fd.append('pdf', file); fd.append('count', count); fd.append('difficulty', difficulty)
    if (subject) fd.append('subject', subject)
    if (chapter) fd.append('chapter', chapter)
    const prog = setInterval(() => setProgress(p => p < 30 ? p+4 : p < 60 ? p+3 : p < 85 ? p+2 : Math.min(p+1, 95)), 450)
    try {
      const { data } = await api.post('/ai/generate-from-pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 })
      clearInterval(prog); setProgress(100)
      setQuestions(data.data.questions); setPdfInfo(data.data.pdfInfo); setQuestionsSaved(false)
      toast.success(`${data.data.questions.length} questions generated!`)
      setTimeout(() => setPhase('preview'), 500)
    } catch (err) {
      clearInterval(prog)
      setError(err.response?.data?.message || 'AI Generation failed. Check key config or file format.')
      setPhase('upload'); toast.error('Failed to generate quiz')
    }
  }

  const saveQuestionsToDB = async () => {
    if (questionsSaved) return questions
    setSaving(true)
    try {
      const payload = {
        questions: questions.map(q => ({
          subject: q.subject || subject || 'Science', chapter: q.chapter || chapter || 'AI Generation',
          difficulty: q.difficulty || difficulty || 'medium', question: q.question, options: q.options,
          correct: q.correct, explanation: q.explanation || '', marks: q.marks || 4,
          negativeMarking: q.negativeMarking ?? -1, exam: q.exam || 'BOTH'
        }))
      }
      const { data } = await api.post('/quizzes/questions/bulk', payload)
      const savedQs = data.data
      const updated = questions.map((q, i) => ({ ...q, _id: savedQs[i]?._id || savedQs[i] }))
      setQuestions(updated); setQuestionsSaved(true); toast.success('Saved to Question Bank!'); setSaving(false)
      return updated
    } catch (err) {
      setSaving(false); toast.error(err.response?.data?.message || 'Failed to save to DB'); throw err
    }
  }

  const startQuiz = async () => {
    setSaving(true)
    const loadToast = toast.loading('Initializing exam session...')
    try {
      const savedList = await saveQuestionsToDB()
      const questionIds = savedList.map(q => q._id).filter(Boolean)
      if (!questionIds.length) throw new Error('No valid question IDs')
      const { data } = await api.post('/quizzes/start', {
        questionIds, subject: subject || savedList[0]?.subject || 'Physics',
        chapter: chapter || savedList[0]?.chapter || 'AI Generated', mode: 'practice'
      })
      setAttemptId(data.data.attemptId); setTimeLeft(savedList.length * 90)
      setCurrent(0); setAnswers({}); setFlagged({}); setVisited({ 0: true })
      setViolations(0); setShowResults(false); setQuizResults(null)
      toast.dismiss(loadToast); setPhase('quiz-started'); qStartRef.current = Date.now()
      toast.success('Exam session started!')
    } catch (err) {
      toast.dismiss(loadToast); setSaving(false); toast.error('Failed to initialize simulator')
    }
  }

  const selectAnswer = async (opt) => {
    if (phase !== 'quiz-started' || showResults) return
    const timeTaken = Math.round((Date.now() - qStartRef.current) / 1000)
    setAnswers(prev => ({ ...prev, [current]: opt })); qStartRef.current = Date.now()
    try {
      if (q?._id && attemptId) {
        await api.post('/quizzes/answer', { attemptId, questionId: q._id, selectedOption: opt, timeTakenSeconds: timeTaken })
      }
    } catch (e) { console.warn('Sync failed:', e) }
  }

  const submitQuiz = async () => {
    setShowSubmitModal(false)
    const lt = toast.loading('Calculating your score...')
    try {
      clearInterval(timerRef.current)
      await api.post('/quizzes/submit', { attemptId })
      const { data } = await api.get(`/quizzes/result/${attemptId}`)
      setQuizResults(data.data); setShowResults(true)
      toast.dismiss(lt); toast.success('Quiz submitted!')
    } catch (err) { toast.dismiss(lt); toast.error('Failed to submit') }
  }

  useEffect(() => {
    if (phase !== 'quiz-started' || showResults) return
    const handle = () => {
      if (document.hidden) setViolations(v => {
        const nv = v + 1
        toast.error(`Tab switch detected! Warning ${nv}/3`, { duration: 5000 })
        if (attemptId) api.post('/quizzes/violation', { attemptId }).catch(() => {})
        if (nv >= 3) submitQuiz()
        return nv
      })
    }
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [phase, showResults, attemptId])

  useEffect(() => {
    if (phase !== 'quiz-started' || showResults || timeLeft <= 0) return
    timerRef.current = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(timerRef.current); submitQuiz(); return 0 }
      return p - 1
    }), 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, showResults, timeLeft])

  const startEditing = (idx, q) => {
    setEditingIndex(idx)
    setEditForm({ question: q.question, options: { ...q.options }, correct: q.correct,
      explanation: q.explanation || '', subject: q.subject || subject || 'Physics',
      chapter: q.chapter || chapter || 'Kinematics' })
  }
  const saveEdit = (idx) => {
    const upd = [...questions]; upd[idx] = { ...upd[idx], ...editForm }
    setQuestions(upd); setEditingIndex(null); setQuestionsSaved(false)
    toast.success('Question updated!')
  }
  const deleteQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx))
    setQuestionsSaved(false); toast.success('Question removed')
  }
  const reset = () => {
    setFile(null); setQuestions([]); setPdfInfo(null); setPhase('upload'); setProgress(0)
    setAnswers({}); setFlagged({}); setVisited({ 0: true }); setShowResults(false)
    setQuizResults(null); setError(null); setQuestionsSaved(false); setViolations(0)
  }
  const goTo = (idx) => { setCurrent(idx); setVisited(p => ({ ...p, [idx]: true })); qStartRef.current = Date.now() }
  const toggleFlag = (idx) => setFlagged(p => ({ ...p, [idx]: !p[idx] }))

  const filteredQuestions = questions.filter(q => {
    const sm = q.question?.toLowerCase().includes(previewSearch.toLowerCase())
    const dm = previewDiffFilter === 'all' || q.difficulty?.toLowerCase() === previewDiffFilter
    return sm && dm
  })

  /* ────────────────────────────────────────────────── RENDER ────────────────────────────── */
  return (
    <div style={{ minHeight: '100%', background: '#f8f9fc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .pq-page { min-height: 100%; background: linear-gradient(135deg, #f8f9fc 0%, #f0f2ff 50%, #f8f9fc 100%); }
        
        /* Animations */
        @keyframes fadeUp   { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes spin     { to { transform: rotate(360deg) } }
        @keyframes pulse    { 0%,100% { opacity:1 } 50% { opacity:.5 } }
        @keyframes scan     { 0% { top:0;opacity:0 } 5%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes ping     { 75%,100% { transform:scale(2);opacity:0 } }
        @keyframes bounce   { 0%,100%{transform:translateY(-25%);animation-timing-function:cubic-bezier(.8,0,1,1)} 50%{transform:none;animation-timing-function:cubic-bezier(0,0,.2,1)} }
        .fade-up  { animation: fadeUp  .4s ease forwards; }
        .fade-in  { animation: fadeIn  .3s ease forwards; }
        .spin     { animation: spin    .8s linear infinite; }
        .pulse-a  { animation: pulse   2s ease infinite; }
        .bounce-a { animation: bounce  1s ease infinite; }
        .ping-a   { animation: ping    1.5s ease infinite; }

        /* Upload zone */
        .upload-zone {
          border: 2px dashed #d1d5f0; border-radius: 24px; cursor: pointer;
          transition: all .3s cubic-bezier(.16,1,.3,1);
          background: white;
        }
        .upload-zone:hover, .upload-zone.drag-active {
          border-color: #6366f1; background: linear-gradient(135deg,rgba(99,102,241,.03),rgba(139,92,246,.03));
          box-shadow: 0 0 0 6px rgba(99,102,241,.06);
        }

        /* Option buttons */
        .option-btn {
          width:100%; text-align:left; display:flex; align-items:center; gap:14px;
          padding:16px 20px; border-radius:16px; border:2px solid #e8eaf6;
          background:white; cursor:pointer; transition:all .2s cubic-bezier(.16,1,.3,1);
          font-size:14px; font-weight:500; color:#374151;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .option-btn:hover { border-color:#a5b4fc; background:#f5f6ff; transform:translateX(2px); }
        .option-btn.selected {
          border-color:#6366f1; background:linear-gradient(135deg,#6366f1,#8b5cf6);
          color:white; box-shadow:0 8px 24px rgba(99,102,241,.3); transform:translateX(0);
        }
        .option-btn.selected .opt-badge { background:rgba(255,255,255,.2); color:white; }
        .opt-badge {
          width:36px; height:36px; border-radius:10px; background:#f1f3ff;
          color:#6366f1; display:flex; align-items:center; justify-content:center;
          font-size:12px; font-weight:800; flex-shrink:0;
        }

        /* Quiz grid nav buttons */
        .qnav-btn {
          aspect-ratio:1; border-radius:10px; border:2px solid #e5e7eb;
          background:white; font-size:12px; font-weight:700; cursor:pointer;
          transition:all .15s ease; display:flex; align-items:center; justify-content:center;
          color:#6b7280;
        }
        .qnav-btn.answered  { background:#6366f1; border-color:#6366f1; color:white; }
        .qnav-btn.flagged   { background:#f59e0b; border-color:#f59e0b; color:white; }
        .qnav-btn.visited   { background:#e8eaf6; border-color:#c7d2fe; color:#4f46e5; }
        .qnav-btn.current   { box-shadow:0 0 0 3px rgba(99,102,241,.3); transform:scale(1.08); }

        /* Card */
        .card {
          background:white; border-radius:20px; border:1px solid rgba(226,232,240,.8);
          box-shadow:0 4px 24px rgba(0,0,0,.04);
        }
        .card-dark {
          background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);
          border-radius:20px; border:1px solid rgba(99,102,241,.2);
          box-shadow:0 8px 32px rgba(99,102,241,.15);
        }

        /* Input */
        .pq-input {
          width:100%; padding:12px 16px 12px 44px; border:1.5px solid #e2e8f0;
          border-radius:12px; font-size:13px; font-weight:500; color:#1e293b;
          background:#f8fafc; outline:none; transition:all .2s ease;
        }
        .pq-input:focus { border-color:#6366f1; background:white; box-shadow:0 0 0 4px rgba(99,102,241,.08); }
        .pq-input::placeholder { color:#94a3b8; }

        /* Difficulty buttons */
        .diff-btn {
          width:100%; text-align:left; padding:14px 16px; border-radius:14px;
          border:2px solid #e8eaf6; background:white; cursor:pointer;
          transition:all .2s cubic-bezier(.16,1,.3,1); display:flex; align-items:center; justify-content:space-between;
        }
        .diff-btn:hover { border-color:#c7d2fe; background:#f5f6ff; }
        .diff-btn.active-easy   { border-color:#6ee7b7; background:#ecfdf5; }
        .diff-btn.active-medium { border-color:#fcd34d; background:#fffbeb; }
        .diff-btn.active-hard   { border-color:#fca5a5; background:#fff1f2; }

        /* Count selector pill */
        .count-pill {
          flex:1; padding:10px; border-radius:10px; font-size:12px; font-weight:800;
          cursor:pointer; transition:all .2s ease; color:#64748b; background:transparent;
          border:none;
        }
        .count-pill.active { background:white; color:#6366f1; box-shadow:0 2px 12px rgba(99,102,241,.12); }

        /* Tag badges */
        .badge { display:inline-flex; align-items:center; gap:4px; border-radius:8px; font-size:10px; font-weight:700; padding:3px 8px; letter-spacing:.03em; }

        /* Progress bar */
        .progress-track { width:100%; height:8px; background:#e8eaf6; border-radius:999px; overflow:hidden; }
        .progress-fill  { height:100%; border-radius:999px; background:linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4); transition:width .4s ease; }

        /* Scanning line */
        .scan-wrap { position:relative; overflow:hidden; }
        .scan-wrap::after {
          content:''; position:absolute; top:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg,transparent,#8b5cf6,transparent);
          box-shadow:0 0 12px rgba(139,92,246,.6);
          animation:scan 2.5s ease-in-out infinite;
        }

        /* Results circle */
        .score-circle { position:relative; width:160px; height:160px; flex-shrink:0; }

        /* Responsive */
        @media(max-width:768px) {
          .quiz-layout { flex-direction:column !important; }
          .quiz-sidebar { width:100% !important; height:auto !important; border-left:none !important; border-top:1px solid #e2e8f0; }
        }
      `}</style>

      {/* ━━━━━━━━━━━━━━━━━━━━━ PHASE: UPLOAD ━━━━━━━━━━━━━━━━━━━━━ */}
      {phase === 'upload' && (
        <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', display:'flex', flexDirection:'column', gap:28 }}>

          {/* Hero Banner */}
          <div style={{
            background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#1e3a5f 100%)',
            borderRadius: 28, padding: '48px 48px', color: 'white', position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(99,102,241,.25)'
          }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:300, height:300, borderRadius:'50%', background:'rgba(139,92,246,.15)', filter:'blur(60px)' }} />
            <div style={{ position:'absolute', bottom:-60, left:'30%', width:250, height:250, borderRadius:'50%', background:'rgba(6,182,212,.1)', filter:'blur(80px)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
                <span style={{ background:'rgba(139,92,246,.25)', border:'1px solid rgba(139,92,246,.3)', borderRadius:999, padding:'4px 14px', fontSize:11, fontWeight:800, letterSpacing:'.08em', display:'flex', alignItems:'center', gap:6 }}>
                  <Sparkles size={12} style={{color:'#fbbf24'}} /> AI POWERED
                </span>
                <span style={{ background:'rgba(6,182,212,.2)', border:'1px solid rgba(6,182,212,.25)', borderRadius:999, padding:'4px 14px', fontSize:11, fontWeight:800, letterSpacing:'.08em' }}>
                  MOCK SIMULATOR
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight:900, margin:'0 0 12px', lineHeight:1.1 }}>
                PDF <span style={{ background:'linear-gradient(90deg,#a5b4fc,#67e8f9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>→ Mock Test</span>
              </h1>
              <p style={{ fontSize:15, color:'rgba(255,255,255,.65)', maxWidth:560, lineHeight:1.7, margin:0 }}>
                Drop any study material PDF. Our Gemini AI engine reads, understands, and builds JEE/NEET-standard MCQs with balanced marking schemes — instantly.
              </p>
              <div style={{ display:'flex', gap:28, marginTop:28, flexWrap:'wrap' }}>
                {[['⚡','Instant Generation'],['🎯','JEE/NEET Pattern'],['🔒','Secure Exam Mode']].map(([icon,label])=>(
                  <div key={label} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'rgba(255,255,255,.7)'}}>
                    <span>{icon}</span><span style={{fontWeight:600}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:24, alignItems:'start' }}>

            {/* Upload Zone */}
            <div
              className={`upload-zone${dragActive?' drag-active':''}`}
              onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{ minHeight: 340, display:'flex', alignItems:'center', justifyContent:'center', padding:40, flexDirection:'column', gap:0 }}
            >
              <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileSelect} style={{ display:'none' }} />
              {file ? (
                <div style={{ textAlign:'center' }}>
                  <div style={{ width:80, height:80, borderRadius:20, background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 4px 20px rgba(139,92,246,.2)' }}>
                    <FileText size={38} style={{color:'#7c3aed'}} />
                  </div>
                  <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'6px 16px', display:'inline-flex', alignItems:'center', gap:6, marginBottom:16 }}>
                    <CheckCircle2 size={14} style={{color:'#16a34a'}} />
                    <span style={{ fontSize:12, fontWeight:700, color:'#15803d' }}>PDF Ready</span>
                  </div>
                  <h3 style={{ fontSize:17, fontWeight:800, color:'#1e293b', margin:'0 0 6px', maxWidth:360, wordBreak:'break-word' }}>{file.name}</h3>
                  <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>{(file.size/1024/1024).toFixed(2)} MB · Click to replace</p>
                </div>
              ) : (
                <div style={{ textAlign:'center' }}>
                  <div style={{ width:80, height:80, borderRadius:20, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                    <Upload size={36} style={{color:'#94a3b8'}} />
                  </div>
                  <h3 style={{ fontSize:20, fontWeight:800, color:'#1e293b', margin:'0 0 8px' }}>Drop your study PDF here</h3>
                  <p style={{ fontSize:13, color:'#94a3b8', margin:'0 0 20px' }}>or click to browse files</p>
                  <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'8px 18px', display:'inline-block' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'.04em' }}>PDF · MAX 20 MB · NCERT / MODULES / NOTES</span>
                  </div>
                </div>
              )}
            </div>

            {/* Config Panel */}
            <div className="card" style={{ padding:28 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, paddingBottom:16, borderBottom:'1px solid #f1f5f9' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Layers size={18} style={{color:'#7c3aed'}} />
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#1e293b' }}>Configuration</div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>Set exam parameters</div>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {/* Subject */}
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Subject</label>
                  <div style={{ position:'relative' }}>
                    <BookOpen size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
                    <input className="pq-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Inorganic Chemistry" />
                  </div>
                </div>

                {/* Chapter */}
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Chapter / Topic</label>
                  <div style={{ position:'relative' }}>
                    <Layers size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
                    <input className="pq-input" value={chapter} onChange={e => setChapter(e.target.value)} placeholder="e.g. Fluid Mechanics" />
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Difficulty Level</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {DIFFICULTIES.map(d => {
                      const active = difficulty === d.id
                      const c = diffColor(d.id)
                      return (
                        <button key={d.id} onClick={() => setDifficulty(d.id)}
                          className={`diff-btn${active ? ` active-${d.id}` : ''}`}
                          style={active ? { borderColor: c.border, background: c.bg } : {}}
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:10, height:10, borderRadius:'50%', background: c.text, opacity: active ? 1 : .4 }} />
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color: active ? c.text : '#374151' }}>{d.label}</div>
                              <div style={{ fontSize:11, color:'#94a3b8' }}>{d.desc}</div>
                            </div>
                          </div>
                          {active && <CheckCircle2 size={16} style={{ color: c.text }} />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Count */}
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Question Count</label>
                  <div style={{ background:'#f1f5f9', borderRadius:12, padding:4, display:'flex', gap:2 }}>
                    {COUNTS.map(n => (
                      <button key={n} className={`count-pill${count===n?' active':''}`} onClick={() => setCount(n)}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="fade-in" style={{ background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:16, padding:'16px 20px', display:'flex', alignItems:'flex-start', gap:12 }}>
              <AlertCircle size={18} style={{ color:'#e11d48', flexShrink:0, marginTop:2 }} />
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#9f1239' }}>Generation Failed</div>
                <div style={{ fontSize:12, color:'#e11d48', marginTop:4, lineHeight:1.6 }}>{error}</div>
              </div>
            </div>
          )}

          {/* CTA */}
          <button onClick={handleGenerate} disabled={!file} style={{
            width:'100%', padding:'18px 32px', borderRadius:16, border:'none',
            background: file ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0',
            color: file ? 'white' : '#94a3b8', fontWeight:800, fontSize:16, cursor: file ? 'pointer' : 'not-allowed',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            boxShadow: file ? '0 8px 32px rgba(99,102,241,.35)' : 'none',
            transition:'all .2s ease'
          }}>
            <Zap size={20} style={{ fill: file ? '#fbbf24' : 'transparent', color: file ? '#fbbf24' : '#94a3b8' }} />
            Generate AI Mock Test
          </button>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━ PHASE: GENERATING ━━━━━━━━━━━━━━━━━━━━━ */}
      {phase === 'generating' && (
        <div className="fade-in" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div className="card scan-wrap" style={{ maxWidth:480, width:'100%', padding:48, textAlign:'center' }}>
            {/* Spinner */}
            <div style={{ width:100, height:100, position:'relative', margin:'0 auto 32px' }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid #e8eaf6' }} />
              <div className="spin" style={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid transparent', borderTopColor:'#6366f1', borderRightColor:'#8b5cf6' }} />
              <div style={{ position:'absolute', inset:12, borderRadius:'50%', background:'linear-gradient(135deg,#ede9fe,#f5f3ff)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Brain size={28} className="bounce-a" style={{color:'#7c3aed'}} />
              </div>
            </div>

            <h2 style={{ fontSize:24, fontWeight:900, color:'#1e293b', margin:'0 0 8px' }}>Processing Document</h2>
            <p style={{ fontSize:12, fontWeight:700, color:'#94a3b8', letterSpacing:'.08em', textTransform:'uppercase', margin:'0 0 32px' }}>
              {progress < 30 ? 'Extracting PDF content...' : progress < 60 ? 'Gemini AI analyzing concepts...' : progress < 85 ? 'Formulating MCQ questions...' : 'Finalizing question sheet...'}
            </p>

            <div style={{ marginBottom:32 }}>
              <div className="progress-track" style={{ marginBottom:8 }}>
                <div className="progress-fill" style={{ width:`${progress}%` }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:600, color:'#94a3b8' }}>
                <span>{progress}% complete</span>
                <span>Est. 15–30s</span>
              </div>
            </div>

            <div style={{ background:'#f8f9fc', borderRadius:16, padding:20, textAlign:'left', display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { label:'PDF text extraction',         done: progress >= 30 },
                { label:'Gemini AI concept mapping',   done: progress >= 60, active: progress >= 30 },
                { label:'MCQ formulation & grading',   done: progress >= 85, active: progress >= 60 },
              ].map((step, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, background: step.done ? '#10b981' : step.active ? '#6366f1' : '#e2e8f0', position:'relative' }}>
                    {step.active && !step.done && <div className="ping-a" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#6366f1', opacity:.4 }} />}
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color: step.done ? '#059669' : '#64748b' }}>{step.label}</span>
                  {step.done && <CheckCircle2 size={13} style={{color:'#10b981', marginLeft:'auto'}} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━ PHASE: PREVIEW ━━━━━━━━━━━━━━━━━━━━━ */}
      {phase === 'preview' && (
        <div className="fade-in" style={{ maxWidth:1100, margin:'0 auto', padding:'36px 24px', display:'flex', flexDirection:'column', gap:24 }}>

          {/* Header */}
          <div style={{
            background:'linear-gradient(135deg,#059669 0%,#0d9488 100%)',
            borderRadius:24, padding:'28px 36px', color:'white',
            display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16,
            boxShadow:'0 8px 32px rgba(5,150,105,.2)'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <CheckCircle2 size={28} />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', opacity:.8 }}>Draft Ready</div>
                <div style={{ fontSize:22, fontWeight:900, marginTop:4 }}>{questions.length} Questions Generated</div>
                <div style={{ fontSize:12, opacity:.75, marginTop:2 }}>
                  Source: {pdfInfo?.title || file?.name} · {pdfInfo?.pages || '?'} pages
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={reset} style={{ padding:'10px 20px', borderRadius:12, background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.2)', color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                ← New PDF
              </button>
              <button onClick={saveQuestionsToDB} disabled={saving || questionsSaved} style={{
                padding:'10px 20px', borderRadius:12, fontWeight:700, fontSize:13, cursor: (saving||questionsSaved) ? 'default' : 'pointer',
                background: questionsSaved ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.9)',
                border: '1px solid rgba(255,255,255,.3)',
                color: questionsSaved ? 'white' : '#059669',
                display:'flex', alignItems:'center', gap:8
              }}>
                {saving ? <Loader2 size={14} className="spin" /> : questionsSaved ? <Check size={14} /> : <Save size={14} />}
                {questionsSaved ? 'Saved to Bank' : 'Save to Bank'}
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>

            {/* Questions List */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Search + Filter */}
              <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ flex:1, position:'relative', minWidth:200 }}>
                  <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
                  <input className="pq-input" style={{ paddingLeft:40 }} value={previewSearch} onChange={e => setPreviewSearch(e.target.value)} placeholder="Search questions..." />
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {['all','easy','medium','hard'].map(opt => {
                    const active = previewDiffFilter === opt
                    const c = opt !== 'all' ? diffColor(opt) : null
                    return (
                      <button key={opt} onClick={() => setPreviewDiffFilter(opt)} style={{
                        padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer',
                        border:`1.5px solid ${active && c ? c.border : active ? '#6366f1' : '#e2e8f0'}`,
                        background: active && c ? c.bg : active ? '#ede9fe' : 'white',
                        color: active && c ? c.text : active ? '#6366f1' : '#64748b',
                        textTransform:'capitalize'
                      }}>{opt}</button>
                    )
                  })}
                </div>
              </div>

              {/* Question Cards */}
              {filteredQuestions.length > 0 ? filteredQuestions.map((q, idx) => {
                const gi = questions.indexOf(q)
                const editing = editingIndex === gi
                const expanded = expandedQ === gi
                const dc = diffColor(q.difficulty)
                return (
                  <div key={gi} className="card fade-up" style={{ overflow:'hidden' }}>
                    <div style={{ padding:'20px 24px', display:'flex', gap:16 }}>
                      <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:'#7c3aed', flexShrink:0 }}>
                        {gi + 1}
                      </div>

                      <div style={{ flex:1, minWidth:0 }}>
                        {editing ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                            <div>
                              <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'.06em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Question</label>
                              <textarea value={editForm.question} onChange={e => setEditForm({...editForm, question:e.target.value})}
                                rows={2} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }} />
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                              {['subject','chapter'].map(f => (
                                <div key={f}>
                                  <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'.06em', textTransform:'uppercase', display:'block', marginBottom:6 }}>{f}</label>
                                  <input value={editForm[f]} onChange={e => setEditForm({...editForm,[f]:e.target.value})}
                                    style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:12, outline:'none', fontFamily:'inherit' }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div onClick={() => setExpandedQ(expanded ? null : gi)} style={{ cursor:'pointer' }}>
                            <p style={{ fontSize:14, fontWeight:600, color:'#1e293b', lineHeight:1.6, margin:'0 0 10px' }}>{q.question}</p>
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                              <span className="badge" style={{ background:'#eff6ff', color:'#3b82f6', border:'1px solid #bfdbfe' }}>{q.subject || subject || 'General'}</span>
                              <span className="badge" style={{ background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0' }}>{q.chapter || chapter || 'General'}</span>
                              <span className="badge" style={{ background: dc.bg, color: dc.text, border:`1px solid ${dc.border}`, textTransform:'capitalize' }}>{q.difficulty || 'medium'}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                        {editing ? (
                          <>
                            <button onClick={() => saveEdit(gi)} style={{ padding:8, borderRadius:8, background:'#f0fdf4', border:'none', color:'#16a34a', cursor:'pointer' }}><Check size={14} /></button>
                            <button onClick={() => setEditingIndex(null)} style={{ padding:8, borderRadius:8, background:'#fff1f2', border:'none', color:'#e11d48', cursor:'pointer' }}><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditing(gi, q)} style={{ padding:8, borderRadius:8, background:'none', border:'none', color:'#94a3b8', cursor:'pointer' }} title="Edit"><Edit3 size={14} /></button>
                            <button onClick={() => deleteQuestion(gi)} style={{ padding:8, borderRadius:8, background:'none', border:'none', color:'#94a3b8', cursor:'pointer' }} title="Delete"><Trash2 size={14} /></button>
                            <button onClick={() => setExpandedQ(expanded ? null : gi)} style={{ padding:8, borderRadius:8, background:'none', border:'none', color:'#94a3b8', cursor:'pointer' }}>
                              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded Options */}
                    {(expanded || editing) && (
                      <div style={{ padding:'20px 24px', borderTop:'1px solid #f1f5f9', background:'#fafbff' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                          {['A','B','C','D'].map(opt => {
                            const isCorrect = opt === q.correct
                            return (
                              <div key={opt} style={{
                                display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
                                borderRadius:12, border:`1.5px solid ${editing ? '#e2e8f0' : isCorrect ? '#6ee7b7' : '#e2e8f0'}`,
                                background: editing ? 'white' : isCorrect ? '#f0fdf4' : 'white'
                              }}>
                                <span style={{ width:28, height:28, borderRadius:8, background: isCorrect && !editing ? '#10b981' : '#f1f5f9', color: isCorrect && !editing ? 'white' : '#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>{opt}</span>
                                {editing ? (
                                  <input value={editForm.options[opt]} onChange={e => setEditForm({...editForm, options:{...editForm.options,[opt]:e.target.value}})}
                                    placeholder={`Option ${opt}`} style={{ flex:1, border:'none', outline:'none', fontSize:12, background:'transparent', fontFamily:'inherit' }} />
                                ) : (
                                  <span style={{ flex:1, fontSize:13, color: isCorrect ? '#065f46' : '#374151', fontWeight: isCorrect ? 600 : 400 }}>{q.options?.[opt]}</span>
                                )}
                                {!editing && isCorrect && <CheckCircle2 size={14} style={{color:'#10b981', flexShrink:0}} />}
                              </div>
                            )
                          })}
                        </div>

                        {editing && (
                          <div style={{ marginBottom:12 }}>
                            <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'.06em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Correct Answer</label>
                            <select value={editForm.correct} onChange={e => setEditForm({...editForm, correct:e.target.value})}
                              style={{ padding:'8px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:12, outline:'none', background:'white', fontFamily:'inherit' }}>
                              {['A','B','C','D'].map(o => <option key={o} value={o}>Option {o}</option>)}
                            </select>
                          </div>
                        )}

                        {editing ? (
                          <div>
                            <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'.06em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Explanation</label>
                            <textarea value={editForm.explanation} onChange={e => setEditForm({...editForm, explanation:e.target.value})}
                              rows={2} placeholder="Conceptual explanation..." style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:12, outline:'none', resize:'vertical', fontFamily:'inherit' }} />
                          </div>
                        ) : q.explanation ? (
                          <div style={{ padding:'14px 16px', background:'linear-gradient(135deg,#eff6ff,#f0f9ff)', borderRadius:12, border:'1px solid #bfdbfe' }}>
                            <div style={{ fontSize:10, fontWeight:800, color:'#3b82f6', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:6 }}>💡 Explanation</div>
                            <p style={{ fontSize:12, color:'#1e40af', lineHeight:1.7, margin:0 }}>{q.explanation}</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              }) : (
                <div className="card" style={{ padding:48, textAlign:'center' }}>
                  <AlertCircle size={32} style={{ color:'#d1d5db', margin:'0 auto 12px' }} />
                  <div style={{ fontWeight:700, color:'#374151' }}>No matching questions</div>
                  <div style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>Try adjusting your search or filters</div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Launch Card */}
              <div className="card-dark" style={{ padding:28, color:'white' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:'rgba(139,92,246,.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Target size={20} style={{color:'#a5b4fc'}} />
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800 }}>Exam Simulator</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:2 }}>Live test environment</div>
                  </div>
                </div>

                <p style={{ fontSize:12, color:'rgba(255,255,255,.6)', lineHeight:1.7, marginBottom:20 }}>
                  Test under timed conditions. Tracks answers, XP rewards, and mistake patterns.
                </p>

                <div style={{ borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:16, marginBottom:20 }}>
                  {[
                    ['Difficulty',       <span style={{fontWeight:700, color:'#a5b4fc', textTransform:'capitalize'}}>{difficulty}</span>],
                    ['Marking Scheme',   <span style={{fontWeight:700, color:'#6ee7b7'}}>+4 / -1</span>],
                    ['Time Allowed',     <span style={{fontWeight:700, color:'#a5b4fc'}}>{questions.length * 1.5} mins</span>],
                    ['Questions',        <span style={{fontWeight:700, color:'#a5b4fc'}}>{questions.length}</span>],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, fontSize:12 }}>
                      <span style={{ color:'rgba(255,255,255,.5)' }}>{label}</span>
                      {val}
                    </div>
                  ))}
                </div>

                <button onClick={startQuiz} disabled={saving} style={{
                  width:'100%', padding:'14px', borderRadius:14, border:'none',
                  background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white',
                  fontWeight:800, fontSize:14, cursor: saving ? 'wait' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow:'0 4px 20px rgba(139,92,246,.4)'
                }}>
                  {saving ? <Loader2 size={16} className="spin" /> : <Play size={16} style={{fill:'white'}} />}
                  Start Exam Session
                </button>
              </div>

              {/* Document Info */}
              <div className="card" style={{ padding:24 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#1e293b', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                  <Info size={15} style={{color:'#94a3b8'}} /> Document Profile
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {[
                    { icon: FileText, label:'Pages Parsed',   val: pdfInfo?.pages ? `${pdfInfo.pages} pages` : 'Auto-detected' },
                    { icon: BookOpen, label:'Subject Area',   val: subject || pdfInfo?.title || 'Auto-detected' },
                    { icon: BarChart3,label:'Marking System', val: 'JEE/NEET Standard' },
                    { icon: Award,    label:'Difficulty',     val: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
                  ].map(({icon: Icon, label, val}) => (
                    <div key={label} style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:'#f8f9fc', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Icon size={15} style={{color:'#64748b'}} />
                      </div>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'.04em', textTransform:'uppercase' }}>{label}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#1e293b', marginTop:2 }}>{val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━ PHASE: QUIZ SIMULATOR ━━━━━━━━━━━━━━━━━━━━━ */}
      {phase === 'quiz-started' && !showResults && (
        <div className="quiz-layout" style={{ display:'flex', height:'calc(100vh - 64px)' }}>

          {/* ── Left: Question Pane ── */}
          <div style={{ flex:1, overflowY:'auto', padding:'28px 32px', display:'flex', flexDirection:'column', gap:20 }}>

            {/* Top Bar */}
            <div className="card" style={{ padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ background:'#ede9fe', color:'#7c3aed', borderRadius:6, padding:'3px 10px', fontSize:10, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase' }}>Exam Active</span>
                  {violations > 0 && <span style={{ background:'#fff1f2', color:'#e11d48', borderRadius:6, padding:'3px 10px', fontSize:10, fontWeight:800 }}>⚠️ {violations}/3 Warnings</span>}
                </div>
                <div style={{ fontSize:15, fontWeight:800, color:'#1e293b' }}>{subject || q.subject || 'Simulated Test'}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{chapter || q.chapter || 'Mock Assessment'}</div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {/* Progress Ring */}
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'#94a3b8', fontWeight:700, marginBottom:4 }}>Progress</div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#6366f1' }}>{answeredCount}/{questions.length}</div>
                </div>
                {/* Timer */}
                <div style={{ textAlign:'right', background: timeLeft < 120 ? '#fff1f2' : '#f8f9fc', borderRadius:12, padding:'10px 16px', border:`1px solid ${timeLeft < 120 ? '#fecdd3' : '#e2e8f0'}` }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'.06em', textTransform:'uppercase' }}>Time Left</div>
                  <div className={timeLeft < 120 ? 'pulse-a' : ''} style={{ fontSize:22, fontWeight:900, fontFamily:'monospace', color: timeLeft < 120 ? '#e11d48' : '#1e293b', marginTop:2 }}>
                    {fmtTime(timeLeft)}
                  </div>
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="card" style={{ padding:'32px', flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, paddingBottom:20, borderBottom:'1px solid #f1f5f9', flexWrap:'wrap', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, boxShadow:'0 4px 12px rgba(99,102,241,.3)' }}>
                    {current + 1}
                  </div>
                  <span style={{ fontSize:13, color:'#94a3b8', fontWeight:600 }}>of {questions.length} questions</span>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <span className="badge" style={{ background:'#eff6ff', color:'#3b82f6', border:'1px solid #bfdbfe' }}>+4 marks</span>
                  <span className="badge" style={{ background:'#fff1f2', color:'#e11d48', border:'1px solid #fecdd3' }}>-1 negative</span>
                  {(() => { const dc = diffColor(q.difficulty || 'medium'); return <span className="badge" style={{ background:dc.bg, color:dc.text, border:`1px solid ${dc.border}`, textTransform:'capitalize' }}>{q.difficulty || 'medium'}</span> })()}
                </div>
              </div>

              <p style={{ fontSize:17, fontWeight:600, color:'#1e293b', lineHeight:1.7, marginBottom:28 }}>{q.question}</p>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {q.options && Object.entries(q.options).map(([k, v]) => {
                  const sel = answers[current] === k
                  return (
                    <button key={k} className={`option-btn${sel?' selected':''}`} onClick={() => selectAnswer(k)}>
                      <span className="opt-badge">{k}</span>
                      <span style={{ flex:1, lineHeight:1.6 }}>{v}</span>
                      {sel && <CheckCircle2 size={18} style={{color:'rgba(255,255,255,.9)', flexShrink:0}} />}
                    </button>
                  )
                })}
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:28, paddingTop:20, borderTop:'1px solid #f1f5f9', flexWrap:'wrap', gap:10 }}>
                <button onClick={() => goTo(current - 1)} disabled={current === 0} style={{ padding:'10px 22px', borderRadius:12, border:'1.5px solid #e2e8f0', background:'white', fontSize:13, fontWeight:700, color:'#374151', cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? .4 : 1 }}>
                  ← Previous
                </button>

                <button onClick={() => toggleFlag(current)} style={{
                  padding:'10px 22px', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer',
                  border: flagged[current] ? '1.5px solid #f59e0b' : '1.5px solid #fcd34d',
                  background: flagged[current] ? '#f59e0b' : '#fffbeb',
                  color: flagged[current] ? 'white' : '#92400e',
                  display:'flex', alignItems:'center', gap:6
                }}>
                  <Flag size={14} style={{ fill: flagged[current] ? 'white' : 'transparent' }} />
                  {flagged[current] ? 'Flagged' : 'Flag'}
                </button>

                {current < questions.length - 1 ? (
                  <button onClick={() => goTo(current + 1)} style={{ padding:'10px 22px', borderRadius:12, border:'none', background:'#1e293b', color:'white', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    Next →
                  </button>
                ) : (
                  <button onClick={() => setShowSubmitModal(true)} style={{ padding:'10px 24px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#10b981,#0d9488)', color:'white', fontSize:13, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 16px rgba(16,185,129,.3)' }}>
                    Submit Paper ✓
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Sidebar ── */}
          <aside className="quiz-sidebar" style={{ width:300, borderLeft:'1px solid #e8eaf6', background:'white', display:'flex', flexDirection:'column', overflowY:'auto', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#1e293b', marginBottom:4 }}>Question Palette</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>Click to jump to any question</div>
            </div>

            {/* Legend */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20, background:'#f8f9fc', borderRadius:12, padding:12 }}>
              {[
                { color:'#6366f1', label:'Answered' },
                { color:'#f59e0b', label:'Flagged' },
                { color:'#c7d2fe', label:'Visited' },
                { color:'#e5e7eb', label:'Not Visited' },
              ].map(({color, label}) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, color:'#64748b' }}>
                  <div style={{ width:10, height:10, borderRadius:4, background:color, flexShrink:0 }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:'auto' }}>
              {questions.map((_, idx) => {
                const isAns = answers[idx] !== undefined
                const isFl  = flagged[idx]
                const isVis = visited[idx]
                const isCur = idx === current
                let cls = 'qnav-btn'
                if (isAns)  cls += ' answered'
                else if (isFl) cls += ' flagged'
                else if (isVis) cls += ' visited'
                if (isCur) cls += ' current'
                return <button key={idx} className={cls} onClick={() => goTo(idx)}>{idx + 1}</button>
              })}
            </div>

            {/* Stats */}
            <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:20, marginTop:20 }}>
              {[
                { label:'Answered',  val: answeredCount,                    color:'#6366f1' },
                { label:'Flagged',   val: flaggedCount,                     color:'#f59e0b' },
                { label:'Remaining', val: questions.length - answeredCount, color:'#94a3b8' },
              ].map(({label, val, color}) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, fontSize:13 }}>
                  <span style={{ fontWeight:600, color:'#64748b' }}>{label}</span>
                  <span style={{ fontWeight:800, color }}>{val}</span>
                </div>
              ))}

              <button onClick={() => setShowSubmitModal(true)} style={{
                width:'100%', marginTop:12, padding:'12px', borderRadius:14, border:'none',
                background:'linear-gradient(135deg,#10b981,#0d9488)', color:'white',
                fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 4px 16px rgba(16,185,129,.25)'
              }}>
                Submit Paper
              </button>
            </div>
          </aside>

          {/* Submit Modal */}
          {showSubmitModal && (
            <div className="fade-in" style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
              <div className="card" style={{ maxWidth:400, width:'100%', padding:36, textAlign:'center' }}>
                <div style={{ width:60, height:60, borderRadius:18, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                  <ShieldAlert size={28} style={{color:'#16a34a'}} />
                </div>
                <h3 style={{ fontSize:20, fontWeight:900, color:'#1e293b', margin:'0 0 8px' }}>Submit Assessment?</h3>
                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.7, margin:'0 0 28px' }}>
                  You've answered <strong style={{color:'#1e293b'}}>{answeredCount}</strong> of <strong style={{color:'#1e293b'}}>{questions.length}</strong> questions.
                  {questions.length - answeredCount > 0 && ` ${questions.length - answeredCount} unanswered will be skipped.`}
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <button onClick={() => setShowSubmitModal(false)} style={{ padding:'12px', borderRadius:12, border:'1.5px solid #e2e8f0', background:'white', fontWeight:700, fontSize:14, cursor:'pointer', color:'#374151' }}>
                    Keep Solving
                  </button>
                  <button onClick={submitQuiz} style={{ padding:'12px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#10b981,#0d9488)', color:'white', fontWeight:800, fontSize:14, cursor:'pointer' }}>
                    Submit Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━ RESULTS SCREEN ━━━━━━━━━━━━━━━━━━━━━ */}
      {phase === 'quiz-started' && showResults && quizResults && (
        <div className="fade-in" style={{ maxWidth:1100, margin:'0 auto', padding:'40px 24px', display:'flex', flexDirection:'column', gap:28 }}>

          {/* Score Banner */}
          <div style={{
            background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f2b3d 100%)',
            borderRadius:28, padding:'48px', color:'white', position:'relative', overflow:'hidden',
            display:'flex', alignItems:'center', gap:48, flexWrap:'wrap',
            boxShadow:'0 20px 60px rgba(99,102,241,.2)'
          }}>
            <div style={{ position:'absolute', top:-40, right:60, width:300, height:300, borderRadius:'50%', background:'rgba(139,92,246,.12)', filter:'blur(60px)' }} />

            {/* Circle Score */}
            <div style={{ position:'relative', width:160, height:160, flexShrink:0 }}>
              <svg style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,.1)" strokeWidth="7" fill="transparent" />
                <circle cx="50" cy="50" r="42" strokeWidth="7" fill="transparent"
                  stroke={pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444'}
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * pct) / 100}
                  style={{ transition:'stroke-dashoffset 1.2s ease' }}
                />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontSize:36, fontWeight:900, color: pct >= 70 ? '#6ee7b7' : pct >= 45 ? '#fcd34d' : '#fca5a5' }}>{pct}%</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', letterSpacing:'.1em', textTransform:'uppercase', fontWeight:800 }}>Accuracy</div>
              </div>
            </div>

            {/* Text */}
            <div style={{ flex:1 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(99,102,241,.2)', border:'1px solid rgba(99,102,241,.3)', borderRadius:999, padding:'5px 16px', fontSize:11, fontWeight:700, letterSpacing:'.06em', marginBottom:16 }}>
                <Award size={13} style={{color:'#a5b4fc'}} /> Assessment Summary
              </div>
              <h2 style={{ fontSize:'clamp(22px,4vw,40px)', fontWeight:900, margin:'0 0 12px', lineHeight:1.2 }}>
                {pct >= 70 ? '🎉 Superb Performance!' : pct >= 45 ? '💪 Good Attempt!' : '📚 Keep Practicing!'}
              </h2>
              <p style={{ fontSize:14, color:'rgba(255,255,255,.55)', lineHeight:1.8, margin:'0 0 24px', maxWidth:500 }}>
                Your answers and mistake patterns have been saved to your study notebook. Review them for targeted improvement.
              </p>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {[
                  { label:'New Test',       action: reset,                      style: { background:'rgba(99,102,241,.8)', border:'none' } },
                  { label:'Mistake Book',   action: () => navigate('/mistakes'), style: { background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)' } },
                  { label:'Dashboard',      action: () => navigate('/dashboard'),style: { background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.1)' } },
                ].map(({label, action, style}) => (
                  <button key={label} onClick={action} style={{ ...style, padding:'10px 22px', borderRadius:12, color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
            {[
              { label:'Total Score',     val: `${quizResults.obtainedMarks} / ${quizResults.totalMarks || questions.length * 4}`, icon: Star,       color:'#6366f1', bg:'#ede9fe' },
              { label:'Accuracy',        val: `${quizResults.accuracy}%`,                                                          icon: Target,      color:'#10b981', bg:'#ecfdf5' },
              { label:'Correct / Wrong', val: `${quizResults.correct} ✓  ${quizResults.wrong} ✗`,                                 icon: CheckCircle2,color:'#3b82f6', bg:'#eff6ff' },
              { label:'XP Earned',       val: `+${quizResults.xpAwarded || 0} XP`,                                                icon: Sparkles,    color:'#f59e0b', bg:'#fffbeb' },
            ].map(({label, val, icon:Icon, color, bg}) => (
              <div key={label} className="card" style={{ padding:24 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                  <Icon size={20} style={{color}} />
                </div>
                <div style={{ fontSize:20, fontWeight:900, color:'#1e293b', marginBottom:4 }}>{val}</div>
                <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Review List */}
          <div>
            <h3 style={{ fontSize:18, fontWeight:900, color:'#1e293b', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <BookOpen size={18} style={{color:'#64748b'}} /> Exam Review
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {questions.map((q, idx) => {
                const sel       = answers[idx]
                const isCorrect = sel === q.correct
                const isSkipped = !sel
                const border    = isSkipped ? '#e2e8f0' : isCorrect ? '#6ee7b7' : '#fca5a5'
                const bg        = isSkipped ? '#fafbff' : isCorrect ? '#f0fdf4' : '#fff1f2'
                return (
                  <div key={idx} style={{ borderRadius:20, border:`1.5px solid ${border}`, background:bg, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, marginBottom:16 }}>
                      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                        <div style={{ width:30, height:30, borderRadius:10, background: isSkipped ? '#e2e8f0' : isCorrect ? '#10b981' : '#ef4444', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, flexShrink:0 }}>
                          {idx + 1}
                        </div>
                        <p style={{ fontSize:14, fontWeight:600, color:'#1e293b', lineHeight:1.6, margin:0 }}>{q.question}</p>
                      </div>
                      {isSkipped ? (
                        <span className="badge" style={{ background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0', flexShrink:0 }}>Skipped</span>
                      ) : isCorrect ? (
                        <span className="badge" style={{ background:'#dcfce7', color:'#15803d', border:'1px solid #bbf7d0', flexShrink:0, display:'flex', alignItems:'center', gap:4 }}><CheckCircle2 size={11}/>Correct</span>
                      ) : (
                        <span className="badge" style={{ background:'#fee2e2', color:'#dc2626', border:'1px solid #fca5a5', flexShrink:0, display:'flex', alignItems:'center', gap:4 }}><XCircle size={11}/>Wrong</span>
                      )}
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, paddingLeft:42 }}>
                      {Object.entries(q.options).map(([k, v]) => {
                        const isCKey = k === q.correct
                        const isUKey = k === sel
                        return (
                          <div key={k} style={{
                            display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, fontSize:13,
                            border:`1.5px solid ${isCKey ? '#6ee7b7' : isUKey ? '#fca5a5' : '#e5e7eb'}`,
                            background: isCKey ? '#f0fdf4' : isUKey ? '#fff1f2' : 'white'
                          }}>
                            <span style={{ width:26, height:26, borderRadius:8, background: isCKey ? '#10b981' : isUKey ? '#ef4444' : '#f1f5f9', color: (isCKey || isUKey) ? 'white' : '#64748b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>{k}</span>
                            <span style={{ flex:1, color: isCKey ? '#065f46' : isUKey ? '#991b1b' : '#374151', fontWeight: isCKey ? 600 : 400 }}>{v}</span>
                            {isCKey  && <CheckCircle2 size={14} style={{color:'#10b981', flexShrink:0}} />}
                            {!isCKey && isUKey && <XCircle size={14} style={{color:'#ef4444', flexShrink:0}} />}
                          </div>
                        )
                      })}
                    </div>

                    {q.explanation && (
                      <div style={{ marginTop:12, paddingLeft:42, padding:'12px 16px 12px 58px', background:'linear-gradient(135deg,#eff6ff,#f0f9ff)', borderRadius:12, border:'1px solid #bfdbfe' }}>
                        <div style={{ fontSize:10, fontWeight:800, color:'#3b82f6', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4 }}>💡 Explanation</div>
                        <p style={{ fontSize:12, color:'#1e40af', lineHeight:1.7, margin:0 }}>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
