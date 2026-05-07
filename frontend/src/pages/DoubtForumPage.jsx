import { useState, useEffect } from 'react'
import { MessageCircle, Plus, Search, ThumbsUp, Send, Sparkles, ChevronDown, ChevronUp, Clock, Eye, Filter, X, BookOpen, Loader2, ArrowLeft } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']

export default function DoubtForumPage() {
  const [view, setView] = useState('list') // list | detail | create
  const [doubts, setDoubts] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subFilter, setSubFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  // Create form
  const [form, setForm] = useState({ title: '', body: '', subject: 'Physics', chapter: '', tags: '' })
  const [answerText, setAnswerText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [posting, setPosting] = useState(false)

  useEffect(() => { fetchDoubts() }, [subFilter, sortBy])

  const fetchDoubts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort: sortBy, limit: '30' })
      if (subFilter !== 'all') params.set('subject', subFilter)
      const { data } = await api.get(`/doubts?${params}`)
      setDoubts(data.data || [])
    } catch { toast.error('Failed to load doubts') }
    finally { setLoading(false) }
  }

  const openDoubt = async (id) => {
    try {
      const { data } = await api.get(`/doubts/${id}`)
      setSelected(data.data)
      setView('detail')
    } catch { toast.error('Failed to load') }
  }

  const handleCreate = async () => {
    if (!form.title || !form.body) { toast.error('Title and description required'); return }
    setPosting(true)
    try {
      const { data } = await api.post('/doubts', { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
      setDoubts(prev => [data.data, ...prev])
      setShowCreate(false)
      setForm({ title: '', body: '', subject: 'Physics', chapter: '', tags: '' })
      toast.success('Doubt posted!')
    } catch { toast.error('Failed to post') }
    finally { setPosting(false) }
  }

  const handleAnswer = async () => {
    if (!answerText.trim()) return
    try {
      const { data } = await api.post(`/doubts/${selected._id}/answer`, { body: answerText })
      setSelected(data.data)
      setAnswerText('')
      toast.success('Answer posted!')
    } catch { toast.error('Failed') }
  }

  const handleAIAnswer = async () => {
    setAiLoading(true)
    try {
      await api.post(`/doubts/${selected._id}/ai-answer`)
      const { data } = await api.get(`/doubts/${selected._id}`)
      setSelected(data.data)
      toast.success('AI answer generated!')
    } catch { toast.error('AI unavailable') }
    finally { setAiLoading(false) }
  }

  const handleUpvote = async (doubtId) => {
    try {
      await api.post(`/doubts/${doubtId}/upvote`)
      if (view === 'list') fetchDoubts()
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

  // ─── DETAIL VIEW ─────────────────────────────────────────────
  if (view === 'detail' && selected) return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-5">
        <button onClick={() => { setView('list'); setSelected(null) }} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-all">
          <ArrowLeft size={16} /> Back to Forum
        </button>

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {selected.userId?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-black text-slate-900 mb-2">{selected.title}</h1>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase border border-blue-100">{selected.subject}</span>
                {selected.chapter && <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100">{selected.chapter}</span>}
                <span className="px-2.5 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg flex items-center gap-1"><Eye size={10} /> {selected.views}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.body}</p>
              <div className="flex items-center gap-3 mt-4">
                <button onClick={() => handleUpvote(selected._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:bg-blue-50 hover:border-blue-200 text-slate-500 border-slate-200">
                  <ThumbsUp size={13} /> {selected.upvotes?.length || 0}
                </button>
                <span className="text-[11px] text-slate-400">{selected.userId?.name} · Lv.{selected.userId?.level || 1}</span>
                <span className="text-[11px] text-slate-300">{new Date(selected.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div>
          <h3 className="font-black text-slate-900 text-sm mb-3">{selected.answers?.length || 0} Answers</h3>
          <div className="space-y-3">
            {selected.answers?.map((a, i) => (
              <div key={a._id || i} className={`bg-white rounded-2xl border p-5 ${a.isAI ? 'border-violet-200 bg-violet-50/30' : 'border-slate-100'}`}>
                <div className="flex items-start gap-3">
                  {a.isAI ? (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={14} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 font-black text-xs flex-shrink-0">
                      {a.userId?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-700">{a.isAI ? 'AI Assistant' : a.userId?.name || 'Anonymous'}</span>
                      {a.isAI && <span className="px-1.5 py-0.5 bg-violet-100 text-violet-600 text-[9px] font-black rounded uppercase">AI</span>}
                      <span className="text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                    <button onClick={() => handleAnswerUpvote(a._id)}
                      className="flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-200">
                      <ThumbsUp size={11} /> {a.upvotes?.length || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post answer */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900">Your Answer</h4>
            <button onClick={handleAIAnswer} disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-[11px] font-bold hover:bg-violet-700 transition-all disabled:opacity-50">
              {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {aiLoading ? 'Generating…' : 'Ask AI'}
            </button>
          </div>
          <textarea value={answerText} onChange={e => setAnswerText(e.target.value)} rows={4} placeholder="Write your answer…"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none" />
          <button onClick={handleAnswer} disabled={!answerText.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-40 flex items-center gap-2">
            <Send size={14} /> Post Answer
          </button>
        </div>
      </div>
    </div>
  )

  // ─── LIST VIEW ───────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl shadow-violet-500/20 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={18} className="text-violet-200" />
            <span className="text-violet-200 text-xs font-bold uppercase tracking-widest">Community</span>
          </div>
          <h1 className="text-3xl font-black mb-2">Doubt Forum</h1>
          <p className="text-violet-200 text-sm mb-5">Ask doubts, help others, get AI-powered answers instantly.</p>
          <button onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-white text-violet-700 rounded-xl font-black text-sm hover:bg-violet-50 transition-all flex items-center gap-2">
            <Plus size={16} /> Ask a Doubt
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doubts…"
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400" />
          </div>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
            {['all', ...SUBJECTS].map(s => (
              <button key={s} onClick={() => setSubFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${subFilter === s ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                {s}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none">
            <option value="recent">Recent</option>
            <option value="popular">Popular</option>
          </select>
        </div>

        {/* Doubt list */}
        {loading ? (
          <div className="space-y-3">
            {[0,1,2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-2">
                <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <MessageCircle size={32} className="text-slate-300 mx-auto mb-3" />
            <h3 className="font-black text-slate-900 mb-1">No Doubts Yet</h3>
            <p className="text-sm text-slate-400">Be the first to ask a question!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => (
              <div key={d._id} onClick={() => openDoubt(d._id)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-lg hover:border-violet-200 transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-600 font-black text-sm flex-shrink-0 group-hover:from-violet-500 group-hover:to-purple-500 group-hover:text-white transition-all">
                    {d.userId?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-violet-700 transition-colors">{d.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1 mb-2">{d.body}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase">{d.subject}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${d.status === 'answered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{d.status}</span>
                      <span className="text-[10px] text-slate-300 flex items-center gap-1"><MessageCircle size={9} /> {d.answers?.length || 0}</span>
                      <span className="text-[10px] text-slate-300 flex items-center gap-1"><ThumbsUp size={9} /> {d.upvotes?.length || 0}</span>
                      <span className="text-[10px] text-slate-300 flex items-center gap-1"><Eye size={9} /> {d.views || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-900">Ask a Doubt</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200"><X size={16} /></button>
            </div>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What's your doubt? (short title)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400 font-semibold" />
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={5} placeholder="Describe your doubt in detail…"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400 resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
              <input value={form.chapter} onChange={e => setForm({ ...form, chapter: e.target.value })} placeholder="Chapter (optional)"
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
            </div>
            <button onClick={handleCreate} disabled={posting}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-black text-sm shadow-lg shadow-violet-500/20 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {posting ? 'Posting…' : 'Post Doubt'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
