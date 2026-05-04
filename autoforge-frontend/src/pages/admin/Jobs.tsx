import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, ChevronRight, Download, Plus } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import StatusBadge from '@/components/shared/StatusBadge'
import { useToast } from '@/components/shared/Toast'
import { backendClient } from '@/api/client'
import * as XLSX from 'xlsx'

const tabs = ['All', 'Pending', 'In Progress', 'Done']

export default function Jobs() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All')

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await backendClient.get('/api/jobs')
      return res.data.data ?? res.data
    },
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
        <BackButton />
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
            <button onClick={() => navigate('/admin/ai-job')}
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
                      transition={{ delay: i * 0.04 }} onClick={() => navigate(`/admin/jobs/${job.id}`)}
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
    </AdminLayout>
  )
}
