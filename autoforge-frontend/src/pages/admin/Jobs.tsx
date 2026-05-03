import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Briefcase, Car, User, Wrench, DollarSign, Clock, Bot, ChevronRight, CheckCircle, PenLine, Download, Plus } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import StatusBadge from '@/components/shared/StatusBadge'
import { useToast } from '@/components/shared/Toast'
import { backendClient } from '@/api/client'
import * as XLSX from 'xlsx'

const tabs = ['All', 'Pending', 'In Progress', 'Done']
const VEHICLE_TYPES = ['sedan', 'suv', 'truck', 'hatchback', 'luxury', 'van']
const DAMAGE_TYPES  = ['dent', 'scratch', 'crack', 'paint', 'multiple']

type JobForm = {
  vehicle: string; vehicleType: string; customer: string
  damageType: string; mechanic: string; estimatedCost: string; estimatedHours: string
}
const blankForm: JobForm = { vehicle: '', vehicleType: 'sedan', customer: '', damageType: 'dent', mechanic: '', estimatedCost: '', estimatedHours: '' }

export default function Jobs() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('All')
  const [selected, setSelected]   = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState<JobForm>(blankForm)

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await backendClient.get('/api/jobs')
      return res.data.data ?? res.data
    },
  })

  const completeMutation = useMutation({
    mutationFn: async (id: string) => backendClient.put(`/api/jobs/${id}`, { status: 'done' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); toast('Job marked as complete.', 'success'); setSelected(null) },
    onError: () => toast('Failed to update job.', 'error'),
  })

  const filtered = jobs.filter((j: any) => {
    if (activeTab === 'All') return true
    return j.status.replace('_', ' ').toLowerCase() === activeTab.toLowerCase()
  })

  function exportToExcel() {
    const rows = filtered.map((j: any) => ({
      'ID': j.id, 'Vehicle': j.vehicle, 'Customer': j.customer,
      'Status': j.status, 'Cost ($)': j.estimatedCost,
      'Date': new Date(j.created).toLocaleDateString(),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Jobs')
    XLSX.writeFile(wb, 'autoforge-jobs.xlsx')
    toast('Jobs exported to Excel.', 'success')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Management</p>
            <h1 className="font-display font-bold text-3xl">Repair Jobs</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2.5 glass border border-forge-border hover:border-forge-blue/40 text-sm font-medium rounded-xl transition-all">
              <Download size={14} className="text-forge-blue" /> Export
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-forge-orange hover:bg-forge-orange-light text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus size={15} /> New Job
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 glass rounded-xl w-fit">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-forge-blue text-white' : 'text-forge-muted hover:text-forge-text'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse bg-forge-border/20 rounded-lg" />
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-forge-border/40">
                  {['Vehicle', 'Customer', 'Status', 'Cost', 'Date', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-mono text-forge-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((job: any, i: number) => (
                    <motion.tr key={job.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04 }} onClick={() => setSelected(job)}
                      className="border-b border-forge-border/20 hover:bg-white/2 transition-colors cursor-pointer group">
                      <td className="px-5 py-4 text-sm font-semibold text-forge-text">{job.vehicle}</td>
                      <td className="px-5 py-4 text-sm text-forge-muted">{job.customer}</td>
                      <td className="px-5 py-4"><StatusBadge status={job.status} /></td>
                      <td className="px-5 py-4 text-sm font-mono text-forge-text">${Number(job.estimatedCost || 0).toLocaleString()}</td>
                      <td className="px-5 py-4 text-xs font-mono text-forge-muted">{new Date(job.created).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <ChevronRight size={14} className="text-forge-muted group-hover:text-forge-blue transition-colors" />
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16 text-forge-muted">
              <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No jobs in this category</p>
            </div>
          )}
        </div>
      </div>

      {/* Job Detail Panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 h-full w-[480px] bg-forge-card border-l border-forge-border z-50 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <StatusBadge status={selected.status} />
                    <h2 className="font-display font-bold text-2xl mt-2">{selected.vehicle}</h2>
                  </div>
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-forge-muted hover:text-forge-text transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: User,       label: 'Customer',  value: selected.customer },
                    { icon: DollarSign, label: 'Est. Cost', value: `$${Number(selected.estimatedCost || 0).toLocaleString()}` },
                    { icon: Car,        label: 'Vehicle',   value: selected.vehicle },
                    { icon: Clock,      label: 'Created',   value: new Date(selected.created).toLocaleDateString() },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={13} className="text-forge-muted" />
                        <span className="text-xs font-mono text-forge-muted uppercase">{label}</span>
                      </div>
                      <p className="text-sm font-semibold text-forge-text">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => toast(`Edit functionality coming soon.`, 'info')}
                    className="flex-1 py-3 glass border border-forge-border hover:border-forge-blue text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2">
                    <PenLine size={14} /> Edit Job
                  </button>
                  <button
                    onClick={() => completeMutation.mutate(selected.id)}
                    disabled={selected.status === 'done' || completeMutation.isPending}
                    className="flex-1 py-3 bg-forge-orange hover:bg-forge-orange-light disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={14} /> Mark Complete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Job Modal — local-only (creating a real job requires customer/vehicle IDs) */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className="bg-forge-card border border-forge-border rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-forge-border/40">
                  <h2 className="font-display font-bold text-lg">New Repair Job</h2>
                  <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-lg glass flex items-center justify-center text-forge-muted hover:text-forge-text">
                    <X size={14} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">Vehicle *</label>
                      <input value={form.vehicle} onChange={e => setForm(p => ({ ...p, vehicle: e.target.value }))}
                        placeholder="e.g. 2023 Toyota Camry"
                        className="w-full px-3 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">Vehicle Type</label>
                      <select value={form.vehicleType} onChange={e => setForm(p => ({ ...p, vehicleType: e.target.value }))}
                        className="w-full px-3 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text focus:outline-none focus:border-forge-blue/50 bg-forge-card">
                        {VEHICLE_TYPES.map(t => <option key={t} value={t} className="bg-forge-card capitalize">{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">Damage Type</label>
                      <select value={form.damageType} onChange={e => setForm(p => ({ ...p, damageType: e.target.value }))}
                        className="w-full px-3 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text focus:outline-none focus:border-forge-blue/50 bg-forge-card">
                        {DAMAGE_TYPES.map(t => <option key={t} value={t} className="bg-forge-card capitalize">{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">Customer Name *</label>
                      <input value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))}
                        placeholder="e.g. Rami Haddad"
                        className="w-full px-3 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">Est. Cost ($) *</label>
                      <input type="number" value={form.estimatedCost} onChange={e => setForm(p => ({ ...p, estimatedCost: e.target.value }))}
                        placeholder="1200"
                        className="w-full px-3 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">Est. Hours *</label>
                      <input type="number" value={form.estimatedHours} onChange={e => setForm(p => ({ ...p, estimatedHours: e.target.value }))}
                        placeholder="8"
                        className="w-full px-3 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent" />
                    </div>
                  </div>
                  <p className="text-xs text-forge-muted">
                    <Bot size={11} className="inline mr-1" />
                    Full job creation with customer/vehicle linking is available via the API.
                  </p>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 glass border border-forge-border text-sm font-medium rounded-xl transition-all">Cancel</button>
                  <button
                    onClick={() => { toast('Job creation via full API coming soon. Use the backend API directly.', 'info'); setShowModal(false) }}
                    className="flex-1 py-2.5 bg-forge-orange hover:bg-forge-orange-light text-white text-sm font-semibold rounded-xl transition-colors">
                    Create Job
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
