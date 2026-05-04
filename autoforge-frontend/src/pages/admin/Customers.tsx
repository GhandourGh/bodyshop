import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Mail, Phone, Search, Plus, X, Loader2, Copy } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import { useToast } from '@/components/shared/Toast'
import { backendClient } from '@/api/client'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08 } }),
}

type CustomerForm = {
  name: string
  email: string
  phone: string
  password: string
}
const blankForm: CustomerForm = { name: '', email: '', phone: '', password: '' }

export default function Customers() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CustomerForm>(blankForm)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // Open the modal automatically when navigated to with ?new=1 (Dashboard quick action).
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowModal(true)
      searchParams.delete('new')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await backendClient.get('/api/customers')
      return res.data.data ?? res.data
    },
  })

  const createCustomer = useMutation({
    mutationFn: async (payload: CustomerForm) => {
      const res = await backendClient.post('/api/customers', {
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone.trim() || undefined,
        ...(payload.password ? { password: payload.password } : {}),
      })
      return res.data.data ?? res.data
    },
    onSuccess: (created: any) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      setForm(blankForm)
      if (created?.temporaryPassword) {
        setTempPassword(created.temporaryPassword)
        toast(`Customer added. A temporary password was generated.`, 'success')
      } else {
        setTempPassword(null)
        setShowModal(false)
        toast('Customer added successfully.', 'success')
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to add customer'
      const fields = err?.response?.data?.errors
      const detail = fields ? ` (${Object.keys(fields).join(', ')})` : ''
      toast(`${msg}${detail}`, 'error')
    },
  })

  const closeModal = () => {
    if (createCustomer.isPending) return
    setShowModal(false)
    setForm(blankForm)
    setTempPassword(null)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast('Name and email are required.', 'error')
      return
    }
    if (form.password && form.password.length < 8) {
      toast('Password must be at least 8 characters.', 'error')
      return
    }
    createCustomer.mutate(form)
  }

  const filtered = customers.filter((c: any) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  const copyTempPassword = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      toast('Temporary password copied.', 'success')
    } catch {
      toast('Could not copy — select and copy manually.', 'info')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Relations</p>
            <h1 className="font-display font-bold text-3xl">Customers</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-muted" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="pl-9 pr-4 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent w-56"
              />
            </div>
            <button
              onClick={() => { setTempPassword(null); setShowModal(true) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-forge-orange hover:bg-forge-orange-light text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus size={15} /> New Customer
            </button>
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

      {/* New Customer Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-forge-card border border-forge-border rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-forge-border/40">
                <h2 className="font-display font-bold text-lg">New Customer</h2>
                <button
                  onClick={closeModal}
                  disabled={createCustomer.isPending}
                  className="w-7 h-7 rounded-lg glass flex items-center justify-center text-forge-muted hover:text-forge-text disabled:opacity-40"
                >
                  <X size={14} />
                </button>
              </div>

              {tempPassword ? (
                <div className="p-6 space-y-4">
                  <p className="text-sm text-forge-text">
                    Customer created. Share this temporary password with them — they can change it after their first sign-in.
                  </p>
                  <div className="glass border border-forge-border rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-forge-orange break-all">{tempPassword}</code>
                    <button
                      onClick={copyTempPassword}
                      className="flex items-center gap-1.5 text-xs text-forge-muted hover:text-forge-text px-2 py-1 rounded-lg glass border border-forge-border"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-full py-2.5 bg-forge-blue hover:bg-forge-blue/90 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-forge-orange">*</span>
                    </label>
                    <input
                      autoFocus
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Rami Haddad"
                      className="w-full px-3 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">
                      Email <span className="text-forge-orange">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="rami@example.com"
                      className="w-full px-3 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">
                      Phone
                    </label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+961 70 123 456"
                      className="w-full px-3 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">
                      Password <span className="text-forge-muted/60 normal-case font-sans tracking-normal">(optional — auto-generated if blank)</span>
                    </label>
                    <input
                      type="text"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Leave empty to auto-generate"
                      className="w-full px-3 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={createCustomer.isPending}
                      className="flex-1 py-2.5 glass border border-forge-border text-sm font-medium rounded-xl transition-all disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createCustomer.isPending}
                      className="flex-1 py-2.5 bg-forge-orange hover:bg-forge-orange-light text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {createCustomer.isPending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Creating…
                        </>
                      ) : (
                        <>Create Customer</>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
