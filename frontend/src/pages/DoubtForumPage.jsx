import { useState, useEffect } from 'react'
import {
  MessageCircle, Plus, Search, ThumbsUp, Send, Sparkles, X,
  Clock, Eye, Loader2, ArrowLeft, Tag, BookOpen, TrendingUp, Users
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']

const SUB_STYLE = {
  Physics:     { color:'#3b82f6', bg:'#eff6ff', border:'#bfdbfe' },
  Chemistry:   { color:'#10b981', bg:'#ecfdf5', border:'#6ee7b7' },
  Mathematics: { color:'#8b5cf6', bg:'#f5f3ff', border:'#c4b5fd' },
  Biology:     { color:'#f59e0b', bg:'#fffbeb', border:'#fcd34d' },
}
const ss = (sub) => SUB_STYLE[sub] || { color:'#6366f1', bg:'#ede9fe', border:'#c4b5fd' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .df-root * { box-sizing:border-box; font-family:'Inter',system-ui,sans-serif; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideIn  { from{opacity:0;transform:translateY(24px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .df-fade-up { animation:fadeUp .35s ease both; }
  .df-fade-in { animation:fadeIn .3s ease; }
  .df-spin    { animation:spin .8s linear infinite; }

  .df-card { background:white; border-radius:20px; border:1px solid rgba(226,232,240,.8); box-shadow:0 4px 20px rgba(0,0,0,.05); }

  .df-doubt-row {
    background:white; border-radius:18px; border:1.5px solid #f1f5f9; padding:20px 22px;
    cursor:pointer; transition:all .2s ease; display:flex; align-items:flex-start; gap:16px;
  }
  .df-doubt-row:hover { border-color:#c4b5fd; box-shadow:0 8px 24px rgba(139,92,246,.1); transform:translateY(-1px); }

  .df-avatar {
    width:42px; height:42px; border-radius:14px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; font-weight:900; font-size:16px;
  }

  .df-filter-btn { padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:all .2s ease; font-family:'Inter',sans-serif; text-transform:capitalize; }
  .df-filter-btn.active   { background:#7c3aed; color:white; }
  .df-filter-btn.inactive { background:transparent; color:#64748b; }
  .df-filter-btn.inactive:hover { color:#1e293b; background:rgba(124,58,237,.08); }

  .df-input {
    width:100%; padding:12px 16px; border:1.5px solid #e2e8f0; border-radius:12px;
    font-size:14px; font-weight:500; color:#1e293b; background:#f8fafc; outline:none;
    transition:all .2s ease; font-family:'Inter',sans-serif; resize:none;
  }
  .df-input:focus { border-color:#7c3aed; background:white; box-shadow:0 0 0 4px rgba(124,58,237,.1); }
  .df-input::placeholder { color:#94a3b8; }

  .df-select { padding:10px 14px; border-radius:12px; border:1.5px solid #e2e8f0; font-size:13px; font-weight:600; color:#1e293b; background:white; outline:none; transition:border-color .2s; cursor:pointer; font-family:'Inter',sans-serif; }
  .df-select:focus { border-color:#7c3aed; }

  .df-upvote-btn {
    display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:10px;
    border:1.5px solid #e2e8f0; background:white; font-size:12px; font-weight:700; color:#64748b;
    cursor:pointer; transition:all .15s ease; font-family:'Inter',sans-serif;
  }
  .df-upvote-btn:hover { border-color:#7c3aed; color:#7c3aed; background:#f5f3ff; }

  .df-answer-card {
    border-radius:16px; padding:20px; border:1.5px solid #f1f5f9; background:white;
    animation:fadeUp .3s ease;
  }
  .df-answer-card.ai { border-color:#ddd6fe; background:linear-gradient(135deg,#faf5ff,#f5f3ff); }

  .df-shimmer {
    border-radius:16px; height:96px;
    background:linear-gradient(90deg,#f1f5f9 25%,#e8eef8 50%,#f1f5f9 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite;
  }
`

export default function DoubtForumPage() {
  const [view,        setView]        = useState('list')
  const [doubts,      setDoubts]      = useState([])
  const [selected,    setSelected]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [subFilter,   setSubFilter]   = useState('all')
  const [sortBy,      setSortBy]      = useState('recent')
  const [search,      setSearch]      = useState('')
  const [showCreate,  setShowCreate]  = useState(false)
  const [form,        setForm]        = useState({ title:'', body:'', subject:'Physics', chapter:'', tags:'' })
  const [answerText,  setAnswerText]  = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [posting,     setPosting]     = useState(false)

  useEffect(() => { fetchDoubts() }, [subFilter, sortBy])

  const fetchDoubts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort:sortBy, limit:'30' })
      if (subFilter !== 'all') params.set('subject', subFilter)
      const { data } = await api.get(`/doubts?${params}`)
      setDoubts(data.data || [])
    } catch { toast.error('Failed to load doubts') }
    finally { setLoading(false) }
  }

  const openDoubt = async (id) => {
    try { const { data } = await api.get(`/doubts/${id}`); setSelected(data.data); setView('detail') }
    catch { toast.error('Failed to load') }
  }

  const handleCreate = async () => {
    if (!form.title || !form.body) { toast.error('Title and description required'); return }
    setPosting(true)
    try {
      const { data } = await api.post('/doubts', { ...form, tags:form.tags.split(',').map(t=>t.trim()).filter(Boolean) })
      setDoubts(prev=>[data.data,...prev]); setShowCreate(false)
      setForm({ title:'', body:'', subject:'Physics', chapter:'', tags:'' }); toast.success('Doubt posted!')
    } catch { toast.error('Failed to post') } finally { setPosting(false) }
  }

  const handleAnswer = async () => {
    if (!answerText.trim()) return
    try {
      const { data } = await api.post(`/doubts/${selected._id}/answer`, { body:answerText })
      setSelected(data.data); setAnswerText(''); toast.success('Answer posted!')
    } catch { toast.error('Failed') }
  }

  const handleAIAnswer = async () => {
    setAiLoading(true)
    try {
      await api.post(`/doubts/${selected._id}/ai-answer`)
      const { data } = await api.get(`/doubts/${selected._id}`)
      setSelected(data.data); toast.success('AI answer generated!')
    } catch { toast.error('AI unavailable') } finally { setAiLoading(false) }
  }

  const handleUpvote = async (doubtId) => {
    try {
      await api.post(`/doubts/${doubtId}/upvote`)
      if (view==='list') fetchDoubts()
      else { const { data } = await api.get(`/doubts/${doubtId}`); setSelected(data.data) }
    } catch {}
  }

  const handleAnswerUpvote = async (answerId) => {
    try {
      await api.post(`/doubts/${selected._id}/answers/${answerId}/upvote`)
      const { data } = await api.get(`/doubts/${selected._id}`)
      setSelected(data.data)
    } catch {}
  }

  const filtered = doubts.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.body.toLowerCase().includes(search.toLowerCase()))

  /* ──────────────── DETAIL VIEW ──────────────── */
  if (view === 'detail' && selected) {
    const sc = ss(selected.subject)
    return (
      <div className="df-root" style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#f5f0ff 50%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui" }}>
        <style>{css}</style>
        <div style={{ maxWidth:760, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:18 }}>

          <button onClick={() => { setView('list'); setSelected(null) }} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, color:'#64748b', padding:0, width:'fit-content' }}>
            <ArrowLeft size={16} /> Back to Forum
          </button>

          {/* Question Card */}
          <div className="df-card df-fade-up" style={{ padding:28 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <span style={{ padding:'4px 12px', borderRadius:8, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, fontSize:11, fontWeight:800, letterSpacing:'.04em' }}>{selected.subject}</span>
              {selected.chapter && <span style={{ padding:'4px 12px', borderRadius:8, background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0', fontSize:11, fontWeight:700 }}>{selected.chapter}</span>}
              <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94a3b8', fontWeight:600 }}>
                <Eye size={12} /> {selected.views} views
              </span>
            </div>

            <h1 style={{ fontSize:20, fontWeight:900, color:'#1e293b', margin:'0 0 14px', lineHeight:1.4 }}>{selected.title}</h1>
            <p style={{ fontSize:14, color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap', margin:'0 0 20px' }}>{selected.body}</p>

            <div style={{ display:'flex', alignItems:'center', gap:12, paddingTop:16, borderTop:'1px solid #f1f5f9', flexWrap:'wrap' }}>
              <button className="df-upvote-btn" onClick={() => handleUpvote(selected._id)}>
                <ThumbsUp size={13} /> {selected.upvotes?.length||0} Upvotes
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div className="df-avatar" style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', fontSize:13, color:'white' }}>
                  {selected.userId?.name?.[0]?.toUpperCase()||'?'}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{selected.userId?.name||'Student'}</div>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>Lv.{selected.userId?.level||1}</div>
                </div>
              </div>
              <span style={{ fontSize:11, color:'#94a3b8', marginLeft:'auto' }}>{new Date(selected.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {/* Answers */}
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#1e293b', marginBottom:14 }}>{selected.answers?.length||0} Answers</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {selected.answers?.map((a, i) => (
                <div key={a._id||i} className={`df-answer-card${a.isAI?' ai':''}`}>
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <div className="df-avatar" style={{ width:38, height:38, borderRadius:12, background: a.isAI?'linear-gradient(135deg,#7c3aed,#4f46e5)':'linear-gradient(135deg,#94a3b8,#64748b)', fontSize:14, color:'white' }}>
                      {a.isAI ? <Sparkles size={16} /> : a.userId?.name?.[0]?.toUpperCase()||'?'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                        <span style={{ fontSize:13, fontWeight:800, color:'#1e293b' }}>{a.isAI?'AI Assistant':a.userId?.name||'Student'}</span>
                        {a.isAI && <span style={{ padding:'2px 8px', borderRadius:6, background:'#ede9fe', color:'#7c3aed', fontSize:9, fontWeight:900, letterSpacing:'.06em' }}>AI</span>}
                        <span style={{ fontSize:11, color:'#94a3b8', marginLeft:'auto' }}>{new Date(a.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p style={{ fontSize:14, color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap', margin:'0 0 12px' }}>{a.body}</p>
                      <button className="df-upvote-btn" onClick={() => handleAnswerUpvote(a._id)}>
                        <ThumbsUp size={12} /> {a.upvotes?.length||0}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {(!selected.answers || selected.answers.length===0) && (
                <div style={{ textAlign:'center', padding:'32px 20px', background:'white', borderRadius:16, border:'1px solid #f1f5f9', color:'#94a3b8', fontSize:13, fontWeight:600 }}>
                  No answers yet. Be the first to help! 🙋
                </div>
              )}
            </div>
          </div>

          {/* Post Answer */}
          <div className="df-card" style={{ padding:24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#1e293b' }}>Your Answer</div>
              <button onClick={handleAIAnswer} disabled={aiLoading} style={{
                padding:'8px 16px', borderRadius:10, border:'none',
                background: aiLoading?'#e2e8f0':'linear-gradient(135deg,#7c3aed,#6d28d9)',
                color: aiLoading?'#94a3b8':'white', fontWeight:800, fontSize:12, cursor: aiLoading?'wait':'pointer',
                display:'flex', alignItems:'center', gap:7, fontFamily:'inherit',
                boxShadow: aiLoading?'none':'0 4px 12px rgba(124,58,237,.3)'
              }}>
                {aiLoading?<span className="df-spin" style={{ width:12,height:12,border:'2px solid #94a3b8',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block' }}/>:<Sparkles size={12}/>}
                {aiLoading?'Generating…':'Ask AI'}
              </button>
            </div>
            <textarea className="df-input" rows={4} value={answerText} onChange={e=>setAnswerText(e.target.value)} placeholder="Write a detailed answer to help this student…" style={{ marginBottom:12 }} />
            <button onClick={handleAnswer} disabled={!answerText.trim()} style={{
              padding:'12px 24px', borderRadius:12, border:'none',
              background: answerText.trim()?'linear-gradient(135deg,#7c3aed,#6d28d9)':'#e2e8f0',
              color: answerText.trim()?'white':'#94a3b8',
              fontWeight:800, fontSize:14, cursor: answerText.trim()?'pointer':'not-allowed',
              display:'flex', alignItems:'center', gap:8, fontFamily:'inherit',
              boxShadow: answerText.trim()?'0 4px 16px rgba(124,58,237,.3)':'none'
            }}>
              <Send size={15} /> Post Answer
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ──────────────── LIST VIEW ──────────────── */
  return (
    <div className="df-root" style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#f5f0ff 50%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui" }}>
      <style>{css}</style>
      <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Hero */}
        <div className="df-fade-up" style={{
          background:'linear-gradient(135deg,#1e1b4b 0%,#4c1d95 45%,#5b21b6 100%)',
          borderRadius:28, padding:'44px 48px', color:'white', position:'relative', overflow:'hidden',
          boxShadow:'0 20px 60px rgba(79,46,153,.35)'
        }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220, borderRadius:'50%', background:'rgba(167,139,250,.2)', filter:'blur(50px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-30, left:'20%', width:180, height:180, borderRadius:'50%', background:'rgba(99,102,241,.15)', filter:'blur(40px)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:28 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <MessageCircle size={18} style={{color:'#c4b5fd'}} />
                  </div>
                  <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.5)', letterSpacing:'.1em', textTransform:'uppercase' }}>Student Community</span>
                </div>
                <h1 style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:900, margin:'0 0 8px', lineHeight:1.1 }}>Doubt Forum</h1>
                <p style={{ fontSize:13, color:'rgba(255,255,255,.6)', margin:0 }}>Ask doubts · Help others · Get AI-powered answers</p>
              </div>
              <button onClick={() => setShowCreate(true)} style={{
                padding:'12px 24px', borderRadius:14, border:'none', background:'white',
                color:'#7c3aed', fontWeight:800, fontSize:14, cursor:'pointer',
                display:'flex', alignItems:'center', gap:8, fontFamily:'inherit',
                boxShadow:'0 4px 20px rgba(0,0,0,.15)'
              }}>
                <Plus size={17} /> Ask a Doubt
              </button>
            </div>

            {/* Forum stats */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {[
                { icon:MessageCircle, label:'Questions', val:doubts.length },
                { icon:Users,         label:'Answered',  val:doubts.filter(d=>d.status==='answered').length },
                { icon:TrendingUp,    label:'This Week', val:doubts.filter(d=>new Date(d.createdAt)>new Date(Date.now()-7*864e5)).length },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,.1)', backdropFilter:'blur(8px)', borderRadius:14, padding:'12px 20px', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', gap:10 }}>
                  <s.icon size={16} style={{color:'rgba(255,255,255,.6)'}} />
                  <div>
                    <div style={{ fontSize:18, fontWeight:900 }}>{s.val}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.5)', textTransform:'uppercase' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="df-input" style={{ paddingLeft:42 }} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search doubts…" />
          </div>

          <div style={{ background:'rgba(255,255,255,.8)', backdropFilter:'blur(8px)', borderRadius:14, padding:6, display:'flex', gap:4, border:'1px solid rgba(226,232,240,.6)', flexWrap:'wrap' }}>
            {['all',...SUBJECTS].map(s => (
              <button key={s} className={`df-filter-btn${subFilter===s?' active':' inactive'}`} onClick={()=>setSubFilter(s)}>{s}</button>
            ))}
          </div>

          <select className="df-select" value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ width:'auto' }}>
            <option value="recent">Recent</option>
            <option value="popular">Popular</option>
          </select>
        </div>

        {/* Doubt List */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[0,1,2,3].map(i => <div key={i} className="df-shimmer" style={{ animationDelay:`${i*.1}s` }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="df-card" style={{ padding:60, textAlign:'center' }}>
            <div style={{ width:60, height:60, borderRadius:18, background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <MessageCircle size={26} style={{color:'#7c3aed'}} />
            </div>
            <div style={{ fontSize:17, fontWeight:800, color:'#1e293b', marginBottom:6 }}>No doubts yet</div>
            <div style={{ fontSize:13, color:'#94a3b8', marginBottom:24 }}>Be the first to ask a question!</div>
            <button onClick={() => setShowCreate(true)} style={{
              padding:'11px 24px', borderRadius:12, border:'none',
              background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white',
              fontWeight:800, fontSize:14, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8,
              boxShadow:'0 4px 16px rgba(124,58,237,.3)', fontFamily:'inherit'
            }}>
              <Plus size={16} /> Post First Doubt
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(d => {
              const sc = ss(d.subject)
              const isAnswered = d.status === 'answered'
              return (
                <div key={d._id} className="df-doubt-row df-fade-up" onClick={() => openDoubt(d._id)}>
                  {/* Avatar */}
                  <div className="df-avatar" style={{ background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', color:'#7c3aed' }}>
                    {d.userId?.name?.[0]?.toUpperCase()||'?'}
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <h3 style={{ fontSize:14, fontWeight:800, color:'#1e293b', margin:'0 0 6px', lineHeight:1.4 }}>{d.title}</h3>
                    <p style={{ fontSize:12, color:'#94a3b8', margin:'0 0 10px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.body}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                      <span style={{ padding:'3px 10px', borderRadius:8, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, fontSize:10, fontWeight:800 }}>{d.subject}</span>
                      <span style={{ padding:'3px 10px', borderRadius:8, background:isAnswered?'#ecfdf5':'#fffbeb', color:isAnswered?'#059669':'#d97706', border:`1px solid ${isAnswered?'#6ee7b7':'#fcd34d'}`, fontSize:10, fontWeight:800 }}>
                        {isAnswered?'✅ Answered':'⏳ Open'}
                      </span>
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94a3b8' }}><MessageCircle size={10}/> {d.answers?.length||0}</span>
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94a3b8' }}><ThumbsUp size={10}/> {d.upvotes?.length||0}</span>
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94a3b8' }}><Eye size={10}/> {d.views||0}</span>
                      <span style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8' }}>{new Date(d.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'white', borderRadius:24, width:'100%', maxWidth:520, padding:32, boxShadow:'0 24px 64px rgba(0,0,0,.18)', animation:'slideIn .3s cubic-bezier(.34,1.56,.64,1)', fontFamily:"'Inter',system-ui", maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:900, color:'#1e293b' }}>🙋 Ask a Doubt</div>
                <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>The community + AI will help you</div>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ width:36, height:36, borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}><X size={16}/></button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Doubt Title</label>
                <input className="df-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="What's your doubt? (short, clear title)" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Describe in Detail</label>
                <textarea className="df-input" rows={5} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Explain your doubt fully. Include what you've tried, where you're stuck…" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Subject</label>
                  <select className="df-select" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}>
                    {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Chapter</label>
                  <input className="df-input" style={{ height:44 }} value={form.chapter} onChange={e=>setForm({...form,chapter:e.target.value})} placeholder="Optional" />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Tags</label>
                <input className="df-input" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="newton, thermodynamics, integration… (comma separated)" />
              </div>
              <button onClick={handleCreate} disabled={posting} style={{
                width:'100%', padding:14, borderRadius:14, border:'none',
                background: posting?'#e2e8f0':'linear-gradient(135deg,#7c3aed,#6d28d9)',
                color: posting?'#94a3b8':'white', fontWeight:800, fontSize:15, cursor: posting?'wait':'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow: posting?'none':'0 4px 20px rgba(124,58,237,.35)', fontFamily:'inherit'
              }}>
                {posting?<span className="df-spin" style={{ width:16,height:16,border:'2px solid #94a3b8',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block' }}/>:<Send size={16}/>}
                {posting?'Posting…':'Post Doubt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
