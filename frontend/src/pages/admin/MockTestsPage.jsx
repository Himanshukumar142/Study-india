import { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, Edit, Zap, Check, ChevronRight, ChevronLeft, Settings, ShieldCheck, Send, BarChart2, X, Users, Target, Search, CheckSquare, Square } from 'lucide-react'
import { Badge, Card, SectionHeader, Btn, EmptyState, Modal, Input, Select } from './AdminUI'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import api from '../../services/api'

const mockTests = [
  { _id: 'm1', title: 'JEE Main Full Syllabus Alpha', pattern: 'JEE_MAIN', exam: 'JEE', duration: 180, startTime: '2025-05-10T09:00', questions: new Array(90), status: 'scheduled', totalMarks: 300, attempts: 284, avgScore: 68 },
  { _id: 'm2', title: 'NEET Chapter Mastery — Biology', pattern: 'NEET', exam: 'NEET', duration: 120, startTime: '2025-05-08T11:00', questions: new Array(45), status: 'active', totalMarks: 180, attempts: 142, avgScore: 74 },
  { _id: 'm3', title: 'JEE Advanced Mock Series #1', pattern: 'JEE_ADV', exam: 'JEE', duration: 200, startTime: '2025-04-28T09:00', questions: new Array(54), status: 'completed', totalMarks: 216, attempts: 98, avgScore: 52 },
  { _id: 'm4', title: 'Chemistry PYQ Sprint — NEET', pattern: 'NEET', exam: 'NEET', duration: 90, startTime: '2025-05-12T14:00', questions: new Array(45), status: 'draft', totalMarks: 180, attempts: 0, avgScore: 0 },
]

const analyticsData = [
  { name: 'JEE Alpha', avg: 68, attempts: 284 },
  { name: 'NEET Bio', avg: 74, attempts: 142 },
  { name: 'JEE Adv', avg: 52, attempts: 98 },
]

const statusColor = {
  draft: 'draft', scheduled: 'scheduled', active: 'published', completed: 'approved',
}

const initialForm = {
  title: '', pattern: 'JEE_MAIN', exam: 'JEE', duration: 180, startTime: '', totalMarks: 300,
  negativeMarking: true, shuffleQuestions: true, fullscreenRequired: true, questions: [],
}

