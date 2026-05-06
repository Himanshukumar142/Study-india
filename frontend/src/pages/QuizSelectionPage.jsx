import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, BookOpen, Atom, Cpu, Beaker, ArrowRight, Sparkles, Clock, Trophy } from 'lucide-react'
import api from '../services/api'

const SUBJECTS = [
  { id: 'Physics', icon: Atom, color: '#3b82f6', bg: '#eff6ff', chapters: ['Kinematics', 'Dynamics', 'Thermodynamics', 'Electromagnetism', 'Optics'] },
  { id: 'Chemistry', icon: Beaker, color: '#10b981', bg: '#f0fdf4', chapters: ['Atomic Structure', 'Chemical Bonding', 'Organic Chemistry', 'Equilibrium'] },
  { id: 'Mathematics', icon: Cpu, color: '#f59e0b', bg: '#fffbeb', chapters: ['Calculus', 'Algebra', 'Trigonometry', 'Coordinate Geometry'] },
  { id: 'Biology', icon: Target, color: '#ef4444', bg: '#fef2f2', chapters: ['Genetics', 'Cell Biology', 'Human Physiology', 'Ecology'] }
]

export default function QuizSelectionPage() {
  const navigate = useNavigate()
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedChapter, setSelectedChapter] = useState('')
  const [mockTests, setMockTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/mock-tests')
      .then(res => setMockTests(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sub = SUBJECTS.find(s => s.id === selectedSubject)

  const handleStart = () => {
    if (selectedSubject && selectedChapter) {
      navigate(`/quiz/${selectedSubject}/${selectedChapter}`)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
      <div className="fade-up">
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Take a Quiz</h1>
        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 32 }}>Select a subject and chapter or join a live mock test.</p>
      </div>

      {/* ── Mock Tests Section ── */}
      <div className="fade-up" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="#8b5cf6" /> Live & Upcoming Mock Tests
        </h2>
        
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : mockTests.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {mockTests.map(mt => {
              const isUpcoming = mt.status === 'upcoming'
              const isCompleted = mt.status === 'completed' || mt.userAttempted
              
              return (
                <div key={mt._id} className="card" style={{ padding: 20, border: `1.5px solid ${isUpcoming ? '#e2e8f0' : isCompleted ? '#e2e8f0' : '#8b5cf6'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span className={`badge ${isUpcoming ? 'badge-yellow' : isCompleted ? 'badge-gray' : 'badge-purple'}`} style={{ textTransform: 'uppercase', fontSize: 10 }}>
                      {isCompleted ? 'Completed' : mt.status}
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{mt.exam}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{mt.title}</h3>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} /> {new Date(mt.startTime).toLocaleString()}
                  </div>
                  
                  {isCompleted ? (
                    <button 
                      onClick={() => navigate(`/mock-test/leaderboard/${mt._id}`)}
                      className="btn btn-secondary" 
                      style={{ width: '100%', padding: '10px', fontSize: 13 }}
                    >
                      <Trophy size={14} style={{ marginRight: 6 }} /> View Rankings
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/quiz/mock/${mt._id}`)}
                      disabled={isUpcoming}
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '10px', fontSize: 13, opacity: isUpcoming ? 0.5 : 1, background: isUpcoming ? '#94a3b8' : '' }}
                    >
                      {isUpcoming ? 'Not Started' : 'Join Test'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
            No mock tests scheduled at the moment.
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Practice by Topic</h2>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>1. Select Subject</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 32 }}>
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelectedSubject(s.id); setSelectedChapter('') }}
              style={{
                padding: '20px 16px', borderRadius: 16, border: `2px solid ${selectedSubject === s.id ? s.color : '#e2e8f0'}`,
                background: selectedSubject === s.id ? s.bg : '#fff', cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s',
                boxShadow: selectedSubject === s.id ? `0 0 0 3px ${s.color}22` : 'none'
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <s.icon size={24} color={s.color} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: selectedSubject === s.id ? s.color : '#334155' }}>{s.id}</div>
            </button>
          ))}
        </div>

        {selectedSubject && (
          <div className="fade-in">
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>2. Select Chapter</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
              {sub.chapters.map(ch => (
                <button
                  key={ch}
                  onClick={() => setSelectedChapter(ch)}
                  style={{
                    padding: '16px', borderRadius: 12, textAlign: 'left',
                    border: `1.5px solid ${selectedChapter === ch ? sub.color : '#e2e8f0'}`,
                    background: selectedChapter === ch ? sub.bg : '#f8fafc',
                    color: selectedChapter === ch ? sub.color : '#475569',
                    fontWeight: selectedChapter === ch ? 700 : 500,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
          <button 
            onClick={handleStart} 
            disabled={!selectedSubject || !selectedChapter}
            className="btn btn-primary" 
            style={{ padding: '12px 24px', fontSize: 15, opacity: (!selectedSubject || !selectedChapter) ? 0.5 : 1 }}
          >
            Proceed to Quiz Setup <ArrowRight size={16} style={{ marginLeft: 6 }} />
          </button>
        </div>
      </div>
    </div>
  )
}

