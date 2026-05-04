import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Shield, User, Bot, Briefcase, Package, Wrench, Search, RefreshCw } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import { backendClient } from '@/api/client'

type AuditEntry = {
  id: string
  timestamp: string
  actor: string
  actorRole: string | null
  action: string
  entity: string
  entityId: string | null
}

const categoryOf = (action: string, entity: string): 'ai' | 'job' | 'user' | 'inventory' | 'mechanic' => {
  const a = (action || '').toLowerCase()
  const e = (entity || '').toLowerCase()
  if (a.includes('predict') || a.includes('detect') || a.includes('assign') || a.includes('forecast') || a.includes('message') || a.includes('sentiment')) return 'ai'
  if (e.includes('job') || a.includes('status') || a.includes('complete')) return 'job'
  if (e.includes('mechanic')) return 'mechanic'
  if (e.includes('part') || e.includes('inventory')) return 'inventory'
  return 'user'
}

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

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await backendClient.get('/api/admin/audit-logs?limit=200')
      return res.data.data as AuditEntry[]
    },
    refetchInterval: 30_000,
  })

  const enriched = logs.map(e => ({
    ...e,
    category: categoryOf(e.action, e.entity),
    timestamp: e.timestamp ? new Date(e.timestamp).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'medium' }) : '—',
  }))

  const filtered = enriched.filter(e => {
    const matchCat = filter === 'All' || e.category === filter.toLowerCase()
    const matchSearch = !search || [e.actor, e.action, e.entity].some(f => f?.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  const counts = Object.fromEntries(
    Object.keys(categoryConfig).map(k => [k, enriched.filter(e => e.category === k).length])
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Security</p>
            <h1 className="font-display font-bold text-3xl">Audit Log</h1>
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 glass border border-forge-border hover:border-forge-blue/40 text-sm font-medium rounded-xl transition-all">
            <RefreshCw size={14} className="text-forge-blue" /> Refresh
          </button>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(categoryConfig).map(([key, cfg]) => {
            const Ico = cfg.icon
            return (
              <div key={key} className="glass rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.color + '18' }}>
                  <Ico size={13} style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="text-xs font-mono text-forge-muted">{cfg.label}</p>
                  <p className="text-sm font-bold text-forge-text">{isLoading ? '…' : counts[key]} events</p>
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
          {isLoading
            ? <div className="p-6 space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 animate-pulse bg-forge-border/20 rounded-lg" />)}</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-forge-border/40">
                      {['Timestamp', 'Actor', 'Action', 'Entity', 'Category'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-mono text-forge-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry, i) => {
                      const cfg = categoryConfig[entry.category]
                      const Ico = cfg.icon
                      return (
                        <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-forge-border/20 hover:bg-white/2 transition-colors">
                          <td className="px-5 py-3.5 text-xs font-mono text-forge-muted whitespace-nowrap">{entry.timestamp}</td>
                          <td className="px-5 py-3.5 text-sm text-forge-text font-medium whitespace-nowrap">
                            {entry.actor}
                            {entry.actorRole && <span className="ml-1.5 text-xs font-mono text-forge-muted opacity-60">({entry.actorRole})</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-forge-border/50 text-forge-text">{entry.action}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm font-mono text-forge-blue-light whitespace-nowrap">{entry.entity}</td>
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
                        <td colSpan={5} className="text-center py-14 text-forge-muted">
                          <Shield size={28} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">{logs.length === 0 ? 'No audit events yet. Events are recorded when jobs are created or updated.' : 'No matching log entries'}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          }
          <div className="px-5 py-3 border-t border-forge-border/30 text-xs font-mono text-forge-muted">
            Showing {filtered.length} of {logs.length} events · auto-refreshes every 30s
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  )
}
