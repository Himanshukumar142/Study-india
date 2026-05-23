import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Atom, Beaker, Calculator, Dna, Sparkles, Clock, Trophy,
  Play, Zap, Target, Lock, CheckCircle2, BarChart2, BookOpen,
  ArrowRight, RefreshCw, ChevronRight, Layers
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SUBJECTS = [
  {
    id: 'Physics', icon: Atom, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe',
    grad: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
    chapters: ['Kinematics','Laws of Motion','Work Energy Power','Gravitation','Thermodynamics','Wave Optics','Electrostatics','Current Electricity','Magnetism','Modern Physics'],
  },
  {
    id: 'Chemistry', icon: Beaker, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0',
    grad: 'linear-gradient(135deg, #10b981, #0d9488)',
    chapters: ['Atomic Structure','Chemical Bonding','States of Matter','Thermodynamics','Equilibrium','Electrochemistry','Organic Chemistry','Hydrocarbons','p-Block Elements','Coordination Compounds'],
  },
  {
    id: 'Mathematics', icon: Calculator, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a',
    grad: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    chapters: ['Sets & Relations','Complex Numbers','Matrices','Calculus','Differential Equations','Vectors','Probability','Statistics','Trigonometry','Coordinate Geometry'],
  },
  {
    id: 'Biology', icon: Dna, color: '#ef4444', bg: '#fff1f2', border: '#fecdd3',
    grad: 'linear-gradient(135deg, #ef4444, #db2777)',
    chapters: ['Cell Biology','Genetics & Heredity','Molecular Biology','Human Physiology','Plant Physiology','Reproduction','Ecology','Biotechnology','Evolution','Microbes in Human Welfare'],
  },
]

