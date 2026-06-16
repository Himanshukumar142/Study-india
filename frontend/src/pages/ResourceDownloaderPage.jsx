import { useState, useEffect } from 'react'
import {
  Link2, Download, Search, Loader2, ExternalLink, FileText, Video, Image, Music,
  File, PlayCircle, Trash2, Plus, X, CheckCircle2, Globe, BookOpen, Save, Copy,
  Sparkles, Zap, Shield, Clock, BarChart3, Star, ArrowRight, Layers
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const TYPE_CONFIG = {
  youtube:  { icon: PlayCircle, label: 'YouTube',  color: '#ef4444', bg: '#fff1f2', border: '#fca5a5', grad: 'linear-gradient(135deg,#ef4444,#dc2626)' },
  video:    { icon: Video,      label: 'Video',     color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd', grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  pdf:      { icon: FileText,   label: 'PDF',       color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', grad: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
  image:    { icon: Image,      label: 'Image',     color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', grad: 'linear-gradient(135deg,#10b981,#059669)' },
  audio:    { icon: Music,      label: 'Audio',     color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', grad: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  document: { icon: File,       label: 'Document',  color: '#6366f1', bg: '#ede9fe', border: '#c4b5fd', grad: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
  link:     { icon: Globe,      label: 'Web Link',  color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', grad: 'linear-gradient(135deg,#64748b,#475569)' },
}

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'General']
const FILTER_TYPES = ['all', 'youtube', 'video', 'pdf', 'image', 'document']

export default function ResourceDownloaderPage() {
  const [url,           setUrl]           = useState('')
  const [analyzing,     setAnalyzing]     = useState(false)
  const [preview,       setPreview]       = useState(null)
  const [downloading,   setDownloading]   = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [tab,           setTab]           = useState('download')
  const [resources,     setResources]     = useState([])
  const [publicRes,     setPublicRes]     = useState([])
  const [loadingRes,    setLoadingRes]    = useState(false)
  const [typeFilter,    setTypeFilter]    = useState('all')
  const [saveForm,      setSaveForm]      = useState({ subject: '', chapter: '', isPublic: false, description: '' })

  useEffect(() => {
    if (tab === 'my-resources') fetchMyResources()
    if (tab === 'public') fetchPublicResources()
  }, [tab, typeFilter])

  const fetchMyResources = async () => {
    setLoadingRes(true)
    try {
      const params = new URLSearchParams({ mine: 'true' })
      if (typeFilter !== 'all') params.set('type', typeFilter)
      const { data } = await api.get(`/resources?${params}`)
      setResources(data.data || [])
    } catch {} finally { setLoadingRes(false) }
  }

  const fetchPublicResources = async () => {
    setLoadingRes(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      const { data } = await api.get(`/resources/public?${params}`)
      setPublicRes(data.data || [])
    } catch {} finally { setLoadingRes(false) }
  }

  const handleAnalyze = async () => {
    if (!url.trim()) { toast.error('Paste a URL first'); return }
    setAnalyzing(true); setPreview(null); setSaved(false)
    try {
      const { data } = await api.post('/resources/analyze', { url: url.trim() })
      setPreview(data.data)
      toast.success(`Detected: ${TYPE_CONFIG[data.data.type]?.label || data.data.type}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not analyze this URL')
    } finally { setAnalyzing(false) }
  }

  const handleDownload = async () => {
    if (!preview) return
    setDownloading(true)
    try {
      const response = await api.get(`/resources/download?url=${encodeURIComponent(preview.url)}`, {
        responseType: 'blob', timeout: 300000,
      })
      const blob = new Blob([response.data])
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      let filename = 'download'
      try {
        const urlObj = new URL(preview.url)
        const parts = urlObj.pathname.split('/').filter(Boolean)
        filename = decodeURIComponent(parts[parts.length - 1] || 'download')
      } catch {}
      link.download = filename
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      toast.success('Download started!')
    } catch {
      window.open(preview.url, '_blank')
      toast.success('Opened in new tab')
    } finally { setDownloading(false) }
  }

  const handleSave = async () => {
    if (!preview) return
    setSaving(true)
    try {
      await api.post('/resources', {
        url: preview.url, title: preview.title, type: preview.type,
        thumbnail: preview.thumbnail, fileSize: preview.fileSize, mimeType: preview.mimeType,
        ...saveForm,
      })
      setSaved(true); toast.success('Saved to your resources!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/resources/${id}`)
      setResources(prev => prev.filter(r => r._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const copyUrl = (u) => { navigator.clipboard.writeText(u); toast.success('URL copied!') }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) { setUrl(text); toast.success('Pasted!') }
    } catch { toast.error('Clipboard access denied') }
  }

  const tc = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.link

  /* ───────────────────────────── RENDER ───────────────────────────── */
  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(135deg,#f8f9fc 0%,#f0f2ff 50%,#f8f9fc 100%)', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp  { from { opacity:0;transform:translateY(16px) } to { opacity:1;transform:translateY(0) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        .rd-fade-up { animation:fadeUp .4s ease forwards; }
        .rd-fade-in { animation:fadeIn .3s ease forwards; }
        .rd-spin    { animation:spin .8s linear infinite; }

        .rd-card {
          background:white; border-radius:20px; border:1px solid rgba(226,232,240,.8);
          box-shadow:0 4px 24px rgba(0,0,0,.04);
        }
        .rd-input {
          width:100%; height:50px; padding:0 16px 0 44px;
          border:1.5px solid #e2e8f0; border-radius:14px;
          font-size:14px; font-weight:500; color:#1e293b;
          background:#f8fafc; outline:none;
          transition:all .2s ease; font-family:inherit;
        }
        .rd-input:focus { border-color:#6366f1; background:white; box-shadow:0 0 0 4px rgba(99,102,241,.08); }
        .rd-input::placeholder { color:#94a3b8; }

        .rd-tab-btn {
          padding:9px 20px; border-radius:12px; font-size:13px; font-weight:700;
          cursor:pointer; border:none; transition:all .2s ease; white-space:nowrap;
        }
        .rd-tab-btn.active { background:white; color:#6366f1; box-shadow:0 2px 12px rgba(99,102,241,.15); }
        .rd-tab-btn.inactive { background:transparent; color:#64748b; }
        .rd-tab-btn.inactive:hover { color:#1e293b; background:rgba(255,255,255,.6); }

        .rd-filter-btn {
          padding:7px 16px; border-radius:10px; font-size:12px; font-weight:700;
          cursor:pointer; border:none; transition:all .2s ease; text-transform:capitalize;
        }
        .rd-filter-btn.active { background:#6366f1; color:white; }
        .rd-filter-btn.inactive { background:transparent; color:#64748b; }
        .rd-filter-btn.inactive:hover { background:rgba(99,102,241,.08); color:#6366f1; }

        .rd-resource-row {
          background:white; border-radius:16px; border:1px solid #f1f5f9;
          padding:18px 20px; display:flex; align-items:center; gap:16px;
          transition:all .2s ease; cursor:default;
        }
        .rd-resource-row:hover { box-shadow:0 8px 24px rgba(0,0,0,.06); border-color:#e0e7ff; transform:translateY(-1px); }

        .rd-shimmer {
          background:linear-gradient(90deg,#f1f5f9 25%,#e8eef8 50%,#f1f5f9 75%);
          background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:12px;
        }

        .rd-type-icon {
          width:44px; height:44px; border-radius:12px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }

        .rd-btn-primary {
          padding:12px 24px; border-radius:12px; border:none; cursor:pointer;
          font-weight:800; font-size:14px; font-family:inherit;
          display:inline-flex; align-items:center; gap:8px; transition:all .2s ease;
        }
        .rd-btn-primary:hover { transform:translateY(-1px); }
        .rd-btn-primary:active { transform:translateY(0); }

        .rd-action-btn {
          width:36px; height:36px; border-radius:10px; border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          transition:all .15s ease; background:#f8fafc; color:#94a3b8;
        }
        .rd-action-btn:hover { background:#ede9fe; color:#6366f1; }
        .rd-action-btn.danger:hover { background:#fff1f2; color:#e11d48; }

        .rd-badge {
          display:inline-flex; align-items:center; gap:4px;
          padding:3px 10px; border-radius:8px; font-size:10px; font-weight:700;
          letter-spacing:.03em;
        }

        .rd-select {
          padding:10px 14px; border-radius:10px; border:1.5px solid #e2e8f0;
          font-size:13px; font-family:inherit; outline:none; background:white;
          color:#1e293b; cursor:pointer; transition:border-color .2s;
        }
        .rd-select:focus { border-color:#6366f1; }

        .rd-option-card {
          display:flex; align-items:center; gap:12px; padding:14px 18px;
          border-radius:14px; border:2px solid #e8eaf6; background:white;
          cursor:pointer; transition:all .2s ease; text-align:left; width:100%;
          font-family:inherit;
        }
        .rd-option-card:hover { border-color:#a5b4fc; background:#f5f6ff; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ━━━━━━━━━━━━━━━━━ HERO BANNER ━━━━━━━━━━━━━━━━━ */}
        <div className="rd-fade-up" style={{
          background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 45%,#1e3a5f 100%)',
          borderRadius: 28, padding: '44px 48px', color: 'white', position: 'relative', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(99,102,241,.3)'
        }}>
          <div style={{ position:'absolute', top:-60, right:-60, width:280, height:280, borderRadius:'50%', background:'rgba(139,92,246,.2)', filter:'blur(60px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-40, left:'20%', width:200, height:200, borderRadius:'50%', background:'rgba(6,182,212,.15)', filter:'blur(50px)', pointerEvents:'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
              <span style={{ background:'rgba(139,92,246,.3)', border:'1px solid rgba(139,92,246,.4)', borderRadius:999, padding:'4px 14px', fontSize:11, fontWeight:800, letterSpacing:'.08em', display:'flex', alignItems:'center', gap:6 }}>
                <Download size={11} style={{color:'#a5b4fc'}} /> RESOURCE HUB
              </span>
              <span style={{ background:'rgba(6,182,212,.2)', border:'1px solid rgba(6,182,212,.3)', borderRadius:999, padding:'4px 14px', fontSize:11, fontWeight:800, letterSpacing:'.08em' }}>
                MULTI-FORMAT
              </span>
            </div>
            <h1 style={{ fontSize:'clamp(26px,5vw,46px)', fontWeight:900, margin:'0 0 10px', lineHeight:1.1 }}>
              Link{' '}
              <span style={{ background:'linear-gradient(90deg,#a5b4fc,#67e8f9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                Downloader
              </span>
            </h1>
            <p style={{ fontSize:14, color:'rgba(255,255,255,.6)', margin:'0 0 28px', maxWidth:520, lineHeight:1.7 }}>
              Paste any URL — YouTube videos, PDFs, images, documents. We detect the format automatically and let you download or save to your library.
            </p>
            {/* Type chips */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <span key={key} style={{
                  background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.12)',
                  borderRadius:8, padding:'4px 12px', fontSize:11, fontWeight:700, color:'rgba(255,255,255,.7)'
                }}>
                  {cfg.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━ TABS ━━━━━━━━━━━━━━━━━ */}
        <div style={{ background:'rgba(255,255,255,.7)', backdropFilter:'blur(12px)', borderRadius:16, padding:6, display:'flex', gap:4, border:'1px solid rgba(226,232,240,.6)', width:'fit-content' }}>
          {[
            { id:'download',     label:'⬇️ Download' },
            { id:'my-resources', label:'📁 My Library' },
            { id:'public',       label:'🌐 Community' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rd-tab-btn ${tab===t.id?'active':'inactive'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ━━━━━━━━━━━━━━━━━ DOWNLOAD TAB ━━━━━━━━━━━━━━━━━ */}
        {tab === 'download' && (
          <div className="rd-fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* URL Input Card */}
            <div className="rd-card" style={{ padding:28 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#1e293b', marginBottom:4 }}>Paste Resource URL</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginBottom:20 }}>Supports YouTube, direct file links, PDFs, images and more</div>

              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <div style={{ flex:1, position:'relative', minWidth:240 }}>
                  <Link2 size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
                  <input
                    className="rd-input"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && handleAnalyze()}
                    placeholder="https://youtube.com/watch?v=... or any PDF/video link"
                  />
                  {url && (
                    <button onClick={() => setUrl('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4 }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button onClick={handlePaste} style={{ height:50, padding:'0 18px', borderRadius:12, border:'1.5px solid #e2e8f0', background:'white', fontSize:13, fontWeight:700, color:'#374151', cursor:'pointer', display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap' }}>
                  <Copy size={14} /> Paste
                </button>
                <button onClick={handleAnalyze} disabled={analyzing || !url.trim()} style={{
                  height:50, padding:'0 28px', borderRadius:12, border:'none',
                  background: url.trim() && !analyzing ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0',
                  color: url.trim() && !analyzing ? 'white' : '#94a3b8',
                  fontSize:14, fontWeight:800, cursor: url.trim() && !analyzing ? 'pointer' : 'not-allowed',
                  display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap',
                  boxShadow: url.trim() ? '0 4px 16px rgba(99,102,241,.3)' : 'none',
                  transition:'all .2s ease', fontFamily:'inherit'
                }}>
                  {analyzing ? <Loader2 size={16} className="rd-spin" /> : <Search size={16} />}
                  {analyzing ? 'Analyzing…' : 'Analyze URL'}
                </button>
              </div>

              {/* Features row */}
              <div style={{ display:'flex', gap:20, marginTop:20, paddingTop:20, borderTop:'1px solid #f1f5f9', flexWrap:'wrap' }}>
                {[
                  { icon: Zap,    label:'Instant Detection', color:'#f59e0b' },
                  { icon: Shield, label:'Safe Download',     color:'#10b981' },
                  { icon: Layers, label:'Multiple Formats',  color:'#6366f1' },
                ].map(({ icon:Icon, label, color }) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:600, color:'#64748b' }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            {preview && (
              <div className="rd-card rd-fade-up" style={{ overflow:'hidden' }}>
                {/* Colored header */}
                <div style={{ background: tc(preview.type).grad, padding:'24px 28px', color:'white' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ width:56, height:56, borderRadius:16, background:'rgba(255,255,255,.2)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {(() => { const Icon = tc(preview.type).icon; return <Icon size={26} /> })()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:10, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', opacity:.7, marginBottom:4 }}>
                        {tc(preview.type).label} Detected
                      </div>
                      <div style={{ fontSize:18, fontWeight:900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{preview.title}</div>
                    </div>
                    <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <CheckCircle2 size={20} />
                    </div>
                  </div>
                </div>

                <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
                  {/* YouTube embed */}
                  {preview.type === 'youtube' && preview.youtubeId && (
                    <div style={{ aspectRatio:'16/9', borderRadius:16, overflow:'hidden', background:'black', boxShadow:'0 8px 32px rgba(0,0,0,.12)' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${preview.youtubeId}`}
                        style={{ width:'100%', height:'100%', border:'none' }}
                        allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                      />
                    </div>
                  )}

                  {/* Image preview */}
                  {preview.type === 'image' && (
                    <div style={{ borderRadius:16, overflow:'hidden', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', maxHeight:320 }}>
                      <img src={preview.url} alt={preview.title} style={{ maxWidth:'100%', maxHeight:320, objectFit:'contain' }} />
                    </div>
                  )}

                  {/* Thumbnail */}
                  {preview.thumbnail && preview.type !== 'image' && (
                    <div style={{ borderRadius:16, overflow:'hidden', background:'#f1f5f9' }}>
                      <img src={preview.thumbnail} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover' }} />
                    </div>
                  )}

                  {/* Meta grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10 }}>
                    {[
                      { label:'Type',         val: tc(preview.type).label },
                      { label:'File Size',    val: preview.fileSizeFormatted || '—' },
                      { label:'Downloadable', val: preview.downloadable ? '✅ Yes' : '❌ No' },
                      { label:'MIME',         val: preview.mimeType?.split(';')[0] || '—' },
                    ].map(s => (
                      <div key={s.label} style={{ background:'#f8f9fc', borderRadius:12, padding:'12px 16px', textAlign:'center', border:'1px solid #e8eaf6' }}>
                        <div style={{ fontSize:9, fontWeight:700, color:'#94a3b8', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:4 }}>{s.label}</div>
                        <div style={{ fontSize:12, fontWeight:800, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* URL bar */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#f8f9fc', borderRadius:12, border:'1px solid #e2e8f0' }}>
                    <Link2 size={14} style={{ color:'#94a3b8', flexShrink:0 }} />
                    <span style={{ fontSize:12, color:'#64748b', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{preview.url}</span>
                    <button className="rd-action-btn" onClick={() => copyUrl(preview.url)} title="Copy URL"><Copy size={14} /></button>
                    <a href={preview.url} target="_blank" rel="noopener noreferrer" className="rd-action-btn" title="Open in tab" style={{ display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}><ExternalLink size={14} /></a>
                  </div>

                  {/* Save to library form */}
                  <div style={{ background:'linear-gradient(135deg,#f8f9ff,#f1f5ff)', borderRadius:16, padding:20, border:'1px solid #e0e7ff' }}>
                    <div style={{ fontSize:12, fontWeight:800, color:'#4f46e5', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:14 }}>
                      📁 Save to Library (Optional)
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                      <select className="rd-select" value={saveForm.subject} onChange={e => setSaveForm({...saveForm, subject:e.target.value})}>
                        <option value="">Subject</option>
                        {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <input value={saveForm.chapter} onChange={e => setSaveForm({...saveForm, chapter:e.target.value})}
                        placeholder="Chapter (optional)"
                        style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:13, outline:'none', fontFamily:'inherit', background:'white' }}
                      />
                    </div>
                    <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
                      <input type="checkbox" checked={saveForm.isPublic} onChange={e => setSaveForm({...saveForm, isPublic:e.target.checked})}
                        style={{ width:16, height:16, accentColor:'#6366f1', cursor:'pointer' }}
                      />
                      Share publicly for other students
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {preview.downloadable && (
                      <button className="rd-btn-primary" onClick={handleDownload} disabled={downloading} style={{
                        background: downloading ? '#e2e8f0' : 'linear-gradient(135deg,#10b981,#059669)',
                        color: downloading ? '#94a3b8' : 'white',
                        boxShadow: downloading ? 'none' : '0 4px 16px rgba(16,185,129,.3)',
                        cursor: downloading ? 'wait' : 'pointer', flex:1, justifyContent:'center'
                      }}>
                        {downloading ? <Loader2 size={15} className="rd-spin" /> : <Download size={15} />}
                        {downloading ? 'Downloading…' : 'Download File'}
                      </button>
                    )}
                    <button className="rd-btn-primary" onClick={handleSave} disabled={saving||saved} style={{
                      background: saved ? '#ecfdf5' : saving ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color: saved ? '#059669' : saving ? '#94a3b8' : 'white',
                      border: saved ? '1px solid #6ee7b7' : 'none',
                      boxShadow: saved || saving ? 'none' : '0 4px 16px rgba(99,102,241,.3)',
                      cursor: (saving||saved) ? 'default' : 'pointer', flex:1, justifyContent:'center'
                    }}>
                      {saving ? <Loader2 size={15} className="rd-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
                      {saving ? 'Saving…' : saved ? 'Saved to Library!' : 'Save to Library'}
                    </button>
                    <a href={preview.url} target="_blank" rel="noopener noreferrer" style={{
                      padding:'12px 20px', borderRadius:12, border:'1.5px solid #e2e8f0', background:'white',
                      color:'#374151', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:8, textDecoration:'none', whiteSpace:'nowrap'
                    }}>
                      <ExternalLink size={15} /> Open Link
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state / tips when no preview */}
            {!preview && !analyzing && (
              <div className="rd-card rd-fade-in" style={{ padding:40, textAlign:'center' }}>
                <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                  <Sparkles size={28} style={{color:'#7c3aed'}} />
                </div>
                <h3 style={{ fontSize:17, fontWeight:800, color:'#1e293b', margin:'0 0 8px' }}>Paste any link to get started</h3>
                <p style={{ fontSize:13, color:'#94a3b8', marginBottom:28 }}>We support YouTube, direct PDF links, images, videos and more</p>
                <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
                  {[
                    { icon:'🎬', label:'YouTube Videos' },
                    { icon:'📄', label:'PDF Documents' },
                    { icon:'🖼️', label:'Images' },
                    { icon:'🎵', label:'Audio Files' },
                  ].map(({ icon, label }) => (
                    <div key={label} style={{ background:'#f8f9fc', border:'1px solid #e2e8f0', borderRadius:12, padding:'10px 16px', fontSize:12, fontWeight:600, color:'#64748b', display:'flex', alignItems:'center', gap:8 }}>
                      <span>{icon}</span> {label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━ MY RESOURCES TAB ━━━━━━━━━━━━━━━━━ */}
        {tab === 'my-resources' && (
          <div className="rd-fade-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Filter bar */}
            <div style={{ background:'rgba(255,255,255,.8)', backdropFilter:'blur(8px)', borderRadius:14, padding:6, display:'flex', gap:4, border:'1px solid rgba(226,232,240,.6)', width:'fit-content', flexWrap:'wrap' }}>
              {FILTER_TYPES.map(t => (
                <button key={t} className={`rd-filter-btn ${typeFilter===t?'active':'inactive'}`} onClick={() => setTypeFilter(t)}>{t}</button>
              ))}
            </div>

            {loadingRes ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} className="rd-shimmer" style={{ height:80 }} />
                ))}
              </div>
            ) : resources.length === 0 ? (
              <div className="rd-card" style={{ padding:60, textAlign:'center' }}>
                <div style={{ width:60, height:60, borderRadius:18, background:'linear-gradient(135deg,#f1f5f9,#e8eef8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <BookOpen size={26} style={{color:'#94a3b8'}} />
                </div>
                <div style={{ fontSize:17, fontWeight:800, color:'#1e293b', marginBottom:6 }}>No saved resources</div>
                <div style={{ fontSize:13, color:'#94a3b8', marginBottom:24 }}>Download or save links and they'll appear here</div>
                <button onClick={() => setTab('download')} style={{
                  padding:'10px 24px', borderRadius:12, border:'none',
                  background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white',
                  fontWeight:700, fontSize:14, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8,
                  boxShadow:'0 4px 16px rgba(99,102,241,.25)', fontFamily:'inherit'
                }}>
                  <Plus size={16} /> Add Resource
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {resources.map(r => {
                  const cfg = tc(r.type)
                  const Icon = cfg.icon
                  return (
                    <div key={r._id} className="rd-resource-row rd-fade-up">
                      <div className="rd-type-icon" style={{ background: cfg.grad }}>
                        <Icon size={20} style={{color:'white'}} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:6 }}>{r.title}</div>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          <span className="rd-badge" style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>{cfg.label}</span>
                          {r.subject && <span className="rd-badge" style={{ background:'#eff6ff', color:'#3b82f6', border:'1px solid #bfdbfe' }}>{r.subject}</span>}
                          {r.isPublic && <span className="rd-badge" style={{ background:'#ecfdf5', color:'#059669', border:'1px solid #6ee7b7' }}>🌐 Public</span>}
                          <span style={{ fontSize:11, color:'#94a3b8', alignSelf:'center' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="rd-action-btn" style={{ display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}><ExternalLink size={14} /></a>
                        <button className="rd-action-btn" onClick={() => copyUrl(r.url)}><Copy size={14} /></button>
                        <button className="rd-action-btn danger" onClick={() => handleDelete(r._id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━ PUBLIC LIBRARY TAB ━━━━━━━━━━━━━━━━━ */}
        {tab === 'public' && (
          <div className="rd-fade-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#1e293b' }}>Community Resources</div>
                <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>Shared by fellow JEE/NEET students</div>
              </div>
              <div style={{ background:'rgba(255,255,255,.8)', backdropFilter:'blur(8px)', borderRadius:14, padding:6, display:'flex', gap:4, border:'1px solid rgba(226,232,240,.6)', flexWrap:'wrap' }}>
                {FILTER_TYPES.map(t => (
                  <button key={t} className={`rd-filter-btn ${typeFilter===t?'active':'inactive'}`} onClick={() => setTypeFilter(t)}>{t}</button>
                ))}
              </div>
            </div>

            {loadingRes ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                {[0,1,2,3,4,5].map(i => <div key={i} className="rd-shimmer" style={{ height:100 }} />)}
              </div>
            ) : publicRes.length === 0 ? (
              <div className="rd-card" style={{ padding:60, textAlign:'center' }}>
                <div style={{ width:60, height:60, borderRadius:18, background:'linear-gradient(135deg,#f1f5f9,#e8eef8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Globe size={26} style={{color:'#94a3b8'}} />
                </div>
                <div style={{ fontSize:17, fontWeight:800, color:'#1e293b', marginBottom:6 }}>No public resources yet</div>
                <div style={{ fontSize:13, color:'#94a3b8' }}>Be the first to share a helpful resource!</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
                {publicRes.map(r => {
                  const cfg = tc(r.type)
                  const Icon = cfg.icon
                  return (
                    <div key={r._id} className="rd-card rd-fade-up" style={{ padding:20, transition:'all .2s ease' }}>
                      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                        <div className="rd-type-icon" style={{ background:cfg.grad, flexShrink:0 }}>
                          <Icon size={18} style={{color:'white'}} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:6 }}>{r.title}</div>
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
                            <span className="rd-badge" style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>{cfg.label}</span>
                            {r.subject && <span className="rd-badge" style={{ background:'#eff6ff', color:'#3b82f6', border:'1px solid #bfdbfe' }}>{r.subject}</span>}
                          </div>
                          <div style={{ fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:8 }}>
                            <span>By {r.userId?.name || 'Student'}</span>
                            <span>·</span>
                            <span style={{ display:'flex', alignItems:'center', gap:3 }}><Download size={9} /> {r.downloads || 0}</span>
                          </div>
                        </div>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" style={{
                          width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                          display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', flexShrink:0,
                          boxShadow:'0 2px 8px rgba(99,102,241,.3)'
                        }}>
                          <ExternalLink size={14} style={{color:'white'}} />
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
