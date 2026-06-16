import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Settings, X, CheckCircle2, Flame, Clock, Volume2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

const MODES = [
  { 
    id: 'work',       
    label: 'Focus Session', 
    duration: 25, 
    grad: 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #9f1239 100%)',   
    glow: 'rgba(225, 29, 72, 0.4)',
    ring: '#f43f5e', 
    icon: Brain 
  },
  { 
    id: 'short',      
    label: 'Short Break', 
    duration: 5,  
    grad: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)', 
    glow: 'rgba(5, 150, 105, 0.4)',
    ring: '#10b981', 
    icon: Coffee 
  },
  { 
    id: 'long',       
    label: 'Long Break',  
    duration: 15, 
    grad: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)',  
    glow: 'rgba(37, 99, 235, 0.4)',
    ring: '#3b82f6', 
    icon: Coffee 
  },
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
  
  .pomo-root * { box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; }
  .pomo-display { font-family: 'Outfit', sans-serif; }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes pulseGlow {
    0%, 100% { transform: scale(1); opacity: 0.2; }
    50% { transform: scale(1.08); opacity: 0.35; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .pomo-float { animation: float 6s ease-in-out infinite; }
  .pomo-pulse-glow { animation: pulseGlow 3s ease-in-out infinite; }
  .pomo-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .pomo-spin { animation: spin 1s linear infinite; }

  .pomo-glass-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 24px;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04), 
                0 1px 1px rgba(0, 0, 0, 0.02);
  }

  .pomo-mode-btn {
    padding: 10px 18px;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pomo-ctrl-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .pomo-ctrl-btn:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
  .pomo-ctrl-btn:active {
    transform: translateY(0) scale(0.98);
  }

  .pomo-preset-btn {
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  /* Custom Scrollbar for session log */
  .pomo-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .pomo-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .pomo-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .pomo-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`

export default function PomodoroPage() {
  const [modeIdx, setModeIdx] = useState(0)
  const [customWork, setCustomWork] = useState(25)
  const [customShort, setCustomShort] = useState(5)
  const [customLong, setCustomLong] = useState(15)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [totalFocusMin, setTotalFocusMin] = useState(0)
  const [sessionLog, setSessionLog] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [sound, setSound] = useState('bell')
  const [autoStart, setAutoStart] = useState(false)
  const intervalRef = useRef(null)
  const startedAtRef = useRef(null)

  const mode = MODES[modeIdx]
  const durations = [customWork, customShort, customLong]
  const totalSec = durations[modeIdx] * 60
  const progress = ((totalSec - timeLeft) / totalSec) * 100
  const circumference = 2 * Math.PI * 110

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const playSound = useCallback(() => {
    if (sound === 'none') return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.8)
    } catch {}
  }, [sound])

  const handleComplete = useCallback(() => {
    setRunning(false)
    clearInterval(intervalRef.current)
    playSound()

    if (modeIdx === 0) {
      const focusMin = durations[0]
      setSessions(s => s + 1)
      setTotalFocusMin(t => t + focusMin)
      setSessionLog(prev => [{
        type: 'work', duration: focusMin, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }, ...prev.slice(0, 9)])
      toast.success(`🎉 Focus session done! +${focusMin}m`)
      // Auto switch: every 4 sessions → long break
      const nextSessions = sessions + 1
      if (nextSessions % 4 === 0) {
        setModeIdx(2)
        setTimeLeft(customLong * 60)
        if (autoStart) setTimeout(() => setRunning(true), 1000)
      } else {
        setModeIdx(1)
        setTimeLeft(customShort * 60)
        if (autoStart) setTimeout(() => setRunning(true), 1000)
      }
    } else {
      toast.success('Break finished! Ready to lock in? 💪')
      setSessionLog(prev => [{
        type: 'break', duration: durations[modeIdx], time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }, ...prev.slice(0, 9)])
      setModeIdx(0)
      setTimeLeft(customWork * 60)
      if (autoStart) setTimeout(() => setRunning(true), 1000)
    }
  }, [modeIdx, sessions, durations, autoStart, customWork, customShort, customLong, playSound])

  useEffect(() => {
    if (running) {
      startedAtRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { handleComplete(); return 0 }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, handleComplete])

  // Update title
  useEffect(() => {
    document.title = running ? `${fmt(timeLeft)} — ${mode.label} | StudyIndia` : 'Pomodoro | StudyIndia'
    return () => { document.title = 'StudyIndia' }
  }, [timeLeft, running, mode.label])

  const switchMode = (idx) => {
    setModeIdx(idx)
    setRunning(false)
    setTimeLeft(durations[idx] * 60)
  }

  const reset = () => { setRunning(false); setTimeLeft(durations[modeIdx] * 60) }

  const skip = () => handleComplete()

  return (
    <div className="pomo-root" style={{ minHeight: '100%', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)', padding: '32px 16px' }}>
      <style>{css}</style>
      
      <div className="pomo-slide-up" style={{ maxWidth: 650, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Top bar with settings */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="pomo-display" style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Pomodoro Timer</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>Supercharge your study sessions with structured intervals</p>
          </div>
          <button 
            onClick={() => setShowSettings(true)} 
            style={{ 
              background: 'white', border: '1px solid #e2e8f0', color: '#334155', 
              padding: 10, borderRadius: 14, cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Mode switcher tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 18, padding: 6, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          {MODES.map((m, i) => {
            const Icon = m.icon
            const active = modeIdx === i
            return (
              <button 
                key={m.id} 
                onClick={() => switchMode(i)}
                className="pomo-mode-btn"
                style={{
                  flex: 1,
                  background: active ? m.grad : 'transparent',
                  color: active ? 'white' : '#64748b',
                  boxShadow: active ? `0 8px 24px -6px ${m.glow}` : 'none',
                  justifyContent: 'center'
                }}
              >
                <Icon size={14} />
                <span>{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* Main interactive timer card */}
        <div style={{ 
          background: mode.grad, 
          borderRadius: 32, 
          padding: '44px 32px', 
          color: 'white', 
          position: 'relative', 
          overflow: 'hidden', 
          boxShadow: `0 30px 60px -15px ${mode.glow}`,
          transition: 'background 0.5s ease, box-shadow 0.5s ease'
        }}>
          {/* Animated decorative glow blobs */}
          <div className="pomo-pulse-glow" style={{ 
            position: 'absolute', top: '-20%', right: '-10%', 
            width: 280, height: 280, borderRadius: '50%', 
            background: 'rgba(255, 255, 255, 0.08)', filter: 'blur(40px)', 
            pointerEvents: 'none' 
          }} />
          <div className="pomo-pulse-glow" style={{ 
            position: 'absolute', bottom: '-20%', left: '-10%', 
            width: 220, height: 220, borderRadius: '50%', 
            background: 'rgba(255, 255, 255, 0.05)', filter: 'blur(30px)', 
            pointerEvents: 'none',
            animationDelay: '1.5s'
          }} />

          {/* SVG ring & counter */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              
              {/* Outer pulsing ring for aesthetic enhancement */}
              {running && (
                <div style={{ 
                  position: 'absolute', width: 250, height: 250, borderRadius: '50%', 
                  border: '1px solid rgba(255,255,255,0.12)',
                  transform: 'scale(1)',
                  boxShadow: '0 0 40px rgba(255, 255, 255, 0.08)',
                  animation: 'pulse-ring 2s infinite'
                }} />
              )}

              <svg width="260" height="260" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track circle */}
                <circle cx="130" cy="130" r="110" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                {/* Progress circle */}
                <circle 
                  cx="130" 
                  cy="130" 
                  r="110" 
                  fill="none"
                  stroke="white" 
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.4s' }}
                />
              </svg>

              {/* Central text display */}
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="pomo-display" style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {fmt(timeLeft)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {running ? 'Keep going!' : 'Paused'}
                </div>

                {/* Micro dots indicating focus cycles */}
                {sessions > 0 && (
                  <div style={{ display: 'flex', gap: 5, marginTop: 12, background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: 20 }}>
                    {Array.from({ length: Math.min(sessions, 4) }).map((_, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.8)' }} />
                    ))}
                    {sessions > 4 && (
                      <span style={{ fontSize: 8, fontWeight: 900, color: 'white', display: 'inline-block', alignSelf: 'center' }}>+{sessions - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Premium Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 32 }}>
              
              <button 
                onClick={reset} 
                className="pomo-ctrl-btn"
                title="Reset timer"
                style={{ 
                  width: 48, height: 48, 
                  background: 'rgba(255,255,255,0.12)', 
                  color: 'white'
                }}
              >
                <RotateCcw size={18} />
              </button>

              <button 
                onClick={() => setRunning(!running)}
                className="pomo-ctrl-btn"
                style={{ 
                  width: 76, height: 76, 
                  background: 'white', 
                  color: mode.ring,
                  borderRadius: 24,
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)'
                }}
              >
                {running ? <Pause size={30} fill={mode.ring} stroke="none" /> : <Play size={30} fill={mode.ring} stroke="none" style={{ marginLeft: 4 }} />}
              </button>

              <button 
                onClick={skip} 
                className="pomo-ctrl-btn"
                title="Skip to next session"
                style={{ 
                  width: 48, height: 48, 
                  background: 'rgba(255,255,255,0.12)', 
                  color: 'white'
                }}
              >
                <SkipForward size={18} />
              </button>

            </div>
          </div>
        </div>

        {/* High-fidelity Statistics row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { l: 'Sessions Done', v: sessions, icon: CheckCircle2, bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
            { l: 'Focus Hours', v: `${(totalFocusMin / 60).toFixed(1)}h`, icon: Clock, bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
            { l: 'Streak 🔥', v: `${Math.floor(sessions / 4)} cycles`, icon: Flame, bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
          ].map(s => (
            <div 
              key={s.l} 
              className="pomo-glass-card" 
              style={{ 
                padding: '18px 14px', 
                textAlign: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                background: 'white',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 10, background: s.bg, color: s.text, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <s.icon size={16} />
              </div>
              <p className="pomo-display" style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>{s.v}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* History log & Guide (Two column layout on larger viewports) */}
        <div style={{ display: 'grid', gridTemplateColumns: sessionLog.length > 0 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr', gap: 16 }}>
          
          {/* History */}
          {sessionLog.length > 0 && (
            <div className="pomo-glass-card" style={{ padding: 22, background: 'white', border: '1px solid #e2e8f0' }}>
              <h3 className="pomo-display" style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📅 Focus History</span>
              </h3>
              <div className="pomo-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                {sessionLog.map((s, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10, 
                      padding: '10px 14px', 
                      borderRadius: 12, 
                      background: s.type === 'work' ? '#fff1f2' : '#f0fdf4',
                      border: s.type === 'work' ? '1px solid #ffe4e6' : '1px solid #dcfce7',
                      fontSize: 12 
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{s.type === 'work' ? '🎯' : '☕'}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 800, color: s.type === 'work' ? '#be123c' : '#15803d' }}>
                        {s.type === 'work' ? 'Focus Block' : 'Relax Period'}
                      </span>
                      <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{s.duration} minutes completed</span>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#64748b' }}>{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guide Card */}
          <div className="pomo-glass-card" style={{ padding: 22, background: 'white', border: '1px solid #e2e8f0' }}>
            <h3 className="pomo-display" style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>💡 How it Works</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { n: '1', t: 'Focus deeply for 25 minutes (no phone, no browser tab switching).' },
                { n: '2', t: 'Take a short 5-minute break to stretch, grab water, or rest.' },
                { n: '3', t: 'Repeat this loop 4 times, then take a longer 15-minute break.' }
              ].map(item => (
                <div key={item.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: 20, height: 20, borderRadius: '50%', 
                    background: '#f1f5f9', color: '#475569', 
                    fontSize: 10, fontWeight: 900, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>{item.n}</div>
                  <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>{item.t}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div 
          style={{ 
            position: 'fixed', inset: 0, zIndex: 100, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            padding: 16, background: 'rgba(15, 23, 42, 0.4)', 
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div 
            className="pomo-glass-card pomo-slide-up" 
            style={{ 
              width: '100%', maxWidth: 440, padding: 28, 
              background: 'white', border: '1px solid #e2e8f0', 
              boxShadow: '0 30px 60px rgba(15,23,42,0.15)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 className="pomo-display" style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Settings</h3>
              <button 
                onClick={() => setShowSettings(false)} 
                style={{ 
                  background: '#f1f5f9', border: 'none', color: '#64748b', 
                  width: 32, height: 32, borderRadius: '50%', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Presets setup */}
              {[
                { l: '🎯 Focus Block Duration', val: customWork, set: setCustomWork, color: '#e11d48', bg: '#ffe4e6' },
                { l: '☕ Short Break Duration', val: customShort, set: setCustomShort, color: '#059669', bg: '#dcfce7' },
                { l: '🌴 Long Break Duration', val: customLong, set: setCustomLong, color: '#2563eb', bg: '#dbeafe' },
              ].map(s => (
                <div key={s.l}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{s.l}</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[5, 10, 15, 20, 25, 30, 45, 60].map(v => {
                      const selected = s.val === v
                      return (
                        <button 
                          key={v} 
                          onClick={() => { s.set(v); setRunning(false); setTimeLeft(v * 60) }}
                          className="pomo-preset-btn"
                          style={{
                            borderColor: selected ? s.color : '#e2e8f0',
                            background: selected ? s.bg : 'white',
                            color: selected ? s.color : '#475569',
                          }}
                        >
                          {v}m
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Sound Alerts */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>🔊 Alert Sound</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'bell', l: '🔔 Electronic Bell' },
                    { id: 'none', l: '🔇 Silent' },
                  ].map(item => {
                    const selected = sound === item.id
                    return (
                      <button 
                        key={item.id} 
                        onClick={() => setSound(item.id)}
                        className="pomo-preset-btn"
                        style={{
                          flex: 1,
                          borderColor: selected ? '#6366f1' : '#e2e8f0',
                          background: selected ? '#e0e7ff' : 'white',
                          color: selected ? '#4f46e5' : '#475569',
                        }}
                      >
                        {item.l}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Toggle Option */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: '#f8fafc', padding: 14, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <input 
                  type="checkbox" 
                  checked={autoStart} 
                  onChange={e => setAutoStart(e.target.checked)} 
                  style={{ width: 18, height: 18, borderRadius: 6, accentColor: '#4f46e5', cursor: 'pointer' }} 
                />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', margin: 0 }}>Auto-start intervals</p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>Automatically switch between study and break blocks</p>
                </div>
              </label>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
