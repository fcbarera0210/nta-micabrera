"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusIcon, PencilIcon, Trash2Icon, ClockIcon } from "lucide-react";
import { toast } from "sonner";
import { type Service } from "@/lib/db/schema";
import {
  createService,
  updateService,
  toggleService,
  deleteService,
  type ServiceInput,
} from "./actions";

interface Props {
  initialServices: Service[];
}

const EMPTY_INPUT: ServiceInput = {
  name: "",
  description: "",
  durationMinutes: 60,
  active: true,
};

interface ServiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ServiceInput) => Promise<void>;
  initialValues?: ServiceInput;
  title: string;
  submitLabel: string;
}

function ServiceFormDialog({
  open,
  onClose,
  onSubmit,
  initialValues = EMPTY_INPUT,
  title,
  submitLabel,
}: ServiceFormDialogProps) {
  const [form, setForm] = useState<ServiceInput>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(field: keyof ServiceInput, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function handleSubmit() {
    startTransition(async () => {
      await onSubmit(form);
    });
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setError(null);
      setForm(initialValues);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Los servicios se usan para generar los slots de reserva.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nombre <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Ej. Revisión completa"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descripción (opcional)</label>
            <Input
              placeholder="Breve descripción del servicio"
              value={form.description ?? ""}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Duración (minutos) <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              min={5}
              max={480}
              step={5}
              value={form.durationMinutes}
              onChange={(e) =>
                handleChange("durationMinutes", parseInt(e.target.value, 10))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Activo</span>
            <Switch
              checked={form.active ?? true}
              onCheckedChange={(v) => handleChange("active", v)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Guardando…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ServiciosClient({ initialServices }: Props) {
  const [serviceList, setServiceList] = useState<Service[]>(initialServices);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(input: ServiceInput) {
    const result = await createService(input);
    if (!result.success) {
      toast.error(result.error ?? "Error al crear servicio.");
      return;
    }
    toast.success("Servicio creado.");
    setCreateOpen(false);
    // Optimistic: refresh will handle actual state via revalidatePath
    window.location.reload();
  }

  async function handleUpdate(input: ServiceInput) {
    if (!editTarget) return;
    const result = await updateService(editTarget.id, input);
    if (!result.success) {
      toast.error(result.error ?? "Error al actualizar servicio.");
      return;
    }
    toast.success("Servicio actualizado.");
    setEditTarget(null);
    window.location.reload();
  }

  function handleToggle(service: Service, active: boolean) {
    setServiceList((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, active } : s))
    );
    startTransition(async () => {
      const result = await toggleService(service.id, active);
      if (!result.success) {
        toast.error(result.error);
        setServiceList((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, active: !active } : s))
        );
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteService(deleteTarget.id);
      if (!result.success) {
        toast.error(result.error ?? "Error al eliminar.");
      } else {
        toast.success("Servicio eliminado.");
        setServiceList((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">
            Servicios
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los tipos de consulta y sus duraciones.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <PlusIcon className="size-4" />
          Nuevo servicio
        </Button>
      </div>

      {serviceList.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClockIcon className="size-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              No hay servicios configurados.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Crea un servicio para que los pacientes puedan hacer reservas.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {serviceList.map((service) => (
          <Card
            key={service.id}
            className="transition-all duration-200 hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <CardTitle className="text-base truncate">
                    {service.name}
                  </CardTitle>
                  {service.description && (
                    <CardDescription className="line-clamp-2">
                      {service.description}
                    </CardDescription>
                  )}
                </div>
                <Switch
                  checked={service.active}
                  onCheckedChange={(v) => handleToggle(service, v)}
                  disabled={isPending}
                  aria-label={`Activar ${service.name}`}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="size-4 text-muted-foreground" />
                <span className="text-sm">{service.durationMinutes} minutos</span>
                {!service.active && (
                  <Badge variant="secondary" className="ml-auto">
                    Inactivo
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditTarget(service)}
                  className="gap-1.5"
                >
                  <PencilIcon className="size-3.5" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget(service)}
                  className="gap-1.5 text-destructive hover:text-destructive"
                >
                  <Trash2Icon className="size-3.5" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create dialog */}
      <ServiceFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="Nuevo servicio"
        submitLabel="Crear servicio"
      />

      {/* Edit dialog */}
      {editTarget && (
        <ServiceFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdate}
          initialValues={{
            name: editTarget.name,
            description: editTarget.description ?? "",
            durationMinutes: editTarget.durationMinutes,
            active: editTarget.active,
          }}
          title="Editar servicio"
          submitLabel="Guardar cambios"
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. El servicio &ldquo;{deleteTarget?.name}&rdquo; será
              eliminado permanentemente. Las reservas existentes con este
              servicio no se eliminarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
