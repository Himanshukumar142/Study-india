import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, BookOpen, Upload, Zap, XCircle,
  Trophy, User, ShieldCheck, LogOut, Brain, Flame, ChevronRight, Target, Bookmark,
  FileText, BarChart2, Calendar, MessageCircle, Layers, Link, CheckSquare, StickyNote, FlaskConical, Timer, Medal
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/library',   icon: BookOpen,        label: 'Library'   },
  { to: '/bookmarks', icon: Bookmark,        label: 'Bookmarks' },
  { to: '/quiz',      icon: Target,          label: 'Quizzes'   },
  { to: '/pdf-quiz',   icon: FileText,        label: 'PDF → Quiz' },
  { to: '/downloader', icon: Link,            label: 'Link Downloader' },
  { to: '/daily-challenge', icon: Flame,      label: 'Daily Challenge' },
  { to: '/analytics', icon: BarChart2,        label: 'Analytics' },
  { to: '/study-plan', icon: Calendar,        label: 'Study Plan' },
  { to: '/flashcards', icon: Layers,          label: 'Flashcards' },
  { to: '/doubts',    icon: MessageCircle,    label: 'Doubt Forum' },
  { to: '/syllabus',  icon: CheckSquare,       label: 'Syllabus'   },
  { to: '/notes',     icon: StickyNote,        label: 'My Notes'   },
  { to: '/formulas',  icon: FlaskConical,      label: 'Formulas'   },
  { to: '/badges',    icon: Medal,             label: 'Badges'     },
  { to: '/pomodoro',  icon: Timer,             label: 'Pomodoro'   },
  { to: '/upload',    icon: Upload,            label: 'Upload'     },
  { to: '/focus',     icon: Zap,             label: 'Focus Mode'},
  { to: '/mistakes',  icon: XCircle,         label: 'Mistakes'  },
  { to: '/leaderboard', icon: Trophy,        label: 'Leaderboard'},
  { to: '/profile',   icon: User,            label: 'Profile'   },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const xpPercent = Math.min(((user?.xp || 0) % 1000) / 10, 100)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        boxShadow: '1px 0 0 0 #e2e8f0',
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
              flexShrink: 0,
            }}>
              <Brain size={18} color="white" />
            </div>
            <div>
              <div className="font-display" style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                StudyQuest
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                {user?.exam || 'JEE'} Prep
              </div>
            </div>
          </div>
        </div>

        {/* XP + Streak */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          {/* Level & XP */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Level {user?.level || 1}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>{user?.xp || 0} XP</span>
          </div>
          {/* XP Bar */}
          <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${xpPercent}%`,
              background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
              borderRadius: 99,
              transition: 'width 0.7s ease',
            }} />
          </div>
          {/* Streak */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 99,
              background: '#fffbeb', border: '1px solid #fde68a',
            }}>
              <Flame size={12} color="#d97706" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706' }}>
                {user?.streak || 0} day streak
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          <p className="section-label" style={{ padding: '8px 8px 4px' }}>Navigation</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 9,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s',
                marginBottom: 2,
                ...(isActive ? {
                  background: '#eef2ff',
                  color: '#4f46e5',
                  fontWeight: 600,
                } : {
                  color: '#64748b',
                }),
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {isActive && <ChevronRight size={12} strokeWidth={2.5} />}
                </>
              )}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 9,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                marginTop: 4,
                transition: 'all 0.15s',
                ...(isActive
                  ? { background: '#fef2f2', color: '#dc2626' }
                  : { color: '#64748b' }),
              })}
            >
              {({ isActive }) => (
                <>
                  <ShieldCheck size={16} />
                  <span>Admin Panel</span>
                  {isActive && <ChevronRight size={12} />}
                </>
              )}
            </NavLink>
          )}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 10,
            marginBottom: 4,
            background: '#f8fafc',
            border: '1px solid #f1f5f9',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                {user?.exam} · Class {user?.class}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 8, border: 'none',
              background: 'transparent', fontSize: 13, fontWeight: 500,
              color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  )
}
