"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TopNavbarProps {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
  isDesktop?: boolean;
}

export function AdminTopNavbar({ sidebarCollapsed, onMenuClick, isDesktop = true }: TopNavbarProps) {
  return (
    <header
      className={cn(
        "fixed top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6 transition-[left] duration-300 right-0",
        isDesktop ? (sidebarCollapsed ? "left-20" : "left-64") : "left-0"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0 text-[#3B0764] transition-all duration-200 hover:scale-110 hover:text-[#3B0764] hover:bg-primary/10 active:scale-95",
          isDesktop ? "hidden" : "flex"
        )}
        onClick={onMenuClick}
        aria-label="Abrir menú"
      >
        <Icon icon="solar:hamburger-menu-bold" className="h-6 w-6" />
      </Button>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative min-w-0 flex-1">
          <Icon
            icon="solar:magnifer-bold"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-[#3B0764]"
          />
          <Input
            type="search"
            placeholder="Buscar pacientes, reservas…"
            className="w-full min-w-0 pl-9 bg-muted/50 border-0 text-[#3B0764] transition-all duration-200 placeholder:text-[#3B0764]/60 focus:bg-muted/70"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#3B0764] transition-transform duration-200 hover:scale-110 hover:text-[#3B0764] hover:bg-primary/10 active:scale-95" aria-label="Notificaciones">
                <Icon icon="solar:bell-bold" className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuItem>
                <span className="text-sm text-[#3B0764]/80">Sin notificaciones nuevas</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#3B0764] transition-transform duration-200 hover:scale-110 hover:text-[#3B0764] hover:bg-primary/10 active:scale-95" aria-label="Acciones rápidas">
                <Icon icon="solar:add-circle-bold" className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/admin/pacientes">Nuevo paciente</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/reservas">Nueva reserva</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/recetas">Nueva receta</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="text-[#3B0764] transition-transform duration-200 hover:scale-110 hover:text-[#3B0764] hover:bg-primary/10 active:scale-95" aria-label="Ayuda">
            <Icon icon="solar:question-circle-bold" className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
