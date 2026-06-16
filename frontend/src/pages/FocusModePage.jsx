import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, Timer, Maximize, ShieldAlert, Award, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const TIMERS = [15, 25, 45, 60]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
  
  .focus-root * { box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; }
  .focus-display { font-family: 'Outfit', sans-serif; }

  @keyframes breathingGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.15); transform: scale(1); }
    50% { box-shadow: 0 0 40px rgba(79, 70, 229, 0.35); transform: scale(1.03); }
  }
  @keyframes alertPulse {
    0%, 100% { background: rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.2); }
    50% { background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.4); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .focus-breathing { animation: breathingGlow 4s ease-in-out infinite; }
  .focus-alert-pulse { animation: alertPulse 2s infinite; }
  .focus-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .focus-spin { animation: spin 1s linear infinite; }

  .focus-glass-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 24px;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.02);
  }

  .focus-preset-btn {
    padding: 10px 22px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 800;
    border: 2px solid #e2e8f0;
    cursor: pointer;
    background: white;
    color: #475569;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .focus-preset-btn:hover {
    border-color: #6366f1;
    color: #4f46e5;
    transform: translateY(-1px);
  }

  .focus-action-btn {
    padding: 12px 28px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .focus-stat-tile {
    flex: 1;
    text-align: center;
    padding: 16px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  }
`

export default function FocusModePage() {
  const [selectedTimer, setSelectedTimer] = useState(25)
  const [running, setRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [violations, setViolations] = useState(0)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [windowBlurs, setWindowBlurs] = useState(0)
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
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
      const mins = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000))
      api.post('/sessions/focus', { timerDuration: selectedTimer, actualDuration: mins, tabSwitches, windowBlurs, violations, completed: true })
        .then(({ data }) => {
          setXpEarned(data.xpGained || 50)
          toast.success(`🎉 Session complete! +${data.xpGained || 50} XP`)
        })
        .catch(() => {
          setXpEarned(50) // Fallback reward display
        })
    }
  }, [completed])

  const startSession = () => {
    setStarted(true); setRunning(true); startTimeRef.current = Date.now()
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {})
  }

  const reset = () => {
    setRunning(false); setStarted(false); setCompleted(false); setXpEarned(0)
    setSecondsLeft(selectedTimer * 60); setViolations(0); setTabSwitches(0); setWindowBlurs(0)
    if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen()
  }

  const focusColor = focusScore >= 80 ? '#059669' : focusScore >= 50 ? '#d97706' : '#dc2626'
  const focusBg    = focusScore >= 80 ? '#ecfdf5' : focusScore >= 50 ? '#fffbeb' : '#fef2f2'
  const progressColor = completed ? '#059669' : running ? '#4f46e5' : '#94a3b8'

  return (
    <div className="focus-root" style={{ minHeight: '100%', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)', padding: '32px 16px' }}>
      <style>{css}</style>

      <div className="focus-slide-up" style={{ maxWidth: 620, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h1 className="focus-display" style={{ fontSize: 24, fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Focus Lock Mode</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>Lock into distraction-free study blocks. Switching windows triggers alert flags.</p>
        </div>

        {/* Timer Presets Selection */}
        {!started && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {TIMERS.map(t => {
              const active = selectedTimer === t
              return (
                <button 
                  key={t} 
                  onClick={() => { setSelectedTimer(t); setSecondsLeft(t * 60) }}
                  className="focus-preset-btn"
                  style={{
                    borderColor: active ? '#4f46e5' : '#e2e8f0',
                    background: active ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'white',
                    color: active ? 'white' : '#64748b',
                    boxShadow: active ? '0 10px 20px -6px rgba(79, 70, 229, 0.4)' : 'none'
                  }}
                >
                  {t} Minutes
                </button>
              )
            })}
          </div>
        )}

        {/* Circular Timer Display */}
        <div 
          className="focus-glass-card" 
          style={{ 
            width: '100%', 
            padding: '44px 24px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'white',
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Soft breathing pulse underlay during active state */}
            {running && (
              <div 
                className="focus-breathing"
                style={{
                  position: 'absolute', 
                  width: 220, 
                  height: 220, 
                  borderRadius: '50%',
                  zIndex: 0
                }} 
              />
            )}

            <svg width="240" height="240" style={{ transform: 'rotate(-90deg)', zIndex: 1 }}>
              {/* Background circle track */}
              <circle cx="120" cy="120" r="100" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              {/* Animated Foreground circle */}
              <circle 
                cx="120" 
                cy="120" 
                r="100"
                fill="none"
                stroke={progressColor}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (progress / 100) * circumference}
                strokeLinecap="round"
                style={{ transition: running ? 'stroke-dashoffset 1s linear, stroke 0.5s' : 'stroke-dashoffset 0.4s, stroke 0.5s' }}
              />
            </svg>

            {/* Central elements */}
            <div style={{ position: 'absolute', textAlign: 'center', zIndex: 2 }}>
              {completed ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <CheckCircle2 size={24} color="#059669" />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#059669' }}>LOCKED IN!</div>
                </div>
              ) : (
                <>
                  <div className="focus-display" style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {formatTime(secondsLeft)}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {selectedTimer}m Target
                  </div>

                  {started && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 20, marginTop: 12,
                      background: running ? '#ecfdf5' : '#fffbeb',
                      border: `1px solid ${running ? '#a7f3d0' : '#fde68a'}`,
                    }}>
                      <div className={running ? 'focus-spin' : ''} style={{ 
                        width: 6, height: 6, borderRadius: '50%', 
                        background: running ? '#10b981' : '#f59e0b' 
                      }} />
                      <span style={{ fontSize: 9, fontWeight: 800, color: running ? '#059669' : '#d97706', letterSpacing: '0.02em' }}>
                        {running ? 'LOCKED' : 'PAUSED'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Interactive Statistics Grid (Shown during active session) */}
          {started && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 440, marginTop: 32 }}>
              
              <div className="focus-stat-tile">
                <div style={{ fontSize: 20, fontWeight: 900, color: tabSwitches > 0 ? '#ef4444' : '#64748b' }}>
                  {tabSwitches}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginTop: 4, textTransform: 'uppercase' }}>Tab Switches</div>
              </div>

              <div className="focus-stat-tile">
                <div style={{ fontSize: 20, fontWeight: 900, color: windowBlurs > 0 ? '#f59e0b' : '#64748b' }}>
                  {windowBlurs}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginTop: 4, textTransform: 'uppercase' }}>Window Blurs</div>
              </div>

              <div className="focus-stat-tile" style={{ background: focusBg, borderColor: focusColor + '20' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: focusColor }}>
                  {focusScore}%
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginTop: 4, textTransform: 'uppercase' }}>Focus Score</div>
              </div>

            </div>
          )}

          {/* Warning banner when violations are live */}
          {violations > 0 && !completed && (
            <div 
              className="focus-alert-pulse" 
              style={{ 
                display: 'flex', alignItems: 'center', gap: 10, 
                padding: '12px 16px', borderRadius: 14, 
                width: '100%', maxWidth: 440, marginTop: 16,
                border: '1px solid',
                transition: 'all 0.3s'
              }}
            >
              <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0 }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#991b1b' }}>{violations} focus violation{violations > 1 ? 's' : ''} logged</div>
                <div style={{ fontSize: 10, color: '#b91c1c', marginTop: 1, fontWeight: 500 }}>Switching screens degrades focus scores and diminishes final XP gains.</div>
              </div>
            </div>
          )}

          {/* XP Reward card when completed */}
          {completed && (
            <div style={{ 
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '1px solid #fcd34d',
              padding: '16px 20px',
              borderRadius: 18,
              width: '100%',
              maxWidth: 440,
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              animation: 'slideUp 0.35s ease'
            }}>
              <Award size={24} color="#d97706" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#78350f' }}>Focus Session Completed!</div>
                <div style={{ fontSize: 11, color: '#d97706', fontWeight: 700, marginTop: 1 }}>Efficacy Score: {focusScore}% · Awarded +{xpEarned} XP</div>
              </div>
            </div>
          )}

        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 10 }}>
          {!started ? (
            <button 
              onClick={startSession} 
              className="focus-action-btn"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.4)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Maximize size={16} />
              <span>Lock Screen & Start</span>
            </button>
          ) : completed ? (
            <button 
              onClick={reset} 
              className="focus-action-btn"
              style={{
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1'
              }}
            >
              <RotateCcw size={14} />
              <span>Configure New Session</span>
            </button>
          ) : (
            <>
              <button 
                onClick={() => setRunning(r => !r)} 
                className="focus-action-btn"
                style={{
                  background: running ? '#f1f5f9' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: running ? '#334155' : 'white',
                  border: running ? '1px solid #cbd5e1' : 'none',
                  boxShadow: running ? 'none' : '0 8px 20px -4px rgba(79, 70, 229, 0.4)'
                }}
              >
                {running ? (
                  <>
                    <Pause size={14} />
                    <span>Pause Session</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Resume Focus</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={reset} 
                className="focus-action-btn"
                style={{
                  background: '#f1f5f9',
                  color: '#ef4444',
                  border: '1px solid #fca5a5'
                }}
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </>
          )}
        </div>

      </div>

    </div>
  )
}
