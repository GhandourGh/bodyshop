import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export type InvoicePdfRow = {
  id: string
  customer: string
  vehicle: string
  mechanic: string
  amount: number
  status: string
  date: string
}

function safeCell(s: string | null | undefined, max = 40): string {
  if (s == null || s === '') return '—'
  const t = String(s).replace(/[^\x20-\x7E]/g, '?')
  return t.length > max ? `${t.slice(0, max)}…` : t
}

/** Landscape table of invoices (e.g. finance mock or live data). */
export function downloadInvoicesPdf(rows: InvoicePdfRow[], fileName = 'autoforge-invoices.pdf') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('AutoForge — Invoice register', 14, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(90, 90, 100)
  doc.text(`Generated: ${new Date().toLocaleString()} · ${rows.length} row(s)`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [['Invoice', 'Customer', 'Vehicle', 'Mechanic', 'Amount (USD)', 'Status', 'Date']],
    body: rows.map((r) => [
      safeCell(r.id, 24),
      safeCell(r.customer, 28),
      safeCell(r.vehicle, 32),
      safeCell(r.mechanic, 22),
      Number(r.amount).toLocaleString(),
      safeCell(r.status, 12),
      safeCell(r.date, 22),
    ]),
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
    margin: { left: 10, right: 10 },
  })

  doc.save(fileName)
}
