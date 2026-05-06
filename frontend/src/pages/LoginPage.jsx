import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brain, Mail, Lock, Eye, EyeOff, Zap, Target, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'

const features = [
  { icon: Zap,    label: 'Focus Mode Timer',      desc: 'Deep work sessions with distraction tracking' },
  { icon: Target, label: 'Adaptive Quizzes',       desc: 'Personalized questions for JEE & NEET'        },
  { icon: Trophy, label: 'Gamified Progress',      desc: 'XP, streaks, levels and leaderboards'          },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back! 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc' }}>
      {/* ── Left panel ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 64px', maxWidth: 520,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
          }}>
            <Brain size={22} color="white" />
          </div>
          <span className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
            StudyQuest
          </span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            Welcome back 👋
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
            Sign in to continue your JEE/NEET preparation
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                <Mail size={15} />
              </span>
              <input
                name="email" type="email" value={form.email} onChange={handle}
                className="input" style={{ paddingLeft: 38 }}
                placeholder="you@example.com" required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                <Lock size={15} />
              </span>
              <input
                name="password" type={showPass ? 'text' : 'password'}
                value={form.password} onChange={handle}
                className="input" style={{ paddingLeft: 38, paddingRight: 42 }}
                placeholder="••••••••" required
              />
              <button
                type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}
          >
            {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
            onMouseLeave={e => e.target.style.textDecoration = 'none'}
          >
            Create one free →
          </Link>
        </p>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #6d28d9 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '64px 56px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative' }}>
          <div className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', marginBottom: 20, borderRadius: 99, padding: '5px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex' }}>
            🏆 Trusted by 10,000+ students
          </div>
          <h2 className="font-display" style={{ fontSize: 32, fontWeight: 700, color: 'white', lineHeight: 1.25, marginBottom: 12 }}>
            Ace JEE & NEET with smarter study habits
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, marginBottom: 36 }}>
            Track your progress, practice with adaptive quizzes, and build consistent study streaks — all in one place.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
