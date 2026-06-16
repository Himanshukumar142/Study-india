import { useState, useEffect } from 'react'
import {
  Layers, Plus, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, X,
  Trash2, Edit3, Save, Brain, Zap, Clock, Target, BookOpen, Loader2, Search
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']
const QUALITY_LABELS = [
  { q:0, label:'Forgot',  emoji:'😓', color:'#ef4444', bg:'#fff1f2', hover:'#fca5a5' },
  { q:3, label:'Hard',    emoji:'😅', color:'#f97316', bg:'#fff7ed', hover:'#fed7aa' },
  { q:4, label:'Good',    emoji:'😊', color:'#3b82f6', bg:'#eff6ff', hover:'#bfdbfe' },
  { q:5, label:'Easy',    emoji:'🚀', color:'#10b981', bg:'#ecfdf5', hover:'#6ee7b7' },
]
const SUB_COLORS = {
  Physics:     { color:'#3b82f6', bg:'#eff6ff', border:'#bfdbfe' },
  Chemistry:   { color:'#10b981', bg:'#ecfdf5', border:'#6ee7b7' },
  Mathematics: { color:'#8b5cf6', bg:'#f5f3ff', border:'#c4b5fd' },
  Biology:     { color:'#f59e0b', bg:'#fffbeb', border:'#fcd34d' },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .fc-root * { box-sizing:border-box; font-family:'Inter',system-ui,sans-serif; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideIn  { from{opacity:0;transform:translateY(24px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes flip3d   { from{transform:rotateY(0deg)} to{transform:rotateY(180deg)} }
  .fc-fade-up   { animation:fadeUp .35s ease both; }
  .fc-fade-in   { animation:fadeIn .3s ease both; }
  .fc-spin      { animation:spin .8s linear infinite; }

  .fc-card {
    background:white; border-radius:20px; border:1px solid rgba(226,232,240,.8);
    box-shadow:0 4px 20px rgba(0,0,0,.05);
  }
  .fc-browse-card {
    background:white; border-radius:16px; border:1.5px solid #f1f5f9; padding:20px;
    transition:all .2s ease;
  }
  .fc-browse-card:hover { border-color:#c4b5fd; box-shadow:0 6px 20px rgba(139,92,246,.1); transform:translateY(-1px); }

  .fc-tab { padding:9px 20px; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .2s ease; font-family:'Inter',sans-serif; white-space:nowrap; }
  .fc-tab.active   { background:white; color:#8b5cf6; box-shadow:0 2px 12px rgba(139,92,246,.15); }
  .fc-tab.inactive { background:transparent; color:#64748b; }
  .fc-tab.inactive:hover { color:#1e293b; background:rgba(255,255,255,.6); }

  .fc-input {
    width:100%; padding:12px 16px; border:1.5px solid #e2e8f0; border-radius:12px;
    font-size:14px; font-weight:500; color:#1e293b; background:#f8fafc; outline:none;
    transition:all .2s ease; font-family:'Inter',sans-serif; resize:none;
  }
  .fc-input:focus { border-color:#8b5cf6; background:white; box-shadow:0 0 0 4px rgba(139,92,246,.1); }
  .fc-input::placeholder { color:#94a3b8; }

  .fc-select { padding:10px 14px; border-radius:12px; border:1.5px solid #e2e8f0; font-size:13px; font-weight:600; color:#1e293b; background:white; outline:none; transition:border-color .2s; cursor:pointer; font-family:'Inter',sans-serif; width:100%; }
  .fc-select:focus { border-color:#8b5cf6; }

  .fc-action-btn { width:30px; height:30px; border-radius:8px; border:none; background:#f8fafc; color:#94a3b8; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s ease; }
  .fc-action-btn.edit:hover   { background:#eff6ff; color:#3b82f6; }
  .fc-action-btn.del:hover    { background:#fff1f2; color:#ef4444; }

  .fc-shimmer {
    border-radius:16px; height:90px;
    background:linear-gradient(90deg,#f1f5f9 25%,#e8eef8 50%,#f1f5f9 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite;
  }

  /* 3D Flip */
  .fc-flip-wrapper { perspective:1200px; cursor:pointer; }
  .fc-flip-inner   { position:relative; transition:transform .55s cubic-bezier(.4,0,.2,1); transform-style:preserve-3d; }
  .fc-flip-inner.flipped { transform:rotateY(180deg); }
  .fc-flip-face    { backface-visibility:hidden; -webkit-backface-visibility:hidden; }
  .fc-flip-back    { position:absolute; inset:0; transform:rotateY(180deg); }
`

export default function FlashcardPage() {
  const [view,       setView]       = useState('dashboard')
  const [cards,      setCards]      = useState([])
  const [stats,      setStats]      = useState({ total:0, due:0, bySubject:[] })
  const [loading,    setLoading]    = useState(true)
  const [subFilter,  setSubFilter]  = useState('all')
  const [search,     setSearch]     = useState('')
  const [studyCards, setStudyCards] = useState([])
  const [studyIdx,   setStudyIdx]   = useState(0)
  const [flipped,    setFlipped]    = useState(false)
  const [studied,    setStudied]    = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [form,       setForm]       = useState({ subject:'Physics', chapter:'', front:'', back:'', difficulty:'medium' })
  const [editId,     setEditId]     = useState(null)
  const [saving,     setSaving]     = useState(false)

  useEffect(() => { fetchAll() }, [subFilter])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (subFilter !== 'all') params.set('subject', subFilter)
      const [cardsRes, statsRes] = await Promise.all([
        api.get(`/flashcards?${params}`),
        api.get('/flashcards/stats'),
      ])
      setCards(cardsRes.data.data || [])
      setStats(statsRes.data.data || { total:0, due:0, bySubject:[] })
    } catch {} finally { setLoading(false) }
  }

  const startStudy = (onlyDue=true) => {
    let toStudy = cards
    if (onlyDue) toStudy = cards.filter(c => new Date(c.nextReview) <= new Date())
    if (!toStudy.length) { toast.error('No cards to study!'); return }
    setStudyCards(toStudy); setStudyIdx(0); setFlipped(false); setStudied(0); setView('study')
  }

  const handleReview = async (quality) => {
    const card = studyCards[studyIdx]
    try { await api.post(`/flashcards/${card._id}/review`, { quality }) } catch {}
    setStudied(p=>p+1)
    if (studyIdx < studyCards.length - 1) { setStudyIdx(p=>p+1); setFlipped(false) }
    else { toast.success(`Session done! Reviewed ${studyCards.length} cards 🎉`); setView('dashboard'); fetchAll() }
  }

  const handleCreate = async () => {
    if (!form.front || !form.back) { toast.error('Front and back required'); return }
    setSaving(true)
    try {
      if (editId) { await api.put(`/flashcards/${editId}`, form); toast.success('Card updated!') }
      else        { await api.post('/flashcards', form); toast.success('Card created!') }
      setShowCreate(false); setEditId(null); setForm({ subject:'Physics', chapter:'', front:'', back:'', difficulty:'medium' }); fetchAll()
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await api.delete(`/flashcards/${id}`); setCards(p=>p.filter(c=>c._id!==id)); toast.success('Deleted') }
    catch { toast.error('Failed') }
  }

  const openEdit = (card) => {
    setForm({ subject:card.subject, chapter:card.chapter, front:card.front, back:card.back, difficulty:card.difficulty })
    setEditId(card._id); setShowCreate(true)
  }

  const dueCards = cards.filter(c => new Date(c.nextReview) <= new Date())
  const filtered = cards.filter(c => !search || c.front.toLowerCase().includes(search.toLowerCase()) || c.back.toLowerCase().includes(search.toLowerCase()))

  /* ──────────────── STUDY MODE ──────────────── */
  if (view === 'study') {
    const card = studyCards[studyIdx]
    if (!card) return null
    const progress = ((studyIdx+1)/studyCards.length)*100
    const sc = SUB_COLORS[card.subject] || { color:'#6366f1', bg:'#ede9fe', border:'#c4b5fd' }

    return (
      <div className="fc-root" style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#f0f2ff 50%,#f8f9fc 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <style>{css}</style>
        <div style={{ maxWidth:560, width:'100%', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Top bar */}
          <div className="fc-card" style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={() => { setView('dashboard'); fetchAll() }} style={{ width:36, height:36, borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8' }}>Card {studyIdx+1} of {studyCards.length}</span>
                <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8' }}>{studied} reviewed</span>
              </div>
              <div style={{ height:6, background:'#e8eaf6', borderRadius:999, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg,#8b5cf6,#6366f1)', borderRadius:999, width:`${progress}%`, transition:'width .4s ease' }} />
              </div>
            </div>
            <div style={{ background:'#1e293b', borderRadius:10, padding:'6px 12px', fontSize:12, fontWeight:900, color:'white', fontFamily:'monospace' }}>
              {studied}/{studyCards.length}
            </div>
          </div>

          {/* Flashcard flip */}
          <div className="fc-flip-wrapper fc-fade-up" style={{ minHeight:300 }} onClick={() => setFlipped(f=>!f)}>
            <div className={`fc-flip-inner${flipped?' flipped':''}`} style={{ minHeight:300 }}>

              {/* Front */}
              <div className="fc-flip-face" style={{
                background:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#9333ea 100%)',
                borderRadius:24, padding:40, minHeight:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', color:'white',
                boxShadow:'0 20px 60px rgba(99,102,241,.3)'
              }}>
                <div style={{ position:'absolute', top:20, left:0, right:0, display:'flex', justifyContent:'center', gap:8 }}>
                  <span style={{ background:'rgba(255,255,255,.15)', borderRadius:8, padding:'4px 12px', fontSize:10, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase' }}>{card.subject}</span>
                  {card.chapter && <span style={{ background:'rgba(255,255,255,.1)', borderRadius:8, padding:'4px 12px', fontSize:10, fontWeight:700 }}>{card.chapter}</span>}
                </div>
                <p style={{ fontSize:20, fontWeight:700, lineHeight:1.6, marginBottom:24 }}>{card.front}</p>
                <div style={{ display:'flex', alignItems:'center', gap:6, opacity:.6, fontSize:12, fontWeight:600 }}>
                  <RotateCcw size={12} /> Tap to reveal answer
                </div>
              </div>

              {/* Back */}
              <div className="fc-flip-face fc-flip-back" style={{
                background:'white', borderRadius:24, padding:40, minHeight:300,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center',
                border:'2px solid #ede9fe', boxShadow:'0 20px 60px rgba(139,92,246,.15)'
              }}>
                <div style={{ width:48, height:48, borderRadius:16, background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                  <CheckCircle2 size={22} style={{ color:'#7c3aed' }} />
                </div>
                <p style={{ fontSize:17, fontWeight:600, color:'#1e293b', lineHeight:1.7 }}>{card.back}</p>
              </div>
            </div>
          </div>

          {/* Rating buttons */}
          {flipped && (
            <div className="fc-fade-up" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <p style={{ textAlign:'center', fontSize:12, fontWeight:700, color:'#94a3b8', letterSpacing:'.04em' }}>HOW WELL DID YOU KNOW THIS?</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {QUALITY_LABELS.map(ql => (
                  <button key={ql.q} onClick={() => handleReview(ql.q)} style={{
                    padding:'14px 8px', borderRadius:14, border:`2px solid ${ql.hover}`, background:ql.bg,
                    cursor:'pointer', transition:'all .15s ease', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:6
                  }}>
                    <span style={{ fontSize:20 }}>{ql.emoji}</span>
                    <span style={{ fontSize:12, fontWeight:800, color:ql.color }}>{ql.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ──────────────── BROWSE MODE ──────────────── */
  if (view === 'browse') return (
    <div className="fc-root" style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#f0f2ff 50%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui" }}>
      <style>{css}</style>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:20 }}>

        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={() => setView('dashboard')} style={{ width:40, height:40, borderRadius:12, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ flex:1 }}>
            <h2 style={{ fontSize:18, fontWeight:900, color:'#1e293b', margin:0 }}>All Flashcards</h2>
            <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>{cards.length} cards total</p>
          </div>
          <button onClick={() => { setShowCreate(true); setEditId(null) }} style={{
            padding:'10px 20px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#8b5cf6,#6366f1)',
            color:'white', fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontFamily:'inherit'
          }}>
            <Plus size={15} /> New Card
          </button>
        </div>

        {/* Search */}
        <div style={{ position:'relative' }}>
          <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input className="fc-input" style={{ paddingLeft:42 }} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search flashcards…" />
        </div>

        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {filtered.map(c => {
            const isDue = new Date(c.nextReview) <= new Date()
            const sc = SUB_COLORS[c.subject] || { color:'#6366f1', bg:'#ede9fe', border:'#c4b5fd' }
            return (
              <div key={c._id} className="fc-browse-card">
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <span style={{ padding:'3px 10px', borderRadius:8, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, fontSize:10, fontWeight:800 }}>{c.subject}</span>
                    {isDue && <span style={{ padding:'3px 10px', borderRadius:8, background:'#fffbeb', color:'#d97706', border:'1px solid #fcd34d', fontSize:10, fontWeight:800 }}>DUE</span>}
                  </div>
                  <div style={{ display:'flex', gap:5 }}>
                    <button className="fc-action-btn edit" onClick={() => openEdit(c)}><Edit3 size={12} /></button>
                    <button className="fc-action-btn del" onClick={() => handleDelete(c._id)}><Trash2 size={12} /></button>
                  </div>
                </div>
                <p style={{ fontSize:14, fontWeight:700, color:'#1e293b', marginBottom:8, lineHeight:1.5 }}>{c.front}</p>
                <p style={{ fontSize:12, color:'#94a3b8', lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{c.back}</p>
                <div style={{ display:'flex', gap:10, marginTop:12, fontSize:10, fontWeight:700, color:'#cbd5e1' }}>
                  <span>Reviews: {c.reviewCount}</span>
                  <span>Interval: {c.interval}d</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {showCreate && <CardModal form={form} setForm={setForm} editId={editId} saving={saving} onCreate={handleCreate} onClose={() => { setShowCreate(false); setEditId(null) }} />}
    </div>
  )

  /* ──────────────── DASHBOARD ──────────────── */
  return (
    <div className="fc-root" style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#f0f2ff 50%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui" }}>
      <style>{css}</style>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Hero */}
        <div className="fc-fade-up" style={{
          background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4c1d95 100%)',
          borderRadius:28, padding:'44px 44px 40px', color:'white', position:'relative', overflow:'hidden',
          boxShadow:'0 20px 60px rgba(79,70,229,.3)'
        }}>
          <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(139,92,246,.2)', filter:'blur(50px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-30, left:'30%', width:180, height:180, borderRadius:'50%', background:'rgba(99,102,241,.15)', filter:'blur(40px)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Layers size={18} style={{color:'#c4b5fd'}} />
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.5)', letterSpacing:'.1em', textTransform:'uppercase' }}>SM-2 Spaced Repetition</span>
            </div>
            <h1 style={{ fontSize:'clamp(24px,4vw,38px)', fontWeight:900, margin:'0 0 8px', lineHeight:1.1 }}>Flashcards</h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.6)', margin:'0 0 28px' }}>Never forget what you learn. Smart revision powered by science.</p>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { label:'Total Cards', val:stats.total,              color:'white' },
                { label:'Due Today',   val:stats.due,               color:'#fde68a' },
                { label:'Subjects',    val:stats.bySubject?.length||0, color:'white' },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,.1)', borderRadius:16, padding:'16px 18px', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.1)', textAlign:'center' }}>
                  <div style={{ fontSize:26, fontWeight:900, color:s.color, lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.55)', marginTop:4, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <button onClick={() => startStudy(true)} disabled={stats.due===0} style={{
            padding:'20px', borderRadius:18, border:'none',
            background: stats.due>0 ? 'linear-gradient(135deg,#f59e0b,#f97316)' : '#e2e8f0',
            color: stats.due>0 ? 'white' : '#94a3b8',
            fontWeight:900, fontSize:15, cursor: stats.due>0?'pointer':'not-allowed',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            boxShadow: stats.due>0?'0 8px 28px rgba(245,158,11,.35)':'none', fontFamily:'inherit'
          }}>
            <Brain size={24} style={{ opacity: stats.due>0?1:.4 }} />
            Study Due
            <span style={{ fontSize:12, fontWeight:700, opacity:.8 }}>{stats.due} cards</span>
          </button>
          <button onClick={() => startStudy(false)} disabled={stats.total===0} style={{
            padding:'20px', borderRadius:18, border:'none',
            background: stats.total>0 ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : '#e2e8f0',
            color: stats.total>0 ? 'white' : '#94a3b8',
            fontWeight:900, fontSize:15, cursor: stats.total>0?'pointer':'not-allowed',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            boxShadow: stats.total>0?'0 8px 28px rgba(99,102,241,.35)':'none', fontFamily:'inherit'
          }}>
            <Layers size={24} style={{ opacity: stats.total>0?1:.4 }} />
            Study All
            <span style={{ fontSize:12, fontWeight:700, opacity:.8 }}>{stats.total} cards</span>
          </button>
        </div>

        {/* Secondary Actions */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            { label:'Create Card', icon:Plus, onClick:() => { setShowCreate(true); setEditId(null); setForm({ subject:'Physics', chapter:'', front:'', back:'', difficulty:'medium' }) } },
            { label:'Browse All',  icon:BookOpen, onClick:() => setView('browse') },
          ].map(a => (
            <button key={a.label} onClick={a.onClick} style={{
              padding:'14px', borderRadius:14, border:'1.5px solid #e2e8f0', background:'white',
              fontWeight:700, fontSize:14, color:'#374151', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit',
              transition:'all .15s ease'
            }}>
              <a.icon size={17} style={{color:'#8b5cf6'}} /> {a.label}
            </button>
          ))}
        </div>

        {/* Subject breakdown */}
        {stats.bySubject?.length > 0 && (
          <div className="fc-card" style={{ padding:24 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#1e293b', marginBottom:16 }}>Cards by Subject</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {stats.bySubject.map((s,i) => {
                const sc = SUB_COLORS[s._id] || { color:'#6366f1', bg:'#ede9fe', border:'#c4b5fd' }
                const pct = stats.total>0 ? Math.round((s.count/stats.total)*100) : 0
                return (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:sc.color }} />
                        <span style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>{s._id}</span>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        {s.dueCount>0 && <span style={{ fontSize:10, fontWeight:800, color:'#d97706', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:6, padding:'2px 8px' }}>{s.dueCount} due</span>}
                        <span style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>{s.count} cards</span>
                      </div>
                    </div>
                    <div style={{ height:6, background:'#f1f5f9', borderRadius:999, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:sc.color, borderRadius:999, width:`${pct}%`, opacity:.8, transition:'width .6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent cards */}
        {cards.length > 0 && (
          <div className="fc-card" style={{ padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#1e293b' }}>Recent Cards</div>
              <button onClick={() => setView('browse')} style={{ fontSize:12, fontWeight:700, color:'#8b5cf6', background:'none', border:'none', cursor:'pointer' }}>View All →</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {cards.slice(0,5).map(c => {
                const isDue = new Date(c.nextReview) <= new Date()
                const sc = SUB_COLORS[c.subject] || { color:'#6366f1', bg:'#ede9fe', border:'#c4b5fd' }
                return (
                  <div key={c._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, background:'#fafbff', border:'1px solid #f1f5f9', transition:'all .15s ease' }}>
                    <div style={{ width:4, height:36, borderRadius:999, background: isDue?'#f59e0b':'#10b981', flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{c.front}</p>
                      <p style={{ fontSize:10, color:'#94a3b8' }}>{c.subject}{c.chapter?` · ${c.chapter}`:''}</p>
                    </div>
                    <span style={{ fontSize:10, fontWeight:800, padding:'3px 9px', borderRadius:7, background:isDue?'#fffbeb':'#ecfdf5', color:isDue?'#d97706':'#059669', border:`1px solid ${isDue?'#fcd34d':'#6ee7b7'}` }}>
                      {isDue?'Due':`${c.interval}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {showCreate && <CardModal form={form} setForm={setForm} editId={editId} saving={saving} onCreate={handleCreate} onClose={() => { setShowCreate(false); setEditId(null) }} />}
    </div>
  )
}

function CardModal({ form, setForm, editId, saving, onCreate, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:24, width:'100%', maxWidth:500, padding:32, boxShadow:'0 24px 64px rgba(0,0,0,.18)', animation:'slideIn .3s cubic-bezier(.34,1.56,.64,1)', fontFamily:"'Inter',system-ui" }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:900, color:'#1e293b' }}>{editId ? '✏️ Edit Card' : '✨ New Flashcard'}</div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}><X size={16} /></button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Front (Question / Term)</label>
            <textarea className="fc-input" rows={3} value={form.front} onChange={e=>setForm({...form,front:e.target.value})} placeholder="What is Newton's Second Law?" />
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Back (Answer / Definition)</label>
            <textarea className="fc-input" rows={3} value={form.back} onChange={e=>setForm({...form,back:e.target.value})} placeholder="F = ma — Force equals mass times acceleration." />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Subject</label>
              <select className="fc-select" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}>
                {SUBJECTS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Chapter</label>
              <input className="fc-input" style={{ height:44 }} value={form.chapter} onChange={e=>setForm({...form,chapter:e.target.value})} placeholder="Optional" />
            </div>
          </div>
          <button onClick={onCreate} disabled={saving} style={{
            width:'100%', padding:14, borderRadius:14, border:'none',
            background: saving?'#e2e8f0':'linear-gradient(135deg,#8b5cf6,#6366f1)',
            color: saving?'#94a3b8':'white', fontWeight:800, fontSize:15, cursor:saving?'wait':'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow:saving?'none':'0 4px 20px rgba(139,92,246,.35)', fontFamily:'inherit'
          }}>
            {saving?<span className="fc-spin" style={{ width:16,height:16,border:'2px solid #94a3b8',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block' }}/>:<Save size={16}/>}
            {saving?'Saving…':editId?'Update Card':'Create Card'}
          </button>
        </div>
      </div>
    </div>
  )
}
