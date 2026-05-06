import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Atom, Beaker, Calculator, Dna, Sparkles, Clock, Trophy,
  ChevronRight, Play, Zap, Target, Lock, CheckCircle2,
  BarChart2, BookOpen, ArrowRight, RefreshCw
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

// ─── Subject config ───────────────────────────────────────────
const SUBJECTS = [
  {
    id: 'Physics', icon: Atom, color: '#3b82f6',
    grad: 'from-blue-500 to-indigo-600', lightBg: 'bg-blue-50',
    chapters: [
      'Kinematics', 'Laws of Motion', 'Work Energy Power', 'Gravitation',
      'Thermodynamics', 'Wave Optics', 'Electrostatics', 'Current Electricity',
      'Magnetism', 'Modern Physics',
    ],
  },
  {
    id: 'Chemistry', icon: Beaker, color: '#10b981',
    grad: 'from-emerald-500 to-teal-600', lightBg: 'bg-emerald-50',
    chapters: [
      'Atomic Structure', 'Chemical Bonding', 'States of Matter', 'Thermodynamics',
      'Equilibrium', 'Electrochemistry', 'Organic Chemistry', 'Hydrocarbons',
      'p-Block Elements', 'Coordination Compounds',
    ],
  },
  {
    id: 'Mathematics', icon: Calculator, color: '#f59e0b',
    grad: 'from-amber-500 to-orange-500', lightBg: 'bg-amber-50',
    chapters: [
      'Sets & Relations', 'Complex Numbers', 'Matrices', 'Calculus',
      'Differential Equations', 'Vectors', 'Probability', 'Statistics',
      'Trigonometry', 'Coordinate Geometry',
    ],
  },
  {
    id: 'Biology', icon: Dna, color: '#ef4444',
    grad: 'from-rose-500 to-pink-600', lightBg: 'bg-rose-50',
    chapters: [
      'Cell Biology', 'Genetics & Heredity', 'Molecular Biology', 'Human Physiology',
      'Plant Physiology', 'Reproduction', 'Ecology', 'Biotechnology',
      'Evolution', 'Microbes in Human Welfare',
    ],
  },
]

