import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, Timer } from 'lucide-react'
import toast from 'react-hot-toast'

const TIMERS = [15, 25, 45, 60]

export default function FocusModePage() {
  const [selectedTimer, setSelectedTimer] = useState(25)
  const [running, setRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [violations, setViolations] = useState(0)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [windowBlurs, setWindowBlurs] = useState(0)
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const startTimeRef = useRef(null)
  const intervalRef = useRef(null)

  const totalSeconds = selectedTimer * 60
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100
  const focusScore = Math.max(0, 100 - (tabSwitches + windowBlurs) * 10)
  const circumference = 2 * Math.PI * 100

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleViolation = useCallback((type) => {
    if (!running) return
    if (type === 'tab') setTabSwitches(v => v + 1)
    if (type === 'blur') setWindowBlurs(v => v + 1)
    setViolations(v => v + 1)
    toast.error('⚠️ Focus violation! Stay on task.', { id: 'violation' })
  }, [running])

  useEffect(() => {
    const onVis = () => { if (document.hidden) handleViolation('tab') }
    const onBlur = () => handleViolation('blur')
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
    }
  }, [handleViolation])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { clearInterval(intervalRef.current); setRunning(false); setCompleted(true); return 0 }
          return s - 1
        })
      }, 1000)
    } else { clearInterval(intervalRef.current) }
    return () => clearInterval(intervalRef.current)
  }, [running])

  useEffect(() => {
    if (completed) {
      const mins = Math.round((Date.now() - startTimeRef.current) / 60000)
      api.post('/sessions/focus', { timerDuration: selectedTimer, actualDuration: mins, tabSwitches, windowBlurs, violations, completed: true })
        .then(({ data }) => toast.success(`🎉 Session complete! +${data.xpGained} XP`))
        .catch(() => {})
    }
  }, [completed])

  const startSession = () => {
    setStarted(true); setRunning(true); startTimeRef.current = Date.now()
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {})
  }

  const reset = () => {
    setRunning(false); setStarted(false); setCompleted(false)
    setSecondsLeft(selectedTimer * 60); setViolations(0); setTabSwitches(0); setWindowBlurs(0)
    if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen()
  }

  const focusColor = focusScore >= 80 ? '#059669' : focusScore >= 50 ? '#d97706' : '#dc2626'
  const focusBg    = focusScore >= 80 ? '#f0fdf4' : focusScore >= 50 ? '#fffbeb' : '#fef2f2'
  const progressColor = completed ? '#059669' : running ? '#4f46e5' : '#94a3b8'

  return (
    <div style={{ padding: 32, maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>Focus Mode</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Build deep work habits, one session at a time</p>
      </div>

      {/* Timer picker */}
      {!started && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {TIMERS.map(t => (
            <button key={t} onClick={() => { setSelectedTimer(t); setSecondsLeft(t * 60) }}
              className="btn"
              style={{
                background: selectedTimer === t ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#ffffff',
                color: selectedTimer === t ? 'white' : '#64748b',
                border: `1.5px solid ${selectedTimer === t ? 'transparent' : '#e2e8f0'}`,
                boxShadow: selectedTimer === t ? '0 2px 12px rgba(79,70,229,0.35)' : '0 1px 3px rgba(0,0,0,0.05)',
                padding: '8px 20px', fontWeight: 700, fontSize: 14,
              }}>
              {t}m
            </button>
          ))}
        </div>
      )}

      {/* Circular Timer */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer glow when running */}
        {running && (
          <div style={{
            position: 'absolute', width: 270, height: 270, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)',
          }} />
        )}

        <svg width="250" height="250" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="125" cy="125" r="100" fill="none" stroke="#f1f5f9" strokeWidth="10" />
          {/* Progress */}
          <circle cx="125" cy="125" r="100"
            fill="none"
            stroke={progressColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
          />
        </svg>

        {/* Center text */}
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          {completed ? (
            <>
              <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>Done!</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(secondsLeft)}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{selectedTimer} min session</div>
              {started && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 99, marginTop: 8,
                  background: running ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${running ? '#86efac' : '#fde68a'}`,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: running ? '#10b981' : '#f59e0b', animation: running ? 'pulse-ring 2s infinite' : 'none' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: running ? '#059669' : '#d97706' }}>
                    {running ? 'RUNNING' : 'PAUSED'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats (during session) */}
      {started && (
        <div className="card" style={{ padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 32, width: '100%', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: tabSwitches > 0 ? '#dc2626' : '#94a3b8' }}>{tabSwitches}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Tab Switches</div>
          </div>
          <div style={{ width: 1, height: 36, background: '#e2e8f0' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: windowBlurs > 0 ? '#d97706' : '#94a3b8' }}>{windowBlurs}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Window Blurs</div>
          </div>
          <div style={{ width: 1, height: 36, background: '#e2e8f0' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: focusColor }}>{focusScore}%</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Focus Score</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10 }}>
        {!started ? (
          <button onClick={startSession} className="btn btn-primary btn-lg">
            <Play size={18} /> Start Session
          </button>
        ) : completed ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#059669', marginBottom: 12 }}>🎉 Session Complete!</div>
            <button onClick={reset} className="btn btn-secondary">
              <RotateCcw size={15} /> New Session
            </button>
          </div>
        ) : (
          <>
            <button onClick={() => setRunning(r => !r)} className="btn btn-primary">
              {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Resume</>}
            </button>
            <button onClick={reset} className="btn btn-secondary">
              <RotateCcw size={14} /> Reset
            </button>
          </>
        )}
      </div>

      {/* Violation warning */}
      {violations > 0 && (
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', borderLeft: '4px solid #ef4444', borderRadius: 12 }}>
          <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{violations} focus violation{violations > 1 ? 's' : ''} detected</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Your focus score has been reduced. Stay on this tab.</div>
          </div>
        </div>
      )}
    </div>
  )
}
