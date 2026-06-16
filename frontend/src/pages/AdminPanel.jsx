import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  LayoutDashboard, Brain, Users, ShieldCheck, BookOpen,
  Zap, AlertTriangle, Database, Settings, LogOut,
  Bell, ChevronLeft, ChevronRight, Menu, X,
  Activity, Search, Crown, Flame, Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

import OverviewPage    from './admin/OverviewPage'
import IntelligencePage from './admin/IntelligencePage'
import StudentsPage    from './admin/StudentsPage'
import ApprovalsPage   from './admin/ApprovalsPage'
import QuestionBankPage from './admin/QuestionBankPage'
import MockTestsPage   from './admin/MockTestsPage'
import ModerationPage  from './admin/ModerationPage'
import StoragePage     from './admin/StoragePage'
import SettingsPage    from './admin/SettingsPage'
import DailyQuizPage   from './admin/DailyQuizPage'

/* ─────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────── */
const NAV = [
  {
    group: 'Main',
    items: [
      { id: 'overview',     label: 'Overview',      icon: LayoutDashboard, color: '#6366f1' },
      { id: 'intelligence', label: 'Intelligence',  icon: Brain,           color: '#8b5cf6' },
    ],
  },
  {
    group: 'Management',
    items: [
      { id: 'users',       label: 'Students',       icon: Users,           color: '#3b82f6' },
      { id: 'content',     label: 'Approvals',      icon: ShieldCheck,     color: '#f59e0b', badge: true },
      { id: 'quizzes',     label: 'Question Bank',  icon: BookOpen,        color: '#10b981' },
      { id: 'mock-tests',  label: 'Mock Tests',     icon: Zap,             color: '#06b6d4' },
      { id: 'daily-quiz',  label: 'Daily Quiz',     icon: Flame,           color: '#f97316' },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'moderation',  label: 'Moderation',     icon: AlertTriangle,   color: '#ef4444' },
      { id: 'storage',     label: 'Storage',        icon: Database,        color: '#64748b' },
      { id: 'settings',    label: 'Settings',       icon: Settings,        color: '#94a3b8' },
    ],
  },
]

