import { useState, useMemo } from 'react'
import { Plus, UploadCloud, Edit, Trash2, Search, CheckCircle2, X } from 'lucide-react'
import { Badge, Card, SectionHeader, Btn, EmptyState, Modal, Input, Select } from './AdminUI'
import toast from 'react-hot-toast'

const mockQuestions = [
  { _id: 'q1', subject: 'Physics', chapter: 'Wave Optics', topic: 'Interference', difficulty: 'hard', exam: 'JEE', type: 'single', question: 'In Young\'s double slit experiment, the fringe width is β. If the wavelength of light is doubled, the new fringe width will be:', options: { A: 'β/2', B: 'β', C: '2β', D: '4β' }, correct: 'C', marks: 4, negativeMarking: -1, explanation: 'Fringe width β = λD/d. If λ doubles, β doubles.' },
  { _id: 'q2', subject: 'Chemistry', chapter: 'Organic Chemistry', topic: 'Reactions', difficulty: 'medium', exam: 'BOTH', type: 'single', question: 'Which of the following is the most reactive towards electrophilic aromatic substitution?', options: { A: 'Nitrobenzene', B: 'Toluene', C: 'Aniline', D: 'Chlorobenzene' }, correct: 'C', marks: 4, negativeMarking: -1, explanation: 'Aniline has -NH₂ group which is a strong activating group.' },
  { _id: 'q3', subject: 'Maths', chapter: 'Calculus', topic: 'Integration', difficulty: 'hard', exam: 'JEE', type: 'numerical', question: 'If ∫₀¹ f(x)dx = 3 and ∫₀² f(x)dx = 7, then ∫₁² f(x)dx = ?', options: { A: '4', B: '10', C: '3', D: '7' }, correct: 'A', marks: 4, negativeMarking: 0, explanation: '∫₁² f(x)dx = ∫₀² f(x)dx - ∫₀¹ f(x)dx = 7 - 3 = 4.' },
  { _id: 'q4', subject: 'Biology', chapter: 'Genetics', topic: 'Mendelian Laws', difficulty: 'easy', exam: 'NEET', type: 'single', question: 'A cross between Tt × tt (test cross) produces offspring in the ratio:', options: { A: '3:1', B: '1:1', C: '1:2:1', D: '2:1' }, correct: 'B', marks: 4, negativeMarking: -1, explanation: 'Test cross always gives 1:1 ratio of Tt:tt.' },
  { _id: 'q5', subject: 'Physics', chapter: 'Electrostatics', topic: 'Coulombs Law', difficulty: 'medium', exam: 'JEE', type: 'single', question: 'Two charges of 3μC and -3μC are placed at distance r. Force between them is F. If distance is made 2r, force becomes:', options: { A: 'F/4', B: '4F', C: 'F/2', D: '2F' }, correct: 'A', marks: 4, negativeMarking: -1, explanation: 'F ∝ 1/r². Distance doubles so force becomes F/4.' },
]

const initialForm = {
  subject: 'Physics', chapter: '', topic: '', question: '',
  options: { A: '', B: '', C: '', D: '' },
  correct: 'A', marks: 4, negativeMarking: -1, exam: 'BOTH', difficulty: 'medium', explanation: '', type: 'single'
}

const diffBg = { easy: 'bg-emerald-50 text-emerald-600 border-emerald-200', medium: 'bg-amber-50 text-amber-600 border-amber-200', hard: 'bg-rose-50 text-rose-600 border-rose-200' }

