import { motion } from 'framer-motion'
import { Users, Mail, Phone, Car, Briefcase } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import { mockCustomers } from '@/data/mock'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08 } }),
}

export default function Customers() {
  const customerLoadData = mockCustomers.map((customer) => ({
    name: customer.name.split(' ')[0],
    jobs: customer.totalJobs,
    vehicles: customer.vehicleCount,
  }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Relations</p>
          <h1 className="font-display font-bold text-3xl">Customers</h1>
        </div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users size={18} className="text-forge-blue" />
            <h3 className="font-display font-semibold text-lg">Customer Job Load</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerLoadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="jobs" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vehicles" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-forge-border/30">
                {['Name', 'Contact', 'Vehicles', 'Total Jobs', 'Joined'].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-mono text-forge-muted uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockCustomers.map((customer, i) => (
                <motion.tr
                  key={customer.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={i}
                  className="border-b border-forge-border/20 hover:bg-white/2 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-forge-text">{customer.name}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 text-xs text-forge-muted">
                      <div className="flex items-center gap-2"><Mail size={12} /> {customer.email}</div>
                      <div className="flex items-center gap-2"><Phone size={12} /> {customer.phone}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-forge-muted">
                    <span className="inline-flex items-center gap-1.5"><Car size={13} className="text-forge-blue-light" /> {customer.vehicleCount}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-forge-muted">
                    <span className="inline-flex items-center gap-1.5"><Briefcase size={13} className="text-forge-orange" /> {customer.totalJobs}</span>
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-forge-muted">{customer.joinDate}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
