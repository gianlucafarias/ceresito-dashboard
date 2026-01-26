"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft,
  Bug,
  Mail, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Loader2,
  AlertCircle,
  Monitor,
  Globe,
  Smartphone
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient, APIBugReportResponse } from "../../_lib/api-client";

interface BugReportDetailPageProps {
  params: {
    id: string;
  };
}

export default function BugReportDetailPage({ params }: BugReportDetailPageProps) {
  const router = useRouter();
  const [bugReport, setBugReport] = useState<APIBugReportResponse | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: 'open' as 'open' | 'in_progress' | 'resolved' | 'closed',
    severity: 'low' as 'low' | 'medium' | 'high' | 'critical',
    adminNotes: '',
  });

  // Cargar datos del bug report
  useEffect(() => {
    async function fetchBugReport() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.getBugReport(params.id);
        
        if (response.success) {
          setBugReport(response.data);
          setEditFormData({
            status: response.data.status,
            severity: response.data.severity,
            adminNotes: response.data.adminNotes || '',
          });
        } else {
          setError(response.message || 'Error al cargar el bug report');
        }
      } catch (err) {
        console.error('Error fetching bug report:', err);
        setError('Error de conexión al cargar el bug report');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBugReport();
  }, [params.id]);

  const handleSaveEdit = async () => {
    if (!bugReport) return;

    try {
      setIsSaving(true);
      const response = await apiClient.updateBugReport(bugReport.id, editFormData);
      
      if (response.success) {
        setBugReport(response.data);
        setIsEditDialogOpen(false);
      } else {
        setError((response as any).message || 'Error al actualizar bug report');
      }
    } catch (err) {
      console.error('Error updating bug report:', err);
      setError('Error al actualizar bug report');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando información del bug report...</span>
        </div>
      </div>
    );
  }

  if (error || !bugReport) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600 font-medium">{error || 'Bug report no encontrado'}</p>
            </div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/dashboard/servicios/bug-reports')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Bug Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-500">Abierto</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500">En Progreso</Badge>;
      case "resolved":
        return <Badge className="bg-green-500">Resuelto</Badge>;
      case "closed":
        return <Badge className="bg-gray-500">Cerrado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-600">Crítico</Badge>;
      case "high":
        return <Badge className="bg-orange-500">Alto</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medio</Badge>;
      case "low":
        return <Badge className="bg-blue-500">Bajo</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/dashboard/servicios/bug-reports')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {bugReport.title}
            </h2>
            <p className="text-muted-foreground">
              Detalles del bug report
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Información Principal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="h-5 w-5" />
              <span>Información del Reporte</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Título</p>
              <p className="text-base font-semibold">{bugReport.title}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Descripción</p>
              <p className="text-base whitespace-pre-wrap">{bugReport.description}</p>
            </div>
            {bugReport.adminNotes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notas del Administrador</p>
                  <p className="text-base whitespace-pre-wrap bg-muted p-3 rounded-md">{bugReport.adminNotes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Estado y Metadatos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Estado</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Estado</p>
              {getStatusBadge(bugReport.status)}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Severidad</p>
              {getSeverityBadge(bugReport.severity)}
            </div>
            {bugReport.userEmail && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Email del Usuario</p>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{bugReport.userEmail}</p>
                </div>
              </div>
            )}
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Fecha de Creación</p>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{formatDate(bugReport.createdAt)}</p>
              </div>
            </div>
            {bugReport.resolvedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Fecha de Resolución</p>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-sm">{formatDate(bugReport.resolvedAt)}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Última Actualización</p>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{formatDate(bugReport.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contexto Técnico */}
        {bugReport.context && Object.keys(bugReport.context).length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Contexto Técnico</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {bugReport.context.browser && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Navegador</p>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{bugReport.context.browser}</p>
                    </div>
                  </div>
                )}
                {bugReport.context.os && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Sistema Operativo</p>
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{bugReport.context.os}</p>
                    </div>
                  </div>
                )}
                {bugReport.context.url && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">URL</p>
                    <p className="text-base break-all">{bugReport.context.url}</p>
                  </div>
                )}
                {Object.entries(bugReport.context).map(([key, value]) => {
                  if (['browser', 'os', 'url'].includes(key)) return null;
                  return (
                    <div key={key}>
                      <p className="text-sm font-medium text-muted-foreground mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-base">{String(value)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo para editar bug report */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Bug Report</DialogTitle>
            <DialogDescription>
              Actualiza el estado y la información del bug report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="severity">Severidad</Label>
              <Select
                value={editFormData.severity}
                onValueChange={(value: any) => setEditFormData({ ...editFormData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Bajo</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adminNotes">Notas del Administrador</Label>
              <Textarea
                id="adminNotes"
                value={editFormData.adminNotes}
                onChange={(e) => setEditFormData({ ...editFormData, adminNotes: e.target.value })}
                placeholder="Agregar notas o comentarios sobre este bug report..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
