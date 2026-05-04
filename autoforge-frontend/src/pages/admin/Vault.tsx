import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Trash2, Eye, Loader2, RefreshCw } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import { useToast } from '@/components/shared/Toast'
import { backendClient } from '@/api/client'

type CredRow = {
  id: string
  name: string
  service_slug: string
  username_plain: string | null
  has_secret: boolean
  notes: string | null
  created_at: string | null
}

type LogRow = {
  id: string
  integration_key: string
  status: string
  message: string | null
  duration_ms: number | null
  meta: unknown
  created_at: string | null
}

export default function Vault() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [serviceSlug, setServiceSlug] = useState('groq')
  const [username, setUsername] = useState('')
  const [secret, setSecret] = useState('')
  const [notes, setNotes] = useState('')
  const [revealed, setRevealed] = useState<string | null>(null)

  const { data: creds = [], isLoading: loadCreds } = useQuery({
    queryKey: ['vault-credentials'],
    queryFn: async () => {
      const res = await backendClient.get('/api/admin/credentials')
      const root = res.data
      if (root?.success === false) throw new Error(root.message)
      const d = root?.data ?? res.data
      return Array.isArray(d) ? d : []
    },
  })

  const { data: logs = [], isLoading: loadLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['integration-logs'],
    queryFn: async () => {
      const res = await backendClient.get('/api/admin/integration-logs?limit=80')
      const root = res.data
      if (root?.success === false) throw new Error(root.message)
      const d = root?.data ?? res.data
      return Array.isArray(d) ? d : []
    },
  })

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await backendClient.post('/api/admin/credentials', {
        name: name.trim(),
        service_slug: serviceSlug.trim(),
        username_plain: username.trim() || null,
        secret,
        notes: notes.trim() || null,
      })
      const root = res.data
      if (root?.success === false) throw new Error(root.message)
      return root?.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault-credentials'] })
      setName('')
      setSecret('')
      setNotes('')
      toast('Credential saved (secret encrypted at rest).', 'success')
    },
    onError: (e: unknown) => {
      toast(e instanceof Error ? e.message : 'Save failed', 'error')
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => backendClient.delete(`/api/admin/credentials/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault-credentials'] })
      toast('Removed.', 'success')
    },
    onError: () => toast('Delete failed', 'error'),
  })

  const revealMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await backendClient.post(`/api/admin/credentials/${id}/reveal`, { confirm: true })
      const root = res.data
      if (root?.success === false) throw new Error(root.message)
      return (root?.data as { secret?: string })?.secret ?? ''
    },
    onSuccess: (secret) => {
      setRevealed(secret)
      toast('Secret loaded — copy and close.', 'success')
    },
    onError: () => toast('Reveal failed', 'error'),
  })

  return (
    <AdminLayout>
      <div className="space-y-10 max-w-6xl">
        <BackButton />
        <div>
          <div className="flex items-center gap-3 mb-2">
            <KeyRound className="text-forge-orange" size={28} />
            <div>
              <p className="text-forge-muted text-sm font-mono uppercase tracking-widest">Phase 6</p>
              <h1 className="font-display font-bold text-3xl">Credential vault & integration logs</h1>
            </div>
          </div>
          <p className="text-forge-muted text-sm max-w-3xl leading-relaxed">
            Store third-party secrets encrypted (AES-256-GCM; key from <code className="text-forge-blue-light">CREDENTIALS_MASTER_KEY</code> or derived from <code className="text-forge-blue-light">JWT_SECRET</code>).
            Integration logs record outbound AI calls (e.g. portal estimate). This page is <strong>admin-only</strong> (credentials and logs).
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-forge-border p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Add credential</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
            <div>
              <label className="block text-xs font-mono text-forge-muted uppercase mb-1">Label</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Production Groq"
                className="w-full rounded-xl border border-forge-border bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-mono text-forge-muted uppercase mb-1">Service slug</label>
              <input value={serviceSlug} onChange={e => setServiceSlug(e.target.value)} placeholder="groq, smtp, neon…"
                className="w-full rounded-xl border border-forge-border bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-mono text-forge-muted uppercase mb-1">Username / key id (optional)</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="w-full rounded-xl border border-forge-border bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-mono text-forge-muted uppercase mb-1">Secret</label>
              <input type="password" value={secret} onChange={e => setSecret(e.target.value)} autoComplete="new-password"
                className="w-full rounded-xl border border-forge-border bg-transparent px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-forge-muted uppercase mb-1">Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full rounded-xl border border-forge-border bg-transparent px-3 py-2 text-sm" />
            </div>
          </div>
          <button
            type="button"
            disabled={createMut.isPending || !name.trim() || !serviceSlug.trim() || !secret}
            onClick={() => createMut.mutate()}
            className="mt-4 px-5 py-2.5 rounded-xl bg-forge-orange hover:bg-forge-orange-light disabled:opacity-50 text-white text-sm font-semibold"
          >
            {createMut.isPending ? <Loader2 className="animate-spin inline" size={16} /> : null} Save encrypted
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl border border-forge-border overflow-hidden">
            <div className="px-5 py-3 border-b border-forge-border/40 font-display font-semibold">Stored credentials</div>
            {loadCreds ? (
              <div className="p-6 text-forge-muted text-sm flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading…</div>
            ) : (creds as CredRow[]).length === 0 ? (
              <p className="p-6 text-forge-muted text-sm">No rows yet.</p>
            ) : (
              <ul className="divide-y divide-forge-border/30">
                {(creds as CredRow[]).map(c => (
                  <li key={c.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-forge-text">{c.name}</p>
                      <p className="text-xs text-forge-muted font-mono">{c.service_slug}{c.username_plain ? ` · ${c.username_plain}` : ''}</p>
                      {c.notes && <p className="text-xs text-forge-muted mt-1">{c.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      {c.has_secret && (
                        <button type="button" onClick={() => { setRevealed(null); revealMut.mutate(c.id) }}
                          className="p-2 rounded-lg glass border border-forge-border text-forge-muted hover:text-forge-text" title="Reveal secret">
                          <Eye size={16} />
                        </button>
                      )}
                      <button type="button" onClick={() => { if (confirm('Delete this credential?')) deleteMut.mutate(c.id) }}
                        className="p-2 rounded-lg glass border border-red-500/30 text-red-400 hover:bg-red-500/10" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>

          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl border border-forge-border overflow-hidden">
            <div className="px-5 py-3 border-b border-forge-border/40 flex items-center justify-between">
              <span className="font-display font-semibold">Integration logs</span>
              <button type="button" onClick={() => refetchLogs()} className="text-forge-muted hover:text-forge-text p-1" title="Refresh">
                <RefreshCw size={16} />
              </button>
            </div>
            {loadLogs ? (
              <div className="p-6 text-forge-muted text-sm flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading…</div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-forge-card/95 border-b border-forge-border/40">
                    <tr className="text-left text-forge-muted font-mono uppercase">
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Key</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">ms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(logs as LogRow[]).map(l => (
                      <tr key={l.id} className="border-b border-forge-border/15 hover:bg-white/3">
                        <td className="px-3 py-2 text-forge-muted whitespace-nowrap">{l.created_at ? new Date(l.created_at).toLocaleString() : '—'}</td>
                        <td className="px-3 py-2 font-mono text-forge-blue-light">{l.integration_key}</td>
                        <td className="px-3 py-2">{l.status}</td>
                        <td className="px-3 py-2">{l.duration_ms ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(logs as LogRow[]).length === 0 && (
                  <p className="p-6 text-forge-muted text-sm">No logs yet. Run a portal quote (with working AI) to populate.</p>
                )}
              </div>
            )}
          </motion.section>
        </div>

        {revealed != null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setRevealed(null)}>
            <div className="bg-forge-card border border-forge-border rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <p className="text-sm text-forge-muted mb-2">Secret (copy now)</p>
              <pre className="text-xs break-all p-3 rounded-lg bg-black/40 border border-forge-border text-forge-text">{revealed}</pre>
              <button type="button" className="mt-4 w-full py-2 rounded-xl bg-forge-border/50 text-sm" onClick={() => setRevealed(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
