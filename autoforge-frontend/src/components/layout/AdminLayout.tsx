import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import PageTransition from '@/components/shared/PageTransition'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-forge-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-[220px] overflow-y-auto">
        <PageTransition>
          <div className="p-8 min-h-screen">
            {children}
          </div>
        </PageTransition>
      </main>
    </div>
  )
}
