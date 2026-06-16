import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { FileText, Image as ImageIcon, X, CloudUpload, CheckCircle2, ChevronRight, Globe, Lock, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
  
  .up-root * { box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; }
  .up-display { font-family: 'Outfit', sans-serif; }

  @keyframes pulseSubtle {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.02); opacity: 0.95; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes borderPulse {
    0%, 100% { border-color: #cbd5e1; }
    50% { border-color: #6366f1; }
  }

  .up-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
  
  .up-glass-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 20px;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.02);
  }

  .up-dropzone {
    border: 2px dashed #cbd5e1;
    border-radius: 20px;
    padding: 44px 28px;
    text-align: center;
    cursor: pointer;
    background: rgba(255,255,255,0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  .up-dropzone:hover {
    border-color: #4f46e5;
    background: rgba(79, 70, 229, 0.03);
    transform: translateY(-2px);
  }
  .up-dropzone.active {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.03);
  }
  .up-dropzone.dragging {
    border-color: #4f46e5;
    background: rgba(79, 70, 229, 0.06);
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  }

  .up-select-pill {
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    border: 2px solid #e2e8f0;
    cursor: pointer;
    background: white;
    color: #475569;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .up-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .up-input {
    width: 100%;
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 11px 16px;
    color: #0f172a;
    font-size: 13.5px;
    outline: none;
    transition: all 0.15s;
  }
  .up-input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .up-label {
    font-size: 12px;
    font-weight: 800;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .up-submit-btn {
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 800;
    color: white;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
    transition: all 0.2s;
  }
  .up-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px -4px rgba(79, 70, 229, 0.5);
  }
  .up-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

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
    if (f) {
      if (f.size > 20 * 1024 * 1024) {
        return toast.error('File size exceeds 20MB limit')
      }
      setFile(f)
    }
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
    <div className="up-root" style={{ minHeight: '100%', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)', padding: '32px 16px' }}>
      <style>{css}</style>
      
      <div className="up-slide-up" style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Header */}
        <div>
          <h1 className="up-display" style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Upload Material</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>Publish high-quality study sheets, formulas, or handbook files</p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !file && document.getElementById('fileInput').click()}
            className={`up-dropzone ${dragOver ? 'dragging' : file ? 'active' : ''}`}
          >
            <input 
              id="fileInput" 
              type="file" 
              accept=".pdf,image/*" 
              onChange={e => {
                const f = e.target.files[0]
                if (f) {
                  if (f.size > 20 * 1024 * 1024) return toast.error('File size exceeds 20MB limit')
                  setFile(f)
                }
              }} 
              style={{ display: 'none' }} 
            />

            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 14, 
                    background: isPDF ? '#ffe4e6' : '#e0f7fa', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    {isPDF ? <FileText size={22} color="#e11d48" /> : <ImageIcon size={22} color="#00acc1" />}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 600 }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB · {isPDF ? 'PDF Document' : 'Image Asset'}
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={e => { e.stopPropagation(); setFile(null) }}
                  style={{ 
                    width: 32, height: 32, borderRadius: '50%', 
                    background: '#f1f5f9', border: 'none', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: '#64748b', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div style={{ 
                  width: 52, height: 52, borderRadius: 16, 
                  background: '#e0e7ff', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', 
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)'
                }}>
                  <CloudUpload size={24} color="#4f46e5" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                  {dragOver ? 'Drop file to initiate' : 'Drag & drop file here'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>
                  or <span style={{ color: '#4f46e5', textDecoration: 'underline' }}>browse files</span> from your computer
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Supports PDF or Images up to 20MB
                </div>
              </>
            )}
          </div>

          {/* Upload Progress */}
          {loading && (
            <div className="up-glass-card" style={{ padding: 18, background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
                <span style={{ color: '#4f46e5' }}>Uploading file to secure cloud storage...</span>
                <span style={{ color: '#4f46e5' }}>{progress}%</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', width: `${progress}%`, transition: 'width 0.1s ease' }} />
              </div>
            </div>
          )}

          {/* Form details */}
          <div className="up-glass-card" style={{ padding: 28, background: 'white', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="up-display" style={{ fontSize: 15, fontWeight: 850, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
              <BookOpen size={16} style={{ color: '#4f46e5' }} />
              <span>Material Details</span>
            </div>

            {/* Title */}
            <div className="up-input-wrapper">
              <label className="up-label">Document Title <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                name="title" 
                value={form.title} 
                onChange={handle} 
                className="up-input"
                placeholder="e.g. Thermodynamics Formula Cheat Sheet" 
                required 
              />
            </div>

            {/* Subject Selector Pills */}
            <div className="up-input-wrapper">
              <label className="up-label">Select Subject <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {SUBJECTS.map(s => {
                  const selected = form.subject === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, subject: s })}
                      className="up-select-pill"
                      style={{
                        borderColor: selected ? '#4f46e5' : '#e2e8f0',
                        background: selected ? '#eef2ff' : 'white',
                        color: selected ? '#4f46e5' : '#475569',
                      }}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chapter & Topic */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="up-input-wrapper">
                <label className="up-label">Chapter <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  name="chapter" 
                  value={form.chapter} 
                  onChange={handle} 
                  className="up-input"
                  placeholder="e.g. Kinematics" 
                  required 
                />
              </div>
              <div className="up-input-wrapper">
                <label className="up-label">Sub-Topic</label>
                <input 
                  name="topic" 
                  value={form.topic} 
                  onChange={handle} 
                  className="up-input" 
                  placeholder="e.g. Projectile Motion (Optional)" 
                />
              </div>
            </div>

            {/* Visibility & Tags */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="up-input-wrapper">
                <label className="up-label">Tags</label>
                <input 
                  name="tags" 
                  value={form.tags} 
                  onChange={handle} 
                  className="up-input"
                  placeholder="e.g. JEE, formulas, classnotes" 
                />
              </div>
              <div className="up-input-wrapper">
                <label className="up-label">Library Visibility</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {[
                    { id: 'public', label: 'Public Access', icon: Globe, desc: 'Allow other students to view' },
                    { id: 'private', label: 'Private Keep', icon: Lock, desc: 'Only visible to you' },
                  ].map(v => {
                    const selected = form.visibility === v.id
                    const Icon = v.icon
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setForm({ ...form, visibility: v.id })}
                        className="up-select-pill"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          borderColor: selected ? '#4f46e5' : '#e2e8f0',
                          background: selected ? '#eef2ff' : 'white',
                          color: selected ? '#4f46e5' : '#475569',
                          padding: '12px 14px'
                        }}
                      >
                        <Icon size={14} />
                        <span>{v.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="up-input-wrapper">
              <label className="up-label">Description / Summary</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handle} 
                className="up-input"
                rows={3} 
                style={{ resize: 'none' }} 
                placeholder="Include a helpful description detailing what this note block covers..." 
              />
            </div>

          </div>

          {/* Submit button */}
          <button 
            type="submit" 
            disabled={loading || !file} 
            className="up-submit-btn"
          >
            {loading ? (
              <>
                <span className="pomo-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                <span>Uploading files...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Upload & Publish Material</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  )
}
