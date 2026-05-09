import { useState, useEffect } from 'react'
import { Calendar, Plus, CheckCircle2, Circle, Clock, Trash2, Edit3, X, Save, ChevronLeft, ChevronRight, BarChart2, Target, BookOpen, Zap, Flame } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']
const DURATIONS = [15, 30, 45, 60, 90, 120]
const SUBJECT_COLORS = {
  Physics: 'bg-blue-50 text-blue-600 border-blue-200',
  Chemistry: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Mathematics: 'bg-violet-50 text-violet-600 border-violet-200',
  Biology: 'bg-amber-50 text-amber-600 border-amber-200',
}

const getDateStr = (d) => d.toISOString().split('T')[0]
const formatDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

export default function StudyPlannerPage() {
  const today = getDateStr(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [plan, setPlan] = useState(null)
  const [weekData, setWeekData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editIndex, setEditIndex] = useState(null)
  const [form, setForm] = useState({ subject: 'Physics', chapter: '', description: '', duration: 60 })

  useEffect(() => { fetchPlan(); fetchWeek() }, [selectedDate])

  const fetchPlan = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/study-plan?date=${selectedDate}`)
      setPlan(data.data)
    } catch { setPlan({ date: selectedDate, tasks: [], totalPlanned: 0, totalCompleted: 0 }) }
    finally { setLoading(false) }
  }

  const fetchWeek = async () => {
    try {
      const { data } = await api.get('/study-plan/week')
      setWeekData(data.data || [])
    } catch {}
  }

  const saveTasks = async (tasks) => {
    try {
      const { data } = await api.post('/study-plan', { date: selectedDate, tasks, note: plan?.note || '' })
      setPlan(data.data)
      fetchWeek()
    } catch { toast.error('Failed to save') }
  }

  const handleAddTask = () => {
    if (!form.description.trim()) { toast.error('Task description required'); return }
    const tasks = [...(plan?.tasks || []), { ...form, completed: false }]
    saveTasks(tasks)
    setShowAdd(false)
    setForm({ subject: 'Physics', chapter: '', description: '', duration: 60 })
    toast.success('Task added!')
  }

  const handleEditTask = () => {
    if (editIndex === null) return
    const tasks = [...(plan?.tasks || [])]
    tasks[editIndex] = { ...tasks[editIndex], ...form }
    saveTasks(tasks)
    setEditIndex(null)
    setShowAdd(false)
    toast.success('Task updated!')
  }

  const handleToggle = async (idx) => {
    try {
      await api.patch(`/study-plan/task/${idx}`, { date: selectedDate })
      fetchPlan()
      fetchWeek()
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (idx) => {
    try {
      await api.delete(`/study-plan/task/${idx}`, { data: { date: selectedDate } })
      fetchPlan()
      fetchWeek()
      toast.success('Task removed')
    } catch { toast.error('Failed') }
  }

  const openEdit = (idx) => {
    const t = plan.tasks[idx]
    setForm({ subject: t.subject, chapter: t.chapter || '', description: t.description, duration: t.duration })
    setEditIndex(idx)
    setShowAdd(true)
  }

  const changeDate = (delta) => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setSelectedDate(getDateStr(d))
  }

  const tasks = plan?.tasks || []
  const totalMin = tasks.reduce((s, t) => s + (t.duration || 0), 0)
  const doneMin = tasks.filter(t => t.completed).reduce((s, t) => s + (t.duration || 0), 0)
  const pct = totalMin > 0 ? Math.round((doneMin / totalMin) * 100) : 0
  const isToday = selectedDate === today

  // Week mini bars
  const weekDays = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = getDateStr(d)
    const wd = weekData.find(w => w.date === ds)
    weekDays.push({
      date: ds,
      day: d.toLocaleDateString('en-IN', { weekday: 'narrow' }),
      planned: wd?.totalPlanned || 0,
      completed: wd?.totalCompleted || 0,
      isToday: ds === today,
      isSelected: ds === selectedDate,
    })
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl shadow-cyan-500/20 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-teal-200" />
            <span className="text-teal-200 text-xs font-bold uppercase tracking-widest">Daily Planner</span>
          </div>
          <h1 className="text-3xl font-black mb-4">Study Plan</h1>

          {/* Week overview mini */}
          <div className="flex gap-2">
            {weekDays.map(w => (
              <button key={w.date} onClick={() => setSelectedDate(w.date)}
                className={`flex-1 rounded-xl p-2 text-center transition-all ${w.isSelected ? 'bg-white/20 ring-2 ring-white/40' : 'bg-white/10 hover:bg-white/15'}`}>
                <p className="text-[10px] font-bold text-white/60">{w.day}</p>
                <div className="h-8 flex items-end justify-center mt-1">
                  <div className="w-2 rounded-full bg-white/30 relative" style={{ height: `${Math.min(Math.max(w.planned / 4, 4), 28)}px` }}>
                    {w.completed > 0 && (
                      <div className="absolute bottom-0 w-full bg-emerald-300 rounded-full" style={{ height: `${w.planned > 0 ? (w.completed / w.planned) * 100 : 0}%` }} />
                    )}
                  </div>
                </div>
                {w.isToday && <div className="w-1 h-1 bg-yellow-300 rounded-full mx-auto mt-1" />}
              </button>
            ))}
          </div>
        </div>

        {/* Date nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => changeDate(-1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"><ChevronLeft size={18} className="text-slate-500" /></button>
          <div className="text-center">
            <p className="font-black text-slate-900">{formatDate(selectedDate)}</p>
            {isToday && <p className="text-[10px] text-cyan-600 font-bold">Today</p>}
          </div>
          <button onClick={() => changeDate(1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"><ChevronRight size={18} className="text-slate-500" /></button>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Daily Progress</span>
            <span className="text-xs font-black text-slate-900">{pct}% • {doneMin}m / {totalMin}m</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-cyan-500' : 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-3 mt-3">
            {[
              { l: 'Tasks', v: `${tasks.filter(t => t.completed).length}/${tasks.length}`, c: 'text-blue-600' },
              { l: 'Subjects', v: [...new Set(tasks.map(t => t.subject))].length, c: 'text-violet-600' },
            ].map(s => (
              <span key={s.l} className="text-[11px] text-slate-400 font-semibold"><span className={`font-black ${s.c}`}>{s.v}</span> {s.l}</span>
            ))}
          </div>
        </div>

        {/* Task list */}
        {loading ? (
          <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-20 border border-slate-100" />)}</div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
            <h3 className="font-black text-slate-900 mb-1">No Tasks Yet</h3>
            <p className="text-sm text-slate-400 mb-4">Plan your study day by adding tasks</p>
            <button onClick={() => { setShowAdd(true); setEditIndex(null) }}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 mx-auto">
              <Plus size={15} /> Add First Task
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((t, i) => {
              const colorClass = SUBJECT_COLORS[t.subject] || 'bg-slate-50 text-slate-600 border-slate-200'
              return (
                <div key={i} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 group transition-all hover:shadow-md ${t.completed ? 'border-emerald-100 opacity-70' : 'border-slate-100'}`}>
                  <button onClick={() => handleToggle(i)} className="flex-shrink-0">
                    {t.completed
                      ? <CheckCircle2 size={22} className="text-emerald-500" />
                      : <Circle size={22} className="text-slate-300 hover:text-cyan-500 transition-colors" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${t.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>{t.description}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded border ${colorClass}`}>{t.subject}</span>
                      {t.chapter && <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-bold rounded">{t.chapter}</span>}
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-bold rounded flex items-center gap-0.5"><Clock size={8} /> {t.duration}m</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(i)} className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Edit3 size={13} /></button>
                    <button onClick={() => handleDelete(i)} className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add task FAB */}
        {!showAdd && tasks.length > 0 && (
          <button onClick={() => { setShowAdd(true); setEditIndex(null); setForm({ subject: 'Physics', chapter: '', description: '', duration: 60 }) }}
            className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center hover:scale-110 transition-transform z-30">
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* Add/Edit modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-900">{editIndex !== null ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => { setShowAdd(false); setEditIndex(null) }} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200"><X size={16} /></button>
            </div>

            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What will you study?"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-cyan-400 resize-none font-semibold" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject</p>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Chapter</p>
                <input value={form.chapter} onChange={e => setForm({ ...form, chapter: e.target.value })} placeholder="Optional"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Duration</p>
              <div className="flex gap-2 flex-wrap">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setForm({ ...form, duration: d })}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${form.duration === d ? 'bg-cyan-600 border-cyan-600 text-white shadow-md' : 'border-slate-200 text-slate-500'}`}>
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            <button onClick={editIndex !== null ? handleEditTask : handleAddTask}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-black text-sm shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
              <Save size={15} /> {editIndex !== null ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
