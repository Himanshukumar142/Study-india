import { useState, useEffect, useRef } from 'react'
import { StickyNote, Plus, Search, Pin, Archive, Trash2, Edit3, Save, X, Loader2, ArchiveRestore } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']
const NOTE_COLORS = [
  { bg:'#ffffff', border:'#e2e8f0', name:'White'  },
  { bg:'#fef9c3', border:'#fde047', name:'Yellow' },
  { bg:'#dcfce7', border:'#86efac', name:'Mint'   },
  { bg:'#dbeafe', border:'#93c5fd', name:'Blue'   },
  { bg:'#fce7f3', border:'#f9a8d4', name:'Pink'   },
  { bg:'#ede9fe', border:'#c4b5fd', name:'Violet' },
  { bg:'#ffedd5', border:'#fdba74', name:'Peach'  },
]

const SUB_STYLE = {
  Physics:     { color:'#3b82f6', bg:'#eff6ff', border:'#bfdbfe' },
  Chemistry:   { color:'#10b981', bg:'#ecfdf5', border:'#6ee7b7' },
  Mathematics: { color:'#8b5cf6', bg:'#f5f3ff', border:'#c4b5fd' },
  Biology:     { color:'#f59e0b', bg:'#fffbeb', border:'#fcd34d' },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .nt-root * { box-sizing:border-box; font-family:'Inter',system-ui,sans-serif; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateY(20px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .nt-fade-up { animation:fadeUp .35s ease both; }
  .nt-spin    { animation:spin .8s linear infinite; }

  .nt-filter-btn { padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:all .2s ease; font-family:'Inter',sans-serif; text-transform:capitalize; }
  .nt-filter-btn.active   { background:#f59e0b; color:white; }
  .nt-filter-btn.inactive { background:transparent; color:#64748b; }
  .nt-filter-btn.inactive:hover { color:#1e293b; background:rgba(245,158,11,.08); }

  .nt-card {
    border-radius:20px; border:2px solid; padding:22px; position:relative;
    transition:all .2s ease; overflow:hidden;
  }
  .nt-card:hover { box-shadow:0 12px 32px rgba(0,0,0,.1); transform:translateY(-2px); }

  .nt-action-btn {
    width:30px; height:30px; border-radius:9px; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all .15s ease;
    background:rgba(255,255,255,.8); color:#94a3b8;
  }
  .nt-action-btn:hover         { background:rgba(255,255,255,.95); }
  .nt-action-btn:hover.pin     { color:#f59e0b; }
  .nt-action-btn:hover.edit    { color:#3b82f6; }
  .nt-action-btn:hover.archive { color:#64748b; }
  .nt-action-btn:hover.del     { color:#ef4444; }

  .nt-input {
    width:100%; padding:12px 16px; border:1.5px solid #e2e8f0; border-radius:12px;
    font-size:14px; font-weight:500; color:#1e293b; outline:none;
    transition:all .2s ease; font-family:'Inter',sans-serif; resize:none;
  }
  .nt-input:focus { border-color:#f59e0b; box-shadow:0 0 0 4px rgba(245,158,11,.1); }
  .nt-input::placeholder { color:#94a3b8; }

  .nt-select { padding:10px 14px; border-radius:12px; border:1.5px solid #e2e8f0; font-size:13px; font-weight:600; color:#1e293b; background:white; outline:none; cursor:pointer; font-family:'Inter',sans-serif; width:100%; }
  .nt-select:focus { border-color:#f59e0b; }

  .nt-shimmer {
    border-radius:20px; height:180px;
    background:linear-gradient(90deg,#f1f5f9 25%,#e8eef8 50%,#f1f5f9 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite;
  }
`

export default function NotesPage() {
  const [notes,       setNotes]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [subFilter,   setSubFilter]   = useState('all')
  const [showArchived,setShowArchived]= useState(false)
  const [editNote,    setEditNote]    = useState(null)
  const [showCreate,  setShowCreate]  = useState(false)
  const [form,        setForm]        = useState({ title:'', content:'', subject:'', chapter:'', color:'#ffffff' })
  const [saving,      setSaving]      = useState(false)

  useEffect(() => { fetchNotes() }, [subFilter, showArchived, search])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ archived:showArchived?'true':'false' })
      if (subFilter !== 'all') params.set('subject', subFilter)
      if (search) params.set('search', search)
      const { data } = await api.get(`/notes?${params}`)
      setNotes(data.data || [])
    } catch {} finally { setLoading(false) }
  }

  const openCreate = () => { setForm({ title:'', content:'', subject:'', chapter:'', color:'#ffffff' }); setEditNote(null); setShowCreate(true) }
  const openEdit   = (note) => { setForm({ title:note.title, content:note.content, subject:note.subject, chapter:note.chapter, color:note.color||'#ffffff' }); setEditNote(note); setShowCreate(true) }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    try {
      if (editNote) {
        const { data } = await api.put(`/notes/${editNote._id}`, form)
        setNotes(prev=>prev.map(n=>n._id===editNote._id?data.data:n)); toast.success('Note updated!')
      } else {
        const { data } = await api.post('/notes', form)
        setNotes(prev=>[data.data,...prev]); toast.success('Note created!')
      }
      setShowCreate(false)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete  = async (id) => { try { await api.delete(`/notes/${id}`); setNotes(prev=>prev.filter(n=>n._id!==id)); toast.success('Deleted') } catch { toast.error('Failed') } }
  const handlePin     = async (id) => { try { const { data } = await api.patch(`/notes/${id}/pin`); setNotes(prev=>prev.map(n=>n._id===id?data.data:n).sort((a,b)=>b.isPinned-a.isPinned)) } catch {} }
  const handleArchive = async (id) => { try { await api.patch(`/notes/${id}/archive`); setNotes(prev=>prev.filter(n=>n._id!==id)); toast.success(showArchived?'Unarchived!':'Archived!') } catch {} }

  const pinned   = notes.filter(n=>n.isPinned)
  const unpinned = notes.filter(n=>!n.isPinned)

  return (
    <div className="nt-root" style={{ minHeight:'100%', background:'linear-gradient(135deg,#f8f9fc 0%,#fff7ed 50%,#f8f9fc 100%)', fontFamily:"'Inter',system-ui" }}>
      <style>{css}</style>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Hero */}
        <div className="nt-fade-up" style={{
          background:'linear-gradient(135deg,#7c2d12 0%,#c2410c 40%,#ea580c 100%)',
          borderRadius:28, padding:'44px 48px', color:'white', position:'relative', overflow:'hidden',
          boxShadow:'0 20px 60px rgba(234,88,12,.3)'
        }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.08)', filter:'blur(40px)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <StickyNote size={18} style={{color:'#fed7aa'}} />
                </div>
                <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.55)', letterSpacing:'.1em', textTransform:'uppercase' }}>Personal Notes</span>
              </div>
              <h1 style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:900, margin:'0 0 8px' }}>My Notes</h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.65)', margin:0 }}>Write chapter summaries, key points, and formulas — all in one place</p>
            </div>
            <button onClick={openCreate} style={{
              padding:'12px 24px', borderRadius:14, border:'none', background:'white',
              color:'#c2410c', fontWeight:800, fontSize:14, cursor:'pointer',
              display:'flex', alignItems:'center', gap:8, fontFamily:'inherit',
              boxShadow:'0 4px 20px rgba(0,0,0,.12)'
            }}>
              <Plus size={17} /> New Note
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="nt-input" style={{ paddingLeft:42 }} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes…" />
          </div>
          <div style={{ background:'rgba(255,255,255,.8)', borderRadius:14, padding:6, display:'flex', gap:4, border:'1px solid rgba(226,232,240,.6)', flexWrap:'wrap' }}>
            {['all',...SUBJECTS].map(s => (
              <button key={s} className={`nt-filter-btn${subFilter===s?' active':' inactive'}`} onClick={()=>setSubFilter(s)}>{s}</button>
            ))}
          </div>
          <button onClick={()=>setShowArchived(!showArchived)} style={{
            padding:'10px 16px', borderRadius:12, border:'1.5px solid #e2e8f0',
            background:showArchived?'#374151':'white', color:showArchived?'white':'#64748b',
            fontWeight:700, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontFamily:'inherit'
          }}>
            <Archive size={13} /> {showArchived?'Archived':'Archive'}
          </button>
        </div>

        {/* Notes grid */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
            {[0,1,2,3].map(i => <div key={i} className="nt-shimmer" style={{ animationDelay:`${i*.1}s` }} />)}
          </div>
        ) : notes.length === 0 ? (
          <div style={{ background:'white', borderRadius:20, border:'1px solid #f1f5f9', padding:60, textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,.05)' }}>
            <div style={{ width:60, height:60, borderRadius:18, background:'linear-gradient(135deg,#fff7ed,#ffedd5)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <StickyNote size={26} style={{ color:'#f97316' }} />
            </div>
            <div style={{ fontSize:17, fontWeight:800, color:'#1e293b', marginBottom:6 }}>{showArchived?'No archived notes':'No notes yet'}</div>
            <div style={{ fontSize:13, color:'#94a3b8', marginBottom:24 }}>Start capturing your chapter summaries and key points</div>
            {!showArchived && <button onClick={openCreate} style={{ padding:'11px 24px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#f97316,#ea580c)', color:'white', fontWeight:800, fontSize:14, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 4px 16px rgba(234,88,12,.3)', fontFamily:'inherit' }}>
              <Plus size={16} /> Create First Note
            </button>}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {pinned.length > 0 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <Pin size={13} style={{ color:'#f59e0b' }} />
                  <span style={{ fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.08em', textTransform:'uppercase' }}>Pinned</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
                  {pinned.map(n=><NoteCard key={n._id} note={n} onEdit={openEdit} onDelete={handleDelete} onPin={handlePin} onArchive={handleArchive} showArchived={showArchived}/>)}
                </div>
              </div>
            )}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:12 }}>Others</div>}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
                  {unpinned.map(n=><NoteCard key={n._id} note={n} onEdit={openEdit} onDelete={handleDelete} onPin={handlePin} onArchive={handleArchive} showArchived={showArchived}/>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'white', borderRadius:24, width:'100%', maxWidth:600, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,.18)', animation:'slideIn .3s cubic-bezier(.34,1.56,.64,1)', fontFamily:"'Inter',system-ui" }}>
            {/* Header */}
            <div style={{ padding:'24px 28px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:18, fontWeight:900, color:'#1e293b' }}>{editNote?'✏️ Edit Note':'📝 New Note'}</div>
              <button onClick={()=>setShowCreate(false)} style={{ width:36, height:36, borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}><X size={16}/></button>
            </div>

            <div style={{ padding:'24px 28px', overflow:'auto', flex:1, display:'flex', flexDirection:'column', gap:16 }}>
              {/* Color picker */}
              <div>
                <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:10 }}>Note Color</label>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {NOTE_COLORS.map(c => (
                    <button key={c.bg} onClick={()=>setForm({...form,color:c.bg})} style={{
                      width:32, height:32, borderRadius:10, border:`2px solid ${c.border}`, background:c.bg, cursor:'pointer',
                      outline: form.color===c.bg?`3px solid #f97316`:'none', outlineOffset:2,
                      transform: form.color===c.bg?'scale(1.15)':'scale(1)', transition:'all .15s ease'
                    }} title={c.name} />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Title</label>
                <input className="nt-input" style={{ background:form.color, fontWeight:700, fontSize:15 }} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Note title…" />
              </div>

              <div style={{ flex:1 }}>
                <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Content</label>
                <textarea className="nt-input" style={{ background:form.color, fontFamily:'monospace', lineHeight:1.7, minHeight:180 }} rows={9} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder="Write your notes here… formulas, key points, summary…" />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Subject</label>
                  <select className="nt-select" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}>
                    <option value="">None</option>
                    {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:800, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Chapter</label>
                  <input className="nt-input" style={{ height:44 }} value={form.chapter} onChange={e=>setForm({...form,chapter:e.target.value})} placeholder="Optional" />
                </div>
              </div>
            </div>

            <div style={{ padding:'20px 28px', borderTop:'1px solid #f1f5f9' }}>
              <button onClick={handleSave} disabled={saving} style={{
                width:'100%', padding:14, borderRadius:14, border:'none',
                background:saving?'#e2e8f0':'linear-gradient(135deg,#f97316,#ea580c)',
                color:saving?'#94a3b8':'white', fontWeight:800, fontSize:15, cursor:saving?'wait':'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow:saving?'none':'0 4px 20px rgba(234,88,12,.35)', fontFamily:'inherit'
              }}>
                {saving?<span className="nt-spin" style={{ width:16,height:16,border:'2px solid #94a3b8',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block' }}/>:<Save size={16}/>}
                {saving?'Saving…':editNote?'Update Note':'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, onEdit, onDelete, onPin, onArchive, showArchived }) {
  const nc = NOTE_COLORS.find(c=>c.bg===note.color) || NOTE_COLORS[0]
  const ss = note.subject ? (SUB_STYLE[note.subject]||{color:'#64748b',bg:'#f8fafc',border:'#e2e8f0'}) : null
  const preview = note.content?.slice(0,160) || ''

  return (
    <div className="nt-card nt-fade-up" style={{ background:note.color||'#ffffff', borderColor:nc.border }}>
      {/* Actions */}
      <div style={{ position:'absolute', top:14, right:14, display:'flex', gap:5, opacity:0, transition:'opacity .15s ease' }}
        onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
        <button className={`nt-action-btn pin`} onClick={()=>onPin(note._id)} style={{ background:note.isPinned?'#fef3c7':'rgba(255,255,255,.9)', color:note.isPinned?'#d97706':'#94a3b8' }}><Pin size={12}/></button>
        <button className="nt-action-btn edit" onClick={()=>onEdit(note)}><Edit3 size={12}/></button>
        <button className="nt-action-btn archive" onClick={()=>onArchive(note._id)}>{showArchived?<ArchiveRestore size={12}/>:<Archive size={12}/>}</button>
        <button className="nt-action-btn del" onClick={()=>onDelete(note._id)}><Trash2 size={12}/></button>
      </div>

      {/* Hover reveal actions via CSS group */}
      <style>{`.nt-card:hover .nt-actions-inner { opacity:1 !important; }`}</style>
      <div className="nt-actions-inner" style={{ position:'absolute', top:14, right:14, display:'flex', gap:5, opacity:0, transition:'opacity .15s ease', pointerEvents:'none' }}>
        <button className="nt-action-btn" style={{ pointerEvents:'all' }} onClick={()=>onPin(note._id)}><Pin size={12}/></button>
        <button className="nt-action-btn" style={{ pointerEvents:'all' }} onClick={()=>onEdit(note)}><Edit3 size={12}/></button>
        <button className="nt-action-btn" style={{ pointerEvents:'all' }} onClick={()=>onArchive(note._id)}>{showArchived?<ArchiveRestore size={12}/>:<Archive size={12}/>}</button>
        <button className="nt-action-btn" style={{ pointerEvents:'all' }} onClick={()=>onDelete(note._id)}><Trash2 size={12}/></button>
      </div>

      {note.isPinned && (
        <div style={{ position:'absolute', top:14, left:14, width:22, height:22, borderRadius:6, background:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Pin size={11} style={{ color:'#f59e0b', fill:'#f59e0b' }} />
        </div>
      )}

      <h4 style={{ fontSize:15, fontWeight:800, color:'#1e293b', marginBottom:10, paddingRight:100, paddingLeft:note.isPinned?28:0, lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{note.title}</h4>
      {preview && <p style={{ fontSize:12, color:'#374151', lineHeight:1.7, fontFamily:'monospace', display:'-webkit-box', WebkitLineClamp:5, WebkitBoxOrient:'vertical', overflow:'hidden', whiteSpace:'pre-wrap' }}>{preview}{note.content?.length>160?'…':''}</p>}

      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:14, paddingTop:12, borderTop:'1px solid rgba(0,0,0,.06)', flexWrap:'wrap' }}>
        {ss && <span style={{ padding:'3px 10px', borderRadius:8, background:ss.bg, color:ss.color, border:`1px solid ${ss.border}`, fontSize:10, fontWeight:800 }}>{note.subject}</span>}
        {note.chapter && <span style={{ padding:'3px 10px', borderRadius:8, background:'rgba(255,255,255,.6)', color:'#64748b', fontSize:10, fontWeight:700 }}>{note.chapter}</span>}
        <span style={{ marginLeft:'auto', fontSize:10, color:'#94a3b8' }}>{new Date(note.updatedAt).toLocaleDateString('en-IN')}</span>
      </div>
    </div>
  )
}