const MODES = [
  { id: 'practice', icon: BookOpen, label: 'Practice', desc: 'No timer · See hints', color: 'emerald', border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-300' },
  { id: 'test', icon: Target, label: 'Test', desc: 'Timed · Standard', color: 'blue', border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-300' },
  { id: 'exam', icon: Zap, label: 'Exam', desc: 'Strict · Anti-cheat', color: 'rose', border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-300' },
]

const LIMITS = [5, 10, 15, 20]

// ─── Mock Test Card ───────────────────────────────────────────
function MockTestCard({ mt, navigate }) {
  const isUpcoming = mt.status === 'upcoming'
  const isActive   = mt.status === 'active'
  const isDone     = mt.status === 'completed' || mt.userAttempted

  const statusStyles = {
    active:    { dot: 'bg-emerald-500 animate-pulse', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'LIVE' },
    upcoming:  { dot: 'bg-amber-400',                  badge: 'bg-amber-50 text-amber-700 border-amber-200',   label: 'UPCOMING' },
    completed: { dot: 'bg-slate-400',                  badge: 'bg-slate-100 text-slate-500 border-slate-200',  label: 'ENDED' },
  }
  const s = statusStyles[mt.status] || statusStyles.completed

  return (
    <div className={`bg-white rounded-2xl border-2 p-5 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 flex flex-col group ${isActive ? 'border-violet-300 shadow-lg shadow-violet-100' : 'border-slate-100'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${s.dot}`} />
          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${s.badge}`}>{s.label}</span>
        </div>
        <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{mt.exam || 'JEE/NEET'}</span>
      </div>

      {/* Title */}
      <h3 className="font-black text-slate-900 text-sm mb-2 group-hover:text-violet-700 transition-colors leading-snug">{mt.title}</h3>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 mb-4">
        <span className="flex items-center gap-1"><Clock size={11} /> {mt.duration || 180} min</span>
        <span className="flex items-center gap-1"><Target size={11} /> {mt.questions?.length || mt.totalQuestions || '—'} Qs</span>
        {mt.startTime && <span className="flex items-center gap-1"><Zap size={11} /> {new Date(mt.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
      </div>

      {/* Attempts badge */}
      {mt.attempts > 0 && (
        <div className="mb-4 p-2.5 bg-slate-50 rounded-xl flex items-center gap-2">
          <BarChart2 size={13} className="text-slate-400" />
          <span className="text-[11px] text-slate-500">{mt.attempts} attempts · Avg {mt.avgScore ?? '—'}%</span>
        </div>
      )}

      <div className="mt-auto">
        {isDone ? (
          <button onClick={() => navigate(`/mock-test/leaderboard/${mt._id}`)}
            className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
            <Trophy size={13} /> View Leaderboard
          </button>
        ) : isUpcoming ? (
          <button disabled className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2">
            <Lock size={13} /> Starts Soon
          </button>
        ) : (
          <button onClick={() => navigate(`/quiz/mock/${mt._id}`)}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-black hover:scale-[1.02] transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2">
            <Play size={13} /> Join Test
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function QuizSelectionPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('practice')          // 'practice' | 'mock'
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedChapter, setSelectedChapter] = useState('')
  const [selectedMode, setSelectedMode]       = useState('practice')
  const [questionLimit, setQuestionLimit]     = useState(10)
  const [mockTests, setMockTests]             = useState([])
  const [mtLoading, setMtLoading]             = useState(true)

  useEffect(() => {
    api.get('/mock-tests')
      .then(r => setMockTests(r.data.data || []))
      .catch(() => {})
      .finally(() => setMtLoading(false))
  }, [])

  const sub = SUBJECTS.find(s => s.id === selectedSubject)
  const canStart = selectedSubject && selectedChapter

  const handleStart = () => {
    if (!canStart) { toast.error('Please select subject and chapter'); return }
    navigate(`/quiz/${selectedSubject}/${selectedChapter}?mode=${selectedMode}&limit=${questionLimit}`)
  }

  const liveMocks     = mockTests.filter(m => m.status === 'active')
  const upcomingMocks = mockTests.filter(m => m.status === 'upcoming')
  const pastMocks     = mockTests.filter(m => m.status === 'completed' || m.userAttempted)

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-8">

        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute right-12 bottom-4 w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-yellow-300" />
              <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">Quiz & Mock Test Center</span>
            </div>
            <h1 className="text-3xl font-black mb-2">Ready to test yourself?</h1>
            <p className="text-blue-200 text-sm">Practice by topic or join a live mock test — earn XP and climb the leaderboard.</p>
            <div className="flex gap-4 mt-6">
              {[
                { l: 'Live Tests', v: liveMocks.length, c: 'bg-emerald-400/20 text-emerald-200' },
                { l: 'Upcoming', v: upcomingMocks.length, c: 'bg-amber-400/20 text-amber-200' },
                { l: 'Questions', v: '10,000+', c: 'bg-violet-400/20 text-violet-200' },
              ].map(s => (
                <div key={s.l} className={`px-4 py-2 rounded-xl ${s.c} backdrop-blur-sm`}>
                  <p className="text-lg font-black">{s.v}</p>
                  <p className="text-[11px] font-bold opacity-80">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit">
          {[['practice', BookOpen, 'Practice Quiz'], ['mock', Zap, 'Mock Tests']].map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === id ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* ── PRACTICE TAB ── */}
        {tab === 'practice' && (
          <div className="space-y-6">
            {/* Step 1 – Subject */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-black">1</span>
                Choose Subject
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {SUBJECTS.map(s => (
                  <button key={s.id} onClick={() => { setSelectedSubject(s.id); setSelectedChapter('') }}
                    className={`p-5 rounded-2xl border-2 text-center transition-all hover:scale-[1.02] group
                      ${selectedSubject === s.id ? `bg-gradient-to-br ${s.grad} border-transparent shadow-xl` : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white hover:shadow-md'}`}>
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-md ${selectedSubject === s.id ? 'bg-white/20' : s.lightBg}`}>
                      <s.icon size={24} className={selectedSubject === s.id ? 'text-white' : ''} style={{ color: selectedSubject === s.id ? 'white' : s.color }} />
                    </div>
                    <p className={`font-black text-sm ${selectedSubject === s.id ? 'text-white' : 'text-slate-800'}`}>{s.id}</p>
                    <p className={`text-[10px] mt-0.5 font-semibold ${selectedSubject === s.id ? 'text-white/70' : 'text-slate-400'}`}>{s.chapters.length} chapters</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 – Chapter */}
            {selectedSubject && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-black">2</span>
                  Choose Chapter
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {sub.chapters.map(ch => (
                    <button key={ch} onClick={() => setSelectedChapter(ch)}
                      className={`py-3 px-3 rounded-xl border-2 text-xs font-bold transition-all text-left leading-snug
                        ${selectedChapter === ch ? `bg-gradient-to-br ${sub.grad} text-white border-transparent shadow-lg` : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'}`}>
                      {ch}
                      {selectedChapter === ch && <CheckCircle2 size={12} className="mt-1 text-white/80" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 – Mode & Settings */}
            {selectedChapter && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-black">3</span>
                  Select Mode
                </p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {MODES.map(m => (
                    <button key={m.id} onClick={() => setSelectedMode(m.id)}
                      className={`p-4 rounded-2xl border-2 text-center transition-all
                        ${selectedMode === m.id ? `${m.bg} ${m.border} ring-4 ${m.ring} ring-opacity-30 shadow-lg` : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'}`}>
                      <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center ${selectedMode === m.id ? m.bg : 'bg-slate-100'}`}>
                        <m.icon size={20} className={selectedMode === m.id ? m.text : 'text-slate-400'} />
                      </div>
                      <p className={`font-black text-sm ${selectedMode === m.id ? m.text : 'text-slate-700'}`}>{m.label}</p>
                      <p className={`text-[10px] mt-0.5 ${selectedMode === m.id ? m.text + ' opacity-70' : 'text-slate-400'}`}>{m.desc}</p>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Number of Questions</p>
                <div className="flex gap-3 mb-6">
                  {LIMITS.map(n => (
                    <button key={n} onClick={() => setQuestionLimit(n)}
                      className={`w-14 h-10 rounded-xl border-2 font-black text-sm transition-all
                        ${questionLimit === n ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25' : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'}`}>
                      {n}
                    </button>
                  ))}
                </div>

                {/* Start button */}
                <button onClick={handleStart}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl font-black text-base shadow-xl shadow-blue-500/25 hover:scale-[1.01] hover:shadow-2xl transition-all flex items-center justify-center gap-3">
                  <Play size={20} />
                  Start {selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} — {questionLimit} Questions
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {!selectedSubject && (
              <div className="text-center py-8 text-slate-400 text-sm font-medium">
                ↑ Select a subject to get started
              </div>
            )}
          </div>
        )}

        {/* ── MOCK TESTS TAB ── */}
        {tab === 'mock' && (
          <div className="space-y-8">
            {mtLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[0,1,2].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded-lg w-24" />
                    <div className="h-5 bg-slate-100 rounded-lg w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                    <div className="h-10 bg-slate-100 rounded-xl mt-4" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Live */}
                {liveMocks.length > 0 && (
                  <div>
                    <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Live Now
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {liveMocks.map(mt => <MockTestCard key={mt._id} mt={mt} navigate={navigate} />)}
                    </div>
                  </div>
                )}

                {/* Upcoming */}
                {upcomingMocks.length > 0 && (
                  <div>
                    <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2"><Clock size={16} className="text-amber-500" /> Upcoming</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {upcomingMocks.map(mt => <MockTestCard key={mt._id} mt={mt} navigate={navigate} />)}
                    </div>
                  </div>
                )}

                {/* Past */}
                {pastMocks.length > 0 && (
                  <div>
                    <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2"><Trophy size={16} className="text-violet-500" /> Past Tests</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {pastMocks.map(mt => <MockTestCard key={mt._id} mt={mt} navigate={navigate} />)}
                    </div>
                  </div>
                )}

                {mockTests.length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                    <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Zap size={28} className="text-violet-400" />
                    </div>
                    <h3 className="font-black text-slate-900 mb-2">No Mock Tests Yet</h3>
                    <p className="text-sm text-slate-400">Ask your admin to schedule a mock test. Check back soon!</p>
                    <button onClick={() => { setMtLoading(true); api.get('/mock-tests').then(r => setMockTests(r.data.data || [])).catch(() => {}).finally(() => setMtLoading(false)) }}
                      className="mt-4 px-5 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-1.5 mx-auto">
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
