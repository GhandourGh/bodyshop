import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, User, Bot, Briefcase, Package, Wrench, Search } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'

type AuditEntry = {
  id: string
  timestamp: string
  actor: string
  action: string
  entity: string
  detail: string
  category: 'ai' | 'job' | 'user' | 'inventory' | 'mechanic'
}

const mockAuditLog: AuditEntry[] = [
  { id: 'a1',  timestamp: '2026-05-02 14:32:11', actor: 'System (AI)',    action: 'PREDICT',  entity: 'Job j7',       detail: 'Cost predicted: $4,200 | Time: 18h | Confidence 91%',        category: 'ai' },
  { id: 'a2',  timestamp: '2026-05-02 14:30:05', actor: 'Fadi Karam',    action: 'UPDATE',   entity: 'Job j1',       detail: 'Status changed: pending → in_progress',                       category: 'job' },
  { id: 'a3',  timestamp: '2026-05-02 13:58:44', actor: 'System (AI)',    action: 'DETECT',   entity: 'Vehicle v4',   detail: 'YOLOv8 damage scan: 3 detections, severity 0.95',             category: 'ai' },
  { id: 'a4',  timestamp: '2026-05-02 13:45:00', actor: 'Admin',          action: 'CREATE',   entity: 'Customer c6',  detail: 'New customer registered: Nadia Frem',                         category: 'user' },
  { id: 'a5',  timestamp: '2026-05-02 12:22:33', actor: 'System (AI)',    action: 'ASSIGN',   entity: 'Job j4',       detail: 'Mechanic ranked: Lara Haddad (score 0.84)',                   category: 'ai' },
  { id: 'a6',  timestamp: '2026-05-02 11:15:09', actor: 'Samir Khoury',  action: 'UPDATE',   entity: 'Job j5',       detail: 'Status changed: pending → in_progress',                       category: 'job' },
  { id: 'a7',  timestamp: '2026-05-02 10:48:22', actor: 'System (AI)',    action: 'FORECAST', entity: 'Inventory',    detail: 'Bumpers forecast 30d: 24 units | Low-stock alert triggered',  category: 'inventory' },
  { id: 'a8',  timestamp: '2026-05-02 10:31:00', actor: 'Admin',          action: 'RESTOCK',  entity: 'Part p3',      detail: 'Door Panel stock updated +10 → 22 units',                    category: 'inventory' },
  { id: 'a9',  timestamp: '2026-05-01 17:04:55', actor: 'System (AI)',    action: 'MESSAGE',  entity: 'Job j3',       detail: 'Groq LLaMA completion message generated for Rami Haddad',   category: 'ai' },
  { id: 'a10', timestamp: '2026-05-01 16:30:18', actor: 'Mike Wrench',    action: 'COMPLETE', entity: 'Job j3',       detail: 'Job marked complete — Mercedes C-Class repair done',          category: 'job' },
  { id: 'a11', timestamp: '2026-05-01 15:20:00', actor: 'System (AI)',    action: 'SENTIMENT',entity: 'Review #41',   detail: 'Sentiment: positive | Confidence: 0.94',                      category: 'ai' },
  { id: 'a12', timestamp: '2026-05-01 14:10:44', actor: 'Admin',          action: 'CREATE',   entity: 'Mechanic m4',  detail: 'New mechanic added: Lara Haddad — Electrical Systems',        category: 'mechanic' },
  { id: 'a13', timestamp: '2026-05-01 11:05:30', actor: 'System (AI)',    action: 'PREDICT',  entity: 'Job j6',       detail: 'Cost predicted: $1,890 | Time: 8h | Confidence 88%',          category: 'ai' },
  { id: 'a14', timestamp: '2026-04-30 16:55:12', actor: 'Fadi Karam',    action: 'COMPLETE', entity: 'Job j6',       detail: 'Job marked complete — Audi A6 dent repair done',              category: 'job' },
  { id: 'a15', timestamp: '2026-04-30 09:18:07', actor: 'System (AI)',    action: 'FORECAST', entity: 'Inventory',    detail: 'Mirrors forecast 30d: 8 units | Low-stock alert triggered',   category: 'inventory' },
]

const categoryConfig = {
  ai:        { label: 'AI',        color: '#a855f7', icon: Bot },
  job:       { label: 'Job',       color: '#3b82f6', icon: Briefcase },
  user:      { label: 'User',      color: '#4ade80', icon: User },
  inventory: { label: 'Inventory', color: '#f97316', icon: Package },
  mechanic:  { label: 'Mechanic',  color: '#60a5fa', icon: Wrench },
}

const categories = ['All', 'AI', 'Job', 'User', 'Inventory', 'Mechanic']

export default function AuditLog() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = mockAuditLog.filter(e => {
    const matchCat = filter === 'All' || e.category === filter.toLowerCase()
    const matchSearch = !search || [e.actor, e.action, e.entity, e.detail].some(f => f.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Security</p>
          <h1 className="font-display font-bold text-3xl">Audit Log</h1>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(categoryConfig).map(([key, cfg]) => {
            const count = mockAuditLog.filter(e => e.category === key).length
            const Ico = cfg.icon
            return (
              <div key={key} className="glass rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.color + '18' }}>
                  <Ico size={13} style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="text-xs font-mono text-forge-muted">{cfg.label}</p>
                  <p className="text-sm font-bold text-forge-text">{count} events</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 p-1 glass rounded-xl w-fit">
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === c ? 'bg-forge-blue text-white' : 'text-forge-muted hover:text-forge-text'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="pl-9 pr-4 py-2 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/50 focus:outline-none focus:border-forge-blue/50 w-64 bg-transparent" />
          </div>
        </div>

        {/* Log table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forge-border/40">
                  {['Timestamp', 'Actor', 'Action', 'Entity', 'Detail', 'Category'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-mono text-forge-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => {
                  const cfg = categoryConfig[entry.category]
                  const Ico = cfg.icon
                  return (
                    <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-forge-border/20 hover:bg-white/2 transition-colors group">
                      <td className="px-5 py-3.5 text-xs font-mono text-forge-muted whitespace-nowrap">{entry.timestamp}</td>
                      <td className="px-5 py-3.5 text-sm text-forge-text font-medium whitespace-nowrap">{entry.actor}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-forge-border/50 text-forge-text">{entry.action}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-mono text-forge-blue-light whitespace-nowrap">{entry.entity}</td>
                      <td className="px-5 py-3.5 text-xs text-forge-muted max-w-xs truncate">{entry.detail}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-full"
                          style={{ color: cfg.color, background: cfg.color + '15', border: `1px solid ${cfg.color}25` }}>
                          <Ico size={10} /> {cfg.label}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-14 text-forge-muted">
                      <Shield size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No matching log entries</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-forge-border/30 text-xs font-mono text-forge-muted">
            Showing {filtered.length} of {mockAuditLog.length} events
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  )
}
