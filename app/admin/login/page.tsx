"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberSession, setRememberSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Maqueta: simular delay; en una iteración futura se usará Vercel Auth
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Cookie mock para poder entrar al dashboard en esta iteración
    document.cookie = "admin_session_mock=1; path=/; max-age=86400";
    setIsLoading(false);
    router.push("/admin");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16 xl:px-20 w-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <Image src="/svg/isotipo-1.svg" alt="Mica Cabrera" width={32} height={32} />
            </div>
            <span className="text-3xl font-bold text-white">Mica Cabrera</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight text-balance">
              Bienvenida a tu panel de administración
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-md">
              Gestiona tus pacientes, reservas y recetas desde un solo lugar. Tu
              práctica de nutrición, simplificada.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              "Gestión de pacientes",
              "Reservas y agenda",
              "Recetario y planes",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <Icon icon="solar:check-circle-bold" className="h-6 w-6 text-white shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <div className="lg:hidden mb-6 flex items-center gap-3 sm:mb-8">
              <Image src="/svg/isotipo-1.svg" alt="Mica Cabrera" width={40} height={40} className="shrink-0" />
              <span className="truncate text-lg font-bold text-[#3B0764] sm:text-2xl">Mica Cabrera</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-[#3B0764] sm:text-2xl">Iniciar sesión</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Ingresa tus credenciales para acceder al panel
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Contraseña</FieldLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background"
                  required
                />
              </Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberSession}
                  onCheckedChange={(checked) => setRememberSession(!!checked)}
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground">
                  Recordar sesión
                </label>
              </div>
              <Button type="submit" className="min-h-[44px] w-full" disabled={isLoading}>
                {isLoading ? "Entrando…" : "Iniciar sesión"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="#" className="text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
            </form>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              ¿Problemas para acceder?{" "}
              <Link href="/" className="text-primary hover:underline">
                Volver al sitio
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
