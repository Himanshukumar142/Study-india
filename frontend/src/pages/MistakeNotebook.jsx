import { useEffect, useState } from 'react'
import api from '../services/api'
import { CheckCircle2, XCircle, RotateCcw, BookOpen, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const subjectColors = {
  Physics:     { bg: '#eef2ff', color: '#4f46e5' },
  Chemistry:   { bg: '#f0fdf4', color: '#059669' },
  Mathematics: { bg: '#fffbeb', color: '#d97706' },
  Biology:     { bg: '#fdf4ff', color: '#9333ea' },
}

export default function MistakeNotebook() {
  const [mistakes, setMistakes] = useState([])
  const [grouped, setGrouped] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ subject: '', revisited: '' })
  const [activeGroup, setActiveGroup] = useState(null)

  const fetchMistakes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.subject) params.set('subject', filter.subject)
      if (filter.revisited !== '') params.set('revisited', filter.revisited)
      const [mRes, gRes] = await Promise.all([
        api.get(`/mistakes?${params}`),
        api.get('/mistakes/grouped'),
      ])
      setMistakes(mRes.data.data)
      setGrouped(gRes.data.data)
    } catch { toast.error('Failed to load mistakes') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMistakes() }, [filter])

  const markRevised = async (id) => {
    try {
      const { data } = await api.patch(`/mistakes/${id}/revise`)
      toast.success(`Marked revised! +${data.xpGained} XP`)
      setMistakes(prev => prev.map(m => m._id === id ? { ...m, revisited: true } : m))
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const displayedMistakes = activeGroup
    ? mistakes.filter(m => m.subject === activeGroup.subject && m.chapter === activeGroup.chapter)
    : mistakes

  return (
    <div style={{ padding: 32, maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Mistake Notebook</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Review and learn from your incorrect answers</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-red">{mistakes.filter(m => !m.revisited).length} pending</span>
          <span className="badge badge-green">{mistakes.filter(m => m.revisited).length} revised</span>
        </div>
      </div>

      {/* ── Weak area chips ── */}
      {grouped.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Weak Areas</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            <button
              onClick={() => setActiveGroup(null)}
              className={`chip ${!activeGroup ? 'active' : ''}`}>
              All ({mistakes.length})
            </button>
            {grouped.map((g, i) => {
              const isActive = activeGroup?.subject === g._id?.subject && activeGroup?.chapter === g._id?.chapter
              const sc = subjectColors[g._id?.subject] || {}
              return (
                <button
                  key={i}
                  onClick={() => setActiveGroup(isActive ? null : g._id)}
                  style={{
                    padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s',
                    background: isActive ? sc.bg || '#eef2ff' : 'white',
                    borderColor: isActive ? sc.color || '#4f46e5' : '#e2e8f0',
                    color: isActive ? sc.color || '#4f46e5' : '#64748b',
                  }}>
                  {g._id?.subject} · {g._id?.chapter} ({g.count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select value={filter.revisited} onChange={e => setFilter({ ...filter, revisited: e.target.value })}
          className="input" style={{ width: 180 }}>
          <option value="">All Mistakes</option>
          <option value="false">Not Revised</option>
          <option value="true">Revised</option>
        </select>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ padding: 20, height: 100 }}>
              <div className="skeleton" style={{ height: 16, width: '30%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '50%' }} />
            </div>
          ))}
        </div>
      ) : displayedMistakes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CheckCircle2 size={28} /></div>
          <h3>All clear!</h3>
          <p>No mistakes found. Keep solving quizzes to track your errors.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayedMistakes.map((m) => {
            const sc = subjectColors[m.subject] || { bg: '#f8fafc', color: '#64748b' }
            return (
              <div
                key={m._id}
                className="card"
                style={{
                  padding: 20,
                  borderLeft: `4px solid ${m.revisited ? '#10b981' : '#ef4444'}`,
                  borderRadius: '0 12px 12px 0',
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    {/* Tags */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: sc.bg, color: sc.color }}>{m.subject}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{m.chapter}</span>
                      {m.revisited && <span className="badge badge-green">✓ Revised</span>}
                    </div>

                    {/* Question */}
                    {m.questionId && (
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.5, marginBottom: 10 }}>
                        {m.questionId.question}
                      </p>
                    )}

                    {/* Answer comparison */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                        <XCircle size={13} color="#ef4444" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>
                          Your answer: {m.selectedOption || 'Skipped'}
                        </span>
                      </div>
                      {m.questionId?.correct && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                          <CheckCircle2 size={13} color="#10b981" />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>
                            Correct: {m.questionId.correct}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {m.questionId?.explanation && (
                      <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Explanation</div>
                        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>💡 {m.questionId.explanation}</p>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  {!m.revisited && (
                    <button
                      onClick={() => markRevised(m._id)}
                      className="btn btn-sm"
                      style={{ background: '#f0fdf4', color: '#059669', border: '1.5px solid #86efac', flexShrink: 0 }}>
                      <CheckCircle2 size={13} /> Mark Done
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
