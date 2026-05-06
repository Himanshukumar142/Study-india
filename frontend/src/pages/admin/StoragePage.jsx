import { useState, useCallback, useEffect } from 'react'
import { HardDrive, Database, RefreshCw, FileText, AlertTriangle, CheckCircle2, XCircle, Zap, File, Clock, Layers } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import api from '../../services/api'
import { Card, SectionHeader, Badge, Btn } from './AdminUI'

// ─── helpers ─────────────────────────────────────────────────
const fmt = (mb, unit = 'MB') => {
  if (unit === 'MB') return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(2)} GB`
  return mb < 1024 ? `${mb.toFixed(2)} GB` : `${(mb / 1024).toFixed(2)} TB`
}
const pctColor = (p) =>
  p >= 95 ? 'from-rose-600 to-red-700' :
  p >= 85 ? 'from-rose-500 to-pink-600' :
  p >= 70 ? 'from-amber-500 to-orange-500' :
  'from-blue-500 to-indigo-600'

const HealthBadge = ({ level }) => {
  const map = {
    NORMAL:   { variant: 'approved',  label: '✓ Normal',      cls: '' },
    WARNING:  { variant: 'pending',   label: '⚠ Warning',     cls: '' },
    HIGH:     { variant: 'critical',  label: '🔴 Critical',   cls: '' },
    CRITICAL: { variant: 'critical',  label: '🚨 Almost Full',cls: '' },
  }
  const b = map[level] || map.NORMAL
  return <Badge variant={b.variant}>{b.label}</Badge>
}

// ─── Gauge card ───────────────────────────────────────────────
function GaugeCard({ title, icon: Icon, gradient, used, total, unitLabel, pct, health, children }) {
  const safeP = Math.min(pct || 0, 100)
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm">{title}</p>
            <HealthBadge level={health} />
          </div>
        </div>
        <span className={`text-2xl font-black ${safeP >= 85 ? 'text-rose-600' : safeP >= 70 ? 'text-amber-600' : 'text-blue-600'}`}>{safeP.toFixed(1)}%</span>
      </div>

      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${pctColor(safeP)} transition-all duration-700`}
          style={{ width: `${safeP}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 font-semibold mb-4">
        <span>{used} used</span>
        <span>{total} limit</span>
      </div>

      {safeP >= 70 && (
        <div className={`p-3 rounded-xl border text-xs font-semibold mb-4 ${safeP >= 95 ? 'bg-rose-50 border-rose-200 text-rose-700' : safeP >= 85 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          {safeP >= 95 ? '🚨 Storage almost full! Immediate cleanup required.' :
           safeP >= 85 ? '🔴 Critical usage. Consider upgrading your plan.' :
           '⚠️ Storage above 70%. Plan cleanup soon.'}
        </div>
      )}
      {children}
    </Card>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────
const Skeleton = ({ h = 'h-4', w = 'w-full', r = 'rounded-lg' }) => (
  <div className={`${h} ${w} ${r} bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:600px_100%] animate-pulse`} />
)

// ─── Loading state ─────────────────────────────────────────────
function LoadingCards() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0, 1].map(i => (
          <Card key={i} className="p-5 space-y-4">
            <div className="flex gap-3"><Skeleton h="h-10" w="w-10" r="rounded-xl" /><div className="flex-1 space-y-2"><Skeleton h="h-4" w="w-40" /><Skeleton h="h-3" w="w-24" /></div></div>
            <Skeleton h="h-3" />
            <div className="grid grid-cols-2 gap-3">{[0,1,2,3].map(j => <Skeleton key={j} h="h-16" r="rounded-xl" />)}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Error state ───────────────────────────────────────────────
function ErrorCard({ title, message, onRetry }) {
  return (
    <Card className="p-6 border-rose-200 bg-rose-50">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <XCircle size={20} className="text-rose-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-black text-rose-900 text-sm mb-1">{title}</h4>
          <p className="text-xs text-rose-600 leading-relaxed mb-3">{message}</p>
          <Btn variant="secondary" size="sm" onClick={onRetry}><RefreshCw size={12} /> Retry</Btn>
        </div>
      </div>
    </Card>
  )
}

// ─── MongoDB Panel ─────────────────────────────────────────────
function MongoPanel({ data, loading, error, onRetry }) {
  if (loading) return <LoadingCards />
  if (error) return <ErrorCard title="MongoDB Usage Unavailable" message={error} onRetry={onRetry} />
  if (!data) return null

  const cols = data.collectionBreakdown || []
  const topCols = cols.slice(0, 6)

  return (
    <div className="space-y-5">
      <GaugeCard
        title="MongoDB Atlas"
        icon={Database}
        gradient="from-emerald-500 to-teal-600"
        used={`${data.storageSizeMB?.toFixed(1)} MB`}
        total={`${data.maxLimitMB} MB`}
        pct={data.usedPercentage}
        health={data.healthLevel}
      >
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Database',       v: data.databaseName },
            { l: 'Collections',    v: data.collections },
            { l: 'Documents',      v: (data.objects || 0).toLocaleString() },
            { l: 'Index Size',     v: `${data.indexSizeMB?.toFixed(1)} MB` },
            { l: 'Data Size',      v: `${data.dataSizeMB?.toFixed(1)} MB` },
            { l: 'Remaining',      v: `${data.remainingMB?.toFixed(1)} MB` },
          ].map(s => (
            <div key={s.l} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.l}</p>
              <p className="font-black text-slate-900 text-sm mt-0.5 truncate">{s.v}</p>
            </div>
          ))}
        </div>
      </GaugeCard>

      {/* Collection breakdown */}
      {topCols.length > 0 && (
        <Card className="p-5">
          <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <Layers size={15} className="text-emerald-600" /> Collection Breakdown
          </h4>
          <div className="space-y-2">
            {topCols.map(c => {
              const pct = data.storageSize > 0 ? (c.storageSize / data.storageSize) * 100 : 0
              return (
                <div key={c.name} className="flex items-center gap-3 group hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-all">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{c.name}</span>
                  <span className="text-[10px] text-slate-400">{c.documentCount.toLocaleString()} docs</span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 w-16 text-right">
                    {(c.storageSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── B2 Panel ─────────────────────────────────────────────────
function B2Panel({ data, loading, error, onRetry }) {
  if (loading) return <LoadingCards />
  if (error) return <ErrorCard title="B2 Storage Unavailable" message={error} onRetry={onRetry} />
  if (!data) return null

  const PIE_COLORS = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b']

  return (
    <div className="space-y-5">
      <GaugeCard
        title="Backblaze B2"
        icon={HardDrive}
        gradient="from-blue-500 to-indigo-600"
        used={`${data.totalSizeGB?.toFixed(2)} GB`}
        total={`${data.maxLimitGB} GB`}
        pct={data.usedPercentage}
        health={data.healthLevel}
      >
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Bucket',       v: data.bucketName },
            { l: 'Total Files',  v: (data.totalFiles || 0).toLocaleString() },
            { l: 'Used',         v: `${data.totalSizeMB?.toFixed(0)} MB` },
            { l: 'Remaining',    v: `${data.remainingGB?.toFixed(2)} GB` },
          ].map(s => (
            <div key={s.l} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.l}</p>
              <p className="font-black text-slate-900 text-sm mt-0.5 truncate">{s.v}</p>
            </div>
          ))}
        </div>
      </GaugeCard>

      {/* File type pie */}
      {data.fileTypes?.length > 0 && (
        <Card className="p-5">
          <h4 className="font-black text-slate-900 mb-4">File Type Distribution</h4>
          <div className="flex items-center gap-4">
            <div className="h-36 w-36 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.fileTypes} dataKey="sizeBytes" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3}>
                    {data.fileTypes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11 }}
                    formatter={(v, n, p) => [`${p.payload.sizeMB?.toFixed(1)} MB`, p.payload.type]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {data.fileTypes.map((f, i) => (
                <div key={f.type} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-xs font-semibold text-slate-700 flex-1">{f.type}</span>
                  <span className="text-[10px] text-slate-400">{f.count} files</span>
                  <span className="text-xs font-bold text-slate-600">{f.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Largest files */}
      {data.largestFiles?.length > 0 && (
        <Card className="p-5">
          <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={15} className="text-blue-500" /> Largest Files
          </h4>
          <div className="space-y-2">
            {data.largestFiles.slice(0, 7).map((f, i) => (
              <div key={f.fileId || i} className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-2 py-2 transition-all group">
                <span className="text-[11px] font-black text-slate-300 w-4">{i + 1}</span>
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <File size={12} className="text-blue-500" />
                </div>
                <span className="text-xs font-medium text-slate-700 flex-1 truncate">{f.name.split('/').pop()}</span>
                <span className="text-xs font-black text-slate-600 flex-shrink-0">{f.sizeMB?.toFixed(1)} MB</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent files */}
      {data.recentFiles?.length > 0 && (
        <Card className="p-5">
          <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={15} className="text-purple-500" /> Recent Uploads
          </h4>
          <div className="space-y-2">
            {data.recentFiles.slice(0, 5).map((f, i) => (
              <div key={f.fileId || i} className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-2 py-2 transition-all">
                <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <File size={12} className="text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{f.name.split('/').pop()}</p>
                  <p className="text-[10px] text-slate-400">{f.uploadedAt ? new Date(f.uploadedAt).toLocaleString('en-IN') : '—'}</p>
                </div>
                <span className="text-xs font-bold text-slate-500 flex-shrink-0">{f.sizeMB?.toFixed(1)} MB</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function StoragePage() {
  const [mongo, setMongo]       = useState(null)
  const [b2, setB2]             = useState(null)
  const [mongoErr, setMongoErr] = useState(null)
  const [b2Err, setB2Err]       = useState(null)
  const [mongoLoading, setMongoLoading] = useState(false)
  const [b2Loading, setB2Loading]       = useState(false)
  const [lastUpdated, setLastUpdated]   = useState(null)
  const [initialLoad, setInitialLoad]   = useState(true)

  const fetchMongo = useCallback(async () => {
    setMongoLoading(true)
    setMongoErr(null)
    try {
      const res = await api.get('/admin/system/mongodb-usage')
      setMongo(res.data.data)
    } catch (e) {
      setMongoErr(e.response?.data?.message || 'Failed to fetch MongoDB usage. Check server logs.')
    } finally {
      setMongoLoading(false)
    }
  }, [])

  const fetchB2 = useCallback(async () => {
    setB2Loading(true)
    setB2Err(null)
    try {
      const res = await api.get('/admin/system/b2-usage')
      setB2(res.data.data)
    } catch (e) {
      setB2Err(e.response?.data?.message || 'Failed to fetch B2 usage. Check B2 credentials in .env.')
    } finally {
      setB2Loading(false)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchMongo(), fetchB2()])
    setLastUpdated(new Date())
    setInitialLoad(false)
  }, [fetchMongo, fetchB2])

  // Load on mount
  useEffect(() => { fetchAll() }, [])

  const totalFiles = b2?.totalFiles ?? '—'
  const totalDocs  = mongo ? mongo.objects.toLocaleString() : '—'

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader
        title="Storage Intelligence"
        subtitle="Real-time MongoDB Atlas & Backblaze B2 usage — no dummy data"
        actions={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[11px] text-slate-400 hidden sm:block">
                Updated {lastUpdated.toLocaleTimeString('en-IN')}
              </span>
            )}
            <Btn variant="secondary" size="sm" onClick={fetchAll} disabled={mongoLoading || b2Loading}>
              <RefreshCw size={13} className={(mongoLoading || b2Loading) ? 'animate-spin' : ''} />
              Refresh
            </Btn>
          </div>
        }
      />

      {/* Summary Row */}
      {!initialLoad && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { l: 'MongoDB Used',    v: mongo ? `${mongo.storageSizeMB?.toFixed(1)} MB` : mongoErr ? 'Error' : '…', g: 'from-emerald-500 to-teal-600', i: Database },
            { l: 'MongoDB Free',    v: mongo ? `${mongo.remainingMB?.toFixed(1)} MB` : '—', g: 'from-teal-500 to-cyan-600', i: CheckCircle2 },
            { l: 'B2 Used',         v: b2 ? `${b2.totalSizeGB?.toFixed(2)} GB` : b2Err ? 'Error' : '…', g: 'from-blue-500 to-indigo-600', i: HardDrive },
            { l: 'B2 Free',         v: b2 ? `${b2.remainingGB?.toFixed(2)} GB` : '—', g: 'from-indigo-500 to-violet-600', i: Zap },
          ].map(s => (
            <Card key={s.l} className="p-4 hover:shadow-md transition-all">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.g} flex items-center justify-center shadow-md mb-3`}>
                <s.i size={16} className="text-white" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.l}</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{s.v}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Cleanup suggestions */}
      <Card className="p-5 border-amber-200 bg-amber-50">
        <h4 className="font-black text-amber-900 mb-3 flex items-center gap-2">
          <AlertTriangle size={16} /> Cleanup Suggestions
        </h4>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'Delete rejected uploads from B2 that were never approved',
            'Archive completed mock test data older than 6 months',
            'Remove duplicate PDFs — check for matching file sizes',
            'Compress large PDFs (>20 MB) using server-side processing',
            'Clear orphaned thumbnail cache from failed uploads',
            'Remove user accounts that have been blocked for 90+ days',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
              <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span> {tip}
            </li>
          ))}
        </ul>
      </Card>

      {/* Two-column layout: Mongo left, B2 right */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Database size={12} /> MongoDB Atlas
          </p>
          <MongoPanel data={mongo} loading={mongoLoading} error={mongoErr} onRetry={fetchMongo} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <HardDrive size={12} /> Backblaze B2
          </p>
          <B2Panel data={b2} loading={b2Loading} error={b2Err} onRetry={fetchB2} />
        </div>
      </div>

      {/* Note footer */}
      <p className="text-[11px] text-slate-400 text-center">
        All data is fetched live from your actual MongoDB and Backblaze B2 account. No mock values are used.
      </p>
    </div>
  )
}
