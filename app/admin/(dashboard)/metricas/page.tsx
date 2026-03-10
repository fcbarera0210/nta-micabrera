"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminMetricasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">Métricas</h1>
        <p className="text-muted-foreground mt-1">
          Informes y gráficos — maqueta
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
              <CardDescription>Maqueta — sin datos reales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground text-sm">
                Gráfico (Recharts) en siguiente iteración
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pacientes" className="space-y-4">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardContent className="pt-6">
              <p className="text-muted-foreground py-8 text-center">
                Métricas de pacientes — maqueta.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reservas" className="space-y-4">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardContent className="pt-6">
              <p className="text-muted-foreground py-8 text-center">
                Métricas de reservas — maqueta.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
