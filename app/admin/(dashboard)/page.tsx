"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Resumen de tu práctica y actividad reciente
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total pacientes", value: "—", change: "+0%", icon: "solar:users-group-rounded-bold" },
          { title: "Reservas del mes", value: "—", change: "+0%", icon: "solar:calendar-bold" },
          { title: "Consultas", value: "—", change: "0%", icon: "solar:clipboard-list-bold" },
          { title: "Nuevos pacientes", value: "—", change: "—", icon: "solar:user-plus-bold" },
        ].map((stat, i) => (
          <motion.div key={stat.title} custom={i} initial="initial" animate="animate" variants={cardVariants}>
          <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon icon={stat.icon} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {stat.change}
                </Badge>
              )}
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Consultas mensuales</CardTitle>
            <CardDescription>Maqueta — sin datos reales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground text-sm">
              Gráfico (Recharts) en siguiente iteración
            </div>
          </CardContent>
        </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }}>
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Crecimiento de pacientes</CardTitle>
            <CardDescription>Maqueta — sin datos reales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground text-sm">
              Gráfico (Recharts) en siguiente iteración
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}>
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Próximas consultas</CardTitle>
            <CardDescription>Hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay consultas programadas para hoy. Los datos se conectarán en una
              siguiente iteración.
            </p>
          </CardContent>
        </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.3 }}>
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
            <CardDescription>Atajos del panel</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="default" size="sm" className="transition-transform duration-200 hover:scale-105 active:scale-95">
              <Link href="/admin/pacientes">Nuevo paciente</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="transition-all duration-200 hover:scale-105 hover:border-primary/50 active:scale-95">
              <Link href="/admin/reservas">Nueva reserva</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="transition-all duration-200 hover:scale-105 hover:border-primary/50 active:scale-95">
              <Link href="/admin/recetas">Nueva receta</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="transition-all duration-200 hover:scale-105 hover:border-primary/50 active:scale-95">
              <Link href="/admin/metricas">Ver métricas</Link>
            </Button>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
