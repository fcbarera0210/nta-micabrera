"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  FilterIcon,
  HistoryIcon,
  FileTextIcon,
} from "lucide-react";
import { toast } from "sonner";
import { type Service } from "@/lib/db/schema";
import { type TimeSlot } from "@/lib/availability/slots";
import { AdminCalendar } from "@/components/admin/admin-calendar";
import {
  getAvailableSlots,
  createReservation,
  listReservations,
  updateReservationStatus,
  updateReservationProfessionalNotes,
  type ReservationWithService,
  type Modality,
  type ReservationInput,
} from "./actions";
import { PatientSessionHistoryDialog } from "../pacientes/PatientSessionHistoryDialog";
import { isValidRut } from "@/lib/validation/rut";
import { isValidChilePhone } from "@/lib/validation/phone";

interface Props {
  initialServices: Service[];
  initialReservations: ReservationWithService[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
};

const MODALITY_LABELS: Record<Modality, string> = {
  presencial: "Presencial",
  online: "Online",
};

// ── New Reservation Dialog ────────────────────────────────────────────────────

interface NewReservationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (reservation: ReservationInput) => void;
  slot: TimeSlot;
  date: string;
  modality: Modality;
  service: Service;
}

function NewReservationDialog({
  open,
  onClose,
  onCreated,
  slot,
  date,
  modality,
  service,
}: NewReservationDialogProps) {
  const [rut, setRut] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [professionalNotes, setProfessionalNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setRut("");
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
      setProfessionalNotes("");
      setError(null);
      onClose();
    }
  }

  function handleSubmit() {
    if (!rut.trim()) {
      setError("El RUT es obligatorio.");
      return;
    }
    if (!isValidRut(rut)) {
      setError("RUT inválido (verifique formato y dígito verificador).");
      return;
    }
    if (!name.trim()) {
      setError("El nombre del paciente es obligatorio.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    if (!phone.trim()) {
      setError("El teléfono es obligatorio.");
      return;
    }
    if (!isValidChilePhone(phone)) {
      setError("El teléfono debe tener 9 dígitos numéricos (ej: 987654321).");
      return;
    }

    const input: ReservationInput = {
      serviceId: service.id,
      modality,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      patientRut: rut.trim(),
      patientName: name.trim(),
      patientEmail: email.trim(),
      patientPhone: phone.trim(),
      notes: notes.trim() || undefined,
      professionalNotes: professionalNotes.trim() || undefined,
    };

    startTransition(async () => {
      const result = await createReservation(input);
      if (!result.success) {
        setError(result.error ?? "Error al crear la reserva.");
        return;
      }
      toast.success("Reserva creada correctamente.");
      onCreated(input);
      handleOpenChange(false);
    });
  }

  const dateObj = new Date(date + "T12:00:00");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
          <DialogDescription>
            {format(dateObj, "EEEE d 'de' MMMM yyyy", { locale: es })} —{" "}
            {slot.startTime} a {slot.endTime} · {service.name} ·{" "}
            {MODALITY_LABELS[modality]}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              RUT <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="12.345.678-9"
              value={rut}
              onChange={(e) => {
                setRut(e.target.value);
                setError(null);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nombre paciente <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Correo electrónico <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              placeholder="paciente@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
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
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
            />
            <p className="text-xs text-muted-foreground">9 dígitos, sin espacios (ej: 987654321)</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notas del paciente (opcional)</label>
            <Input
              placeholder="Comentarios del paciente al reservar…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notas del profesional (opcional)</label>
            <Input
              placeholder="Notas internas para la consulta…"
              value={professionalNotes}
              onChange={(e) => setProfessionalNotes(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Guardando…" : "Crear reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Calendar Tab ──────────────────────────────────────────────────────────────

interface CalendarTabProps {
  services: Service[];
  onReservationCreated: () => void;
}

function CalendarTab({ services, onReservationCreated }: CalendarTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedModality, setSelectedModality] = useState<Modality>("presencial");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<TimeSlot | null>(null);

  const dateString = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null;

  const selectedService = services.find(
    (s) => s.id.toString() === selectedServiceId
  );

  const loadSlots = useCallback(async () => {
    if (!dateString || !selectedServiceId) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const result = await getAvailableSlots(
        dateString,
        selectedModality,
        parseInt(selectedServiceId, 10)
      );
      setSlots(result);
    } finally {
      setLoadingSlots(false);
    }
  }, [dateString, selectedModality, selectedServiceId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const today = startOfDay(new Date());

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        {/* Calendar */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="size-4" />
              Selecciona una fecha
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <AdminCalendar
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date)}
              disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
            />
          </CardContent>
        </Card>

        {/* Filters + Slots */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FilterIcon className="size-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Modalidad
                </label>
                <Select
                  value={selectedModality}
                  onValueChange={(v) => setSelectedModality(v as Modality)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Servicio
                </label>
                <Select
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name} ({s.durationMinutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClockIcon className="size-4" />
                {selectedDate
                  ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es })
                  : "Horarios disponibles"}
              </CardTitle>
              {selectedDate && selectedServiceId && (
                <CardDescription>
                  {MODALITY_LABELS[selectedModality]} · {selectedService?.name}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedDate && (
                <p className="text-sm text-muted-foreground">
                  Selecciona una fecha en el calendario.
                </p>
              )}
              {selectedDate && !selectedServiceId && (
                <p className="text-sm text-muted-foreground">
                  Selecciona un servicio para ver los horarios.
                </p>
              )}
              {selectedDate && selectedServiceId && loadingSlots && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Cargando horarios…
                </p>
              )}
              {selectedDate && selectedServiceId && !loadingSlots && slots.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay horarios disponibles para este día y modalidad.
                </p>
              )}
              {!loadingSlots && slots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <Button
                      key={`${slot.startTime}-${slot.endTime}`}
                      variant={slot.available ? "outline" : "ghost"}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setBookingSlot(slot)}
                      className={
                        slot.available
                          ? "border-primary/40 hover:border-primary hover:bg-primary/10 text-xs"
                          : "opacity-40 cursor-not-allowed text-xs line-through"
                      }
                    >
                      {slot.startTime} – {slot.endTime}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New reservation dialog */}
      {bookingSlot && selectedDate && selectedService && dateString && (
        <NewReservationDialog
          open={!!bookingSlot}
          onClose={() => setBookingSlot(null)}
          slot={bookingSlot}
          date={dateString}
          modality={selectedModality}
          service={selectedService}
          onCreated={() => {
            setBookingSlot(null);
            loadSlots();
            onReservationCreated();
          }}
        />
      )}
    </div>
  );
}

// ── List Tab ──────────────────────────────────────────────────────────────────

interface ListTabProps {
  reservations: ReservationWithService[];
  onStatusChange: () => void;
  onOpenHistory: (patientId: number) => void;
}

function ListTab({ reservations: initial, onStatusChange, onOpenHistory }: ListTabProps) {
  const [items, setItems] = useState(initial);
  const [filterModality, setFilterModality] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notesDialogReservationId, setNotesDialogReservationId] = useState<number | null>(null);
  const [notesDialogValue, setNotesDialogValue] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const filtered = items.filter((r) => {
    if (filterModality !== "all" && r.modality !== filterModality) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  function handleStatusChange(
    id: number,
    status: "pending" | "confirmed" | "cancelled"
  ) {
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    startTransition(async () => {
      const result = await updateReservationStatus(id, status);
      if (!result.success) {
        toast.error(result.error ?? "Error al actualizar estado.");
        setItems(initial);
      } else {
        onStatusChange();
      }
    });
  }

  function openNotesDialog(r: ReservationWithService) {
    setNotesDialogReservationId(r.id);
    setNotesDialogValue(r.professionalNotes ?? "");
  }

  function saveProfessionalNotes() {
    if (notesDialogReservationId == null) return;
    const value = notesDialogValue.trim() || null;
    startTransition(async () => {
      const result = await updateReservationProfessionalNotes(notesDialogReservationId, value);
      if (!result.success) {
        toast.error(result.error ?? "Error al guardar notas.");
        return;
      }
      setItems((prev) =>
        prev.map((r) =>
          r.id === notesDialogReservationId ? { ...r, professionalNotes: value } : r
        )
      );
      setNotesDialogReservationId(null);
      onStatusChange();
      toast.success("Notas guardadas.");
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterModality} onValueChange={setFilterModality}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Modalidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las modalidades</SelectItem>
            <SelectItem value="presencial">Presencial</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} reserva{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground text-sm">
                No hay reservas que coincidan con los filtros.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Modalidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="max-w-[120px]">Notas prof.</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const dateObj = new Date(r.date + "T12:00:00");
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{r.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.patientEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.service?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(dateObj, "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.startTime} – {r.endTime}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {MODALITY_LABELS[r.modality as Modality]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_VARIANTS[r.status] ?? "secondary"}
                          className="text-xs"
                        >
                          {STATUS_LABELS[r.status] ?? r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[120px]">
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {r.professionalNotes || "—"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-xs mt-0.5"
                          disabled={isPending}
                          onClick={() => openNotesDialog(r)}
                          title="Editar notas del profesional"
                        >
                          <FileTextIcon className="size-3.5 mr-0.5" />
                          Editar
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          {r.patientId != null && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2"
                              disabled={isPending}
                              onClick={() => onOpenHistory(r.patientId!)}
                              title="Ver historial del paciente"
                            >
                              <HistoryIcon className="size-3.5 mr-0.5" />
                              Historial
                            </Button>
                          )}
                          {r.status !== "confirmed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2"
                              disabled={isPending}
                              onClick={() => handleStatusChange(r.id, "confirmed")}
                            >
                              Confirmar
                            </Button>
                          )}
                          {r.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                              disabled={isPending}
                              onClick={() => handleStatusChange(r.id, "cancelled")}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={notesDialogReservationId != null}
        onOpenChange={(open) => !open && setNotesDialogReservationId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notas del profesional</DialogTitle>
            <DialogDescription>
              Notas internas para esta consulta (solo visibles en el admin).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Notas de la sesión…"
              value={notesDialogValue}
              onChange={(e) => setNotesDialogValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotesDialogReservationId(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={saveProfessionalNotes} disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ReservasClient({ initialServices, initialReservations }: Props) {
  const [reservations, setReservations] = useState(initialReservations);
  const [historyPatientId, setHistoryPatientId] = useState<number | null>(null);

  async function refreshReservations() {
    const updated = await listReservations();
    setReservations(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">
            Reservas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona citas y disponibilidad de horarios.
          </p>
        </div>
      </div>

      {initialServices.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <UserIcon className="size-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              No hay servicios. Crea al menos uno en{" "}
              <a
                href="/admin/servicios"
                className="font-medium underline underline-offset-2"
              >
                Servicios
              </a>{" "}
              para poder agendar reservas.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="calendario" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendario">
            <CalendarIcon className="size-4 mr-1.5" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="lista">
            Lista
            {reservations.filter((r) => r.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-xs px-1.5 py-0">
                {reservations.filter((r) => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario">
          <CalendarTab
            services={initialServices}
            onReservationCreated={refreshReservations}
          />
        </TabsContent>

        <TabsContent value="lista">
          <ListTab
            reservations={reservations}
            onStatusChange={refreshReservations}
            onOpenHistory={setHistoryPatientId}
          />
        </TabsContent>
      </Tabs>

      {historyPatientId != null && (
        <PatientSessionHistoryDialog
          patientId={historyPatientId}
          open={true}
          onClose={() => setHistoryPatientId(null)}
        />
      )}
    </div>
  );
}
