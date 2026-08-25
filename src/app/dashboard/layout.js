'use client'

import SideNav from '@/components/sidenavbar.component'

export default function DashboardLayout({ children }) {
  return (
    <>
      <section className="relative flex gap-10 py-0 m-0 max-md:flex-col">
        <SideNav />
        <div className="mt-5 w-full pr-4 md:pr-0">
          {children}
        </div>
      </section>
    </>
  )
}