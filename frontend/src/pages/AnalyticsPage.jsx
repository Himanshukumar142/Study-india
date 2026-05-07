import { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, Target, Clock, Zap, CheckCircle2, XCircle, BookOpen, ChevronDown, Flame, Award, Brain } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/quizzes/attempts').then(r => setAttempts(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-full flex items-center justify-center bg-[#f8fafc]">
      <div className="w-12 h-12 relative"><div className="absolute inset-0 border-4 border-slate-200 rounded-full" /><div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
    </div>
  )

  // ── Compute analytics ──────────────────────────────────────
  const completed = attempts.filter(a => a.status === 'completed')
  const totalQuizzes = completed.length
  const totalCorrect = completed.reduce((s, a) => s + (a.correct || 0), 0)
  const totalWrong = completed.reduce((s, a) => s + (a.wrong || 0), 0)
  const totalSkipped = completed.reduce((s, a) => s + (a.skipped || 0), 0)
  const totalQuestions = totalCorrect + totalWrong + totalSkipped
  const avgAccuracy = totalQuizzes > 0 ? Math.round(completed.reduce((s, a) => s + (a.accuracy || 0), 0) / totalQuizzes) : 0
  const totalXP = completed.reduce((s, a) => s + (a.xpAwarded || 0), 0)
  const avgTime = totalQuizzes > 0 ? Math.round(completed.reduce((s, a) => s + (a.timeTakenSeconds || 0), 0) / totalQuizzes) : 0

  // Accuracy trend (last 15 quizzes)
  const trendData = completed.slice(-15).map((a, i) => ({
    name: `Q${i + 1}`,
    accuracy: a.accuracy || 0,
    marks: a.obtainedMarks || 0,
  }))

  // Subject breakdown
  const subjectMap = {}
  completed.forEach(a => {
    const sub = a.subject || 'Other'
    if (!subjectMap[sub]) subjectMap[sub] = { correct: 0, wrong: 0, skipped: 0, count: 0, totalAcc: 0 }
    subjectMap[sub].correct += (a.correct || 0)
    subjectMap[sub].wrong += (a.wrong || 0)
    subjectMap[sub].skipped += (a.skipped || 0)
    subjectMap[sub].count++
    subjectMap[sub].totalAcc += (a.accuracy || 0)
  })
  const subjectData = Object.entries(subjectMap).map(([name, d]) => ({
    name, correct: d.correct, wrong: d.wrong, skipped: d.skipped, avg: Math.round(d.totalAcc / d.count),
  }))

  // Pie data
  const pieData = [
    { name: 'Correct', value: totalCorrect, color: '#10b981' },
    { name: 'Wrong', value: totalWrong, color: '#ef4444' },
    { name: 'Skipped', value: totalSkipped, color: '#94a3b8' },
  ].filter(d => d.value > 0)

  // Difficulty breakdown
  const diffMap = { easy: 0, medium: 0, hard: 0 }
  completed.forEach(a => {
    const d = a.difficulty || 'medium'
    diffMap[d] = (diffMap[d] || 0) + 1
  })

  // Weekly activity (last 7 days)
  const weekData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayAttempts = completed.filter(a => a.createdAt?.startsWith(dateStr))
    weekData.push({
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      quizzes: dayAttempts.length,
      accuracy: dayAttempts.length > 0 ? Math.round(dayAttempts.reduce((s, a) => s + (a.accuracy || 0), 0) / dayAttempts.length) : 0,
    })
  }

  // Weakest chapters
  const chapterMap = {}
  completed.forEach(a => {
    const ch = a.chapter || 'General'
    if (!chapterMap[ch]) chapterMap[ch] = { correct: 0, total: 0 }
    chapterMap[ch].correct += (a.correct || 0)
    chapterMap[ch].total += (a.correct || 0) + (a.wrong || 0)
  })
  const weakChapters = Object.entries(chapterMap)
    .map(([name, d]) => ({ name, accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0, total: d.total }))
    .filter(c => c.total >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5)

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={18} className="text-cyan-200" />
            <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">Your Performance</span>
          </div>
          <h1 className="text-3xl font-black mb-5">Analytics Dashboard</h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { l: 'Quizzes', v: totalQuizzes, icon: Target, c: 'bg-white/10' },
              { l: 'Accuracy', v: `${avgAccuracy}%`, icon: TrendingUp, c: 'bg-white/10' },
              { l: 'XP Earned', v: totalXP.toLocaleString(), icon: Zap, c: 'bg-yellow-400/20' },
              { l: 'Avg Time', v: `${Math.floor(avgTime / 60)}m ${avgTime % 60}s`, icon: Clock, c: 'bg-white/10' },
            ].map(s => (
              <div key={s.l} className={`${s.c} rounded-2xl p-4 backdrop-blur-sm`}>
                <s.icon size={18} className="text-white/60 mb-2" />
                <p className="text-2xl font-black">{s.v}</p>
                <p className="text-[11px] font-bold text-white/60">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 1: Accuracy Trend + Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Accuracy trend */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" /> Accuracy Trend (Last 15 Quizzes)
            </h3>
            {trendData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} />
                    <Area type="monotone" dataKey="accuracy" stroke="#4f46e5" strokeWidth={2.5} fill="url(#accGrad)" dot={{ r: 4, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-400 text-sm py-12 text-center">Take some quizzes to see your trend!</p>
            )}
          </div>

          {/* Pie chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-slate-900 text-sm mb-4">Answer Distribution</h3>
            {pieData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" strokeWidth={0}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-400 text-sm py-12 text-center">No data yet</p>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <span className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Subject performance + Weekly activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Subject bar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-violet-500" /> Subject Performance
            </h3>
            {subjectData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} />
                    <Bar dataKey="correct" name="Correct" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="wrong" name="Wrong" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-400 text-sm py-12 text-center">No subject data yet</p>
            )}
          </div>

          {/* Weekly activity */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Flame size={16} className="text-amber-500" /> Weekly Activity
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} />
                  <Bar dataKey="quizzes" name="Quizzes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Weak chapters + Stats cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Weak chapters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Brain size={16} className="text-rose-500" /> Weakest Chapters
            </h3>
            {weakChapters.length > 0 ? (
              <div className="space-y-3">
                {weakChapters.map((ch, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">{ch.name}</span>
                      <span className={`text-xs font-black ${ch.accuracy < 40 ? 'text-rose-600' : ch.accuracy < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>{ch.accuracy}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${ch.accuracy < 40 ? 'bg-rose-500' : ch.accuracy < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${ch.accuracy}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm py-8 text-center">Need more quiz data to identify weak areas</p>
            )}
          </div>

          {/* Detailed stats */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Award size={16} className="text-blue-500" /> Performance Summary
            </h3>
            <div className="space-y-3">
              {[
                { l: 'Total Questions Attempted', v: totalQuestions, icon: Target, c: 'text-blue-600 bg-blue-50' },
                { l: 'Correct Answers', v: totalCorrect, icon: CheckCircle2, c: 'text-emerald-600 bg-emerald-50' },
                { l: 'Wrong Answers', v: totalWrong, icon: XCircle, c: 'text-rose-600 bg-rose-50' },
                { l: 'Questions Skipped', v: totalSkipped, icon: ChevronDown, c: 'text-slate-500 bg-slate-50' },
                { l: 'Total XP Earned', v: totalXP, icon: Zap, c: 'text-amber-600 bg-amber-50' },
              ].map(s => (
                <div key={s.l} className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 hover:border-slate-200 transition-all">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.c}`}><s.icon size={16} /></div>
                  <span className="flex-1 text-sm font-semibold text-slate-700">{s.l}</span>
                  <span className="font-black text-slate-900">{s.v.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
