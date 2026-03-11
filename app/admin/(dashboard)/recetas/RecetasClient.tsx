"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RecipeImageUploader } from "./RecipeImageUploader";

import {
  type Recipe,
  type RecipeCategory,
  type RecipeTag,
  type RecipeIngredient,
  type RecipeStep,
} from "@/lib/db/schema";
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleRecipeStatus,
  type RecipeFormInput,
} from "./actions";

interface RecipeWithExtras extends Recipe {
  category?: RecipeCategory | null;
  tags?: RecipeTag[];
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
}

interface Props {
  initialRecipes: RecipeWithExtras[];
  categories: RecipeCategory[];
  tags: RecipeTag[];
}

const EMPTY_FORM: RecipeFormInput = {
  slug: "",
  title: "",
  excerpt: "",
  categoryId: 0,
  prepTimeMinutes: undefined,
  difficulty: "easy",
  servings: undefined,
  imageUrl: "",
  videoUrl: "",
  status: "draft",
  tagIds: [],
  ingredients: [],
  steps: [],
};

interface RecipeFormProps {
  onClose: () => void;
  onSubmit: (input: RecipeFormInput) => Promise<void>;
  initialValues?: RecipeFormInput;
  title: string;
  submitLabel: string;
  categories: RecipeCategory[];
  tags: RecipeTag[];
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function RecipeForm({
  onClose,
  onSubmit,
  initialValues = EMPTY_FORM,
  title,
  submitLabel,
  categories,
  tags,
}: RecipeFormProps) {
  const [form, setForm] = useState<RecipeFormInput>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange<K extends keyof RecipeFormInput>(
    field: K,
    value: RecipeFormInput[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function handleTitleChange(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug || slugify(value),
    }));
    setError(null);
  }

