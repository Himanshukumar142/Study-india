import { Activity, TrendingUp, TrendingDown, Zap, Brain, Target, BookOpen, Award } from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'
import { Card, Badge, SectionHeader } from './AdminUI'

const radarData = [
  { subject: 'Physics', score: 82, avg: 65 },
  { subject: 'Chemistry', score: 61, avg: 72 },
  { subject: 'Maths', score: 91, avg: 78 },
  { subject: 'Biology', score: 74, avg: 69 },
  { subject: 'English', score: 45, avg: 55 },
]

const retentionData = [
  { week: 'W1', retention: 88 }, { week: 'W2', retention: 82 }, { week: 'W3', retention: 79 },
  { week: 'W4', retention: 74 }, { week: 'W5', retention: 71 }, { week: 'W6', retention: 68 },
  { week: 'W7', retention: 72 }, { week: 'W8', retention: 76 },
]

const weakChapters = [
  { chapter: 'Organic Chemistry – Reactions', subject: 'Chemistry', accuracy: 38, students: 842 },
  { chapter: 'Electrostatics', subject: 'Physics', accuracy: 44, students: 714 },
  { chapter: 'Probability & Statistics', subject: 'Maths', accuracy: 47, students: 680 },
  { chapter: 'Genetics & Evolution', subject: 'Biology', accuracy: 49, students: 521 },
  { chapter: 'Thermodynamics', subject: 'Physics', accuracy: 52, students: 490 },
]

const topQuizzes = [
  { name: 'JEE Mains Full Mock #3', attempts: 1284, avgScore: 68, completion: 82 },
  { name: 'NEET Chapter: Genetics', attempts: 942, avgScore: 54, completion: 74 },
  { name: 'Physics – Wave Optics', attempts: 887, avgScore: 61, completion: 79 },
  { name: 'Chemistry – p-Block', attempts: 732, avgScore: 47, completion: 65 },
]

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

const subBar = [
  { sub: 'Physics', jee: 72, neet: 58 },
  { sub: 'Chemistry', jee: 61, neet: 66 },
  { sub: 'Maths', jee: 79, neet: 0 },
  { sub: 'Biology', jee: 0, neet: 71 },
]

export default function IntelligencePage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-400">
      <SectionHeader
        title="AI Intelligence Analytics"
        subtitle="AI-powered insights · student health · engagement trends"
        actions={<Badge variant="active" dot>AI Engine Active</Badge>}
      />

      {/* AI Recommendation Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center gap-5 shadow-xl shadow-blue-500/20">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
          <Brain size={24} />
        </div>
        <div className="flex-1">
          <p className="font-black text-base">System Detected: Organic Chemistry Engagement Drop</p>
          <p className="text-blue-100 text-xs mt-0.5">842 students averaging {'<'}40% accuracy in Organic Reactions. Recommend scheduling a remedial mock test and push notification.</p>
        </div>
        <button className="flex-shrink-0 px-5 py-2.5 bg-white text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-50 transition-all shadow-lg">Take Action</button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: Target, label: 'Avg Platform Accuracy', value: '64%', gradient: 'from-blue-500 to-indigo-600', trend: '+3.2%' },
          { icon: Zap, label: 'Avg Study Streak', value: '14 days', gradient: 'from-amber-500 to-orange-500', trend: '+1.4d' },
          { icon: Award, label: 'Top Performer XP', value: '18.4k', gradient: 'from-emerald-500 to-teal-600', trend: '+620 XP' },
          { icon: BookOpen, label: 'Content Engagements', value: '98.2k', gradient: 'from-violet-500 to-purple-600', trend: '+12.1%' },
        ].map(s => (
          <Card key={s.label} className="p-5 hover:shadow-lg transition-all duration-200">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md mb-4`}>
              <s.icon size={18} className="text-white" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1"><TrendingUp size={11} />{s.trend} vs last week</p>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Retention Graph */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-slate-900">Student Retention Curve</h3>
              <p className="text-xs text-slate-400 mt-0.5">% of students returning each week</p>
            </div>
            <Badge variant="info">8 Weeks</Badge>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={retentionData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <defs>
                  <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} domain={[50, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} formatter={v => [`${v}%`, 'Retention']} />
                <Area type="monotone" dataKey="retention" stroke="#6366f1" strokeWidth={3} fill="url(#retGrad)" dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
            <TrendingDown size={16} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-semibold">Retention dipped in W4–W6. Correlates with mock test schedule gap. Suggest weekly content push.</p>
          </div>
        </Card>

        {/* Radar */}
        <Card className="p-6">
          <h3 className="font-black text-slate-900 mb-1">Subject Health Radar</h3>
          <p className="text-xs text-slate-400 mb-4">Platform avg score by subject</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <PolarRadiusAxis hide />
                <Radar name="Platform" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.35} />
                <Radar name="Average" dataKey="avg" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} strokeDasharray="4 2" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-0.5 bg-indigo-600 rounded-full inline-block" />Platform</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-0.5 bg-purple-400 rounded-full inline-block border-dashed" />National Avg</div>
          </div>
        </Card>
      </div>

      {/* Weak Chapters + Top Quizzes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weak Chapters */}
        <Card className="p-6">
          <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2">
            <TrendingDown size={18} className="text-rose-500" /> Weak Chapters Across Platform
          </h3>
          <div className="space-y-3">
            {weakChapters.map((c, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-rose-50/50 transition-all group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white ${c.accuracy < 40 ? 'bg-rose-500' : c.accuracy < 50 ? 'bg-amber-500' : 'bg-blue-500'}`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{c.chapter}</p>
                  <p className="text-[10px] text-slate-400">{c.subject} · {c.students.toLocaleString()} students</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-sm ${c.accuracy < 40 ? 'text-rose-600' : c.accuracy < 50 ? 'text-amber-600' : 'text-blue-600'}`}>{c.accuracy}%</p>
                  <p className="text-[10px] text-slate-400">avg acc</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all border border-rose-100">Generate Remedial Content Pack</button>
        </Card>

        {/* Most Attempted Quizzes */}
        <Card className="p-6">
          <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" /> Most Attempted Quizzes
          </h3>
          <div className="space-y-4">
            {topQuizzes.map((q, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors pr-2">{q.name}</p>
                  <Badge variant="active">{q.attempts} attempts</Badge>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400">Avg Score</p>
                    <p className="text-sm font-black text-slate-700">{q.avgScore}%</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 mb-1">Completion Rate</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${q.completion}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">{q.completion}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* JEE vs NEET Subject Comparison */}
      <Card className="p-6">
        <h3 className="font-black text-slate-900 mb-5">JEE vs NEET — Subject Accuracy Comparison</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subBar} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="sub" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} unit="%" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} formatter={v => [`${v}%`]} />
              <Bar dataKey="jee" name="JEE" fill="#3b82f6" radius={[5, 5, 0, 0]} />
              <Bar dataKey="neet" name="NEET" fill="#a855f7" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
