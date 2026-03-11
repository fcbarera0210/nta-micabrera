"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRut } from "@/lib/validation/rut";
import { getPatientById } from "./actions";
import { getReservationsByPatientId } from "../reservas/actions";
import type { ReservationWithService } from "../reservas/actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

interface Props {
  patientId: number;
  open: boolean;
  onClose: () => void;
}

export function PatientSessionHistoryDialog({
  patientId,
  open,
  onClose,
}: Props) {
  const [patient, setPatient] = useState<{ id: number; rut: string; name: string; email: string; phone: string } | null>(null);
  const [reservations, setReservations] = useState<ReservationWithService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !patientId) return;
    setLoading(true);
    Promise.all([
      getPatientById(patientId),
      getReservationsByPatientId(patientId),
    ])
      .then(([p, list]) => {
        setPatient(p ?? null);
        setReservations(list ?? []);
      })
      .finally(() => setLoading(false));
  }, [open, patientId]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial de sesiones</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8">Cargando…</p>
        ) : patient ? (
          <>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-1 text-sm">
              <p className="font-medium">{patient.name}</p>
              <p className="text-muted-foreground">
                RUT: {formatRut(patient.rut)} · {patient.email} · {patient.phone}
              </p>
            </div>
            <div className="flex-1 overflow-auto min-h-0">
              {reservations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6">
                  No hay reservas registradas para este paciente.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Notas paciente</TableHead>
                      <TableHead>Notas profesional</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((r) => {
                      const dateObj = new Date(r.date + "T12:00:00");
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">
                            {format(dateObj, "dd/MM/yyyy", { locale: es })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.startTime} – {r.endTime}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.service?.name ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {STATUS_LABELS[r.status] ?? r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                            {r.notes || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                            {r.professionalNotes || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-8">
            Paciente no encontrado.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
