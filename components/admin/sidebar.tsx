"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { logoutAction } from "@/app/admin/actions";
import { sileo } from "sileo";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: "solar:home-2-bold" },
  { label: "Pacientes", href: "/admin/pacientes", icon: "solar:users-group-rounded-bold" },
  { label: "Reservas", href: "/admin/reservas", icon: "solar:calendar-bold" },
  { label: "Disponibilidad", href: "/admin/disponibilidad", icon: "solar:clock-circle-bold" },
  { label: "Servicios", href: "/admin/servicios", icon: "solar:tag-bold" },
  { label: "Recetas", href: "/admin/recetas", icon: "solar:chef-hat-heart-bold" },
  { label: "Métricas", href: "/admin/metricas", icon: "solar:chart-2-bold" },
  { label: "Configuración", href: "/admin/configuracion", icon: "solar:settings-bold" },
];

interface SidebarContentProps {
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ pathname, collapsed, onToggle, onNavigate }: SidebarContentProps) {
  const isMobile = typeof onNavigate === "function";

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border px-4",
          isMobile && "gap-3",
          !isMobile && collapsed && "justify-center",
          !isMobile && !collapsed && "gap-3"
        )}
      >
        {isMobile ? (
          <>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
              <Image src="/svg/isotipo-1.svg" alt="Mica Cabrera" width={24} height={24} />
            </div>
            <span className="truncate text-sm font-bold text-[#3B0764]">Mica Cabrera</span>
          </>
        ) : collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-primary-foreground active:scale-95"
            aria-label="Expandir menú"
          >
            <span className="group-hover/sidebar:hidden flex items-center justify-center">
              <Image src="/svg/isotipo-1.svg" alt="Mica Cabrera" width={24} height={24} />
            </span>
            <Icon
              icon="solar:sidebar-minimalistic-bold"
              className="hidden h-6 w-6 group-hover/sidebar:block"
              aria-hidden
            />
          </button>
        ) : (
          <>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
              <Image src="/svg/isotipo-1.svg" alt="Mica Cabrera" width={24} height={24} />
            </div>
            <span className="truncate text-sm font-bold text-[#3B0764]">Mica Cabrera</span>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-9 w-9 transition-transform duration-200 hover:scale-110 active:scale-95"
                aria-label="Colapsar menú"
              >
                <Icon icon="solar:sidebar-minimalistic-bold" className="h-5 w-5 rotate-180" />
              </Button>
            </div>
          </>
        )}
      </div>
      <ScrollArea className="flex-1 py-4">
        <div className="flex flex-col gap-1 px-2">
          {navItems.map((item, index) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "group/link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:translate-x-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:translate-x-0",
                  (!isMobile && collapsed) && "justify-center px-2 hover:translate-x-0 hover:scale-105",
                  isMobile && "w-full"
                )}
                onClick={onNavigate}
              >
                <Icon icon={item.icon} className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover/link:scale-110" />
                {(isMobile || !collapsed) && <span>{item.label}</span>}
              </Link>
            );
            if (isMobile) {
              return (
                <motion.div
                  key={item.href}
                  custom={index}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.25, ease: "easeOut" }}
                >
                  {linkContent}
                </motion.div>
              );
            }
            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <div key={item.href}>{linkContent}</div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-2">
        {isMobile ? (
          <button
            type="button"
            onClick={async () => {
              if (onNavigate) onNavigate();
              sileo.info({ title: "Cerrando sesión…", duration: 2000 });
              await logoutAction();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10 active:scale-95"
          >
            <Icon icon="solar:logout-3-bold" className="h-5 w-5 shrink-0" />
            Cerrar sesión
          </button>
        ) : collapsed ? (
          <button
            type="button"
            onClick={async () => {
              sileo.info({ title: "Cerrando sesión…", duration: 2000 });
              await logoutAction();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-destructive transition-all duration-200 hover:bg-destructive/10 active:scale-95 mx-auto"
            aria-label="Cerrar sesión"
          >
            <Icon icon="solar:logout-3-bold" className="h-5 w-5 shrink-0" />
          </button>
        ) : (
          <button
            type="button"
            onClick={async () => {
              sileo.info({ title: "Cerrando sesión…", duration: 2000 });
              await logoutAction();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10 active:scale-95"
          >
            <Icon icon="solar:logout-3-bold" className="h-5 w-5 shrink-0" />
            Cerrar sesión
          </button>
        )}
      </div>
    </div>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isDesktop?: boolean;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export function AdminSidebar({
  collapsed,
  onToggle,
  isDesktop = true,
  isMobileMenuOpen = false,
  onCloseMobileMenu = () => {},
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      {/* Móvil: drawer (Sheet) */}
      {!isDesktop && (
        <Sheet open={isMobileMenuOpen} onOpenChange={(open) => !open && onCloseMobileMenu()}>
          <SheetContent
            side="left"
            className="w-[280px] max-w-[85vw] border-sidebar-border p-0"
          >
            <div className="flex h-full flex-col pt-12">
              <SidebarContent
                pathname={pathname}
                collapsed={false}
                onToggle={onToggle}
                onNavigate={onCloseMobileMenu}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop: aside fijo */}
      <aside
        className={cn(
          "group/sidebar fixed left-0 top-0 z-40 h-screen bg-white border-r border-sidebar-border transition-all duration-300 ease-in-out",
          isDesktop ? (collapsed ? "w-20" : "w-64") : "hidden"
        )}
      >
        <SidebarContent
          pathname={pathname}
          collapsed={collapsed}
          onToggle={onToggle}
        />
      </aside>
    </TooltipProvider>
  );
}
