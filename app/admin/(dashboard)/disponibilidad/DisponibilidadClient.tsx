"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, Trash2Icon, SaveIcon } from "lucide-react";
import { sileo } from "sileo";
import {
  saveAvailability,
  type WeeklyAvailability,
  type DayAvailability,
  type BlockInput,
  type Modality,
} from "./actions";
import { DAY_LABELS } from "@/lib/availability/slots";
import { intervalsOverlap } from "@/lib/availability/slots";

interface Props {
  presencialData: WeeklyAvailability;
  onlineData: WeeklyAvailability;
}

type ModalityState = {
  presencial: DayAvailability[];
  online: DayAvailability[];
};

function cloneDays(days: DayAvailability[]): DayAvailability[] {
  return days.map((d) => ({
    ...d,
    blocks: d.blocks.map((b) => ({ ...b })),
  }));
}

interface BlockDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (block: BlockInput) => void;
  existingBlocks: BlockInput[];
  editingBlock?: BlockInput;
}

function BlockDialog({
  open,
  onClose,
  onConfirm,
  existingBlocks,
  editingBlock,
}: BlockDialogProps) {
  const [start, setStart] = useState(editingBlock?.startTime ?? "09:00");
  const [end, setEnd] = useState(editingBlock?.endTime ?? "10:00");
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setError(null);
      onClose();
    }
  }

  function handleConfirm() {
    if (start >= end) {
      setError("La hora de inicio debe ser menor que la hora de término.");
      return;
    }

    const newBlock = { startTime: start, endTime: end };
    const conflict = existingBlocks.findIndex(
      (b) =>
        b !== editingBlock &&
        intervalsOverlap(newBlock, b)
    );

    if (conflict !== -1) {
      const cb = existingBlocks[conflict];
      setError(
        `Solapamiento con bloque existente: ${cb.startTime} – ${cb.endTime}`
      );
      return;
    }

    setError(null);
    onConfirm(newBlock);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {editingBlock ? "Editar bloque" : "Agregar bloque"}
          </DialogTitle>
          <DialogDescription>
            Define el rango horario del bloque de atención.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Hora inicio</label>
              <Input
                type="time"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setError(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Hora término</label>
              <Input
                type="time"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setError(null);
                }}
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            {editingBlock ? "Guardar cambios" : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DayCardProps {
  day: DayAvailability;
  onToggle: (enabled: boolean) => void;
  onAddBlock: (block: BlockInput) => void;
  onRemoveBlock: (index: number) => void;
}

function DayCard({ day, onToggle, onAddBlock, onRemoveBlock }: DayCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">{DAY_LABELS[day.dayOfWeek]}</CardTitle>
          <CardDescription>
            {day.enabled
              ? `${day.blocks.length} bloque${day.blocks.length !== 1 ? "s" : ""} configurado${day.blocks.length !== 1 ? "s" : ""}`
              : "Día desactivado"}
          </CardDescription>
        </div>
        <Switch
          checked={day.enabled}
          onCheckedChange={onToggle}
          aria-label={`Activar ${DAY_LABELS[day.dayOfWeek]}`}
        />
      </CardHeader>

      {day.enabled && (
        <CardContent className="space-y-3">
          {day.blocks.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay bloques. Agrega al menos uno para recibir reservas este día.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {day.blocks.map((block, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="flex items-center gap-1.5 py-1 px-2 text-xs"
              >
                <span>
                  {block.startTime} – {block.endTime}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveBlock(idx)}
                  className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Eliminar bloque"
                >
                  <Trash2Icon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="gap-1.5"
          >
            <PlusIcon className="size-4" />
            Agregar bloque
          </Button>

          <BlockDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onConfirm={onAddBlock}
            existingBlocks={day.blocks}
          />
        </CardContent>
      )}
    </Card>
  );
}

interface ModalityPanelProps {
  modality: Modality;
  days: DayAvailability[];
  onChange: (days: DayAvailability[]) => void;
}

function ModalityPanel({ modality, days, onChange }: ModalityPanelProps) {
  function updateDay(index: number, updated: DayAvailability) {
    const next = [...days];
    next[index] = updated;
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {days.map((day, i) => (
        <DayCard
          key={day.dayOfWeek}
          day={day}
          onToggle={(enabled) =>
            updateDay(i, { ...day, enabled, blocks: enabled ? day.blocks : [] })
          }
          onAddBlock={(block) =>
            updateDay(i, { ...day, blocks: [...day.blocks, block] })
          }
          onRemoveBlock={(idx) =>
            updateDay(i, {
              ...day,
              blocks: day.blocks.filter((_, bi) => bi !== idx),
            })
          }
        />
      ))}
    </div>
  );
}

export function DisponibilidadClient({ presencialData, onlineData }: Props) {
  const [state, setState] = useState<ModalityState>({
    presencial: cloneDays(presencialData.days),
    online: cloneDays(onlineData.days),
  });

  const [activeModality, setActiveModality] = useState<Modality>("presencial");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const [res1, res2] = await Promise.all([
        saveAvailability({ modality: "presencial", days: state.presencial }),
        saveAvailability({ modality: "online", days: state.online }),
      ]);

      if (!res1.success || !res2.success) {
        sileo.error({
          title: "No se pudo guardar la disponibilidad",
          description:
            res1.error ??
            res2.error ??
            "Ocurrió un error al guardar la configuración de disponibilidad.",
        });
      } else {
        sileo.success({
          title: "Disponibilidad guardada",
          description: "Los horarios de atención se guardaron correctamente.",
        });
      }
    });
  }

  function handleReset() {
    setState({
      presencial: cloneDays(presencialData.days),
      online: cloneDays(onlineData.days),
    });
    sileo.info({
      title: "Cambios descartados",
      description: "Se restauró la disponibilidad anterior sin guardar cambios.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">
            Disponibilidad
          </h1>
          <p className="text-muted-foreground mt-1">
            Configura los horarios de atención por modalidad y día de la semana.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isPending}>
            Descartar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <SaveIcon className="size-4" />
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>

      <Tabs
        value={activeModality}
        onValueChange={(v) => setActiveModality(v as Modality)}
      >
        <TabsList>
          <TabsTrigger value="presencial">Presencial</TabsTrigger>
          <TabsTrigger value="online">Online</TabsTrigger>
        </TabsList>

        <TabsContent value="presencial" className="mt-4">
          <ModalityPanel
            modality="presencial"
            days={state.presencial}
            onChange={(days) =>
              setState((prev) => ({ ...prev, presencial: days }))
            }
          />
        </TabsContent>

        <TabsContent value="online" className="mt-4">
          <ModalityPanel
            modality="online"
            days={state.online}
            onChange={(days) =>
              setState((prev) => ({ ...prev, online: days }))
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
