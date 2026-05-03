import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Users, Mail, Phone, Search } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import { backendClient } from '@/api/client'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08 } }),
}

export default function Customers() {
  const [search, setSearch] = useState('')

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await backendClient.get('/api/customers')
      return res.data.data ?? res.data
    },
  })

  const filtered = customers.filter((c: any) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Relations</p>
            <h1 className="font-display font-bold text-3xl">Customers</h1>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-muted" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="pl-9 pr-4 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent w-56"
            />
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse bg-forge-border/20 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-forge-muted">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search ? 'No customers match your search.' : 'No customers yet.'}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-forge-border/30">
                  {['Name', 'Contact', 'Phone', 'Joined'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-mono text-forge-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any, i: number) => (
                  <motion.tr key={c.id} initial="hidden" animate="visible" variants={fadeUp} custom={i}
                    className="border-b border-forge-border/20 hover:bg-white/2 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-forge-blue/20 border border-forge-blue/30 flex items-center justify-center text-xs font-bold text-forge-blue">
                          {(c.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-forge-text">{c.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-forge-muted">
                        <Mail size={11} />
                        <span>{c.email || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-forge-muted">
                        <Phone size={11} />
                        <span>{c.phone || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-forge-muted">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && (
          <p className="text-xs text-forge-muted font-mono text-right">
            Showing {filtered.length} of {customers.length} customers
          </p>
        )}
      </div>
    </AdminLayout>
  )
}
