"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, APICategoryResponse, CategoriesListResponse } from "../../../_lib/api-client";
import { adaptProfessional, prepareUpdateProfessionalData } from "../../../_lib/api-adapters";
import { Professional, Service } from "../../../_types";

interface EditProfessionalPageProps {
  params: {
    id: string;
  };
}

export default function EditProfessionalPage({ params }: EditProfessionalPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [professional, setProfessional] = useState<Professional | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showVisibilityDialog, setShowVisibilityDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Estados para servicios
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<APICategoryResponse[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showDeleteServiceDialog, setShowDeleteServiceDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  
  const [serviceFormData, setServiceFormData] = useState({
    categoryId: "",
    title: "",
    description: "",
    priceRange: "A consultar",
    available: true
  });
  
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
          setServices(foundProfessional.services || []);
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

  // Cargar categorías disponibles
  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoadingCategories(true);
        const response = await apiClient.listCategories();
        
        if (response.success) {
          // Combinar subcategorías de oficios y profesiones según la estructura de la API
          const allSubcategories = [
            ...(response.data.subcategoriesOficios || []),
            ...(response.data.subcategoriesProfesiones || [])
          ];
          setCategories(allSubcategories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!professional) return;
    
    setIsSaving(true);
    try {
      // Preparar datos para enviar a la API
      const updateData = prepareUpdateProfessionalData(formData);
      
      // Enviar actualización del profesional a la API
      const response = await apiClient.updateProfessional(params.id, updateData);
      
      if (!response.success) {
        toast({
          title: "No se pudieron guardar los cambios",
          description: response.message,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Procesar cambios en servicios
      const originalServices = professional.services || [];
      
      // Identificar servicios a crear, actualizar y eliminar
      const servicesToCreate = services.filter(s => s.id.startsWith('temp-'));
      const servicesToUpdate = services.filter(s => 
        !s.id.startsWith('temp-') && 
        originalServices.some(os => os.id === s.id)
      );
      const servicesToDelete = originalServices.filter(os => 
        !services.some(s => s.id === os.id)
      );

      // Crear nuevos servicios
      for (const service of servicesToCreate) {
        const createResponse = await apiClient.createService(professional.id, {
          categoryId: service.categoryId,
          title: service.title,
          description: service.description,
          priceRange: service.priceRange,
          available: service.available
        });
        
        if (!createResponse.success) {
          console.error(`Error al crear servicio ${service.title}:`, createResponse.message);
        }
      }

      // Actualizar servicios existentes
      for (const service of servicesToUpdate) {
        const originalService = originalServices.find(os => os.id === service.id);
        if (!originalService) continue;

        // Solo actualizar si hay cambios
        const hasChanges = 
          service.categoryId !== originalService.categoryId ||
          service.title !== originalService.title ||
          service.description !== originalService.description ||
          service.priceRange !== originalService.priceRange ||
          service.available !== originalService.available;

        if (hasChanges) {
          const updateResponse = await apiClient.updateService(
            professional.id,
            service.id,
            {
              categoryId: service.categoryId,
              title: service.title,
              description: service.description,
              priceRange: service.priceRange,
              available: service.available
            }
          );
          
          if (!updateResponse.success) {
            console.error(`Error al actualizar servicio ${service.title}:`, updateResponse.message);
          }
        }
      }

      // Eliminar servicios
      for (const service of servicesToDelete) {
        const deleteResponse = await apiClient.deleteService(professional.id, service.id);
        
        if (!deleteResponse.success) {
          console.error(`Error al eliminar servicio ${service.title}:`, deleteResponse.message);
        }
      }

      toast({
        title: "Cambios guardados",
        description: "La información del profesional se actualizó correctamente.",
      });
      // Redirigir de vuelta a la página de detalles
      router.push(`/dashboard/servicios/profesionales/${params.id}`);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      toast({
        title: "Error al guardar",
        description: "Ocurrió un problema al guardar los cambios.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/servicios/profesionales/${params.id}`);
  };

  const handleVisibilityChange = (checked: boolean) => {
    if (checked) {
      // Activar: cambiar de pending a active (aprobar)
      handleUpdateStatus('active', true);
    } else {
      // Desactivar: mostrar dialog de confirmación para cambiar de active a pending
      setShowVisibilityDialog(true);
    }
  };

  const handleConfirmVisibilityDeactivation = async () => {
    setShowVisibilityDialog(false);
    await handleUpdateStatus('pending', false);
  };

  const handleUpdateStatus = async (status: 'active' | 'pending', verified: boolean) => {
    if (!professional) return;
    
    setIsUpdatingStatus(true);
    try {
      const response = await apiClient.updateProfessionalStatus(professional.id, status, verified);
      
      if (response.success) {
        setProfessional((prev) =>
          prev
            ? {
                ...prev,
                status,
                verified,
              }
            : prev
        );
        setFormData(prev => ({
          ...prev,
          status,
          verified,
        }));
        toast({
          title: status === 'active' ? "Profesional aprobado" : "Profesional desactivado",
          description:
            status === 'active'
              ? 'El profesional quedó visible en la plataforma.'
              : 'El profesional volvió a estado pendiente de aprobación.',
        });
      } else {
        toast({
          title: "No se pudo actualizar el estado",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast({
        title: "Error al actualizar estado",
        description: "Ocurrió un problema al actualizar el estado del profesional.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Funciones para gestionar servicios
  const handleOpenServiceDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceFormData({
        categoryId: service.categoryId,
        title: service.title,
        description: service.description,
        priceRange: service.priceRange,
        available: service.available
      });
    } else {
      setEditingService(null);
      setServiceFormData({
        categoryId: "",
        title: "",
        description: "",
        priceRange: "A consultar",
        available: true
      });
    }
    setShowServiceDialog(true);
  };

  const handleCloseServiceDialog = () => {
    setShowServiceDialog(false);
    setEditingService(null);
    setServiceFormData({
      categoryId: "",
      title: "",
      description: "",
      priceRange: "A consultar",
      available: true
    });
  };

  const handleSaveService = () => {
    if (!serviceFormData.categoryId || !serviceFormData.title || !serviceFormData.description) {
      toast({
        title: "Campos incompletos",
        description: "Completá todos los campos requeridos del servicio.",
        variant: "destructive",
      });
      return;
    }

    if (editingService) {
      // Actualizar servicio existente en el estado local
      setServices(prev => prev.map(service => 
        service.id === editingService.id
          ? {
              ...service,
              categoryId: serviceFormData.categoryId,
              title: serviceFormData.title,
              description: serviceFormData.description,
              priceRange: serviceFormData.priceRange,
              available: serviceFormData.available
            }
          : service
      ));
    } else {
      // Crear nuevo servicio en el estado local (con ID temporal)
      const newService: Service = {
        id: `temp-${Date.now()}`,
        professionalId: professional?.id || '',
        categoryId: serviceFormData.categoryId,
        title: serviceFormData.title,
        description: serviceFormData.description,
        priceRange: serviceFormData.priceRange,
        available: serviceFormData.available,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setServices(prev => [...prev, newService]);
    }
    
    handleCloseServiceDialog();
  };

  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setShowDeleteServiceDialog(true);
  };

  const handleConfirmDeleteService = () => {
    if (!serviceToDelete) return;

    // Eliminar servicio del estado local (se guardará cuando se presione Guardar Cambios)
    setServices(prev => prev.filter(service => service.id !== serviceToDelete.id));
    setShowDeleteServiceDialog(false);
    setServiceToDelete(null);
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

        {/* Servicios del Profesional */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Servicios Ofrecidos</span>
                </CardTitle>
                <CardDescription>
                  Gestiona los servicios que este profesional ofrece en la plataforma
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={() => handleOpenServiceDialog()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Servicio
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Este profesional no tiene servicios registrados aún.
                </p>
                <Button
                  type="button"
                  onClick={() => handleOpenServiceDialog()}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primer Servicio
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{service.title}</h4>
                          <Badge
                            variant={service.available ? "default" : "secondary"}
                            className={service.available ? "bg-green-500" : ""}
                          >
                            {service.available ? "Disponible" : "No disponible"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-green-600">
                            {service.priceRange}
                          </span>
                          {service.category && (
                            <Badge variant="outline">
                              {service.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenServiceDialog(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteService(service)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <Separator />
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="visibleInPlatform" className="text-base font-medium">
                  Visible en la plataforma
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.status === 'active' 
                    ? 'El profesional está aprobado y visible en la plataforma pública'
                    : 'El profesional está pendiente de aprobación y no es visible'}
                </p>
              </div>
              <Switch
                id="visibleInPlatform"
                checked={formData.status === 'active'}
                onCheckedChange={handleVisibilityChange}
                disabled={isUpdatingStatus}
              />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Verificado:</strong> El profesional ha sido aprobado para aparecer en la plataforma.<br/>
                <strong>Certificado:</strong> Los servicios del profesional han sido validados y certificados por su calidad.<br/>
                <strong>Visible en la plataforma:</strong> Controla si el profesional está aprobado (active) y visible en la plataforma pública, o pendiente de aprobación.
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

      {/* Dialog de confirmación para desactivar visibilidad */}
      <Dialog open={showVisibilityDialog} onOpenChange={setShowVisibilityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span>Desactivar visibilidad del profesional</span>
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas desactivar la visibilidad de este profesional en la plataforma?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Al desactivar la visibilidad, el profesional cambiará su estado de <strong>activo</strong> a <strong>pendiente</strong> y dejará de ser visible en la plataforma pública. 
              El profesional volverá a estar disponible para su aprobación.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVisibilityDialog(false)}
              disabled={isUpdatingStatus}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmVisibilityDeactivation}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? "Procesando..." : "Desactivar visibilidad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear/editar servicio */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar Servicio" : "Agregar Nuevo Servicio"}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? "Modifica la información del servicio"
                : "Completa la información del nuevo servicio que ofrecerá el profesional"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serviceCategory">Categoría *</Label>
              <Select
                value={serviceFormData.categoryId}
                onValueChange={(value) => setServiceFormData(prev => ({ ...prev, categoryId: value }))}
                disabled={isLoadingCategories}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.group === 'oficios' ? 'Oficios' : 'Profesiones'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceTitle">Título del Servicio *</Label>
              <Input
                id="serviceTitle"
                value={serviceFormData.title}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Reparación de cañerías"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceDescription">Descripción *</Label>
              <Textarea
                id="serviceDescription"
                value={serviceFormData.description}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el servicio que ofrece el profesional..."
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servicePriceRange">Rango de Precio</Label>
                <Input
                  id="servicePriceRange"
                  value={serviceFormData.priceRange}
                  onChange={(e) => setServiceFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                  placeholder="A consultar"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceAvailable">Disponibilidad</Label>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="serviceAvailable"
                    checked={serviceFormData.available}
                    onCheckedChange={(checked) => setServiceFormData(prev => ({ ...prev, available: checked }))}
                  />
                  <Label htmlFor="serviceAvailable" className="cursor-pointer">
                    {serviceFormData.available ? "Disponible" : "No disponible"}
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseServiceDialog}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveService}
              disabled={!serviceFormData.categoryId || !serviceFormData.title || !serviceFormData.description}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingService ? "Actualizar" : "Agregar Servicio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar servicio */}
      <Dialog open={showDeleteServiceDialog} onOpenChange={setShowDeleteServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>Eliminar Servicio</span>
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este servicio?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {serviceToDelete && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{serviceToDelete.title}</p>
                <p className="text-sm text-muted-foreground">
                  Esta acción no se puede deshacer. El servicio será eliminado permanentemente.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteServiceDialog(false);
                setServiceToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteService}
            >
              Eliminar Servicio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
