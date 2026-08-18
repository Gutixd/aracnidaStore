import { Navbar } from '@/components/store/Navbar'
import { Footer } from '@/components/store/Footer'
import { SiteIntro } from '@/components/store/SiteIntro'
import { ChatWidget } from '@/components/store/ChatWidget'
import { isChatAssistantEnabled } from '@/lib/chat-assistant'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteIntro />
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      {/* Solo se monta si hay clave configurada: sin esto, mejor no mostrar
          un botón de chat que abre y nunca contesta. */}
      {isChatAssistantEnabled() && <ChatWidget />}
    </>
  )
}
