"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Briefcase,
  GraduationCap,
  Save,
  X
} from "lucide-react";
import { 
  AREAS_OFICIOS, 
  SUBCATEGORIES_OFICIOS, 
  SUBCATEGORIES_PROFESIONES,
} from "../_types";

export default function CategoriasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "area", // area o subcategory
    group: "oficios",
    areaSlug: ""
  });

  // Función para filtrar categorías
  const filteredAreas = AREAS_OFICIOS.filter(area => 
    area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOficiosSubcategories = SUBCATEGORIES_OFICIOS.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProfesionesSubcategories = SUBCATEGORIES_PROFESIONES.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funciones para manejar acciones
  const handleCreateNew = () => {
    setFormData({
      name: "",
      description: "",
      type: "area",
      group: "oficios",
      areaSlug: ""
    });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (item: any, type: string) => {
    setSelectedItem({...item, itemType: type});
    setFormData({
      name: item.name,
      description: item.description || "",
      type: type,
      group: item.group || "oficios",
      areaSlug: item.areaSlug || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (item: any, type: string) => {
    setSelectedItem({...item, itemType: type});
    setIsViewDialogOpen(true);
  };

  const handleDelete = (item: any, type: string) => {
    // Aquí iría la lógica para eliminar
    console.log("Eliminar:", item, type);
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar
    console.log("Guardar:", formData);
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
  };

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
            <div className="text-2xl font-bold">{filteredAreas.length}</div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? `Filtradas de ${AREAS_OFICIOS.length}` : 'Solo en Oficios'}
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
            <div className="text-2xl font-bold">{filteredOficiosSubcategories.length}</div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? `Filtradas de ${SUBCATEGORIES_OFICIOS.length}` : 'Subcategorías disponibles'}
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
            <div className="text-2xl font-bold">{filteredProfesionesSubcategories.length}</div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? `Filtradas de ${SUBCATEGORIES_PROFESIONES.length}` : 'Profesiones disponibles'}
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
              {filteredOficiosSubcategories.length + filteredProfesionesSubcategories.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'Resultados filtrados' : 'Categorías totales'}
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

      {/* Grupos principales */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Oficios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              <span>Oficios</span>
              <Badge variant="secondary">{AREAS_OFICIOS.length} áreas</Badge>
            </CardTitle>
            <CardDescription>
              Categorías relacionadas con oficios y trabajos manuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAreas.map((area) => {
                const subcategories = filteredOficiosSubcategories.filter(
                  sub => sub.areaSlug === area.slug
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
                          onClick={() => handleView(area, 'area')}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(area, 'area')}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleDelete(area, 'area')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {subcategories.slice(0, 3).map((sub) => (
                        <div key={sub.id} className="text-sm text-muted-foreground">
                          • {sub.name}
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
            </div>
          </CardContent>
        </Card>

        {/* Profesiones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-green-500" />
              <span>Profesiones</span>
              <Badge variant="secondary">{SUBCATEGORIES_PROFESIONES.length} servicios</Badge>
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
                    <h4 className="font-medium">{profession.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleView(profession, 'subcategory')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(profession, 'subcategory')}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => handleDelete(profession, 'subcategory')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      

      {/* Diálogo para crear nueva categoría */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>
              Crea una nueva categoría o subcategoría para la plataforma de servicios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="col-span-3"
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
                placeholder="Descripción de la categoría"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar categoría */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica la información de esta categoría.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nombre
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver detalles */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
                    {selectedItem.itemType === 'area' ? 'Área' : 'Subcategoría'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Grupo</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.group === 'oficios' ? 'Oficios' : 'Profesiones'}
                  </p>
                </div>
                {selectedItem.areaSlug && (
                  <div>
                    <Label className="text-sm font-medium">Área Padre</Label>
                    <p className="text-sm text-muted-foreground">{selectedItem.areaSlug}</p>
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
    </div>
  );
}
