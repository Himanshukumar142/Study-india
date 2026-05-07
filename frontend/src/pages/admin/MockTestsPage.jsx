import { useState } from 'react'
import { Plus, Calendar, Clock, Edit, Zap, Check, ChevronRight, ChevronLeft, Settings, ShieldCheck, Send, BarChart2, X, Users, Target } from 'lucide-react'
import { Badge, Card, SectionHeader, Btn, EmptyState, Modal, Input, Select } from './AdminUI'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

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

function CreateTestWizard({ open, onClose, onSubmit, questions }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)

  const steps = [
    { n: 1, label: 'Configuration', icon: Settings },
    { n: 2, label: 'Questions', icon: Target },
    { n: 3, label: 'Strategy', icon: ShieldCheck },
  ]

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (onSubmit) await onSubmit(form)
      else toast.success('Mock test created! (demo mode)')
      onClose()
      setStep(1)
      setForm(initialForm)
    } catch { toast.error('Failed to create test') }
    finally { setLoading(false) }
  }

  if (!open) return null

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
                <h3 className="font-black text-lg text-slate-900">Select Questions</h3>
                <Badge variant="active">{form.questions.length} selected</Badge>
              </div>
              <p className="text-sm text-slate-500">Questions will be fetched from the question bank. In demo mode, questions are shown as placeholders.</p>
              <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto pr-2">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} onClick={() => {
                    const exists = form.questions.includes(i)
                    setForm({ ...form, questions: exists ? form.questions.filter(q => q !== i) : [...form.questions, i] })
                  }} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${form.questions.includes(i) ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-200'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${form.questions.includes(i) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {form.questions.includes(i) ? <Check size={14} /> : i}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Sample Question #{i}</p>
                      <p className="text-[11px] text-slate-400">Physics · Medium difficulty</p>
                    </div>
                  </div>
                ))}
              </div>
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

export default function MockTestsPage({ mockTests: apiTests, questions, onCreateTest }) {
  const [showCreate, setShowCreate] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const allTests = (apiTests && apiTests.length > 0) ? apiTests : mockTests
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
          { label: 'Scheduled', v: allTests.filter(t => t.status === 'scheduled').length, color: 'text-violet-600' },
          { label: 'Total Attempts', v: allTests.reduce((acc, t) => acc + (t.attempts || 0), 0), color: 'text-blue-600' },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.v}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Analytics chart */}
      <Card className="p-6">
        <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2"><BarChart2 size={16} className="text-blue-500" />Test Performance Overview</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} />
              <Bar dataKey="avg" name="Avg Score %" fill="#3b82f6" radius={[5, 5, 0, 0]} />
              <Bar dataKey="attempts" name="Attempts" fill="#a855f7" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {['all', 'active', 'scheduled', 'draft', 'completed'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Test Cards */}
      {filtered.length === 0 ? (
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
                  { l: 'Marks', v: t.totalMarks },
                  { l: 'Attempts', v: t.attempts || 0 },
                ].map(s => (
                  <div key={s.l} className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{s.l}</p>
                    <p className="font-black text-slate-900">{s.v}</p>
                  </div>
                ))}
              </div>
              {t.attempts > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Avg Score</span><span>{t.avgScore}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${t.avgScore >= 70 ? 'bg-emerald-500' : t.avgScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${t.avgScore}%` }} />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-slate-100 transition-all border border-slate-100">Analytics</button>
                <button className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"><Edit size={14} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateTestWizard open={showCreate} onClose={() => setShowCreate(false)} onSubmit={onCreateTest} questions={questions} />
    </div>
  )
}
