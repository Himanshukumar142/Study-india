import { useState, useEffect } from 'react'
import { Trophy, RefreshCw, Zap, CheckCircle2, Loader2, Star, Lock } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const RARITY = {
  common:    { label:'Common',    color:'#64748b', bg:'#f8fafc', border:'#e2e8f0', glow:'none' },
  rare:      { label:'Rare',      color:'#3b82f6', bg:'#eff6ff', border:'#bfdbfe', glow:'0 0 20px rgba(59,130,246,.25)' },
  epic:      { label:'Epic',      color:'#8b5cf6', bg:'#f5f3ff', border:'#c4b5fd', glow:'0 0 20px rgba(139,92,246,.3)' },
  legendary: { label:'Legendary', color:'#f59e0b', bg:'#fffbeb', border:'#fcd34d', glow:'0 0 24px rgba(245,158,11,.4)' },
}

const CATEGORIES = {
  streak:    { label:'🔥 Streaks',   grad:'linear-gradient(135deg,#f97316,#ef4444)' },
  quiz:      { label:'📝 Quizzes',   grad:'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  score:     { label:'⭐ Scores',    grad:'linear-gradient(135deg,#eab308,#f59e0b)' },
  questions: { label:'🧠 Questions', grad:'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  subject:   { label:'📚 Subjects',  grad:'linear-gradient(135deg,#10b981,#14b8a6)' },
  xp:        { label:'⚡ XP',        grad:'linear-gradient(135deg,#ec4899,#f43f5e)' },
  special:   { label:'✨ Special',   grad:'linear-gradient(135deg,#a855f7,#ec4899)' },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .bg-root * { box-sizing:border-box; font-family:'Inter',system-ui,sans-serif; }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes legendPulse { 0%,100%{box-shadow:0 0 24px rgba(245,158,11,.4)} 50%{box-shadow:0 0 36px rgba(245,158,11,.7)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  .bg-fade-up { animation:fadeUp .35s ease both; }
  .bg-spin    { animation:spin .8s linear infinite; }

  .bg-filter-btn { padding:9px 18px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:all .2s ease; font-family:'Inter',sans-serif; }
  .bg-filter-btn.active   { background:#b45309; color:white; }
  .bg-filter-btn.inactive { background:transparent; color:#64748b; }
  .bg-filter-btn.inactive:hover { color:#1e293b; background:rgba(180,83,9,.08); }

  .bg-badge-card {
    border-radius:20px; border:2px solid; padding:20px 16px; text-align:center;
    transition:all .2s ease; position:relative; overflow:hidden; cursor:default;
  }
  .bg-badge-card.unlocked:hover { transform:translateY(-4px) scale(1.02); }
  .bg-badge-card.locked { opacity:.45; filter:grayscale(.6); }
  .bg-badge-card.legendary { animation:legendPulse 3s ease infinite; }

  .bg-shimmer {
    border-radius:20px; height:140px;
    background:linear-gradient(90deg,#f1f5f9 25%,#e8eef8 50%,#f1f5f9 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite;
  }
`

export default function BadgesPage() {
  const [badges,   setBadges]   = useState([])
  const [stats,    setStats]    = useState({ total:0, owned:0, pct:0 })
  const [loading,  setLoading]  = useState(true)
  const [checking, setChecking] = useState(false)
  const [filter,   setFilter]   = useState('all')
  const [category, setCategory] = useState('all')

  useEffect(() => { fetchBadges() }, [])

  const fetchBadges = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/badges')
      setBadges(data.data || []); setStats(data.stats || { total:0, owned:0, pct:0 })
    } catch { toast.error('Failed to load badges') }
    finally { setLoading(false) }
  }

  const checkBadges = async () => {
    setChecking(true)
    try {
      const { data } = await api.post('/badges/check')
      if (data.newBadges?.length > 0) { toast.success(`🎉 ${data.newBadges.length} new badge${data.newBadges.length>1?'s':''} unlocked!`); fetchBadges() }
      else toast('No new badges yet. Keep studying! 💪')
    } catch { toast.error('Failed') }
    finally { setChecking(false) }
  }

  const filtered = badges.filter(b => {
    if (filter==='owned' && !b.owned) return false
    if (filter==='locked' && b.owned) return false
    if (category!=='all' && b.category!==category) return false
    return true
  })

  const grouped = Object.entries(CATEGORIES).reduce((acc,[cat]) => {
    const cb = filtered.filter(b=>b.category===cat)
    if (cb.length>0) acc[cat]=cb; return acc
  }, {})

  const owned = badges.filter(b=>b.owned)
  const recent = [...owned].sort((a,b)=>new Date(b.earnedAt)-new Date(a.earnedAt)).slice(0,3)

  return (
    <div className="bg-root" style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#fff7ed 50%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui" }}>
      <style>{css}</style>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Hero */}
        <div className="bg-fade-up" style={{
          background:'linear-gradient(135deg,#78350f 0%,#b45309 40%,#d97706 100%)',
          borderRadius:28, padding:'44px 48px', color:'white', position:'relative', overflow:'hidden',
          boxShadow:'0 20px 60px rgba(180,83,9,.35)'
        }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.07)', filter:'blur(40px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-30, left:'25%', width:160, height:160, borderRadius:'50%', background:'rgba(245,158,11,.15)', filter:'blur(30px)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Trophy size={18} style={{color:'#fde68a'}} />
                  </div>
                  <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.55)', letterSpacing:'.1em', textTransform:'uppercase' }}>Achievements</span>
                </div>
                <h1 style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:900, margin:'0 0 6px' }}>Your Badges</h1>
                <p style={{ fontSize:13, color:'rgba(255,255,255,.65)', margin:0 }}>Unlock by studying, completing quizzes, and hitting milestones</p>
              </div>
              <button onClick={checkBadges} disabled={checking} style={{
                padding:'12px 22px', borderRadius:14, border:'none', background:'rgba(255,255,255,.2)', backdropFilter:'blur(8px)',
                color:'white', fontWeight:800, fontSize:13, cursor:checking?'wait':'pointer',
                display:'flex', alignItems:'center', gap:8, fontFamily:'inherit', border:'1px solid rgba(255,255,255,.3)'
              }}>
                {checking ? <span className="bg-spin" style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'white',borderRadius:'50%',display:'inline-block' }}/> : <RefreshCw size={14}/>}
                {checking?'Checking…':'Check for Badges'}
              </button>
            </div>

            {/* Stats tiles */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
              {[
                { label:'Unlocked', val:stats.owned },
                { label:'Total',    val:stats.total },
                { label:'Progress', val:`${stats.pct}%` },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,.12)', backdropFilter:'blur(8px)', borderRadius:16, padding:'14px 18px', border:'1px solid rgba(255,255,255,.1)', textAlign:'center' }}>
                  <div style={{ fontSize:26, fontWeight:900 }}>{s.val}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.6)', marginTop:3, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ height:8, background:'rgba(255,255,255,.2)', borderRadius:999, overflow:'hidden' }}>
              <div style={{ height:'100%', background:'white', borderRadius:999, width:`${stats.pct}%`, transition:'width .7s ease' }} />
            </div>
          </div>
        </div>

        {/* Recently earned */}
        {recent.length > 0 && (
          <div style={{ background:'white', borderRadius:20, border:'1px solid rgba(226,232,240,.8)', boxShadow:'0 4px 20px rgba(0,0,0,.05)', padding:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Zap size={16} style={{color:'#f59e0b'}} />
              <span style={{ fontSize:14, fontWeight:800, color:'#1e293b' }}>Recently Earned</span>
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {recent.map(b => (
                <div key={b.id} style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:180, padding:'14px 18px', borderRadius:14, background:'linear-gradient(135deg,#fffbeb,#fef3c7)', border:'1px solid #fcd34d' }}>
                  <div style={{ fontSize:28 }}>{b.icon}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:'#1e293b' }}>{b.name}</div>
                    <div style={{ fontSize:10, color:'#d97706', fontWeight:700 }}>{new Date(b.earnedAt).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <div style={{ background:'rgba(255,255,255,.8)', borderRadius:14, padding:6, display:'flex', gap:4, border:'1px solid rgba(226,232,240,.6)' }}>
            {[{v:'all',l:'All'},{v:'owned',l:`✅ Unlocked (${stats.owned})`},{v:'locked',l:`🔒 Locked (${stats.total-stats.owned})`}].map(f => (
              <button key={f.v} className={`bg-filter-btn${filter===f.v?' active':' inactive'}`} onClick={()=>setFilter(f.v)}>{f.l}</button>
            ))}
          </div>
          <div style={{ background:'rgba(255,255,255,.8)', borderRadius:14, padding:6, display:'flex', gap:4, border:'1px solid rgba(226,232,240,.6)', flexWrap:'wrap' }}>
            <button className={`bg-filter-btn${category==='all'?' active':' inactive'}`} onClick={()=>setCategory('all')}>All</button>
            {Object.entries(CATEGORIES).map(([cat,cfg]) => (
              <button key={cat} className={`bg-filter-btn${category===cat?' active':' inactive'}`} onClick={()=>setCategory(cat)}>{cfg.label}</button>
            ))}
          </div>
        </div>

        {/* Badge groups */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
            {[0,1,2,3,4,5,6,7].map(i=><div key={i} className="bg-shimmer" style={{ animationDelay:`${i*.08}s` }}/>)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ background:'white', borderRadius:20, border:'1px solid #f1f5f9', padding:60, textAlign:'center' }}>
            <Trophy size={36} style={{ color:'#e2e8f0', margin:'0 auto 16px', display:'block' }} />
            <div style={{ fontSize:16, fontWeight:700, color:'#94a3b8' }}>No badges match your filter</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {Object.entries(grouped).map(([cat, catBadges]) => {
              const cfg = CATEGORIES[cat]
              return (
                <div key={cat}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 16px', borderRadius:20, background:cfg.grad, color:'white', fontSize:12, fontWeight:800, marginBottom:14 }}>{cfg.label}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:12 }}>
                    {catBadges.map(b => {
                      const rc = RARITY[b.rarity] || RARITY.common
                      return (
                        <div key={b.id} className={`bg-badge-card${b.owned?' unlocked':'locked'}${b.owned&&b.rarity==='legendary'?' legendary':''}`}
                          style={{ background:b.owned?rc.bg:'#f8fafc', borderColor:b.owned?rc.border:'#e2e8f0', boxShadow:b.owned?rc.glow:'none' }}>

                          {b.owned && <div style={{ position:'absolute', top:10, right:10 }}>
                            <CheckCircle2 size={13} style={{ color:rc.color }} />
                          </div>}

                          <div style={{ fontSize:36, marginBottom:10, filter:b.owned?'none':'grayscale(1)' }}>{b.owned?b.icon:'🔒'}</div>
                          <div style={{ fontSize:12, fontWeight:800, color:b.owned?'#1e293b':'#94a3b8', marginBottom:5, lineHeight:1.4 }}>{b.name}</div>
                          <div style={{ fontSize:10, color:b.owned?'#64748b':'#cbd5e1', lineHeight:1.5, marginBottom:8 }}>{b.desc}</div>

                          <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, background:b.owned?rc.bg:'#f1f5f9', color:b.owned?rc.color:'#94a3b8', border:`1px solid ${b.owned?rc.border:'#e2e8f0'}`, fontSize:9, fontWeight:800, letterSpacing:'.04em', textTransform:'uppercase' }}>{rc.label}</span>

                          {b.xp > 0 && <div style={{ fontSize:9, fontWeight:800, color:b.owned?rc.color:'#cbd5e1', marginTop:4 }}>+{b.xp} XP</div>}
                          {b.owned && b.earnedAt && <div style={{ fontSize:8, color:'#94a3b8', marginTop:4 }}>{new Date(b.earnedAt).toLocaleDateString('en-IN')}</div>}
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