const MODES = [
  { id: 'practice', icon: BookOpen, label: 'Practice', desc: 'No timer · See hints', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
  { id: 'test',     icon: Target,   label: 'Test',     desc: 'Timed · Standard',   color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
  { id: 'exam',     icon: Zap,      label: 'Exam',     desc: 'Strict · Anti-cheat', color: '#ef4444', bg: '#fff1f2', border: '#fca5a5' },
]

const LIMITS = [5, 10, 15, 20]

function MockTestCard({ mt, navigate }) {
  const isUpcoming = mt.status === 'upcoming'
  const isActive   = mt.status === 'active'
  const isDone     = mt.status === 'completed' || mt.userAttempted

  const statusConfig = {
    active:    { dot: '#10b981', badge: '#ecfdf5', badgeText: '#059669', badgeBorder: '#a7f3d0', label: '🔴 LIVE' },
    upcoming:  { dot: '#f59e0b', badge: '#fffbeb', badgeText: '#92400e', badgeBorder: '#fde68a', label: 'UPCOMING' },
    completed: { dot: '#94a3b8', badge: '#f8fafc', badgeText: '#64748b', badgeBorder: '#e2e8f0', label: 'ENDED' },
  }
  const s = statusConfig[mt.status] || statusConfig.completed

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: `2px solid ${isActive ? '#c4b5fd' : '#f1f5f9'}`,
      padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: isActive ? '0 4px 24px rgba(139,92,246,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, animation: isActive ? 'pulse 2s infinite' : 'none' }} />
          <span style={{ fontSize: 10, fontWeight: 800, background: s.badge, color: s.badgeText, border: `1px solid ${s.badgeBorder}`, padding: '2px 8px', borderRadius: 6 }}>{s.label}</span>
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8', background: '#f8fafc', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{mt.exam || 'JEE/NEET'}</span>
      </div>

      <div>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4, lineHeight: 1.4 }}>{mt.title}</h3>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {mt.duration || 180} min</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={11} /> {mt.questions?.length || mt.totalQuestions || '—'} Qs</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        {isDone ? (
          <button onClick={() => navigate(`/mock-test/leaderboard/${mt._id}`)} style={{ width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Trophy size={13} /> View Leaderboard
          </button>
        ) : isUpcoming ? (
          <button disabled style={{ width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#cbd5e1', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Lock size={13} /> Starts Soon
          </button>
        ) : (
          <button onClick={() => navigate(`/quiz/mock/${mt._id}`)} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            <Play size={13} /> Join Test
          </button>
        )}
      </div>
    </div>
  )
}

export default function QuizSelectionPage() {
  const navigate = useNavigate()
  const [tab, setTab]                     = useState('practice')
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedChapter, setSelectedChapter] = useState('')
  const [selectedMode, setSelectedMode]   = useState('practice')
  const [questionLimit, setQuestionLimit] = useState(10)
  const [mockTests, setMockTests]         = useState([])
  const [mtLoading, setMtLoading]         = useState(true)

  const loadMocks = () => {
    setMtLoading(true)
    api.get('/mock-tests').then(r => setMockTests(r.data.data || [])).catch(() => {}).finally(() => setMtLoading(false))
  }

  useEffect(() => { loadMocks() }, [])

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
    <div style={{ minHeight: '100%', background: '#f8fafc' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Hero ── */}
        <div style={{ background: 'linear-gradient(135deg, #1e40af, #4f46e5, #7c3aed)', borderRadius: 20, padding: '32px 32px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', right: 60, bottom: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Sparkles size={16} color="#fbbf24" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Quiz & Mock Test Center</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 6px' }}>Ready to test yourself?</h1>
            <p style={{ fontSize: 13, color: '#bfdbfe', margin: '0 0 20px' }}>Practice by topic or join a live mock test — earn XP and climb the leaderboard.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { l: 'Live Tests', v: liveMocks.length, bg: 'rgba(16,185,129,0.2)', c: '#6ee7b7' },
                { l: 'Upcoming',   v: upcomingMocks.length, bg: 'rgba(245,158,11,0.2)', c: '#fcd34d' },
                { l: 'Questions',  v: '10,000+', bg: 'rgba(167,139,250,0.2)', c: '#c4b5fd' },
              ].map(s => (
                <div key={s.l} style={{ background: s.bg, borderRadius: 12, padding: '10px 16px' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 6, width: 'fit-content', gap: 4 }}>
          {[['practice', BookOpen, 'Practice Quiz'], ['mock', Layers, 'Mock Tests']].map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 10,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
              background: tab === id ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : 'transparent',
              color: tab === id ? '#fff' : '#64748b',
              boxShadow: tab === id ? '0 4px 12px rgba(79,70,229,0.25)' : 'none',
            }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ── PRACTICE TAB ── */}
        {tab === 'practice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Step 1 – Subject */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>1</div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Choose Subject</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {SUBJECTS.map(s => {
                  const isSelected = selectedSubject === s.id
                  return (
                    <button key={s.id} onClick={() => { setSelectedSubject(s.id); setSelectedChapter('') }} style={{
                      padding: '18px 12px', borderRadius: 14, border: `2px solid ${isSelected ? 'transparent' : s.border}`,
                      background: isSelected ? s.grad : s.bg, cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.2s', transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isSelected ? `0 8px 24px ${s.color}40` : 'none',
                    }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'rgba(255,255,255,0.2)' : '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <s.icon size={22} color={isSelected ? '#fff' : s.color} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? '#fff' : '#0f172a' }}>{s.id}</div>
                      <div style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginTop: 2, fontWeight: 600 }}>{s.chapters.length} chapters</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2 – Chapter */}
            {selectedSubject && sub && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>2</div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Choose Chapter</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {sub.chapters.map(ch => {
                    const isSelected = selectedChapter === ch
                    return (
                      <button key={ch} onClick={() => setSelectedChapter(ch)} style={{
                        padding: '12px 14px', borderRadius: 10, border: `2px solid ${isSelected ? 'transparent' : '#f1f5f9'}`,
                        background: isSelected ? sub.grad : '#f8fafc', cursor: 'pointer', textAlign: 'left',
                        fontSize: 12, fontWeight: 700, color: isSelected ? '#fff' : '#475569',
                        transition: 'all 0.2s', boxShadow: isSelected ? `0 4px 12px ${sub.color}30` : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <span>{ch}</span>
                        {isSelected && <CheckCircle2 size={13} color="rgba(255,255,255,0.8)" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 3 – Mode & Settings */}
            {selectedChapter && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>3</div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Mode & Settings</span>
                </div>

                {/* Mode picker */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  {MODES.map(m => {
                    const isSelected = selectedMode === m.id
                    return (
                      <button key={m.id} onClick={() => setSelectedMode(m.id)} style={{
                        padding: '16px 12px', borderRadius: 12, border: `2px solid ${isSelected ? m.color : '#e2e8f0'}`,
                        background: isSelected ? m.bg : '#fff', cursor: 'pointer', textAlign: 'center',
                        transition: 'all 0.2s', boxShadow: isSelected ? `0 4px 16px ${m.color}25` : 'none',
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? m.color : '#f1f5f9' }}>
                          <m.icon size={18} color={isSelected ? '#fff' : '#94a3b8'} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? m.color : '#334155' }}>{m.label}</div>
                        <div style={{ fontSize: 10, color: isSelected ? m.color : '#94a3b8', marginTop: 2, opacity: 0.8 }}>{m.desc}</div>
                      </button>
                    )
                  })}
                </div>

                {/* Q count */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Number of Questions</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {LIMITS.map(n => (
                      <button key={n} onClick={() => setQuestionLimit(n)} style={{
                        width: 52, height: 40, borderRadius: 10, border: `2px solid ${questionLimit === n ? '#3b82f6' : '#e2e8f0'}`,
                        background: questionLimit === n ? '#3b82f6' : '#fff', color: questionLimit === n ? '#fff' : '#64748b',
                        fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: questionLimit === n ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                      }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary + Start */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 20, alignItems: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>You selected:</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{selectedSubject} · {selectedChapter}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{questionLimit} questions · {selectedMode} mode</div>
                </div>

                <button onClick={handleStart} style={{
                  width: '100%', padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', border: 'none',
                  borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 8px 24px rgba(79,70,229,0.3)', transition: 'transform 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Play size={18} />
                  Start {selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} — {questionLimit} Questions
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {!selectedSubject && (
              <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
                ↑ Select a subject above to get started
              </div>
            )}
          </div>
        )}

        {/* ── MOCK TESTS TAB ── */}
        {tab === 'mock' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {mtLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[24, 16, 12, 40].map((h, j) => (
                      <div key={j} style={{ height: h, background: '#f1f5f9', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
                    ))}
                  </div>
                ))}
              </div>
            ) : mockTests.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: '#f3f0ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Zap size={28} color="#7c3aed" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>No Mock Tests Yet</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px' }}>Ask your admin to schedule a mock test. Check back soon!</p>
                <button onClick={loadMocks} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
            ) : (
              <>
                {liveMocks.length > 0 && (
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Live Now
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                      {liveMocks.map(mt => <MockTestCard key={mt._id} mt={mt} navigate={navigate} />)}
                    </div>
                  </div>
                )}
                {upcomingMocks.length > 0 && (
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={15} color="#f59e0b" /> Upcoming
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                      {upcomingMocks.map(mt => <MockTestCard key={mt._id} mt={mt} navigate={navigate} />)}
                    </div>
                  </div>
                )}
                {pastMocks.length > 0 && (
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Trophy size={15} color="#7c3aed" /> Past Tests
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                      {pastMocks.map(mt => <MockTestCard key={mt._id} mt={mt} navigate={navigate} />)}
                    </div>
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
