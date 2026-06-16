import { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, Zap, Check, ChevronRight, ChevronLeft, Settings, ShieldCheck, Send, X, Users, Target, Search, CheckSquare, Square, BarChart2, Trophy, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

/* ── Shared styles ──────────────────────────────────── */
const S = {
  card: { background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'all .2s' },
  input: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#0f172a', outline: 'none', transition: 'all .15s', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.18em', display: 'block', marginBottom: 6 },
}

const STATUS = {
  upcoming:  { label: 'Upcoming',  bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  active:    { label: 'Live',      bg: 'rgba(16,185,129,0.1)',  color: '#059669' },
  completed: { label: 'Completed', bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
  draft:     { label: 'Draft',     bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
}

const initialForm = { title: '', pattern: 'JEE_MAIN', exam: 'JEE', duration: 180, startTime: '', totalMarks: 300, negativeMarking: true, shuffleQuestions: true, fullscreenRequired: true, questions: [] }

/* ── Question Picker ────────────────────────────────── */
function QuestionPicker({ open, onClose, selected, onSave }) {
  const [bank, setBank]       = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [subj, setSubj]       = useState('ALL')
  const [diff, setDiff]       = useState('ALL')
  const [picked, setPicked]   = useState(selected || [])

  useEffect(() => {
    if (!open) return
    setPicked(selected || [])
    if (bank.length > 0) return
    setLoading(true)
    api.get('/quizzes/questions?limit=500')
      .then(r => setBank(r.data.data || []))
      .catch(() => toast.error('Failed to load question bank'))
      .finally(() => setLoading(false))
  }, [open])

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(2,6,23,0.65)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', boxShadow: '0 40px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '22px 26px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0 }}>Select Questions</h3>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 3 }}>{picked.length} selected from question bank</p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={15} /></button>
        </div>

        {/* filters */}
        <div style={{ padding: '14px 26px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              style={{ ...S.input, paddingLeft: 34, fontSize: 12 }} />
          </div>
          {[['subj', subj, setSubj, [['ALL', 'All Subjects'], ['Physics', 'Physics'], ['Chemistry', 'Chemistry'], ['Biology', 'Biology'], ['Mathematics', 'Maths']]],
            ['diff', diff, setDiff, [['ALL', 'All Levels'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']]]
          ].map(([k, val, setter, opts]) => (
            <select key={k} value={val} onChange={e => setter(e.target.value)}
              style={{ ...S.input, width: 'auto', appearance: 'none', cursor: 'pointer', paddingRight: 24, fontSize: 12 }}>
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>

        {/* bulk actions */}
        <div style={{ padding: '10px 26px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={selectAll} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: '#eef2ff', border: '1px solid #e0e7ff', color: '#6366f1', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <CheckSquare size={12} /> Select visible ({filtered.length})
          </button>
          <button onClick={deselectAll} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <Square size={12} /> Deselect
          </button>
          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{filtered.length} matching</span>
        </div>

        {/* list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 26px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #f1f5f9', borderTopColor: '#6366f1', animation: 'spin .7s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
              {bank.length === 0 ? 'No questions in bank yet.' : 'No questions match filters.'}
            </p>
          ) : filtered.map(q => {
            const isSel = picked.includes(q._id)
            return (
              <div key={q._id} onClick={() => toggle(q._id)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${isSel ? '#6366f1' : '#f1f5f9'}`, background: isSel ? 'rgba(99,102,241,0.04)' : '#fff', transition: 'all .15s' }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.borderColor = '#c7d2fe' }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.borderColor = '#f1f5f9' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSel ? '#6366f1' : '#f1f5f9', color: isSel ? '#fff' : '#94a3b8', transition: 'all .15s', marginTop: 1 }}>
                  {isSel ? <Check size={13} /> : <Plus size={13} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.question}</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[q.subject, q.difficulty, q.chapter].filter(Boolean).map((t, i) => (
                      <span key={i} style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99, background: '#f1f5f9', color: '#64748b', letterSpacing: '0.1em' }}>{t}</span>
                    ))}
                    {q.marks && <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', color: '#059669', letterSpacing: '0.1em' }}>+{q.marks}m</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ padding: '18px 26px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', borderRadius: '0 0 24px 24px' }}>
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{picked.length} questions selected</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => { onSave(picked); onClose() }} disabled={picked.length === 0}
              style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: picked.length ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0', color: picked.length ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 800, cursor: picked.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={13} /> Confirm ({picked.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Create Test Wizard ─────────────────────────────── */
function CreateWizard({ open, onClose, onSubmit }) {
  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState(initialForm)
  const [saving, setSaving]   = useState(false)
  const [pickerOpen, setPicker] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [bulkJSON, setBulkJSON] = useState('')
  const [importing, setImporting] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (open) {
      setStep(1)
      setForm(initialForm)
      setBulkImportOpen(false)
      setBulkJSON('')
    }
  }, [open])

  const handleBulkImport = async () => {
    if (!bulkJSON.trim()) return toast.error('Please paste JSON questions array')
    let parsed
    try {
      parsed = JSON.parse(bulkJSON)
    } catch (err) {
      return toast.error('Invalid JSON: ' + err.message)
    }

    if (!Array.isArray(parsed)) {
      return toast.error('JSON must be an array of questions')
    }

    setImporting(true)
    try {
      const res = await api.post('/quizzes/questions/bulk', { questions: parsed })
      const newIds = (res.data.data || []).map(q => q._id)
      setForm(f => ({
        ...f,
        questions: [...new Set([...f.questions, ...newIds])]
      }))
      toast.success(`${newIds.length} questions imported and linked!`)
      setBulkJSON('')
      setBulkImportOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk import failed')
    } finally {
      setImporting(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Test title required')
    if (!form.startTime) return toast.error('Start time required')
    if (form.questions.length === 0) return toast.error('Select at least 1 question')
    setSaving(true)
    try { await onSubmit(form); onClose(); setStep(1); setForm(initialForm) }
    catch { toast.error('Failed to create test') }
    finally { setSaving(false) }
  }

  if (!open) return null

  const STEPS = [
    { n: 1, label: 'Config', icon: Settings },
    { n: 2, label: 'Questions', icon: Target },
    { n: 3, label: 'Strategy', icon: ShieldCheck },
  ]

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(8px)' }}>
        <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '92vh', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', boxShadow: '0 40px 80px rgba(0,0,0,0.2)' }}>
          {/* Stepper header */}
          <div style={{ padding: '22px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {STEPS.map((s, i) => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, transition: 'all .2s', background: step === s.n ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : step > s.n ? 'linear-gradient(135deg,#10b981,#059669)' : '#f1f5f9', color: step >= s.n ? '#fff' : '#94a3b8', boxShadow: step === s.n ? '0 6px 20px rgba(99,102,241,0.35)' : 'none' }}>
                    {step > s.n ? <Check size={15} /> : s.n}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: step === s.n ? '#6366f1' : '#94a3b8', display: 'none' }} className="sm-show">{s.label}</span>
                  {i < STEPS.length - 1 && <ChevronRight size={14} color="#e2e8f0" style={{ marginLeft: 4 }} />}
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={15} /></button>
          </div>

          {/* Step body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

            {/* Step 1 — Config */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>Basic Configuration</h3>
                <div>
                  <label style={S.label}>Test Title</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. JEE Mains Full Syllabus Mock #1"
                    style={S.input} onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <label style={{ ...S.label, marginBottom: 10 }}>Exam Pattern</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['JEE_MAIN', 'JEE_ADV', 'NEET'].map(p => (
                      <button key={p} type="button" onClick={() => {
                        setForm(f => ({
                          ...f,
                          pattern: p,
                          exam: p === 'NEET' ? 'NEET' : 'JEE'
                        }))
                      }}
                        style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: `2px solid ${form.pattern === p ? '#6366f1' : '#e2e8f0'}`, background: form.pattern === p ? 'linear-gradient(135deg,#eef2ff,#f5f3ff)' : '#f8fafc', color: form.pattern === p ? '#6366f1' : '#64748b', fontSize: 11, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all .15s' }}>
                        {p.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Start Date & Time', key: 'startTime', type: 'datetime-local' },
                    { label: 'Duration (minutes)', key: 'duration', type: 'number' },
                    { label: 'Total Marks', key: 'totalMarks', type: 'number' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={S.label}>{f.label}</label>
                      <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                        style={S.input} onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Questions */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>Add Questions to Test</h3>
                  <span style={{ padding: '4px 12px', borderRadius: 99, background: form.questions.length > 0 ? 'rgba(16,185,129,0.1)' : '#f1f5f9', color: form.questions.length > 0 ? '#059669' : '#94a3b8', fontSize: 11, fontWeight: 800 }}>
                    {form.questions.length} selected
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {/* Select from Bank */}
                  <button type="button" onClick={() => setPicker(true)}
                    style={{ padding: '24px', borderRadius: 16, border: '2px dashed #c7d2fe', background: '#fafafe', cursor: 'pointer', color: '#6366f1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .15s', fontFamily: 'inherit' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#6366f1' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fafafe'; e.currentTarget.style.borderColor = '#c7d2fe' }}>
                    <Target size={22} />
                    <span style={{ fontSize: 13, fontWeight: 800 }}>Pick from Question Bank</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, textAlign: 'center', marginTop: 4 }}>Filter and select existing questions</span>
                  </button>

                  {/* Direct JSON Import */}
                  <button type="button" onClick={() => setBulkImportOpen(true)}
                    style={{ padding: '24px', borderRadius: 16, border: '2px dashed #cbd5e1', background: '#f8fafc', cursor: 'pointer', color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .15s', fontFamily: 'inherit' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#334155' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569' }}>
                    <Plus size={22} />
                    <span style={{ fontSize: 13, fontWeight: 800 }}>Import Direct JSON</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, textAlign: 'center', marginTop: 4 }}>Paste array of questions in bulk</span>
                  </button>
                </div>

                {form.questions.length > 0 && (
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Check size={16} color="#059669" />
                    <p style={{ fontSize: 12, color: '#059669', fontWeight: 600, margin: 0 }}>
                      {form.questions.length} questions linked successfully to this mock test.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Strategy */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>Exam Strategy</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    { key: 'negativeMarking',    label: 'Negative Marking', desc: '+4 / -1 Standard', icon: Target    },
                    { key: 'fullscreenRequired', label: 'Fullscreen Lock',  desc: 'Anti-cheat mode',  icon: ShieldCheck },
                    { key: 'shuffleQuestions',   label: 'Shuffle Order',    desc: 'Randomize questions', icon: Send    },
                  ].map(s => {
                    const on = form[s.key]
                    return (
                      <button key={s.key} onClick={() => set(s.key, !on)}
                        style={{ padding: '20px 16px', borderRadius: 16, border: `2px solid ${on ? '#6366f1' : '#e2e8f0'}`, background: on ? 'linear-gradient(135deg,#eef2ff,#f5f3ff)' : '#f8fafc', cursor: 'pointer', textAlign: 'center', transition: 'all .2s', fontFamily: 'inherit' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: on ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: on ? '0 6px 16px rgba(99,102,241,0.35)' : 'none', transition: 'all .2s' }}>
                          <s.icon size={20} color={on ? '#fff' : '#94a3b8'} />
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 800, color: on ? '#6366f1' : '#475569', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                        <p style={{ fontSize: 10, color: on ? '#818cf8' : '#94a3b8', margin: 0 }}>{s.desc}</p>
                        {/* toggle pill */}
                        <div style={{ width: 36, height: 18, borderRadius: 99, background: on ? '#6366f1' : '#e2e8f0', margin: '12px auto 0', position: 'relative', transition: 'all .25s' }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: on ? 19 : 3, transition: 'left .25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div style={{ padding: '18px 20px', borderRadius: 16, background: 'linear-gradient(135deg,#1e1b4b,#0f172a)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap size={20} color="#818cf8" fill="rgba(129,140,248,0.3)" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>Ready to Deploy</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Students will be notified instantly. Ensure all details are final before deploying.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          <div style={{ padding: '18px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', borderRadius: '0 0 24px 24px' }}>
            <button onClick={() => step > 1 && setStep(step - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 700, color: '#475569', cursor: step === 1 ? 'not-allowed' : 'pointer', opacity: step === 1 ? 0 : 1, pointerEvents: step === 1 ? 'none' : 'auto', fontFamily: 'inherit' }}>
              <ChevronLeft size={14} /> Back
            </button>
            <button onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(99,102,241,0.35)', transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              {saving ? '⏳ Deploying...' : step === 3 ? <><Send size={13} /> Deploy Live</> : <>Next <ChevronRight size={13} /></>}
            </button>
          </div>
        </div>
      </div>

      <QuestionPicker open={pickerOpen} onClose={() => setPicker(false)} selected={form.questions} onSave={ids => set('questions', ids)} />

      {/* Bulk JSON Import Modal */}
      {bulkImportOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(2,6,23,0.65)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 600, border: '1px solid #e2e8f0', boxShadow: '0 40px 80px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0 }}>Import Mock Questions (JSON)</h3>
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 3 }}>Paste JSON array of questions to add to database and link</p>
              </div>
              <button onClick={() => setBulkImportOpen(false)} disabled={importing} style={{ width: 34, height: 34, borderRadius: 9, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={15} /></button>
            </div>
            
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1px solid #e0e7ff' }}>
                <p style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, margin: '0 0 3px' }}>📋 Format Hint</p>
                <code style={{ fontSize: 9, color: '#6366f1', fontFamily: 'monospace', opacity: 0.85, wordBreak: 'break-all' }}>
                  {'[{"question":"...", "subject":"Physics", "options":{"A":"","B":"","C":"","D":""}, "correct":"A", "difficulty":"medium", "exam":"JEE", "marks":4}]'}
                </code>
              </div>
              <textarea rows={8} value={bulkJSON} onChange={e => setBulkJSON(e.target.value)} disabled={importing}
                placeholder="Paste JSON array here..."
                style={{ ...S.input, resize: 'none', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#fafafa' }}>
              <button onClick={() => setBulkImportOpen(false)} disabled={importing} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleBulkImport} disabled={importing}
                style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: importing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {importing ? '⏳ Importing...' : <><Plus size={13} /> Import & Link</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Test Card ──────────────────────────────────────── */
function TestCard({ t, onView }) {
  const st = STATUS[t.status] || STATUS.draft
  return (
    <div style={{ ...S.card, padding: '20px 22px', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}>

      {/* Top */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1px solid #e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={20} color="#6366f1" />
        </div>
        <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', background: st.bg, color: st.color }}>
          {st.label}
        </span>
      </div>

      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.4 }}>{t.title}</h4>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
          <Calendar size={11} color="#94a3b8" />
          {t.startTime ? new Date(t.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBD'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
          <Clock size={11} color="#94a3b8" /> {t.duration || 0} min
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { l: 'Questions', v: t.questions?.length || 0 },
          { l: 'Marks', v: t.totalMarks || '—' },
          { l: 'Attempts', v: t.attempts || 0 },
        ].map(s => (
          <div key={s.l} style={{ padding: '10px 8px', background: '#f8fafc', borderRadius: 10, textAlign: 'center', border: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px', letterSpacing: '0.1em' }}>{s.l}</p>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0 }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Score bar */}
      {(t.avgScore || 0) > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Avg Score</span>
            <span style={{ fontSize: 10, color: t.avgScore >= 70 ? '#059669' : t.avgScore >= 50 ? '#d97706' : '#dc2626', fontWeight: 800 }}>{t.avgScore}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${t.avgScore}%`, borderRadius: 99, background: t.avgScore >= 70 ? 'linear-gradient(90deg,#10b981,#059669)' : t.avgScore >= 50 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#dc2626)', transition: 'width 1s' }} />
          </div>
        </div>
      )}

      <button style={{ width: '100%', padding: '9px', borderRadius: 11, border: '1px solid #e0e7ff', background: '#eef2ff', color: '#6366f1', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s', fontFamily: 'inherit' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#6366f1' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.borderColor = '#e0e7ff' }}>
        <Eye size={13} /> View Details
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN
═══════════════════════════════════════════ */
export default function MockTestsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab]               = useState('all')
  const [allTests, setAllTests]     = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    api.get('/mock-tests')
      .then(r => setAllTests(r.data.data || []))
      .catch(() => setAllTests([]))
      .finally(() => setLoading(false))
  }

  const handleCreate = async (form) => {
    const payload = { title: form.title, exam: form.exam, startTime: form.startTime, duration: form.duration, description: `${form.pattern} Mock Test`, questions: form.questions }
    const { data } = await api.post('/mock-tests', payload)
    toast.success(`"${data.data.title}" deployed!`)
    load()
  }

  const filtered = tab === 'all' ? allTests : allTests.filter(t => t.status === tab)

  const counts = {
    active:    allTests.filter(t => t.status === 'active').length,
    upcoming:  allTests.filter(t => t.status === 'upcoming').length,
    completed: allTests.filter(t => t.status === 'completed').length,
    attempts:  allTests.reduce((s, t) => s + (t.attempts || 0), 0),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Mock Test Center</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>Create, schedule and monitor exams</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.4)', transition: 'all .2s', fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.4)' }}>
          <Zap size={15} fill="rgba(255,255,255,0.4)" /> Create Test
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Total Tests',   val: allTests.length, color: '#6366f1', bg: '#eef2ff', icon: Zap      },
          { label: 'Live Now',      val: counts.active,   color: '#059669', bg: '#ecfdf5', icon: BarChart2 },
          { label: 'Upcoming',      val: counts.upcoming, color: '#d97706', bg: '#fffbeb', icon: Calendar  },
          { label: 'Total Attempts',val: counts.attempts, color: '#dc2626', bg: '#fff1f2', icon: Users     },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px ${s.color}20`; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 900, color: s.color, margin: 0, letterSpacing: '-0.5px' }}>{s.val}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 5, borderRadius: 14, width: 'fit-content', border: '1px solid #e2e8f0' }}>
        {[['all', 'All'], ['active', 'Live'], ['upcoming', 'Upcoming'], ['completed', 'Completed']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: tab === v ? '#fff' : 'transparent', color: tab === v ? '#6366f1' : '#64748b', boxShadow: tab === v ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s', fontFamily: 'inherit' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ ...S.card, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[40,60,80,40].map((w, j) => <div key={j} style={{ height: j===0?42:12, borderRadius: 8, background: '#f1f5f9', width: `${w}%`, animation: 'pulse 1.5s ease-in-out infinite alternate' }} />)}
              <style>{`@keyframes pulse{from{opacity:.5}to{opacity:1}}`}</style>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Zap size={24} color="#94a3b8" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: '0 0 8px' }}>No tests found</p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Create your first mock test to get started.</p>
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={14} /> Create First Test
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {filtered.map(t => <TestCard key={t._id} t={t} />)}
        </div>
      )}

      <CreateWizard open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
    </div>
  )
}
