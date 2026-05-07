import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Settings, X, CheckCircle2, Flame, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const MODES = [
  { id: 'work',       label: 'Focus',       duration: 25, color: 'from-rose-500 to-pink-600',   ring: '#f43f5e', icon: Brain },
  { id: 'short',      label: 'Short Break', duration: 5,  color: 'from-emerald-500 to-teal-600', ring: '#10b981', icon: Coffee },
  { id: 'long',       label: 'Long Break',  duration: 15, color: 'from-blue-500 to-indigo-600',  ring: '#3b82f6', icon: Coffee },
]

const SOUNDS = {
  bell:   { label: '🔔 Bell',   url: 'https://www.soundjay.com/buttons/sounds/button-09.mp3' },
  soft:   { label: '🎵 Soft',   url: null },
  none:   { label: '🔇 Silent', url: null },
}

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
      toast.success(`🎉 Focus session done! +${focusMin}min`)
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
      toast.success('Break done! Time to focus 💪')
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
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">

        {/* Mode tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
          {MODES.map((m, i) => (
            <button key={m.id} onClick={() => switchMode(i)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${modeIdx === i ? `bg-gradient-to-r ${m.color} text-white shadow-md` : 'text-slate-400 hover:text-slate-700'}`}>
              <m.icon size={13} /> {m.label}
            </button>
          ))}
        </div>

        {/* Main timer card */}
        <div className={`bg-gradient-to-br ${mode.color} rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden`}>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full" />

          {/* Settings button */}
          <button onClick={() => setShowSettings(true)} className="absolute top-5 right-5 p-2 bg-white/15 rounded-xl hover:bg-white/25 transition-all">
            <Settings size={16} />
          </button>

          {/* SVG Ring timer */}
          <div className="flex flex-col items-center relative">
            <svg width="260" height="260" className="rotate-[-90deg]">
              {/* Background ring */}
              <circle cx="130" cy="130" r="110" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12" />
              {/* Progress ring */}
              <circle cx="130" cy="130" r="110" fill="none"
                stroke="white" strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (progress / 100) * circumference}
                className="transition-all duration-1000"
              />
            </svg>

            {/* Time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-6xl font-black tabular-nums tracking-tight">{fmt(timeLeft)}</p>
              <p className="text-white/60 text-sm font-bold mt-1">{mode.label}</p>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-white rounded-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button onClick={reset} className="p-3 bg-white/15 rounded-2xl hover:bg-white/25 transition-all hover:scale-110">
              <RotateCcw size={20} />
            </button>
            <button onClick={() => setRunning(!running)}
              className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all"
              style={{ color: mode.ring }}>
              {running ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button onClick={skip} className="p-3 bg-white/15 rounded-2xl hover:bg-white/25 transition-all hover:scale-110">
              <SkipForward size={20} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: 'Sessions', v: sessions, icon: CheckCircle2, c: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { l: 'Focus Time', v: `${totalFocusMin}m`, icon: Clock, c: 'text-blue-600 bg-blue-50 border-blue-100' },
            { l: 'Streak 🔥', v: `${Math.floor(sessions / 4)} cycles`, icon: Flame, c: 'text-amber-600 bg-amber-50 border-amber-100' },
          ].map(s => (
            <div key={s.l} className={`bg-white rounded-2xl border p-4 text-center ${s.c}`}>
              <s.icon size={18} className="mx-auto mb-2" />
              <p className="text-xl font-black">{s.v}</p>
              <p className="text-[10px] font-bold opacity-60">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Session log */}
        {sessionLog.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-black text-slate-900 text-sm mb-3">Session History</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessionLog.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs ${s.type === 'work' ? 'bg-rose-50 border border-rose-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                  <span className="text-base">{s.type === 'work' ? '🧠' : '☕'}</span>
                  <span className="font-bold text-slate-700">{s.type === 'work' ? 'Focus' : 'Break'} — {s.duration}min</span>
                  <span className="ml-auto text-slate-400">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How-to */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-black text-slate-900 text-sm mb-3">Pomodoro Technique</h3>
          <div className="space-y-2">
            {['Work for 25 minutes with full focus', 'Take a 5-minute short break', 'After 4 sessions, take a 15-minute long break', 'Repeat — this maximizes productivity!'].map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-black flex items-center justify-center flex-shrink-0 text-[10px]">{i + 1}</span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-900">Timer Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-100 rounded-xl text-slate-400"><X size={16} /></button>
            </div>

            {[
              { l: 'Focus Duration (min)', val: customWork, set: setCustomWork },
              { l: 'Short Break (min)', val: customShort, set: setCustomShort },
              { l: 'Long Break (min)', val: customLong, set: setCustomLong },
            ].map(s => (
              <div key={s.l}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.l}</label>
                <div className="flex gap-2 mt-2">
                  {[5, 10, 15, 20, 25, 30, 45, 60].filter(v => v <= 60).map(v => (
                    <button key={v} onClick={() => { s.set(v); setRunning(false); setTimeLeft(v * 60) }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${s.val === v ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-200 text-slate-500'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alert Sound</label>
              <div className="flex gap-2 mt-2">
                {Object.entries(SOUNDS).map(([k, s]) => (
                  <button key={k} onClick={() => setSound(k)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${sound === k ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-200 text-slate-500'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={autoStart} onChange={e => setAutoStart(e.target.checked)} className="w-5 h-5 rounded" />
              <div>
                <p className="text-sm font-bold text-slate-700">Auto-start breaks</p>
                <p className="text-xs text-slate-400">Automatically start next session</p>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
