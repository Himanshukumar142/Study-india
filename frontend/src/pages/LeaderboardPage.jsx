import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Trophy, Flame, Crown } from 'lucide-react'
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

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [leaders, setLeaders] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/leaderboard')
      .then(({ data }) => { setLeaders(data.data); setUserRank(data.userRank) })
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ padding: 32, maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Leaderboard</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Top students by XP this season</p>
      </div>

      {/* ── Top 3 Podium ── */}
      {leaders.length >= 3 && (
        <div className="card" style={{ padding: 32, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16 }}>
            {[leaders[1], leaders[0], leaders[2]].map((l, i) => {
              const realRank = [2, 1, 3][i]
              const cfg = rankConfig[realRank]
              const heights = { 1: 100, 2: 75, 3: 58 }
              return (
                <div key={l._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24 }}>{cfg.icon}</span>
                  <Avatar name={l.name} size={realRank === 1 ? 52 : 42} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'center', maxWidth: 80 }}>
                    {l.name?.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>{l.xp} XP</div>
                  <div style={{
                    width: 72, height: heights[realRank], borderRadius: '8px 8px 0 0',
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: cfg.color }}>#{realRank}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Your rank ── */}
      {userRank && (
        <div className="card" style={{ padding: '14px 20px', marginBottom: 16, background: '#eef2ff', border: '1.5px solid #c7d2fe', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#312e81' }}>Your Rank</div>
            <div style={{ fontSize: 12, color: '#4f46e5', marginTop: 2 }}>
              #{userRank} globally · {user?.xp} XP · Level {user?.level}
            </div>
          </div>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#4f46e5' }}>#{userRank}</span>
        </div>
      )}

      {/* ── Full list ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {leaders.map((l, idx) => {
          const isMe = l._id === user?._id || l._id?.toString() === user?._id?.toString()
          const cfg = rankConfig[l.rank]
          return (
            <div
              key={l._id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px',
                borderBottom: idx < leaders.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: isMe ? '#eef2ff' : 'white',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (!isMe) e.currentTarget.style.background = 'white' }}
            >
              {/* Rank */}
              <div style={{ width: 36, textAlign: 'center', fontSize: 16, flexShrink: 0 }}>
                {cfg ? <span>{cfg.icon}</span> : <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>#{l.rank}</span>}
              </div>

              <Avatar name={l.name} size={36} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {l.name}
                  {isMe && <span className="badge badge-purple" style={{ fontSize: 10 }}>You</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{l.exam}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#94a3b8' }}>
                    <Flame size={11} color="#d97706" /> {l.streak}d
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Lv.{l.level}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#4f46e5' }}>{l.xp}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>XP</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
