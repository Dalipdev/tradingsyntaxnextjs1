// app/search/[query]/loading.js

import Loader from '@/components/loader.component'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader />
    </div>
  )
}