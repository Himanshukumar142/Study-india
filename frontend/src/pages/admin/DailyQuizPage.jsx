import { useState, useEffect } from 'react'
import {
  Calendar, Plus, Trash2, Search, CheckSquare, Square, Check,
  ChevronDown, ChevronUp, Flame, Users, Zap, Target, X,
  RefreshCw, Trophy, BookOpen, Star, AlertCircle, Clock, Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const today = () => new Date().toISOString().split('T')[0]

const fmtDate = d => {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch (e) {
    return d
  }
}

/* ── Theme Definitions ──────────────────────────────── */
const THEME = {
  primary: '#f97316',
  primaryGrad: 'linear-gradient(135deg, #f97316, #ea580c)',
  primaryGlow: 'rgba(249, 115, 22, 0.4)',
  slateDark: '#0f172a',
  slateLight: '#f8fafc',
  border: '#e2e8f0',
  textMuted: '#94a3b8',
  textDark: '#334155'
}

const DIFF_THEME = {
  easy:   { bg: 'rgba(16,185,129,0.08)',  color: '#059669', border: 'rgba(16,185,129,0.2)' },
  medium: { bg: 'rgba(245,158,11,0.08)',  color: '#d97706', border: 'rgba(245,158,11,0.2)' },
  hard:   { bg: 'rgba(239,68,68,0.08)',   color: '#dc2626', border: 'rgba(239,68,68,0.2)' },
  mixed:  { bg: 'rgba(139,92,246,0.08)',  color: '#7c3aed', border: 'rgba(139,92,246,0.2)' }
}

const SUBJ_THEME = {
  Physics:     { bg: 'rgba(99,102,241,0.08)',  color: '#6366f1', border: 'rgba(99,102,241,0.2)' },
  Chemistry:   { bg: 'rgba(16,185,129,0.08)',  color: '#059669', border: 'rgba(16,185,129,0.2)' },
  Biology:     { bg: 'rgba(236,72,153,0.08)',  color: '#db2777', border: 'rgba(236,72,153,0.2)' },
  Mathematics: { bg: 'rgba(245,158,11,0.08)', color: '#d97706', border: 'rgba(245,158,11,0.2)' },
  Mixed:       { bg: 'rgba(139,92,246,0.08)',  color: '#7c3aed', border: 'rgba(139,92,246,0.2)' }
}

const S = {
  card: {
    background: '#fff',
    borderRadius: 20,
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(15,23,42,0.03)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  },
  input: {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '11px 15px',
    fontSize: 13,
    fontWeight: 500,
    color: '#0f172a',
    outline: 'none',
    transition: 'all .15s ease',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  label: {
    fontSize: 10,
    fontWeight: 800,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    display: 'block',
    marginBottom: 6
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'rgba(15,23,42,0.55)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  modalBox: {
    background: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 620,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #e2e8f0',
    boxShadow: '0 30px 70px rgba(15,23,42,0.2)',
    overflow: 'hidden',
    position: 'relative'
  }
}

/* ═══════════════════════════
   QUESTION PICKER MODAL
   ═══════════════════════════ */
function QuestionPicker({ open, onClose, selected, onSave }) {
  const [bank, setBank]       = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [subj, setSubj]       = useState('ALL')
  const [diff, setDiff]       = useState('ALL')
  const [picked, setPicked]   = useState([])

  useEffect(() => {
    if (!open) return
    setPicked(selected || [])
    if (bank.length > 0) return
    setLoading(true)
    api.get('/quizzes/questions?limit=500')
      .then(r => setBank(r.data.data || []))
      .catch(() => toast.error('Failed to load question bank'))
      .finally(() => setLoading(false))
  }, [open, selected])

  const filtered = bank.filter(q =>
    (!search || q.question?.toLowerCase().includes(search.toLowerCase()) || q.chapter?.toLowerCase().includes(search.toLowerCase())) &&
    (subj === 'ALL' || q.subject === subj) &&
    (diff === 'ALL' || q.difficulty === diff)
  )

  const toggle = id => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const selectAll   = () => setPicked(p => [...new Set([...p, ...filtered.map(q => q._id)])])
  const deselectAll = () => { const s = new Set(filtered.map(q => q._id)); setPicked(p => p.filter(x => !s.has(x))) }

  if (!open) return null

  return (
    <div style={S.modalOverlay}>
      <div style={{ ...S.modalBox, maxWidth: 740 }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>Select Bank Questions</h3>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 3 }}>{picked.length} selected from current question bank</p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b' }}>
            <X size={15} />
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions or chapters..."
              style={{ ...S.input, paddingLeft: 34, fontSize: 12 }} />
          </div>
          <select value={subj} onChange={e => setSubj(e.target.value)}
            style={{ ...S.input, width: 'auto', minWidth: 130, appearance: 'none', cursor: 'pointer', fontSize: 12 }}>
            <option value="ALL">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="Mathematics">Mathematics</option>
          </select>
          <select value={diff} onChange={e => setDiff(e.target.value)}
            style={{ ...S.input, width: 'auto', minWidth: 120, appearance: 'none', cursor: 'pointer', fontSize: 12 }}>
            <option value="ALL">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Bulk tools */}
        <div style={{ padding: '8px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 10, background: '#fafbfc' }}>
          <button onClick={selectAll} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: '#fff7ed', border: '1px solid #ffedd5', color: '#f97316', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ffedd5' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff7ed' }}>
            <CheckSquare size={12} /> Select matching ({filtered.length})
          </button>
          <button onClick={deselectAll} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}>
            <Square size={12} /> Deselect
          </button>
          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto', fontWeight: 600 }}>{filtered.length} matching questions</span>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }} className="thin-scroll">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #f1f5f9', borderTopColor: '#f97316', animation: 'spin .8s linear infinite' }} />
              <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Loading Questions bank...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8' }}>
              <BookOpen size={32} style={{ color: '#cbd5e1', marginBottom: 12 }} />
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No questions found</p>
              <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>Try altering the search query or drop filters.</p>
            </div>
          ) : (
            filtered.map(q => {
              const isSel = picked.includes(q._id)
              const diffStyle = DIFF_THEME[q.difficulty] || DIFF_THEME.mixed
              return (
                <div key={q._id} onClick={() => toggle(q._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 14,
                    cursor: 'pointer',
                    border: `2px solid ${isSel ? '#f97316' : '#f1f5f9'}`,
                    background: isSel ? 'rgba(249,115,22,0.03)' : '#fff',
                    transition: 'all .15s'
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.borderColor = '#fed7aa' }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.borderColor = '#f1f5f9' }}>
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSel ? '#f97316' : '#f1f5f9',
                    color: isSel ? '#fff' : '#94a3b8',
                    transition: 'all .15s',
                    marginTop: 1
                  }}>
                    {isSel ? <Check size={12} /> : <Plus size={12} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: '0 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.question}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[q.subject, q.chapter].filter(Boolean).map((t, i) => (
                        <span key={i} style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: '#64748b', letterSpacing: '0.08em' }}>{t}</span>
                      ))}
                      {q.difficulty && (
                        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6, background: diffStyle.bg, color: diffStyle.color, border: `1px solid ${diffStyle.border}`, letterSpacing: '0.08em' }}>{q.difficulty}</span>
                      )}
                      {q.marks && (
                        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.06)', color: '#059669', letterSpacing: '0.08em' }}>+{q.marks} Marks</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbfc' }}>
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>{picked.length} questions selected</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={() => { onSave(picked); onClose() }} disabled={picked.length === 0}
              style={{
                padding: '9px 22px',
                borderRadius: 10,
                border: 'none',
                background: picked.length ? THEME.primaryGrad : '#e2e8f0',
                color: picked.length ? '#fff' : '#94a3b8',
                fontSize: 12,
                fontWeight: 800,
                cursor: picked.length ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: picked.length ? `0 4px 12px ${THEME.primaryGlow}` : 'none'
              }}>
              <Check size={13} /> Confirm selection ({picked.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════
   CREATE / EDIT MODAL
   ═══════════════════════════ */
function ChallengeFormModal({ open, onClose, editChallenge, onSaved }) {
  const [form, setForm] = useState({ date: today(), bonusXP: 50, difficulty: 'mixed', subject: 'Mixed', questionIds: [] })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [bankMap, setBankMap] = useState({})

  useEffect(() => {
    if (open) {
      if (editChallenge) {
        setForm({
          date: editChallenge.date,
          bonusXP: editChallenge.bonusXP,
          difficulty: editChallenge.difficulty,
          subject: editChallenge.subject,
          questionIds: editChallenge.questions.map(q => q._id || q),
        })
        const m = {}
        editChallenge.questions.forEach(q => { if (q._id) m[q._id] = q })
        setBankMap(m)
      } else {
        setForm({ date: today(), bonusXP: 50, difficulty: 'mixed', subject: 'Mixed', questionIds: [] })
      }
    }
  }, [open, editChallenge])

  const handleSavePicked = (ids) => {
    setForm(f => ({ ...f, questionIds: ids }))
  }

  const handleSubmit = async () => {
    if (!form.date) return toast.error('Date is required')
    if (form.questionIds.length === 0) return toast.error('Select at least 1 question')
    setSaving(true)
    try {
      await api.post('/daily-challenge/admin/create', form)
      toast.success(`Challenge for ${fmtDate(form.date)} saved successfully!`)
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save daily challenge')
    } finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <>
      <div style={S.modalOverlay}>
        <div style={{ ...S.modalBox, maxWidth: 660 }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>{editChallenge ? 'Modify' : 'Deploy'} Daily Challenge</h3>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 3 }}>Schedule topic, difficulty and questions for students</p>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b' }}>
              <X size={15} />
            </button>
          </div>

          {/* Form Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }} className="thin-scroll">
            
            {/* Row 1: Date & Bonus XP */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={S.label}>Challenge Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={S.input} onFocus={e => e.target.style.borderColor = '#f97316'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div>
                <label style={S.label}>Bonus Completion XP</label>
                <input type="number" value={form.bonusXP} min={0} max={500} onChange={e => setForm(f => ({ ...f, bonusXP: parseInt(e.target.value) || 0 }))}
                  style={S.input} onFocus={e => e.target.style.borderColor = '#f97316'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
            </div>

            {/* Row 2: Difficulty Selector */}
            <div>
              <label style={S.label}>Difficulty Level</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['easy', 'medium', 'hard', 'mixed'].map(d => {
                  const active = form.difficulty === d
                  const diffColor = DIFF_THEME[d]
                  return (
                    <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: `2px solid ${active ? diffColor.color : '#e2e8f0'}`,
                        background: active ? diffColor.bg : '#fff',
                        color: active ? diffColor.color : '#64748b',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#cbd5e1' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#e2e8f0' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: diffColor.color, display: 'inline-block' }} />
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Row 3: Subject Selector */}
            <div>
              <label style={S.label}>Subject Theme</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Mixed', 'Physics', 'Chemistry', 'Biology', 'Mathematics'].map(s => {
                  const active = form.subject === s
                  const sColor = SUBJ_THEME[s] || SUBJ_THEME.Mixed
                  return (
                    <button key={s} type="button" onClick={() => setForm(f => ({ ...f, subject: s }))}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        border: `2px solid ${active ? sColor.color : '#e2e8f0'}`,
                        background: active ? sColor.bg : '#fff',
                        color: active ? sColor.color : '#64748b',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#cbd5e1' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#e2e8f0' }}>
                      {s === 'Mathematics' ? 'Maths' : s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Questions pick list */}
            <div>
              <label style={S.label}>Questions Selection</label>
              <button type="button" onClick={() => setPickerOpen(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px',
                  background: 'rgba(249, 115, 22, 0.02)',
                  border: '2px dashed #fed7aa',
                  borderRadius: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  color: '#ea580c',
                  fontSize: 13,
                  fontWeight: 700
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.05)'; e.currentTarget.style.borderColor = '#f97316' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.02)'; e.currentTarget.style.borderColor = '#fed7aa' }}>
                <BookOpen size={16} />
                {form.questionIds.length === 0 ? 'Pick Questions from Bank' : `Selected ${form.questionIds.length} Questions (Manage)`}
              </button>

              {/* Selection preview */}
              {form.questionIds.length > 0 && (
                <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 16, padding: '12px 14px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }} className="thin-scroll">
                  {form.questionIds.map((id, index) => {
                    const q = bankMap[id]
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#f97316', background: '#fff7ed', minWidth: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {index + 1}
                        </span>
                        <p style={{ margin: 0, fontSize: 12, color: '#475569', fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {q ? q.question : `ID: ${id}`}
                        </p>
                        <button type="button" onClick={() => setForm(f => ({ ...f, questionIds: f.questionIds.filter(x => x !== id) }))}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', transition: 'color .15s', display: 'flex', padding: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                          <X size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Est XP Summary Badge */}
            <div style={{
              padding: '14px 18px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #fef3c7, #fff7ed)',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(245,158,11,0.25)' }}>
                <Zap size={18} fill="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#92400e' }}>
                  Potential Earnings: <span style={{ color: '#d97706' }}>+{form.bonusXP + (form.questionIds.length * 10)} XP</span>
                </p>
                <p style={{ margin: '3px 0 0 0', fontSize: 10, color: '#b45309', fontWeight: 600 }}>
                  Includes +{form.bonusXP} Base XP plus +10 XP for each of the {form.questionIds.length} questions answered correctly.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fafbfc' }}>
            <div style={{ flex: 1 }} />
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 700, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving || form.questionIds.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 12,
                border: 'none',
                background: form.questionIds.length === 0 ? '#cbd5e1' : THEME.primaryGrad,
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                cursor: (saving || form.questionIds.length === 0) ? 'not-allowed' : 'pointer',
                boxShadow: form.questionIds.length === 0 ? 'none' : `0 6px 20px ${THEME.primaryGlow}`,
                transition: 'all 0.18s',
                fontFamily: 'inherit'
              }}>
              {saving ? (
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin .6s linear infinite' }} />
              ) : <Flame size={14} fill="rgba(255,255,255,0.3)" />}
              {saving ? 'Saving...' : editChallenge ? 'Update Challenge' : 'Schedule Challenge'}
            </button>
          </div>
        </div>
      </div>

      <QuestionPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selected={form.questionIds}
        onSave={handleSavePicked}
      />
    </>
  )
}

/* ═══════════════════════════
   LEADERBOARD MODAL
   ═══════════════════════════ */
function LeaderboardModal({ open, onClose, date }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !date) return
    setLoading(true)
    api.get(`/daily-challenge/admin/${date}/leaderboard`)
      .then(r => setEntries(r.data.data || []))
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [open, date])

  if (!open) return null

  return (
    <div style={S.modalOverlay}>
      <div style={{ ...S.modalBox, maxWidth: 520 }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>Leaderboard</h3>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 3 }}>Performance rankings for challenge on {date ? fmtDate(date) : ''}</p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b' }}>
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }} className="thin-scroll">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #f1f5f9', borderTopColor: '#f97316', animation: 'spin .8s linear infinite' }} />
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Loading rankings...</p>
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
              <Trophy size={32} style={{ color: '#cbd5e1', marginBottom: 10 }} />
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No student attempts found</p>
              <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>No student has submitted attempts for this scheduled challenge yet.</p>
            </div>
          ) : (
            entries.map((e, index) => {
              const isTop3 = index < 3
              const rankColor = index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#94a3b8'
              const rankBg = index === 0 ? 'rgba(251,191,36,0.1)' : index === 1 ? 'rgba(148,163,184,0.1)' : index === 2 ? 'rgba(180,83,9,0.1)' : '#f8fafc'

              return (
                <div key={e._id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: `1px solid ${isTop3 ? 'rgba(249,115,22,0.15)' : '#e2e8f0'}`,
                    background: isTop3 ? 'linear-gradient(135deg, #fffcf5, #fffbeb)' : '#fff',
                    transition: 'all .15s'
                  }}>
                  {/* Rank circle */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 13,
                    background: rankBg,
                    color: rankColor,
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>

                  {/* Student Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#334155', truncate: 'true' }}>
                      {e.userId?.name || 'Unknown Student'}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: 10, color: '#94a3b8', fontWeight: 500, truncate: 'true' }}>
                      {e.userId?.email || 'No email attached'}
                    </p>
                  </div>

                  {/* Marks & XP */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f172a' }}>
                      {e.obtainedMarks} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: 11 }}>/ {e.totalMarks} Marks</span>
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: 11, fontWeight: 800, color: '#10b981' }}>
                      +{e.xpAwarded} XP
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════
   CHALLENGE CARD
   ═══════════════════════════ */
function ChallengeCard({ c, isToday, onEdit, onDelete, onViewLB }) {
  const [expanded, setExpanded] = useState(false)
  const dateLabel = fmtDate(c.date)
  const diffStyle = DIFF_THEME[c.difficulty] || DIFF_THEME.mixed
  const subjStyle = SUBJ_THEME[c.subject] || SUBJ_THEME.Mixed

  return (
    <div style={{
      ...S.card,
      border: isToday ? `2px solid ${THEME.primary}` : '1px solid #e2e8f0',
      boxShadow: isToday ? `0 10px 30px rgba(249,115,22,0.12)` : '0 4px 20px rgba(15,23,42,0.02)'
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = isToday
          ? '0 16px 40px rgba(249,115,22,0.18)'
          : '0 12px 30px rgba(15,23,42,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = isToday
          ? '0 10px 30px rgba(249,115,22,0.12)'
          : '0 4px 20px rgba(15,23,42,0.02)'
      }}>
      
      {/* Visual Accent Light for Today */}
      {isToday && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: THEME.primaryGrad }} />
      )}

      <div style={{ padding: 20 }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: isToday ? THEME.primaryGrad : '#f1f5f9',
              color: isToday ? '#fff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isToday ? `0 6px 16px ${THEME.primaryGlow}` : 'none'
            }}>
              <Calendar size={18} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{dateLabel}</p>
              {isToday ? (
                <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#ea580c', letterSpacing: '0.1em', marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ea580c', display: 'inline-block', animation: 'pingGlow 1.2s infinite' }} />
                  Active Challenge
                </span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginTop: 2, display: 'block' }}>Scheduled</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: diffStyle.bg, color: diffStyle.color, border: `1px solid ${diffStyle.border}`, letterSpacing: '0.05em' }}>
              {c.difficulty}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
            <p style={{ fontSize: 9, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', margin: '0 0 3px', letterSpacing: '0.05em' }}>Questions</p>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#334155', margin: 0 }}>{c.questions?.length || 0}</p>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
            <p style={{ fontSize: 9, color: '#b45309', fontWeight: 800, textTransform: 'uppercase', margin: '0 0 3px', letterSpacing: '0.05em' }}>Bonus XP</p>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#d97706', margin: 0 }}>+{c.bonusXP}</p>
          </div>
          <div style={{ background: subjStyle.bg, border: `1px solid ${subjStyle.border}`, borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
            <p style={{ fontSize: 9, color: subjStyle.color, fontWeight: 800, textTransform: 'uppercase', margin: '0 0 3px', letterSpacing: '0.05em' }}>Subject</p>
            <p style={{ fontSize: 12, fontWeight: 800, color: subjStyle.color, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {c.subject === 'Mathematics' ? 'Maths' : c.subject}
            </p>
          </div>
        </div>

        {/* Dynamic Participants counter */}
        {c.participants?.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '8px 12px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #dcfce7' }}>
            <Users size={12} color="#15803d" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>
              {c.participants.length} student{c.participants.length > 1 ? 's' : ''} attempted today
            </span>
          </div>
        )}

        {/* Collapsible Questions Preview */}
        {c.questions?.length > 0 && (
          <>
            <button onClick={() => setExpanded(!expanded)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all .15s',
                marginBottom: 12,
                fontFamily: 'inherit'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc' }}>
              <span>Questions Included ({c.questions.length})</span>
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {expanded && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: 14,
                maxHeight: 140,
                overflowY: 'auto',
                paddingRight: 4
              }} className="thin-scroll">
                {c.questions.map((q, idx) => (
                  <div key={q._id || idx} style={{ display: 'flex', gap: 8, padding: 8, background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#f97316', background: '#fff7ed', minWidth: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, paddingLeft: 4 }}>
                      {idx + 1}
                    </span>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: '#475569', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {q.question || q}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onViewLB}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px',
              borderRadius: 11,
              border: '1px solid #fef3c7',
              background: '#fffbeb',
              color: '#d97706',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef3c7' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb' }}>
            <Trophy size={12} /> Leaderboard
          </button>
          
          <button onClick={onEdit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 11,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b' }}>
            <Star size={13} />
          </button>

          <button onClick={onDelete}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 11,
              border: '1px solid #fee2e2',
              background: '#fef2f2',
              color: '#ef4444',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════
   MAIN PAGE
   ═══════════════════════════ */
export default function DailyQuizPage() {
  const [challenges, setChallenges]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [showCreate, setShowCreate]   = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [lbDate, setLbDate]           = useState(null)
  const [filter, setFilter]           = useState('all')

  const load = () => {
    setLoading(true)
    api.get('/daily-challenge/admin/list')
      .then(r => setChallenges(r.data.data || []))
      .catch(() => toast.error('Failed to load daily challenges'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (date) => {
    if (!window.confirm(`Are you sure you want to delete the daily challenge for ${fmtDate(date)}?`)) return
    try {
      await api.delete(`/daily-challenge/admin/${date}`)
      toast.success('Daily challenge deleted successfully!')
      load()
    } catch { toast.error('Failed to delete daily challenge') }
  }

  const handleEdit = (c) => { setEditTarget(c); setShowCreate(true) }

  const todayStr = today()
  const filtered = challenges.filter(c => {
    if (filter === 'today')    return c.date === todayStr
    if (filter === 'upcoming') return c.date > todayStr
    if (filter === 'past')     return c.date < todayStr
    return true
  })

  const todayChallenge = challenges.find(c => c.date === todayStr)

  // Calc summary metrics
  const totalCount = challenges.length
  const upcomingCount = challenges.filter(c => c.date > todayStr).length
  const totalAttempts = challenges.reduce((s, c) => s + (c.participants?.length || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Styles injected to page */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0px rgba(249, 115, 22, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(249, 115, 22, 0); }
        }
        @keyframes pingGlow {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes bounceSimple {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .thin-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .thin-scroll::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 99px;
        }
        .thin-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 99px;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Daily Quiz Manager</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>Schedule, monitor, and deploy daily challenge quizzes for JEE/NEET students</p>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: '#fff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#334155' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b' }}
            title="Refresh list">
            <RefreshCw size={15} />
          </button>
          
          <button onClick={() => { setEditTarget(null); setShowCreate(true) }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 22px',
              borderRadius: 14,
              border: 'none',
              background: THEME.primaryGrad,
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 8px 24px ${THEME.primaryGlow}`,
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.02)'
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(249,115,22,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = `0 8px 24px ${THEME.primaryGlow}`
            }}>
            <Plus size={15} /> New Challenge
          </button>
        </div>
      </div>

      {/* Stats Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Challenges', val: totalCount, color: '#f97316', bg: '#fff7ed', icon: Calendar },
          {
            label: "Today's Challenge",
            val: todayChallenge ? `${todayChallenge.questions?.length || 0} Questions` : 'Not Configured',
            color: todayChallenge ? '#10b981' : '#ef4444',
            bg: todayChallenge ? '#f0fdf4' : '#fef2f2',
            icon: Flame
          },
          { label: 'Upcoming Scheduled', val: upcomingCount, color: '#8b5cf6', bg: '#f5f3ff', icon: Clock },
          { label: 'Cumulative Attempts', val: totalAttempts, color: '#3b82f6', bg: '#eff6ff', icon: Users }
        ].map(s => (
          <div key={s.label}
            style={{
              ...S.card,
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = `0 8px 28px rgba(15,23,42,0.06)`
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,23,42,0.02)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={20} color={s.color} fill={s.icon === Flame && todayChallenge ? s.color : 'transparent'} />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: 0, letterSpacing: '-0.3px' }}>{s.val}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* No Challenge set for Today banner */}
      {!todayChallenge && !loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #fff5f5, #fff7ed)',
          borderRadius: 20,
          border: '1px solid #fee2e2',
          flexWrap: 'wrap'
        }}>
          <div style={{
            width: 44,
            height: 44,
            background: '#ef4444',
            color: '#fff',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 6px 20px rgba(239,68,68,0.25)',
            animation: 'bounceSimple 2s infinite'
          }}>
            <AlertCircle size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#991b1b' }}>No custom challenge configured for today!</p>
            <p style={{ margin: '3px 0 0 0', fontSize: 11, color: '#b91c1c', fontWeight: 600 }}>Students will receive a fallback random questionnaire. Set a customized themed set now to guide their flow.</p>
          </div>
          <button onClick={() => { setEditTarget(null); setShowCreate(true) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: THEME.primaryGrad,
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 6px 18px ${THEME.primaryGlow}`,
              transition: 'all 0.15s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
            <Plus size={13} /> Configure Today
          </button>
        </div>
      )}

      {/* Tabs / Filter Controls */}
      <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 14, width: 'fit-content', border: '1px solid #cbd5e1' }}>
        {[
          ['all', `All (${challenges.length})`],
          ['today', 'Today'],
          ['upcoming', `Upcoming (${challenges.filter(c => c.date > todayStr).length})`],
          ['past', `Past (${challenges.filter(c => c.date < todayStr).length})`]
        ].map(([v, label]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              background: filter === v ? '#fff' : 'transparent',
              color: filter === v ? '#ea580c' : '#64748b',
              boxShadow: filter === v ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all .15s',
              fontFamily: 'inherit'
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ ...S.card, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '60%' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f1f5f9' }} />
                  <div style={{ height: 14, background: '#f1f5f9', borderRadius: 6, flex: 1 }} />
                </div>
                <div style={{ width: 60, height: 18, background: '#f1f5f9', borderRadius: 6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[0, 1, 2].map(j => <div key={j} style={{ height: 44, background: '#f1f5f9', borderRadius: 8 }} />)}
              </div>
              <div style={{ height: 34, background: '#f1f5f9', borderRadius: 10 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Calendar size={24} color="#94a3b8" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>No challenges found</p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 20px 0' }}>No daily challenges match the current filter tab selection.</p>
          <button onClick={() => { setEditTarget(null); setShowCreate(true) }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: THEME.primaryGrad,
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}>
            <Plus size={14} /> Schedule First Challenge
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(c => (
            <ChallengeCard
              key={c._id || c.date}
              c={c}
              isToday={c.date === todayStr}
              onEdit={() => handleEdit(c)}
              onDelete={() => handleDelete(c.date)}
              onViewLB={() => setLbDate(c.date)}
            />
          ))}
        </div>
      )}

      {/* Forms Overlay Modals */}
      <ChallengeFormModal
        open={showCreate}
        onClose={() => { setShowCreate(false); setEditTarget(null) }}
        editChallenge={editTarget}
        onSaved={load}
      />

      <LeaderboardModal
        open={!!lbDate}
        onClose={() => setLbDate(null)}
        date={lbDate}
      />
    </div>
  )
}
