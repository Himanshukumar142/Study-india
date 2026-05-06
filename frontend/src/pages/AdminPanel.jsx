import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { 
  Users, FileText, BarChart2, Trash2, ShieldCheck, ShieldOff, 
  Eye, Plus, X, UploadCloud, Download, Search, Bell, 
  LayoutDashboard, Settings, LogOut, MoreVertical, 
  AlertCircle, Database, CheckCircle2, AlertTriangle, 
  ChevronRight, ArrowUpRight, TrendingUp, Filter, Clock,
  Calendar, Check, Copy, Layers, List, Edit, Send, PlayCircle,
  Zap, Save, Info, ChevronLeft, Flag, Monitor, Lock, Globe,
  Cpu, HardDrive, MousePointer2, Activity, PieChart as PieIcon
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import toast from 'react-hot-toast'

// ── Shared UI Components ──────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color, trend, subtitle, percentage }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden">
    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
      <Icon size={120} className={color.replace('bg-', 'text-')} />
    </div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3.5 rounded-2xl ${color} bg-opacity-10 shadow-sm`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
            {trend.startsWith('+') ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />} {trend}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-slate-400 text-[11px] font-bold tracking-widest uppercase">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{subtitle}</span>}
        </div>
        {percentage && (
           <div className="mt-4 w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
           </div>
        )}
      </div>
    </div>
  </div>
)

const Badge = ({ variant, children }) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-rose-50 text-rose-600 border-rose-100',
    active: 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/20',
    blocked: 'bg-slate-50 text-slate-500 border-slate-200',
    draft: 'bg-slate-100 text-slate-500 border-slate-200',
    scheduled: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    published: 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-200',
    critical: 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-200',
  }
  return (
    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${styles[variant] || styles.draft}`}>
      {children}
    </span>
  )
}

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 ${className}`}>
    {children}
  </div>
)

// ── Main Page Component ──────────────────────────────────────────

export default function AdminPanel() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [content, setContent] = useState([])
  const [mockTests, setMockTests] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Sub-View State
  const [mtStep, setMtStep] = useState(1)
  const [isCreatingMt, setIsCreatingMt] = useState(false)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [isBulkUploading, setIsBulkUploading] = useState(false)

  // Question Form State
  const initialQForm = {
    subject: 'Physics', chapter: '', topic: '', question: '', 
    options: { A: '', B: '', C: '', D: '' }, 
    correct: 'A', marks: 4, negativeMarking: -1, exam: 'BOTH', difficulty: 'medium',
    explanation: '', type: 'single'
  }
  const [qForm, setQForm] = useState(initialQForm)
  const [qLoading, setQLoading] = useState(false)

  // Bulk Upload State
  const [bulkData, setBulkData] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [sRes, uRes, cRes, mRes, qRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/content'),
        api.get('/mock-tests').catch(() => ({ data: { data: [] } })),
        api.get('/quizzes/questions').catch(() => ({ data: { data: [] } }))
      ])
      setStats(sRes.data.data)
      setUsers(uRes.data.data)
      setContent(cRes.data.data)
      setMockTests(mRes.data.data)
      setQuestions(qRes.data.data || [])
    } catch { toast.error('Dashboard synchronization failed') }
    finally { setLoading(false) }
  }

  // Action Handlers
  const handleToggleUser = async (user) => {
    try {
      await api.patch(`/admin/users/${user._id}/toggle`)
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      toast.success(`User ${user.isActive ? 'restricted' : 'restored'}`)
    } catch { toast.error('Action failed') }
  }

  // Mock Test Form State
  const initialMtForm = {
    title: '', startTime: '', duration: 180, exam: 'JEE', 
    questions: [], pattern: 'JEE_MAIN', totalMarks: 300
  }
  const [mtForm, setMtForm] = useState(initialMtForm)
  const [mtLoading, setMtLoading] = useState(false)

  const handleMockTestSubmit = async () => {
    if (!mtForm.title || !mtForm.startTime) return toast.error('Fill basic details first')
    setMtLoading(true)
    try {
      const res = await api.post('/mock-tests', mtForm)
      setMockTests([res.data.data, ...mockTests])
      toast.success('Mock Test published successfully')
      setIsCreatingMt(false)
      setMtForm(initialMtForm)
      setMtStep(1)
    } catch (err) {
      toast.error('Failed to publish mock test')
    } finally { setMtLoading(false) }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/content/${id}/status`, { status })
      setContent(prev => prev.map(c => c._id === id ? { ...c, status } : c))
      toast.success(`Content state: ${status.toUpperCase()}`)
    } catch { toast.error('Failed to update content state') }
  }

  const viewPerformance = async (u) => {
    setSelectedUser(u)
    setPerfLoading(true)
    try {
      const res = await api.get(`/admin/users/${u._id}/performance`)
      setUserPerf(res.data.data)
    } catch { toast.error('Failed to load intelligence profile') }
    finally { setPerfLoading(false) }
  }

  const handleQuestionSubmit = async (e) => {
    e.preventDefault()
    setQLoading(true)
    try {
      const res = await api.post('/quizzes/questions', qForm)
      setQuestions([res.data.data, ...questions])
      toast.success('Question added to intelligence repository')
      setQForm(initialQForm)
      setIsAddingQuestion(false)
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Question ingestion failed') 
    } finally { setQLoading(false) }
  }

  const handleBulkUpload = async () => {
    if (!bulkData) return toast.error('Paste JSON data first')
    setQLoading(true)
    try {
      const data = JSON.parse(bulkData)
      const res = await api.post('/quizzes/questions/bulk', { questions: data })
      setQuestions([...res.data.data, ...questions])
      toast.success(`${res.data.data.length} questions ingested successfully`)
      setBulkData('')
      setIsBulkUploading(false)
    } catch (err) {
      toast.error('Invalid JSON format or ingestion failed')
    } finally { setQLoading(false) }
  }

  // Performance Modal State
  const [selectedUser, setSelectedUser] = useState(null)
  const [userPerf, setUserPerf] = useState(null)
  const [perfLoading, setPerfLoading] = useState(false)

  // Filtered Lists
  const filteredUsers = useMemo(() => 
    users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())),
    [users, searchQuery]
  )

  const filteredQuestions = useMemo(() => 
    questions.filter(q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) || q.subject.toLowerCase().includes(searchQuery.toLowerCase())),
    [questions, searchQuery]
  )

  if (loading) return (
    <div className="flex h-screen bg-white items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0" />
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden selection:bg-blue-100">
      
      {/* ── Sidebar ── */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col h-full flex-shrink-0 z-30">
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 rotate-3 transition-transform hover:rotate-0">
            <LayoutDashboard size={24} color="white" />
          </div>
          <div>
            <span className="block font-black text-xl tracking-tight leading-none text-slate-900">StudyQuest</span>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">SaaS Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-8 overflow-y-auto no-scrollbar">
          {/* Main Group */}
          <div>
            <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Main Intelligence</p>
            <div className="space-y-1">
              {[
                { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'intelligence', label: 'AI Intelligence', icon: Activity },
              ].map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-300 group-hover:text-slate-900'} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Management Group */}
          <div>
            <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Management</p>
            <div className="space-y-1">
              {[
                { id: 'users', label: 'Student Directory', icon: Users },
                { id: 'content', label: 'Approvals', icon: ShieldCheck, badge: content.filter(c => c.status === 'pending').length },
                { id: 'quizzes', label: 'Question Bank', icon: Plus },
                { id: 'mock-tests', label: 'Exam Center', icon: Zap },
              ].map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <div className="flex items-center gap-4">
                    <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-300 group-hover:text-slate-900'} />
                    {item.label}
                  </div>
                  {item.badge > 0 && <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === item.id ? 'bg-white text-blue-600' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}>{item.badge}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* System Group */}
          <div>
            <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Platform System</p>
            <div className="space-y-1">
              {[
                { id: 'moderation', label: 'Moderation', icon: AlertTriangle },
                { id: 'storage', label: 'Infrastructure', icon: Database },
                { id: 'settings', label: 'Core Settings', icon: Settings },
              ].map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-300 group-hover:text-slate-900'} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-8 border-t border-slate-50">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer group mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-xs shadow-md group-hover:scale-105 transition-transform">A</div>
            <div className="flex-1">
              <p className="text-xs font-black text-slate-900">Admin Team</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Super Access</p>
            </div>
            <MoreVertical size={16} className="text-slate-300 group-hover:text-slate-600" />
          </div>
          <button onClick={async () => { await logout(); navigate('/login'); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-rose-500 text-sm font-black hover:bg-rose-50 transition-all uppercase tracking-widest">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Navbar */}
        <header className="flex justify-between items-center p-8 bg-white/70 backdrop-blur-md border-b border-slate-100 sticky top-0 z-20">
          <div className="flex items-center gap-6">
             <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white transition-all">
                <Search size={20} className="text-slate-400" />
             </div>
             <div className="h-6 w-px bg-slate-200" />
             <div className="flex gap-2">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Environment</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase tracking-wider">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Production
                </span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
               <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Globe size={18} /></button>
               <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Bell size={18} /></button>
               <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Settings size={18} /></button>
            </div>
            <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform">
               Deploy Updates
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-12 pb-20">

        {/* ── View: Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-end">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Morning Intelligence, Admin</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                     <Clock size={12} /> Wednesday, May 06 • 12:45 PM
                  </p>
               </div>
               <div className="flex gap-4">
                  <button className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-black text-slate-600 shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                     <Download size={14} /> Intelligence Report
                  </button>
               </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard label="Total Students" value={stats?.totalUsers} icon={Users} color="bg-blue-500" trend="+14.2%" percentage={78} />
              <StatCard label="Active Now" value="482" icon={Activity} color="bg-rose-500" trend="+5.1%" percentage={42} />
              <StatCard label="Quiz Attempts" value={stats?.totalAttempts} icon={CheckCircle2} color="bg-purple-500" trend="+22.8%" percentage={89} />
              <StatCard label="Storage Health" value="84%" icon={HardDrive} color="bg-amber-500" trend="-0.4%" percentage={84} />
            </div>

            {/* Quick Operations Center */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                  <div onClick={() => { setActiveTab('mock-tests'); setIsCreatingMt(true); }} className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] text-white cursor-pointer hover:scale-[1.02] transition-all shadow-xl shadow-blue-500/20 group relative overflow-hidden">
                     <Zap size={80} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
                     <h4 className="text-xl font-black mb-2">Initialize Mock Test</h4>
                     <p className="text-blue-100 text-xs font-medium leading-relaxed opacity-80">Deploy a new JEE/NEET exam pattern across the platform instantly.</p>
                     <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        Launch Wizard <ChevronRight size={14} />
                     </div>
                  </div>
                  <div onClick={() => { setActiveTab('quizzes'); setIsAddingQuestion(true); }} className="p-8 bg-white border border-slate-100 rounded-[32px] text-slate-900 cursor-pointer hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden">
                     <Plus size={80} className="absolute -right-4 -bottom-4 opacity-5 text-blue-600 group-hover:scale-110 transition-transform" />
                     <h4 className="text-xl font-black mb-2">Ingest Question</h4>
                     <p className="text-slate-400 text-xs font-medium leading-relaxed">Add individual academic assets to the intelligence repository.</p>
                     <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        Open Repository <ChevronRight size={14} />
                     </div>
                  </div>
               </div>
               <GlassCard className="!p-8 bg-slate-900 text-white border-none shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="p-2.5 bg-blue-500 rounded-xl"><ShieldCheck size={20} /></div>
                     <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Security Protocol</span>
                  </div>
                  <h4 className="text-lg font-black mb-2">System Lockdown</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">Platform is currently in high-integrity mode. All activities are being logged to the security trails.</p>
                  <button className="w-full mt-8 py-3.5 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Audit Logs</button>
               </GlassCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              {/* Growth Analytics */}
              <GlassCard className="xl:col-span-2">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Platform Growth Matrix</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Daily user engagement and retention</p>
                  </div>
                  <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                    <button className="px-4 py-1.5 text-[10px] font-black bg-white text-blue-600 rounded-lg shadow-sm">1W</button>
                    <button className="px-4 py-1.5 text-[10px] font-black text-slate-400 hover:text-slate-900">1M</button>
                    <button className="px-4 py-1.5 text-[10px] font-black text-slate-400 hover:text-slate-900">1Y</button>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Mon', users: 120, growth: 80 }, { name: 'Tue', users: 180, growth: 120 }, { name: 'Wed', users: 160, growth: 140 }, 
                      { name: 'Thu', users: 240, growth: 190 }, { name: 'Fri', users: 210, growth: 220 }, { name: 'Sat', users: 300, growth: 280 }, { name: 'Sun', users: 420, growth: 380 }
                    ]}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="0" stroke="#f8fafc" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '800', fill: '#94a3b8' }} dy={15} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                        contentStyle={{ borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                        itemStyle={{ fontSize: '11px', fontWeight: '900', color: '#2563eb', textTransform: 'uppercase' }}
                      />
                      <Area type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                      <Area type="monotone" dataKey="growth" stroke="#a855f7" strokeWidth={4} strokeDasharray="8 8" fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Real-time Activity */}
              <GlassCard className="flex flex-col">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">System Pulse</h3>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                     <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Live Trails</span>
                  </div>
                </div>
                <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pr-2">
                  {[
                    { user: 'Himanshu S.', action: 'Critical report filed', time: 'Just now', color: 'bg-rose-500' },
                    { user: 'Siddharth V.', action: 'Unlocked Level 14', time: '5m ago', color: 'bg-emerald-500' },
                    { user: 'Platform', action: 'B2 storage sync success', time: '12m ago', color: 'bg-blue-500' },
                    { user: 'Aditya K.', action: 'Uploaded Physics Mock', time: '24m ago', color: 'bg-purple-500' },
                    { user: 'System', action: 'API key rotation required', time: '1h ago', color: 'bg-amber-500' },
                  ].map((act, i) => (
                    <div key={i} className="flex gap-5 items-start group">
                      <div className={`w-10 h-10 rounded-2xl ${act.color} flex-shrink-0 flex items-center justify-center text-white font-black text-[14px] shadow-lg shadow-slate-100 transform group-hover:scale-110 transition-transform`}>
                        {act.user[0]}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{act.user}</p>
                          <span className="text-[10px] font-bold text-slate-300">{act.time}</span>
                        </div>
                        <p className="text-[12px] text-slate-500 font-semibold leading-snug">{act.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-10 py-4 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]">Audit All Trails</button>
              </GlassCard>
            </div>
          </div>
        )}

        {/* ── View: AI Intelligence ── */}
        {activeTab === 'intelligence' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <header>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Intelligence Analytics</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">AI-powered platform insights and student health</p>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <GlassCard className="lg:col-span-2">
                   <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-10 flex items-center gap-2">
                      <Activity size={16} className="text-blue-600" /> Retention Heatmap
                   </h3>
                   <div className="h-80 w-full flex items-center justify-center bg-slate-50/50 rounded-[24px] border border-slate-100 border-dashed">
                      <div className="text-center space-y-4">
                         <TrendingUp size={48} className="text-slate-200 mx-auto" />
                         <p className="text-xs font-bold text-slate-400">Rendering intelligence heatmap...</p>
                      </div>
                   </div>
                </GlassCard>

                <GlassCard>
                   <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-10 flex items-center gap-2">
                      <PieIcon size={16} className="text-purple-600" /> Subject Health
                   </h3>
                   <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                            { subject: 'Physics', score: 85 }, { subject: 'Chemistry', score: 65 }, 
                            { subject: 'Maths', score: 90 }, { subject: 'Biology', score: 70 },
                            { subject: 'English', score: 40 }
                         ]}>
                            <PolarGrid stroke="#f1f5f9" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: '800', fill: '#94a3b8' }} />
                            <PolarRadiusAxis hide />
                            <Radar name="Student Health" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                         </RadarChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="mt-10 space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Actions</span>
                         <Badge variant="active">AI Active</Badge>
                      </div>
                      <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                         <p className="text-[11px] font-bold text-blue-800 leading-relaxed">System detects weak engagement in <span className="font-black underline">Organic Chemistry</span>. Suggesting automated notification blast.</p>
                      </div>
                   </div>
                </GlassCard>
             </div>
          </div>
        )}

        {/* ── View: Student Directory ── */}
        {activeTab === 'users' && (
          <div className="space-y-8 slide-in duration-300">
            <GlassCard className="!p-0 overflow-hidden">
               <div className="p-8 flex justify-between items-center border-b border-slate-100">
                  <div className="flex gap-4">
                     <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search UID, Name, Email..." className="pl-11 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold w-80 outline-none focus:border-blue-500 focus:bg-white transition-all" />
                     </div>
                     <button className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-black text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all">
                        <Filter size={14} /> Filter By: Dropper
                     </button>
                  </div>
                  <div className="flex gap-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{users.length} Total Users</span>
                  </div>
               </div>
               <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-300 tracking-[0.2em]">
                      <th className="px-10 py-6 text-left">Intelligence Profile</th>
                      <th className="px-8 py-6 text-left">Academic Target</th>
                      <th className="px-8 py-6 text-left">Engagement Matrix</th>
                      <th className="px-8 py-6 text-left">State</th>
                      <th className="px-10 py-6 text-right">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map(u => (
                      <tr key={u._id} className="hover:bg-blue-50/20 transition-all group cursor-default">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-400 group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all transform group-hover:scale-105 shadow-sm">
                              {u.name[0]}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors tracking-tight">{u.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-slate-700 tracking-tight">{u.exam} • {u.class}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Exam 2026</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs font-black text-emerald-600 tracking-tight">{u.xp.toLocaleString()} XP</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Level {u.level}</p>
                            </div>
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-emerald-500 shadow-sm" style={{ width: `${(u.xp % 1000) / 10}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <Badge variant={u.isActive ? 'active' : 'blocked'}>
                            {u.isActive ? 'Healthy' : 'Restricted'}
                          </Badge>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => viewPerformance(u)} className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
                              <Eye size={18} />
                            </button>
                            <button onClick={() => handleToggleUser(u)} className={`p-3 rounded-2xl bg-white border border-slate-100 transition-all ${u.isActive ? 'hover:text-rose-600 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/10 text-slate-300' : 'hover:text-emerald-600 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/10 text-slate-300'}`}>
                              {u.isActive ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </GlassCard>
          </div>
        )}

        {/* ── View: Question Bank ── */}
        {activeTab === 'quizzes' && (
          <div className="space-y-12 slide-in duration-500">
             <header className="flex justify-between items-center">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Question Repository</h2>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Manage your global question bank and academic assets</p>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setIsBulkUploading(true)} className="px-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-black text-slate-600 shadow-sm hover:shadow-md transition-all flex items-center gap-3">
                      <UploadCloud size={18} /> Bulk Intelligence Upload
                   </button>
                   <button onClick={() => setIsAddingQuestion(true)} className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-transform flex items-center gap-3">
                      <Plus size={18} /> Add Single Question
                   </button>
                </div>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Advanced Filters */}
                <div className="lg:col-span-1">
                   <GlassCard className="sticky top-10">
                      <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6">Asset Filters</h3>
                      <div className="space-y-8">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Filter</label>
                            <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:border-blue-500">
                               <option>Global Library</option>
                               <option>Physics</option>
                               <option>Chemistry</option>
                               <option>Biology</option>
                               <option>Maths</option>
                            </select>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Complexity Level</label>
                            <div className="flex flex-col gap-2">
                               {['Easy', 'Medium', 'Hard'].map(l => (
                                  <label key={l} className="flex items-center gap-3 cursor-pointer group">
                                     <input type="checkbox" className="w-4 h-4 rounded-md border-slate-200 text-blue-600 focus:ring-blue-500" />
                                     <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">{l} Level</span>
                                  </label>
                               ))}
                            </div>
                         </div>
                      </div>
                      <div className="mt-10 pt-8 border-t border-slate-50">
                         <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase">Pro Tip: Use bulk upload for massive data ingestion.</p>
                         </div>
                      </div>
                   </GlassCard>
                </div>

                {/* Question Feed */}
                <div className="lg:col-span-3 space-y-6">
                   {filteredQuestions.map(q => (
                      <GlassCard key={q._id} className="group hover:border-blue-200 transition-all cursor-default relative overflow-hidden">
                         <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-2">
                               <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-xl border border-blue-100 uppercase tracking-widest">{q.subject}</span>
                               <span className={`px-3 py-1 text-[10px] font-black rounded-xl border uppercase tracking-widest ${q.difficulty === 'hard' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                  {q.difficulty}
                               </span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg transition-all"><Edit size={16}/></button>
                               <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-rose-600 hover:border-rose-200 hover:shadow-lg transition-all"><Trash2 size={16}/></button>
                            </div>
                         </div>
                         <h4 className="text-base font-black text-slate-900 leading-relaxed mb-8">{q.question}</h4>
                         <div className="grid grid-cols-2 gap-4">
                            {Object.entries(q.options).map(([key, val]) => (
                               <div key={key} className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${q.correct === key ? 'bg-emerald-50 border-emerald-500/20 text-emerald-900 shadow-sm' : 'bg-slate-50/50 border-transparent text-slate-500'}`}>
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${q.correct === key ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                     {key}
                                  </div>
                                  <span className="text-sm font-bold tracking-tight">{val}</span>
                                  {q.correct === key && <CheckCircle2 size={18} className="ml-auto text-emerald-500" />}
                               </div>
                            ))}
                         </div>
                         <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Solution Intel</span>
                            <p className="text-[11px] font-bold text-slate-400 truncate">{q.explanation || 'No detailed explanation provided for this asset.'}</p>
                         </div>
                      </GlassCard>
                   ))}
                   {filteredQuestions.length === 0 && (
                      <div className="py-20 text-center space-y-6">
                         <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto border border-slate-100 text-slate-200">
                            <Search size={32} />
                         </div>
                         <h3 className="text-xl font-black text-slate-900 tracking-tight">No intelligence matches found</h3>
                         <p className="text-sm text-slate-400 font-medium">Try adjusting your subject filters or search parameters.</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}
        {activeTab === 'mock-tests' && (
          <div className="space-y-12 slide-in duration-500">
             <header className="flex justify-between items-center">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Exam Center Control</h2>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Mock test management, scheduling, and live monitoring</p>
                </div>
                <button onClick={() => setIsCreatingMt(true)} className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-transform flex items-center gap-3">
                   <Zap size={18} /> Initialize New Exam Pattern
                </button>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mockTests.map(mt => (
                   <GlassCard key={mt._id} className="group hover:border-blue-600/30 transition-all cursor-default">
                      <div className="flex justify-between items-start mb-6">
                         <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <Zap size={24} />
                         </div>
                         <Badge variant={mt.status === 'active' ? 'published' : 'scheduled'}>{mt.status}</Badge>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{mt.title}</h4>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
                         <Calendar size={12} /> {new Date(mt.startTime).toLocaleDateString()} • {mt.duration} Minutes
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-8">
                         <div className="p-3 bg-slate-50 rounded-2xl text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Questions</p>
                            <p className="text-lg font-black text-slate-900">{mt.questions.length}</p>
                         </div>
                         <div className="p-3 bg-slate-50 rounded-2xl text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Attempts</p>
                            <p className="text-lg font-black text-slate-900">128</p>
                         </div>
                      </div>

                      <div className="flex gap-2">
                         <button className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100">Analytics</button>
                         <button className="px-4 py-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm"><Edit size={16} /></button>
                      </div>
                   </GlassCard>
                ))}
                {mockTests.length === 0 && (
                   <div className="col-span-full py-20 text-center flex flex-col items-center">
                      <div className="p-6 rounded-3xl bg-slate-100 text-slate-400 mb-6"><Zap size={48} /></div>
                      <h3 className="font-black text-xl text-slate-900">No Exams Scheduled</h3>
                      <p className="text-sm text-slate-500 mt-2 font-medium">Use the "Initialize" button to create your first production mock test.</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {/* ── View: Infrastucture (Storage) ── */}
        {activeTab === 'storage' && (
          <div className="space-y-12 slide-in duration-500">
             <header>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Platform Infrastructure</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Backblaze B2 storage monitoring and file health</p>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-10">
                   <div className="grid grid-cols-3 gap-8">
                      <GlassCard>
                         <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><HardDrive size={20} /></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Usage</span>
                         </div>
                         <h4 className="text-3xl font-black text-slate-900">1.8 TB</h4>
                         <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-tighter">Of 2.0 TB Allocated</p>
                         <div className="mt-6 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '90%' }} />
                         </div>
                      </GlassCard>
                      <GlassCard>
                         <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><FileText size={20} /></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">File Count</span>
                         </div>
                         <h4 className="text-3xl font-black text-slate-900">12,482</h4>
                         <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-tighter">+128 Files This Month</p>
                      </GlassCard>
                      <GlassCard>
                         <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Zap size={20} /></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">API Health</span>
                         </div>
                         <h4 className="text-3xl font-black text-emerald-600 uppercase tracking-tighter">Healthy</h4>
                         <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-tighter">Last Ping: 2m ago</p>
                      </GlassCard>
                   </div>

                   <GlassCard>
                      <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-10">Storage Growth Velocity</h3>
                      <div className="h-72 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                               { m: 'Jan', v: 400 }, { m: 'Feb', v: 800 }, { m: 'Mar', v: 1200 }, { m: 'Apr', v: 1600 }, { m: 'May', v: 1800 }
                            ]}>
                               <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                               <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '800', fill: '#94a3b8' }} dy={10} />
                               <YAxis hide />
                               <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                               <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={5} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                            </LineChart>
                         </ResponsiveContainer>
                      </div>
                   </GlassCard>
                </div>

                <GlassCard className="flex flex-col">
                   <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-10">Cleanup Queue</h3>
                   <div className="flex-1 space-y-6">
                      {[
                         { name: 'orphaned_logs.zip', size: '2.4 GB', type: 'Archive' },
                         { name: 'temp_user_avatar_cache', size: '1.8 GB', type: 'Cache' },
                         { name: 'failed_uploads_tmp', size: '480 MB', type: 'Temporary' }
                      ].map((f, i) => (
                         <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group cursor-pointer hover:bg-white transition-all">
                            <div>
                               <p className="text-[11px] font-black text-slate-900 tracking-tight truncate w-32">{f.name}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.type}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[11px] font-black text-rose-500">{f.size}</p>
                               <button className="text-[10px] font-bold text-slate-300 group-hover:text-rose-600 transition-colors uppercase">Purge</button>
                            </div>
                         </div>
                      ))}
                   </div>
                   <button className="w-full mt-10 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 hover:scale-[1.02] transition-transform">Optimize Infrastructure</button>
                </GlassCard>
             </div>
          </div>
        )}

        {/* ── View: Core Settings ── */}
        {activeTab === 'settings' && (
          <div className="space-y-12 slide-in duration-500 max-w-4xl">
             <header>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Core Platform Configuration</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Manage API keys, environment variables, and system preferences</p>
             </header>

             <div className="space-y-8">
                <GlassCard>
                   <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-6">
                      <div className="flex gap-10">
                         {['General', 'Security', 'Webhooks', 'Team'].map(t => (
                            <button key={t} className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${t === 'Security' ? 'text-blue-600 border-b-2 border-blue-600 pb-2' : 'text-slate-400 hover:text-slate-900'}`}>{t}</button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-10">
                      <div className="flex justify-between items-start">
                         <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Authentication & Security</h4>
                            <p className="text-[11px] text-slate-400 font-bold mt-1">Configure JWT rotation and session duration</p>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">State:</span>
                            <Badge variant="active">Enabled</Badge>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Access Token Duration (Minutes)</label>
                            <input type="number" defaultValue={15} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all" />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Refresh Token Duration (Days)</label>
                            <input type="number" defaultValue={7} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all" />
                         </div>
                      </div>

                      <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-6 items-start">
                         <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20"><AlertCircle size={24} /></div>
                         <div>
                            <h5 className="text-sm font-black text-amber-800 uppercase tracking-widest">Production Environment Locked</h5>
                            <p className="text-[11px] text-amber-600 font-bold mt-1 leading-relaxed">Critical API keys and JWT Secrets can only be rotated via CLI or environment variables to prevent accidental lockout.</p>
                         </div>
                      </div>
                   </div>

                   <div className="mt-12 pt-10 border-t border-slate-50 flex justify-end gap-4">
                      <button className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">Discard Intelligence</button>
                      <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-transform">Save Environment</button>
                   </div>
                </GlassCard>
             </div>
          </div>
        )}

        </div>
      </main>

      {/* ── Mock Test Wizard Modal ── */}
      {isCreatingMt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[48px] shadow-2xl flex flex-col relative overflow-hidden border border-slate-100">
            
            <header className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <div className="flex gap-12">
                  {[
                    { s: 1, l: 'Configuration', i: Settings },
                    { s: 2, l: 'Intelligence', i: Cpu },
                    { s: 3, l: 'Strategy', i: ShieldCheck }
                  ].map(step => (
                    <div key={step.s} className={`flex items-center gap-4 transition-all ${mtStep >= step.s ? 'text-blue-600' : 'text-slate-300'}`}>
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 font-black text-sm ${mtStep === step.s ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-110' : mtStep > step.s ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-slate-100'}`}>
                          {mtStep > step.s ? <Check size={18}/> : step.s}
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${mtStep === step.s ? 'opacity-100' : 'opacity-40'}`}>{step.l}</span>
                       {step.s < 3 && <ChevronRight size={16} className="text-slate-200 ml-4" />}
                    </div>
                  ))}
               </div>
               <button onClick={() => setIsCreatingMt(false)} className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-rose-600 transition-all"><X size={20}/></button>
            </header>

            <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
               {mtStep === 1 && (
                  <div className="space-y-12 animate-in slide-in-from-right-4 duration-300">
                     <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Title</label>
                           <input value={mtForm.title} onChange={e => setMtForm({...mtForm, title: e.target.value})} placeholder="e.g. JEE Main Full Syllabus Alpha" className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm font-black outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Pattern</label>
                           <div className="flex gap-4">
                              {['JEE_MAIN', 'JEE_ADV', 'NEET'].map(p => (
                                 <button key={p} onClick={() => setMtForm({...mtForm, pattern: p, exam: p === 'NEET' ? 'NEET' : 'JEE'})} className={`flex-1 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${mtForm.pattern === p ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}`}>{p.replace('_', ' ')}</button>
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-10">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration (Minutes)</label>
                           <div className="relative">
                              <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input type="number" value={mtForm.duration} onChange={e => setMtForm({...mtForm, duration: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl pl-16 pr-8 py-5 text-sm font-black outline-none focus:border-blue-500 transition-all" />
                           </div>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Timestamp</label>
                           <input type="datetime-local" value={mtForm.startTime} onChange={e => setMtForm({...mtForm, startTime: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm font-black outline-none focus:border-blue-500 transition-all" />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Valuation (Marks)</label>
                           <input type="number" value={mtForm.totalMarks} onChange={e => setMtForm({...mtForm, totalMarks: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm font-black outline-none focus:border-blue-500 transition-all" />
                        </div>
                     </div>
                  </div>
               )}

               {mtStep === 2 && (
                  <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                     <div className="flex justify-between items-end">
                        <div>
                           <h4 className="text-xl font-black text-slate-900 tracking-tight">Question Ingestion</h4>
                           <p className="text-xs text-slate-400 font-bold mt-1">Select questions from repository or use auto-generator</p>
                        </div>
                        <Badge variant="active">{mtForm.questions.length} Selected</Badge>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
                        {questions.map(q => (
                           <div key={q._id} onClick={() => {
                              const exists = mtForm.questions.includes(q._id)
                              setMtForm({
                                 ...mtForm, 
                                 questions: exists ? mtForm.questions.filter(id => id !== q._id) : [...mtForm.questions, q._id]
                              })
                           }} className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all flex gap-6 items-start ${mtForm.questions.includes(q._id) ? 'bg-blue-50 border-blue-500 shadow-xl shadow-blue-500/10' : 'bg-white border-slate-100 hover:border-blue-200'}`}>
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${mtForm.questions.includes(q._id) ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                                 {mtForm.questions.includes(q._id) ? <Check size={18}/> : q.subject[0]}
                              </div>
                              <div className="flex-1 space-y-2">
                                 <p className="text-xs font-black text-slate-900 line-clamp-2 leading-relaxed">{q.question}</p>
                                 <div className="flex gap-2">
                                    <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">{q.subject}</span>
                                    <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">• {q.difficulty}</span>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {mtStep === 3 && (
                  <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                     <div className="grid grid-cols-3 gap-8">
                        {[
                          { l: 'Marking Logic', d: '+4 / -1 Standard', i: CheckCircle2 },
                          { l: 'Anti-Cheat', d: 'Fullscreen Lockdown', i: ShieldCheck },
                          { l: 'Shuffle Mode', d: 'Randomize sequence', i: Send }
                        ].map((s, i) => (
                           <GlassCard key={i} className="text-center group hover:bg-blue-600 transition-all cursor-pointer">
                              <s.i size={32} className="mx-auto text-blue-600 group-hover:text-white transition-colors mb-6" />
                              <h5 className="text-xs font-black text-slate-900 group-hover:text-white uppercase tracking-widest mb-1">{s.l}</h5>
                              <p className="text-[10px] text-slate-400 group-hover:text-blue-100 font-bold">{s.d}</p>
                           </GlassCard>
                        ))}
                     </div>
                     <div className="p-10 bg-indigo-50 rounded-[42px] border border-indigo-100 flex gap-8 items-center">
                        <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-600/30 rotate-3"><Zap size={32}/></div>
                        <div className="flex-1">
                           <h4 className="text-lg font-black text-indigo-900 tracking-tight">Intelligence Ready for Deployment</h4>
                           <p className="text-sm text-indigo-700 font-bold mt-1">Review the final exam configuration. Once published, students will receive an instant notification blast.</p>
                        </div>
                        <Badge variant="active">Production Verified</Badge>
                     </div>
                  </div>
               )}
            </div>

            <footer className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <button onClick={() => mtStep > 1 && setMtStep(mtStep - 1)} disabled={mtStep === 1} className="px-8 py-4 bg-white border border-slate-200 rounded-3xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all disabled:opacity-0 flex items-center gap-2">
                  <ChevronLeft size={16}/> Return
               </button>
               <button onClick={() => mtStep < 3 ? setMtStep(mtStep + 1) : handleMockTestSubmit()} disabled={mtLoading} className="px-12 py-4 bg-blue-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.02] transition-transform flex items-center gap-3">
                  {mtLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : mtStep === 3 ? <><Send size={18}/> Deploy Live Exam</> : <><ChevronRight size={18}/> Progress Strategy</>}
               </button>
            </footer>
          </div>
        </div>
      )}

      {/* ── Add Question Modal ── */}
      {isAddingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[48px] shadow-2xl flex flex-col relative overflow-hidden border border-slate-100">
            <header className="p-8 border-b border-slate-100 flex justify-between items-center">
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Intelligence Ingestion</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure individual academic asset</p>
               </div>
               <button onClick={() => setIsAddingQuestion(false)} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"><X size={20}/></button>
            </header>
            
            <form onSubmit={handleQuestionSubmit} className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-10">
               <div className="grid grid-cols-3 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</label>
                     <select value={qForm.subject} onChange={e => setQForm({...qForm, subject: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:border-blue-500">
                        <option>Physics</option><option>Chemistry</option><option>Biology</option><option>Maths</option>
                     </select>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Difficulty</label>
                     <select value={qForm.difficulty} onChange={e => setQForm({...qForm, difficulty: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:border-blue-500">
                        <option value="easy">Easy Level</option><option value="medium">Medium Level</option><option value="hard">Hard Level</option>
                     </select>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Exam</label>
                     <select value={qForm.exam} onChange={e => setQForm({...qForm, exam: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:border-blue-500">
                        <option value="JEE">JEE Main</option><option value="NEET">NEET UG</option><option value="BOTH">Global Pattern</option>
                     </select>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Text (Rich Intel)</label>
                  <textarea value={qForm.question} onChange={e => setQForm({...qForm, question: e.target.value})} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold min-h-[120px] outline-none focus:border-blue-500 transition-all" placeholder="Enter academic question content here..."/>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  {['A', 'B', 'C', 'D'].map(opt => (
                     <div key={opt} className="space-y-3 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Option {opt}</label>
                        <input value={qForm.options[opt]} onChange={e => setQForm({...qForm, options: {...qForm.options, [opt]: e.target.value}})} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-12 py-4 text-xs font-bold outline-none focus:border-blue-500 transition-all" />
                        <div className={`absolute left-4 top-[38px] w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all cursor-pointer ${qForm.correct === opt ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-300 border-slate-100'}`} onClick={() => setQForm({...qForm, correct: opt})}>{opt}</div>
                     </div>
                  ))}
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solution / Explanation</label>
                  <textarea value={qForm.explanation} onChange={e => setQForm({...qForm, explanation: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold min-h-[100px] outline-none focus:border-blue-500 transition-all" placeholder="Explain the intelligence logic for this question..."/>
               </div>
            </form>

            <footer className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
               <button type="button" onClick={() => setIsAddingQuestion(false)} className="px-8 py-4 bg-white border border-slate-200 rounded-3xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel Process</button>
               <button onClick={handleQuestionSubmit} disabled={qLoading} className="flex-1 py-4 bg-blue-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.01] transition-transform flex items-center justify-center gap-3">
                  {qLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={16}/> Save Intelligence Asset</>}
               </button>
            </footer>
          </div>
        </div>
      )}

      {/* ── Bulk Upload Modal ── */}
      {isBulkUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl flex flex-col relative overflow-hidden border border-slate-100">
             <header className="p-8 border-b border-slate-100 flex justify-between items-center">
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Bulk Ingestion Engine</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Inject massive intelligence data via JSON</p>
               </div>
               <button onClick={() => setIsBulkUploading(false)} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"><X size={20}/></button>
            </header>

            <div className="p-10 space-y-6">
               <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex gap-5 items-start">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20"><Info size={20}/></div>
                  <p className="text-[11px] font-bold text-blue-800 leading-relaxed">Ensure your JSON follows the schema: <code className="bg-blue-100 px-1.5 py-0.5 rounded">[{'{'} question, subject, options: {'{'}A, B, C, D{'}'}, correct, ... {'}'}]</code></p>
               </div>
               <textarea value={bulkData} onChange={e => setBulkData(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-6 text-[11px] font-mono font-bold min-h-[300px] outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" placeholder="Paste your intelligence JSON array here..."/>
            </div>

            <footer className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
               <button onClick={handleBulkUpload} disabled={qLoading} className="flex-1 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.01] transition-transform flex items-center justify-center gap-3">
                  {qLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UploadCloud size={18}/> Execute Bulk Ingestion</>}
               </button>
            </footer>
          </div>
        </div>
      )}

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[48px] shadow-2xl flex flex-col relative overflow-hidden border border-slate-100 ring-1 ring-white/20">
            <button onClick={() => setSelectedUser(null)} className="absolute top-8 right-8 p-3 rounded-2xl bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-slate-900 transition-all z-20">
              <X size={24} />
            </button>
            
            <div className="p-12 bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 relative">
               <div className="relative z-10 flex items-end gap-10 pt-12">
                  <div className="w-32 h-32 rounded-[42px] bg-white/10 backdrop-blur-xl border-[6px] border-white/30 flex items-center justify-center text-5xl font-black text-white shadow-2xl rotate-3 transform transition-transform">
                    {selectedUser.name[0]}
                  </div>
                  <div className="pb-4 space-y-2">
                    <h2 className="text-4xl font-black text-white tracking-tighter">{selectedUser.name}</h2>
                    <div className="flex gap-2">
                       <span className="px-3 py-1 bg-white/20 rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/20">{selectedUser.email}</span>
                       <span className="px-3 py-1 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Verified</span>
                    </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none scale-150"><Users size={200} color="white" /></div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
              {perfLoading ? (
                <div className="flex justify-center py-24"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : userPerf ? (
                <>
                  <div className="grid grid-cols-4 gap-6">
                    {[
                      { l: 'Total XP', v: userPerf.user.totalXP.toLocaleString(), c: 'text-blue-600', b: 'bg-blue-50/50' },
                      { l: 'Cur. Level', v: userPerf.user.level, c: 'text-purple-600', b: 'bg-purple-50/50' },
                      { l: 'Mistakes', v: userPerf.user.mistakes, c: 'text-rose-600', b: 'bg-rose-50/50' },
                      { l: 'Focus Score', v: '92%', c: 'text-emerald-600', b: 'bg-emerald-50/50' }
                    ].map(st => (
                      <div key={st.l} className={`${st.b} p-6 rounded-3xl border border-white hover:border-slate-100 transition-all shadow-sm`}>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">{st.l}</p>
                        <p className={`text-2xl font-black ${st.c} tracking-tight`}>{st.v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                       <Zap size={18} className="text-blue-600" /> Assessment History
                    </h4>
                    <div className="space-y-4">
                      {userPerf.quizAttempts.map(q => (
                        <div key={q._id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all cursor-default group border-l-4 border-l-transparent hover:border-l-blue-600">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-100"><Zap size={20} /></div>
                             <div>
                                <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{q.subject} • {q.chapter}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{new Date(q.createdAt).toLocaleDateString()} at {new Date(q.createdAt).toLocaleTimeString()}</p>
                             </div>
                          </div>
                          <div className="text-right flex items-center gap-10">
                             <div>
                                <p className="text-lg font-black text-slate-900 tracking-tighter">{q.obtainedMarks}/{q.totalMarks}</p>
                                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{q.accuracy}% Accuracy</p>
                             </div>
                             <button className="p-3 bg-white rounded-2xl text-slate-200 group-hover:text-blue-600 group-hover:shadow-lg transition-all"><Eye size={18} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center space-y-4">
                   <Activity size={48} className="text-slate-100 mx-auto" />
                   <p className="text-xs font-bold text-slate-400">No assessment data found for this intelligence profile.</p>
                </div>
              )}
            </div>
            
            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4 backdrop-blur-md">
              <button className="flex-1 py-5 bg-white border border-slate-200 rounded-3xl text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-100 hover:shadow-md transition-all shadow-sm">Audit Data Stream</button>
              <button className="flex-1 py-5 bg-rose-600 text-white rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-600/30 hover:scale-[1.02] transition-all">Restrict Intelligent Access</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
