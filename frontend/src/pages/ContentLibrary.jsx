import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Search, BookOpen, Bookmark, Eye, Upload, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']

const subjectColors = {
  Physics:     { bg: '#eef2ff', color: '#4f46e5' },
  Chemistry:   { bg: '#f0fdf4', color: '#059669' },
  Mathematics: { bg: '#fffbeb', color: '#d97706' },
  Biology:     { bg: '#fdf4ff', color: '#9333ea' },
}

export default function ContentLibrary() {
  const navigate = useNavigate()
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ subject: '', fileType: '' })
  const [bookmarked, setBookmarked] = useState(new Set())
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const fetchContents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 12 })
      if (search) params.set('search', search)
      if (filters.subject) params.set('subject', filters.subject)
      if (filters.fileType) params.set('fileType', filters.fileType)
      const { data } = await api.get(`/content?${params}`)
      setContents(data.data)
      setPagination(data.pagination)
    } catch { toast.error('Failed to load content') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchContents() }, [page, filters])

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchContents() }

  const toggleBookmark = async (contentId, e) => {
    e.stopPropagation()
    try {
      if (bookmarked.has(contentId)) {
        await api.delete(`/bookmarks/${contentId}`)
        setBookmarked(prev => { const s = new Set(prev); s.delete(contentId); return s })
        toast.success('Bookmark removed')
      } else {
        await api.post(`/bookmarks/${contentId}`)
        setBookmarked(prev => new Set([...prev, contentId]))
        toast.success('Bookmarked!')
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Content Library</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Browse notes, PDFs and study material</p>
        </div>
        <button onClick={() => navigate('/upload')} className="btn btn-primary" style={{ gap: 8 }}>
          <Upload size={15} /> Upload
        </button>
      </div>

      {/* ── Search + Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
            <Search size={15} />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} className="input"
            style={{ paddingLeft: 40, borderRadius: 99, height: 40 }}
            placeholder="Search notes, chapters, topics..." />
        </form>

        <select value={filters.subject} onChange={e => { setFilters({ ...filters, subject: e.target.value }); setPage(1) }}
          className="input" style={{ width: 150, height: 40 }}>
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={filters.fileType} onChange={e => { setFilters({ ...filters, fileType: e.target.value }); setPage(1) }}
          className="input" style={{ width: 130, height: 40 }}>
          <option value="">All Types</option>
          <option value="pdf">PDF</option>
          <option value="image">Image</option>
        </select>
      </div>

      {/* ── Subject chips ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setFilters({ ...filters, subject: '' })}
          className={`chip ${!filters.subject ? 'active' : ''}`}>All</button>
        {SUBJECTS.map(s => (
          <button key={s} onClick={() => setFilters({ ...filters, subject: filters.subject === s ? '' : s })}
            className={`chip ${filters.subject === s ? 'active' : ''}`}>
            {s}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="card" style={{ padding: 20, height: 160 }}>
              <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '80%' }} />
            </div>
          ))}
        </div>
      ) : contents.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-icon"><BookOpen size={28} /></div>
          <h3>No content found</h3>
          <p>Be the first to upload study material for this topic!</p>
          <button onClick={() => navigate('/upload')} className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
            Upload Content
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {contents.map((c) => {
            const sc = subjectColors[c.subject] || { bg: '#f8fafc', color: '#64748b' }
            const isBookmarked = bookmarked.has(c._id)
            return (
              <div
                key={c._id}
                className="card card-lift"
                onClick={() => navigate(`/reader/${c._id}`)}
                style={{ padding: 20, cursor: 'pointer', position: 'relative' }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span className="badge" style={{ background: sc.bg, color: sc.color }}>
                    {c.subject}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-slate" style={{ fontSize: 11 }}>
                      {c.fileType?.toUpperCase()}
                    </span>
                    <button
                      onClick={e => toggleBookmark(c._id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: isBookmarked ? '#d97706' : '#cbd5e1', transition: 'color 0.15s' }}
                    >
                      <Bookmark size={14} fill={isBookmarked ? '#d97706' : 'none'} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4, lineHeight: 1.4 }}
                  className="line-clamp-2">{c.title}</h3>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>{c.chapter}</p>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' }}>
                    <Eye size={12} /> {c.viewCount || 0} views
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{(c.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                </div>

                {c.uploadedBy && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700 }}>
                      {c.uploadedBy.name?.[0]}
                    </div>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.uploadedBy.name}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className="btn btn-sm"
              style={{
                background: page === p ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'white',
                color: page === p ? 'white' : '#64748b',
                border: `1px solid ${page === p ? 'transparent' : '#e2e8f0'}`,
                minWidth: 36, fontWeight: 600,
              }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
