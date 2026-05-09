import { useState, useEffect, useRef } from 'react'
import {
  Layers, Plus, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, X,
  Trash2, Edit3, Save, Brain, Zap, Clock, Target, BookOpen, Loader2, Search, Filter
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']
const QUALITY_LABELS = [
  { q: 0, label: 'Forgot', color: 'bg-rose-500 hover:bg-rose-600' },
  { q: 3, label: 'Hard', color: 'bg-amber-500 hover:bg-amber-600' },
  { q: 4, label: 'Good', color: 'bg-blue-500 hover:bg-blue-600' },
  { q: 5, label: 'Easy', color: 'bg-emerald-500 hover:bg-emerald-600' },
]

export default function FlashcardPage() {
  const [view, setView] = useState('dashboard') // dashboard | study | browse | create
  const [cards, setCards] = useState([])
  const [stats, setStats] = useState({ total: 0, due: 0, bySubject: [] })
  const [loading, setLoading] = useState(true)
  const [subFilter, setSubFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Study state
  const [studyCards, setStudyCards] = useState([])
  const [studyIdx, setStudyIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [studied, setStudied] = useState(0)

  // Create
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ subject: 'Physics', chapter: '', front: '', back: '', difficulty: 'medium' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

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
      setStats(statsRes.data.data || { total: 0, due: 0, bySubject: [] })
    } catch {}
    finally { setLoading(false) }
  }

  const startStudy = (onlyDue = true) => {
    let toStudy = cards
    if (onlyDue) toStudy = cards.filter(c => new Date(c.nextReview) <= new Date())
    if (toStudy.length === 0) { toast.error('No cards to study!'); return }
    setStudyCards(toStudy)
    setStudyIdx(0)
    setFlipped(false)
    setStudied(0)
    setView('study')
  }

  const handleReview = async (quality) => {
    const card = studyCards[studyIdx]
    try {
      await api.post(`/flashcards/${card._id}/review`, { quality })
    } catch {}
    setStudied(p => p + 1)
    if (studyIdx < studyCards.length - 1) {
      setStudyIdx(p => p + 1)
      setFlipped(false)
    } else {
      toast.success(`Session complete! Reviewed ${studyCards.length} cards`)
      setView('dashboard')
      fetchAll()
    }
  }

  const handleCreate = async () => {
    if (!form.front || !form.back) { toast.error('Front and back required'); return }
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/flashcards/${editId}`, form)
        toast.success('Card updated!')
      } else {
        await api.post('/flashcards', form)
        toast.success('Card created!')
      }
      setShowCreate(false)
      setEditId(null)
      setForm({ subject: 'Physics', chapter: '', front: '', back: '', difficulty: 'medium' })
      fetchAll()
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/flashcards/${id}`)
      setCards(prev => prev.filter(c => c._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const openEdit = (card) => {
    setForm({ subject: card.subject, chapter: card.chapter, front: card.front, back: card.back, difficulty: card.difficulty })
    setEditId(card._id)
    setShowCreate(true)
  }

  const dueCards = cards.filter(c => new Date(c.nextReview) <= new Date())
  const filtered = cards.filter(c => !search || c.front.toLowerCase().includes(search.toLowerCase()) || c.back.toLowerCase().includes(search.toLowerCase()))

  // ─── STUDY MODE ──────────────────────────────────────────────
  if (view === 'study') {
    const card = studyCards[studyIdx]
    if (!card) return null

    return (
      <div className="min-h-full bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-5">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <button onClick={() => { setView('dashboard'); fetchAll() }}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700"><ChevronLeft size={16} /></button>
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${((studyIdx + 1) / studyCards.length) * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-400">{studyIdx + 1}/{studyCards.length}</span>
          </div>

          {/* Flashcard */}
          <div onClick={() => setFlipped(!flipped)} className="cursor-pointer perspective-1000" style={{ perspective: '1000px' }}>
            <div className={`relative w-full transition-transform duration-500 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}
              style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

              {/* Front */}
              <div className={`bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-10 text-white shadow-2xl shadow-purple-500/25 text-center min-h-[280px] flex flex-col items-center justify-center ${flipped ? 'invisible' : ''}`}>
                <div className="flex gap-2 mb-4">
                  <span className="px-2.5 py-0.5 bg-white/15 rounded-lg text-[10px] font-bold uppercase">{card.subject}</span>
                  {card.chapter && <span className="px-2.5 py-0.5 bg-white/10 rounded-lg text-[10px] font-bold">{card.chapter}</span>}
                </div>
                <p className="text-lg font-bold leading-relaxed">{card.front}</p>
                <p className="text-xs text-white/40 mt-6">Tap to flip</p>
              </div>

              {/* Back */}
              <div className={`absolute inset-0 bg-white rounded-3xl border-2 border-indigo-100 p-10 shadow-2xl text-center min-h-[280px] flex flex-col items-center justify-center ${!flipped ? 'invisible' : ''}`}
                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 size={20} className="text-indigo-600" />
                </div>
                <p className="text-base font-semibold text-slate-800 leading-relaxed">{card.back}</p>
              </div>
            </div>
          </div>

          {/* Rating buttons (show after flip) */}
          {flipped && (
            <div className="space-y-3 animate-in slide-in-from-bottom duration-300">
              <p className="text-center text-xs font-bold text-slate-400">How well did you know this?</p>
              <div className="grid grid-cols-4 gap-2">
                {QUALITY_LABELS.map(ql => (
                  <button key={ql.q} onClick={() => handleReview(ql.q)}
                    className={`py-3 ${ql.color} text-white rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-105`}>
                    {ql.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── BROWSE MODE ─────────────────────────────────────────────
  if (view === 'browse') return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('dashboard')} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800"><ChevronLeft size={16} /></button>
          <h2 className="font-black text-xl text-slate-900 flex-1">All Flashcards ({cards.length})</h2>
          <button onClick={() => { setShowCreate(true); setEditId(null) }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Plus size={13} /> New</button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400" />
        </div>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {filtered.map(c => {
            const isDue = new Date(c.nextReview) <= new Date()
            return (
              <div key={c._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded uppercase">{c.subject}</span>
                    {isDue && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded">DUE</span>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600"><Edit3 size={12} /></button>
                    <button onClick={() => handleDelete(c._id)} className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 size={12} /></button>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-900 mb-2">{c.front}</p>
                <p className="text-xs text-slate-400 line-clamp-2">{c.back}</p>
                <div className="flex gap-2 mt-3 text-[10px] text-slate-300 font-bold">
                  <span>Reviews: {c.reviewCount}</span>
                  <span>Interval: {c.interval}d</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ─── DASHBOARD ───────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-3">
            <Layers size={18} className="text-pink-200" />
            <span className="text-purple-200 text-xs font-bold uppercase tracking-widest">Spaced Repetition</span>
          </div>
          <h1 className="text-3xl font-black mb-2">Flashcards</h1>
          <p className="text-purple-200 text-sm mb-5">Smart revision with the SM-2 algorithm. Never forget what you learn.</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-black">{stats.total}</p>
              <p className="text-[10px] font-bold text-white/60">Total Cards</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-black text-amber-300">{stats.due}</p>
              <p className="text-[10px] font-bold text-white/60">Due Today</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-black">{stats.bySubject?.length || 0}</p>
              <p className="text-[10px] font-bold text-white/60">Subjects</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => startStudy(true)} disabled={stats.due === 0}
            className="py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-40">
            <Brain size={18} /> Study Due ({stats.due})
          </button>
          <button onClick={() => startStudy(false)} disabled={stats.total === 0}
            className="py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-purple-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-40">
            <Layers size={18} /> Study All ({stats.total})
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setShowCreate(true); setEditId(null); setForm({ subject: 'Physics', chapter: '', front: '', back: '', difficulty: 'medium' }) }}
            className="py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <Plus size={16} /> Create Card
          </button>
          <button onClick={() => setView('browse')}
            className="py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <BookOpen size={16} /> Browse All
          </button>
        </div>

        {/* Subject breakdown */}
        {stats.bySubject?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-slate-900 text-sm mb-4">Cards by Subject</h3>
            <div className="space-y-3">
              {stats.bySubject.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700">{s._id}</span>
                    <span className="text-xs text-slate-400">{s.count} cards · <span className="text-amber-600 font-bold">{s.dueCount} due</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${stats.total > 0 ? (s.count / stats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent cards preview */}
        {cards.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-900 text-sm">Recent Cards</h3>
              <button onClick={() => setView('browse')} className="text-xs font-bold text-indigo-600 hover:underline">View All →</button>
            </div>
            <div className="space-y-2">
              {cards.slice(0, 5).map(c => {
                const isDue = new Date(c.nextReview) <= new Date()
                return (
                  <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all">
                    <div className={`w-2 h-8 rounded-full ${isDue ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.front}</p>
                      <p className="text-[10px] text-slate-400">{c.subject} · {c.chapter || 'General'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDue ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {isDue ? 'Due' : `${c.interval}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-900">{editId ? 'Edit Card' : 'New Flashcard'}</h3>
              <button onClick={() => { setShowCreate(false); setEditId(null) }} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200"><X size={16} /></button>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Front (Question / Term)</p>
              <textarea value={form.front} onChange={e => setForm({ ...form, front: e.target.value })} rows={3} placeholder="What is Newton's Second Law?"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 resize-none font-semibold" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Back (Answer / Definition)</p>
              <textarea value={form.back} onChange={e => setForm({ ...form, back: e.target.value })} rows={3} placeholder="F = ma. Force equals mass times acceleration."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject</p>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Chapter</p>
                <input value={form.chapter} onChange={e => setForm({ ...form, chapter: e.target.value })} placeholder="Optional"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
              </div>
            </div>
            <button onClick={handleCreate} disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-sm shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving…' : editId ? 'Update Card' : 'Create Card'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
