import { useState, useMemo } from 'react'
import { Search, Filter, Eye, ShieldOff, ShieldCheck, X, Zap, Activity, BarChart2 } from 'lucide-react'
import { Badge, Card, SectionHeader, Btn, EmptyState } from './AdminUI'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockStudents = [
  { _id: '1', name: 'Arjun Mehta', email: 'arjun.m@gmail.com', exam: 'JEE', class: '12th', xp: 18420, level: 22, isActive: true, streak: 28, accuracy: 84, attempts: 142, joinDate: '2024-08-12' },
  { _id: '2', name: 'Priya Sharma', email: 'priya.s@yahoo.com', exam: 'NEET', class: '12th', xp: 16880, level: 20, isActive: true, streak: 21, accuracy: 79, attempts: 118, joinDate: '2024-09-01' },
  { _id: '3', name: 'Siddharth Verma', email: 'siddharth.v@gmail.com', exam: 'JEE', class: '11th', xp: 15200, level: 18, isActive: true, streak: 14, accuracy: 91, attempts: 98, joinDate: '2024-10-15' },
  { _id: '4', name: 'Tanvi Kapoor', email: 'tanvi.k@gmail.com', exam: 'NEET', class: '12th', xp: 14650, level: 17, isActive: true, streak: 19, accuracy: 76, attempts: 134, joinDate: '2024-08-28' },
  { _id: '5', name: 'Rohan Verma', email: 'rohan.v@hotmail.com', exam: 'JEE', class: '12th', xp: 13900, level: 16, isActive: true, streak: 9, accuracy: 68, attempts: 89, joinDate: '2024-11-03' },
  { _id: '6', name: 'Kavya Nair', email: 'kavya.n@gmail.com', exam: 'NEET', class: '11th', xp: 12400, level: 14, isActive: false, streak: 0, accuracy: 58, attempts: 67, joinDate: '2024-12-10' },
  { _id: '7', name: 'Dev Patel', email: 'dev.p@gmail.com', exam: 'JEE', class: '12th', xp: 11800, level: 13, isActive: true, streak: 6, accuracy: 72, attempts: 104, joinDate: '2024-09-22' },
  { _id: '8', name: 'Ananya Singh', email: 'ananya.s@rediff.com', exam: 'NEET', class: '12th', xp: 10200, level: 11, isActive: false, streak: 0, accuracy: 45, attempts: 32, joinDate: '2025-01-05' },
]

const profileHistory = [
  { day: 'W1', score: 45 }, { day: 'W2', score: 58 }, { day: 'W3', score: 62 },
  { day: 'W4', score: 70 }, { day: 'W5', score: 74 }, { day: 'W6', score: 81 }, { day: 'W7', score: 84 },
]