  function handleAddIngredient() {
    setForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          order: prev.ingredients.length,
          name: "",
          quantity: "",
          notes: "",
        },
      ],
    }));
  }

  function handleIngredientChange(
    index: number,
    field: "name" | "quantity" | "notes",
    value: string
  ) {
    setForm((prev) => {
      const next = [...prev.ingredients];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, ingredients: next };
    });
  }

  function handleRemoveIngredient(index: number) {
    setForm((prev) => {
      const next = prev.ingredients.filter((_, i) => i !== index);
      return { ...prev, ingredients: next.map((ing, i) => ({ ...ing, order: i })) };
    });
  }

  function handleAddStep() {
    setForm((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          order: prev.steps.length,
          title: `Paso ${prev.steps.length + 1}`,
          content: "",
        },
      ],
    }));
  }

  function handleStepChange(
    index: number,
    field: "title" | "content",
    value: string
  ) {
    setForm((prev) => {
      const next = [...prev.steps];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, steps: next };
    });
  }

  function handleRemoveStep(index: number) {
    setForm((prev) => {
      const next = prev.steps.filter((_, i) => i !== index);
      return { ...prev, steps: next.map((s, i) => ({ ...s, order: i })) };
    });
  }

  function handleToggleTag(tagId: number) {
    setForm((prev) => {
      const exists = prev.tagIds.includes(tagId);
      return {
        ...prev,
        tagIds: exists
          ? prev.tagIds.filter((id) => id !== tagId)
          : [...prev.tagIds, tagId],
      };
    });
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    if (!form.slug.trim()) {
      setError("El slug es obligatorio.");
      return;
    }
    if (!form.categoryId) {
      setError("La categoría es obligatoria.");
      return;
    }
    if (!form.ingredients.length) {
      setError("Agrega al menos un ingrediente.");
      return;
    }
    if (!form.steps.length) {
      setError("Agrega al menos un paso de preparación.");
      return;
    }

    startTransition(async () => {
      try {
        await onSubmit(form);
      } catch (err) {
        console.error(err);
        setError("Error al guardar la receta.");
        return;
      }
    });
  }

  const selectedTags = useMemo(
    () => tags.filter((t) => form.tagIds.includes(t.id)),
    [tags, form.tagIds]
  );

  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm md:p-6">
      <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Completa la información de la receta. Puedes guardarla como borrador
            y publicarla más adelante.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onClose}
          disabled={isPending}
        >
          Cerrar
        </Button>
      </div>

      <div className="grid gap-6 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
        <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Título <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ej. Bowl de avena y frutos rojos"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Slug <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="bowl-avena-frutos-rojos"
              />
              <p className="text-xs text-muted-foreground">
                Se usa en la URL pública de la receta.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Categoría <span className="text-destructive">*</span>
                </label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.categoryId || ""}
                  onChange={(e) =>
                    handleChange("categoryId", Number(e.target.value) || 0)
                  }
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Dificultad <span className="text-destructive">*</span>
                </label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.difficulty}
                  onChange={(e) =>
                    handleChange(
                      "difficulty",
                      e.target.value as RecipeFormInput["difficulty"]
                    )
                  }
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Tiempo aproximado (minutos)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.prepTimeMinutes ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "prepTimeMinutes",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="Ej. 20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Porciones</label>
                <Input
                  type="number"
                  min={1}
                  value={form.servings ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "servings",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="Ej. 2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Resumen breve (opcional)
              </label>
              <Textarea
                value={form.excerpt ?? ""}
                onChange={(e) => handleChange("excerpt", e.target.value)}
                placeholder="Descripción corta que se mostrará en el listado."
                rows={3}
              />
            </div>

            <RecipeImageUploader
              value={form.imageUrl ?? ""}
              onChange={(url) => handleChange("imageUrl", url)}
              recipeSlug={form.slug || form.title || "receta"}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium">
                  Ingredientes <span className="text-destructive">*</span>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleAddIngredient}
                >
                  Agregar ingrediente
                </Button>
              </div>
              {form.ingredients.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Agrega los ingredientes de la receta de forma individual.
                </p>
              )}
              <div className="space-y-3">
                {form.ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-md border p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_auto]"
                  >
                    <Input
                      placeholder="Ingrediente"
                      value={ing.name}
                      onChange={(e) =>
                        handleIngredientChange(index, "name", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Cantidad (opcional)"
                      value={ing.quantity ?? ""}
                      onChange={(e) =>
                        handleIngredientChange(index, "quantity", e.target.value)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                    <div className="sm:col-span-3">
                      <Input
                        placeholder="Notas (opcional, por ejemplo sustituciones)"
                        value={ing.notes ?? ""}
                        onChange={(e) =>
                          handleIngredientChange(index, "notes", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium">
                  Pasos de preparación{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleAddStep}
                >
                  Agregar paso
                </Button>
              </div>
              {form.steps.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Separa la preparación en pasos para una mejor lectura.
                </p>
              )}
              <div className="space-y-3">
                {form.steps.map((step, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-md border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        placeholder={`Paso ${index + 1}`}
                        value={step.title ?? ""}
                        onChange={(e) =>
                          handleStepChange(index, "title", e.target.value)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                    <Textarea
                      rows={3}
                      placeholder="Describe este paso de la preparación."
                      value={step.content}
                      onChange={(e) =>
                        handleStepChange(index, "content", e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Etiquetas especiales (vegana, sin gluten, etc.)
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = form.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        active
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-transparent bg-muted text-muted-foreground hover:border-purple-200"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">URL de video</label>
                <Input
                  value={form.videoUrl ?? ""}
                  onChange={(e) => handleChange("videoUrl", e.target.value)}
                  placeholder="https://www.instagram.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Puedes pegar aquí la URL del video de Instagram u
                  otra plataforma.
                </p>
              </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estado</label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.status === "published"}
                  onCheckedChange={(v) =>
                    handleChange("status", v ? "published" : "draft")
                  }
                />
                <span className="text-sm">
                  {form.status === "published"
                    ? "Publicada"
                    : "Guardada como borrador"}
                </span>
              </div>
            </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Vista previa
            </h3>
            <Card className="overflow-hidden border-purple-100 shadow-sm">
              {form.imageUrl ? (
                <div className="relative h-40 w-full bg-muted">
                  <Image
                    src={form.imageUrl}
                    alt={form.title || "Imagen de la receta"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center bg-muted text-xs text-muted-foreground">
                  Sin imagen
                </div>
              )}
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {form.title || "Título de la receta"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {categories.find((c) => c.id === form.categoryId)?.name ??
                        "Categoría"}
                      {form.prepTimeMinutes
                        ? ` · ${form.prepTimeMinutes} min`
                        : null}
                    </p>
                  </div>
                  {form.status === "published" ? (
                    <Badge variant="secondary" className="shrink-0">
                      Publicada
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0">
                      Borrador
                    </Badge>
                  )}
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="border-purple-200 bg-purple-50 text-[10px] font-medium text-purple-700"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {form.excerpt && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {form.excerpt}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onClose}
          type="button"
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isPending} type="button">
          {isPending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}

export function RecetasClient({ initialRecipes, categories, tags }: Props) {
  const [recipesState, setRecipesState] =
    useState<RecipeWithExtras[]>(initialRecipes);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeWithExtras | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<RecipeWithExtras | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!search.trim()) return recipesState;
    const term = search.toLowerCase();
    return recipesState.filter((r) => {
      const categoryName =
        categories.find((c) => c.id === r.categoryId)?.name ?? "";
      return (
        r.title.toLowerCase().includes(term) ||
        r.slug.toLowerCase().includes(term) ||
        categoryName.toLowerCase().includes(term)
      );
    });
  }, [recipesState, search, categories]);

  function openCreate() {
    setEditingRecipe(null);
    setShowForm(true);
  }

  function openEdit(recipe: RecipeWithExtras) {
    setEditingRecipe(recipe);
    setShowForm(true);
  }

  async function handleCreate(input: RecipeFormInput) {
    const result = await createRecipe(input);
    if (!result.success || !result.recipe) {
      toast.error(result.error ?? "Error al crear la receta.");
      return;
    }
    toast.success("Receta creada.");
    setShowForm(false);
    setRecipesState((prev) => [result.recipe as RecipeWithExtras, ...prev]);
  }

  async function handleUpdate(input: RecipeFormInput) {
    if (!editingRecipe) return;
    const result = await updateRecipe(editingRecipe.id, input);
    if (!result.success) {
      toast.error(result.error ?? "Error al actualizar la receta.");
      return;
    }
    toast.success("Receta actualizada.");
    setShowForm(false);
    startTransition(async () => {
      // Para simplificar, recargamos la página para refrescar datos relacionados
      window.location.reload();
    });
  }

  function handleToggleStatus(recipe: RecipeWithExtras) {
    const nextStatus = recipe.status === "published" ? "draft" : "published";
    setRecipesState((prev) =>
      prev.map((r) =>
        r.id === recipe.id ? { ...r, status: nextStatus } : r
      )
    );
    startTransition(async () => {
      const result = await toggleRecipeStatus(recipe.id, nextStatus);
      if (!result.success) {
        toast.error(result.error ?? "Error al cambiar el estado.");
        setRecipesState((prev) =>
          prev.map((r) =>
            r.id === recipe.id ? { ...r, status: recipe.status } : r
          )
        );
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteRecipe(deleteTarget.id);
      if (!result.success) {
        toast.error(result.error ?? "Error al eliminar la receta.");
      } else {
        toast.success("Receta eliminada.");
        setRecipesState((prev) =>
          prev.filter((r) => r.id !== deleteTarget.id)
        );
      }
      setDeleteTarget(null);
    });
  }

  function mapRecipeToForm(recipe: RecipeWithExtras): RecipeFormInput {
    const ingredients = (recipe.ingredients ?? []).map((ing, index) => ({
      id: ing.id,
      order: ing.order ?? index,
      name: ing.name,
      quantity: ing.quantity ?? undefined,
      notes: ing.notes ?? undefined,
    }));

    const steps = (recipe.steps ?? []).map((step, index) => ({
      id: step.id,
      order: step.order ?? index,
      title: step.title ?? undefined,
      content: step.content,
    }));

    const tagIds = (recipe.tags ?? []).map((t) => t.id);

    return {
      id: recipe.id,
      slug: recipe.slug,
      title: recipe.title,
      excerpt: recipe.excerpt ?? "",
      categoryId: recipe.categoryId,
      prepTimeMinutes: recipe.prepTimeMinutes ?? undefined,
      difficulty: recipe.difficulty,
      servings: recipe.servings ?? undefined,
      imageUrl: recipe.imageUrl ?? "",
      videoUrl: recipe.videoUrl ?? "",
      status: recipe.status,
      tagIds,
      ingredients,
      steps,
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3B0764] sm:text-3xl">
            Recetas
          </h1>
          <p className="text-muted-foreground mt-1">
            Biblioteca de recetas que se mostrarán en la web.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
            onClick={openCreate}
          >
            <PlusIcon className="size-4" />
            Nueva receta
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/recetas/categorias">Categorías</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/recetas/etiquetas">Etiquetas</Link>
          </Button>
        </div>
      </div>

      {showForm && (
        <RecipeForm
          onClose={() => {
            setShowForm(false);
            setEditingRecipe(null);
          }}
          onSubmit={editingRecipe ? handleUpdate : handleCreate}
          initialValues={
            editingRecipe ? mapRecipeToForm(editingRecipe) : EMPTY_FORM
          }
          title={editingRecipe ? "Editar receta" : "Nueva receta"}
          submitLabel={editingRecipe ? "Guardar cambios" : "Crear receta"}
          categories={categories}
          tags={tags}
        />
      )}

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por título, slug o categoría"
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {search
              ? "No hay recetas que coincidan con la búsqueda."
              : "Aún no has creado recetas. Comienza agregando la primera."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => {
            const category = categories.find(
              (c) => c.id === recipe.categoryId
            );
            return (
              <Card
                key={recipe.id}
                className="overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-32 w-full bg-muted">
                  {recipe.imageUrl ? (
                    <Image
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                </div>
                <CardHeader className="space-y-1 pb-2">
                  <CardTitle className="line-clamp-1 text-base">
                    {recipe.title}
                  </CardTitle>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">
                      {category?.name ?? "Sin categoría"}
                      {recipe.prepTimeMinutes
                        ? ` · ${recipe.prepTimeMinutes} min`
                        : null}
                    </span>
                    <span className="shrink-0">
                      {recipe.difficulty === "easy"
                        ? "Fácil"
                        : recipe.difficulty === "medium"
                        ? "Media"
                        : "Difícil"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        recipe.status === "published" ? "secondary" : "outline"
                      }
                    >
                      {recipe.status === "published"
                        ? "Publicada"
                        : "Borrador"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleStatus(recipe)}
                      disabled={isPending}
                    >
                      <Switch
                        checked={recipe.status === "published"}
                        onCheckedChange={() => handleToggleStatus(recipe)}
                      />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openEdit(recipe)}
                    >
                      <PencilIcon className="size-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(recipe)}
                    >
                      <Trash2Icon className="size-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar receta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La receta será eliminada y su
              imagen será removida del almacenamiento.
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

