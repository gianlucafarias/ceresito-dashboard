"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft,
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Save,
  X,
  ExternalLink,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  FileImage,
  MessageSquare as WhatsApp,
  AlertCircle,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../_lib/api-client";
import { adaptProfessional, prepareUpdateProfessionalData } from "../../../_lib/api-adapters";
import { Professional } from "../../../_types";

interface EditProfessionalPageProps {
  params: {
    id: string;
  };
}

export default function EditProfessionalPage({ params }: EditProfessionalPageProps) {
  const router = useRouter();
  const [professional, setProfessional] = useState<Professional | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    // Información personal
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    location: "",
    
    // Información profesional
    bio: "",
    experienceYears: 0,
    
    // Información de contacto
    whatsapp: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    website: "",
    portfolio: "",
    cv: "",
    
    // Estados
    verified: false,
    certified: false,
    status: "pending" as "pending" | "active" | "suspended"
  });

  // Cargar datos del profesional desde la API
  useEffect(() => {
    async function fetchProfessional() {
      try {
        setIsLoading(true);
        const response = await apiClient.getProfessional(params.id);
        
        if (response.success) {
          const foundProfessional = adaptProfessional(response.data);
          setProfessional(foundProfessional);
          setFormData({
            firstName: foundProfessional.user?.firstName || "",
            lastName: foundProfessional.user?.lastName || "",
            email: foundProfessional.user?.email || "",
            phone: foundProfessional.user?.phone || "",
            birthDate: foundProfessional.user?.birthDate ? 
              new Date(foundProfessional.user.birthDate).toISOString().split('T')[0] : "",
            location: foundProfessional.location || "",
            bio: foundProfessional.bio || "",
            experienceYears: foundProfessional.experienceYears || 0,
            whatsapp: foundProfessional.user?.whatsapp || "",
            instagram: foundProfessional.user?.instagram || "",
            facebook: foundProfessional.user?.facebook || "",
            linkedin: foundProfessional.user?.linkedin || "",
            website: foundProfessional.user?.website || "",
            portfolio: foundProfessional.user?.portfolio || "",
            cv: foundProfessional.user?.cv || "",
            verified: foundProfessional.verified || false,
            certified: foundProfessional.certified || false,
            status: foundProfessional.status
          });
        } else {
          console.error('Error loading professional:', response.message);
        }
      } catch (err) {
        console.error('Error fetching professional:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfessional();
  }, [params.id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Preparar datos para enviar a la API
      const updateData = prepareUpdateProfessionalData(formData);
      
      // Enviar actualización a la API
      const response = await apiClient.updateProfessional(params.id, updateData);
      
      if (response.success) {
        alert('Cambios guardados correctamente');
        // Redirigir de vuelta a la página de detalles
        router.push(`/dashboard/servicios/profesionales/${params.id}`);
      } else {
        alert(`Error al guardar: ${response.message}`);
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert('Error de conexión al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/servicios/profesionales/${params.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando información del profesional...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-muted-foreground">Profesional no encontrado</h2>
          <p className="text-muted-foreground mt-2">
            El profesional que buscas no existe o ha sido eliminado.
          </p>
          <Link href="/dashboard/servicios/profesionales">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="space-y-4">
        <Link href={`/dashboard/servicios/profesionales/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a detalles
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Editar Profesional
            </h2>
            <p className="text-muted-foreground">
              Modifica la información del profesional: {professional.user?.firstName} {professional.user?.lastName}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              ID: {professional.id}
            </Badge>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información Personal</span>
            </CardTitle>
            <CardDescription>
              Datos personales básicos del profesional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Nombre del profesional"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Apellido del profesional"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+54 3491 123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange("birthDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Ciudad, Provincia"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Profesional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información Profesional</span>
            </CardTitle>
            <CardDescription>
              Datos relacionados con la experiencia y servicios del profesional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experienceYears">Años de Experiencia</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange("experienceYears", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Biografía Profesional</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Describe la experiencia y especialidades del profesional..."
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Información de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Información de Contacto</span>
            </CardTitle>
            <CardDescription>
              Datos de contacto y redes sociales del profesional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center space-x-2">
                  <WhatsApp className="h-4 w-4 text-green-600" />
                  <span>WhatsApp</span>
                </Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                  placeholder="+54 3491 123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center space-x-2">
                  <Instagram className="h-4 w-4 text-pink-600" />
                  <span>Instagram</span>
                </Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => handleInputChange("instagram", e.target.value)}
                  placeholder="@usuario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center space-x-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span>Facebook</span>
                </Label>
                <Input
                  id="facebook"
                  value={formData.facebook}
                  onChange={(e) => handleInputChange("facebook", e.target.value)}
                  placeholder="Nombre de página"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center space-x-2">
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  <span>LinkedIn</span>
                </Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange("linkedin", e.target.value)}
                  placeholder="usuario-linkedin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>Sitio Web</span>
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio" className="flex items-center space-x-2">
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                  <span>Portfolio</span>
                </Label>
                <Input
                  id="portfolio"
                  value={formData.portfolio}
                  onChange={(e) => handleInputChange("portfolio", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estados de Verificación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Estados de Verificación</span>
            </CardTitle>
            <CardDescription>
              Gestiona los estados de verificación y certificación del profesional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="verified"
                  checked={formData.verified}
                  onChange={(e) => handleInputChange("verified", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="verified" className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Profesional Verificado</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="certified"
                  checked={formData.certified}
                  onChange={(e) => handleInputChange("certified", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="certified" className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span>Servicios Certificados</span>
                </Label>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Verificado:</strong> El profesional ha sido aprobado para aparecer en la plataforma.<br/>
                <strong>Certificado:</strong> Los servicios del profesional han sido validados y certificados por su calidad.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
