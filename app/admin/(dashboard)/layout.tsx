"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDesktop = useIsDesktop();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isDesktop={isDesktop}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          isDesktop ? (sidebarCollapsed ? "pl-20" : "pl-64") : "pl-0"
        )}
      >
        <div className="pt-6 lg:pt-8 p-6 lg:p-8">
          <AdminPageTransition>{children}</AdminPageTransition>
        </div>
      </main>
    </div>
  );
}
