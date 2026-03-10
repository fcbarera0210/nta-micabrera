"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPacientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de pacientes — maqueta
          </p>
        </div>
        <Button className="transition-transform duration-200 hover:scale-105 active:scale-95">Agregar paciente</Button>
      </div>
      <div className="flex gap-4">
        <Input placeholder="Buscar por nombre o email" className="max-w-sm" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["Activos", "Pendientes", "Inactivos"].map((label) => (
          <Card key={label} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">—</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-12">
            Tabla de pacientes — se conectará a la base de datos en una siguiente
            iteración.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
