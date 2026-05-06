import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  BookOpen, Target, Flame, Star, TrendingUp, Clock,
  Zap, Trophy, AlertCircle, ArrowRight, Sparkles
} from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, sub, color, bgColor }) => (
  <div className="card fade-up" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={color} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{sub}</div>}
    </div>
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div className="card" style={{ padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: '#64748b', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#4f46e5' }}>{payload[0].value} min</div>
    </div>
  )
  return null
}

const timeOfDay = () => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [mockTests, setMockTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/mock-tests').catch(() => ({ data: { data: [] } }))
    ])
      .then(([aRes, mRes]) => {
        setAnalytics(aRes.data.data)
        setMockTests(mRes.data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  const stats = analytics?.user || {}
  const chartData = analytics?.dailyStudy || []
  const subjectPerf = analytics?.subjectPerformance || []

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>
              Good {timeOfDay()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 5 }}>
              {user?.exam} Aspirant · Class {user?.class} · Here's your progress overview
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10 }}>
            <Flame size={16} color="#d97706" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>{stats.streak || 0} day streak</span>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Star}   label="Total XP"    value={stats.xp || 0}     sub={`Level ${stats.level || 1}`} color="#4f46e5" bgColor="#eef2ff" />
        <StatCard icon={Flame}  label="Day Streak"  value={`${stats.streak || 0}d`} sub="Keep it going!" color="#d97706" bgColor="#fffbeb" />
        <StatCard icon={Clock}  label="Study Time"  value={`${Math.round((stats.totalStudyMinutes || 0) / 60)}h`} sub={`${stats.totalStudyMinutes || 0} min logged`} color="#0891b2" bgColor="#ecfeff" />
        <StatCard icon={Target} label="Accuracy"    value={`${analytics?.avgAccuracy || 0}%`} sub={`${analytics?.totalQuizzesSolved || 0} quizzes done`} color="#059669" bgColor="#f0fdf4" />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Study time chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Study Activity</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Minutes studied per day</div>
            </div>
            <span className="badge badge-blue">Last 7 days</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="minutes" stroke="#4f46e5" strokeWidth={2.5} fill="url(#grad1)" dot={false} activeDot={{ r: 4, fill: '#4f46e5' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-icon"><TrendingUp size={24} /></div>
              <h3>No data yet</h3>
              <p>Start studying to see your activity chart</p>
            </div>
          )}
        </div>

        {/* Subject performance */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Subject Performance</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Avg. quiz accuracy</div>
          {subjectPerf.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {subjectPerf.map((s) => {
                const pct = Math.round(s.avgAccuracy)
                const color = pct >= 70 ? '#059669' : pct >= 45 ? '#d97706' : '#dc2626'
                return (
                  <div key={s._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{s._id}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon"><BookOpen size={22} /></div>
              <h3>No quizzes yet</h3>
              <p>Attempt quizzes to see performance</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Start Quiz',   icon: Target,      color: '#4f46e5', bg: '#eef2ff', path: '/quiz'         },
            { label: 'Focus Mode',   icon: Zap,         color: '#d97706', bg: '#fffbeb', path: '/focus'         },
            { label: 'Mistake Book', icon: AlertCircle, color: '#dc2626', bg: '#fef2f2', path: '/mistakes'      },
            { label: 'Leaderboard', icon: Trophy,       color: '#059669', bg: '#f0fdf4', path: '/leaderboard'   },
          ].map(({ label, icon: Icon, color, bg, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="card"
              style={{ padding: '18px 20px', textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                Open <ArrowRight size={11} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Mock Tests ── */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#8b5cf6" /> Live & Upcoming Mock Tests
        </div>
        {mockTests.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {mockTests.map(mt => {
              const isUpcoming = mt.status === 'upcoming';
              const isCompleted = mt.status === 'completed' || mt.userAttempted;
              
              return (
                <div key={mt._id} className="card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: isUpcoming ? '#f59e0b' : isCompleted ? '#64748b' : '#10b981' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{mt.title}</h3>
                      <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{mt.duration} mins · {mt.questions.length} Questions</p>
                    </div>
                    <span className={`badge ${isUpcoming ? 'badge-yellow' : isCompleted ? 'badge-gray' : 'badge-green'}`} style={{ textTransform: 'uppercase', fontSize: 10 }}>
                      {isCompleted ? 'Done' : mt.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} /> 
                    {new Date(mt.startTime).toLocaleString()}
                  </div>
                  {isCompleted ? (
                    <button 
                      onClick={() => navigate(`/mock-test/leaderboard/${mt._id}`)}
                      className="btn btn-secondary" 
                      style={{ width: '100%', padding: '10px', background: '#f1f5f9', color: '#475569' }}
                    >
                      <Trophy size={14} style={{ marginRight: 6 }} /> View Rankings
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/quiz/mock/${mt._id}`)}
                      disabled={isUpcoming}
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '10px', opacity: isUpcoming ? 0.5 : 1 }}
                    >
                      {isUpcoming ? 'Not Started' : 'Join Test'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state card" style={{ padding: '32px 0' }}>
            <div className="empty-icon"><Trophy size={22} /></div>
            <h3>No Mock Tests Scheduled</h3>
            <p>Check back later for upcoming All India Tests</p>
          </div>
        )}
      </div>

      {/* ── Weak Topics ── */}
      {analytics?.weakTopics?.length > 0 && (
        <div className="card" style={{ padding: 20, borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <AlertCircle size={16} color="#ef4444" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Weak Topics to Revise</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {analytics.weakTopics.map((t, i) => (
              <span key={i} className="badge badge-red">{t.subject} · {t.chapter}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
