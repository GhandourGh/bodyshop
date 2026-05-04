import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Car, DollarSign, Clock, Wrench, Loader2, FileDown } from 'lucide-react'
import { useToast } from '@/components/shared/Toast'
import { downloadJobSummaryPdf } from '@/lib/pdf/jobSummaryPdf'
import { backendClient } from '@/api/client'
import BackButton from '@/components/shared/BackButton'
import StatusBadge from '@/components/shared/StatusBadge'

type JobDetail = {
  id: string
  status: string | null
  estimatedCost: number | null
  estimatedTime: number | null
  createdAt: string | null
  mechanicName: string | null
  vehicleLabel: string
  vehicle: { vin?: string | null } | null
  customer?: { name?: string; email?: string | null; phone?: string | null } | null
  damageReports: { id: string; notes: string | null; severity: number | null; createdAt: string | null }[]
}

export default function PortalJobDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const { toast } = useToast()

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['portal-job', jobId],
    queryFn: async () => {
      const res = await backendClient.get(`/api/portal/jobs/${jobId}`)
      const root = res.data
      if (root?.success === false) throw new Error(root.message || 'Failed')
      return (root?.data ?? root) as JobDetail
    },
    enabled: Boolean(jobId),
  })

  const errMsg = error instanceof Error ? error.message : null

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <BackButton />

      {isLoading && (
        <div className="flex items-center gap-2 text-forge-muted">
          <Loader2 size={18} className="animate-spin" /> Loading…
        </div>
      )}
      {errMsg && !isLoading && <p className="text-red-400 text-sm">{errMsg}</p>}

      {!isLoading && job && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Briefcase className="text-forge-blue-light shrink-0 mt-1" size={26} />
              <div>
                <StatusBadge status={job.status ?? 'pending'} />
                <h1 className="font-display font-bold text-2xl mt-2">{job.vehicleLabel}</h1>
                <p className="text-forge-muted text-xs font-mono mt-1">Job {job.id}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  downloadJobSummaryPdf(job, {
                    documentTitle: 'AutoForge — Your repair job',
                    filePrefix: 'autoforge-my-job',
                  })
                  toast('PDF downloaded.', 'success')
                } catch {
                  toast('Could not create PDF.', 'error')
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 glass border border-forge-border hover:border-forge-blue/40 text-sm font-medium rounded-xl transition-colors shrink-0"
            >
              <FileDown size={16} /> Download PDF
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {[
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

          {job.damageReports?.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-2">Damage notes</h2>
              <ul className="space-y-2 text-sm text-forge-muted">
                {job.damageReports.map(dr => (
                  <li key={dr.id} className="glass rounded-lg px-4 py-3 border border-forge-border/30">
                    {dr.notes || '—'}
                    {dr.severity != null && <span className="text-forge-orange ml-2">Severity {dr.severity}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
