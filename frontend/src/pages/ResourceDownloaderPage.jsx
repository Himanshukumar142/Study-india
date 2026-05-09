import { useState, useEffect } from 'react'
import {
  Link2, Download, Search, Loader2, ExternalLink, FileText, Video, Image, Music,
  File, PlayCircle, Trash2, Plus, X, CheckCircle2, Globe, BookOpen, Save, Copy
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const TYPE_CONFIG = {
  youtube: { icon: PlayCircle, color: 'bg-red-50 text-red-600 border-red-200', label: 'YouTube Video', gradient: 'from-red-500 to-rose-600' },
  video: { icon: Video, color: 'bg-purple-50 text-purple-600 border-purple-200', label: 'Video', gradient: 'from-purple-500 to-violet-600' },
  pdf: { icon: FileText, color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'PDF Document', gradient: 'from-blue-500 to-cyan-600' },
  image: { icon: Image, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Image', gradient: 'from-emerald-500 to-teal-600' },
  audio: { icon: Music, color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Audio', gradient: 'from-amber-500 to-orange-600' },
  document: { icon: File, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', label: 'Document', gradient: 'from-indigo-500 to-purple-600' },
  link: { icon: Globe, color: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Web Link', gradient: 'from-slate-500 to-slate-700' },
}

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'General']

export default function ResourceDownloaderPage() {
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('download') // download | my-resources | public
  const [resources, setResources] = useState([])
  const [publicRes, setPublicRes] = useState([])
  const [loadingRes, setLoadingRes] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [saveForm, setSaveForm] = useState({ subject: '', chapter: '', isPublic: false, description: '' })

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
    setAnalyzing(true)
    setPreview(null)
    setSaved(false)
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
      // Extract filename
      let filename = 'download'
      try {
        const urlObj = new URL(preview.url)
        const parts = urlObj.pathname.split('/').filter(Boolean)
        filename = decodeURIComponent(parts[parts.length - 1] || 'download')
      } catch {}
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      toast.success('Download started!')
    } catch {
      // Fallback: open in new tab
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
      setSaved(true)
      toast.success('Saved to your resources!')
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

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied!')
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) { setUrl(text); toast.success('Pasted!') }
    } catch { toast.error('Clipboard access denied') }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAnalyze()
  }

  const tc = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.link

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/5 rounded-full" />
          <div className="absolute right-12 bottom-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-3">
            <Download size={18} className="text-cyan-200" />
            <span className="text-cyan-200 text-xs font-bold uppercase tracking-widest">Resource Hub</span>
          </div>
          <h1 className="text-3xl font-black mb-2">Link Downloader</h1>
          <p className="text-blue-200 text-sm">Paste any link — videos, PDFs, images, documents — we'll detect it and let you download or save it.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {[
            { id: 'download', label: '⬇️ Download' },
            { id: 'my-resources', label: '📁 My Resources' },
            { id: 'public', label: '🌐 Public Library' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── DOWNLOAD TAB ─────────────────────────────────── */}
        {tab === 'download' && (
          <div className="space-y-5">
            {/* URL Input */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Paste any URL here… (YouTube, PDF, video, image, etc.)"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
                <button onClick={handlePaste}
                  className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5">
                  <Copy size={13} /> Paste
                </button>
                <button onClick={handleAnalyze} disabled={analyzing || !url.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-40 flex items-center gap-2">
                  {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                  {analyzing ? 'Analyzing…' : 'Analyze'}
                </button>
              </div>

              {/* Supported types hint */}
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <span key={key} className={`px-2 py-0.5 text-[9px] font-bold rounded border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
                {/* Type header */}
                <div className={`bg-gradient-to-r ${tc(preview.type).gradient} p-5 text-white`}>
                  <div className="flex items-center gap-3">
                    {(() => { const Icon = tc(preview.type).icon; return <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"><Icon size={24} /></div> })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{tc(preview.type).label}</p>
                      <p className="font-black text-lg truncate">{preview.title}</p>
                    </div>
                    <CheckCircle2 size={24} className="text-white/40" />
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* YouTube embed */}
                  {preview.type === 'youtube' && preview.youtubeId && (
                    <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                      <iframe src={`https://www.youtube.com/embed/${preview.youtubeId}`}
                        className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" />
                    </div>
                  )}

                  {/* Image preview */}
                  {preview.type === 'image' && (
                    <div className="rounded-2xl overflow-hidden bg-slate-100 max-h-80 flex items-center justify-center">
                      <img src={preview.url} alt={preview.title} className="max-w-full max-h-80 object-contain" />
                    </div>
                  )}

                  {/* Thumbnail */}
                  {preview.thumbnail && preview.type !== 'image' && (
                    <div className="rounded-xl overflow-hidden bg-slate-100">
                      <img src={preview.thumbnail} alt="" className="w-full max-h-48 object-cover" />
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { l: 'Type', v: tc(preview.type).label, icon: tc(preview.type).icon },
                      { l: 'Size', v: preview.fileSizeFormatted, icon: File },
                      { l: 'Downloadable', v: preview.downloadable ? 'Yes ✅' : 'No', icon: Download },
                      { l: 'MIME', v: preview.mimeType?.split(';')[0] || '—', icon: Globe },
                    ].map(s => (
                      <div key={s.l} className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{s.l}</p>
                        <p className="text-xs font-black text-slate-700 mt-0.5 truncate">{s.v}</p>
                      </div>
                    ))}
                  </div>

                  {/* URL display */}
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                    <Link2 size={13} className="text-slate-400 flex-shrink-0" />
                    <p className="text-xs text-slate-500 truncate flex-1">{preview.url}</p>
                    <button onClick={() => copyUrl(preview.url)} className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all"><Copy size={12} /></button>
                    <a href={preview.url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all"><ExternalLink size={12} /></a>
                  </div>

                  {/* Save form */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Save to Library (Optional)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <select value={saveForm.subject} onChange={e => setSaveForm({ ...saveForm, subject: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                        <option value="">Subject (optional)</option>
                        {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <input value={saveForm.chapter} onChange={e => setSaveForm({ ...saveForm, chapter: e.target.value })} placeholder="Chapter (optional)"
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                      <input type="checkbox" checked={saveForm.isPublic} onChange={e => setSaveForm({ ...saveForm, isPublic: e.target.checked })}
                        className="w-4 h-4 rounded" />
                      Share publicly for other students
                    </label>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {preview.downloadable && (
                      <button onClick={handleDownload} disabled={downloading}
                        className="py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        {downloading ? 'Downloading…' : 'Download'}
                      </button>
                    )}
                    <button onClick={handleSave} disabled={saving || saved}
                      className={`py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${saved ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-blue-600 text-white shadow-blue-500/20 hover:scale-[1.02]'} disabled:opacity-60`}>
                      {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
                      {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
                    </button>
                    <a href={preview.url} target="_blank" rel="noopener noreferrer"
                      className="py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                      <ExternalLink size={15} /> Open Link
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MY RESOURCES TAB ─────────────────────────────── */}
        {tab === 'my-resources' && (
          <div className="space-y-4">
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
              {['all', 'youtube', 'video', 'pdf', 'image', 'document'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${typeFilter === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                  {t}
                </button>
              ))}
            </div>

            {loadingRes ? (
              <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-24 border border-slate-100" />)}</div>
            ) : resources.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <BookOpen size={32} className="text-slate-300 mx-auto mb-3" />
                <h3 className="font-black text-slate-900 mb-1">No Saved Resources</h3>
                <p className="text-sm text-slate-400 mb-4">Paste a link in the Download tab and save it here</p>
                <button onClick={() => setTab('download')}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 mx-auto">
                  <Plus size={14} /> Add Resource
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {resources.map(r => {
                  const cfg = tc(r.type)
                  const Icon = cfg.icon
                  return (
                    <div key={r._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${cfg.gradient} text-white`}>
                          <Icon size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                          <div className="flex gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded border ${cfg.color}`}>{cfg.label}</span>
                            {r.subject && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded">{r.subject}</span>}
                            {r.isPublic && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded">Public</span>}
                            <span className="text-[10px] text-slate-300">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={r.url} target="_blank" rel="noopener noreferrer"
                            className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><ExternalLink size={14} /></a>
                          <button onClick={() => copyUrl(r.url)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Copy size={14} /></button>
                          <button onClick={() => handleDelete(r._id)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PUBLIC LIBRARY TAB ──────────────────────────── */}
        {tab === 'public' && (
          <div className="space-y-4">
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
              {['all', 'youtube', 'video', 'pdf', 'image', 'document'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${typeFilter === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                  {t}
                </button>
              ))}
            </div>

            {loadingRes ? (
              <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-24 border border-slate-100" />)}</div>
            ) : publicRes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <Globe size={32} className="text-slate-300 mx-auto mb-3" />
                <h3 className="font-black text-slate-900 mb-1">No Public Resources Yet</h3>
                <p className="text-sm text-slate-400">Be the first to share a helpful resource!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {publicRes.map(r => {
                  const cfg = tc(r.type)
                  const Icon = cfg.icon
                  return (
                    <div key={r._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${cfg.gradient} text-white`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                          <div className="flex gap-1.5 mt-1">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded border ${cfg.color}`}>{cfg.label}</span>
                            {r.subject && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded">{r.subject}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                            <span>By {r.userId?.name || 'Unknown'}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><Download size={9} /> {r.downloads}</span>
                          </div>
                        </div>
                        <a href={r.url} target="_blank" rel="noopener noreferrer"
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all flex-shrink-0">
                          <ExternalLink size={14} />
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
