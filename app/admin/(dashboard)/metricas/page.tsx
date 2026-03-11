import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDashboardMetrics } from "@/lib/admin/metrics";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CL").format(value);
}

export default async function AdminMetricasPage() {
  const metrics = await getDashboardMetrics();

  const lastReservations = metrics.reservationsByMonth.at(-1);
  const lastNewPatients = metrics.newPatientsByMonth.at(-1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">Métricas</h1>
        <p className="text-muted-foreground mt-1">
          Informes y gráficos basados en los datos reales de tu práctica
        </p>
      </div>
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Evolución de consultas</CardTitle>
              <CardDescription>Consultas creadas por mes (últimos 3 meses)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground text-xs sm:text-sm">
                {metrics.reservationsByMonth.length === 0 ? (
                  <span>No hay datos suficientes para mostrar la evolución de consultas.</span>
                ) : (
                  <div className="w-full space-y-3">
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
                                  metrics.reservationsByMonth.reduce(
                                    (max, m) => (m.count > max ? m.count : max),
                                    1
                                  ) === 0
                                    ? "0%"
                                    : `${(item.count /
                                        metrics.reservationsByMonth.reduce(
                                          (max, m) => (m.count > max ? m.count : max),
                                          1
                                        )) *
                                        100}%`,
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

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Resumen rápido</CardTitle>
              <CardDescription>Totales y estado actual</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pacientes totales</p>
                <p className="text-lg font-semibold mt-1">{formatNumber(metrics.totalPatients)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Reservas totales</p>
                <p className="text-lg font-semibold mt-1">{formatNumber(metrics.totalReservations)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Reservas este mes</p>
                <p className="text-lg font-semibold mt-1">{formatNumber(metrics.currentMonthReservations)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Nuevos pacientes este mes</p>
                <p className="text-lg font-semibold mt-1">{formatNumber(metrics.newPatientsThisMonth)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pacientes" className="space-y-4">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Evolución de pacientes</CardTitle>
              <CardDescription>Nuevos pacientes por mes (últimos 3 meses)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground text-xs sm:text-sm">
                {metrics.newPatientsByMonth.length === 0 ? (
                  <span>No hay datos suficientes para mostrar la evolución de pacientes.</span>
                ) : (
                  <div className="w-full space-y-3">
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
                                  metrics.newPatientsByMonth.reduce(
                                    (max, m) => (m.count > max ? m.count : max),
                                    1
                                  ) === 0
                                    ? "0%"
                                    : `${(item.count /
                                        metrics.newPatientsByMonth.reduce(
                                          (max, m) => (m.count > max ? m.count : max),
                                          1
                                        )) *
                                        100}%`,
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

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Estado actual</CardTitle>
              <CardDescription>Último mes disponible</CardDescription>
            </CardHeader>
            <CardContent>
              {lastNewPatients ? (
                <p className="text-sm text-muted-foreground">
                  En <span className="font-semibold">{lastNewPatients.month}</span> se registraron{" "}
                  <span className="font-semibold">{formatNumber(lastNewPatients.count)}</span> nuevos pacientes.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay datos de pacientes para resumir.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservas" className="space-y-4">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Reservas por mes</CardTitle>
              <CardDescription>Consultas creadas por mes (últimos 3 meses)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground text-xs sm:text-sm">
                {metrics.reservationsByMonth.length === 0 ? (
                  <span>No hay datos suficientes para mostrar reservas por mes.</span>
                ) : (
                  <div className="w-full space-y-3">
                    <div className="flex justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                      <span>Mes</span>
                      <span>Reservas</span>
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
                                  metrics.reservationsByMonth.reduce(
                                    (max, m) => (m.count > max ? m.count : max),
                                    1
                                  ) === 0
                                    ? "0%"
                                    : `${(item.count /
                                        metrics.reservationsByMonth.reduce(
                                          (max, m) => (m.count > max ? m.count : max),
                                          1
                                        )) *
                                        100}%`,
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

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Estado de las reservas (mes actual)</CardTitle>
              <CardDescription>Distribución por estado</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pendientes</p>
                <p className="text-lg font-semibold mt-1">
                  {formatNumber(metrics.currentMonthReservationsByStatus.pending)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Confirmadas</p>
                <p className="text-lg font-semibold mt-1">
                  {formatNumber(metrics.currentMonthReservationsByStatus.confirmed)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Canceladas</p>
                <p className="text-lg font-semibold mt-1">
                  {formatNumber(metrics.currentMonthReservationsByStatus.cancelled)}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
