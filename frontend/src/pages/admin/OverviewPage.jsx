import { Users, Activity, CheckCircle2, HardDrive, BookOpen, Zap, Clock, AlertTriangle, TrendingUp, Download, ArrowUpRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { StatCard, Card } from './AdminUI'

const growthData = [
  { day: 'Mon', users: 120, quizzes: 80 },
  { day: 'Tue', users: 195, quizzes: 130 },
  { day: 'Wed', users: 160, quizzes: 145 },
  { day: 'Thu', users: 248, quizzes: 200 },
  { day: 'Fri', users: 220, quizzes: 235 },
  { day: 'Sat', users: 310, quizzes: 280 },
  { day: 'Sun', users: 420, quizzes: 380 },
]

const subjectData = [
  { sub: 'Physics', attempts: 4200, avg: 62 },
  { sub: 'Chemistry', attempts: 3800, avg: 58 },
  { sub: 'Maths', attempts: 5100, avg: 71 },
  { sub: 'Biology', attempts: 2900, avg: 65 },
]

const recentActivity = [
  { user: 'Himanshu S.', action: 'Filed a content report', time: 'Just now', color: 'from-rose-500 to-pink-600', icon: '⚠️' },
  { user: 'Arjun Mehta', action: 'Reached Level 18 · 9800 XP', time: '4m ago', color: 'from-emerald-500 to-teal-600', icon: '🏆' },
  { user: 'Priya Sharma', action: 'Uploaded Physics notes (12 MB)', time: '11m ago', color: 'from-blue-500 to-indigo-600', icon: '📚' },
  { user: 'System', action: 'B2 storage sync completed', time: '18m ago', color: 'from-violet-500 to-purple-600', icon: '💾' },
  { user: 'Rohan Verma', action: 'Completed NEET Mock · 312/720', time: '32m ago', color: 'from-amber-500 to-orange-600', icon: '📝' },
  { user: 'Admin', action: 'API key rotation scheduled', time: '1h ago', color: 'from-slate-400 to-slate-500', icon: '🔑' },
]

const topStudents = [
  { name: 'Arjun Mehta', xp: 18420, level: 22, accuracy: 84, exam: 'JEE', streak: 28 },
  { name: 'Priya Sharma', xp: 16880, level: 20, accuracy: 79, exam: 'NEET', streak: 21 },
  { name: 'Siddharth V.', xp: 15200, level: 18, accuracy: 91, exam: 'JEE', streak: 14 },
  { name: 'Tanvi Kapoor', xp: 14650, level: 17, accuracy: 76, exam: 'NEET', streak: 19 },
  { name: 'Rohan Verma', xp: 13900, level: 16, accuracy: 68, exam: 'JEE', streak: 9 },
]

export default function OverviewPage({ stats, onCreateTest, onAddQuestion }) {
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-400">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{greeting}, Admin 👋</h1>
          <p className="text-slate-400 text-sm font-medium mt-1 flex items-center gap-2">
            <Clock size={14} />
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} &nbsp;·&nbsp; Platform is healthy
            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />Live</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <Download size={14} /> Export Report
          </button>
          <button onClick={onCreateTest} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all">
            <Zap size={14} /> New Mock Test
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Students" value={stats?.totalUsers ?? '2,841'} icon={Users} gradient="from-blue-500 to-indigo-600" trend="+14.2%" pct={78} />
        <StatCard label="Active Today" value="482" icon={Activity} gradient="from-rose-500 to-pink-600" trend="+5.1%" pct={42} />
        <StatCard label="Quiz Attempts" value={stats?.totalAttempts ?? '18.4k'} icon={CheckCircle2} gradient="from-violet-500 to-purple-600" trend="+22.8%" pct={89} />
        <StatCard label="Storage Used" value="1.8 TB" icon={HardDrive} gradient="from-amber-500 to-orange-500" subtitle="/ 2 TB" pct={90} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Uploaded Notes" value="12,482" icon={BookOpen} gradient="from-teal-500 to-emerald-600" trend="+128 this month" />
        <StatCard label="Study Hours" value="48,200" icon={Clock} gradient="from-sky-500 to-cyan-600" trend="+8.3%" />
        <StatCard label="Pending Approvals" value={stats?.pendingContent ?? 7} icon={AlertTriangle} gradient="from-amber-500 to-yellow-500" trend="Needs review" />
        <StatCard label="Active Reports" value="3" icon={AlertTriangle} gradient="from-rose-500 to-red-600" trend="Unresolved" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div onClick={onCreateTest} className="cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:scale-[1.02] transition-all duration-200 shadow-xl shadow-blue-500/25 relative overflow-hidden group">
          <Zap size={72} className="absolute -right-3 -bottom-3 opacity-10 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg uppercase tracking-wider">Quick Action</span>
            <h3 className="text-xl font-black mt-3 mb-1">Create Mock Test</h3>
            <p className="text-blue-100 text-xs leading-relaxed opacity-90">Deploy JEE/NEET pattern exam to all students instantly.</p>
            <div className="mt-5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest">Launch Wizard <ArrowUpRight size={14} /></div>
          </div>
        </div>
        <div onClick={onAddQuestion} className="cursor-pointer p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 group relative overflow-hidden">
          <div className="relative">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-wider">Repository</span>
            <h3 className="text-xl font-black mt-3 mb-1 text-slate-900 group-hover:text-blue-600 transition-colors">Add Question</h3>
            <p className="text-slate-400 text-xs leading-relaxed">Add individual questions to the question bank.</p>
            <div className="mt-5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-blue-600">Open Bank <ArrowUpRight size={14} /></div>
          </div>
        </div>
        <Card className="p-6 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-xl"><Activity size={18} className="text-emerald-400" /></div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">System Health</span>
          </div>
          <h4 className="text-white font-black text-lg mb-1">All Systems Normal</h4>
          <p className="text-slate-400 text-xs leading-relaxed mb-5">API, B2 Storage, and Authentication are operating at 100% uptime.</p>
          <div className="space-y-2">
            {[['API Server', 99.98], ['B2 Storage', 100], ['Auth Layer', 99.9]].map(([s, v]) => (
              <div key={s} className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">{s}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${v}%` }} />
                  </div>
                  <span className="text-emerald-400 text-[11px] font-bold">{v}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Growth Chart */}
        <Card className="xl:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-slate-900">Platform Growth</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Daily users & quiz activity</p>
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {['1W', '1M', '3M'].map((t, i) => (
                <button key={t} className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${i === 0 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <defs>
                  <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gQuizzes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={8} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 700 }} />
                <Area type="monotone" dataKey="users" name="Users" stroke="#2563eb" strokeWidth={3} fill="url(#gUsers)" dot={false} activeDot={{ r: 5, fill: '#2563eb' }} />
                <Area type="monotone" dataKey="quizzes" name="Quizzes" stroke="#a855f7" strokeWidth={3} strokeDasharray="6 3" fill="url(#gQuizzes)" dot={false} activeDot={{ r: 5, fill: '#a855f7' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-3">
            {[{ label: 'Students', color: 'bg-blue-600' }, { label: 'Quiz Attempts', color: 'bg-purple-500' }].map(l => (
              <div key={l.label} className="flex items-center gap-2 text-xs text-slate-500">
                <span className={`w-3 h-3 rounded-full ${l.color}`} />{l.label}
              </div>
            ))}
          </div>
        </Card>

        {/* Live Activity Feed */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-slate-900">Live Activity</h3>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />Live
            </span>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 280 }}>
            {recentActivity.map((a, i) => (
              <div key={i} className="flex gap-3 items-start group">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-sm flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{a.user}</p>
                  <p className="text-[11px] text-slate-400 truncate">{a.action}</p>
                </div>
                <span className="text-[10px] text-slate-300 whitespace-nowrap font-medium">{a.time}</span>
              </div>
            ))}
          </div>
          <button className="mt-5 w-full py-2.5 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all uppercase tracking-wider">View All Trails</button>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Top Students */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-slate-900 flex items-center gap-2"><TrendingUp size={18} className="text-blue-600" /> Top Students</h3>
            <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {topStudents.map((s, i) => (
              <div key={s.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all group cursor-default">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {i + 1}
                </div>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-sm`}>{s.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{s.name}</p>
                  <p className="text-[10px] text-slate-400">Level {s.level} · {s.exam} · {s.streak}🔥 streak</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-800">{s.xp.toLocaleString()} XP</p>
                  <p className="text-[10px] text-emerald-600 font-bold">{s.accuracy}% acc</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Subject Stats */}
        <Card className="p-6">
          <h3 className="font-black text-slate-900 mb-5">Subject Performance</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="sub" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} />
                <Bar dataKey="attempts" name="Attempts" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="avg" name="Avg Score %" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {subjectData.map(s => (
              <div key={s.sub} className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-700">{s.sub}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-400">{s.attempts.toLocaleString()} attempts</span>
                  <span className={`text-[11px] font-bold ${s.avg >= 70 ? 'text-emerald-600' : s.avg >= 55 ? 'text-amber-600' : 'text-rose-600'}`}>{s.avg}%</span>
                </div>
                <div className="mt-1.5 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.avg}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
