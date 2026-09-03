import { AnnouncementBar } from '@/components/store/AnnouncementBar'
import { Navbar } from '@/components/store/Navbar'
import { Footer } from '@/components/store/Footer'
import { SiteIntro } from '@/components/store/SiteIntro'
import { ChatWidget } from '@/components/store/ChatWidget'
import { NavigationProgressProvider, PageTransitionOverlay } from '@/components/store/NavigationProgress'
import { isChatAssistantEnabled } from '@/lib/chat-assistant'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    // El proveedor envuelve TODO, Navbar incluido: sus links usan este
    // contexto para disparar la barra de progreso. El difuminado en sí
    // (PageTransitionOverlay) solo envuelve el contenido dentro de <main>,
    // para que el menú se mantenga nítido y clickeable mientras la página
    // de destino carga.
    <NavigationProgressProvider>
      <SiteIntro />
      <AnnouncementBar />
      <Navbar />
      <main className="min-h-screen">
        <PageTransitionOverlay>{children}</PageTransitionOverlay>
      </main>
      <Footer />
      {/* Solo se monta si hay clave configurada: sin esto, mejor no mostrar
          un botón de chat que abre y nunca contesta. */}
      {isChatAssistantEnabled() && <ChatWidget />}
    </NavigationProgressProvider>
  )
}
