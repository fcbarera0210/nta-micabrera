"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const days = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export default function AdminDisponibilidadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">Disponibilidad</h1>
        <p className="text-muted-foreground mt-1">
          Configuración de horarios por día — maqueta
        </p>
      </div>
      <div className="space-y-4">
        {days.map((day) => (
          <Card key={day} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{day}</CardTitle>
                <CardDescription>Horarios de atención</CardDescription>
              </div>
              <Switch />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bloques de horario — se configurarán en una siguiente iteración.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
