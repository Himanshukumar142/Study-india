import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { User, Lock, Target, Star, Flame, Clock, Edit3, Key, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'profile',  label: 'Profile',   icon: Edit3     },
  { id: 'password', label: 'Security',   icon: Key       },
  { id: 'stats',    label: 'Stats',     icon: BarChart2 },
]

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({ name: user?.name || '', exam: user?.exam || 'JEE', class: user?.class || '11', goals: user?.goals || '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [loading, setLoading] = useState(false)

  const handleProfile = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const { data } = await api.put('/users/profile', form)
      updateUser(data.data)
      toast.success('Profile updated!')
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    finally { setLoading(false) }
  }

  const handlePassword = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.put('/users/password', passwords)
      toast.success('Password changed!')
      setPasswords({ currentPassword: '', newPassword: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  const xpPercent = Math.min(((user?.xp || 0) % 1000) / 10, 100)

  const statItems = [
    { label: 'Total XP',    value: user?.xp || 0,                                              icon: Star,   color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Level',       value: `Level ${user?.level || 1}`,                                icon: Target, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Streak',      value: `${user?.streak || 0} days`,                               icon: Flame,  color: '#d97706', bg: '#fffbeb' },
    { label: 'Study Time',  value: `${Math.round((user?.totalStudyMinutes || 0) / 60)}h`,     icon: Clock,  color: '#0891b2', bg: '#ecfeff' },
  ]

  return (
    <div style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>My Profile</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Manage your account and view your stats</p>
      </div>

      {/* ── Profile hero card ── */}
      <div className="card" style={{ padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: 18, flexShrink: 0,
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 28, fontWeight: 800,
          boxShadow: '0 4px 20px rgba(79,70,229,0.3)',
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{user?.email}</div>
          {/* XP bar */}
          <div style={{ marginTop: 10, maxWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 5 }}>
              <span>Level {user?.level}</span>
              <span>{user?.xp} / {Math.ceil((user?.level || 1) * 1000)} XP</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>
        {/* Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <span className="badge badge-purple">Lv.{user?.level}</span>
          <span className="badge badge-amber">🔥 {user?.streak}d</span>
          <span className="badge badge-blue">{user?.exam}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: '#f8fafc', padding: 4, borderRadius: 12, border: '1px solid #e2e8f0' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '8px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: tab === id ? 'white' : 'transparent',
              color: tab === id ? '#4f46e5' : '#64748b',
              boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === 'profile' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Personal Info</div>
          <form onSubmit={handleProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Target Exam</label>
                <select value={form.exam} onChange={e => setForm({ ...form, exam: e.target.value })} className="input">
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Class</label>
                <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} className="input">
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                  <option value="Dropper">Dropper</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Goals</label>
              <textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })}
                className="input" rows={3} style={{ resize: 'none' }}
                placeholder="e.g. Score 99 percentile in JEE 2026..." />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: 'fit-content' }}>
              {loading ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* ── Password tab ── */}
      {tab === 'password' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Change Password</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Use a strong password with at least 6 characters</div>
          <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Current Password</label>
              <input type="password" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} className="input" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>New Password</label>
              <input type="password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} className="input" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: 'fit-content' }}>
              {loading ? <><span className="spinner" /> Updating...</> : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* ── Stats tab ── */}
      {tab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {statItems.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card" style={{ padding: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