function ProfileDrawer({ student, onClose, onToggle }) {
  if (!student) return null
  const initial = student.name[0]
  return (
    <div className="fixed inset-0 z-50 flex" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="flex-1 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Hero */}
        <div className="relative p-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
          <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all"><X size={18} /></button>
          <div className="flex items-end gap-5 mt-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-4 border-white/30 flex items-center justify-center text-3xl font-black text-white shadow-xl">{initial}</div>
            <div>
              <h2 className="text-2xl font-black text-white">{student.name}</h2>
              <p className="text-blue-200 text-xs mt-0.5">{student.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-lg uppercase">{student.exam}</span>
                <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-lg uppercase">{student.class}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Stat chips */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: 'Total XP', v: student.xp.toLocaleString(), c: 'blue' },
              { l: 'Level', v: student.level, c: 'purple' },
              { l: 'Accuracy', v: `${student.accuracy}%`, c: 'green' },
              { l: 'Streak', v: `${student.streak} 🔥`, c: 'amber' },
              { l: 'Quiz Attempts', v: student.attempts, c: 'blue' },
              { l: 'Status', v: student.isActive ? 'Active' : 'Blocked', c: student.isActive ? 'green' : 'red' },
            ].map(s => (
              <div key={s.l} className={`p-3 rounded-xl border ${s.c === 'blue' ? 'bg-blue-50 border-blue-100' : s.c === 'purple' ? 'bg-purple-50 border-purple-100' : s.c === 'green' ? 'bg-emerald-50 border-emerald-100' : s.c === 'amber' ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.l}</p>
                <p className={`font-black text-lg mt-0.5 ${s.c === 'blue' ? 'text-blue-700' : s.c === 'purple' ? 'text-purple-700' : s.c === 'green' ? 'text-emerald-700' : s.c === 'amber' ? 'text-amber-700' : 'text-rose-700'}`}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Progress chart */}
          <div>
            <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><BarChart2 size={15} className="text-blue-500" />Score Progression</p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profileHistory} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11 }} formatter={v => [`${v}%`, 'Score']} />
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} fill="url(#pGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weak topics */}
          <div>
            <p className="text-sm font-bold text-slate-700 mb-3">Weak Topics</p>
            <div className="space-y-2">
              {['Organic Chemistry', 'Electrostatics', 'Probability'].map(t => (
                <div key={t} className="flex items-center justify-between p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-xs font-semibold text-rose-700">{t}</span>
                  <Badge variant="rejected">Needs attention</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 flex gap-3">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Close</Btn>
          <Btn variant={student.isActive ? 'danger' : 'success'} className="flex-1" onClick={() => { onToggle(student); onClose() }}>
            {student.isActive ? <><ShieldOff size={14} /> Restrict</> : <><ShieldCheck size={14} /> Restore</>}
          </Btn>
        </div>
      </div>
    </div>
  )
}

export default function StudentsPage({ users: apiUsers, onToggleUser }) {
  const [search, setSearch] = useState('')
  const [examFilter, setExamFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)

  const allUsers = (apiUsers && apiUsers.length > 0) ? apiUsers : mockStudents
  const PER_PAGE = 6

  const filtered = useMemo(() => allUsers.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchExam = examFilter === 'ALL' || u.exam === examFilter
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? u.isActive : !u.isActive)
    return matchSearch && matchExam && matchStatus
  }), [allUsers, search, examFilter, statusFilter])

  const pages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleToggle = (u) => {
    if (onToggleUser) onToggleUser(u)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader
        title="Student Directory"
        subtitle={`${allUsers.length} total students · ${allUsers.filter(u => u.isActive).length} active`}
        actions={
          <div className="flex gap-3">
            <Btn variant="secondary" size="sm"><Activity size={14} /> Export</Btn>
            <Btn size="sm"><Zap size={14} /> Notify All</Btn>
          </div>
        }
      />

      <Card>
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search name or email..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 transition-all" />
          </div>
          <select value={examFilter} onChange={e => { setExamFilter(e.target.value); setPage(1) }}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 appearance-none">
            <option value="ALL">All Exams</option>
            <option value="JEE">JEE</option>
            <option value="NEET">NEET</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 appearance-none">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {/* Table */}
        {paginated.length === 0 ? (
          <EmptyState icon={Search} title="No students match" desc="Try adjusting your filters or search query." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Student', 'Exam & Class', 'XP & Level', 'Accuracy', 'Streak', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map(u => (
                  <tr key={u._id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">{u.name[0]}</div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={u.exam === 'JEE' ? 'active' : 'scheduled'}>{u.exam}</Badge>
                      <p className="text-[10px] text-slate-400 mt-1">{u.class}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-900 text-sm">{u.xp?.toLocaleString() ?? '0'} XP</p>
                      <p className="text-[10px] text-slate-400">Level {u.level}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${(u.accuracy || 0) >= 75 ? 'bg-emerald-500' : (u.accuracy || 0) >= 55 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${u.accuracy || 0}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{u.accuracy || 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-800 text-sm">{u.streak ?? 0}</span>
                      <span className="text-sm ml-0.5">🔥</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={u.isActive ? 'approved' : 'blocked'} dot>{u.isActive ? 'Active' : 'Blocked'}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelected(u)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="View Profile"><Eye size={15} /></button>
                        <button onClick={() => handleToggle(u)} className={`p-2 rounded-lg transition-all ${u.isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                          {u.isActive ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-1">
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === page ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <ProfileDrawer student={selected} onClose={() => setSelected(null)} onToggle={handleToggle} />
    </div>
  )
}
