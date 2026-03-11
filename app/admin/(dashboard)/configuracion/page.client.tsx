"use client";

import { useState, useTransition } from "react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { SiteSettings } from "@/lib/db/schema";

interface AdminConfiguracionClientProps {
  initialSettings: SiteSettings | null;
  changePasswordAction: (input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateSiteSettingsAction: (input: {
    whatsappPhone?: string;
    contactEmail?: string;
    instagramHandle?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export default function AdminConfiguracionClient({
  initialSettings,
  changePasswordAction,
  updateSiteSettingsAction,
}: AdminConfiguracionClientProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPendingPassword, startPasswordTransition] = useTransition();

  const [whatsappPhone, setWhatsappPhone] = useState(
    initialSettings?.whatsappPhone ?? ""
  );
  const [contactEmail, setContactEmail] = useState(
    initialSettings?.contactEmail ?? ""
  );
  const [instagramHandle, setInstagramHandle] = useState(
    initialSettings?.instagramHandle ?? ""
  );
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isPendingSettings, startSettingsTransition] = useTransition();

  const handleChangePassword = () => {
    setPasswordError(null);

    startPasswordTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        sileo.success({
          title: "Contraseña actualizada",
          description: "Tu contraseña se cambió correctamente.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(result.error ?? "No se pudo cambiar la contraseña.");
      }
    });
  };

  const handleUpdateSettings = () => {
    setSettingsError(null);

    startSettingsTransition(async () => {
      const result = await updateSiteSettingsAction({
        whatsappPhone,
        contactEmail,
        instagramHandle,
      });

      if (result.success) {
        sileo.success({
          title: "Datos de contacto guardados",
          description: "La información de WhatsApp, email e Instagram fue actualizada.",
        });
      } else {
        setSettingsError(
          result.error ?? "No se pudieron guardar los datos de contacto."
        );
      }
    });
  };

  return (
    <Tabs defaultValue="perfil" className="space-y-4">
      <TabsList>
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
        <TabsTrigger value="negocio">Negocio</TabsTrigger>
      </TabsList>

      <TabsContent value="perfil" className="space-y-4">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>Cambia la contraseña de tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel>Contraseña actual</FieldLabel>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field>
              <FieldLabel>Nueva contraseña</FieldLabel>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </Field>
            <Field>
              <FieldLabel>Confirmar nueva contraseña</FieldLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
              />
            </Field>
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={isPendingPassword}
              className="transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {isPendingPassword ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="negocio" className="space-y-4">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Datos de contacto</CardTitle>
            <CardDescription>
              Teléfono de WhatsApp, email e Instagram que se usan en la web
              pública.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel>Teléfono WhatsApp</FieldLabel>
              <Input
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="Ej: +56912345678 o 912345678"
              />
            </Field>
            <Field>
              <FieldLabel>Email de contacto</FieldLabel>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contacto@ejemplo.cl"
              />
            </Field>
            <Field>
              <FieldLabel>Instagram</FieldLabel>
              <Input
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@nta.micabrera"
              />
            </Field>
            {settingsError && (
              <p className="text-sm text-red-600">{settingsError}</p>
            )}
            <Button
              type="button"
              onClick={handleUpdateSettings}
              disabled={isPendingSettings}
              className="transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {isPendingSettings ? "Guardando..." : "Guardar datos de contacto"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

