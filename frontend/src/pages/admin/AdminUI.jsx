import { TrendingUp, TrendingDown } from 'lucide-react'

// ── Stat Card ────────────────────────────────────────────────
export const StatCard = ({ label, value, icon: Icon, gradient, trend, subtitle, pct }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 group relative overflow-hidden">
    <div className="absolute -right-3 -bottom-3 opacity-[0.06] group-hover:scale-110 transition-transform duration-500">
      <Icon size={100} className="text-slate-900" />
    </div>
    <div className="relative">
      <div className="flex items-start justify-between mb-5">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
            {trend.startsWith('+') ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-slate-900">{value ?? '—'}</span>
        {subtitle && <span className="text-[10px] text-slate-400 font-semibold uppercase">{subtitle}</span>}
      </div>
      {pct !== undefined && (
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  </div>
)

// ── Card wrapper ─────────────────────────────────────────────
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>{children}</div>
)

// ── Badge ────────────────────────────────────────────────────
export const Badge = ({ variant = 'default', children, dot }) => {
  const v = {
    pending:   'bg-amber-50 text-amber-600 border border-amber-200',
    approved:  'bg-emerald-50 text-emerald-600 border border-emerald-200',
    rejected:  'bg-rose-50 text-rose-600 border border-rose-200',
    active:    'bg-blue-50 text-blue-600 border border-blue-200',
    blocked:   'bg-slate-100 text-slate-500 border border-slate-200',
    draft:     'bg-slate-100 text-slate-500 border border-slate-200',
    scheduled: 'bg-violet-50 text-violet-600 border border-violet-200',
    published: 'bg-emerald-500 text-white border border-emerald-600',
    critical:  'bg-rose-500 text-white border border-rose-600',
    warning:   'bg-amber-500 text-white border border-amber-600',
    info:      'bg-blue-500 text-white border border-blue-600',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${v[variant] || v.draft}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-current'}`} />}
      {children}
    </span>
  )
}

// ── Section Header ────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, actions }) => (
  <div className="flex items-end justify-between mb-8">
    <div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
)

// ── Btn ───────────────────────────────────────────────────────
export const Btn = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02]',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-rose-600 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-700 hover:scale-[1.02]',
    success: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700',
  }
  const sizes = { sm: 'px-4 py-2 text-[11px]', md: 'px-5 py-2.5 text-xs', lg: 'px-7 py-3.5 text-xs' }
  return (
    <button className={`inline-flex items-center gap-2 font-bold rounded-xl transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────
export const Input = ({ label, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{label}</label>}
    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" {...props} />
  </div>
)

// ── Select ────────────────────────────────────────────────────
export const Select = ({ label, children, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{label}</label>}
    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 transition-all appearance-none" {...props}>
      {children}
    </select>
  </div>
)

// ── Modal ─────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, subtitle, children, footer, wide }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'} border border-slate-100 animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex items-center justify-between p-7 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 font-semibold mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all text-xl leading-none font-black">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-7">{children}</div>
        {footer && <div className="p-7 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, desc, action }) => (
  <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5 text-slate-300">
      <Icon size={28} />
    </div>
    <h3 className="text-base font-bold text-slate-700 mb-2">{title}</h3>
    <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">{desc}</p>
    {action}
  </div>
)

// ── Tooltip-style info chip ────────────────────────────────────
export const InfoChip = ({ label, value, color = 'blue' }) => {
  const c = { blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-rose-50 text-rose-700', amber: 'bg-amber-50 text-amber-700', purple: 'bg-purple-50 text-purple-700' }
  return (
    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${c[color]}`}>
      <span className="opacity-60">{label}: </span>{value}
    </div>
  )
}
