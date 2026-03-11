"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { sileo } from "sileo";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { type RecipeTag } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  createRecipeTag,
  updateRecipeTag,
  deleteRecipeTag,
  toggleRecipeTagActive,
  type RecipeTagInput,
} from "./actions";

interface Props {
  initialTags: RecipeTag[];
}

const EMPTY_INPUT: RecipeTagInput = {
  name: "",
  slug: "",
  description: "",
  active: true,
};

export function EtiquetasClient({ initialTags }: Props) {
  const [tags, setTags] = useState<RecipeTag[]>(initialTags);
  const [form, setForm] = useState<RecipeTagInput>(EMPTY_INPUT);
  const [editing, setEditing] = useState<RecipeTag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecipeTag | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange<K extends keyof RecipeTagInput>(
    field: K,
    value: RecipeTagInput[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function startCreate() {
    setEditing(null);
    setForm(EMPTY_INPUT);
  }

  function startEdit(tag: RecipeTag) {
    setEditing(tag);
    setForm({
      name: tag.name,
      slug: tag.slug,
      description: tag.description ?? "",
      active: tag.active,
    });
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!form.slug.trim()) {
      setError("El slug es obligatorio.");
      return;
    }

    startTransition(async () => {
      if (editing) {
        const result = await updateRecipeTag(editing.id, form);
        if (!result.success) {
          sileo.error({
            title: "No se pudo actualizar la etiqueta",
            description:
              result.error ?? "Ocurrió un error al actualizar la etiqueta.",
          });
          return;
        }
        sileo.success({
          title: "Etiqueta actualizada",
          description: "Los cambios de la etiqueta se guardaron correctamente.",
        });
        setTags((prev) =>
          prev.map((t) =>
            t.id === editing.id
              ? {
                  ...t,
                  name: form.name.trim(),
                  slug: form.slug.trim().toLowerCase(),
                  description: form.description?.trim() || null,
                  active: form.active ?? true,
                }
              : t
          )
        );
      } else {
        const result = await createRecipeTag(form);
        if (!result.success) {
          sileo.error({
            title: "No se pudo crear la etiqueta",
            description:
              result.error ?? "Ocurrió un error al crear la etiqueta.",
          });
          return;
        }
        sileo.success({
          title: "Etiqueta creada",
          description: "La etiqueta se creó correctamente.",
        });
        window.location.reload();
      }
      setEditing(null);
      setForm(EMPTY_INPUT);
    });
  }

  function handleToggleActive(tag: RecipeTag, active: boolean) {
    setTags((prev) =>
      prev.map((t) => (t.id === tag.id ? { ...t, active } : t))
    );
    startTransition(async () => {
      const result = await toggleRecipeTagActive(tag.id, active);
      if (!result.success) {
        sileo.error({
          title: "No se pudo cambiar el estado",
          description:
            result.error ?? "Ocurrió un error al cambiar el estado de la etiqueta.",
        });
        setTags((prev) =>
          prev.map((t) =>
            t.id === tag.id ? { ...t, active: !active } : t
          )
        );
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteRecipeTag(deleteTarget.id);
      if (!result.success) {
        sileo.error({
          title: "No se pudo eliminar la etiqueta",
          description:
            result.error ?? "Ocurrió un error al eliminar la etiqueta.",
        });
      } else {
        sileo.success({
          title: "Etiqueta eliminada",
          description: "La etiqueta se eliminó correctamente.",
        });
        setTags((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">
            Etiquetas especiales
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define etiquetas como “Vegana”, “Sin gluten”, “Sin azúcar” y otras
            características para marcar las recetas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/recetas">Volver a recetas</Link>
          </Button>
          <Button
            onClick={startCreate}
            className="gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <PlusIcon className="size-4" />
            Nueva etiqueta
          </Button>
        </div>
      </div>

      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base">
            {editing ? "Editar etiqueta" : "Nueva etiqueta"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Nombre <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ej. Vegana"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Slug <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  handleChange("slug", e.target.value.toLowerCase())
                }
                placeholder="vegana"
              />
              <p className="text-xs text-muted-foreground">
                Se usa internamente; sin espacios ni acentos.
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Descripción (opcional)
            </label>
            <Input
              value={form.description ?? ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Ej. Sin ingredientes de origen animal."
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.active ?? true}
                onCheckedChange={(v) => handleChange("active", v)}
              />
              <span className="text-sm">
                {form.active ?? true ? "Disponible" : "Oculta"}
              </span>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            {editing && (
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(EMPTY_INPUT);
                  setError(null);
                }}
                disabled={isPending}
              >
                Cancelar edición
              </Button>
            )}
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? "Guardando…"
                : editing
                ? "Guardar cambios"
                : "Crear etiqueta"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Listado de etiquetas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tags.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              Aún no hay etiquetas. Crea la primera arriba (por ejemplo:
              “Vegana”, “Sin gluten”, “Sin azúcar”).
            </p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{tag.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tag.slug}
                      {tag.description ? ` · ${tag.description}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tag.active}
                        onCheckedChange={(v) => handleToggleActive(tag, v)}
                        disabled={isPending}
                      />
                      <span className="text-xs text-muted-foreground">
                        {tag.active ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      type="button"
                      onClick={() => startEdit(tag)}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      type="button"
                      onClick={() => setDeleteTarget(tag)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar etiqueta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las recetas que usen esta
              etiqueta la perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
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

