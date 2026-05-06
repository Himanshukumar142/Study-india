import { useState } from 'react'
import { Settings, Shield, HardDrive, Zap, Bell, Palette, Save, AlertCircle, Check, RefreshCw } from 'lucide-react'
import { Card, SectionHeader, Badge, Btn, Input, Select } from './AdminUI'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'quiz', label: 'Quiz Rules', icon: Zap },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'theme', label: 'Theme', icon: Palette },
]

function Toggle({ enabled, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ml-4 ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${enabled ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  )
}

function GeneralTab() {
  const [settings, setSettings] = useState({
    platformName: 'StudyQuest India',
    maintenanceMode: false,
    allowSignups: true,
    allowUploads: true,
    maxUploadSizeMB: 50,
    allowedFileTypes: 'pdf,jpg,png',
    leaderboardEnabled: true,
    xpEnabled: true,
  })
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-black text-slate-900 mb-5">Platform Identity</h3>
        <div className="grid grid-cols-2 gap-5">
          <Input label="Platform Name" value={settings.platformName} onChange={e => setSettings({ ...settings, platformName: e.target.value })} />
          <Input label="Admin Contact Email" defaultValue="admin@studyquest.in" type="email" />
          <Input label="Support URL" defaultValue="https://support.studyquest.in" />
          <Input label="Terms of Service URL" defaultValue="https://studyquest.in/terms" />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-black text-slate-900 mb-1">Platform Controls</h3>
        <p className="text-xs text-slate-400 mb-4">Master switches for platform features</p>
        <Toggle label="Maintenance Mode" desc="Takes platform offline for all students" enabled={settings.maintenanceMode} onChange={v => setSettings({ ...settings, maintenanceMode: v })} />
        <Toggle label="Allow New Signups" desc="Let new students register" enabled={settings.allowSignups} onChange={v => setSettings({ ...settings, allowSignups: v })} />
        <Toggle label="Allow Content Uploads" desc="Students can upload notes and PDFs" enabled={settings.allowUploads} onChange={v => setSettings({ ...settings, allowUploads: v })} />
        <Toggle label="Leaderboard Visible" desc="Show public leaderboard to students" enabled={settings.leaderboardEnabled} onChange={v => setSettings({ ...settings, leaderboardEnabled: v })} />
        <Toggle label="XP & Gamification" desc="Enable XP, levels, and streaks" enabled={settings.xpEnabled} onChange={v => setSettings({ ...settings, xpEnabled: v })} />
      </Card>

      <Card className="p-6">
        <h3 className="font-black text-slate-900 mb-5">Upload Limits</h3>
        <div className="grid grid-cols-2 gap-5">
          <Input label="Max Upload Size (MB)" type="number" value={settings.maxUploadSizeMB} onChange={e => setSettings({ ...settings, maxUploadSizeMB: e.target.value })} />
          <Input label="Allowed File Types" value={settings.allowedFileTypes} onChange={e => setSettings({ ...settings, allowedFileTypes: e.target.value })} placeholder="pdf,jpg,png,mp4" />
        </div>
      </Card>
    </div>
  )
}

