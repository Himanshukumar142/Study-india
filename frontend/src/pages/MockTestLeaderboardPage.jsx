import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Trophy, Clock, Target, ArrowLeft, Crown } from 'lucide-react'
import toast from 'react-hot-toast'

const rankConfig = {
  1: { color: '#ca8a04', bg: '#fefce8', border: '#fde047', icon: '🥇' },
  2: { color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', icon: '🥈' },
  3: { color: '#c2410c', bg: '#fff7ed', border: '#fdba74', icon: '🥉' },
}

const Avatar = ({ name, size = 40, colored = true }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: colored ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#e2e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: colored ? 'white' : '#64748b', fontWeight: 700, fontSize: size * 0.37,
  }}>
    {name?.[0]?.toUpperCase()}
  </div>
)

export default function MockTestLeaderboardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/mock-tests/${id}/leaderboard`)
      .then(({ data }) => setAttempts(data.data))
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontSize: 14, fontWeight: 600 }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>All India Mock Test Leaderboard</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Real-time rankings based on score and time taken.</p>
      </div>

      {attempts.length > 0 ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Rank</th>
                <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Student</th>
                <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Marks</th>
                <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Accuracy</th>
                <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Time Taken</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((att, idx) => {
                const rank = idx + 1
                const cfg = rankConfig[rank]
                return (
                  <tr key={att._id} style={{ borderBottom: idx < attempts.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.1s' }}>
                    <td style={{ padding: '16px 20px' }}>
                      {cfg ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontWeight: 900 }}>
                          {rank}
                        </div>
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', paddingLeft: 10 }}>#{rank}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={att.userId?.name} size={32} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{att.userId?.name}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>Level {att.userId?.level}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#4f46e5' }}>{att.obtainedMarks} <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>/ {att.totalMarks}</span></div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: att.accuracy >= 70 ? '#10b981' : '#f59e0b' }}>
                        <Target size={14} /> {att.accuracy}%
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748b' }}>
                        <Clock size={14} /> {fmt(att.timeTakenSeconds)}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trophy size={32} color="#94a3b8" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>No attempts yet</h3>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Rankings will appear once students complete the test.</p>
        </div>
      )}
    </div>
  )
}
