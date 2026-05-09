import { useState, useEffect } from 'react'
import { Trophy, Lock, Star, Zap, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const RARITY_CONFIG = {
  common:    { label: 'Common',    bg: 'bg-slate-100',   border: 'border-slate-200', text: 'text-slate-500',   glow: '',                         badge: 'bg-slate-200 text-slate-600'   },
  rare:      { label: 'Rare',      bg: 'bg-blue-50',     border: 'border-blue-200',  text: 'text-blue-600',    glow: 'shadow-blue-200',          badge: 'bg-blue-100 text-blue-700'     },
  epic:      { label: 'Epic',      bg: 'bg-purple-50',   border: 'border-purple-300',text: 'text-purple-600',  glow: 'shadow-purple-200',        badge: 'bg-purple-100 text-purple-700' },
  legendary: { label: 'Legendary', bg: 'bg-amber-50',    border: 'border-amber-300', text: 'text-amber-600',   glow: 'shadow-amber-200',         badge: 'bg-amber-100 text-amber-700'   },
}

const CATEGORY_LABELS = {
  streak:    { label: '🔥 Streaks',   color: 'from-orange-500 to-red-500'     },
  quiz:      { label: '📝 Quizzes',   color: 'from-blue-500 to-cyan-500'      },
  score:     { label: '⭐ Scores',    color: 'from-yellow-500 to-amber-500'   },
  questions: { label: '🧠 Questions', color: 'from-indigo-500 to-violet-500'  },
  subject:   { label: '📚 Subjects',  color: 'from-emerald-500 to-teal-500'  },
  xp:        { label: '⚡ XP',        color: 'from-pink-500 to-rose-500'      },
  special:   { label: '✨ Special',   color: 'from-purple-500 to-pink-500'    },
}

export default function BadgesPage() {
  const [badges, setBadges] = useState([])
  const [stats, setStats] = useState({ total: 0, owned: 0, pct: 0 })
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [filter, setFilter] = useState('all')  // all | owned | locked
  const [category, setCategory] = useState('all')

  useEffect(() => { fetchBadges() }, [])

  const fetchBadges = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/badges')
      setBadges(data.data || [])
      setStats(data.stats || { total: 0, owned: 0, pct: 0 })
    } catch { toast.error('Failed to load badges') }
    finally { setLoading(false) }
  }

  const checkBadges = async () => {
    setChecking(true)
    try {
      const { data } = await api.post('/badges/check')
      if (data.newBadges?.length > 0) {
        toast.success(`🎉 ${data.newBadges.length} new badge${data.newBadges.length > 1 ? 's' : ''} unlocked!`)
        fetchBadges()
      } else {
        toast('No new badges yet. Keep studying!', { icon: '💪' })
      }
    } catch { toast.error('Failed') }
    finally { setChecking(false) }
  }

  const filtered = badges.filter(b => {
    if (filter === 'owned' && !b.owned) return false
    if (filter === 'locked' && b.owned) return false
    if (category !== 'all' && b.category !== category) return false
    return true
  })

  const grouped = Object.entries(CATEGORY_LABELS).reduce((acc, [cat]) => {
    const catBadges = filtered.filter(b => b.category === cat)
    if (catBadges.length > 0) acc[cat] = catBadges
    return acc
  }, {})

  const owned = badges.filter(b => b.owned)
  const recent = [...owned].sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt)).slice(0, 3)

  if (loading) return (
    <div className="min-h-full flex items-center justify-center bg-[#f8fafc]">
      <Loader2 size={32} className="animate-spin text-amber-500" />
    </div>
  )

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-3xl p-8 text-white shadow-2xl shadow-amber-500/25 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute right-16 bottom-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={18} className="text-yellow-200" />
            <span className="text-yellow-100 text-xs font-bold uppercase tracking-widest">Achievements</span>
          </div>
          <h1 className="text-3xl font-black mb-2">Your Badges</h1>
          <p className="text-yellow-100 text-sm mb-5">Unlock badges by studying, completing quizzes, and hitting milestones.</p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { l: 'Unlocked', v: stats.owned },
              { l: 'Total', v: stats.total },
              { l: 'Progress', v: `${stats.pct}%` },
            ].map(s => (
              <div key={s.l} className="bg-white/15 rounded-2xl p-4 text-center backdrop-blur-sm">
                <p className="text-2xl font-black">{s.v}</p>
                <p className="text-[10px] font-bold text-white/60">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${stats.pct}%` }} />
          </div>

          <button onClick={checkBadges} disabled={checking}
            className="px-5 py-2.5 bg-white text-amber-600 rounded-xl font-black text-sm hover:bg-amber-50 transition-all flex items-center gap-2 disabled:opacity-60">
            {checking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {checking ? 'Checking…' : 'Check for New Badges'}
          </button>
        </div>

        {/* Recently Earned */}
        {recent.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Zap size={14} className="text-amber-500" /> Recently Earned
            </h3>
            <div className="flex gap-4">
              {recent.map(b => (
                <div key={b.id} className="flex items-center gap-3 flex-1 p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                  <div className="text-3xl">{b.icon}</div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{b.name}</p>
                    <p className="text-[10px] text-amber-600 font-bold">{new Date(b.earnedAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
            {[
              { v: 'all', l: 'All' },
              { v: 'owned', l: `✅ Unlocked (${stats.owned})` },
              { v: 'locked', l: `🔒 Locked (${stats.total - stats.owned})` },
            ].map(f => (
              <button key={f.v} onClick={() => setFilter(f.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.v ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                {f.l}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 flex-wrap">
            <button onClick={() => setCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${category === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
              All
            </button>
            {Object.entries(CATEGORY_LABELS).map(([cat, cfg]) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${category === cat ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Badge groups */}
        {Object.entries(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Trophy size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="font-black text-slate-900">No badges to show</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, catBadges]) => {
              const catCfg = CATEGORY_LABELS[cat]
              return (
                <div key={cat}>
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r ${catCfg.color} text-white text-xs font-black mb-4`}>
                    {catCfg.label}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {catBadges.map(b => {
                      const rc = RARITY_CONFIG[b.rarity] || RARITY_CONFIG.common
                      return (
                        <div key={b.id}
                          className={`relative rounded-2xl border-2 p-4 text-center transition-all duration-200 group
                            ${b.owned
                              ? `${rc.bg} ${rc.border} shadow-lg ${rc.glow} hover:scale-105`
                              : 'bg-slate-50 border-slate-200 opacity-50 hover:opacity-70'
                            }`}>

                          {/* Rarity glow for legendary */}
                          {b.owned && b.rarity === 'legendary' && (
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 animate-pulse" />
                          )}

                          {/* Icon */}
                          <div className={`text-4xl mb-2 relative ${!b.owned ? 'grayscale' : ''}`}>
                            {b.owned ? b.icon : '🔒'}
                          </div>

                          {/* Name */}
                          <p className={`text-xs font-black mb-1 ${b.owned ? 'text-slate-900' : 'text-slate-400'}`}>
                            {b.name}
                          </p>

                          {/* Desc */}
                          <p className={`text-[9px] leading-snug mb-2 ${b.owned ? 'text-slate-500' : 'text-slate-300'}`}>
                            {b.desc}
                          </p>

                          {/* Rarity badge */}
                          <span className={`px-2 py-0.5 text-[8px] font-black rounded-full ${rc.badge}`}>
                            {rc.label}
                          </span>

                          {/* XP */}
                          {b.xp > 0 && (
                            <div className={`mt-1 text-[8px] font-bold ${b.owned ? rc.text : 'text-slate-300'}`}>
                              +{b.xp} XP
                            </div>
                          )}

                          {/* Owned tick */}
                          {b.owned && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle2 size={12} className={rc.text} />
                            </div>
                          )}

                          {/* Earned date tooltip */}
                          {b.owned && b.earnedAt && (
                            <p className="text-[8px] text-slate-400 mt-1">
                              {new Date(b.earnedAt).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