function SecurityTab() {
  const [sec, setSec] = useState({ accessTokenMin: 15, refreshTokenDays: 7, mfaEnabled: false, ipWhitelist: false, auditLog: true, rateLimiting: true })
  return (
    <div className="space-y-6">
      <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 flex gap-4 items-start">
        <div className="p-2.5 bg-amber-500 text-white rounded-xl flex-shrink-0"><AlertCircle size={18} /></div>
        <div>
          <h4 className="font-black text-amber-900 text-sm">Production Environment</h4>
          <p className="text-xs text-amber-700 font-medium mt-0.5">JWT secrets can only be rotated via CLI or environment variables to prevent accidental lockout.</p>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="font-black text-slate-900 mb-5">JWT & Session</h3>
        <div className="grid grid-cols-2 gap-5 mb-6">
          <Input label="Access Token Expiry (minutes)" type="number" value={sec.accessTokenMin} onChange={e => setSec({ ...sec, accessTokenMin: e.target.value })} />
          <Input label="Refresh Token Expiry (days)" type="number" value={sec.refreshTokenDays} onChange={e => setSec({ ...sec, refreshTokenDays: e.target.value })} />
        </div>
        <Toggle label="Multi-Factor Authentication" desc="Require OTP for admin logins" enabled={sec.mfaEnabled} onChange={v => setSec({ ...sec, mfaEnabled: v })} />
        <Toggle label="IP Whitelist Mode" desc="Only allow admin access from specific IPs" enabled={sec.ipWhitelist} onChange={v => setSec({ ...sec, ipWhitelist: v })} />
        <Toggle label="Audit Logging" desc="Log all admin actions" enabled={sec.auditLog} onChange={v => setSec({ ...sec, auditLog: v })} />
        <Toggle label="Rate Limiting" desc="Limit API requests per user" enabled={sec.rateLimiting} onChange={v => setSec({ ...sec, rateLimiting: v })} />
      </Card>

      <Card className="p-6">
        <h3 className="font-black text-slate-900 mb-4">API Keys</h3>
        <div className="space-y-3">
          {[{ label: 'Backend API Key', value: 'sq_live_••••••••••••4f92', status: 'active' }, { label: 'B2 Application Key', value: 'b2_app_••••••••••••7c31', status: 'active' }].map(k => (
            <div key={k.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">{k.label}</p>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{k.value}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="approved" dot>{k.status}</Badge>
                <Btn variant="secondary" size="sm"><RefreshCw size={12} /> Rotate</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function QuizTab() {
  const [q, setQ] = useState({ defaultMarks: 4, defaultNegative: -1, shuffleDefault: true, timeLimit: 60, maxAttempts: 3, showAnswers: true, focusModeDefault: false })
  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h3 className="font-black text-slate-900 mb-5">Default Marking Scheme</h3>
        <div className="grid grid-cols-2 gap-5">
          <Input label="Correct Answer Marks" type="number" value={q.defaultMarks} onChange={e => setQ({ ...q, defaultMarks: e.target.value })} />
          <Input label="Wrong Answer Penalty" type="number" value={q.defaultNegative} onChange={e => setQ({ ...q, defaultNegative: e.target.value })} />
          <Input label="Default Time Limit (min)" type="number" value={q.timeLimit} onChange={e => setQ({ ...q, timeLimit: e.target.value })} />
          <Input label="Max Attempts Per Quiz" type="number" value={q.maxAttempts} onChange={e => setQ({ ...q, maxAttempts: e.target.value })} />
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="font-black text-slate-900 mb-1">Quiz Behavior</h3>
        <p className="text-xs text-slate-400 mb-4">Default settings applied to all new quizzes</p>
        <Toggle label="Shuffle Questions by Default" enabled={q.shuffleDefault} onChange={v => setQ({ ...q, shuffleDefault: v })} />
        <Toggle label="Show Answers After Attempt" desc="Students can review correct answers" enabled={q.showAnswers} onChange={v => setQ({ ...q, showAnswers: v })} />
        <Toggle label="Focus Mode Required" desc="Force fullscreen for all quizzes" enabled={q.focusModeDefault} onChange={v => setQ({ ...q, focusModeDefault: v })} />
      </Card>
    </div>
  )
}

function NotificationsTab() {
  const [n, setN] = useState({ newUpload: true, reportAlert: true, mockTestReminder: true, weeklyReport: false, maintenanceAlert: true, studentMilestone: false })
  return (
    <Card className="p-6">
      <h3 className="font-black text-slate-900 mb-5">Admin Notification Preferences</h3>
      <Toggle label="New Upload Awaiting Approval" desc="Notify when students upload content" enabled={n.newUpload} onChange={v => setN({ ...n, newUpload: v })} />
      <Toggle label="Content / User Report Alert" desc="Immediate alerts for flagged content" enabled={n.reportAlert} onChange={v => setN({ ...n, reportAlert: v })} />
      <Toggle label="Mock Test Reminders" desc="30 min before scheduled tests go live" enabled={n.mockTestReminder} onChange={v => setN({ ...n, mockTestReminder: v })} />
      <Toggle label="Weekly Analytics Report" desc="Email summary every Monday" enabled={n.weeklyReport} onChange={v => setN({ ...n, weeklyReport: v })} />
      <Toggle label="System Maintenance Alerts" desc="Storage, API health warnings" enabled={n.maintenanceAlert} onChange={v => setN({ ...n, maintenanceAlert: v })} />
      <Toggle label="Student Milestone Notifications" desc="Level ups, streaks, achievements" enabled={n.studentMilestone} onChange={v => setN({ ...n, studentMilestone: v })} />
    </Card>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  const handleSave = () => toast.success('Settings saved successfully!')

  const content = {
    general: <GeneralTab />,
    security: <SecurityTab />,
    storage: (
      <div className="space-y-5">
        <Card className="p-6">
          <h3 className="font-black text-slate-900 mb-5">Backblaze B2 Configuration</h3>
          <div className="grid grid-cols-2 gap-5">
            <Input label="Bucket Name" defaultValue="studyquest-prod-assets" />
            <Input label="B2 Region" defaultValue="eu-central-001" />
            <Input label="Key ID" defaultValue="••••••••••••7f3a" type="password" />
            <Input label="Application Key" defaultValue="••••••••••••••••••••••••" type="password" />
          </div>
          <div className="mt-5 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
            <Check size={16} className="text-emerald-600" />
            <p className="text-xs text-emerald-700 font-semibold">B2 connection verified · Last synced: 2 minutes ago</p>
          </div>
        </Card>
      </div>
    ),
    quiz: <QuizTab />,
    notifications: <NotificationsTab />,
    theme: (
      <Card className="p-6">
        <h3 className="font-black text-slate-900 mb-5">Theme & Appearance</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[['Light', 'white', true], ['Dark', 'slate-900', false], ['Auto', 'gradient', false]].map(([name, _, active]) => (
            <div key={name} className={`p-4 rounded-2xl border-2 text-center cursor-pointer transition-all ${active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
              <div className={`w-full h-16 rounded-xl mb-3 ${name === 'Dark' ? 'bg-slate-800' : name === 'Auto' ? 'bg-gradient-to-br from-white to-slate-100 border border-slate-200' : 'bg-white border border-slate-200'} shadow-sm`} />
              <p className="text-sm font-bold text-slate-700">{name}</p>
              {active && <Badge variant="active" className="mt-1">Active</Badge>}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Accent Color</p>
            <div className="flex gap-3">
              {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map(c => (
                <button key={c} className="w-10 h-10 rounded-xl border-2 border-white shadow-md hover:scale-110 transition-all first:ring-2 first:ring-offset-1 first:ring-blue-400" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </Card>
    ),
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader
        title="Platform Settings"
        subtitle="Configure all aspects of the StudyQuest platform"
        actions={<Btn onClick={handleSave}><Save size={13} /> Save All Changes</Btn>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab Sidebar */}
        <Card className="p-3 h-fit">
          <nav className="space-y-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <t.icon size={16} className={activeTab === t.id ? 'text-white' : 'text-slate-400'} />
                {t.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Tab Content */}
        <div className="lg:col-span-3">
          {content[activeTab]}
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary">Discard Changes</Btn>
            <Btn onClick={handleSave}><Save size={13} /> Save Changes</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
