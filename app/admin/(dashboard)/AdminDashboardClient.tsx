"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardMetrics } from "@/lib/admin/metrics";
import type { ReservationWithService } from "../reservas/actions";

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CL").format(value);
}

interface AdminDashboardClientProps {
  metrics: DashboardMetrics;
  todaysReservations: ReservationWithService[];
}

export function AdminDashboardClient({ metrics, todaysReservations }: AdminDashboardClientProps) {
  const stats = [
    {
      title: "Total pacientes",
      value: formatNumber(metrics.totalPatients),
      change: undefined,
      icon: "solar:users-group-rounded-bold",
    },
    {
      title: "Reservas del mes",
      value: formatNumber(metrics.currentMonthReservations),
      change: undefined,
      icon: "solar:calendar-bold",
    },
    {
      title: "Consultas (total)",
      value: formatNumber(metrics.totalReservations),
      change: undefined,
      icon: "solar:clipboard-list-bold",
    },
    {
      title: "Nuevos pacientes (mes)",
      value: formatNumber(metrics.newPatientsThisMonth),
      change: undefined,
      icon: "solar:user-plus-bold",
    },
  ];

  const maxReservations = metrics.reservationsByMonth.reduce(
    (max, m) => (m.count > max ? m.count : max),
    0
  );
  const maxNewPatients = metrics.newPatientsByMonth.reduce(
    (max, m) => (m.count > max ? m.count : max),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Resumen de tu práctica y actividad reciente
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Consultas mensuales</CardTitle>
              <CardDescription>Últimos 3 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground text-xs sm:text-sm">
                {metrics.reservationsByMonth.length === 0 ? (
                  <span>No hay datos suficientes todavía para mostrar el gráfico.</span>
                ) : (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                      <span>Mes</span>
                      <span>Consultas</span>
                    </div>
                    <div className="space-y-1">
                      {metrics.reservationsByMonth.map((item) => (
                        <div key={item.month} className="flex items-center gap-2">
                          <span className="w-16 text-[11px] font-medium">
                            {item.month}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-primary transition-all"
                              style={{
                                width:
                                  maxReservations === 0
                                    ? "0%"
                                    : `${(item.count / maxReservations) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="w-10 text-right text-[11px] font-medium">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Crecimiento de pacientes</CardTitle>
              <CardDescription>Últimos 3 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground text-xs sm:text-sm">
                {metrics.newPatientsByMonth.length === 0 ? (
                  <span>No hay datos suficientes todavía para mostrar el gráfico.</span>
                ) : (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                      <span>Mes</span>
                      <span>Nuevos pacientes</span>
                    </div>
                    <div className="space-y-1">
                      {metrics.newPatientsByMonth.map((item) => (
                        <div key={item.month} className="flex items-center gap-2">
                          <span className="w-16 text-[11px] font-medium">
                            {item.month}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500 transition-all"
                              style={{
                                width:
                                  maxNewPatients === 0
                                    ? "0%"
                                    : `${(item.count / maxNewPatients) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="w-10 text-right text-[11px] font-medium">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Próximas consultas</CardTitle>
              <CardDescription>Hoy</CardDescription>
            </CardHeader>
            <CardContent>
              {todaysReservations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tienes consultas agendadas para hoy. Cuando se creen reservas para este día, aparecerán aquí.
                </p>
              ) : (
                <div className="space-y-3">
                  <ul className="space-y-2 text-sm">
                    {todaysReservations.slice(0, 5).map((reservation) => (
                      <li
                        key={reservation.id}
                        className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-xs sm:text-sm"
                      >
                        <div className="space-y-0.5">
                          <p className="font-medium">
                            {reservation.patientName}
                          </p>
                          <p className="text-muted-foreground">
                            {reservation.startTime}–{reservation.endTime} ·{" "}
                            {reservation.service?.name ?? "Servicio"}
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                        >
                          {reservation.status === "pending" && (
                            <span className="text-amber-700 bg-amber-100">
                              Pendiente
                            </span>
                          )}
                          {reservation.status === "confirmed" && (
                            <span className="text-emerald-700 bg-emerald-100">
                              Confirmada
                            </span>
                          )}
                          {reservation.status === "cancelled" && (
                            <span className="text-rose-700 bg-rose-100">
                              Cancelada
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {todaysReservations.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      Y {todaysReservations.length - 5} consulta(s) más. Puedes ver el detalle en la sección de reservas.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Acciones rápidas</CardTitle>
              <CardDescription>Atajos del panel</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                asChild
                variant="default"
                size="sm"
                className="transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Link href="/admin/pacientes">Nuevo paciente</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="transition-all duration-200 hover:scale-105 hover:border-primary/50 active:scale-95"
              >
                <Link href="/admin/reservas">Nueva reserva</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="transition-all duration-200 hover:scale-105 hover:border-primary/50 active:scale-95"
              >
                <Link href="/admin/recetas">Nueva receta</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="transition-all duration-200 hover:scale-105 hover:border-primary/50 active:scale-95"
              >
                <Link href="/admin/metricas">Ver métricas</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

