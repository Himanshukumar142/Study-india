import { useState } from 'react'
import { Check, X, Filter, Eye, FileText, User, Calendar, HardDrive, Search } from 'lucide-react'
import { Badge, Card, SectionHeader, Btn, EmptyState } from './AdminUI'

const mockContent = [
  { _id: 'c1', title: 'Physics Wave Optics — Complete Notes', uploader: 'Arjun Mehta', subject: 'Physics', chapter: 'Wave Optics', size: '4.2 MB', date: '2025-05-06', status: 'pending', pages: 48, type: 'PDF' },
  { _id: 'c2', title: 'Organic Chemistry Reaction Mechanisms', uploader: 'Priya Sharma', subject: 'Chemistry', chapter: 'Organic Chemistry', size: '8.7 MB', date: '2025-05-05', status: 'pending', pages: 92, type: 'PDF' },
  { _id: 'c3', title: 'NEET Biology — Genetics Handwritten', uploader: 'Tanvi Kapoor', subject: 'Biology', chapter: 'Genetics', size: '2.1 MB', date: '2025-05-05', status: 'pending', pages: 24, type: 'PDF' },
  { _id: 'c4', title: 'JEE Maths — Calculus Formula Sheet', uploader: 'Dev Patel', subject: 'Maths', chapter: 'Calculus', size: '1.4 MB', date: '2025-05-04', status: 'approved', pages: 16, type: 'PDF' },
  { _id: 'c5', title: 'Electrostatics — PYQ 2019-2024', uploader: 'Rohan Verma', subject: 'Physics', chapter: 'Electrostatics', size: '6.8 MB', date: '2025-05-03', status: 'rejected', pages: 78, type: 'PDF' },
  { _id: 'c6', title: 'Thermodynamics Notes — Full Chapter', uploader: 'Siddharth Verma', subject: 'Physics', chapter: 'Thermodynamics', size: '3.5 MB', date: '2025-05-02', status: 'pending', pages: 38, type: 'PDF' },
]

const subjectColors = {
  Physics: 'from-blue-500 to-indigo-600',
  Chemistry: 'from-emerald-500 to-teal-600',
  Maths: 'from-violet-500 to-purple-600',
  Biology: 'from-amber-500 to-orange-500',
}

export default function ApprovalsPage({ content: apiContent, onUpdateStatus }) {
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('ALL')

  const allContent = (apiContent && apiContent.length > 0) ? apiContent : mockContent

  const filtered = allContent.filter(c => {
    const matchStatus = filter === 'all' || c.status === filter
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase()) || c.uploader?.toLowerCase().includes(search.toLowerCase())
    const matchSub = subjectFilter === 'ALL' || c.subject === subjectFilter
    return matchStatus && matchSearch && matchSub
  })

  const pending = allContent.filter(c => c.status === 'pending').length
  const approved = allContent.filter(c => c.status === 'approved').length
  const rejected = allContent.filter(c => c.status === 'rejected').length

  const handleStatus = (id, status) => {
    if (onUpdateStatus) onUpdateStatus(id, status)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader
        title="Content Approvals"
        subtitle="Review and moderate uploaded study materials"
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm"><Filter size={13} /> Filters</Btn>
            <Btn size="sm"><Check size={13} /> Approve All Pending</Btn>
          </div>
        }
      />

      {/* Status strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', count: pending, variant: 'pending', key: 'pending', bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
          { label: 'Approved', count: approved, variant: 'approved', key: 'approved', bg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
          { label: 'Rejected', count: rejected, variant: 'rejected', key: 'rejected', bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`p-4 rounded-2xl border-2 transition-all text-left ${s.bg} ${filter === s.key ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}>
            <p className="text-2xl font-black text-slate-900">{s.count}</p>
            <p className="text-xs font-bold text-slate-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or uploader..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 transition-all shadow-sm" />
        </div>
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 appearance-none shadow-sm">
          <option value="ALL">All Subjects</option>
          <option>Physics</option><option>Chemistry</option><option>Biology</option><option>Maths</option>
        </select>
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-xs font-bold capitalize transition-all ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {filtered.length === 0 ? (
        <Card><EmptyState icon={FileText} title="No content found" desc="No uploads match the current filters." /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(c => (
            <Card key={c._id} className="p-5 hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-200 group">
              <div className="flex gap-4">
                {/* Preview thumbnail */}
                <div className={`w-16 h-20 rounded-xl bg-gradient-to-br ${subjectColors[c.subject] || 'from-slate-400 to-slate-500'} flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/20`}>
                  <FileText size={20} />
                  <span className="text-[9px] font-black mt-1 uppercase tracking-wider">{c.type}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">{c.title}</h4>
                    <Badge variant={c.status}>{c.status}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400"><User size={11} />{c.uploader}</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400"><Calendar size={11} />{new Date(c.date).toLocaleDateString('en-IN')}</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400"><HardDrive size={11} />{c.size}</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400"><FileText size={11} />{c.pages} pages</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">{c.subject}</span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100">{c.chapter}</span>
                  </div>
                </div>
              </div>

              {c.status === 'pending' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">
                    <Eye size={13} /> Preview
                  </button>
                  <button onClick={() => handleStatus(c._id, 'rejected')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all ml-auto">
                    <X size={13} /> Reject
                  </button>
                  <button onClick={() => handleStatus(c._id, 'approved')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">
                    <Check size={13} /> Approve
                  </button>
                </div>
              )}
              {c.status === 'approved' && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><Check size={13} /> Approved & Live</span>
                  <button onClick={() => handleStatus(c._id, 'rejected')} className="text-xs text-rose-500 hover:text-rose-700 font-bold transition-colors">Revoke</button>
                </div>
              )}
              {c.status === 'rejected' && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-rose-500 font-bold flex items-center gap-1"><X size={13} /> Rejected</span>
                  <button onClick={() => handleStatus(c._id, 'approved')} className="text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors">Re-approve</button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
