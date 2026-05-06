import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { BookOpen, FileText, Trash2, ExternalLink, ChevronRight, Bookmark as BookmarkIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BookmarksPage() {
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('question') // question | content

  const fetchBookmarks = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/bookmarks')
      setBookmarks(data.data)
    } catch { toast.error('Failed to load bookmarks') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBookmarks() }, [])

  const removeBookmark = async (type, itemId) => {
    try {
      await api.delete(`/bookmarks/${type}/${itemId}`)
      setBookmarks(prev => prev.filter(b => !(b.type === type && b.itemId?._id === itemId)))
      toast.success('Bookmark removed')
    } catch { toast.error('Failed to remove') }
  }

  const filtered = bookmarks.filter(b => b.type === tab)

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Personal Library</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Access your bookmarked questions and study materials.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
        <button 
          onClick={() => setTab('question')}
          style={{ 
            padding: '8px 20px', borderRadius: 99, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            background: tab === 'question' ? '#eef2ff' : 'transparent',
            color: tab === 'question' ? '#4f46e5' : '#64748b',
            border: `1.5px solid ${tab === 'question' ? '#4f46e5' : 'transparent'}`
          }}
        >
          <BookOpen size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Saved Questions
        </button>
        <button 
          onClick={() => setTab('content')}
          style={{ 
            padding: '8px 20px', borderRadius: 99, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            background: tab === 'content' ? '#eef2ff' : 'transparent',
            color: tab === 'content' ? '#4f46e5' : '#64748b',
            border: `1.5px solid ${tab === 'content' ? '#4f46e5' : 'transparent'}`
          }}
        >
          <FileText size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Study Materials
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', py: 40 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookmarkIcon size={32} color="#94a3b8" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>No {tab}s bookmarked</h3>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Items you bookmark during study sessions will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(b => (
            <div key={b._id} className="card fade-up" style={{ padding: 20 }}>
              {tab === 'question' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <span className="badge badge-blue">{b.itemId?.subject}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{b.itemId?.chapter}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.6 }}>{b.itemId?.question}</p>
                    {b.note && <p style={{ fontSize: 12, color: '#64748b', marginTop: 8, fontStyle: 'italic' }}>Note: {b.note}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button 
                      onClick={() => removeBookmark('question', b.itemId?._id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={20} color="#4f46e5" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{b.itemId?.title}</h3>
                      <p style={{ fontSize: 12, color: '#64748b' }}>{b.itemId?.subject} · {b.itemId?.fileType?.toUpperCase()}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => navigate(`/reader/${b.itemId?._id}`)}
                      className="btn btn-secondary btn-sm"
                    >
                      <ExternalLink size={14} /> Open
                    </button>
                    <button 
                      onClick={() => removeBookmark('content', b.itemId?._id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
