import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { MobileSidebar } from "./MobileSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden animated-bg animate-fade-in text-foreground">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:block z-10">
        <AppSidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden z-10">
        <header className="lg:hidden border-b border-border bg-background/50 backdrop-blur-sm px-4 h-16 flex items-center justify-between">
          <MobileSidebar />
          <div className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">SENTINEL AI</div>
          <div className="w-8" /> {/* Spacer */}
        </header>
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
