import { Navbar } from '@/components/store/Navbar'
import { Footer } from '@/components/store/Footer'
import { SiteIntro } from '@/components/store/SiteIntro'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteIntro />
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
