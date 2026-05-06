import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Clock, ChevronRight, CheckCircle2, ChevronLeft, AlertCircle, Maximize, Play, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuizPage({ isMockTest = false }) {
  const { subject, chapter, mockTestId } = useParams()
  const navigate = useNavigate()
  
  // State
  const [mode, setMode] = useState('practice') // practice | test | exam
  const [status, setStatus] = useState('setup') // setup | playing | submitting
  const [attemptId, setAttemptId] = useState(null)
  
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: selectedOption }
  
  const [timeLeft, setTimeLeft] = useState(0)
  
  const qStartRef = useRef(Date.now())

  // Handle visibility change (anti-cheating)
  useEffect(() => {
    if (status !== 'playing' || mode !== 'exam') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.error("Test ended automatically due to tab switch!", { icon: <ShieldAlert color="#ef4444" /> });
        if (attemptId) {
          api.post('/quizzes/violation', { attemptId }).catch(console.error);
          
          // Force Submit
          setStatus('submitting');
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(console.error);
          }
          api.post('/quizzes/submit', { attemptId }).finally(() => {
            navigate(`/quiz/result/${attemptId}`, { replace: true });
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, mode, attemptId, navigate]);

  // Timer logic
  useEffect(() => {
    if (status !== 'playing' || timeLeft <= 0 || mode === 'practice') return;
    
    const t = setInterval(() => setTimeLeft(s => {
      if (s <= 1) { 
        clearInterval(t); 
        toast('Time is up! Auto-submitting...', { icon: '⏰' });
        handleSubmit(); 
        return 0;
      }
      return s - 1;
    }), 1000);
    
    return () => clearInterval(t);
  }, [timeLeft, status, mode]);

  const startQuiz = async () => {
    try {
      setStatus('submitting') // loading state
      let data;
      if (isMockTest) {
        const res = await api.post(`/mock-tests/${mockTestId}/start`);
        data = res.data;
        setMode('exam');
      } else {
        const res = await api.post('/quizzes/start', { subject, chapter, mode, limit: 10 });
        data = res.data;
      }
      
      setQuestions(data.data.questions)
      setAttemptId(data.data.attemptId)
      
      if (isMockTest && data.data.duration) {
        setTimeLeft(data.data.duration * 60)
      } else {
        setTimeLeft(data.data.questions.length * 90)
      }
      
      setStatus('playing')
      qStartRef.current = Date.now()

      if (mode === 'exam') {
        document.documentElement.requestFullscreen().catch(() => {
          toast.error("Please allow fullscreen for Exam mode.");
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start quiz')
      setStatus('setup')
    }
  }

  const selectAnswer = async (option) => {
    const q = questions[current];
    const timeTaken = Math.round((Date.now() - qStartRef.current) / 1000);
    
    // Optimistic UI update
    setAnswers(prev => ({ ...prev, [q._id]: option }));
    qStartRef.current = Date.now(); // reset timer for next selection or re-selection

    try {
      await api.post('/quizzes/answer', {
        attemptId,
        questionId: q._id,
        selectedOption: option,
        timeTakenSeconds: timeTaken
      });
    } catch (err) {
      toast.error('Failed to save answer. Connection issue?');
    }
  }

  const toggleBookmark = async (qid) => {
    const isBookmarked = bookmarks.includes(qid);
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/question/${qid}`);
        setBookmarks(prev => prev.filter(id => id !== qid));
        toast.success('Bookmark removed');
      } else {
        await api.post(`/bookmarks/question/${qid}`);
        setBookmarks(prev => [...prev, qid]);
        toast.success('Question bookmarked!');
      }
    } catch { toast.error('Failed to update bookmark') }
  }

  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    api.get('/bookmarks').then(res => {
      const qBookmarks = res.data.data.filter(b => b.type === 'question').map(b => b.itemId._id || b.itemId);
      setBookmarks(qBookmarks);
    }).catch(() => {});
  }, []);

  const next = () => { qStartRef.current = Date.now(); setCurrent(c => c + 1) }
  const prev = () => { qStartRef.current = Date.now(); setCurrent(c => c - 1) }

  const handleSubmit = async () => {
    setStatus('submitting')
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
      
      const { data } = await api.post('/quizzes/submit', { attemptId })
      navigate(`/quiz/result/${attemptId}`, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed')
      setStatus('playing')
    }
  }

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const [showInstructions, setShowInstructions] = useState(false)

  // SETUP SCREEN
  if (status === 'setup') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32, maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ padding: 40, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{isMockTest ? 'Mock Test' : `${subject} Quiz`}</div>
          <div style={{ fontSize: 16, color: '#64748b', marginBottom: 32 }}>{isMockTest ? 'Ready to begin your exam?' : chapter}</div>

          {!isMockTest && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 32 }}>
              {[
                { id: 'practice', label: 'Practice Mode', desc: 'No timer. Take your time.' },
                { id: 'test', label: 'Test Mode', desc: 'Standard timer. Real exam feel.' },
                { id: 'exam', label: 'Exam Mode', desc: 'Strict timer, fullscreen, anti-cheat enabled.' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    padding: '16px 20px', borderRadius: 12, border: `2px solid ${mode === m.id ? '#4f46e5' : '#e2e8f0'}`,
                    background: mode === m.id ? '#eef2ff' : '#fff', textAlign: 'left', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: mode === m.id ? '#4f46e5' : '#1e293b' }}>{m.label}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          )}

          <button onClick={() => (mode === 'exam' || isMockTest) ? setShowInstructions(true) : startQuiz()} className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 16 }}>
            <Play size={18} /> {isMockTest ? 'Start Mock Test' : `Start ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
          </button>
        </div>

        {/* ── Instruction Modal ── */}
        {showInstructions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="card fade-up" style={{ maxWidth: 500, padding: 32, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={24} color="#ef4444" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Exam Rules & Instructions</h2>
              </div>

              <div style={{ spaceY: 12, marginBottom: 28 }}>
                {[
                  { icon: Maximize, text: 'The test will run in Fullscreen mode. Exiting fullscreen will end the test.' },
                  { icon: ShieldAlert, text: 'Strict Anti-Cheat: Switching tabs or minimizing the browser will end the test immediately.' },
                  { icon: Clock, text: 'Timer starts immediately. Unanswered questions will be auto-submitted at the end.' },
                  { icon: AlertCircle, text: 'Ensure a stable internet connection. Progress is saved automatically on each answer.' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <item.icon size={18} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{item.text}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowInstructions(false)} className="btn btn-secondary" style={{ flex: 1, padding: 12 }}>Cancel</button>
                <button onClick={() => { setShowInstructions(false); startQuiz() }} className="btn btn-primary" style={{ flex: 2, padding: 12, background: '#ef4444' }}>I Understand, Start</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === 'submitting' && questions.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  // PLAYING QUIZ SCREEN
  if (status === 'playing' && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-xl font-black text-slate-900">No Questions Found</h3>
        <p className="text-sm text-slate-500 max-w-xs">This mock test does not have any questions assigned. Please contact the administrator.</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary px-8">Return to Dashboard</button>
      </div>
    )
  }

  const q = questions[current]
  if (!q) return null;

  const answered = answers[q._id]
  const answeredCount = Object.keys(answers).length
  const isLowTime = timeLeft < 60

  return (
    <div style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>
      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{isMockTest ? 'Mock Test' : subject}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            <span style={{ textTransform: 'capitalize', fontWeight: 600, color: mode === 'exam' || isMockTest ? '#dc2626' : '#4f46e5' }}>{isMockTest ? 'Exam' : mode} Mode</span> · Question {current + 1} of {questions.length}
          </div>
        </div>
        
        {mode !== 'practice' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 10, fontWeight: 700,
            fontVariantNumeric: 'tabular-nums', fontSize: 16,
            background: isLowTime ? '#fef2f2' : '#f8fafc',
            color: isLowTime ? '#dc2626' : '#0f172a',
            border: `1.5px solid ${isLowTime ? '#fca5a5' : '#e2e8f0'}`,
            transition: 'all 0.3s',
          }}>
            <Clock size={16} /> {fmt(timeLeft)}
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ marginBottom: 24 }}>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
          <span>{answeredCount} answered</span>
          <span>{questions.length - answeredCount} remaining</span>
        </div>
      </div>

      {/* ── Question card ── */}
      <div className="card" style={{ padding: 28, marginBottom: 16 }}>
        {/* Question number + text */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {current + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', lineHeight: 1.6 }}>{q.question}</p>
              <button 
                onClick={() => toggleBookmark(q._id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: bookmarks.includes(q._id) ? '#4f46e5' : '#94a3b8' }}
              >
                <BookOpen size={18} fill={bookmarks.includes(q._id) ? '#4f46e5' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options ? Object.entries(q.options).map(([key, val]) => {
            const isSelected = answered === key
            return (
              <button
                key={key}
                onClick={() => selectAnswer(key)}
                style={{
                  textAlign: 'left', padding: '13px 16px', borderRadius: 12,
                  border: `2px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                  background: isSelected ? '#eef2ff' : '#ffffff',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: isSelected ? '0 0 0 3px rgba(79,70,229,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#c7d2fe' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#e2e8f0' }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: isSelected ? '#4f46e5' : '#f1f5f9',
                  color: isSelected ? 'white' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {key}
                </span>
                <span style={{ fontSize: 14, color: '#0f172a', fontWeight: isSelected ? 600 : 400 }}>{val}</span>
                {isSelected && <CheckCircle2 size={16} color="#4f46e5" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
              </button>
            )
          }) : (
            <input 
              type="text" 
              placeholder="Type your answer here..." 
              value={answered || ''}
              onChange={(e) => selectAnswer(e.target.value)}
              style={{
                padding: '16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 16, outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={prev} disabled={current === 0} className="btn btn-secondary btn-sm">
            <ChevronLeft size={15} /> Previous
          </button>

          {/* Dot navigation */}
          <div style={{ display: 'flex', gap: 6 }}>
            {questions.map((q, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{
                width: answers[questions[i]._id] ? 22 : 8,
                height: 8, borderRadius: 99, border: 'none', cursor: 'pointer',
                background: answers[questions[i]._id] ? '#4f46e5' : i === current ? '#a5b4fc' : '#e2e8f0',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>

          {current < questions.length - 1 ? (
            <button onClick={next} className="btn btn-primary btn-sm">
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={status === 'submitting'} className="btn btn-primary btn-sm">
              {status === 'submitting' ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Submitting</> : <><CheckCircle2 size={14} /> Submit</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
