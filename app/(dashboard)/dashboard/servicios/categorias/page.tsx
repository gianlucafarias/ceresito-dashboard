"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Briefcase,
  Check,
  CheckCircle,
  ChevronDown,
  Edit,
  Eye,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  apiClient,
  APICategoryResponse,
  CategoriesListResponse,
  CategoryGroup,
  CategoryType,
} from "../_lib/api-client";
import { CATEGORY_ICON_OPTIONS, resolveCategoryIcon } from "../_lib/category-icons";

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  type: CategoryType;
  group: CategoryGroup;
  parentId: string;
  icon: string;
  image: string;
  active: boolean;
  showOnHome: boolean;
};

const DEFAULT_FORM: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  type: "area",
  group: "oficios",
  parentId: "",
  icon: "",
  image: "",
  active: true,
  showOnHome: false,
};

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getServicesBaseUrl() {
  return (process.env.NEXT_PUBLIC_SERVICES_API_URL || "").replace(/\/$/, "");
}

function resolveCategoryImageSrc(src?: string | null) {
  if (!src) {
    return null;
  }

  const normalizedSrc = src.trim();
  if (!normalizedSrc) {
    return null;
  }

  if (/^https?:\/\//i.test(normalizedSrc)) {
    return normalizedSrc;
  }

  if (normalizedSrc.startsWith("/uploads/")) {
    const servicesBaseUrl = getServicesBaseUrl();
    return servicesBaseUrl ? `${servicesBaseUrl}${normalizedSrc}` : normalizedSrc;
  }

  return normalizedSrc;
}

