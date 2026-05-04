import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Briefcase, User, Car, DollarSign, Clock, Wrench, CheckCircle, FileDown } from 'lucide-react'
import { downloadJobSummaryPdf } from '@/lib/pdf/jobSummaryPdf'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import StatusBadge from '@/components/shared/StatusBadge'
import { useToast } from '@/components/shared/Toast'
import { backendClient } from '@/api/client'

type JobDetail = {
  id: string
  status: string | null
  estimatedCost: number | null
  estimatedTime: number | null
  createdAt: string | null
  mechanicName: string | null
  customer: { name: string; email: string | null; phone: string | null }
  vehicle: { label?: string; make?: string | null; model?: string | null; year?: number | null; vin?: string | null } | null
  vehicleLabel: string
  damageReports: { id: string; imageUrl: string | null; severity: number | null; notes: string | null; createdAt: string | null }[]
}

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await backendClient.get(`/api/jobs/${jobId}`)
      const root = res.data
      if (root?.success === false) throw new Error(root.message || 'Failed')
      return (root?.data ?? root) as JobDetail
    },
    enabled: Boolean(jobId),
  })

  const completeMutation = useMutation({
    mutationFn: async () => backendClient.put(`/api/jobs/${jobId}`, { status: 'done' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job', jobId] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      toast('Job marked as complete.', 'success')
    },
    onError: () => toast('Failed to update job.', 'error'),
  })

  const errMsg = error instanceof Error ? error.message : null

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <BackButton />

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-forge-border/20 rounded-xl" />
            ))}
          </div>
        )}

        {errMsg && !isLoading && (
          <p className="text-red-400 text-sm">{errMsg}</p>
        )}

        {!isLoading && job && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="text-forge-blue-light" size={22} />
                  <StatusBadge status={job.status ?? 'pending'} />
                </div>
                <h1 className="font-display font-bold text-3xl">{job.vehicleLabel}</h1>
                <p className="text-forge-muted text-sm font-mono mt-1">Job ID · {job.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      downloadJobSummaryPdf(job)
                      toast('PDF downloaded.', 'success')
                    } catch {
                      toast('Could not create PDF.', 'error')
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 glass border border-forge-border hover:border-forge-blue/40 text-sm font-medium rounded-xl transition-colors"
                >
                  <FileDown size={16} /> PDF
                </button>
                <button
                  type="button"
                  onClick={() => completeMutation.mutate()}
                  disabled={(job.status ?? '') === 'done' || completeMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-forge-orange hover:bg-forge-orange-light disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <CheckCircle size={16} /> Mark complete
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: User, label: 'Customer', value: job.customer?.name || '—' },
                { icon: DollarSign, label: 'Est. cost', value: job.estimatedCost != null ? `$${Number(job.estimatedCost).toLocaleString()}` : '—' },
                { icon: Clock, label: 'Est. hours', value: job.estimatedTime != null ? String(job.estimatedTime) : '—' },
                { icon: Clock, label: 'Created', value: job.createdAt ? new Date(job.createdAt).toLocaleString() : '—' },
                { icon: Wrench, label: 'Mechanic', value: job.mechanicName || 'Unassigned' },
                { icon: Car, label: 'VIN', value: job.vehicle?.vin || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="glass rounded-xl p-4 border border-forge-border/40">
                  <div className="flex items-center gap-2 text-xs font-mono text-forge-muted uppercase mb-1">
                    <Icon size={13} /> {label}
                  </div>
                  <p className="text-sm font-semibold text-forge-text">{value}</p>
                </div>
              ))}
            </div>

            {(job.customer?.email || job.customer?.phone) && (
              <div className="glass rounded-xl p-4 border border-forge-border/40 text-sm text-forge-muted">
                {job.customer.email && <p>Email: {job.customer.email}</p>}
                {job.customer.phone && <p>Phone: {job.customer.phone}</p>}
              </div>
            )}

            {job.damageReports && job.damageReports.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-lg mb-3">Damage reports</h2>
                <ul className="space-y-2 text-sm text-forge-muted">
                  {job.damageReports.map(dr => (
                    <li key={dr.id} className="glass rounded-lg px-4 py-3 border border-forge-border/30">
                      {dr.notes || 'No notes'}
                      {dr.severity != null && <span className="text-forge-orange ml-2">Severity {dr.severity}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AdminLayout>
  )
}
