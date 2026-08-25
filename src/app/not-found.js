import Link from 'next/link'
import Image from 'next/image'

// SEO: Note that Next.js handles metadata for 404s differently, 
// but keeping this lightweight is key for performance.

export default function NotFound() {
  return (
    <section className="min-h-[80vh] relative p-10 flex flex-col items-center justify-center text-center gap-10">
      
      {/* Speed Optimization: 
        1. Used 'priority' so the 404 image loads instantly.
        2. Added bg-grey/10 as a placeholder to prevent "flash".
      */}
      <div className="relative w-72 h-72 bg-grey/10 rounded overflow-hidden shadow-sm">
        <Image
          src="/imgs/404.png"
          className="select-none object-cover"
          alt="Page Not Found"
          fill
          priority
          sizes="288px"
        />
      </div>

      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-4xl font-gelasio font-bold">Page not found</h1>
        <p className="text-dark-grey text-xl max-w-md">
          The page you are looking for does not exist or has been moved. 
          Head back to the{" "}
          <Link href="/" className="text-black dark:text-white underline decoration-purple underline-offset-4 hover:text-purple transition-colors">
            home page
          </Link>
        </p>
      </div>

      <Link href="/" className="btn-dark px-10 py-4 rounded-full transition-transform active:scale-95">
        Go to Home
      </Link>
      
      {/* SEO Fix: Informative links on 404 pages help Google crawl 
        your site better even when it hits a dead end.
      */}
      <div className="mt-10 flex gap-5 text-sm opacity-60">
        <Link href="/search" className="hover:underline">Search Content</Link>
        <Link href="/signup" className="hover:underline">Join TradingSyntax</Link>
      </div>
    </section>
  )
}