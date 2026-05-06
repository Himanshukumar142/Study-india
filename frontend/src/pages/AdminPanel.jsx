import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  LayoutDashboard, Brain, Users, ShieldCheck, BookOpen,
  Zap, AlertTriangle, Database, Settings, LogOut,
  Bell, Search, ChevronLeft, ChevronRight, Menu, X,
  MoreVertical, Activity, Globe
} from 'lucide-react'
import toast from 'react-hot-toast'

import OverviewPage from './admin/OverviewPage'
import IntelligencePage from './admin/IntelligencePage'
import StudentsPage from './admin/StudentsPage'
import ApprovalsPage from './admin/ApprovalsPage'
import QuestionBankPage from './admin/QuestionBankPage'
import MockTestsPage from './admin/MockTestsPage'
import ModerationPage from './admin/ModerationPage'
import StoragePage from './admin/StoragePage'
import SettingsPage from './admin/SettingsPage'

// ── Sidebar config ────────────────────────────────────────────
const NAV = [
  {
    group: 'Main',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'intelligence', label: 'Intelligence', icon: Brain },
    ],
  },
  {
    group: 'Management',
    items: [
      { id: 'users', label: 'Students', icon: Users },
      { id: 'content', label: 'Approvals', icon: ShieldCheck, badge: true },
      { id: 'quizzes', label: 'Question Bank', icon: BookOpen },
      { id: 'mock-tests', label: 'Mock Tests', icon: Zap },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'moderation', label: 'Moderation', icon: AlertTriangle },
      { id: 'storage', label: 'Storage', icon: Database },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ active, setActive, pendingCount, collapsed, setCollapsed, mobile, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobile && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={onClose} />}

      <aside className={`
        ${mobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
        flex flex-col h-full bg-white border-r border-slate-100 transition-all duration-300 ease-in-out flex-shrink-0
        ${collapsed && !mobile ? 'w-[72px]' : 'w-64'}
        ${mobile && !collapsed ? 'translate-x-0' : ''}
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-3 p-5 border-b border-slate-100 ${collapsed && !mobile ? 'justify-center px-3' : ''}`}>
          <div className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 transition-transform hover:rotate-6">
            <LayoutDashboard size={18} color="white" />
          </div>
          {(!collapsed || mobile) && (
            <div>
              <p className="font-black text-slate-900 text-sm leading-none">StudyQuest</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Admin Panel</p>
            </div>
          )}
          {mobile && (
            <button onClick={onClose} className="ml-auto p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"><X size={16} /></button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAV.map(section => (
            <div key={section.group}>
              {(!collapsed || mobile) && (
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] px-3 mb-2">{section.group}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = active === item.id
                  const badgeCount = item.badge ? pendingCount : 0
                  return (
                    <button key={item.id} onClick={() => { setActive(item.id); mobile && onClose() }}
                      title={collapsed && !mobile ? item.label : undefined}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 group relative
                        ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                        ${collapsed && !mobile ? 'justify-center' : ''}
                      `}>
                      <item.icon size={18} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                      {(!collapsed || mobile) && <span className="flex-1 text-left">{item.label}</span>}
                      {(!collapsed || mobile) && badgeCount > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black ${isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}>{badgeCount}</span>
                      )}
                      {collapsed && !mobile && badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white font-black flex items-center justify-center">{badgeCount}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className={`p-3 border-t border-slate-100 space-y-2 ${collapsed && !mobile ? 'items-center' : ''}`}>
          {(!collapsed || mobile) && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-white transition-all cursor-pointer group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md group-hover:scale-105 transition-transform flex-shrink-0">A</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900 truncate">Admin Team</p>
                <p className="text-[10px] text-slate-400 font-semibold">Super Access</p>
              </div>
              <MoreVertical size={14} className="text-slate-300 flex-shrink-0" />
            </div>
          )}
          <button onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 text-sm font-bold hover:bg-rose-50 transition-all ${collapsed && !mobile ? 'justify-center' : ''}`}
            title={collapsed && !mobile ? 'Logout' : undefined}>
            <LogOut size={16} className="flex-shrink-0" />
            {(!collapsed || mobile) && 'Logout'}
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        {!mobile && (
          <button onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3.5 top-20 w-7 h-7 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all z-10">
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        )}
      </aside>
    </>
  )
}

// ── Main AdminPanel ────────────────────────────────────────────
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [content, setContent] = useState([])
  const [mockTests, setMockTests] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreatingMt, setIsCreatingMt] = useState(false)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)

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
    } catch { /* use mock data */ }
    finally { setLoading(false) }
  }

  const handleToggleUser = async (user) => {
    try {
      await api.patch(`/admin/users/${user._id}/toggle`)
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      toast.success(`User ${user.isActive ? 'restricted' : 'restored'}`)
    } catch { toast.error('Action failed') }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/content/${id}/status`, { status })
      setContent(prev => prev.map(c => c._id === id ? { ...c, status } : c))
      toast.success(`Content ${status}`)
    } catch { toast.error('Failed') }
  }

  const handleCreateTest = async (form) => {
    try {
      const res = await api.post('/mock-tests', form)
      setMockTests(prev => [res.data.data, ...prev])
      toast.success('Mock test created!')
    } catch { toast.error('Failed to create test') }
  }

  const handleAddQuestion = async (form) => {
    try {
      const res = await api.post('/quizzes/questions', form)
      setQuestions(prev => [res.data.data, ...prev])
      toast.success('Question added!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const pendingCount = useMemo(() => content.filter(c => c.status === 'pending').length, [content])

  const pageTitle = {
    overview: 'Dashboard Overview',
    intelligence: 'AI Intelligence',
    users: 'Student Directory',
    content: 'Content Approvals',
    quizzes: 'Question Bank',
    'mock-tests': 'Mock Test Center',
    moderation: 'Moderation Center',
    storage: 'Storage Infrastructure',
    settings: 'Platform Settings',
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="relative w-14 h-14 mx-auto">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans antialiased">

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar active={activeTab} setActive={setActiveTab} pendingCount={pendingCount}
          collapsed={collapsed} setCollapsed={setCollapsed} mobile={false} onClose={() => {}} />
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <Sidebar active={activeTab} setActive={setActiveTab} pendingCount={pendingCount}
          collapsed={false} setCollapsed={() => {}} mobile={true} onClose={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Top Header */}
        <header className="flex-shrink-0 h-16 bg-white border-b border-slate-100 px-5 flex items-center gap-4 z-20">
          {/* Mobile menu btn */}
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-black text-slate-300 hidden sm:inline">Admin</span>
            <ChevronRight size={14} className="text-slate-200 hidden sm:inline" />
            <span className="font-bold text-slate-900">{pageTitle[activeTab]}</span>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-xl border border-emerald-100">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Production
            </div>
            <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all relative">
              <Bell size={18} />
              {pendingCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white font-black flex items-center justify-center">{pendingCount}</span>}
            </button>
            <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"><Globe size={18} /></button>
            <button className="hidden sm:flex items-center gap-2 ml-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all">
              <Activity size={13} /> Deploy
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewPage
                stats={stats}
                onCreateTest={() => { setActiveTab('mock-tests'); setIsCreatingMt(true) }}
                onAddQuestion={() => { setActiveTab('quizzes'); setIsAddingQuestion(true) }}
              />
            )}
            {activeTab === 'intelligence' && <IntelligencePage />}
            {activeTab === 'users' && <StudentsPage users={users} onToggleUser={handleToggleUser} />}
            {activeTab === 'content' && <ApprovalsPage content={content} onUpdateStatus={handleUpdateStatus} />}
            {activeTab === 'quizzes' && <QuestionBankPage questions={questions} onAddQuestion={handleAddQuestion} />}
            {activeTab === 'mock-tests' && <MockTestsPage mockTests={mockTests} questions={questions} onCreateTest={handleCreateTest} />}
            {activeTab === 'moderation' && <ModerationPage />}
            {activeTab === 'storage' && <StoragePage />}
            {activeTab === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>
    </div>
  )
}
