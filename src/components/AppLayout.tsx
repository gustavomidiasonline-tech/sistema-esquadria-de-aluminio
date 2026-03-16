import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex min-h-dvh w-full relative overflow-hidden">
      {/* Ambient light orbs — same style as reference image */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Bottom-left warm glow (red/orange) */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(200,50,30,0.7) 0%, rgba(150,30,20,0.4) 40%, transparent 70%)' }} />
        {/* Top-right cool glow (blue/purple) */}
        <div className="absolute -top-32 right-32 w-[600px] h-[600px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(80,60,220,0.6) 0%, rgba(60,40,180,0.3) 40%, transparent 70%)' }} />
        {/* Center-right pink accent */}
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(180,50,150,0.5) 0%, rgba(120,30,100,0.3) 40%, transparent 70%)' }} />
        {/* Bottom-center blue */}
        <div className="absolute bottom-0 left-1/3 w-[450px] h-[300px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(50,80,220,0.5) 0%, transparent 70%)' }} />
      </div>

      <AppSidebar
        isMobile={isMobile}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={handleCloseSidebar}
      />

      {isMobile && mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={handleCloseSidebar}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <AppHeader onToggleSidebar={handleToggleSidebar} isMobile={isMobile} />
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
