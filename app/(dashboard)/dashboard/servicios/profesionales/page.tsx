"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Check, 
  X, 
  Star,
  MapPin,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Chrome,
  Facebook
} from "lucide-react";
import { apiClient } from "../_lib/api-client";
import { adaptProfessionals } from "../_lib/api-adapters";
import { Professional } from "../_types";
import { BulkUploadProfessionals } from "./_components/bulk-upload";

export default function ProfesionalesPage() {
  const router = useRouter();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Función para cargar profesionales
  const fetchProfessionals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        limit: 20,
      };
      
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.grupo = categoryFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await apiClient.listProfessionals(params);
      
      if (response.success && 'pagination' in response) {
        const adaptedProfessionals = adaptProfessionals(response.data);
        setProfessionals(adaptedProfessionals);
        setPagination(response.pagination);
      } else {
        setError((response as any).message || 'Error al cargar profesionales');
      }
    } catch (err) {
      console.error('Error fetching professionals:', err);
      setError('Error de conexión al cargar profesionales');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, categoryFilter, searchTerm]);

  // Cargar profesionales desde la API
  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const handleViewDetails = (professionalId: string) => {
    router.push(`/dashboard/servicios/profesionales/${professionalId}`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredProfessionals = professionals;

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
        Verificado
      </Badge>
    ) : (
      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
        Sin verificar
      </Badge>
    );
  };

  const getRegistrationTypeBadge = (registrationType?: string) => {
    if (!registrationType) return null;
    
    switch (registrationType) {
      case 'google':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Chrome className="mr-1 h-3 w-3" />
            Google
          </Badge>
        );
      case 'facebook':
        return (
          <Badge variant="outline" className="text-blue-700 border-blue-700">
            <Facebook className="mr-1 h-3 w-3" />
            Facebook
          </Badge>
        );
      case 'email':
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <Mail className="mr-1 h-3 w-3" />
            Email
          </Badge>
        );
    }
  };

  if (error) {
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
            Profesionales
          </h2>
          <p className="text-muted-foreground">
            Gestiona los profesionales registrados en la plataforma
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <BulkUploadProfessionals onUploadComplete={fetchProfessionals} />
          <Badge variant="outline" className="text-sm">
            {pagination.total} profesionales totales
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="oficios">Oficios</SelectItem>
                <SelectItem value="profesiones">Profesiones</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de profesionales */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Profesionales</CardTitle>
          <CardDescription>
            Haz clic en un profesional para ver sus detalles y gestionar su aprobación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando profesionales...</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Categorías</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Verificación</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Experiencia</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessionals.map((professional) => (
                <TableRow 
                  key={professional.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetails(professional.id)}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {professional.user?.firstName} {professional.user?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {professional.user?.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{professional.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {professional.services?.slice(0, 2).map((service, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {service.categoryGroup === "oficios" ? "Oficios" : "Profesiones"}
                        </Badge>
                      ))}
                      {professional.services && professional.services.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{professional.services.length - 2} más
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(professional.status)}
                  </TableCell>
                  <TableCell>
                    {getVerifiedBadge(professional.verified)}
                  </TableCell>
                  <TableCell>
                    {getRegistrationTypeBadge((professional as any).registrationType)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{professional.experienceYears} años</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-sm">
                        {professional.rating > 0 ? professional.rating.toFixed(1) : "Sin calificar"}
                      </span>
                      {professional.reviewCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({professional.reviewCount})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(professional.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        {professional.status === "pending" && (
                          <>
                            <DropdownMenuItem className="text-green-600">
                              <Check className="mr-2 h-4 w-4" />
                              Aprobar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <X className="mr-2 h-4 w-4" />
                              Rechazar
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          Suspender cuenta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredProfessionals.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No se encontraron profesionales que coincidan con los filtros aplicados.
                  </p>
                </div>
              )}

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages} • {pagination.total} profesionales totales
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