const PAGE_TITLE = {
  overview:     'Dashboard Overview',
  intelligence: 'AI Intelligence',
  users:        'Student Directory',
  content:      'Content Approvals',
  quizzes:      'Question Bank',
  'mock-tests': 'Mock Test Center',
  'daily-quiz': 'Daily Quiz Manager',
  moderation:   'Moderation Center',
  storage:      'Storage Infrastructure',
  settings:     'Platform Settings',
}

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function Sidebar({ active, setActive, pendingCount, collapsed, setCollapsed, mobile, onClose, user }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const w = collapsed && !mobile ? 76 : 256

  return (
    <>
      {/* Mobile backdrop */}
      {mobile && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(2,6,23,0.7)',
            backdropFilter: 'blur(6px)',
          }}
        />
      )}

      <aside style={{
        position: mobile ? 'fixed' : 'relative',
        top: 0, left: 0, bottom: 0,
        width: w,
        zIndex: mobile ? 50 : 'auto',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg,#0c0f1e 0%,#0f172a 40%,#0c1628 100%)',
        borderRight: '1px solid rgba(255,255,255,0.055)',
        transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>

        {/* ── subtle texture ── */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.06) 0%, transparent 60%)', pointerEvents:'none' }} />

        {/* ═══ LOGO ═══ */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 12, padding: collapsed && !mobile ? '20px 0' : '20px 18px',
          justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          position: 'relative', zIndex: 1, flexShrink: 0,
        }}>
          {/* logo mark */}
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 24px rgba(99,102,241,0.4)',
            transition: 'transform .3s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'rotate(8deg) scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0) scale(1)'}
          >
            <Crown size={18} color="#fff" />
          </div>

          {(!collapsed || mobile) && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.1 }}>StudyIndia</p>
              <p style={{ fontSize: 9, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.22em', marginTop: 3 }}>Admin Panel</p>
            </div>
          )}

          {/* mobile close */}
          {mobile && (
            <button onClick={onClose} style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* ═══ NAV ═══ */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative', zIndex: 1 }}
          className="thin-scroll">
          {NAV.map((section, si) => (
            <div key={section.group} style={{ marginTop: si > 0 ? 20 : 4 }}>
              {/* group label */}
              {(!collapsed || mobile) && (
                <p style={{
                  fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)',
                  textTransform: 'uppercase', letterSpacing: '0.22em',
                  padding: '0 10px', marginBottom: 6,
                }}>
                  {section.group}
                </p>
              )}
              {collapsed && !mobile && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 8px 10px' }} />
              )}

              {section.items.map(item => {
                const isActive = active === item.id
                const badgeCount = item.badge ? pendingCount : 0
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActive(item.id); mobile && onClose() }}
                    title={collapsed && !mobile ? item.label : undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 11, padding: collapsed && !mobile ? '11px 0' : '11px 12px',
                      justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
                      borderRadius: 12, border: 'none', cursor: 'pointer',
                      position: 'relative', marginBottom: 2,
                      background: isActive
                        ? `linear-gradient(135deg,${item.color}22,${item.color}14)`
                        : 'transparent',
                      boxShadow: isActive ? `inset 0 0 0 1px ${item.color}33` : 'none',
                      transition: 'all .18s ease',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* active indicator bar */}
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '20%', bottom: '20%',
                        width: 3, borderRadius: 99,
                        background: item.color,
                        boxShadow: `0 0 10px ${item.color}`,
                      }} />
                    )}

                    {/* icon */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? `${item.color}22` : 'rgba(255,255,255,0.04)',
                      border: isActive ? `1px solid ${item.color}33` : '1px solid transparent',
                      transition: 'all .18s',
                    }}>
                      <item.icon size={16} color={isActive ? item.color : 'rgba(255,255,255,0.35)'} />
                    </div>

                    {(!collapsed || mobile) && (
                      <>
                        <span style={{
                          flex: 1, textAlign: 'left', fontSize: 13, fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                          transition: 'color .18s', letterSpacing: '-0.1px',
                        }}>
                          {item.label}
                        </span>
                        {badgeCount > 0 && (
                          <span style={{
                            minWidth: 20, height: 20, padding: '0 5px',
                            borderRadius: 99, background: isActive ? 'rgba(255,255,255,0.2)' : '#ef4444',
                            color: '#fff', fontSize: 10, fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isActive ? 'none' : '0 4px 12px rgba(239,68,68,0.5)',
                          }}>
                            {badgeCount}
                          </span>
                        )}
                      </>
                    )}

                    {/* collapsed badge dot */}
                    {collapsed && !mobile && badgeCount > 0 && (
                      <span style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.7)',
                      }} />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ═══ USER FOOTER ═══ */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.055)',
          padding: '12px 10px', position: 'relative', zIndex: 1, flexShrink: 0,
        }}>
          {(!collapsed || mobile) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              marginBottom: 8, cursor: 'pointer', transition: 'all .18s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            >
              {/* avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900, color: '#fff',
                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
              }}>
                {user?.name?.[0] || 'A'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'Admin'}
                </p>
                <p style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Crown size={9} color="#6366f1" /> Super Admin
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 10, padding: '10px 12px', justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
              borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'transparent', transition: 'all .18s',
              color: 'rgba(255,255,255,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
          >
            <LogOut size={16} />
            {(!collapsed || mobile) && (
              <span style={{ fontSize: 13, fontWeight: 600 }}>Sign Out</span>
            )}
          </button>
        </div>

        {/* ═══ COLLAPSE TOGGLE (desktop) ═══ */}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position: 'absolute', right: -14, top: 72,
              width: 28, height: 28, borderRadius: '50%',
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              transition: 'all .2s', zIndex: 10,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#6366f1' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        )}
      </aside>
    </>
  )
}

