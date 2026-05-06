import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brain, Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const perks = ['Free forever', 'No credit card required', 'Daily quiz challenges', 'Leaderboard & rankings']

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', exam: 'JEE', class: '11' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await signup(form)
      toast.success('Account created! Welcome to StudyQuest 🚀')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc' }}>
      {/* ── Left branding panel ── */}
      <div style={{
        flex: '0 0 420px', background: 'linear-gradient(160deg, #4f46e5 0%, #7c3aed 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '64px 52px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={20} color="white" />
            </div>
            <span className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>StudyQuest</span>
          </div>

          <h2 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 12 }}>
            Start your journey to IIT or MBBS
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 36 }}>
            Join thousands of students who are using StudyQuest to track their progress and ace their exams.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {perks.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={16} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 64px', maxWidth: 560 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
            It's free and takes less than a minute
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                <User size={15} />
              </span>
              <input name="name" value={form.name} onChange={handle} className="input" style={{ paddingLeft: 38 }} placeholder="Himanshu Sharma" required />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                <Mail size={15} />
              </span>
              <input name="email" type="email" value={form.email} onChange={handle} className="input" style={{ paddingLeft: 38 }} placeholder="you@example.com" required />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                <Lock size={15} />
              </span>
              <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handle} className="input" style={{ paddingLeft: 38, paddingRight: 42 }} placeholder="Min. 6 characters" required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Exam + Class */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Target Exam</label>
              <select name="exam" value={form.exam} onChange={handle} className="input">
                <option value="JEE">JEE</option>
                <option value="NEET">NEET</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Class</label>
              <select name="class" value={form.class} onChange={handle} className="input">
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
                <option value="Dropper">Dropper</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg"
            style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}>
            {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account →'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
