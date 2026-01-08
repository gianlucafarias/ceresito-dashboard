"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  FileText,
  Edit,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  FileImage,
  Award,
  AlertCircle,
  CheckCircle2,
  MessageSquare as WhatsApp,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "../../_lib/api-client";
import { adaptProfessional } from "../../_lib/api-adapters";
import { mockReviews } from "../../_lib/mock-data";
import { Professional } from "../../_types";

interface ProfessionalDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProfessionalDetailPage({ params }: ProfessionalDetailPageProps) {
  const router = useRouter();
  const [professional, setProfessional] = useState<Professional | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Cargar datos del profesional
  useEffect(() => {
    async function fetchProfessional() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.getProfessional(params.id);
        
        if (response.success) {
          const adaptedProfessional = adaptProfessional(response.data);
          setProfessional(adaptedProfessional);
        } else {
          setError(response.message || 'Error al cargar el profesional');
        }
      } catch (err) {
        console.error('Error fetching professional:', err);
        setError('Error de conexión al cargar el profesional');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfessional();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando información del profesional...</span>
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-muted-foreground">
            {error || 'Profesional no encontrado'}
          </h2>
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

  const professionalServices = professional.services || [];
  
  // TODO: Las reviews aún vienen como mock, pendiente de endpoint en la API
  const professionalReviews = mockReviews.filter(r => r.professionalId === professional.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Activo</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case "suspended":
        return <Badge className="bg-red-500">Suspendido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVerifiedBadge = (verified: boolean) => {
    return verified ? (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Verificado
      </Badge>
    ) : (
      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
        <AlertCircle className="mr-1 h-3 w-3" />
        Sin verificar
      </Badge>
    );
  };

  const getCertifiedBadge = (certified: boolean) => {
    return certified ? (
      <Badge variant="outline" className="text-blue-600 border-blue-600">
        <Award className="mr-1 h-3 w-3" />
        Certificado
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-600 border-gray-600">
        <Clock className="mr-1 h-3 w-3" />
        Sin certificar
      </Badge>
    );
  };

  const getEmailVerifiedBadge = (emailVerified: boolean) => {
    return emailVerified ? (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <Mail className="mr-1 h-3 w-3" />
        Email verificado
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <AlertCircle className="mr-1 h-3 w-3" />
        Email sin verificar
      </Badge>
    );
  };


  const handleApprove = async () => {
    if (!professional) return;
    
    setIsProcessing(true);
    try {
      const response = await apiClient.updateProfessionalStatus(professional.id, 'active', true);
      
      if (response.success) {
        // Actualizar el estado local
        const updatedProfessional = adaptProfessional(response.data);
        setProfessional(updatedProfessional);
        alert('Profesional aprobado correctamente');
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (err) {
      console.error('Error approving professional:', err);
      alert('Error al aprobar el profesional');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!professional) return;
    
    setIsProcessing(true);
    try {
      const response = await apiClient.updateProfessionalStatus(professional.id, 'pending', false);
      
      if (response.success) {
        // Actualizar el estado local
        const updatedProfessional = adaptProfessional(response.data);
        setProfessional(updatedProfessional);
        alert('Profesional rechazado');
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (err) {
      console.error('Error rejecting professional:', err);
      alert('Error al rechazar el profesional');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCertify = async () => {
    if (!professional) return;
    
    setIsProcessing(true);
    try {
      // Nota: certified no está disponible en el endpoint de status, usar update general
      const response = await apiClient.updateProfessional(professional.id, { certified: true });
      
      if (response.success) {
        // Actualizar el estado local
        const updatedProfessional = adaptProfessional(response.data);
        setProfessional(updatedProfessional);
        alert('Servicios certificados correctamente');
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (err) {
      console.error('Error certifying professional:', err);
      alert('Error al certificar los servicios');
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header con botón volver arriba */}
      <div className="space-y-4">
        <Link href="/dashboard/servicios/profesionales">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {professional.user?.firstName} {professional.user?.lastName}
            </h2>
            <p className="text-muted-foreground">
              Detalles del profesional y solicitud de registro
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(professional.status)}
            {getVerifiedBadge(professional.verified)}
            {getCertifiedBadge(professional.certified)}
            {getEmailVerifiedBadge(professional.user?.emailVerified || false)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Información principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Información personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Información Personal</span>
                </div>
                
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Nombre completo</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.firstName} {professional.user?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.phone || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Ubicación</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.location || "No especificada"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha de nacimiento</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.birthDate ? 
                        new Date(professional.user.birthDate).toLocaleDateString() : 
                        "No proporcionada"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha de registro</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(professional.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Información de Contacto</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <WhatsApp className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.whatsapp || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Instagram className="h-4 w-4 text-pink-600" />
                  <div>
                    <p className="text-sm font-medium">Instagram</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.instagram || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Facebook</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.facebook || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  <div>
                    <p className="text-sm font-medium">LinkedIn</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.linkedin || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Sitio Web</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.website || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Portfolio</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.portfolio || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">CV</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.cv || "No proporcionado"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información profesional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Información Profesional</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Años de experiencia</p>
                  <p className="text-sm text-muted-foreground">
                    {professional.experienceYears} años
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Biografía profesional</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {professional.bio}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Servicios ofrecidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Servicios Ofrecidos</span>
              </CardTitle>
              <CardDescription>
                Servicios que este profesional ofrece en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {professionalServices.map((service) => (
                  <div key={service.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-medium">{service.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline">
                            {service.categoryGroup === "oficios" ? "Oficios" : "Profesiones"}
                          </Badge>
                          <span className="text-sm font-medium text-green-600">
                            {service.priceRange}
                          </span>
                          <Badge 
                            variant={service.available ? "default" : "secondary"}
                            className={service.available ? "bg-green-500" : ""}
                          >
                            {service.available ? "Disponible" : "No disponible"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {professionalServices.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Este profesional no ha registrado servicios aún.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral de acciones */}
        <div className="space-y-6">
          {/* Estadísticas rápidas */}
          <Link href={`/dashboard/servicios/profesionales/${professional.id}/edit`} className="w-full">
                  <Button variant="default" size="sm" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Información
                  </Button>
                </Link>
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calificación</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm">
                    {professional.rating > 0 ? professional.rating.toFixed(1) : "Sin calificar"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Evaluaciones</span>
                <span className="text-sm text-muted-foreground">
                  {professional.reviewCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Servicios</span>
                <span className="text-sm text-muted-foreground">
                  {professionalServices.length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Acciones de aprobación */}
          {professional.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones de Aprobación</CardTitle>
                <CardDescription>
                  Revisa la información y decide si aprobar o rechazar al profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Notas sobre la decisión
                  </label>
                  <Textarea
                    placeholder="Agrega comentarios sobre tu decisión..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprobar Profesional
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleReject}
                    disabled={isProcessing}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar Solicitud
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acciones de certificación */}
          <Card>
            <CardHeader>
              <CardTitle>Certificación de Servicios</CardTitle>
              <CardDescription>
                Certifica los servicios del profesional después de verificar su calidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado de certificación</span>
                {getCertifiedBadge(professional.certified)}
              </div>
              {!professional.certified && (
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleCertify}
                  disabled={isProcessing}
                >
                  <Award className="mr-2 h-4 w-4" />
                  Certificar Servicios
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ID del profesional</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {professional.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ID del usuario</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {professional.userId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Última actualización</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(professional.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}