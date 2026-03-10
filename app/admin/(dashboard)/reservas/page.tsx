"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminReservasPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">Reservas</h1>
          <p className="text-muted-foreground mt-1">
            Calendario y lista de citas — maqueta
          </p>
        </div>
        <Button className="transition-transform duration-200 hover:scale-105 active:scale-95">Nueva reserva</Button>
      </div>
      <Tabs defaultValue="calendario" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>
        <TabsContent value="calendario" className="space-y-4">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Vista de calendario</CardTitle>
              <CardDescription>
                El calendario y las citas se conectarán en una siguiente iteración.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 rounded-lg bg-muted/50 flex items-center justify-center text-sm text-muted-foreground">
                Calendario (maqueta)
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lista" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-12">
                Lista de reservas — maqueta.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
