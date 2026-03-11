"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { sileo } from "sileo";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { type RecipeCategory } from "@/lib/db/schema";
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
  createRecipeCategory,
  updateRecipeCategory,
  deleteRecipeCategory,
  toggleRecipeCategoryActive,
  type RecipeCategoryInput,
} from "./actions";

interface Props {
  initialCategories: RecipeCategory[];
}

const EMPTY_INPUT: RecipeCategoryInput = {
  name: "",
  slug: "",
  order: null,
  active: true,
};

export function CategoriasClient({ initialCategories }: Props) {
  const [categories, setCategories] =
    useState<RecipeCategory[]>(initialCategories);
  const [form, setForm] = useState<RecipeCategoryInput>(EMPTY_INPUT);
  const [editing, setEditing] = useState<RecipeCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecipeCategory | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange<K extends keyof RecipeCategoryInput>(
    field: K,
    value: RecipeCategoryInput[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function startCreate() {
    setEditing(null);
    setForm(EMPTY_INPUT);
  }

  function startEdit(category: RecipeCategory) {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      order: category.order ?? null,
      active: category.active,
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
        const result = await updateRecipeCategory(editing.id, form);
        if (!result.success) {
          sileo.error({
            title: "No se pudo actualizar la categoría",
            description:
              result.error ?? "Ocurrió un error al actualizar la categoría.",
          });
          return;
        }
        sileo.success({
          title: "Categoría actualizada",
          description: "Los cambios de la categoría se guardaron correctamente.",
        });
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editing.id
              ? {
                  ...c,
                  name: form.name.trim(),
                  slug: form.slug.trim().toLowerCase(),
                  order: form.order ?? null,
                  active: form.active ?? true,
                }
              : c
          )
        );
      } else {
        const result = await createRecipeCategory(form);
        if (!result.success) {
          sileo.error({
            title: "No se pudo crear la categoría",
            description:
              result.error ?? "Ocurrió un error al crear la categoría.",
          });
          return;
        }
        sileo.success({
          title: "Categoría creada",
          description: "La categoría se creó correctamente.",
        });
        // Para mantenerlo simple, recargamos la página y dejamos que el server la ordene.
        window.location.reload();
      }
      setEditing(null);
      setForm(EMPTY_INPUT);
    });
  }

  function handleToggleActive(category: RecipeCategory, active: boolean) {
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, active } : c))
    );
    startTransition(async () => {
      const result = await toggleRecipeCategoryActive(category.id, active);
      if (!result.success) {
        sileo.error({
          title: "No se pudo cambiar el estado",
          description:
            result.error ?? "Ocurrió un error al cambiar el estado de la categoría.",
        });
        setCategories((prev) =>
          prev.map((c) =>
            c.id === category.id ? { ...c, active: !active } : c
          )
        );
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteRecipeCategory(deleteTarget.id);
      if (!result.success) {
        sileo.error({
          title: "No se pudo eliminar la categoría",
          description:
            result.error ?? "Ocurrió un error al eliminar la categoría.",
        });
      } else {
        sileo.success({
          title: "Categoría eliminada",
          description: "La categoría se eliminó correctamente.",
        });
        setCategories((prev) =>
          prev.filter((c) => c.id !== deleteTarget.id)
        );
      }
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">
            Categorías de recetas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define las categorías que se usarán para filtrar y organizar las
            recetas en la web.
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
            Nueva categoría
          </Button>
        </div>
      </div>

      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base">
            {editing ? "Editar categoría" : "Nueva categoría"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Nombre <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ej. Desayunos"
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
                placeholder="desayunos"
              />
              <p className="text-xs text-muted-foreground">
                Se usa en filtros y URL; sin espacios ni acentos.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Orden</label>
              <Input
                type="number"
                value={form.order ?? ""}
                onChange={(e) =>
                  handleChange(
                    "order",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.active ?? true}
                onCheckedChange={(v) => handleChange("active", v)}
              />
              <span className="text-sm">
                {form.active ?? true
                  ? "Visible en filtros"
                  : "Oculta en filtros"}
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
                : "Crear categoría"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Listado de categorías</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              Aún no hay categorías. Crea la primera arriba.
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {category.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {category.slug}
                      {typeof category.order === "number"
                        ? ` · Orden ${category.order}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={category.active}
                        onCheckedChange={(v) =>
                          handleToggleActive(category, v)
                        }
                        disabled={isPending}
                      />
                      <span className="text-xs text-muted-foreground">
                        {category.active ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      type="button"
                      onClick={() => startEdit(category)}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      type="button"
                      onClick={() => setDeleteTarget(category)}
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
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las recetas que usen esta
              categoría dejarán de tenerla asignada.
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

