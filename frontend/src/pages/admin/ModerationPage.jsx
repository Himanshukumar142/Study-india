import { useState } from 'react'
import { AlertTriangle, Flag, User, Clock, Check, X, Shield, Eye, BarChart2, Activity } from 'lucide-react'
import { Badge, Card, SectionHeader, Btn, EmptyState } from './AdminUI'

const mockReports = [
  { _id: 'r1', type: 'content', reporter: 'Arjun Mehta', target: 'Wave Optics Notes', reason: 'Incorrect information — wrong formula on page 12', severity: 'medium', status: 'pending', time: '2 hours ago' },
  { _id: 'r2', type: 'user', reporter: 'Priya Sharma', target: 'dev.p@gmail.com', reason: 'Sharing answer keys in study group chat', severity: 'high', status: 'pending', time: '5 hours ago' },
  { _id: 'r3', type: 'content', reporter: 'Rohan Verma', target: 'Chemistry PYQ 2022', reason: 'Duplicate upload already exists in library', severity: 'low', status: 'resolved', time: '1 day ago' },
  { _id: 'r4', type: 'spam', reporter: 'System AI', target: 'kavya.n@gmail.com', reason: 'Automated detection: 12 reports filed in 30 min', severity: 'critical', status: 'action_taken', time: '2 days ago' },
  { _id: 'r5', type: 'content', reporter: 'Tanvi Kapoor', target: 'Maths Formula Sheet', reason: 'Copied from copyrighted textbook without attribution', severity: 'high', status: 'pending', time: '3 hours ago' },
]

const flaggedUsers = [
  { name: 'Kavya Nair', email: 'kavya.n@gmail.com', flags: 12, risk: 'High', status: 'restricted', reason: 'Automated spam detection' },
  { name: 'Dev Patel', email: 'dev.p@gmail.com', flags: 3, risk: 'Medium', status: 'warning', reason: 'Answer key sharing' },
]

const severityStyle = {
  low: 'bg-slate-50 text-slate-600 border-slate-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  high: 'bg-rose-50 text-rose-600 border-rose-200',
  critical: 'bg-rose-600 text-white border-rose-700',
}

const typeIcon = {
  content: { icon: Flag, color: 'bg-blue-50 text-blue-600' },
  user: { icon: User, color: 'bg-rose-50 text-rose-600' },
  spam: { icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
}

export default function ModerationPage() {
  const [reports, setReports] = useState(mockReports)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)
  const pending = reports.filter(r => r.status === 'pending').length
  const resolved = reports.filter(r => r.status === 'resolved').length
  const actioned = reports.filter(r => r.status === 'action_taken').length

  const resolve = (id) => setReports(prev => prev.map(r => r._id === id ? { ...r, status: 'resolved' } : r))
  const action = (id) => setReports(prev => prev.map(r => r._id === id ? { ...r, status: 'action_taken' } : r))

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader
        title="Moderation Center"
        subtitle="Review reports, flags, and content violations"
        actions={<Badge variant="critical" dot>{pending} pending</Badge>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', v: reports.length, icon: Flag, bg: 'bg-blue-50 text-blue-600' },
          { label: 'Pending', v: pending, icon: Clock, bg: 'bg-amber-50 text-amber-600' },
          { label: 'Resolved', v: resolved, icon: Check, bg: 'bg-emerald-50 text-emerald-600' },
          { label: 'Action Taken', v: actioned, icon: Shield, bg: 'bg-rose-50 text-rose-600' },
        ].map(s => (
          <Card key={s.label} className="p-5 hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><s.icon size={18} /></div>
            <p className="text-2xl font-black text-slate-900">{s.v}</p>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* AI Detection Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white flex items-center gap-4 shadow-lg shadow-rose-500/20">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><Activity size={20} /></div>
        <div className="flex-1">
          <p className="font-black text-sm">Spam AI detected unusual activity from kavya.n@gmail.com</p>
          <p className="text-rose-100 text-xs mt-0.5">12 reports filed within 30 minutes. Account has been auto-restricted pending review.</p>
        </div>
        <button className="flex-shrink-0 px-4 py-2 bg-white text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-50 transition-all">Review</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Report Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {[['all', 'All'], ['pending', 'Pending'], ['resolved', 'Resolved'], ['action_taken', 'Actioned']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{l}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card><EmptyState icon={Flag} title="No reports" desc="All caught up! No reports matching this filter." /></Card>
          ) : filtered.map(r => {
            const T = typeIcon[r.type] || typeIcon.content
            return (
              <Card key={r._id} className="p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${T.color} flex items-center justify-center flex-shrink-0`}><T.icon size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-slate-900 text-sm">{r.target}</p>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase ${severityStyle[r.severity]}`}>{r.severity}</span>
                      <Badge variant={r.status === 'pending' ? 'pending' : r.status === 'resolved' ? 'approved' : 'warning'}>{r.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{r.reason}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><User size={10} /> Reported by {r.reporter}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{r.time}</span>
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => resolve(r._id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 border border-emerald-200 transition-all">
                          <Check size={12} /> Resolve
                        </button>
                        <button onClick={() => action(r._id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 border border-rose-200 transition-all">
                          <Shield size={12} /> Take Action
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 border border-slate-200 transition-all">
                          <Eye size={12} /> View
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Flagged Users + Stats */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" />Flagged Users</h3>
            <div className="space-y-3">
              {flaggedUsers.map(u => (
                <div key={u.email} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-900">{u.name}</p>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg border ${u.risk === 'High' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>{u.risk} Risk</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{u.email}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{u.reason}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] font-bold text-rose-600">{u.flags} flags</span>
                    <div className="flex gap-1.5">
                      <button className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"><Check size={12} /></button>
                      <button className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all"><X size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-blue-500" />Report Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Content Issues', count: 3, pct: 60, color: 'bg-blue-500' },
                { label: 'User Reports', count: 1, pct: 20, color: 'bg-rose-500' },
                { label: 'Spam / Bot', count: 1, pct: 20, color: 'bg-amber-500' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{s.label}</span>
                    <span className="font-bold text-slate-500">{s.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-slate-900 border-slate-800">
            <h3 className="font-black text-white mb-3">Action History</h3>
            <div className="space-y-3">
              {[
                { action: 'Restricted kavya.n@gmail.com', time: '2d ago', color: 'bg-rose-500' },
                { action: 'Approved Wave Optics Notes', time: '3d ago', color: 'bg-emerald-500' },
                { action: 'Removed Spam Content ×3', time: '5d ago', color: 'bg-amber-500' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.color}`} />
                  <p className="text-xs text-slate-300 flex-1">{a.action}</p>
                  <span className="text-[10px] text-slate-500">{a.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
