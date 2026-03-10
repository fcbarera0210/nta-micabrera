"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopNavbar } from "@/components/admin/top-navbar";
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

  const handleMenuClick = () => {
    if (isDesktop) {
      setSidebarCollapsed((prev) => !prev);
    } else {
      setIsMobileMenuOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isDesktop={isDesktop}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <AdminTopNavbar
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={handleMenuClick}
        isDesktop={isDesktop}
      />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          isDesktop ? (sidebarCollapsed ? "pl-20" : "pl-64") : "pl-0"
        )}
      >
        <div className="p-6 lg:p-8">
          <AdminPageTransition>{children}</AdminPageTransition>
        </div>
      </main>
    </div>
  );
}
