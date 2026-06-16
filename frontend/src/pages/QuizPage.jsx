import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  Clock, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle,
  ShieldAlert, BookOpen, Send, Flag, Sparkles, BrainCircuit, Target, Lightbulb
} from 'lucide-react'
import toast from 'react-hot-toast'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const Q_STATUS = {
  answered:  { bg: '#3b82f6', text: '#fff', border: '#3b82f6' },
  flagged:   { bg: '#f59e0b', text: '#fff', border: '#f59e0b' },
  visited:   { bg: '#e2e8f0', text: '#475569', border: '#e2e8f0' },
  current:   { bg: '#fff', text: '#3b82f6', border: '#3b82f6', ring: '0 0 0 3px rgba(59,130,246,0.3)' },
  unanswered:{ bg: '#fff', text: '#94a3b8', border: '#e2e8f0' },
}

export default function QuizPage({ isMockTest = false }) {
  const { subject, chapter, mockTestId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const mode  = isMockTest ? 'exam' : (searchParams.get('mode') || 'practice')
  const limit = parseInt(searchParams.get('limit') || '10')

  const [phase, setPhase]       = useState('instructions')
  const [questions, setQuestions] = useState([])
  const [attemptId, setAttemptId] = useState(null)
  const [current, setCurrent]   = useState(0)
  const [answers, setAnswers]   = useState({})
  const [flagged, setFlagged]   = useState({})
  const [visited, setVisited]   = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [saving, setSaving]     = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [bookmarks, setBookmarks] = useState([])

  // Integrity Mode States
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmCheckbox, setConfirmCheckbox] = useState(false)
  const [fsWarning, setFsWarning] = useState(false)
  const [fsWarningCountdown, setFsWarningCountdown] = useState(5)
  const [submittingExam, setSubmittingExam] = useState(false)
  const [activeAttempt, setActiveAttempt] = useState(null)
  const [offlineAnswers, setOfflineAnswers] = useState({})

  const qStartRef = useRef(Date.now())
  const timerRef  = useRef(null)
  const warningTimerRef = useRef(null)

  // Fetch bookmarks on mount
  useEffect(() => {
    api.get('/bookmarks').then(r => {
      setBookmarks(r.data.data.filter(b => b.type === 'question').map(b => b.itemId?._id || b.itemId))
    }).catch(() => {})
  }, [])

  // Check for active in-progress attempts for this exam to support seamless resume on refresh
  useEffect(() => {
    const checkActiveAttempt = async () => {
      try {
        const r = await api.get('/quizzes/attempts')
        const matching = r.data.data.find(att => {
          if (att.status !== 'in-progress') return false
          if (isMockTest) {
            return att.mockTestId === mockTestId
          } else {
            return att.subject.toLowerCase() === subject?.toLowerCase() && 
                   att.chapter.toLowerCase() === chapter?.toLowerCase()
          }
        })
        if (matching) {
          setActiveAttempt(matching)
        }
      } catch {}
    }
    checkActiveAttempt()
  }, [subject, chapter, mockTestId, isMockTest])

  // Prevent accidental close/refresh warnings
  useEffect(() => {
    const isExam = mode === 'exam' || isMockTest
    if (phase !== 'playing' || !isExam) return

    const preventClose = (e) => {
      e.preventDefault()
      e.returnValue = 'Exiting or refreshing will count as submitting your exam. Are you sure?'
      return e.returnValue
    }
    window.addEventListener('beforeunload', preventClose)
    return () => window.removeEventListener('beforeunload', preventClose)
  }, [phase, mode, isMockTest])

  // Auto-submit functionality due to integrity violation
  const doAutoSubmit = useCallback(async (vType, details) => {
    if (submittingExam) return
    setSubmittingExam(true)
    
    // Stop timers immediately
    clearInterval(timerRef.current)
    if (warningTimerRef.current) clearInterval(warningTimerRef.current)
    
    // Attempt to exit fullscreen cleanly
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }

    setPhase('submitting')
    toast.error(`Exam Auto-Submitted: Integrity Violation (${vType === 'tab-switch' ? 'Tab Switch' : vType === 'window-blur' ? 'Focus Lost' : 'Fullscreen Exit'})`, { duration: 5000 })
    
    try {
      // Gather latest local answers to sync
      const finalAnswersList = Object.entries(answers).map(([qid, val]) => ({
        questionId: qid,
        selectedOption: val,
        timeTakenSeconds: 0
      }))

      // Submit to secure endpoint
      await api.post('/quizzes/auto-submit', {
        attemptId,
        answers: finalAnswersList,
        violationType: vType,
        details
      })

      // Clean local storage caching
      localStorage.removeItem(`exam_answers_${attemptId}`)
      navigate(`/quiz/result/${attemptId}`, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Auto-submit Sync Failed')
      setPhase('playing')
      setSubmittingExam(false)
    }
  }, [attemptId, answers, navigate, submittingExam])

  // Monitor Tab Switches and Focus shifts
  useEffect(() => {
    const isExam = mode === 'exam' || isMockTest
    if (phase !== 'playing' || !isExam || !attemptId) return

    const handleVisibility = () => {
      if (document.hidden) {
        doAutoSubmit('tab-switch', 'Student switched browser tab or minimized window')
      }
    }

    const handleBlur = () => {
      doAutoSubmit('window-blur', 'Student shifted focus out of the browser window')
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
    }
  }, [phase, mode, isMockTest, attemptId, doAutoSubmit])

  // Monitor Fullscreen changes
  const handleFsChange = useCallback(() => {
    const isExam = mode === 'exam' || isMockTest
    if (phase !== 'playing' || !isExam) return

    if (!document.fullscreenElement) {
      // User exited fullscreen: Log violation immediately & prompt countdown
      setFsWarning(true)
      setFsWarningCountdown(5)

      if (attemptId) {
        api.post('/quizzes/violation', {
          attemptId,
          violationType: 'fullscreen-exit',
          details: 'Student exited fullscreen during exam'
        }).catch(() => {})
      }

      if (warningTimerRef.current) clearInterval(warningTimerRef.current)
      warningTimerRef.current = setInterval(() => {
        setFsWarningCountdown(prev => {
          if (prev <= 1) {
            clearInterval(warningTimerRef.current)
            setFsWarning(false)
            doAutoSubmit('fullscreen-exit', 'Student did not return to fullscreen within 5s grace period')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      // User successfully returned to fullscreen
      if (warningTimerRef.current) {
        clearInterval(warningTimerRef.current)
        warningTimerRef.current = null
      }
      setFsWarning(false)
    }
  }, [phase, mode, isMockTest, attemptId, doAutoSubmit])

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [handleFsChange])

  // Standard exam timers
  useEffect(() => {
    if (phase !== 'playing' || mode === 'practice' || timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          toast('Time is up! Submitting exam…', { icon: '⏰' })
          doSubmit(attemptId)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, mode, timeLeft, attemptId])

  // Background sync for offlineCached answers
  useEffect(() => {
    const offlineKeys = Object.keys(offlineAnswers)
    if (offlineKeys.length === 0) return

    const syncInterval = setInterval(() => {
      offlineKeys.forEach(async (qid) => {
        const item = offlineAnswers[qid]
        if (item && item.retriesLeft >= 0) {
          try {
            await api.post('/quizzes/answer', {
              attemptId,
              questionId: qid,
              selectedOption: item.option,
              timeTakenSeconds: item.timeTaken
            })
            // Remove sync item
            setOfflineAnswers(prev => {
              const copy = { ...prev }
              delete copy[qid]
              return copy
            })
            toast.success('Connection restored. Answers synced!', { id: 'sync-success' })
          } catch {
            setOfflineAnswers(prev => {
              if (!prev[qid]) return prev
              return {
                ...prev,
                [qid]: { ...prev[qid], retriesLeft: prev[qid].retriesLeft - 1 }
              }
            })
          }
        }
      })
    }, 5000)

    return () => clearInterval(syncInterval)
  }, [offlineAnswers, attemptId])

  // Fullscreen helper trigger
  const requestFullscreenAndStart = async () => {
    if (!confirmCheckbox) {
      toast.error('Please accept the integrity terms before beginning.')
      return
    }
    
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen()
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen()
      }
      
      // Fullscreen active, now update phase and start API call
      setShowConfirmModal(false)
      await executeStartFlow()
    } catch (err) {
      console.error('Fullscreen access denied:', err)
      setPhase('fullscreen-denied')
    }
  }

  const handleStartBtnClick = () => {
    const isExam = mode === 'exam' || isMockTest
    if (isExam) {
      setShowConfirmModal(true)
    } else {
      executeStartFlow()
    }
  }

  const executeStartFlow = async () => {
    setPhase('loading')
    try {
      let data
      if (isMockTest) {
        const r = await api.post(`/mock-tests/${mockTestId}/start`)
        data = r.data
      } else {
        const r = await api.post('/ai/topic-quiz/start', { subject, chapter, mode, limit })
        data = r.data
      }

      setQuestions(data.data.questions)
      const currentAttemptId = data.data.attemptId
      setAttemptId(currentAttemptId)
      
      const duration = isMockTest ? data.data.duration * 60 : data.data.questions.length * 90
      setTimeLeft(duration)

      // Sync backend saved answers
      const loadedAnswers = {}
      if (data.data.answers) {
        data.data.answers.forEach(a => {
          if (a.selectedOption) loadedAnswers[a.questionId] = a.selectedOption
        })
      }

      // Check localStorage backup
      const localBackup = localStorage.getItem(`exam_answers_${currentAttemptId}`)
      if (localBackup) {
        try {
          const parsed = JSON.parse(localBackup)
          Object.assign(loadedAnswers, parsed)
        } catch {}
      }

      setAnswers(loadedAnswers)
      setPhase('playing')
      setVisited({ [data.data.questions[0]?._id]: true })
      qStartRef.current = Date.now()

      if (!isMockTest) toast.success(`Quiz initialized successfully. Lock in!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start. Please retry.')
      setPhase('instructions')
    }
  }

  const selectAnswer = async (option) => {
    const q = questions[current]
    const timeTaken = Math.round((Date.now() - qStartRef.current) / 1000)
    
    // Save locally
    setAnswers(prev => {
      const updated = { ...prev, [q._id]: option }
      localStorage.setItem(`exam_answers_${attemptId}`, JSON.stringify(updated))
      return updated
    })
    qStartRef.current = Date.now()

    // Send to backend with retry failsafe
    setSaving(true)
    try {
      await api.post('/quizzes/answer', {
        attemptId,
        questionId: q._id,
        selectedOption: option,
        timeTakenSeconds: timeTaken
      })
    } catch (err) {
      console.warn('Network issue saving answer. Caching offline...', err)
      setOfflineAnswers(prev => ({
        ...prev,
        [q._id]: { option, timeTaken, retriesLeft: 3 }
      }))
      toast.error('Network disconnect detected. Answer cached locally.', { id: 'network-warn' })
    } finally {
      setSaving(false)
    }
  }

  const doSubmit = useCallback(async (aid) => {
    const id = aid || attemptId
    if (!id) return
    setPhase('submitting')
    clearInterval(timerRef.current)
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    
    try {
      // Synchronize any remaining offline cached answers first
      const offlineKeys = Object.keys(offlineAnswers)
      if (offlineKeys.length > 0) {
        const finalAnswersList = Object.entries(answers).map(([qid, val]) => ({
          questionId: qid,
          selectedOption: val,
          timeTakenSeconds: 0
        }))
        await api.post('/quizzes/auto-submit', { attemptId: id, answers: finalAnswersList })
      } else {
        await api.post('/quizzes/submit', { attemptId: id })
      }

      localStorage.removeItem(`exam_answers_${id}`)
      navigate(`/quiz/result/${id}`, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
      setPhase('playing')
    }
  }, [attemptId, offlineAnswers, answers, navigate])

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
      if (isB) {
        await api.delete(`/bookmarks/question/${qid}`)
        setBookmarks(p => p.filter(x => x !== qid))
      } else {
        await api.post(`/bookmarks/question/${qid}`)
        setBookmarks(p => [...p, qid])
      }
      toast.success(isB ? 'Bookmark removed' : 'Bookmarked!')
    } catch {
      toast.error('Failed to update bookmark')
    }
  }

  const resumeFullscreen = async () => {
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen()
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen()
      }
      setFsWarning(false)
    } catch {
      toast.error('Could not activate fullscreen. Please retry.')
    }
  }

  const isLowTime = timeLeft < 120
  const answeredCount = Object.keys(answers).length
  const flaggedCount  = Object.values(flagged).filter(Boolean).length

  // ─── FULLSCREEN DENIED ───────────────────────────────────────
  if (phase === 'fullscreen-denied') {
    return (
      <div style={{ minHeight: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="fade-up" style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', maxWidth: 500, width: '100%', padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <ShieldAlert size={32} color="#ef4444" />
          </div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 10px' }}>Fullscreen Required</h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, margin: '0 0 28px' }}>
            This exam utilizes browser locking to secure the assessment environment. Fullscreen permission was denied or exited. Please grant permission to start the exam.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setPhase('instructions')} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
              Back
            </button>
            <button onClick={requestFullscreenAndStart} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 850, cursor: 'pointer', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.25)' }}>
              Retry Fullscreen
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── INSTRUCTIONS ───────────────────────────────────────────
  if (phase === 'instructions') {
    const isPractice = mode === 'practice'
    const isExam = mode === 'exam' || isMockTest

    return (
      <div style={{ minHeight: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        
        {/* Rules Confirmation Overlay Modal */}
        {showConfirmModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
          }}>
            <div className="fade-up" style={{
              background: 'white', borderRadius: 24, padding: 32,
              maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0', textAlign: 'center'
            }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShieldAlert size={28} color="#ef4444" />
              </div>
              
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>Security Confirmation</h2>
              <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.4, margin: '0 0 20px' }}>
                Please review and accept the strict Exam Integrity Shield terms to start your assessment.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, textAlign: 'left' }}>
                {[
                  { t: 'Mandatory Fullscreen', d: 'The exam starts only in fullscreen. Exiting fullscreen prompts a 5s countdown warning before auto-submitting.' },
                  { t: 'Zero Tab/Window Switching', d: 'Switching browser tabs, minimizing the screen, or clicking out will immediately submit your exam.' },
                  { t: 'Audit Violation Logging', d: 'Violations and timings are securely recorded in the database and audit logs for supervisor review.' }
                ].map((rule, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#ef4444', fontWeight: 900, fontSize: 12, paddingTop: 1 }}>⚠️</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{rule.t}</div>
                      <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1, lineHeight: 1.35 }}>{rule.d}</div>
                    </div>
                  </div>
                ))}
              </div>

              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 20, userSelect: 'none', background: '#fef2f2', border: '1px dashed #fca5a5', padding: 10, borderRadius: 10, textAlign: 'left' }}>
                <input 
                  type="checkbox" 
                  checked={confirmCheckbox} 
                  onChange={e => setConfirmCheckbox(e.target.checked)} 
                  style={{ width: 16, height: 16, borderRadius: 4, accentColor: '#ef4444', marginTop: 1, flexShrink: 0 }} 
                />
                <span style={{ fontSize: 11, color: '#991b1b', fontWeight: 700, lineHeight: 1.4 }}>
                  I understand the guidelines and acknowledge that tab switches or exits will result in immediate automatic test submission.
                </span>
              </label>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowConfirmModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button 
                  onClick={requestFullscreenAndStart} 
                  disabled={!confirmCheckbox} 
                  style={{ 
                    flex: 2, padding: '12px', 
                    background: confirmCheckbox ? 'linear-gradient(135deg, #ef4444, #dc2626)' : '#cbd5e1', 
                    color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 900, 
                    cursor: confirmCheckbox ? 'pointer' : 'not-allowed',
                    boxShadow: confirmCheckbox ? '0 8px 16px rgba(239, 68, 68, 0.2)' : 'none'
                  }}
                >
                  Confirm & Enter Fullscreen
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', maxWidth: 640, width: '100%', overflow: 'hidden' }}>
          
          {/* Header Banner */}
          <div style={{ background: isExam ? 'linear-gradient(135deg, #ef4444, #991b1b)' : isPractice ? 'linear-gradient(135deg, #10b981, #047857)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '40px 32px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 150, height: 150, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: 12, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
              {isExam ? <ShieldAlert size={14} /> : isPractice ? <Lightbulb size={14} /> : <Target size={14} />}
              {isMockTest ? 'Mock Test' : `${mode} Mode`}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{isMockTest ? 'Mock Test' : subject}</h1>
            <p style={{ fontSize: 15, opacity: 0.9, margin: 0, fontWeight: 500 }}>
              {isMockTest ? 'Read the instructions carefully before starting.' : `${chapter} · ${limit} AI-Generated Questions`}
            </p>
          </div>

          <div style={{ padding: 32 }}>
            
            {/* Resume Exam Banner */}
            {activeAttempt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#fffbeb', borderRadius: 16, border: '1px solid #fcd34d', marginBottom: 20 }}>
                <Clock size={20} style={{ color: '#d97706', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#92400e', margin: '0 0 2px' }}>Active Exam Resume</h4>
                  <p style={{ fontSize: 11, color: '#b45309', margin: 0, lineHeight: 1.4 }}>You have an incomplete attempt. Resuming will load your cached questions and answers.</p>
                </div>
              </div>
            )}

            {!isMockTest && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'linear-gradient(to right, #eff6ff, #f8fafc)', borderRadius: 16, border: '1px solid #bfdbfe', marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, background: '#3b82f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1e3a8a', margin: '0 0 2px' }}>AI-Powered Generation</h4>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.4 }}>Questions are generated in real-time by Gemini specifically for this topic to ensure no repetition.</p>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { l: 'Questions', v: isMockTest ? '—' : limit, icon: Target },
                { l: 'Duration',  v: isPractice ? 'No limit' : isMockTest ? '3 hrs' : `${limit * 1.5} min`, icon: Clock },
                { l: 'Marking',   v: isPractice ? '+4 / 0' : '+4 / -1', icon: CheckCircle2 },
              ].map(s => (
                <div key={s.l} style={{ background: '#f8fafc', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <s.icon size={18} color="#94a3b8" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{s.v}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rules & Instructions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(isPractice
                  ? ['No timer — take your time on each question.', 'Answers are saved automatically.', 'You can bookmark questions for revision.', 'Navigate freely between questions.']
                  : isExam
                  ? ['Fullscreen mode is required throughout the exam.', 'Switching tabs or minimizing ends the test immediately.', 'Timer begins as soon as you start — no pauses.', 'All answers are auto-saved. Submit when done.', 'Negative marking applies: +4 correct, -1 wrong.']
                  : ['Timer starts immediately after you begin.', 'Navigate freely — all answers are auto-saved.', 'You can flag questions and revisit them.', 'Submit when you are ready or when time runs out.']
                ).map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#3b82f6', fontSize: 11, fontWeight: 800 }}>{i + 1}</div>
                    <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.5, paddingTop: 2 }}>{r}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={() => navigate(-1)} style={{ padding: '16px 24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, fontSize: 14, fontWeight: 800, color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>
                Go Back
              </button>
              <button onClick={handleStartBtnClick} style={{ flex: 1, padding: '16px 24px', background: isExam ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #3b82f6, #4f46e5)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: isExam ? '0 8px 24px rgba(239,68,68,0.3)' : '0 8px 24px rgba(59,130,246,0.3)', transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {!isMockTest && <Sparkles size={18} />}
                {activeAttempt ? 'Resume Exam' : isMockTest ? 'Start Mock Test' : 'Generate & Start'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── LOADING ─────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div style={{ minHeight: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ width: 64, height: 64, position: 'relative', margin: '0 auto' }}>
            <div style={{ position: 'absolute', inset: 0, border: '4px solid #e2e8f0', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            {phase === 'loading' && <BrainCircuit size={24} color="#3b82f6" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>{phase === 'loading' ? 'Generating Questions...' : 'Submitting Answers...'}</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{phase === 'loading' ? 'AI is crafting fresh questions just for you.' : 'Calculating your results.'}</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── ENTERING FULLSCREEN ─────────────────────────────────────
  if (phase === 'entering-fullscreen') {
    return (
      <div style={{ minHeight: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ width: 64, height: 64, position: 'relative', margin: '0 auto' }}>
            <div style={{ position: 'absolute', inset: 0, border: '4px solid #e2e8f0', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, border: '4px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <ShieldAlert size={24} color="#ef4444" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Entering Fullscreen Mode...</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Enforcing exam integrity rules.</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── EMPTY ───────────────────────────────────────────────────
  if (phase === 'playing' && questions.length === 0) {
    return (
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32, background: '#f8fafc' }}>
        <div style={{ width: 64, height: 64, background: '#fef2f2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={32} color="#ef4444" />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Generation Failed</h3>
        <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', maxWidth: 400, margin: 0, lineHeight: 1.5 }}>We couldn't generate questions for this topic at the moment. Please try again or choose a different chapter.</p>
        <button onClick={() => navigate('/quiz')} style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', borderRadius: 12, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
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
    <div style={{ display: 'flex', height: '100%', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>
      
      {/* Exited Fullscreen Warnings overlay */}
      {fsWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)',
        }}>
          <div className="fade-up" style={{
            background: 'white', borderRadius: 24, padding: 36,
            maxWidth: 440, width: '100%', textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '2px solid #ef4444'
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShieldAlert size={32} color="#ef4444" />
            </div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: '#1e293b', margin: '0 0 8px' }}>Integrity Breach Alert</h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, margin: '0 0 24px' }}>
              Exiting fullscreen violates the integrity policy. You must return to fullscreen in <span style={{ color: '#ef4444', fontWeight: 900 }}>{fsWarningCountdown} seconds</span> or your exam will auto-submit.
            </p>
            <button onClick={resumeFullscreen} style={{
              width: '100%', padding: '14px', background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.4)'
            }}>
              Re-enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isMockTest ? 'Mock Test' : `${subject} · ${chapter}`}</p>
            <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Q{current + 1}/{questions.length}</span>
              <span style={{ width: 4, height: 4, background: '#cbd5e1', borderRadius: '50%' }} />
              <span>{answeredCount} answered</span>
              <span style={{ width: 4, height: 4, background: '#cbd5e1', borderRadius: '50%' }} />
              <span>{flaggedCount} flagged</span>
              {saving && <span style={{ color: '#3b82f6', animation: 'pulse 1s infinite' }}>saving…</span>}
              {Object.keys(offlineAnswers).length > 0 && <span style={{ color: '#ef4444', fontWeight: 700 }}>({Object.keys(offlineAnswers).length} local cache pending)</span>}
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'none', '@media (minWidth: 640px)': { display: 'block' }, width: 140, height: 6, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: 10, transition: 'width 0.3s ease', width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>

          {/* Timer */}
          {mode !== 'practice' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 900, flexShrink: 0, background: isLowTime ? '#ef4444' : '#f8fafc', color: isLowTime ? '#fff' : '#0f172a', boxShadow: isLowTime ? '0 4px 12px rgba(239,68,68,0.3)' : 'none', transform: isLowTime ? 'scale(1.05)' : 'none', transition: 'all 0.3s', fontVariantNumeric: 'tabular-nums' }}>
              <Clock size={16} />
              {fmt(timeLeft)}
            </div>
          )}
        </div>

        {/* Question area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>

            {/* Question card */}
            <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', padding: 32, marginBottom: 24 }}>
              
              {/* Tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', fontSize: 10, fontWeight: 800, borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{q.subject}</span>
                <span style={{ padding: '4px 10px', background: '#f8fafc', color: '#64748b', fontSize: 10, fontWeight: 800, borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{q.chapter}</span>
                {q.difficulty && (
                  <span style={{ padding: '4px 10px', fontSize: 10, fontWeight: 800, borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em', ...(q.difficulty === 'hard' ? { background: '#fef2f2', color: '#dc2626' } : q.difficulty === 'medium' ? { background: '#fffbeb', color: '#d97706' } : { background: '#ecfdf5', color: '#059669' }) }}>{q.difficulty}</span>
                )}
                
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button onClick={toggleFlag} title="Flag for review" style={{ padding: 8, borderRadius: 10, border: '1px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', ...(isFlagged ? { background: '#f59e0b', borderColor: '#f59e0b', color: '#fff' } : { background: '#fff', borderColor: '#e2e8f0', color: '#94a3b8' }) }}>
                    <Flag size={16} />
                  </button>
                  <button onClick={() => toggleBookmark(q._id)} title="Bookmark" style={{ padding: 8, borderRadius: 10, border: '1px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', ...(bookmarks.includes(q._id) ? { background: '#3b82f6', borderColor: '#3b82f6', color: '#fff' } : { background: '#fff', borderColor: '#e2e8f0', color: '#94a3b8' }) }}>
                    <BookOpen size={16} />
                  </button>
                </div>
              </div>

              {/* Question text */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 900, flexShrink: 0, boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}>
                  {current + 1}
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.6, paddingTop: 6 }}>{q.question}</p>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {q.options ? Object.entries(q.options).map(([key, val]) => {
                  const isSelected = answered === key
                  return (
                    <button key={key} onClick={() => selectAnswer(key)} style={{
                      width: '100%', textAlign: 'left', padding: '16px 20px', borderRadius: 16, border: `2px solid ${isSelected ? '#3b82f6' : '#f1f5f9'}`,
                      background: isSelected ? '#3b82f6' : '#fff', color: isSelected ? '#fff' : '#334155',
                      display: 'flex', alignItems: 'center', gap: 16, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s', boxShadow: isSelected ? '0 8px 20px rgba(59,130,246,0.2)' : '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => { if(!isSelected) e.currentTarget.style.borderColor = '#bfdbfe' }}
                    onMouseLeave={e => { if(!isSelected) e.currentTarget.style.borderColor = '#f1f5f9' }}
                    >
                      <span style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0, ...(isSelected ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: '#f8fafc', color: '#64748b' }) }}>
                        {key}
                      </span>
                      <span style={{ flex: 1, lineHeight: 1.5 }}>{val}</span>
                      {isSelected && <CheckCircle2 size={20} color="rgba(255,255,255,0.9)" style={{ flexShrink: 0 }} />}
                    </button>
                  )
                }) : null}
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => goTo(current - 1)} disabled={current === 0} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, fontSize: 14, fontWeight: 800, color: '#475569', cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.5 : 1, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <ChevronLeft size={18} /> Previous
              </button>

              <button onClick={toggleFlag} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 800, border: `1px solid ${isFlagged ? '#f59e0b' : '#fde68a'}`, background: isFlagged ? '#f59e0b' : '#fffbeb', color: isFlagged ? '#fff' : '#d97706', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Flag size={16} /> {isFlagged ? 'Flagged' : 'Flag Question'}
              </button>

              {current < questions.length - 1 ? (
                <button onClick={() => goTo(current + 1)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6, #4f46e5)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, color: '#fff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button onClick={() => doSubmit()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 900, color: '#fff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                  <Send size={16} /> Submit Test
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Question Palette ── */}
      {showPanel && (
        <div style={{ display: 'flex', flexDirection: 'column', width: 320, background: '#fff', borderLeft: '1px solid #f1f5f9', flexShrink: 0, boxShadow: '-4px 0 24px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: '0 0 16px' }}>Question Palette</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 4, background: Q_STATUS.answered.bg }} /> <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Answered</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 4, background: Q_STATUS.flagged.bg }} /> <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Flagged</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 4, background: Q_STATUS.visited.bg }} /> <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Visited</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 4, background: Q_STATUS.unanswered.bg, border: '1px solid #e2e8f0' }} /> <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Not Visited</span></div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {questions.map((ques, idx) => {
                const s = getQStatus(idx)
                return (
                  <button key={ques._id} onClick={() => goTo(idx)} style={{
                    aspectRatio: '1/1', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                    background: s.bg, color: s.text, border: `2px solid ${s.border}`,
                    boxShadow: s.ring ? s.ring : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stats & Submit */}
          <div style={{ padding: 24, borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Answered</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#3b82f6' }}>{answeredCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Flagged</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#f59e0b' }}>{flaggedCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Remaining</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{questions.length - answeredCount}</span>
              </div>
            </div>

            <button onClick={() => doSubmit()} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <Send size={18} /> Submit Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
