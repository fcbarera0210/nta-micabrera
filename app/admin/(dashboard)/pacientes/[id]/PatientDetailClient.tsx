"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
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
import { Label } from "@/components/ui/label";
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
import { ArrowLeftIcon, FileTextIcon, PencilIcon, CalculatorIcon } from "lucide-react";
import { toast } from "sonner";
import { formatRut } from "@/lib/validation/rut";
import { isValidRut } from "@/lib/validation/rut";
import { isValidChilePhone } from "@/lib/validation/phone";
import type { Patient } from "@/lib/db/schema";
import type { ReservationWithService } from "../../reservas/actions";
import {
  updatePatient,
  getPatientDataHistory,
  type PatientInput,
} from "../actions";
import type { PatientDataHistoryRecord } from "@/lib/db/schema";
import { updateReservationProfessionalNotes } from "../../reservas/actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

const EMPTY_SELECT_VALUE = "_none_";

const ACTIVITY_LEVELS = [
  { value: EMPTY_SELECT_VALUE, label: "No indicado" },
  { value: "sedentario", label: "Sedentario" },
  { value: "ligero", label: "Ligero (1-2 días/semana)" },
  { value: "moderado", label: "Moderado (3-5 días/semana)" },
  { value: "activo", label: "Activo (6-7 días/semana)" },
  { value: "muy_activo", label: "Muy activo" },
];

const GENDERS = [
  { value: EMPTY_SELECT_VALUE, label: "No indicado" },
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
  { value: "otro", label: "Otro" },
];

function computeBmi(weightKg: number | null, heightCm: number | null): string {
  if (weightKg == null || heightCm == null || heightCm <= 0) return "—";
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return bmi.toFixed(1);
}

/** Convierte "yyyy-mm-dd" a "dd/mm/yyyy" para mostrar */
function birthDateToDisplay(ymd: string | undefined): string {
  if (!ymd?.trim()) return "";
  const [y, m, d] = ymd.trim().split("-");
  if (!y || !m || !d) return ymd;
  const day = d.padStart(2, "0");
  const month = m.padStart(2, "0");
  return `${day}/${month}/${y}`;
}

/** Parsea "dd/mm/yyyy" o "d/m/yyyy" y retorna "yyyy-mm-dd" o undefined si es inválido */
function parseBirthDateDdMmYyyy(input: string): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  const parts = trimmed.split("/").map((p) => p.replace(/\D/g, ""));
  if (parts.length !== 3) return undefined;
  const [d, m, y] = parts;
  if (!d || !m || !y) return undefined;
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y.length === 2 ? `20${y}` : y, 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return undefined;
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31)
    return undefined;
  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  return `${year}-${monthStr}-${dayStr}`;
}

interface Props {
  patient: Patient;
  initialReservations: ReservationWithService[];
  initialDataHistory: PatientDataHistoryRecord[];
}

