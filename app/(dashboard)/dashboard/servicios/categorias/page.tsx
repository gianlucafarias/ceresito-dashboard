"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Briefcase,
  GraduationCap,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { apiClient, APICategoryResponse, CategoriesListResponse } from "../_lib/api-client";

export default function CategoriasPage() {
  const [categories, setCategories] = useState<CategoriesListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<APICategoryResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type: "area" as "area" | "subcategory",
    group: "oficios" as "oficios" | "profesiones",
    parentId: "",
    image: "",
    active: true,
  });

  // Cargar categorías desde la API
  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        setError(null);
        
        const params: any = {};
        if (searchTerm) params.search = searchTerm;
        
        const response = await apiClient.listCategories(params);
        
        if (response.success) {
          setCategories(response.data);
        } else {
          setError((response as any).message || 'Error al cargar categorías');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Error de conexión al cargar categorías');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, [searchTerm]);

  // Función para generar slug desde el nombre
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Funciones para manejar acciones
  const handleCreateNew = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      type: "area",
      group: "oficios",
      parentId: "",
      image: "",
      active: true,
    });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (item: APICategoryResponse) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      slug: item.slug,
      description: item.description || "",
      type: item.type,
      group: item.group,
      parentId: item.areaId || "",
      image: item.image || "",
      active: item.active,
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (item: APICategoryResponse) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (item: APICategoryResponse) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    try {
      setIsSaving(true);
      const response = await apiClient.deleteCategory(selectedItem.id, { deactivate: true });
      
      if (response.success) {
        // Recargar categorías
        const listResponse = await apiClient.listCategories();
        if (listResponse.success) {
          setCategories(listResponse.data);
        }
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
      } else {
        setError((response as any).message || 'Error al eliminar categoría');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Error al eliminar categoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCreate = async () => {
    try {
      setIsSaving(true);
      
      const data: any = {
        type: formData.type,
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        group: formData.group,
        description: formData.description,
        image: formData.image || undefined,
        active: formData.active,
      };

      if (formData.type === "subcategory" && formData.group === "oficios" && formData.parentId) {
        data.parentId = formData.parentId;
      }

      const response = await apiClient.createCategory(data);
      
      if (response.success) {
        // Recargar categorías
        const listResponse = await apiClient.listCategories();
        if (listResponse.success) {
          setCategories(listResponse.data);
        }
        setIsCreateDialogOpen(false);
        setFormData({
          name: "",
          slug: "",
          description: "",
          type: "area",
          group: "oficios",
          parentId: "",
          image: "",
          active: true,
        });
      } else {
        setError((response as any).message || 'Error al crear categoría');
      }
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Error al crear categoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    try {
      setIsSaving(true);
      
      const data: any = {};
      if (formData.name) data.name = formData.name;
      if (formData.description !== undefined) data.description = formData.description;
      if (formData.image !== undefined) data.image = formData.image || null;
      if (formData.active !== undefined) data.active = formData.active;
      if (formData.parentId !== undefined) data.parentId = formData.parentId || null;

      const response = await apiClient.updateCategory(selectedItem.id, data);
      
      if (response.success) {
        // Recargar categorías
        const listResponse = await apiClient.listCategories();
        if (listResponse.success) {
          setCategories(listResponse.data);
        }
        setIsEditDialogOpen(false);
        setSelectedItem(null);
      } else {
        setError((response as any).message || 'Error al actualizar categoría');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Error al actualizar categoría');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrar categorías localmente
  const filteredAreas = categories?.areas.filter(area => 
    area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.slug.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredOficiosSubcategories = categories?.subcategoriesOficios.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.slug.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredProfesionesSubcategories = categories?.subcategoriesProfesiones.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.slug.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Obtener áreas disponibles para selección
  const availableAreas = categories?.areas || [];

  if (error && !categories) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gestión de Categorías
          </h2>
          <p className="text-muted-foreground">
            Administra las categorías y subcategorías de servicios
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Áreas
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : categories?.stats.totalAreas || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Solo en Oficios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Servicios de Oficios
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : categories?.stats.totalSubcategoriesOficios || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Subcategorías disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Servicios Profesionales
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : categories?.stats.totalSubcategoriesProfesiones || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Profesiones disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Servicios
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : categories?.stats.totalCategories || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Categorías totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando categorías...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grupos principales */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Oficios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                  <span>Oficios</span>
                  <Badge variant="secondary">{categories?.stats.totalAreas || 0} áreas</Badge>
                </CardTitle>
                <CardDescription>
                  Categorías relacionadas con oficios y trabajos manuales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredAreas.map((area) => {
                    const subcategories = filteredOficiosSubcategories.filter(
                      sub => sub.areaId === area.id
                    );
                    return (
                      <div key={area.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{area.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{subcategories.length} servicios</Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleView(area)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(area)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600"
                              onClick={() => handleDelete(area)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {subcategories.slice(0, 3).map((sub) => (
                            <div key={sub.id} className="text-sm text-muted-foreground">
                              • {sub.name} {sub.professionalCount ? `(${sub.professionalCount})` : ''}
                            </div>
                          ))}
                          {subcategories.length > 3 && (
                            <div className="text-sm text-muted-foreground">
                              ... y {subcategories.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredAreas.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No se encontraron áreas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profesiones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  <span>Profesiones</span>
                  <Badge variant="secondary">{categories?.stats.totalSubcategoriesProfesiones || 0} servicios</Badge>
                </CardTitle>
                <CardDescription>
                  Categorías relacionadas con profesiones y servicios profesionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredProfesionesSubcategories.map((profession) => (
                    <div key={profession.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{profession.name}</h4>
                          {profession.professionalCount && (
                            <p className="text-sm text-muted-foreground">
                              {profession.professionalCount} profesionales
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleView(profession)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(profession)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleDelete(profession)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProfesionesSubcategories.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No se encontraron profesiones
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Diálogo para crear nueva categoría */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>
              Crea una nueva categoría o subcategoría para la plataforma de servicios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "area" | "subcategory") => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area">Área (solo para Oficios)</SelectItem>
                  <SelectItem value="subcategory">Subcategoría</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group">Grupo</Label>
              <Select
                value={formData.group}
                onValueChange={(value: "oficios" | "profesiones") => setFormData({ ...formData, group: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oficios">Oficios</SelectItem>
                  <SelectItem value="profesiones">Profesiones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type === "subcategory" && formData.group === "oficios" && (
              <div className="grid gap-2">
                <Label htmlFor="parentId">Área Padre</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un área" />
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
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: formData.slug || generateSlug(name),
                  });
                }}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="url-friendly-slug"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la categoría"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">URL de Imagen (opcional)</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="/images/categoria.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSaveCreate} disabled={isSaving || !formData.name}>
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

      {/* Diálogo para editar categoría */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica la información de esta categoría.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image">URL de Imagen</Label>
              <Input
                id="edit-image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>
            {selectedItem?.type === "subcategory" && selectedItem.group === "oficios" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-parentId">Área Padre</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un área" />
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
            )}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-active">Activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
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

      {/* Diálogo para ver detalles */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Categoría</DialogTitle>
            <DialogDescription>
              Información completa de esta categoría.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedItem && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Nombre</Label>
                  <p className="text-sm text-muted-foreground">{selectedItem.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Slug</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedItem.slug}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.type === 'area' ? 'Área' : 'Subcategoría'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Grupo</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.group === 'oficios' ? 'Oficios' : 'Profesiones'}
                  </p>
                </div>
                {selectedItem.description && (
                  <div>
                    <Label className="text-sm font-medium">Descripción</Label>
                    <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                  </div>
                )}
                {selectedItem.areaId && (
                  <div>
                    <Label className="text-sm font-medium">Área Padre</Label>
                    <p className="text-sm text-muted-foreground">{selectedItem.areaSlug}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.active ? (
                      <Badge className="bg-green-500">Activa</Badge>
                    ) : (
                      <Badge className="bg-gray-500">Inactiva</Badge>
                    )}
                  </p>
                </div>
                {selectedItem.professionalCount !== undefined && (
                  <div>
                    <Label className="text-sm font-medium">Profesionales</Label>
                    <p className="text-sm text-muted-foreground">{selectedItem.professionalCount}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">ID</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedItem.id}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará la categoría "{selectedItem?.name}". 
              Los profesionales asociados no se verán afectados, pero la categoría dejará de estar visible en la plataforma pública.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Desactivar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
