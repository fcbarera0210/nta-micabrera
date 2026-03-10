"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function AdminConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Perfil, notificaciones y negocio — maqueta
        </p>
      </div>
      <Tabs defaultValue="perfil" className="space-y-4">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="negocio">Negocio</TabsTrigger>
        </TabsList>
        <TabsContent value="perfil" className="space-y-4">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Datos del perfil</CardTitle>
              <CardDescription>
                Información que se verá en el panel (maqueta)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>Nombre</FieldLabel>
                <Input placeholder="Nombre" disabled className="bg-muted/50" />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input placeholder="email@ejemplo.com" disabled className="bg-muted/50" />
              </Field>
              <Field>
                <FieldLabel>Bio</FieldLabel>
                <Textarea placeholder="Breve descripción" disabled className="bg-muted/50" />
              </Field>
              <Button disabled className="transition-transform duration-200 hover:scale-105 active:scale-95">Guardar cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notificaciones" className="space-y-4">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Preferencias de avisos (maqueta)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email</span>
                <Switch disabled />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Push</span>
                <Switch disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="negocio" className="space-y-4">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Negocio</CardTitle>
              <CardDescription>
                Duración de consulta, moneda, zona horaria (maqueta)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>Duración de consulta (min)</FieldLabel>
                <Input type="number" placeholder="60" disabled className="bg-muted/50" />
              </Field>
              <Button disabled className="transition-transform duration-200 hover:scale-105 active:scale-95">Guardar</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
