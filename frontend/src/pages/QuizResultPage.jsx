import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { CheckCircle, XCircle, Trophy, RotateCcw, BookOpen, Clock, Crown, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuizResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [rank, setRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get(`/quizzes/result/${id}`)
        setResult(data.data)
        
        // If it's a mock test, fetch leaderboard to find rank
        if (data.data.mockTestId) {
          const lbRes = await api.get(`/mock-tests/${data.data.mockTestId}/leaderboard`)
          const index = lbRes.data.data.findIndex(att => att._id === id)
          if (index !== -1) setRank(index + 1)
        }
      } catch { toast.error('Failed to load result') }
      finally { setLoading(false) }
    }

    const fetchBookmarks = async () => {
      try {
        const { data } = await api.get('/bookmarks')
        setBookmarks(data.data.filter(b => b.type === 'question').map(b => b.itemId?._id || b.itemId))
      } catch {}
    }

    fetchResult()
    fetchBookmarks()
  }, [id])

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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  if (!result) return (
    <div className="p-6 text-center">
      <p style={{ color: '#64748b' }}>Result not found.</p>
      <button onClick={() => navigate('/library')} className="btn-primary mt-4 py-2 px-4">Go to Library</button>
    </div>
  )

  const { questions, xpAwarded, obtainedMarks, totalMarks, accuracy, correct, wrong, skipped, timeTakenSeconds, mode } = result

  const qMap = {}
  questions?.forEach((q) => { qMap[q._id] = q })
  const ansMap = {}
  result.answers?.forEach((a) => { ansMap[a.questionId] = a })

  const pct = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* ── Summary Card ── */}
      <div className="card" style={{ padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: 1, marginBottom: 16 }}>
          {mode} Mode Complete
        </div>
        
        <div style={{ width: 96, height: 96, borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}15`, border: `4px solid ${color}` }}>
          <span style={{ fontSize: 28, fontWeight: 900, color }}>{pct}%</span>
        </div>
        
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Quiz Submitted!</h1>
        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 20 }}>
          {obtainedMarks?.toFixed(1)} / {totalMarks} marks scored
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 24 }}>
          <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Correct</div><div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>{correct}</div></div>
          <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Wrong</div><div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{wrong}</div></div>
          <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Skipped</div><div style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>{skipped}</div></div>
          <div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Time</div><div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{fmt(timeTakenSeconds)}</div></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99, background: '#eef2ff' }}>
            <Trophy size={18} color="#4f46e5" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#4f46e5' }}>+{xpAwarded} XP earned!</span>
          </div>
          
          {rank && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99, background: '#fffbeb', border: '1px solid #fde68a' }}>
              <Crown size={18} color="#ca8a04" />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#ca8a04' }}>Rank #{rank}</span>
            </div>
          )}
        </div>

        {result.mockTestId && (
          <button 
            onClick={() => navigate(`/mock-test/leaderboard/${result.mockTestId}`)}
            className="btn btn-secondary"
            style={{ marginBottom: 24, padding: '8px 20px', borderRadius: 10 }}
          >
            <Trophy size={14} style={{ marginRight: 6 }} /> View All India Leaderboard
          </button>
        )}
      </div>

      {/* ── Topic Analysis Section ── */}
      {result.topicAnalysis && result.topicAnalysis.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={20} color="#4f46e5" /> Performance Analysis by Topic
          </h2>
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {result.topicAnalysis.map((item, idx) => {
              const accuracy = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0
              let barColor = '#ef4444' // Red
              let label = 'Needs Improvement'
              let labelColor = '#ef4444'
              let bgColor = '#fef2f2'

              if (accuracy >= 80) {
                barColor = '#10b981' // Green
                label = 'Excellent Mastery'
                labelColor = '#059669'
                bgColor = '#ecfdf5'
              } else if (accuracy >= 50) {
                barColor = '#f59e0b' // Yellow
                label = 'Good Progress'
                labelColor = '#d97706'
                bgColor = '#fffbe8'
              } else {
                label = 'Critical Revision Needed'
              }

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>{item.topic}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: bgColor, color: labelColor }}>
                        {label}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{accuracy}%</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${accuracy}%`, 
                        background: barColor, 
                        borderRadius: 4,
                        transition: 'width 1s ease-out'
                      }} 
                    />
                  </div>
                  
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 12 }}>
                    <span>Total Questions: <b>{item.total}</b></span>
                    <span>Correct: <b style={{ color: '#10b981' }}>{item.correct}</b></span>
                    <span>Wrong: <b style={{ color: '#ef4444' }}>{item.wrong}</b></span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Question Review</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {questions?.map((q, idx) => {
          const ans = ansMap[q._id]
          const isCorrect = ans?.isCorrect
          
          return (
            <div key={q._id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{ marginTop: 2 }}>
                  {isCorrect ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Question {idx + 1}</div>
                    <button 
                      onClick={() => toggleBookmark(q._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: bookmarks.includes(q._id) ? '#4f46e5' : '#94a3b8' }}
                    >
                      <BookOpen size={16} fill={bookmarks.includes(q._id) ? '#4f46e5' : 'none'} />
                    </button>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', lineHeight: 1.6 }}>{q.question}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, paddingLeft: 32 }}>
                {q.options ? Object.entries(q.options).map(([key, val]) => {
                  const isSelected = ans?.selectedOption === key
                  const isCorrectOpt = String(q.correct).trim().toLowerCase() === String(key).trim().toLowerCase()
                  
                  let bg = '#f8fafc'
                  let border = '#e2e8f0'
                  let textColor = '#334155'
                  
                  if (isCorrectOpt) { bg = '#ecfdf5'; border = '#10b981'; textColor = '#065f46' }
                  else if (isSelected && !isCorrectOpt) { bg = '#fef2f2'; border = '#ef4444'; textColor = '#991b1b' }
                  
                  return (
                    <div key={key} style={{ padding: '10px 14px', borderRadius: 8, border: `2px solid ${border}`, background: bg, fontSize: 14, color: textColor }}>
                      <span style={{ fontWeight: 700, marginRight: 8 }}>{key}.</span>{val}
                    </div>
                  )
                }) : (
                  <div style={{ padding: '10px 14px', borderRadius: 8, border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`, background: isCorrect ? '#ecfdf5' : '#fef2f2', fontSize: 14 }}>
                    Your Answer: <strong>{ans?.selectedOption || 'N/A'}</strong> (Correct: {q.correct})
                  </div>
                )}
              </div>
              
              {q.explanation && (
                <div style={{ marginLeft: 32, padding: 16, borderRadius: 8, background: '#eef2ff', color: '#4338ca', fontSize: 13, lineHeight: 1.5 }}>
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => navigate('/library')} className="btn-secondary" style={{ flex: 1, padding: 14 }}>
          <BookOpen size={18} /> Library
        </button>
        {mode === 'practice' && (
          <button onClick={() => navigate(-1)} className="btn-primary" style={{ flex: 1, padding: 14 }}>
            <RotateCcw size={18} /> Retry Practice
          </button>
        )}
      </div>
    </div>
  )
}