function CreateTestWizard({ open, onClose, onSubmit }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)

  // Real question bank state
  const [bankQuestions, setBankQuestions] = useState([])
  const [bankLoading, setBankLoading] = useState(false)
  const [qSearch, setQSearch] = useState('')
  const [qSubject, setQSubject] = useState('ALL')
  const [qDifficulty, setQDifficulty] = useState('ALL')

  const steps = [
    { n: 1, label: 'Configuration', icon: Settings },
    { n: 2, label: 'Questions', icon: Target },
    { n: 3, label: 'Strategy', icon: ShieldCheck },
  ]

  // Fetch questions from question bank when entering step 2
  useEffect(() => {
    if (step === 2 && bankQuestions.length === 0) {
      setBankLoading(true)
      api.get('/quizzes/questions?limit=500')
        .then(r => setBankQuestions(r.data.data || []))
        .catch(() => toast.error('Failed to load question bank'))
        .finally(() => setBankLoading(false))
    }
  }, [step])

  // Filtered questions based on search/subject/difficulty
  const filteredBank = bankQuestions.filter(q => {
    const matchSearch = !qSearch || q.question?.toLowerCase().includes(qSearch.toLowerCase()) || q.chapter?.toLowerCase().includes(qSearch.toLowerCase())
    const matchSubject = qSubject === 'ALL' || q.subject === qSubject
    const matchDiff = qDifficulty === 'ALL' || q.difficulty === qDifficulty
    return matchSearch && matchSubject && matchDiff
  })

  const toggleQuestion = (qId) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.includes(qId)
        ? prev.questions.filter(id => id !== qId)
        : [...prev.questions, qId]
    }))
  }

  const selectAllVisible = () => {
    const visibleIds = filteredBank.map(q => q._id)
    setForm(prev => ({
      ...prev,
      questions: [...new Set([...prev.questions, ...visibleIds])]
    }))
  }

  const deselectAllVisible = () => {
    const visibleIds = new Set(filteredBank.map(q => q._id))
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter(id => !visibleIds.has(id))
    }))
  }

  const handleSubmit = async () => {
    if (form.questions.length === 0) {
      toast.error('Please select at least 1 question')
      return
    }
    setLoading(true)
    try {
      if (onSubmit) await onSubmit(form)
      else toast.success('Mock test created! (demo mode)')
      onClose()
      setStep(1)
      setForm(initialForm)
      setBankQuestions([])
    } catch { toast.error('Failed to create test') }
    finally { setLoading(false) }
  }

  if (!open) return null

  const diffBg = { easy: 'bg-emerald-50 text-emerald-600', medium: 'bg-amber-50 text-amber-600', hard: 'bg-rose-50 text-rose-600' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Stepper header */}
        <div className="p-7 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border-2 transition-all ${step === s.n ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30' : step > s.n ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {step > s.n ? <Check size={16} /> : s.n}
                </div>
                <span className={`text-xs font-bold hidden sm:block ${step === s.n ? 'text-blue-600' : 'text-slate-400'}`}>{s.label}</span>
                {i < steps.length - 1 && <ChevronRight size={14} className="text-slate-300 ml-1" />}
              </div>
            ))}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all"><X size={18} /></button>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-7">
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
              <h3 className="font-black text-lg text-slate-900">Basic Configuration</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <Input label="Test Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. JEE Mains Full Syllabus Alpha 2025" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Exam Pattern</p>
                  <div className="flex gap-2">
                    {['JEE_MAIN', 'JEE_ADV', 'NEET'].map(p => (
                      <button key={p} onClick={() => setForm({ ...form, pattern: p, exam: p === 'NEET' ? 'NEET' : 'JEE' })}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all ${form.pattern === p ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'}`}>
                        {p.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <Input label="Start Date & Time" type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                <Input label="Duration (minutes)" type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
                <Input label="Total Marks" type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg text-slate-900">Select Questions from Bank</h3>
                <Badge variant="active">{form.questions.length} selected</Badge>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-40">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={qSearch} onChange={e => setQSearch(e.target.value)} placeholder="Search questions…"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-400" />
                </div>
                <select value={qSubject} onChange={e => setQSubject(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none">
                  <option value="ALL">All Subjects</option>
                  <option>Physics</option><option>Chemistry</option><option>Biology</option><option>Mathematics</option>
                </select>
                <select value={qDifficulty} onChange={e => setQDifficulty(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none">
                  <option value="ALL">All Difficulty</option>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </div>

              {/* Select all / none buttons */}
              <div className="flex items-center gap-3">
                <button onClick={selectAllVisible} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-all border border-blue-100">
                  <CheckSquare size={12} /> Select all ({filteredBank.length})
                </button>
                <button onClick={deselectAllVisible} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-[11px] font-bold hover:bg-slate-100 transition-all border border-slate-200">
                  <Square size={12} /> Deselect all
                </button>
                <span className="text-[11px] text-slate-400 ml-auto">{filteredBank.length} questions found</span>
              </div>

              {/* Question list */}
              {bankLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : filteredBank.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  {bankQuestions.length === 0 ? 'No questions in question bank. Add questions first.' : 'No questions match your filters.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {filteredBank.map(q => {
                    const isSelected = form.questions.includes(q._id)
                    return (
                      <div key={q._id} onClick={() => toggleQuestion(q._id)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 group
                          ${isSelected ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                          ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                          {isSelected ? <Check size={14} /> : <Plus size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">{q.question}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-md uppercase">{q.subject}</span>
                            {q.chapter && <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded-md">{q.chapter}</span>}
                            {q.difficulty && <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase ${diffBg[q.difficulty] || ''}`}>{q.difficulty}</span>}
                            {q.marks && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-md">+{q.marks} marks</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected summary */}
              {form.questions.length > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                  <Check size={15} className="text-emerald-600" />
                  <p className="text-xs text-emerald-700 font-semibold">
                    {form.questions.length} questions selected — these exact questions will appear in the mock test for all students.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
              <h3 className="font-black text-lg text-slate-900">Exam Strategy</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'negativeMarking', label: 'Negative Marking', desc: '+4 / -1 Standard', icon: Target },
                  { key: 'fullscreenRequired', label: 'Fullscreen Lock', desc: 'Anti-cheat mode', icon: ShieldCheck },
                  { key: 'shuffleQuestions', label: 'Shuffle Questions', desc: 'Randomize order', icon: Send },
                ].map(s => (
                  <button key={s.key} onClick={() => setForm({ ...form, [s.key]: !form[s.key] })}
                    className={`p-5 rounded-2xl border-2 transition-all text-center ${form[s.key] ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                    <s.icon size={28} className="mx-auto mb-3" />
                    <p className="font-black text-xs uppercase tracking-wider">{s.label}</p>
                    <p className={`text-[10px] mt-1 ${form[s.key] ? 'text-blue-100' : 'text-slate-400'}`}>{s.desc}</p>
                    <div className={`mt-3 w-10 h-5 rounded-full mx-auto transition-all ${form[s.key] ? 'bg-white/30' : 'bg-slate-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-all ${form[s.key] ? 'ml-5' : 'ml-0.5'} shadow-sm`} />
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-5">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30 rotate-3"><Zap size={22} /></div>
                <div>
                  <h4 className="font-black text-indigo-900">Ready to Deploy</h4>
                  <p className="text-xs text-indigo-600 mt-0.5">Once published, students will be notified instantly. Ensure all details are final.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between rounded-b-3xl">
          <button onClick={() => step > 1 && setStep(step - 1)} className={`flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}>
            <ChevronLeft size={14} /> Back
          </button>
          <button onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()} disabled={loading}
            className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all disabled:opacity-70">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : step === 3 ? <><Send size={14} /> Deploy Live</> : <>Next <ChevronRight size={14} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MockTestsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [allTests, setAllTests] = useState([])
  const [testsLoading, setTestsLoading] = useState(true)

  // Fetch mock tests from API
  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = () => {
    setTestsLoading(true)
    api.get('/mock-tests')
      .then(r => setAllTests(r.data.data || []))
      .catch(() => setAllTests(mockTests)) // fallback to demo data
      .finally(() => setTestsLoading(false))
  }

  const handleCreateTest = async (formData) => {
    const payload = {
      title: formData.title,
      exam: formData.exam,
      startTime: formData.startTime,
      duration: formData.duration,
      description: `${formData.pattern} Mock Test`,
      questions: formData.questions, // real question IDs from bank
    }
    const { data } = await api.post('/mock-tests', payload)
    toast.success(`Mock Test "${data.data.title}" deployed!`)
    fetchTests() // refresh list
  }

  const filtered = activeTab === 'all' ? allTests : allTests.filter(t => t.status === activeTab)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader
        title="Mock Test Center"
        subtitle="Create, schedule, and monitor exams"
        actions={<Btn onClick={() => setShowCreate(true)}><Zap size={13} /> Create Test</Btn>}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Tests', v: allTests.length, color: 'text-slate-900' },
          { label: 'Active', v: allTests.filter(t => t.status === 'active').length, color: 'text-emerald-600' },
          { label: 'Scheduled', v: allTests.filter(t => t.status === 'scheduled' || t.status === 'upcoming').length, color: 'text-violet-600' },
          { label: 'Total Attempts', v: allTests.reduce((acc, t) => acc + (t.attempts || 0), 0), color: 'text-blue-600' },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.v}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {['all', 'active', 'upcoming', 'completed'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Test Cards */}
      {testsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0,1,2].map(i => (
            <Card key={i} className="p-5 animate-pulse space-y-3">
              <div className="h-5 bg-slate-100 rounded-lg w-24" />
              <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
              <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
              <div className="h-10 bg-slate-100 rounded-xl mt-3" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={Zap} title="No tests found" desc='Use "Create Test" to schedule a new exam.' action={<Btn onClick={() => setShowCreate(true)}><Plus size={13} />Create First Test</Btn>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(t => (
            <Card key={t._id} className="p-5 hover:shadow-lg transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><Zap size={20} /></div>
                <Badge variant={statusColor[t.status] || 'draft'}>{t.status}</Badge>
              </div>
              <h4 className="font-black text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors leading-snug">{t.title}</h4>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-4">
                <span className="flex items-center gap-1"><Calendar size={11} />{t.startTime ? new Date(t.startTime).toLocaleDateString('en-IN') : 'TBD'}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{t.duration} min</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { l: 'Questions', v: t.questions?.length || 0 },
                  { l: 'Marks', v: t.totalMarks || '—' },
                  { l: 'Attempts', v: t.attempts || 0 },
                ].map(s => (
                  <div key={s.l} className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{s.l}</p>
                    <p className="font-black text-slate-900">{s.v}</p>
                  </div>
                ))}
              </div>
              {(t.avgScore || 0) > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Avg Score</span><span>{t.avgScore}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${t.avgScore >= 70 ? 'bg-emerald-500' : t.avgScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${t.avgScore}%` }} />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <CreateTestWizard open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreateTest} />
    </div>
  )
}
