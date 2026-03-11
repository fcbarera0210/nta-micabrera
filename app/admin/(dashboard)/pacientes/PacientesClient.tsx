"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, PencilIcon, Trash2Icon, HistoryIcon } from "lucide-react";
import { sileo } from "sileo";
import { formatRut } from "@/lib/validation/rut";
import { isValidRut } from "@/lib/validation/rut";
import { isValidChilePhone } from "@/lib/validation/phone";
import {
  listPatients,
  createPatient,
  updatePatient,
  deletePatient,
  type PatientWithReservationCount,
  type PatientInput,
} from "./actions";

const EMPTY_FORM: PatientInput = {
  rut: "",
  name: "",
  email: "",
  phone: "",
};

interface Props {
  initialPatients: PatientWithReservationCount[];
}

export function PacientesClient({ initialPatients }: Props) {
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState(initialPatients);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PatientInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refreshPatients() {
    const list = await listPatients({ search: search || undefined });
    setPatients(list);
    setFiltered(list);
  }

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(patients);
      return;
    }
    const term = search.toLowerCase();
    setFiltered(
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term) ||
          p.rut.toLowerCase().includes(term.replace(/\.|-/g, "")) ||
          p.phone.includes(search.replace(/\D/g, ""))
      )
    );
  }, [search, patients]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(p: PatientWithReservationCount) {
    setEditingId(p.id);
    setForm({
      rut: formatRut(p.rut) || p.rut,
      name: p.name,
      email: p.email,
      phone: p.phone,
    });
    setError(null);
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.rut.trim()) {
      setError("El RUT es obligatorio.");
      return;
    }
    if (!isValidRut(form.rut)) {
      setError("RUT inválido (verifique formato y dígito verificador).");
      return;
    }
    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    if (!form.phone.trim()) {
      setError("El teléfono es obligatorio.");
      return;
    }
    if (!isValidChilePhone(form.phone)) {
      setError("El teléfono debe tener 9 dígitos numéricos (ej: 987654321).");
      return;
    }
    startTransition(async () => {
      const result = editingId
        ? await updatePatient(editingId, form)
        : await createPatient(form);
      if (!result.success) {
        setError(result.error ?? "Error al guardar.");
        return;
      }
      sileo.success({
        title: editingId ? "Paciente actualizado" : "Paciente creado",
        description: editingId
          ? "Los datos del paciente se actualizaron correctamente."
          : "El paciente se creó correctamente.",
      });
      setDialogOpen(false);
      refreshPatients();
    });
  }

  function handleDelete() {
    if (deleteId == null) return;
    startTransition(async () => {
      const result = await deletePatient(deleteId);
      setDeleteId(null);
      if (!result.success) {
        sileo.error({
          title: "No se pudo eliminar el paciente",
          description: result.error ?? "Ocurrió un error al eliminar el paciente.",
        });
        return;
      }
      sileo.success({
        title: "Paciente eliminado",
        description: "El paciente se eliminó correctamente.",
      });
      refreshPatients();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">
            Pacientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de pacientes. También se agregan al crear reservas.
          </p>
        </div>
        <Button
          className="transition-transform duration-200 hover:scale-105 active:scale-95"
          onClick={openCreate}
        >
          <PlusIcon className="size-4 mr-2" />
          Agregar paciente
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nombre, email o RUT"
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="transition-all duration-200 hover:shadow-md">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground text-sm">
                {search
                  ? "No hay pacientes que coincidan con la búsqueda."
                  : "No hay pacientes. Agrega uno manualmente o crea una reserva."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RUT</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-center">Reservas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">
                      {formatRut(p.rut)}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.email}
                    </TableCell>
                    <TableCell className="text-sm">{p.phone}</TableCell>
                    <TableCell className="text-center">
                      {p.reservationCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Ver ficha clínica"
                          asChild
                        >
                          <Link href={`/admin/pacientes/${p.id}`}>
                            <HistoryIcon className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Editar"
                          onClick={() => openEdit(p)}
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Eliminar"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar paciente" : "Nuevo paciente"}
            </DialogTitle>
            <DialogDescription>
              RUT, nombre, correo y teléfono (9 dígitos) son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                RUT <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="12.345.678-9"
                value={form.rut}
                onChange={(e) => {
                  setForm((f) => ({ ...f, rut: e.target.value }));
                  setError(null);
                }}
                disabled={!!editingId}
              />
              {editingId && (
                <p className="text-xs text-muted-foreground">
                  El RUT no se puede modificar.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Nombre <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Nombre completo"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  setError(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Correo <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                placeholder="email@ejemplo.com"
                value={form.email}
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }));
                  setError(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Teléfono <span className="text-destructive">*</span>
              </label>
              <Input
                type="tel"
                placeholder="987654321"
                value={form.phone}
                onChange={(e) => {
                  setForm((f) => ({ ...f, phone: e.target.value }));
                  setError(null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                9 dígitos, sin espacios (ej: 987654321)
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Guardando…" : editingId ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las reservas asociadas quedarán sin
              vincular a un paciente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
