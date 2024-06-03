"use client"
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PhoneInput } from "../../cuadrillas/components/phone-input";

export default function Dashboard() {
  const [formData, setFormData] = useState({
    reclamo: "",
    nombre: "",
    telefono: "",
    detalle: "",
    ubicacion: "",
    barrio: "",
    estado: "",
    prioridad: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [id]: value
    }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [id]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('https://api.ceres.gob.ar/api/api/reclamos/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Manejar respuesta exitosa
        alert("Reclamo creado exitosamente");
      } else {
        // Manejar errores
        console.error('Error al crear el reclamo:', response.statusText);
      }
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
    }
  };

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 w-full max-w-7xl mx-auto">
      <div className="grid gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
          <h1 className="flex-1 text-xl font-semibold tracking-tight">
            Cargar Nuevo Reclamo
          </h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="sm">
              Descartar
            </Button>
            <Button size="sm" onClick={handleSubmit}>Cargar Reclamo</Button>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 grid gap-4">
            
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Reclamo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="grid gap-3">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select onValueChange={(value) => handleSelectChange('reclamo', value)}>
                      <SelectTrigger id="tipo" aria-label="Select category">
                        <SelectValue placeholder="Seleccionar tipo de reclamo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Animales">Animales</SelectItem>
                        <SelectItem value="Arreglos">Arreglos</SelectItem>
                        <SelectItem value="Arboles">Arboles</SelectItem>
                        <SelectItem value="Luminarias">Luminarias</SelectItem>
                        <SelectItem value="Higiene Urbana">Higiene Urbana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Usuario</CardTitle>
                <CardDescription>
                  Lipsum dolor sit amet, consectetur adipiscing elit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      type="text"
                      className="w-full"
                      value={formData.nombre}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid gap-3">
                  <Label htmlFor="nombre">Numero de Telefono</Label>

                    <PhoneInput
                      value={formData.telefono}
                      onChange={(value) => handleSelectChange('telefono', value || '')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalles del Reclamo</CardTitle>
                <CardDescription>
                  Lipsum dolor sit amet, consectetur adipiscing elit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  
                  <div className="grid gap-3">
                    <Label htmlFor="detalle">Detalles</Label>
                    <Textarea
                      id="detalle"
                      value={formData.detalle}
                      onChange={handleChange}
                      className="min-h-32"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ubicación</CardTitle>
                <CardDescription>
                  Lipsum dolor sit amet, consectetur adipiscing elit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">

                  <div className="grid gap-3">
                    <Label htmlFor="ubicacion">Dirección</Label>
                    <Input
                      id="ubicacion"
                      type="text"
                      className="w-full"
                      value={formData.ubicacion}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="barrio">Barrio</Label>
                    <Input
                      id="barrio"
                      type="text"
                      className="w-full"
                      value={formData.barrio}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          
          </div>
          <div className="grid auto-rows-max items-start gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Estado del Reclamo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="estado">Estado</Label>
                    <Select onValueChange={(value) => handleSelectChange('estado', value)}>
                      <SelectTrigger id="estado" aria-label="Seleccionar Estado">
                        <SelectValue placeholder="Seleccionar Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                        <SelectItem value="EN_PROCESO">EN PROCESO</SelectItem>
                        <SelectItem value="COMPLETADO">COMPLETADO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 md:hidden">
          <Button variant="outline" size="sm">
            Descartar
          </Button>
          <Button size="sm" onClick={handleSubmit}>Cargar Reclamo</Button>
        </div>
      </div>
    </main>
  );
}
