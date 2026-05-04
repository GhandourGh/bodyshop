import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/** Payload for repair job PDF (staff or portal API shape). */
export type JobPdfPayload = {
  id: string
  status: string | null
  vehicleLabel: string
  estimatedCost: number | null
  estimatedTime: number | null
  createdAt: string | null
  mechanicName: string | null
  customer?: { name?: string; email?: string | null; phone?: string | null } | null
  vehicle?: { vin?: string | null } | null
  damageReports?: { notes: string | null; severity: number | null }[]
}

function safeCell(s: string | null | undefined, max = 120): string {
  if (s == null || s === '') return '—'
  const t = String(s).replace(/[^\x20-\x7E]/g, '?')
  return t.length > max ? `${t.slice(0, max)}…` : t
}

/**
 * Builds and downloads a one-page job summary PDF (ASCII-safe for built-in Helvetica).
 */
export function downloadJobSummaryPdf(job: JobPdfPayload, options?: { documentTitle?: string; filePrefix?: string }) {
  const docTitle = options?.documentTitle ?? 'AutoForge — Repair job summary'
  const prefix = options?.filePrefix ?? 'autoforge-job'

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(30, 30, 40)
  doc.text(docTitle, 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(90, 90, 100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26)

  const body: string[][] = [
    ['Job ID', safeCell(job.id, 72)],
    ['Status', safeCell(job.status ?? 'pending')],
    ['Vehicle', safeCell(job.vehicleLabel)],
    ['Customer', safeCell(job.customer?.name)],
    ['Email', safeCell(job.customer?.email)],
    ['Phone', safeCell(job.customer?.phone)],
    ['VIN', safeCell(job.vehicle?.vin)],
    ['Mechanic', safeCell(job.mechanicName)],
    ['Est. cost (USD)', job.estimatedCost != null ? Number(job.estimatedCost).toLocaleString() : '—'],
    ['Est. hours', job.estimatedTime != null ? String(job.estimatedTime) : '—'],
    ['Created', job.createdAt ? safeCell(new Date(job.createdAt).toLocaleString(), 72) : '—'],
  ]

  autoTable(doc, {
    startY: 32,
    head: [['Field', 'Value']],
    body,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 138 } },
    margin: { left: 14, right: 14 },
  })

  const tableEnd = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 32
  let y = tableEnd + 10

  const reports = job.damageReports?.filter(Boolean) ?? []
  if (reports.length > 0) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(30, 30, 40)
    doc.text('Damage notes', 14, y)
    y += 6

    const dmgBody = reports.map((d) => [
      safeCell(d.notes, 100),
      d.severity != null ? String(d.severity) : '—',
    ])

    autoTable(doc, {
      startY: y,
      head: [['Notes', 'Severity']],
      body: dmgBody,
      styles: { font: 'helvetica', fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    })
  }

  const shortId = job.id.replace(/-/g, '').slice(0, 10)
  doc.save(`${prefix}-${shortId}.pdf`)
}
