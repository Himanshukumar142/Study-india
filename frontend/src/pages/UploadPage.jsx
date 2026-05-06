import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { FileText, Image, X, CloudUpload, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']

export default function UploadPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', subject: 'Physics', chapter: '', topic: '', description: '', visibility: 'public', tags: '' })
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    if (!form.title || !form.chapter) return toast.error('Title and chapter are required')
    setLoading(true); setProgress(0)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('file', file)
      await api.post('/content/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      toast.success('Uploaded successfully! 🎉')
      navigate('/library')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setLoading(false) }
  }

  const isPDF = file?.type === 'application/pdf'

  return (
    <div style={{ padding: 32, maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Upload Content</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Share notes and study materials with other students</p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !file && document.getElementById('fileInput').click()}
          style={{
            border: `2px dashed ${dragOver ? '#4f46e5' : file ? '#10b981' : '#d1d5db'}`,
            borderRadius: 16,
            padding: '40px 32px',
            textAlign: 'center',
            cursor: file ? 'default' : 'pointer',
            background: dragOver ? '#eef2ff' : file ? '#f0fdf4' : '#fafafa',
            transition: 'all 0.2s',
          }}
        >
          <input id="fileInput" type="file" accept=".pdf,image/*" className="hidden"
            onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: isPDF ? '#fef2f2' : '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isPDF ? <FileText size={24} color="#ef4444" /> : <Image size={24} color="#0891b2" />}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · {isPDF ? 'PDF Document' : 'Image'}</div>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                style={{ marginLeft: 8, width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <CloudUpload size={26} color="#4f46e5" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                {dragOver ? 'Drop your file here' : 'Drag & drop or click to upload'}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>PDF or image files · Max 20 MB</div>
            </>
          )}
        </div>

        {/* Progress */}
        {loading && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Uploading...</span>
              <span style={{ fontWeight: 700, color: '#4f46e5' }}>{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Form details */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Content Details</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input name="title" value={form.title} onChange={handle} className="input"
                placeholder="e.g. Electrostatics Chapter Notes" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Subject <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="subject" value={form.subject} onChange={handle} className="input">
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Chapter <span style={{ color: '#ef4444' }}>*</span></label>
                <input name="chapter" value={form.chapter} onChange={handle} className="input"
                  placeholder="e.g. Electrostatics" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Topic</label>
                <input name="topic" value={form.topic} onChange={handle} className="input" placeholder="Optional" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Visibility</label>
                <select name="visibility" value={form.visibility} onChange={handle} className="input">
                  <option value="public">🌐 Public</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Tags</label>
              <input name="tags" value={form.tags} onChange={handle} className="input"
                placeholder="e.g. JEE, Coulomb's Law, Important (comma-separated)" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</label>
              <textarea name="description" value={form.description} onChange={handle} className="input"
                rows={3} style={{ resize: 'none' }} placeholder="Brief description of the content..." />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? <><span className="spinner" /> Uploading...</> : <><CheckCircle2 size={16} /> Upload to Library</>}
        </button>
      </form>
    </div>
  )
}