/* ─────────────────────────────────────────
   TOPBAR
───────────────────────────────────────── */
function Topbar({ activeTab, pendingCount, onMenuClick, user }) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <header style={{
      flexShrink: 0, height: 64,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(15,23,42,0.07)',
      padding: '0 24px',
      display: 'flex', alignItems: 'center', gap: 16,
      zIndex: 20,
      boxShadow: '0 1px 0 rgba(15,23,42,0.06), 0 4px 24px rgba(15,23,42,0.04)',
    }}>

      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="md-hidden"
        style={{
          display: 'none',
          width: 38, height: 38, borderRadius: 10,
          background: '#f1f5f9', border: '1px solid #e2e8f0',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#475569', transition: 'all .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
        onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 8,
          background: '#f8fafc', border: '1px solid #e2e8f0',
        }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Admin</span>
          <ChevronRight size={12} color="#cbd5e1" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{PAGE_TITLE[activeTab]}</span>
        </div>
      </div>

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Right cluster ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Date & Time chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 10,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          fontSize: 11, fontWeight: 700, color: '#64748b',
        }}>
          <Calendar size={12} color="#94a3b8" />
          {dateStr} · {timeStr}
        </div>

        {/* Live chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 10,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          fontSize: 10, fontWeight: 800, color: '#059669',
          textTransform: 'uppercase', letterSpacing: '0.15em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.8)', animation: 'pulse 2s infinite', display: 'inline-block' }} />
          Live
        </div>

        {/* Search btn */}
        <button style={{
          width: 38, height: 38, borderRadius: 10,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#94a3b8', transition: 'all .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#cbd5e1' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0' }}>
          <Search size={16} />
        </button>

        {/* Bell */}
        <button style={{
          width: 38, height: 38, borderRadius: 10, position: 'relative',
          background: '#f8fafc', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#94a3b8', transition: 'all .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#cbd5e1' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0' }}>
          <Bell size={16} />
          {pendingCount > 0 && (
            <span style={{
              position: 'absolute', top: 7, right: 7,
              width: 8, height: 8, borderRadius: '50%',
              background: '#ef4444', border: '1.5px solid #fff',
              boxShadow: '0 0 6px rgba(239,68,68,0.6)',
            }} />
          )}
        </button>

        {/* User avatar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '5px 5px 5px 12px', borderRadius: 12,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          cursor: 'pointer', transition: 'all .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1 }}>{user?.name || 'Admin'}</p>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>Super Admin</p>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900, color: '#fff',
            boxShadow: '0 4px 10px rgba(99,102,241,0.35)',
            flexShrink: 0,
          }}>
            {user?.name?.[0] || 'A'}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){.md-hidden{display:flex!important}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .thin-scroll::-webkit-scrollbar{width:3px}
        .thin-scroll::-webkit-scrollbar-track{background:transparent}
        .thin-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:99px}
      `}</style>
    </header>
  )
}

/* ─────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f172a,#1e1b4b)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 16px 48px rgba(99,102,241,0.5)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <Crown size={26} color="#fff" />
        </div>
        <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.25em' }}>
          Loading Dashboard
        </p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#6366f1',
              animation: `bounce .8s ease-in-out ${i * 0.15}s infinite alternate`,
            }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes bounce{from{transform:translateY(0);opacity:.4}to{transform:translateY(-8px);opacity:1}}
        @keyframes pulse{0%,100%{box-shadow:0 16px 48px rgba(99,102,241,0.5)}50%{box-shadow:0 16px 64px rgba(99,102,241,0.8)}}
      `}</style>
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN ADMIN PANEL
───────────────────────────────────────── */
export default function AdminPanel() {
  const { user } = useAuth()
  const [activeTab, setActiveTab]     = useState('overview')
  const [collapsed, setCollapsed]     = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)

  const [stats, setStats]         = useState(null)
  const [users, setUsers]         = useState([])
  const [content, setContent]     = useState([])
  const [mockTests, setMockTests] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sRes, uRes, cRes, mRes, qRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/content'),
        api.get('/mock-tests').catch(() => ({ data: { data: [] } })),
        api.get('/quizzes/questions').catch(() => ({ data: { data: [] } })),
      ])
      setStats(sRes.data.data)
      setUsers(uRes.data.data)
      setContent(cRes.data.data)
      setMockTests(mRes.data.data)
      setQuestions(qRes.data.data || [])
    } catch { /* graceful degradation */ }
    finally { setLoading(false) }
  }

  const handleToggleUser   = async (u) => {
    try {
      await api.patch(`/admin/users/${u._id}/toggle`)
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isActive: !x.isActive } : x))
      toast.success(`User ${u.isActive ? 'restricted' : 'restored'}`)
    } catch { toast.error('Action failed') }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/content/${id}/status`, { status })
      setContent(prev => prev.map(c => c._id === id ? { ...c, status } : c))
      toast.success(`Content ${status}`)
    } catch { toast.error('Failed') }
  }

  const handleCreateTest   = async (form) => {
    try {
      const res = await api.post('/mock-tests', form)
      setMockTests(prev => [res.data.data, ...prev])
      toast.success('Mock test created!')
    } catch { toast.error('Failed to create test') }
  }

  const handleAddQuestion  = async (form) => {
    try {
      const res = await api.post('/quizzes/questions', form)
      setQuestions(prev => [res.data.data, ...prev])
      toast.success('Question added!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleBulkAddQuestion = async (qs) => {
    try {
      const res = await api.post('/quizzes/questions/bulk', { questions: qs })
      setQuestions(prev => [...(res.data.data || []), ...prev])
      toast.success(`${res.data.data?.length || 0} questions imported successfully!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk import failed')
      throw err
    }
  }

  const handleEditQuestion = async (id, form) => {
    try {
      const res = await api.patch(`/quizzes/questions/${id}`, form)
      setQuestions(prev => prev.map(q => q._id === id ? res.data.data : q))
      toast.success('Question updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update question')
      throw err
    }
  }

  const handleDeleteQuestion = async (id) => {
    try {
      await api.delete(`/quizzes/questions/${id}`)
      setQuestions(prev => prev.filter(q => q._id !== id))
      toast.success('Question deleted successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete question')
    }
  }

  const pendingCount = useMemo(() => content.filter(c => c.status === 'pending').length, [content])

  if (loading) return <LoadingScreen />

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: '#f1f5f9',
      overflow: 'hidden',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    }}>

      {/* Desktop Sidebar */}
      <div style={{ display: 'flex', height: '100%' }} className="hide-mobile">
        <Sidebar
          active={activeTab} setActive={setActiveTab}
          pendingCount={pendingCount}
          collapsed={collapsed} setCollapsed={setCollapsed}
          mobile={false} onClose={() => {}}
          user={user}
        />
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <Sidebar
          active={activeTab} setActive={setActiveTab}
          pendingCount={pendingCount}
          collapsed={false} setCollapsed={() => {}}
          mobile onClose={() => setMobileOpen(false)}
          user={user}
        />
      )}

      {/* Main column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>

        {/* Topbar */}
        <Topbar
          activeTab={activeTab}
          pendingCount={pendingCount}
          onMenuClick={() => setMobileOpen(true)}
          user={user}
        />

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ maxWidth: 1600, margin: '0 auto', padding: '28px 28px 48px' }}>
            {activeTab === 'overview' && (
              <OverviewPage
                stats={stats}
                onCreateTest={() => setActiveTab('mock-tests')}
                onAddQuestion={() => setActiveTab('quizzes')}
              />
            )}
            {activeTab === 'intelligence' && <IntelligencePage />}
            {activeTab === 'users'        && <StudentsPage users={users} onToggleUser={handleToggleUser} />}
            {activeTab === 'content'      && <ApprovalsPage content={content} onUpdateStatus={handleUpdateStatus} />}
            {activeTab === 'quizzes'      && (
              <QuestionBankPage
                questions={questions}
                onAddQuestion={handleAddQuestion}
                onBulkAddQuestion={handleBulkAddQuestion}
                onEditQuestion={handleEditQuestion}
                onDeleteQuestion={handleDeleteQuestion}
              />
            )}
            {activeTab === 'mock-tests'   && <MockTestsPage />}
            {activeTab === 'daily-quiz'   && <DailyQuizPage />}
            {activeTab === 'moderation'   && <ModerationPage />}
            {activeTab === 'storage'      && <StoragePage />}
            {activeTab === 'settings'     && <SettingsPage />}
          </div>
        </main>
      </div>

      <style>{`
        .hide-mobile { display: flex }
        @media(max-width:768px){ .hide-mobile{ display:none!important } }
        *{ box-sizing:border-box }
      `}</style>
    </div>
  )
}
