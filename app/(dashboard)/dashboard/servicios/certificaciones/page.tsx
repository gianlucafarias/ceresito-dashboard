"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Loader2,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  User,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient, APICertificationResponse } from "../_lib/api-client";

type CertificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export default function CertificacionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const professionalId = searchParams.get('professionalId');
  const [certifications, setCertifications] = useState<APICertificationResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<CertificationStatus | "all">("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchCertifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== "all") params.status = statusFilter;
      if (professionalId) params.professionalId = professionalId;

      const response = await apiClient.listCertifications(params);

      if (response.success && "pagination" in response) {
        setCertifications(response.data);
        setPagination(response.pagination);
      } else {
        setError((response as any).message || "Error al cargar certificaciones");
      }
    } catch (err) {
      console.error("Error fetching certifications:", err);
      setError("Error de conexión al cargar certificaciones");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, professionalId]);

  useEffect(() => {
    fetchCertifications();
  }, [fetchCertifications]);

  const handleStatusChange = async (
    cert: APICertificationResponse,
    newStatus: CertificationStatus
  ) => {
    try {
      setIsLoading(true);
      const response = await apiClient.updateCertification(cert.id, {
        status: newStatus,
      });

      if (response.success) {
        // Actualizar en memoria sin recargar todo
        setCertifications((prev) =>
          prev.map((c) => (c.id === cert.id ? response.data : c))
        );
      } else {
        setError(response.message || "Error al actualizar certificación");
      }
    } catch (err) {
      console.error("Error updating certification:", err);
      setError("Error de conexión al actualizar certificación");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfessional = (cert: APICertificationResponse) => {
    if (cert.professionalId) {
      router.push(`/dashboard/servicios/profesionales/${cert.professionalId}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusBadge = (status: CertificationStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="mr-1 h-3 w-3" />
            Pendiente
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-600">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Aprobada
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <ShieldOff className="mr-1 h-3 w-3" />
            Rechazada
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-orange-500">
            <ShieldAlert className="mr-1 h-3 w-3" />
            Suspendida
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Certificaciones
          </h2>
          <p className="text-muted-foreground">
            Solicitudes de certificación de profesionales para verificar títulos, matrículas u otras credenciales.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {pagination.total} solicitudes
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
          <CardDescription>
            Filtra las solicitudes por estado de revisión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={statusFilter}
              onValueChange={(value: CertificationStatus | "all") =>
                setStatusFilter(value)
              }
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobada</SelectItem>
                <SelectItem value="rejected">Rechazada</SelectItem>
                <SelectItem value="suspended">Suspendida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Certificación</CardTitle>
          <CardDescription>
            Revisa y gestiona las certificaciones enviadas por los profesionales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center space-x-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Cargando certificaciones...
              </span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Organismo</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certifications.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {cert.professional?.user
                                ? `${cert.professional.user.firstName} ${cert.professional.user.lastName}`
                                : "Sin datos"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {cert.professional?.user?.email}
                            </div>
                            {cert.category && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {cert.category.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {cert.certificationType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {cert.issuingOrganization || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {cert.certificationNumber || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {cert.issuedAt && (
                            <div>
                              <span className="font-medium">Emitida: </span>
                              {new Date(cert.issuedAt).toLocaleDateString("es-AR")}
                            </div>
                          )}
                          {cert.expiresAt && (
                            <div>
                              <span className="font-medium">Vence: </span>
                              {new Date(cert.expiresAt).toLocaleDateString("es-AR")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(cert.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewProfessional(cert)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Ver perfil profesional
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {cert.status !== "approved" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(cert, "approved")}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Aprobar
                              </DropdownMenuItem>
                            )}
                            {cert.status !== "rejected" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(cert, "rejected")}
                                className="text-red-600"
                              >
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Rechazar
                              </DropdownMenuItem>
                            )}
                            {cert.status !== "suspended" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(cert, "suspended")}
                                className="text-orange-600"
                              >
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Suspender
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {certifications.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay solicitudes de certificación para los filtros seleccionados.
                  </p>
                </div>
              )}

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages} •{" "}
                    {pagination.total} certificaciones totales
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={
                        pagination.page === pagination.totalPages || isLoading
                      }
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