export function PatientDetailClient({
  patient: initialPatient,
  initialReservations,
  initialDataHistory,
}: Props) {
  const [patient, setPatient] = useState(initialPatient);
  const [reservations, setReservations] = useState(initialReservations);
  const [dataHistory, setDataHistory] = useState(initialDataHistory);
  const [form, setForm] = useState<PatientInput>({
    rut: formatRut(initialPatient.rut) || initialPatient.rut,
    name: initialPatient.name,
    email: initialPatient.email,
    phone: initialPatient.phone,
    weightKg: initialPatient.weightKg ?? undefined,
    heightCm: initialPatient.heightCm ?? undefined,
    imc: initialPatient.imc ?? undefined,
    birthDate: initialPatient.birthDate ?? undefined,
    gender: initialPatient.gender ?? undefined,
    medicalHistory: initialPatient.medicalHistory ?? undefined,
    nutritionGoals: initialPatient.nutritionGoals ?? undefined,
    activityLevel: initialPatient.activityLevel ?? undefined,
    clinicalNotes: initialPatient.clinicalNotes ?? undefined,
  });
  const [patientError, setPatientError] = useState<string | null>(null);
  const [notesDialogReservation, setNotesDialogReservation] =
    useState<ReservationWithService | null>(null);
  const [notesDialogValue, setNotesDialogValue] = useState("");
  const [birthDateInput, setBirthDateInput] = useState(() =>
    birthDateToDisplay(initialPatient.birthDate ?? undefined)
  );
  const [isImcManual, setIsImcManual] = useState(initialPatient.imc != null);
  const [isPendingPatient, startTransitionPatient] = useTransition();
  const [isPendingNotes, startTransitionNotes] = useTransition();

  const bmiComputed = useMemo(() => {
    const w = form.weightKg != null ? Number(form.weightKg) : null;
    const h = form.heightCm != null ? Number(form.heightCm) : null;
    return computeBmi(w, h);
  }, [form.weightKg, form.heightCm]);

  const bmiDisplay = isImcManual
    ? (form.imc != null ? String(form.imc) : "")
    : bmiComputed;

  function handleSavePatient() {
    if (!form.rut.trim()) {
      setPatientError("El RUT es obligatorio.");
      return;
    }
    if (!isValidRut(form.rut)) {
      setPatientError("RUT inválido (verifique formato y dígito verificador).");
      return;
    }
    if (!form.name.trim()) {
      setPatientError("El nombre es obligatorio.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setPatientError("Ingresa un correo electrónico válido.");
      return;
    }
    if (!form.phone.trim()) {
      setPatientError("El teléfono es obligatorio.");
      return;
    }
    if (!isValidChilePhone(form.phone)) {
      setPatientError("El teléfono debe tener 9 dígitos numéricos (ej: 987654321).");
      return;
    }
    setPatientError(null);
    const payload: PatientInput = {
      ...form,
      weightKg: form.weightKg ?? null,
      heightCm: form.heightCm ?? null,
      imc: isImcManual ? (form.imc ?? null) : null,
      birthDate: form.birthDate?.trim() || null,
      gender: form.gender?.trim() || null,
      medicalHistory: form.medicalHistory?.trim() || null,
      nutritionGoals: form.nutritionGoals?.trim() || null,
      activityLevel: form.activityLevel?.trim() || null,
      clinicalNotes: form.clinicalNotes?.trim() || null,
    };
    startTransitionPatient(async () => {
      const result = await updatePatient(patient.id, payload);
      if (!result.success) {
        setPatientError(result.error ?? "Error al guardar.");
        return;
      }
      toast.success("Datos del paciente actualizados.");
      setPatient((prev) => ({
        ...prev,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        weightKg: payload.weightKg ?? null,
        heightCm: payload.heightCm ?? null,
        imc: payload.imc ?? null,
        birthDate: payload.birthDate ?? null,
        gender: payload.gender ?? null,
        medicalHistory: payload.medicalHistory ?? null,
        nutritionGoals: payload.nutritionGoals ?? null,
        activityLevel: payload.activityLevel ?? null,
        clinicalNotes: payload.clinicalNotes ?? null,
      }));
      const nextHistory = await getPatientDataHistory(patient.id);
      setDataHistory(nextHistory);
    });
  }

  function openNotesDialog(r: ReservationWithService) {
    setNotesDialogReservation(r);
    setNotesDialogValue(r.professionalNotes ?? "");
  }

  function saveProfessionalNotes() {
    if (!notesDialogReservation) return;
    const value = notesDialogValue.trim() || null;
    startTransitionNotes(async () => {
      const result = await updateReservationProfessionalNotes(
        notesDialogReservation.id,
        value
      );
      if (!result.success) {
        toast.error(result.error ?? "Error al guardar notas.");
        return;
      }
      setReservations((prev) =>
        prev.map((r) =>
          r.id === notesDialogReservation.id
            ? { ...r, professionalNotes: value }
            : r
        )
      );
      setNotesDialogReservation(null);
      toast.success("Notas guardadas.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/pacientes" aria-label="Volver a pacientes">
            <ArrowLeftIcon className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">
            Ficha clínica
          </h1>
          <p className="text-muted-foreground mt-1">
            {patient.name} · {formatRut(patient.rut)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del paciente</CardTitle>
          <CardDescription>
            Datos de contacto y datos antropométricos / nutrición.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>RUT</Label>
              <Input value={form.rut} disabled className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  setPatientError(null);
                }}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Correo <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }));
                  setPatientError(null);
                }}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono <span className="text-destructive">*</span></Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => {
                  setForm((f) => ({ ...f, phone: e.target.value }));
                  setPatientError(null);
                }}
                placeholder="987654321"
              />
              <p className="text-xs text-muted-foreground">
                9 dígitos, sin espacios (ej: 987654321)
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold mb-4">Datos de nutrición</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ej: 70"
                  value={form.weightKg ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      weightKg: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Altura (cm)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ej: 165"
                  value={form.heightCm ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      heightCm: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>IMC</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={isImcManual ? "Ej: 22.5" : ""}
                    value={bmiDisplay}
                    disabled={!isImcManual}
                    className="font-mono"
                    onChange={(e) =>
                      isImcManual &&
                      setForm((f) => ({
                        ...f,
                        imc:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title={
                      isImcManual
                        ? "Usar IMC automático (calculado desde peso y altura)"
                        : "Editar IMC manualmente"
                    }
                    onClick={() => {
                      if (isImcManual) {
                        setIsImcManual(false);
                        setForm((f) => ({ ...f, imc: undefined }));
                      } else {
                        setIsImcManual(true);
                        const w =
                          form.weightKg != null ? Number(form.weightKg) : null;
                        const h =
                          form.heightCm != null ? Number(form.heightCm) : null;
                        const computed = computeBmi(w, h);
                        setForm((f) => ({
                          ...f,
                          imc:
                            computed !== "—"
                              ? parseFloat(computed)
                              : undefined,
                        }));
                      }
                    }}
                  >
                    {isImcManual ? (
                      <CalculatorIcon className="size-4" aria-label="Automático" />
                    ) : (
                      <PencilIcon className="size-4" aria-label="Editar" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isImcManual
                    ? "Edición manual. Clic en el ícono para volver a cálculo automático."
                    : "Calculado desde peso y altura. Clic en el ícono para editar manualmente."}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={birthDateInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setBirthDateInput(raw);
                    const parsed = parseBirthDateDdMmYyyy(raw);
                    setForm((f) => ({ ...f, birthDate: parsed ?? undefined }));
                  }}
                  onBlur={() => {
                    if (form.birthDate) setBirthDateInput(birthDateToDisplay(form.birthDate));
                  }}
                />
                <p className="text-xs text-muted-foreground">Formato: dd/mm/yyyy (ej: 15/03/1990)</p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Género</Label>
                <Select
                  value={form.gender ?? EMPTY_SELECT_VALUE}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      gender: v === EMPTY_SELECT_VALUE ? undefined : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nivel de actividad física</Label>
                <Select
                  value={form.activityLevel ?? EMPTY_SELECT_VALUE}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      activityLevel: v === EMPTY_SELECT_VALUE ? undefined : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_LEVELS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 mt-4 sm:grid-cols-1">
              <div className="space-y-1.5">
                <Label>Antecedentes médicos / Alergias / Condiciones</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Enfermedades crónicas, alergias, intolerancias, medicación…"
                  value={form.medicalHistory ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, medicalHistory: e.target.value || undefined }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Objetivos nutricionales</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Objetivos del paciente (bajar peso, ganar masa, mejorar hábitos…)"
                  value={form.nutritionGoals ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nutritionGoals: e.target.value || undefined }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notas clínicas</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Otras notas relevantes para el seguimiento"
                  value={form.clinicalNotes ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clinicalNotes: e.target.value || undefined }))
                  }
                />
              </div>
            </div>
          </div>

          {patientError && (
            <p className="text-sm text-destructive">{patientError}</p>
          )}
          <Button onClick={handleSavePatient} disabled={isPendingPatient}>
            {isPendingPatient ? "Guardando…" : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de cambios (datos de nutrición)</CardTitle>
          <CardDescription>
            Registro de cada guardado o actualización de datos de nutrición para seguir la evolución del paciente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dataHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Aún no hay registros. Los cambios se guardan al actualizar los datos de nutrición y hacer clic en &quot;Guardar cambios&quot;.
            </p>
          ) : (
            <ul className="space-y-3">
              {dataHistory.map((record) => {
                const recordBmi =
                  record.imc != null
                    ? String(record.imc)
                    : computeBmi(
                        record.weightKg ?? null,
                        record.heightCm ?? null
                      );
                const hasTextFields =
                  (record.medicalHistory?.trim() ?? "") !== "" ||
                  (record.nutritionGoals?.trim() ?? "") !== "" ||
                  (record.clinicalNotes?.trim() ?? "") !== "";
                return (
                  <li key={record.id}>
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {format(
                          new Date(record.recordedAt),
                          "d 'de' MMMM yyyy, HH:mm",
                          { locale: es }
                        )}
                      </p>
                      <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
                        <span>
                          <strong>Peso:</strong>{" "}
                          {record.weightKg != null ? `${record.weightKg} kg` : "—"}
                        </span>
                        <span>
                          <strong>Altura:</strong>{" "}
                          {record.heightCm != null ? `${record.heightCm} cm` : "—"}
                        </span>
                        <span>
                          <strong>IMC:</strong> {recordBmi}
                        </span>
                        <span>
                          <strong>Género:</strong>{" "}
                          {record.gender ? record.gender : "—"}
                        </span>
                        <span>
                          <strong>Actividad:</strong>{" "}
                          {record.activityLevel ? record.activityLevel : "—"}
                        </span>
                      </div>
                      {record.birthDate && (
                        <p className="text-sm">
                          <strong>Fecha nac.:</strong>{" "}
                          {format(new Date(record.birthDate + "T12:00:00"), "dd/MM/yyyy", {
                            locale: es,
                          })}
                        </p>
                      )}
                      {hasTextFields && (
                        <div className="mt-2 space-y-1 border-t pt-2 text-sm text-muted-foreground">
                          {record.medicalHistory?.trim() && (
                            <p>
                              <strong>Antecedentes:</strong>{" "}
                              <span className="whitespace-pre-wrap">
                                {record.medicalHistory}
                              </span>
                            </p>
                          )}
                          {record.nutritionGoals?.trim() && (
                            <p>
                              <strong>Objetivos:</strong>{" "}
                              <span className="whitespace-pre-wrap">
                                {record.nutritionGoals}
                              </span>
                            </p>
                          )}
                          {record.clinicalNotes?.trim() && (
                            <p>
                              <strong>Notas clínicas:</strong>{" "}
                              <span className="whitespace-pre-wrap">
                                {record.clinicalNotes}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de sesiones</CardTitle>
          <CardDescription>
            Consultas realizadas. Notas del paciente y del profesional visibles; puedes editar las notas del profesional por sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay reservas registradas para este paciente.
            </p>
          ) : (
            <ul className="space-y-4">
              {reservations.map((r) => {
                const dateObj = new Date(r.date + "T12:00:00");
                return (
                  <li key={r.id}>
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-base">
                              {format(dateObj, "EEEE d 'de' MMMM yyyy", { locale: es })}
                            </CardTitle>
                            <CardDescription>
                              {r.startTime} – {r.endTime} · {r.service?.name ?? "—"} ·{" "}
                              {STATUS_LABELS[r.status] ?? r.status}
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openNotesDialog(r)}
                            title="Editar notas del profesional"
                          >
                            <FileTextIcon className="size-3.5 mr-1.5" />
                            Editar notas
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                            Notas del paciente
                          </p>
                          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">
                            {r.notes?.trim() ? r.notes : "—"}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                            Notas del profesional
                          </p>
                          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">
                            {r.professionalNotes?.trim()
                              ? r.professionalNotes
                              : "—"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={notesDialogReservation != null}
        onOpenChange={(open) => !open && setNotesDialogReservation(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Notas del profesional</DialogTitle>
            <DialogDescription>
              {notesDialogReservation && (
                <>
                  Sesión del{" "}
                  {format(
                    new Date(notesDialogReservation.date + "T12:00:00"),
                    "d 'de' MMMM yyyy",
                    { locale: es }
                  )}{" "}
                  · {notesDialogReservation.service?.name ?? "—"}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Notas de la sesión, observaciones, plan alimentario…"
              value={notesDialogValue}
              onChange={(e) => setNotesDialogValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotesDialogReservation(null)}
              disabled={isPendingNotes}
            >
              Cancelar
            </Button>
            <Button onClick={saveProfessionalNotes} disabled={isPendingNotes}>
              {isPendingNotes ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
