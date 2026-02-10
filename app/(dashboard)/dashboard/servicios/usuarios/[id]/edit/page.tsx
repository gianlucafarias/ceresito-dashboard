"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  AlertCircle,
  CheckCircle2,
  Shield,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, APIUserResponse } from "../../../_lib/api-client";

interface EditUserPageProps {
  params: {
    id: string;
  };
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<APIUserResponse | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    location: "",
    role: "citizen" as "citizen" | "professional" | "admin",
    verified: false,
    suspended: false,
  });

  // Cargar datos del usuario desde la API
  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        const response = await apiClient.getUser(params.id);

        if (response.success) {
          setUser(response.data);
          setFormData({
            firstName: response.data.firstName || "",
            lastName: response.data.lastName || "",
            email: response.data.email || "",
            phone: response.data.phone || "",
            birthDate: response.data.birthDate
              ? new Date(response.data.birthDate).toISOString().split("T")[0]
              : "",
            location: response.data.location || "",
            role: response.data.role,
            verified: response.data.verified || false,
            suspended:
              response.data.professional?.status === "suspended" || false,
          });
        } else {
          console.error("Error loading user:", response.message);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [params.id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Preparar datos para enviar a la API
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        birthDate: formData.birthDate || undefined,
        location: formData.location || undefined,
        role: formData.role,
        verified: formData.verified,
      };

      // Solo incluir suspended si cambió
      if (formData.suspended !== (user?.professional?.status === "suspended")) {
        updateData.suspended = formData.suspended;
      }

      // Enviar actualización a la API
      const response = await apiClient.updateUser(params.id, updateData);

      if (response.success) {
        alert("Cambios guardados correctamente");
        // Redirigir de vuelta a la página de detalles
        router.push(`/dashboard/servicios/usuarios/${params.id}`);
      } else {
        alert(`Error al guardar: ${response.message}`);
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert("Error de conexión al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/servicios/usuarios/${params.id}`);
  };

  const handleSuspendChange = (checked: boolean) => {
    if (checked) {
      // Suspender: mostrar dialog de confirmación
      setShowSuspendDialog(true);
    } else {
      // Reactivar: cambiar directamente
      handleInputChange(suspended, false);
    }
  };

  const handleConfirmSuspend = () => {
    setShowSuspendDialog(false);
    handleInputChange(suspended, true);
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    setIsUpdatingStatus(true);
    try {
      const response = await apiClient.deleteUser(user.id);

      if (response.success) {
        alert("Usuario eliminado correctamente");
        // Redirigir a la lista de usuarios
        router.push("/dashboard/servicios/usuarios");
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      alert("Error de conexión al eliminar el usuario");
    } finally {
      setIsUpdatingStatus(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Cargando información del usuario...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-muted-foreground">
            Usuario no encontrado
          </h2>
          <p className="text-muted-foreground mt-2">
            El usuario que buscas no existe o ha sido eliminado.
          </p>
          <Link href="/dashboard/servicios/usuarios">
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
        <Link href={`/dashboard/servicios/usuarios/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a detalles
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Editar Usuario
            </h2>
            <p className="text-muted-foreground">
              Modifica la información del usuario: {user.firstName}{" "}
              {user.lastName}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              ID: {user.id}
            </Badge>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-6"
      >
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información Personal</span>
            </CardTitle>
            <CardDescription>
              Datos personales básicos del usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  placeholder="Nombre del usuario"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  placeholder="Apellido del usuario"
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
                  onChange={(e) =>
                    handleInputChange("birthDate", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="Ciudad, Provincia"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado y Permisos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Estado y Permisos</span>
            </CardTitle>
            <CardDescription>
              Gestiona el rol, verificación y estado del usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen">Ciudadano</SelectItem>
                    <SelectItem value="professional">Profesional</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-3 pt-8">
                <input
                  type="checkbox"
                  id="verified"
                  checked={formData.verified}
                  onChange={(e) =>
                    handleInputChange("verified", e.target.checked)
                  }
                  className="h-4 w-4"
                />
                <Label
                  htmlFor="verified"
                  className="flex items-center space-x-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Usuario Verificado</span>
                </Label>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="suspended" className="text-base font-medium">
                  Suspender Usuario
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.suspended
                    ? "El usuario está suspendido. Si tiene un Professional, su estado será suspended y no aparecerá en búsquedas públicas."
                    : "El usuario está activo y puede usar la plataforma normalmente."}
                </p>
              </div>
              <Switch
                id="suspended"
                checked={formData.suspended}
                onCheckedChange={handleSuspendChange}
                disabled={isUpdatingStatus}
              />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Verificado:</strong> El usuario ha sido verificado y
                puede acceder a todas las funcionalidades.
                <br />
                <strong>Suspender:</strong> Al suspender un usuario, si tiene un
                Professional asociado, se actualizará su estado a suspended y
                dejará de aparecer en búsquedas públicas. Esta acción es
                reversible.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Acciones Peligrosas */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Zona de Peligro</span>
            </CardTitle>
            <CardDescription>
              Acciones irreversibles que afectan permanentemente al usuario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-red-900">
                      Eliminar Usuario
                    </h4>
                    <p className="text-sm text-red-700">
                      Esta acción eliminará permanentemente el usuario y todos
                      sus datos asociados:
                      {user.professional && (
                        <>
                          <br />• Perfil profesional
                          <br />• Servicios ofrecidos
                        </>
                      )}
                      <br />• Reseñas y comentarios
                      <br />• Solicitudes de contacto
                      <br />• Todos los datos relacionados
                    </p>
                    <p className="text-sm font-medium text-red-800 mt-2">
                      ⚠️ Esta acción NO se puede deshacer
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isUpdatingStatus}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Usuario
                  </Button>
                </div>
              </div>
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

      {/* Dialog de confirmación para suspender */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span>Suspender Usuario</span>
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas suspender este usuario?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Al suspender el usuario:
              {user.professional && (
                <>
                  <br />• El Professional asociado cambiará su estado a{" "}
                  <strong>suspended</strong>
                  <br />• No aparecerá en búsquedas públicas de la plataforma
                  <br />• Los servicios seguirán existiendo pero no serán
                  visibles
                </>
              )}
              {!user.professional && (
                <>
                  <br />• El usuario no podrá acceder a ciertas funcionalidades
                </>
              )}
              <br />
              <br />
              <strong>Esta acción es reversible:</strong> puedes reactivar al
              usuario cambiando el switch a desactivado.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSuspend}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Suspender Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>Eliminar Usuario Permanentemente</span>
            </DialogTitle>
            <DialogDescription>
              ¿Estás completamente seguro de que deseas eliminar este usuario?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                Esta acción eliminará permanentemente:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>El usuario y su cuenta</li>
                {user.professional && (
                  <>
                    <li>El perfil profesional asociado</li>
                    <li>Todos los servicios ofrecidos</li>
                  </>
                )}
                <li>Todas las reseñas y comentarios</li>
                <li>Todas las solicitudes de contacto</li>
                <li>Todos los datos relacionados</li>
              </ul>
              <p className="text-sm font-medium text-red-600 mt-4">
                ⚠️ Esta acción NO se puede deshacer
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isUpdatingStatus}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? "Eliminando..." : "Eliminar Permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