function QuestionForm({ form, setForm, onSubmit, loading, onClose }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Select label="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
          <option>Physics</option><option>Chemistry</option><option>Biology</option><option>Maths</option>
        </Select>
        <Select label="Difficulty" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </Select>
        <Select label="Target Exam" value={form.exam} onChange={e => setForm({ ...form, exam: e.target.value })}>
          <option value="JEE">JEE Main</option><option value="NEET">NEET UG</option><option value="BOTH">Both</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Chapter" value={form.chapter} onChange={e => setForm({ ...form, chapter: e.target.value })} placeholder="e.g. Wave Optics" required />
        <Select label="Question Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="single">MCQ – Single Correct</option>
          <option value="multi">MCQ – Multi Correct</option>
          <option value="numerical">Numerical</option>
          <option value="assertion">Assertion-Reason</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question Text</label>
        <textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} required rows={4}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
          placeholder="Enter the full question text here..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {['A', 'B', 'C', 'D'].map(opt => (
          <div key={opt} className="relative">
            <Input label={`Option ${opt}`} value={form.options[opt]} onChange={e => setForm({ ...form, options: { ...form.options, [opt]: e.target.value } })} required />
            <button type="button" onClick={() => setForm({ ...form, correct: opt })}
              className={`absolute right-3 bottom-2.5 w-6 h-6 rounded-lg text-xs font-black transition-all ${form.correct === opt ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
              {opt}
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Marks" type="number" value={form.marks} onChange={e => setForm({ ...form, marks: e.target.value })} />
        <Input label="Negative Marking" type="number" value={form.negativeMarking} onChange={e => setForm({ ...form, negativeMarking: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solution / Explanation</label>
        <textarea value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} rows={2}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all resize-none"
          placeholder="Explain the solution approach..." />
      </div>
    </div>
  )
}

export default function QuestionBankPage({ questions: apiQuestions, onAddQuestion }) {
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('ALL')
  const [diffFilter, setDiffFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [bulkData, setBulkData] = useState('')
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)

  const allQ = (apiQuestions && apiQuestions.length > 0) ? apiQuestions : mockQuestions

  const filtered = useMemo(() => allQ.filter(q => {
    const q2 = search.toLowerCase()
    const matchS = q.question?.toLowerCase().includes(q2) || q.subject?.toLowerCase().includes(q2)
    const matchSub = subjectFilter === 'ALL' || q.subject === subjectFilter
    const matchDiff = diffFilter === 'ALL' || q.difficulty === diffFilter
    return matchS && matchSub && matchDiff
  }), [allQ, search, subjectFilter, diffFilter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (onAddQuestion) await onAddQuestion(form)
      else toast.success('Question added! (demo mode)')
      setForm(initialForm)
      setShowForm(false)
    } catch { toast.error('Failed to add question') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader
        title="Question Bank"
        subtitle={`${allQ.length} questions in repository`}
        actions={
          <div className="flex gap-3">
            <Btn variant="secondary" size="sm" onClick={() => setShowBulk(true)}><UploadCloud size={13} /> Bulk Upload</Btn>
            <Btn size="sm" onClick={() => setShowForm(true)}><Plus size={13} /> Add Question</Btn>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <Card className="p-5 h-fit lg:sticky top-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Filters</p>
          <div className="space-y-5">
            <Select label="Subject" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
              <option value="ALL">All Subjects</option>
              <option>Physics</option><option>Chemistry</option><option>Biology</option><option>Maths</option>
            </Select>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Difficulty</p>
              {['ALL', 'easy', 'medium', 'hard'].map(d => (
                <button key={d} onClick={() => setDiffFilter(d)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${diffFilter === d ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                  {d === 'ALL' ? 'All Difficulty' : d}
                </button>
              ))}
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 font-semibold">
              💡 Use bulk upload for importing 50+ questions at once via JSON.
            </div>
          </div>
        </Card>

        {/* Question List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 transition-all shadow-sm" />
          </div>

          {filtered.length === 0 ? (
            <Card><EmptyState icon={Search} title="No questions found" desc="Adjust filters or add new questions." action={<Btn onClick={() => setShowForm(true)}><Plus size={13} />Add First Question</Btn>} /></Card>
          ) : filtered.map(q => (
            <Card key={q._id} className="p-5 group hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 uppercase">{q.subject}</span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg border uppercase ${diffBg[q.difficulty]}`}>{q.difficulty}</span>
                  <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-black rounded-lg border border-slate-100 uppercase">{q.type}</span>
                  <span className="px-2.5 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-black rounded-lg border border-violet-100 uppercase">{q.exam}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all"><Edit size={13} /></button>
                  <button className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"><Trash2 size={13} /></button>
                </div>
              </div>

              <p className="font-semibold text-slate-900 text-sm mb-4 leading-relaxed">{q.question}</p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {Object.entries(q.options || {}).map(([key, val]) => (
                  <div key={key} className={`p-3 rounded-xl flex items-center gap-2.5 border transition-all ${q.correct === key ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-transparent'}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${q.correct === key ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>{key}</div>
                    <span className="text-xs font-medium text-slate-700">{val}</span>
                    {q.correct === key && <CheckCircle2 size={13} className="ml-auto text-emerald-500 flex-shrink-0" />}
                  </div>
                ))}
              </div>

              {q.explanation && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] text-slate-500 font-medium"><span className="font-bold text-slate-700">Explanation:</span> {q.explanation}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Add Question Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Question" subtitle="Add a new question to the repository" wide
        footer={<>
          <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : <><Plus size={13} /> Save Question</>}</Btn>
        </>}>
        <QuestionForm form={form} setForm={setForm} onSubmit={handleSubmit} loading={loading} onClose={() => setShowForm(false)} />
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={showBulk} onClose={() => setShowBulk(false)} title="Bulk JSON Upload" subtitle="Import multiple questions from JSON array"
        footer={<>
          <Btn variant="secondary" onClick={() => setShowBulk(false)}>Cancel</Btn>
          <Btn onClick={() => { toast.success('Bulk import complete! (demo)'); setShowBulk(false) }}><UploadCloud size={13} /> Import</Btn>
        </>}>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-semibold">Format: <code className="bg-blue-100 px-1 py-0.5 rounded text-[11px]">[{`{"question":"...", "subject":"Physics", "options":{"A":"","B":"","C":"","D":""}, "correct":"A", "difficulty":"medium", ...}`}]</code></p>
          </div>
          <textarea value={bulkData} onChange={e => setBulkData(e.target.value)} rows={12}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-blue-500 transition-all resize-none"
            placeholder="Paste your JSON array here..." />
        </div>
      </Modal>
    </div>
  )
}
