'use client'

import SideNav from '@/components/sidenavbar.component'

export default function SettingsLayout({ children }) {
  return (
    <>
      {/* mt-5 was adding ~20px on top of SideNav's own mobile spacer,
          stacking with the page's own spacing below it. Trimmed to a
          smaller mobile value and kept the original on desktop where
          there's no separate top bar to account for. */}
      <section className="relative flex gap-10 py-0 m-0 max-md:flex-col">
        <SideNav />
        <div className="mt-2 md:mt-5 w-full pr-4 md:pr-0">
          {children}
        </div>
      </section>
    </>
  )
}