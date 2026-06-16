import { useState, useMemo, useEffect } from 'react'
import { Plus, UploadCloud, Edit, Trash2, Search, CheckCircle2, BookOpen, Filter, Layers, Zap, Target, X, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

/* ── shared styles ─────────────────────────────────── */
const S = {
  card: { background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'all .2s' },
  input: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#0f172a', outline: 'none', transition: 'all .15s', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.18em', display: 'block', marginBottom: 6 },
  btn: (grad = 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow = 'rgba(99,102,241,0.35)') => ({
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800,
    color: '#fff', background: grad, boxShadow: `0 6px 20px ${shadow}`,
    transition: 'all .2s', fontFamily: 'inherit',
  }),
  btnSec: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#475569', background: '#fff', transition: 'all .15s', fontFamily: 'inherit' },
}

const DIFF = {
  easy:   { bg: 'rgba(16,185,129,0.1)',  color: '#059669', border: 'rgba(16,185,129,0.25)'  },
  medium: { bg: 'rgba(245,158,11,0.1)',  color: '#d97706', border: 'rgba(245,158,11,0.25)'  },
  hard:   { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', border: 'rgba(239,68,68,0.25)'   },
}

const SUBJ_COLOR = {
  Physics:     { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  Chemistry:   { bg: 'rgba(16,185,129,0.1)',  color: '#059669' },
  Biology:     { bg: 'rgba(236,72,153,0.1)',  color: '#db2777' },
  Mathematics: { bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
  Maths:       { bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
}

const initialForm = {
  subject: 'Physics', chapter: '', topic: '', question: '',
  options: { A: '', B: '', C: '', D: '' },
  correct: 'A', marks: 4, negativeMarking: -1, exam: 'BOTH', difficulty: 'medium', explanation: '', type: 'single'
}

/* ── Question Form Modal ───────────────────────────── */
function QuestionModal({ open, onClose, onSubmit, editQuestion }) {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setOpt = (k, v) => setForm(f => ({ ...f, options: { ...f.options, [k]: v } }))

  useEffect(() => {
    if (open) {
      if (editQuestion) {
        setForm({
          subject: editQuestion.subject || 'Physics',
          chapter: editQuestion.chapter || '',
          topic: editQuestion.topic || '',
          question: editQuestion.question || '',
          options: editQuestion.options || { A: '', B: '', C: '', D: '' },
          correct: editQuestion.correct || 'A',
          marks: editQuestion.marks || 4,
          negativeMarking: editQuestion.negativeMarking || -1,
          exam: editQuestion.exam || 'BOTH',
          difficulty: editQuestion.difficulty || 'medium',
          explanation: editQuestion.explanation || '',
          type: editQuestion.type || 'single'
        })
      } else {
        setForm(initialForm)
      }
    }
  }, [open, editQuestion])

  const handleSubmit = async () => {
    if (!form.question.trim()) return toast.error('Question text required')
    if (!form.chapter.trim()) return toast.error('Chapter required')
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    }
    catch {
      toast.error(editQuestion ? 'Failed to update question' : 'Failed to add question')
    }
    finally { setSaving(false) }
  }

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 780, maxHeight: '92vh', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', boxShadow: '0 40px 80px rgba(0,0,0,0.2)' }}>
        {/* header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>Add Question</h3>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 3 }}>Add a new question to the repository</p>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={16} /></button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            {[
              { label: 'Subject', key: 'subject', opts: ['Physics', 'Chemistry', 'Biology', 'Mathematics'] },
              { label: 'Difficulty', key: 'difficulty', opts: ['easy', 'medium', 'hard'] },
              { label: 'Target Exam', key: 'exam', opts: ['JEE', 'NEET', 'BOTH'] },
            ].map(f => (
              <div key={f.key}>
                <label style={S.label}>{f.label}</label>
                <select value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                  style={{ ...S.input, appearance: 'none', cursor: 'pointer' }}>
                  {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={S.label}>Chapter</label>
              <input style={S.input} value={form.chapter} onChange={e => set('chapter', e.target.value)} placeholder="e.g. Wave Optics"
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div>
              <label style={S.label}>Question Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                style={{ ...S.input, appearance: 'none', cursor: 'pointer' }}>
                <option value="single">MCQ – Single Correct</option>
                <option value="multi">MCQ – Multi Correct</option>
                <option value="numerical">Numerical</option>
                <option value="assertion">Assertion-Reason</option>
              </select>
            </div>
          </div>

          {/* question text */}
          <div>
            <label style={S.label}>Question Text</label>
            <textarea rows={4} value={form.question} onChange={e => set('question', e.target.value)}
              placeholder="Enter the full question text here..."
              style={{ ...S.input, resize: 'none', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>

          {/* options */}
          <div>
            <label style={{ ...S.label, marginBottom: 10 }}>Options — click letter to mark correct</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {['A', 'B', 'C', 'D'].map(opt => {
                const isCorrect = form.correct === opt
                return (
                  <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: `2px solid ${isCorrect ? '#10b981' : '#e2e8f0'}`, background: isCorrect ? 'rgba(16,185,129,0.05)' : '#f8fafc', transition: 'all .15s' }}>
                    <button onClick={() => set('correct', opt)} style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 900, background: isCorrect ? '#10b981' : '#e2e8f0', color: isCorrect ? '#fff' : '#64748b', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isCorrect ? <CheckCircle2 size={14} /> : opt}
                    </button>
                    <input value={form.options[opt]} onChange={e => setOpt(opt, e.target.value)}
                      placeholder={`Option ${opt}`}
                      style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, fontWeight: 500, color: '#0f172a', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* marks + explanation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={S.label}>Marks</label>
              <input type="number" value={form.marks} onChange={e => set('marks', +e.target.value)}
                style={S.input} onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div>
              <label style={S.label}>Negative Marking</label>
              <input type="number" value={form.negativeMarking} onChange={e => set('negativeMarking', +e.target.value)}
                style={S.input} onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
          </div>

          <div>
            <label style={S.label}>Explanation / Solution</label>
            <textarea rows={2} value={form.explanation} onChange={e => set('explanation', e.target.value)}
              placeholder="Explain the solution approach..."
              style={{ ...S.input, resize: 'none' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
        </div>

        {/* footer */}
        <div style={{ padding: '18px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#fafafa', borderRadius: '0 0 24px 24px' }}>
          <button onClick={onClose} style={S.btnSec}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ ...S.btn(), opacity: saving ? 0.7 : 1 }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            {saving ? '⏳ Saving...' : editQuestion ? <><Edit size={14} /> Update Question</> : <><Plus size={14} /> Save Question</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Question Card ─────────────────────────────────── */
function QCard({ q, onEdit, onDelete }) {
  const [exp, setExp] = useState(false)
  const sc = SUBJ_COLOR[q.subject] || { bg: '#f1f5f9', color: '#64748b' }
  const dc = DIFF[q.difficulty] || DIFF.medium

  return (
    <div style={{ ...S.card, padding: '20px 22px' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}>

      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: q.subject, ...sc },
            { label: q.difficulty, bg: dc.bg, color: dc.color },
            { label: q.type || 'mcq', bg: '#f1f5f9', color: '#64748b' },
            { label: q.exam,   bg: 'rgba(139,92,246,0.1)', color: '#7c3aed' },
          ].map((t, i) => (
            <span key={i} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', background: t.bg, color: t.color }}>
              {t.label}
            </span>
          ))}
          {q.chapter && (
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
              {q.chapter}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ width: 32, height: 32, borderRadius: 9, background: '#eff6ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
            onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
            <Edit size={13} />
          </button>
          <button onClick={() => { if (window.confirm('Are you sure you want to delete this question?')) onDelete(q._id) }} style={{ width: 32, height: 32, borderRadius: 9, background: '#fff1f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* question */}
      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.65, marginBottom: 16 }}>{q.question}</p>

      {/* options */}
      {q.options && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {Object.entries(q.options).map(([k, v]) => {
            const isCorrect = q.correct === k
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11, background: isCorrect ? 'rgba(16,185,129,0.07)' : '#f8fafc', border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : '#f1f5f9'}` }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, background: isCorrect ? '#10b981' : '#e2e8f0', color: isCorrect ? '#fff' : '#64748b' }}>
                  {isCorrect ? '✓' : k}
                </div>
                <span style={{ fontSize: 12, color: isCorrect ? '#059669' : '#475569', fontWeight: isCorrect ? 700 : 500, flex: 1 }}>{v}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* marks */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#059669', fontWeight: 700, background: 'rgba(16,185,129,0.08)', padding: '3px 10px', borderRadius: 99 }}>+{q.marks || 4} marks</span>
          {q.negativeMarking !== 0 && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, background: 'rgba(239,68,68,0.08)', padding: '3px 10px', borderRadius: 99 }}>{q.negativeMarking || -1} negative</span>}
        </div>
        {q.explanation && (
          <button onClick={() => setExp(!exp)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6366f1', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
            {exp ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Explanation
          </button>
        )}
      </div>

      {exp && q.explanation && (
        <div style={{ marginTop: 12, padding: '12px 14px', background: 'linear-gradient(135deg,#f8faff,#fafbff)', borderRadius: 12, border: '1px solid #e0e7ff' }}>
          <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: 0 }}>
            <span style={{ fontWeight: 800, color: '#6366f1' }}>Explanation: </span>{q.explanation}
          </p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════ */
export default function QuestionBankPage({ questions: apiQuestions, onAddQuestion, onBulkAddQuestion, onEditQuestion, onDeleteQuestion }) {
  const [search, setSearch]         = useState('')
  const [subject, setSubject]       = useState('ALL')
  const [diff, setDiff]             = useState('ALL')
  const [showForm, setShowForm]     = useState(false)
  const [showBulk, setShowBulk]     = useState(false)
  const [bulkData, setBulkData]     = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const allQ = apiQuestions?.length > 0 ? apiQuestions : []

  const filtered = useMemo(() => allQ.filter(q => {
    const m = search.toLowerCase()
    return (
      (!m || q.question?.toLowerCase().includes(m) || q.chapter?.toLowerCase().includes(m) || q.subject?.toLowerCase().includes(m)) &&
      (subject === 'ALL' || q.subject === subject) &&
      (diff === 'ALL' || q.difficulty === diff)
    )
  }), [allQ, search, subject, diff])

  const handleFormSubmit = async (formData) => {
    if (editTarget) {
      if (onEditQuestion) await onEditQuestion(editTarget._id, formData)
    } else {
      if (onAddQuestion) await onAddQuestion(formData)
    }
  }

  const handleAddClick = () => {
    setEditTarget(null)
    setShowForm(true)
  }

  const handleEditClick = (q) => {
    setEditTarget(q)
    setShowForm(true)
  }

  const handleBulkSubmit = async () => {
    if (!bulkData.trim()) return toast.error('JSON data is empty')
    
    let parsed
    try {
      parsed = JSON.parse(bulkData)
    } catch (err) {
      return toast.error('Invalid JSON format: ' + err.message)
    }

    if (!Array.isArray(parsed)) {
      return toast.error('Expected a JSON array of questions')
    }

    setBulkSaving(true)
    try {
      if (onBulkAddQuestion) {
        await onBulkAddQuestion(parsed)
      } else {
        toast.success('Bulk import complete! (demo)')
      }
      setBulkData('')
      setShowBulk(false)
    } catch (err) {
      // Error handles in parent, we catch to reset state
    } finally {
      setBulkSaving(false)
    }
  }

  const stats = useMemo(() => ({
    total: allQ.length,
    physics: allQ.filter(q => q.subject === 'Physics').length,
    chemistry: allQ.filter(q => q.subject === 'Chemistry').length,
    biology: allQ.filter(q => q.subject === 'Biology').length,
    maths: allQ.filter(q => q.subject?.includes('Math')).length,
    hard: allQ.filter(q => q.difficulty === 'hard').length,
  }), [allQ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Question Bank</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>{allQ.length} questions in repository</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowBulk(true)} style={S.btnSec}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
            <UploadCloud size={14} /> Bulk Upload
          </button>
          <button onClick={handleAddClick} style={S.btn()}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <Plus size={14} /> Add Question
          </button>
        </div>
      </div>

      {/* ── Stat tiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
        {[
          { label: 'Total', val: stats.total, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Physics', val: stats.physics, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Chemistry', val: stats.chemistry, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Biology', val: stats.biology, color: '#ec4899', bg: '#fdf2f8' },
          { label: 'Maths', val: stats.maths, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Hard', val: stats.hard, color: '#ef4444', bg: '#fff1f2' },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, padding: '14px 16px', textAlign: 'center' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 20px ${s.color}22`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'}>
            <p style={{ fontSize: 22, fontWeight: 900, color: s.color, margin: 0 }}>{s.val}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Main layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Sidebar filters */}
        <div style={{ ...S.card, padding: '20px', position: 'sticky', top: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Filter size={14} color="#6366f1" />
            </div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', margin: 0 }}>Filters</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={S.label}>Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                style={{ ...S.input, appearance: 'none', cursor: 'pointer', fontSize: 12 }}>
                <option value="ALL">All Subjects</option>
                <option>Physics</option><option>Chemistry</option>
                <option>Biology</option><option>Mathematics</option>
              </select>
            </div>

            <div>
              <label style={{ ...S.label, marginBottom: 8 }}>Difficulty</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[['ALL', '#6366f1', 'All Levels'], ['easy', '#10b981', 'Easy'], ['medium', '#f59e0b', 'Medium'], ['hard', '#ef4444', 'Hard']].map(([d, c, l]) => (
                  <button key={d} onClick={() => setDiff(d)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .15s', background: diff === d ? `${c}15` : 'transparent', color: diff === d ? c : '#64748b', fontWeight: diff === d ? 700 : 500, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: diff === d ? c : '#e2e8f0', transition: 'all .15s' }} />
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1px solid #e0e7ff' }}>
              <p style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                💡 Use Bulk Upload to import 50+ questions at once via JSON format.
              </p>
            </div>
          </div>
        </div>

        {/* Question list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search questions, chapters, subjects..."
              style={{ ...S.input, paddingLeft: 42, paddingRight: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }} />
          </div>

          {/* Result count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
              Showing <span style={{ color: '#0f172a', fontWeight: 800 }}>{filtered.length}</span> questions
            </p>
          </div>

          {filtered.length === 0 ? (
            <div style={{ ...S.card, padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <BookOpen size={24} color="#94a3b8" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: '0 0 8px' }}>No questions found</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Adjust filters or add new questions</p>
              <button onClick={handleAddClick} style={S.btn()}>
                <Plus size={14} /> Add First Question
              </button>
            </div>
          ) : (
            filtered.map(q => <QCard key={q._id} q={q} onEdit={() => handleEditClick(q)} onDelete={onDeleteQuestion} />)
          )}
        </div>
      </div>

      {/* Add / Edit Question Modal */}
      <QuestionModal open={showForm} onClose={() => { setShowForm(false); setEditTarget(null); }} onSubmit={handleFormSubmit} editQuestion={editTarget} />

      {/* Bulk Upload Modal */}
      {showBulk && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 640, border: '1px solid #e2e8f0', boxShadow: '0 40px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>Bulk JSON Upload</h3>
              <button onClick={() => setShowBulk(false)} style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1px solid #e0e7ff' }}>
                <p style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, margin: '0 0 4px' }}>📋 Expected JSON format</p>
                <code style={{ fontSize: 10, color: '#6366f1', fontFamily: 'monospace', opacity: 0.7 }}>
                  {'[{"question":"...", "subject":"Physics", "options":{"A":"","B":"","C":"","D":""}, "correct":"A", "difficulty":"medium", "exam":"JEE", "marks":4}]'}
                </code>
              </div>
              <textarea rows={10} value={bulkData} onChange={e => setBulkData(e.target.value)}
                placeholder="Paste your JSON array here..."
                style={{ ...S.input, resize: 'none', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div style={{ padding: '18px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#fafafa', borderRadius: '0 0 24px 24px' }}>
              <button onClick={() => setShowBulk(false)} style={S.btnSec} disabled={bulkSaving}>Cancel</button>
              <button onClick={handleBulkSubmit} disabled={bulkSaving} style={{ ...S.btn('linear-gradient(135deg,#10b981,#059669)', 'rgba(16,185,129,0.35)'), opacity: bulkSaving ? 0.7 : 1 }}>
                {bulkSaving ? '⏳ Importing...' : <><UploadCloud size={14} /> Import Questions</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
