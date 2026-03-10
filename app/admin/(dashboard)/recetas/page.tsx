"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminRecetasPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">Recetas</h1>
          <p className="text-muted-foreground mt-1">
            Biblioteca de recetas — maqueta
          </p>
        </div>
        <Button className="transition-transform duration-200 hover:scale-105 active:scale-95">Nueva receta</Button>
      </div>
      <Input placeholder="Buscar recetas" className="max-w-sm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="h-32 bg-muted" />
            <CardContent className="pt-4">
              <p className="font-medium">Receta de ejemplo {i}</p>
              <p className="text-sm text-muted-foreground">
                Categoría · Sin datos reales
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        El listado y formularios de recetas se conectarán en una siguiente
        iteración.
      </p>
    </div>
  );
}
