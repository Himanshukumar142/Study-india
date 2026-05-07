import { useState, useEffect, useRef } from 'react'
import {
  StickyNote, Plus, Search, Pin, Archive, Trash2, Edit3, Save, X,
  BookOpen, Tag, ChevronDown, Loader2, ArchiveRestore
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']
const NOTE_COLORS = [
  { bg: '#ffffff', border: '#e2e8f0', label: 'White' },
  { bg: '#fef9c3', border: '#fde047', label: 'Yellow' },
  { bg: '#dcfce7', border: '#86efac', label: 'Green' },
  { bg: '#dbeafe', border: '#93c5fd', label: 'Blue' },
  { bg: '#fce7f3', border: '#f9a8d4', label: 'Pink' },
  { bg: '#ede9fe', border: '#c4b5fd', label: 'Purple' },
  { bg: '#ffedd5', border: '#fdba74', label: 'Orange' },
]

export default function NotesPage() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subFilter, setSubFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [editNote, setEditNote] = useState(null)       // note being edited
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', subject: '', chapter: '', color: '#ffffff' })
  const [saving, setSaving] = useState(false)
  const textRef = useRef(null)

  useEffect(() => { fetchNotes() }, [subFilter, showArchived, search])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ archived: showArchived ? 'true' : 'false' })
      if (subFilter !== 'all') params.set('subject', subFilter)
      if (search) params.set('search', search)
      const { data } = await api.get(`/notes?${params}`)
      setNotes(data.data || [])
    } catch {}
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setForm({ title: '', content: '', subject: '', chapter: '', color: '#ffffff' })
    setEditNote(null)
    setShowCreate(true)
  }

  const openEdit = (note) => {
    setForm({ title: note.title, content: note.content, subject: note.subject, chapter: note.chapter, color: note.color || '#ffffff' })
    setEditNote(note)
    setShowCreate(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    try {
      if (editNote) {
        const { data } = await api.put(`/notes/${editNote._id}`, form)
        setNotes(prev => prev.map(n => n._id === editNote._id ? data.data : n))
        toast.success('Note updated!')
      } else {
        const { data } = await api.post('/notes', form)
        setNotes(prev => [data.data, ...prev])
        toast.success('Note created!')
      }
      setShowCreate(false)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notes/${id}`)
      setNotes(prev => prev.filter(n => n._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const handlePin = async (id) => {
    try {
      const { data } = await api.patch(`/notes/${id}/pin`)
      setNotes(prev => prev.map(n => n._id === id ? data.data : n).sort((a, b) => b.isPinned - a.isPinned))
    } catch {}
  }

  const handleArchive = async (id) => {
    try {
      await api.patch(`/notes/${id}/archive`)
      setNotes(prev => prev.filter(n => n._id !== id))
      toast.success(showArchived ? 'Unarchived!' : 'Archived!')
    } catch {}
  }

  const pinned = notes.filter(n => n.isPinned)
  const unpinned = notes.filter(n => !n.isPinned)

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-8 text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-3">
            <StickyNote size={18} className="text-orange-200" />
            <span className="text-orange-100 text-xs font-bold uppercase tracking-widest">Personal Notes</span>
          </div>
          <h1 className="text-3xl font-black mb-2">My Notes</h1>
          <p className="text-orange-100 text-sm mb-5">Write chapter notes, key points, formulas — all in one place.</p>
          <button onClick={openCreate}
            className="px-5 py-2.5 bg-white text-orange-600 rounded-xl font-black text-sm hover:bg-orange-50 transition-all flex items-center gap-2">
            <Plus size={16} /> New Note
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-44">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value) }} placeholder="Search notes…"
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400" />
          </div>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
            {['all', ...SUBJECTS].map(s => (
              <button key={s} onClick={() => setSubFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${subFilter === s ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${showArchived ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'}`}>
            <Archive size={13} /> {showArchived ? 'Showing Archived' : 'Archived'}
          </button>
        </div>

        {/* Notes grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0,1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse h-48" />)}
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <StickyNote size={36} className="text-slate-300 mx-auto mb-3" />
            <h3 className="font-black text-slate-900 mb-1">{showArchived ? 'No Archived Notes' : 'No Notes Yet'}</h3>
            <p className="text-sm text-slate-400 mb-4">Start writing your chapter notes</p>
            {!showArchived && (
              <button onClick={openCreate} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 mx-auto">
                <Plus size={14} /> Create First Note
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinned.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pin size={12} className="text-slate-400" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pinned</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinned.map(n => <NoteCard key={n._id} note={n} onEdit={openEdit} onDelete={handleDelete} onPin={handlePin} onArchive={handleArchive} showArchived={showArchived} />)}
                </div>
              </div>
            )}
            {/* Others */}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Others</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unpinned.map(n => <NoteCard key={n._id} note={n} onEdit={openEdit} onDelete={handleDelete} onPin={handlePin} onArchive={handleArchive} showArchived={showArchived} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-black text-lg text-slate-900">{editNote ? 'Edit Note' : 'New Note'}</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:bg-slate-200"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Color picker */}
              <div className="flex gap-2 flex-wrap">
                {NOTE_COLORS.map(c => (
                  <button key={c.bg} onClick={() => setForm({ ...form, color: c.bg })}
                    className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${form.color === c.bg ? 'ring-2 ring-offset-1 ring-amber-400 scale-110' : ''}`}
                    style={{ background: c.bg, borderColor: c.border }} title={c.label} />
                ))}
              </div>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Note title…"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 font-bold text-base"
                style={{ background: form.color }} />
              <textarea ref={textRef} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10}
                placeholder="Write your notes here… formulas, key points, summary…"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 resize-none font-mono leading-relaxed"
                style={{ background: form.color }} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                  <option value="">Subject (optional)</option>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <input value={form.chapter} onChange={e => setForm({ ...form, chapter: e.target.value })} placeholder="Chapter (optional)"
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100">
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black text-sm shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving…' : editNote ? 'Update Note' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, onEdit, onDelete, onPin, onArchive, showArchived }) {
  const colorCfg = NOTE_COLORS.find(c => c.bg === note.color) || NOTE_COLORS[0]
  const preview = note.content?.slice(0, 150) || ''

  return (
    <div className="rounded-2xl border-2 p-5 group hover:shadow-lg transition-all relative"
      style={{ background: note.color || '#ffffff', borderColor: colorCfg.border }}>
      {/* Actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onPin(note._id)}
          className={`p-1.5 rounded-lg text-xs transition-all ${note.isPinned ? 'bg-amber-100 text-amber-600' : 'bg-white/80 text-slate-400 hover:text-amber-500'}`}>
          <Pin size={12} />
        </button>
        <button onClick={() => onEdit(note)} className="p-1.5 bg-white/80 rounded-lg text-slate-400 hover:text-blue-600"><Edit3 size={12} /></button>
        <button onClick={() => onArchive(note._id)} className="p-1.5 bg-white/80 rounded-lg text-slate-400 hover:text-slate-700">
          {showArchived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
        </button>
        <button onClick={() => onDelete(note._id)} className="p-1.5 bg-white/80 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 size={12} /></button>
      </div>

      {/* Content */}
      <h4 className="font-black text-slate-900 text-sm mb-2 pr-20 line-clamp-2">{note.title}</h4>
      {preview && <p className="text-xs text-slate-600 leading-relaxed line-clamp-5 whitespace-pre-wrap font-mono">{preview}{note.content?.length > 150 ? '…' : ''}</p>}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5">
        {note.subject && <span className="px-2 py-0.5 bg-white/70 text-slate-500 text-[9px] font-black rounded uppercase">{note.subject}</span>}
        {note.chapter && <span className="px-2 py-0.5 bg-white/50 text-slate-400 text-[9px] font-bold rounded">{note.chapter}</span>}
        <span className="ml-auto text-[9px] text-slate-400">{new Date(note.updatedAt).toLocaleDateString('en-IN')}</span>
      </div>
    </div>
  )
}
