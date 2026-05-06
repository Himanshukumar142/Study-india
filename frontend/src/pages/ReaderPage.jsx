import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import api from '../services/api'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Bookmark, Clock, ArrowLeft, Minus, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Build an absolute stream URL routed through backend (bypasses B2 CORS)
const getStreamUrl = (contentId) => {
  const token = localStorage.getItem('accessToken')
  const base = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : `${window.location.protocol}//${window.location.host}/api`
  return `${base}/content/${contentId}/stream?token=${encodeURIComponent(token)}`
}

// Build download URL — same proxy but backend sets Content-Disposition: attachment
const getDownloadUrl = (contentId) => {
  const token = localStorage.getItem('accessToken')
  const base = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : `${window.location.protocol}//${window.location.host}/api`
  return `${base}/content/${contentId}/download?token=${encodeURIComponent(token)}`
}

export default function ReaderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState(null)
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [loading, setLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState(false)
  const startTimeRef = useRef(Date.now())
  const savedRef = useRef(false)

  // Memoize both URLs so react-pdf doesn't see a "new" object on every render
  const pdfFile = useMemo(() => ({
    url: getStreamUrl(id),
    httpHeaders: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
  }), [id])

  const downloadUrl = useMemo(() => getDownloadUrl(id), [id])

  useEffect(() => {
    api.get(`/content/${id}`)
      .then(({ data }) => setContent(data.data))
      .catch(() => toast.error('Content not found'))
      .finally(() => setLoading(false))
    return () => { if (!savedRef.current) saveSession() }
  }, [id])

  const saveSession = useCallback(async () => {
    if (savedRef.current) return
    savedRef.current = true
    const mins = Math.round((Date.now() - startTimeRef.current) / 60000)
    if (mins < 1) return
    try {
      await api.post('/sessions/study', {
        contentId: id, durationMinutes: mins,
        startPage: 1, endPage: pageNumber, totalPages: numPages || 1,
      })
    } catch {}
  }, [id, pageNumber, numPages])

  const toggleBookmark = async () => {
    try {
      if (bookmarked) {
        await api.delete(`/bookmarks/${id}`); setBookmarked(false); toast.success('Bookmark removed')
      } else {
        await api.post(`/bookmarks/${id}`); setBookmarked(true); toast.success('Bookmarked!')
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
  if (!content) return <div style={{ padding: 32, color: '#64748b' }}>Content not found</div>

  const progressPct = numPages ? Math.round((pageNumber / numPages) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>
      {/* ── Top toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
        background: 'white', borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <button
          onClick={() => { saveSession(); navigate('/library') }}
          className="btn btn-ghost btn-sm"
          style={{ gap: 6 }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {content.title}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{content.subject} · {content.chapter}</div>
        </div>

        {/* Progress */}
        {numPages && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80 }}>
              <div className="progress-track" style={{ height: 4 }}>
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>
              {progressPct}%
            </span>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.15))} className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }}>
            <Minus size={14} />
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', minWidth: 38, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button onClick={() => setScale(s => Math.min(3, s + 0.15))} className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }}>
            <Plus size={14} />
          </button>

          <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

          <button
            onClick={toggleBookmark}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 8px', color: bookmarked ? '#d97706' : undefined }}
            title="Bookmark"
          >
            <Bookmark size={15} fill={bookmarked ? '#d97706' : 'none'} />
          </button>

          <a
            href={downloadUrl}
            download
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            title="Download"
          >
            <Download size={15} />
          </a>
        </div>
      </div>

      {/* ── Viewer area ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9', display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
        {content.fileType === 'pdf' ? (
          <Document
            file={pdfFile}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div style={{ color: '#64748b', marginTop: 60, fontSize: 14 }}>Loading PDF...</div>}
            error={<div style={{ color: '#ef4444', marginTop: 60, fontSize: 14 }}>Failed to load PDF. <a href={content.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Open directly</a></div>}
          >
            <Page pageNumber={pageNumber} scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
        ) : (
          <img
            src={getStreamUrl(id)}
            alt={content.title}
            style={{ maxWidth: '100%', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', transform: `scale(${scale})`, transformOrigin: 'top center' }}
          />
        )}
      </div>

      {/* ── Page navigation ── */}
      {content.fileType === 'pdf' && numPages && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          padding: '12px 20px', background: 'white', borderTop: '1px solid #e2e8f0',
        }}>
          <button
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="btn btn-secondary btn-sm"
          >
            <ChevronLeft size={15} /> Prev
          </button>

          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
            Page <strong style={{ color: '#0f172a' }}>{pageNumber}</strong> of {numPages}
          </span>

          <button
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="btn btn-secondary btn-sm"
          >
            Next <ChevronRight size={15} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8, fontSize: 12, color: '#94a3b8' }}>
            <Clock size={12} /> Reading tracked
          </div>
        </div>
      )}
    </div>
  )
}