function CategoryImagePreview({ src, alt }: { src?: string | null; alt: string }) {
  const resolvedSrc = resolveCategoryImageSrc(src);

  if (!resolvedSrc) {
    return (
      <div className="flex h-20 w-28 items-center justify-center rounded-md border border-dashed bg-muted text-xs text-muted-foreground">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="relative h-20 w-28 overflow-hidden rounded-md border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resolvedSrc} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

function canCategoryShowOnHome(type: CategoryType, group: CategoryGroup) {
  return type === "area" || group === "profesiones";
}

function canCategoryManageIcon(type: CategoryType, group: CategoryGroup) {
  return type === "area" || group === "profesiones";
}

function getCategoryKindLabel(type: CategoryType, group: CategoryGroup) {
  if (group === "profesiones") {
    return "Profesion";
  }

  return type === "area" ? "Area" : "Subcategoria";
}

function CategoryIconPreview({ icon, slug }: { icon?: string | null; slug?: string | null }) {
  const Icon = resolveCategoryIcon(icon, slug);

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted">
      <Icon className="h-5 w-5 text-foreground" />
    </div>
  );
}

function findCategoryIconOption(value?: string | null) {
  return CATEGORY_ICON_OPTIONS.find((option) => option.value === value);
}

function CategoryIconPicker({
  id,
  value,
  slug,
  onChange,
}: {
  id: string;
  value: string;
  slug?: string | null;
  onChange: (nextValue: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedOption = findCategoryIconOption(value);
  const SelectedIcon = resolveCategoryIcon(value || null, slug);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = CATEGORY_ICON_OPTIONS.filter((option) => {
    if (!normalizedQuery) return true;
    return `${option.label} ${option.value}`.toLowerCase().includes(normalizedQuery);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
          <SelectedIcon className="h-5 w-5 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {selectedOption?.label || "Sin icono explicito"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {value || "Se usara fallback por slug si existe"}
          </p>
        </div>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Limpiar
          </Button>
        ) : null}
      </div>

      <Input
        id={`${id}-search`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar icono por nombre o clave"
      />

      <ScrollArea className="h-64 rounded-lg border">
        <div className="grid gap-2 p-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onChange("")}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              !value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <Briefcase className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">Sin icono explicito</span>
              <span className="block truncate text-xs text-muted-foreground">
                Usa el fallback por slug
              </span>
            </span>
            <Check className={`h-4 w-4 shrink-0 ${!value ? "opacity-100" : "opacity-0"}`} />
          </button>

          {filteredOptions.map((option) => {
            const Icon = resolveCategoryIcon(option.value, null);
            const isSelected = value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{option.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {option.value}
                  </span>
                </span>
                <Check
                  className={`h-4 w-4 shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`}
                />
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<CategoriesListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<APICategoryResponse | null>(null);
  const [detailItem, setDetailItem] = useState<APICategoryResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<CategoryFormState>(DEFAULT_FORM);

  const availableAreas = categories?.areas || [];
  const oficiosSubcategories = categories?.subcategoriesOficios || [];
  const profesionesSubcategories = categories?.subcategoriesProfesiones || [];

  const oficioAreas = availableAreas.map((area) => ({
    area,
    subcategories: oficiosSubcategories.filter(
      (subcategory) => (subcategory.parentId || subcategory.areaId) === area.id
    ),
  }));

  const canSaveCreate =
    formData.name.trim().length > 0 &&
    (formData.slug.trim().length > 0 || generateSlug(formData.name).length > 0) &&
    !(formData.type === "subcategory" && formData.group === "oficios" && !formData.parentId);

  const activeDetail = detailItem || selectedItem;

  async function loadCategories(showLoader = true) {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      const response = await apiClient.listCategories();
      if (!response.success) {
        setError(response.message || "Error al cargar categorias");
        return;
      }

      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Error de conexion al cargar categorias");
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function resetForm(overrides?: Partial<CategoryFormState>) {
    setFormData({ ...DEFAULT_FORM, ...overrides });
  }

  function openCreateArea() {
    setSelectedItem(null);
    setNotice(null);
    resetForm({ type: "area", group: "oficios", parentId: "" });
    setIsCreateDialogOpen(true);
  }

  function openCreateProfession() {
    setSelectedItem(null);
    setNotice(null);
    resetForm({ type: "subcategory", group: "profesiones", parentId: "" });
    setIsCreateDialogOpen(true);
  }

  function openCreateSubcategory(parentId?: string) {
    setSelectedItem(null);
    setNotice(null);
    resetForm({
      type: "subcategory",
      group: "oficios",
      parentId: parentId || "",
    });
    setIsCreateDialogOpen(true);
  }

  function handleTypeChange(value: CategoryType) {
    setFormData((current) => {
      const nextGroup = value === "area" ? "oficios" : current.group;

      return {
        ...current,
        type: value,
        group: nextGroup,
        parentId: value === "area" ? "" : current.parentId,
        icon: canCategoryManageIcon(value, nextGroup) ? current.icon : "",
        showOnHome: canCategoryShowOnHome(value, nextGroup) ? current.showOnHome : false,
      };
    });
  }

  function handleGroupChange(value: CategoryGroup) {
    setFormData((current) => {
      const nextType = value === "profesiones" ? "subcategory" : current.type;

      return {
        ...current,
        group: value,
        type: nextType,
        parentId: value === "profesiones" ? "" : current.parentId,
        icon: canCategoryManageIcon(nextType, value) ? current.icon : "",
        showOnHome: canCategoryShowOnHome(nextType, value) ? current.showOnHome : false,
      };
    });
  }

  function handleEdit(item: APICategoryResponse) {
    setNotice(null);
    setSelectedItem(item);
    resetForm({
      name: item.name,
      slug: item.slug,
      description: item.description || "",
      type: item.type,
      group: item.group,
      parentId: item.parentId || item.areaId || "",
      icon: canCategoryManageIcon(item.type, item.group) ? item.icon || "" : "",
      image: item.image || "",
      active: item.active,
      showOnHome: item.showOnHome || false,
    });
    setIsEditDialogOpen(true);
  }

  async function handleView(item: APICategoryResponse) {
    setSelectedItem(item);
    setDetailItem(null);
    setIsViewDialogOpen(true);
    setIsDetailLoading(true);

    try {
      const response = await apiClient.getCategory(item.id);
      if (response.success) {
        setDetailItem(response.data);
      } else {
        setError(response.message || "No se pudo cargar el detalle");
      }
    } catch (err) {
      console.error("Error fetching category detail:", err);
      setError("Error al cargar el detalle de la categoria");
    } finally {
      setIsDetailLoading(false);
    }
  }

  function handleDelete(item: APICategoryResponse) {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!selectedItem) return;

    try {
      setIsSaving(true);
      setError(null);
      setNotice(null);

      const response = await apiClient.deleteCategory(selectedItem.id, { deactivate: true });
      if (!response.success) {
        setError(response.message || "Error al ocultar la categoria");
        return;
      }

      await loadCategories(false);
      setNotice("Categoria actualizada correctamente.");
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error("Error deleting category:", err);
      setError("Error al ocultar la categoria");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveCreate() {
    try {
      setIsSaving(true);
      setError(null);
      setNotice(null);

      const response = await apiClient.createCategory({
        type: formData.type,
        name: formData.name.trim(),
        slug: (formData.slug.trim() || generateSlug(formData.name)).trim(),
        group: formData.group,
        parentId:
          formData.type === "subcategory" && formData.group === "oficios"
            ? formData.parentId || null
            : null,
        description: formData.description.trim() || undefined,
        icon: canCategoryManageIcon(formData.type, formData.group) ? formData.icon || null : null,
        image: formData.image.trim() || undefined,
        active: formData.active,
        showOnHome: canCategoryShowOnHome(formData.type, formData.group)
          ? formData.showOnHome
          : false,
      });

      if (!response.success) {
        setError(response.message || "Error al crear la categoria");
        return;
      }

      await loadCategories(false);
      setNotice("Categoria creada correctamente.");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error creating category:", err);
      setError("Error al crear la categoria");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!selectedItem) return;

    try {
      setIsSaving(true);
      setError(null);
      setNotice(null);

      const response = await apiClient.updateCategory(selectedItem.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: canCategoryManageIcon(selectedItem.type, selectedItem.group)
          ? formData.icon || null
          : null,
        image: formData.image.trim() || null,
        active: formData.active,
        showOnHome: canCategoryShowOnHome(selectedItem.type, selectedItem.group)
          ? formData.showOnHome
          : false,
        parentId:
          selectedItem.type === "subcategory" && selectedItem.group === "oficios"
            ? formData.parentId || null
            : undefined,
      });

      if (!response.success) {
        setError(response.message || "Error al actualizar la categoria");
        return;
      }

      await loadCategories(false);
      setNotice("Categoria actualizada correctamente.");
      setIsEditDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error("Error updating category:", err);
      setError("Error al actualizar la categoria");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setError(null);

      const grantResponse = await apiClient.createUploadGrant({
        context: "register",
        type: "image",
      });

      if (!grantResponse.success) {
        setError(grantResponse.message || "No se pudo generar el token de upload");
        return;
      }

      const uploadResponse = await apiClient.uploadFile(file, {
        type: "image",
        token: grantResponse.data.token,
      });

      if (!uploadResponse.success) {
        setError(uploadResponse.message || "No se pudo subir la imagen");
        return;
      }

      setFormData((current) => ({ ...current, image: uploadResponse.data.url }));
      setNotice("Imagen subida correctamente.");
    } catch (err) {
      console.error("Error uploading category image:", err);
      setError("Error al subir la imagen");
    } finally {
      setIsUploadingImage(false);
    }
  }

  function renderImageField(idPrefix: string) {
    return (
      <div className="grid gap-3">
        <Label htmlFor={`${idPrefix}-image-url`}>Imagen</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <CategoryImagePreview src={formData.image} alt={formData.name || "Categoria"} />
          <div className="flex-1 space-y-3">
            <Input
              id={`${idPrefix}-image-file`}
              type="file"
              accept="image/*"
              onChange={handleImageSelected}
              disabled={isUploadingImage}
            />
            <Input
              id={`${idPrefix}-image-url`}
              value={formData.image}
              onChange={(event) =>
                setFormData((current) => ({ ...current, image: event.target.value }))
              }
              placeholder="URL publica o ruta devuelta por el backend"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData((current) => ({ ...current, image: "" }))}
                disabled={!formData.image}
              >
                Quitar imagen
              </Button>
              {isUploadingImage ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo a R2...
                </div>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              El panel usa el flujo de upload del backend de servicios. Si la imagen queda en una ruta local, el preview la resuelve contra ese host.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderPresentationField(idPrefix: string) {
    const showHomeToggle = canCategoryShowOnHome(formData.type, formData.group);
    const showIconControls = canCategoryManageIcon(formData.type, formData.group);

    return (
      <div className="grid gap-4 rounded-xl border p-4">
        {showIconControls ? (
          <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
            <CategoryIconPreview icon={formData.icon || null} slug={formData.slug || null} />
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-icon`}>Icono</Label>
              <CategoryIconPicker
                id={`${idPrefix}-icon`}
                value={formData.icon}
                slug={formData.slug || null}
                onChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    icon: value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Hay {CATEGORY_ICON_OPTIONS.length} iconos disponibles. Busca por nombre y elige con preview real.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            Las subcategorias de oficio heredan el icono del area padre. No se configura icono propio.
          </div>
        )}

        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-show-home`}>Mostrar en el inicio</Label>
            <p className="text-xs text-muted-foreground">
              {showHomeToggle
                ? formData.group === "profesiones"
                  ? "Si esta activo, la categoria puede aparecer en el bloque principal de profesiones."
                  : "Si esta activo, el area puede aparecer en el carrusel del inicio."
                : "Solo las areas de oficios y las categorias de profesiones pueden mostrarse en el inicio."}
            </p>
          </div>
          <Switch
            id={`${idPrefix}-show-home`}
            checked={showHomeToggle ? formData.showOnHome : false}
            onCheckedChange={(checked) =>
              setFormData((current) => ({
                ...current,
                showOnHome: checked,
              }))
            }
            disabled={!showHomeToggle}
          />
        </div>
      </div>
    );
  }

  if (error && !categories && !isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="font-medium text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion de Categorias</h2>
          <p className="text-muted-foreground">
            Administra areas de oficios, subcategorias y profesiones con el contrato real del backend.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadCategories()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Recargar
          </Button>
          <Button variant="outline" onClick={openCreateProfession}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva profesion
          </Button>
          <Button onClick={openCreateArea}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva area
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="font-medium text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {notice ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="font-medium text-emerald-700">{notice}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de areas</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : categories?.stats.totalAreas || 0}
            </div>
            <p className="text-xs text-muted-foreground">Solo para oficios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subcategorias de oficios</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : categories?.stats.totalSubcategoriesOficios || 0}
            </div>
            <p className="text-xs text-muted-foreground">Subcategorias de cada area</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesiones</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : categories?.stats.totalSubcategoriesProfesiones || 0}
            </div>
            <p className="text-xs text-muted-foreground">Categorias planas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total catalogo</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : categories?.stats.totalCategories || 0}
            </div>
            <p className="text-xs text-muted-foreground">Areas y subcategorias</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando categorias...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-500" />
                Areas de Oficios
                <Badge variant="secondary">{oficioAreas.length}</Badge>
              </CardTitle>
              <CardDescription>
                Cada area puede tener imagen, edicion propia y subcategorias administrables.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {oficioAreas.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No hay areas cargadas.
                </div>
              ) : null}

              {oficioAreas.map(({ area, subcategories }) => (
                <Collapsible
                  key={area.id}
                  open={Boolean(openAreas[area.id])}
                  onOpenChange={(open) =>
                    setOpenAreas((current) => ({ ...current, [area.id]: open }))
                  }
                  className="rounded-xl border p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-2">
                        <CategoryImagePreview src={area.image} alt={area.name} />
                        <CategoryIconPreview icon={area.icon} slug={area.slug} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">{area.name}</h3>
                          <Badge variant={area.active ? "default" : "secondary"}>
                            {area.active ? "Activa" : "Inactiva"}
                          </Badge>
                          {area.showOnHome ? <Badge variant="outline">Inicio</Badge> : null}
                          <Badge variant="outline">{subcategories.length} subcategorias</Badge>
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">{area.slug}</p>
                        {area.description ? (
                          <p className="text-sm text-muted-foreground">{area.description}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Sin descripcion cargada.</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subcategories.length > 0 ? (
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm">
                            {openAreas[area.id] ? "Ocultar subcategorias" : "Ver subcategorias"}
                            <ChevronDown
                              className={`ml-2 h-4 w-4 transition-transform ${
                                openAreas[area.id] ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      ) : null}
                      <Button variant="outline" size="sm" onClick={() => openCreateSubcategory(area.id)}>
                        <Plus className="mr-2 h-3 w-3" />
                        Subcategoria
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void handleView(area)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(area)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(area)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {subcategories.length === 0 ? (
                    <div className="mt-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                      Esta area todavia no tiene subcategorias.
                    </div>
                  ) : null}

                  <CollapsibleContent className="mt-4 space-y-2">
                    {subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{subcategory.name}</p>
                              <Badge variant={subcategory.active ? "default" : "secondary"}>
                                {subcategory.active ? "Activa" : "Inactiva"}
                              </Badge>
                              {subcategory.showOnHome ? <Badge variant="outline">Inicio</Badge> : null}
                              <Badge variant="outline">{subcategory.professionalCount || 0} servicios</Badge>
                            </div>
                            <p className="font-mono text-xs text-muted-foreground">{subcategory.slug}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => void handleView(subcategory)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(subcategory)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(subcategory)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-green-500" />
                    Profesiones
                    <Badge variant="secondary">{profesionesSubcategories.length}</Badge>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={openCreateProfession}>
                    <Plus className="mr-2 h-3 w-3" />
                    Nueva profesion
                  </Button>
                </div>
                <CardDescription>Categorias planas para servicios profesionales.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {profesionesSubcategories.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No hay profesiones cargadas.
                  </div>
                ) : null}

                {profesionesSubcategories.map((profession) => (
                  <div key={profession.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <CategoryImagePreview src={profession.image} alt={profession.name} />
                        <CategoryIconPreview icon={profession.icon} slug={profession.slug} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{profession.name}</p>
                          <Badge variant={profession.active ? "default" : "secondary"}>
                            {profession.active ? "Activa" : "Inactiva"}
                          </Badge>
                          {profession.showOnHome ? <Badge variant="outline">Inicio</Badge> : null}
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">{profession.slug}</p>
                        <p className="text-sm text-muted-foreground">{profession.professionalCount || 0} servicios asociados</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => void handleView(profession)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(profession)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(profession)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva categoria</DialogTitle>
            <DialogDescription>
              Crea una nueva area de oficios o una subcategoria/profesion.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="create-type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value: CategoryType) => handleTypeChange(value)}>
                  <SelectTrigger id="create-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.group === "oficios" ? <SelectItem value="area">Area</SelectItem> : null}
                    <SelectItem value="subcategory">
                      {formData.group === "profesiones" ? "Profesion" : "Subcategoria"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-group">Grupo</Label>
                <Select value={formData.group} onValueChange={(value: CategoryGroup) => handleGroupChange(value)}>
                  <SelectTrigger id="create-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oficios">Oficios</SelectItem>
                    <SelectItem value="profesiones">Profesiones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === "subcategory" && formData.group === "oficios" ? (
              <div className="grid gap-2">
                <Label htmlFor="create-parent">Area padre</Label>
                <Select value={formData.parentId || undefined} onValueChange={(value) => setFormData((current) => ({ ...current, parentId: value }))}>
                  <SelectTrigger id="create-parent">
                    <SelectValue placeholder="Selecciona un area" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="create-name">Nombre</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setFormData((current) => ({ ...current, name, slug: current.slug || generateSlug(name) }));
                }}
                placeholder="Nombre de la categoria"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-slug">Slug</Label>
              <Input
                id="create-slug"
                value={formData.slug}
                onChange={(event) => setFormData((current) => ({ ...current, slug: event.target.value }))}
                placeholder="slug-url"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-description">Descripcion</Label>
              <Textarea
                id="create-description"
                rows={3}
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                placeholder="Descripcion visible para la categoria"
              />
            </div>

            {renderImageField("create")}
            {renderPresentationField("create")}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSaveCreate} disabled={isSaving || !canSaveCreate}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Crear
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar categoria</DialogTitle>
            <DialogDescription>
              La edicion sigue el contrato disponible hoy: nombre, descripcion, imagen, estado y padre.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Input
                  value={
                    selectedItem ? getCategoryKindLabel(selectedItem.type, selectedItem.group) : ""
                  }
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label>Grupo</Label>
                <Input value={selectedItem?.group === "oficios" ? "Oficios" : "Profesiones"} disabled />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input id="edit-name" value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input id="edit-slug" value={formData.slug} disabled />
            </div>

            {selectedItem?.type === "subcategory" && selectedItem.group === "oficios" ? (
              <div className="grid gap-2">
                <Label htmlFor="edit-parent">Area padre</Label>
                <Select value={formData.parentId || undefined} onValueChange={(value) => setFormData((current) => ({ ...current, parentId: value }))}>
                  <SelectTrigger id="edit-parent">
                    <SelectValue placeholder="Selecciona un area" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descripcion</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
              />
            </div>

            {renderImageField("edit")}
            {renderPresentationField("edit")}

            <div className="flex items-center gap-2">
              <input
                id="edit-active"
                type="checkbox"
                checked={formData.active}
                onChange={(event) => setFormData((current) => ({ ...current, active: event.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-active">Categoria activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving || !formData.name.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) setDetailItem(null);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de categoria</DialogTitle>
            <DialogDescription>Informacion servida por GET /api/admin/categories/:id.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isDetailLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando detalle...</span>
              </div>
            ) : activeDetail ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex flex-col gap-2">
                    <CategoryImagePreview src={activeDetail.image} alt={activeDetail.name} />
                    {canCategoryManageIcon(activeDetail.type, activeDetail.group) ? (
                      <CategoryIconPreview icon={activeDetail.icon} slug={activeDetail.slug} />
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{activeDetail.name}</h3>
                      <Badge variant={activeDetail.active ? "default" : "secondary"}>
                        {activeDetail.active ? "Activa" : "Inactiva"}
                      </Badge>
                      {activeDetail.showOnHome ? <Badge variant="outline">Inicio</Badge> : null}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{activeDetail.slug}</p>
                    <p className="text-sm text-muted-foreground">
                      {activeDetail.group === "profesiones"
                        ? "Profesion"
                        : activeDetail.type === "area"
                          ? "Area de oficios"
                          : "Subcategoria de oficio"}{" "}
                      - {activeDetail.group === "oficios" ? "Oficios" : "Profesiones"}
                    </p>
                    {activeDetail.parent?.name ? (
                      <p className="text-sm text-muted-foreground">
                        Padre: <span className="font-medium text-foreground">{activeDetail.parent.name}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                {activeDetail.description ? (
                  <div>
                    <Label className="text-sm font-medium">Descripcion</Label>
                    <p className="mt-1 text-sm text-muted-foreground">{activeDetail.description}</p>
                  </div>
                ) : null}

                <div
                  className={`grid gap-3 ${
                    canCategoryManageIcon(activeDetail.type, activeDetail.group)
                      ? "sm:grid-cols-2"
                      : "sm:grid-cols-1"
                  }`}
                >
                  {canCategoryManageIcon(activeDetail.type, activeDetail.group) ? (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Icono</p>
                      <div className="mt-2 flex items-center gap-3">
                        <CategoryIconPreview icon={activeDetail.icon} slug={activeDetail.slug} />
                        <p className="font-mono text-xs">{activeDetail.icon || "fallback por slug"}</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Mostrar en inicio</p>
                    <p className="mt-2 text-lg font-semibold">{activeDetail.showOnHome ? "Si" : "No"}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">ID</p>
                    <p className="mt-2 break-all font-mono text-xs">{activeDetail.id}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Subcategorias</p>
                    <p className="mt-2 text-lg font-semibold">{activeDetail.subcategoryCount || activeDetail._count?.children || 0}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Servicios</p>
                    <p className="mt-2 text-lg font-semibold">{activeDetail.professionalCount || activeDetail._count?.services || 0}</p>
                  </div>
                </div>

                {activeDetail.subcategories && activeDetail.subcategories.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subcategorias</Label>
                    <div className="space-y-2">
                      {activeDetail.subcategories.map((subcategory) => (
                        <div key={subcategory.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{subcategory.name}</p>
                              <p className="font-mono text-xs text-muted-foreground">{subcategory.slug}</p>
                            </div>
                            <Badge variant="outline">{subcategory.professionalCount || 0} servicios</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeDetail.professionals && activeDetail.professionals.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Profesionales relacionados</Label>
                    <div className="space-y-2">
                      {activeDetail.professionals.slice(0, 5).map((professional) => (
                        <div key={professional.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{professional.user?.firstName} {professional.user?.lastName}</p>
                              <p className="text-muted-foreground">{professional.verified ? "Verificado" : "Sin verificar"}</p>
                            </div>
                            <Badge variant="outline">{professional.rating ? `${professional.rating} pts` : "Sin rating"}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No hay informacion disponible para esta categoria.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ocultar categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Se intentara ocultar la categoria &quot;{selectedItem?.name}&quot;. Si el backend detecta subcategorias o servicios asociados puede rechazar la operacion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Ocultar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
