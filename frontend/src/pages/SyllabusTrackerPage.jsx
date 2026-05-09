import { useState, useEffect } from 'react'
import { BookOpen, CheckCircle2, Clock, RotateCcw, Star, ChevronDown, ChevronUp, Target, TrendingUp, Circle, Loader2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']

const STATUS_CONFIG = {
  'not-started': { label: 'Not Started', color: 'bg-slate-100 text-slate-400 border-slate-200', dot: 'bg-slate-300', ring: '' },
  'reading':     { label: 'In Progress', color: 'bg-amber-50 text-amber-600 border-amber-200',  dot: 'bg-amber-400', ring: 'ring-2 ring-amber-200' },
  'done':        { label: 'Done',        color: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500', ring: 'ring-2 ring-emerald-200' },
  'revision':    { label: 'Revision',    color: 'bg-blue-50 text-blue-600 border-blue-200',     dot: 'bg-blue-500', ring: 'ring-2 ring-blue-200' },
}

const SUBJECT_GRADIENT = {
  Physics:     'from-blue-600 to-cyan-600',
  Chemistry:   'from-emerald-600 to-teal-600',
  Mathematics: 'from-violet-600 to-purple-600',
  Biology:     'from-amber-500 to-orange-600',
}

const SUBJECT_ACCENT = {
  Physics:     'bg-blue-500',
  Chemistry:   'bg-emerald-500',
  Mathematics: 'bg-violet-500',
  Biology:     'bg-amber-500',
}

export default function SyllabusTrackerPage() {
  const [activeSubject, setActiveSubject] = useState('Physics')
  const [syllabusData, setSyllabusData] = useState({})
  const [stats, setStats]   = useState({})
  const [overall, setOverall] = useState({ total: 0, done: 0, pct: 0 })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})
  const [expandedChapter, setExpandedChapter] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [syllRes, statsRes] = await Promise.all([
        api.get('/syllabus'),
        api.get('/syllabus/stats'),
      ])
      setSyllabusData(syllRes.data.data || {})
      setStats(statsRes.data.data || {})
      setOverall(statsRes.data.overall || { total: 0, done: 0, pct: 0 })
    } catch { toast.error('Failed to load syllabus') }
    finally { setLoading(false) }
  }

  const updateChapter = async (subject, chapter, patch) => {
    const key = `${subject}:${chapter}`
    setUpdating(p => ({ ...p, [key]: true }))
    try {
      await api.patch('/syllabus', { subject, chapter, ...patch })
      setSyllabusData(prev => {
        const updated = { ...prev }
        updated[subject] = updated[subject].map(c =>
          c.chapter === chapter ? { ...c, ...patch } : c
        )
        return updated
      })
      // Update stats locally
      const sub = syllabusData[subject] || []
      const updatedSub = sub.map(c => c.chapter === chapter ? { ...c, ...patch } : c)
      const done   = updatedSub.filter(c => c.status === 'done').length
      const revision = updatedSub.filter(c => c.status === 'revision').length
      const reading  = updatedSub.filter(c => c.status === 'reading').length
      const total  = updatedSub.length
      setStats(p => ({ ...p, [subject]: { total, done, revision, reading, notStarted: total - done - revision - reading, pct: Math.round(((done + revision) / total) * 100) } }))
    } catch { toast.error('Failed to update') }
    finally { setUpdating(p => ({ ...p, [key]: false })) }
  }

  const cycleStatus = (subject, chapter, current) => {
    const ORDER = ['not-started', 'reading', 'done', 'revision']
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
    updateChapter(subject, chapter, { status: next })
  }

  const chapters = syllabusData[activeSubject] || []
  const subStats = stats[activeSubject] || { total: 0, done: 0, revision: 0, reading: 0, pct: 0 }

  if (loading) return (
    <div className="min-h-full flex items-center justify-center bg-[#f8fafc]">
      <Loader2 size={32} className="animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">

        {/* Hero */}
        <div className={`bg-gradient-to-br ${SUBJECT_GRADIENT[activeSubject]} rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden`}>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} className="text-white/60" />
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Syllabus Tracker</span>
          </div>
          <h1 className="text-3xl font-black mb-2">JEE / NEET Syllabus</h1>

          {/* Overall progress */}
          <div className="mb-5">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-bold text-white/70">Overall Completion</span>
              <span className="text-sm font-black">{overall.pct}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${overall.pct}%` }} />
            </div>
            <p className="text-xs text-white/50 mt-1">{overall.done} of {overall.total} chapters completed</p>
          </div>

          {/* Subject mini-stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUBJECTS.map(sub => {
              const s = stats[sub] || { pct: 0, done: 0, total: 0 }
              return (
                <button key={sub} onClick={() => setActiveSubject(sub)}
                  className={`text-left p-3 rounded-2xl transition-all ${activeSubject === sub ? 'bg-white/25 ring-2 ring-white/40' : 'bg-white/10 hover:bg-white/15'}`}>
                  <p className="text-[10px] font-bold text-white/60 mb-1">{sub}</p>
                  <p className="text-xl font-black">{s.pct}%</p>
                  <p className="text-[9px] text-white/50">{s.done + (s.revision || 0)}/{s.total} done</p>
                  <div className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Subject tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 shadow-sm rounded-2xl p-1.5">
          {SUBJECTS.map(sub => (
            <button key={sub} onClick={() => setActiveSubject(sub)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${activeSubject === sub ? `${SUBJECT_ACCENT[sub]} text-white shadow-md` : 'text-slate-400 hover:text-slate-700'}`}>
              {sub}
            </button>
          ))}
        </div>

        {/* Chapter stats bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Done', value: subStats.done, color: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
            { label: 'Revision', value: subStats.revision || 0, color: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
            { label: 'In Progress', value: subStats.reading || 0, color: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
            { label: 'Remaining', value: subStats.notStarted || subStats.total - subStats.done, color: 'bg-slate-50 text-slate-600 border-slate-100', dot: 'bg-slate-300' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl border ${s.color} p-3 text-center`}>
              <div className={`w-2 h-2 rounded-full ${s.dot} mx-auto mb-2`} />
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-[10px] font-bold opacity-70">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Chapter list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm">{activeSubject} — {chapters.length} Chapters</h3>
            <span className="text-xs font-bold text-slate-400">{subStats.pct}% complete</span>
          </div>

          <div className="divide-y divide-slate-50">
            {chapters.map((ch, idx) => {
              const cfg = STATUS_CONFIG[ch.status] || STATUS_CONFIG['not-started']
              const key = `${activeSubject}:${ch.chapter}`
              const isUpdating = updating[key]
              const isExpanded = expandedChapter === key

              return (
                <div key={ch.chapter} className={`group transition-all ${isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50/50'}`}>
                  <div className="flex items-center gap-4 px-6 py-3.5">
                    {/* Chapter number */}
                    <span className="text-xs font-black text-slate-300 w-5 text-right flex-shrink-0">{idx + 1}</span>

                    {/* Status toggle button */}
                    <button onClick={() => cycleStatus(activeSubject, ch.chapter, ch.status)} disabled={isUpdating}
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${cfg.dot} ${isUpdating ? 'opacity-40' : 'hover:scale-110'}`}>
                      {isUpdating
                        ? <Loader2 size={12} className="text-white animate-spin" />
                        : ch.status === 'done' ? <CheckCircle2 size={14} className="text-white" />
                        : ch.status === 'revision' ? <RotateCcw size={12} className="text-white" />
                        : ch.status === 'reading' ? <Clock size={12} className="text-white" />
                        : <Circle size={14} className="text-white/60" />
                      }
                    </button>

                    {/* Chapter name */}
                    <p className={`flex-1 text-sm font-semibold transition-all ${ch.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {ch.chapter}
                    </p>

                    {/* Confidence stars */}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => updateChapter(activeSubject, ch.chapter, { confidence: s })}
                          className="transition-transform hover:scale-125">
                          <Star size={12} className={s <= ch.confidence ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                        </button>
                      ))}
                    </div>

                    {/* Status badge */}
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded border ${cfg.color} flex-shrink-0`}>
                      {cfg.label}
                    </span>

                    {/* Expand */}
                    <button onClick={() => setExpandedChapter(isExpanded ? null : key)}
                      className="p-1 text-slate-300 hover:text-slate-600 transition-colors">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Expanded: quick note + status picker */}
                  {isExpanded && (
                    <div className="px-6 pb-4 space-y-3 animate-in slide-in-from-top-1 duration-200">
                      <div className="flex gap-2">
                        {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                          <button key={s} onClick={() => { updateChapter(activeSubject, ch.chapter, { status: s }); setExpandedChapter(null) }}
                            className={`px-3 py-1.5 text-[10px] font-black rounded-xl border transition-all hover:scale-105 ${ch.status === s ? cfg.color + ' scale-105' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                            {cfg.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">Confidence:</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => (
                            <button key={s} onClick={() => updateChapter(activeSubject, ch.chapter, { confidence: s })}>
                              <Star size={16} className={s <= ch.confidence ? 'text-amber-400 fill-amber-400' : 'text-slate-200 hover:text-amber-300'} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center py-2">
          <p className="text-xs text-slate-400 font-semibold w-full text-center">Click the circle to cycle status → In Progress → Done → Revision</p>
          {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
            <div key={s} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
