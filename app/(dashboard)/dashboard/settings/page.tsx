"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DeleteIcon, Pencil, PlusCircle } from "lucide-react";
import {useForm} from 'react-hook-form'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast"
import { RolesCard } from "./components/RolesCard";
import ProfilePhotoCard from './components/ProfilePhotoCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface Role {
  id: number,
  name: string
}

interface User {
  id: number,
  username: string,
  email?: string,
  role: Role[],
  roleId: number
}

interface TipoReclamo {
  id: number,
  nombre: string
}

const tipoReclamoSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
});

const roleSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
});

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [tipoReclamos, setTipoReclamos] = useState<TipoReclamo[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: number; roleId: number } | null>(null);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editedRoleName, setEditedRoleName] = useState('');
  const [isEditTipoDialogOpen, setIsEditTipoDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoReclamo | null>(null);
  const [editedTipoName, setEditedTipoName] = useState('');
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [isCreateTipoDialogOpen, setIsCreateTipoDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tipoToDeleteId, setTipoToDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tipoReclamosResponse = await fetch('/api/tipoReclamo');
        const rolesResponse = await fetch('/api/user/roles');
        const usersResponse = await fetch('/api/user');
        
        if (tipoReclamosResponse.ok && rolesResponse.ok && usersResponse.ok) {
          const tipoReclamosData = await tipoReclamosResponse.json();
          const rolesData = await rolesResponse.json();
          const usersData = await usersResponse.json();

          setTipoReclamos(tipoReclamosData);
          setRoles(rolesData);
          setUsers(Array.isArray(usersData) ? usersData : []);
        } else {
          console.error('Failed to fetch initial data:', {
            tipos: tipoReclamosResponse.status,
            roles: rolesResponse.status,
            users: usersResponse.status
          });
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const tipoReclamoForm = useForm<z.infer<typeof tipoReclamoSchema>>({
    resolver: zodResolver(tipoReclamoSchema),
    defaultValues: {
      nombre: "",
    },
  });

  const roleForm = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmitTipoReclamo = async (values: z.infer<typeof tipoReclamoSchema>) => {
    try {
      const response = await fetch('/api/tipoReclamo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        tipoReclamoForm.reset();
        const nuevoTipoReclamo = await response.json();
        setTipoReclamos(prev => [...prev, nuevoTipoReclamo]);
        toast({
          description: "Tipo de arreglo cargado con éxito.",
          variant: 'default'
        });
        setIsCreateTipoDialogOpen(false);
      } else {
        console.error('Error al enviar el tipo de reclamo');
      }
    } catch (error) {
      console.error('Error al enviar el tipo de reclamo:', error);
    }
  };

  const onSubmitRole = async (values: z.infer<typeof roleSchema>) => {
    try {
      const response = await fetch('/api/user/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        roleForm.reset();
        const nuevoRole = await response.json();
        setRoles(prev => [...prev, nuevoRole]);
        toast({
          description: "Rol creado con éxito.",
          variant: 'default'
        });
        setIsCreateRoleDialogOpen(false);
      } else {
        console.error('Error al crear el rol');
      }
    } catch (error) {
      console.error('Error al crear el rol:', error);
    }
  };

  const handleDeleteTipoClick = (id: number) => {
    setTipoToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTipoReclamo = async () => {
    if (tipoToDeleteId === null) return;

    try {
      const response = await fetch(`/api/tipoReclamo/${tipoToDeleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTipoReclamos(prevTipos => prevTipos.filter(tipo => tipo.id !== tipoToDeleteId));
        toast({
          description: "Tipo de arreglo eliminado con éxito.",
          variant: 'default'
        });
      } else {
         const errorData = await response.json().catch(() => ({}));
         console.error('Error al eliminar el tipo de reclamo:', response.status, errorData);
         toast({
           title: "Error",
           description: `No se pudo eliminar el tipo de arreglo. ${errorData.message || ''}`,
           variant: "destructive",
         });
      }
    } catch (error) {
      console.error('Error de red al eliminar el tipo de reclamo:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error de red al eliminar el tipo de arreglo.",
        variant: "destructive",
      });
    } finally {
       setIsDeleteDialogOpen(false);
       setTipoToDeleteId(null);
    }
  };

  const handleRoleChange = (userId: number, roleId: number) => {
    setPendingRoleChange({ userId, roleId });
    setIsAlertOpen(true); 
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;

    const { userId, roleId } = pendingRoleChange;

    try {
      const response = await fetch(`/api/user/${userId}`, { 
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleId: roleId }), 
      });

      if (response.ok) {
        setUsers(prevUsers => 
          prevUsers.map(user => {
            if (user.id === userId) {
              const newRole = roles.find(r => r.id === roleId);
              return { ...user, role: newRole ? [newRole] : [] };
            }
            return user;
          })
        );
        toast({
          description: "Rol de usuario actualizado con éxito.",
          variant: 'default'
        });
      } else {
         const errorData = await response.json().catch(() => ({}));
         console.error('Error al actualizar el rol:', response.status, errorData);
         toast({
           title: "Error",
           description: `No se pudo actualizar el rol. ${errorData.message || ''}`,
           variant: "destructive",
         });
      }
    } catch (error) {
       console.error('Error al actualizar el rol:', error);
       toast({
         title: "Error",
         description: "Ocurrió un error de red al actualizar el rol.",
         variant: "destructive",
       });
    } finally {
      setIsAlertOpen(false);
      setPendingRoleChange(null);
    }
  };

  const handleEditRoleClick = (role: Role) => {
    setEditingRole(role);
    setEditedRoleName(role.name);
    setIsEditRoleDialogOpen(true);
  };

  const handleSaveRoleEdit = async () => {
    if (!editingRole || !editedRoleName || editedRoleName.trim().length < 2) {
       toast({
         title: "Error",
         description: "El nombre del rol no puede estar vacío y debe tener al menos 2 caracteres.",
         variant: "destructive",
       });
      return; 
    }
    if (editedRoleName === editingRole.name) {
      setIsEditRoleDialogOpen(false);
      setEditingRole(null);
      return;
    }

    try {
      const response = await fetch(`/api/user/roles/${editingRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedRoleName }),
      });

      if (response.ok) {
        const updatedRole = await response.json();
        
        setRoles(prevRoles => 
          prevRoles.map(r => (r.id === updatedRole.id ? updatedRole : r))
        );

        toast({ description: "Rol actualizado con éxito." });
        setIsEditRoleDialogOpen(false);
        setEditingRole(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error al actualizar el rol:', response.status, errorData);
        toast({
          title: "Error",
          description: `No se pudo actualizar el rol. ${errorData.message || ''}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error de red al actualizar el rol:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error de red al actualizar el rol.",
        variant: "destructive",
      });
    }
  };

  const handleEditTipoClick = (tipo: TipoReclamo) => {
    setEditingTipo(tipo);
    setEditedTipoName(tipo.nombre);
    setIsEditTipoDialogOpen(true);
  };

  const handleSaveTipoEdit = async () => {
    if (!editingTipo || !editedTipoName || editedTipoName.trim().length < 2) {
      toast({
        title: "Error",
        description: "El nombre del tipo de arreglo no puede estar vacío y debe tener al menos 2 caracteres.",
        variant: "destructive",
      });
      return; 
    }
    if (editedTipoName === editingTipo.nombre) {
      setIsEditTipoDialogOpen(false);
      setEditingTipo(null);
      return;
    }

    try {
      const response = await fetch(`/api/tipoReclamo/${editingTipo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editedTipoName }),
      });

      if (response.ok) {
        const updatedTipo = await response.json();
        setTipoReclamos(prevTipos => 
          prevTipos.map(t => (t.id === updatedTipo.id ? updatedTipo : t))
        );
        toast({ description: "Tipo de arreglo actualizado con éxito." });
        setIsEditTipoDialogOpen(false);
        setEditingTipo(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error al actualizar tipo de arreglo:', response.status, errorData);
        toast({
          title: "Error",
          description: `No se pudo actualizar el tipo de arreglo. ${errorData.message || ''}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error de red al actualizar tipo de arreglo:', error);
       toast({
         title: "Error",
         description: "Ocurrió un error de red al actualizar el tipo de arreglo.",
         variant: "destructive",
       });
    }
  };

  return (
    <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] bg-gray-100/40 flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 dark:bg-gray-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfilePhotoCard />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Tipos de Reclamos</CardTitle>
                <CardDescription>
                  Administra los tipos de reclamos que se pueden reportar.
                </CardDescription>
             </div>
             <Button onClick={() => setIsCreateTipoDialogOpen(true)} size="sm">
                 <PlusCircle className="mr-2 h-4 w-4" />
                 Crear Tipo
             </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 mt-6">
              <h2 className="font-semibold text-lg">Tipos de Arreglos Existentes</h2>
              <div className="grid gap-2">
                {isLoading ? (
                   <>
                     <Skeleton className="h-10 w-full" /> 
                     <Skeleton className="h-10 w-full" /> 
                     <Skeleton className="h-10 w-full" /> 
                   </>
                )
                : tipoReclamos.length > 0 ? (
                  tipoReclamos.map((tipoReclamo) => (
                     <div key={tipoReclamo.id} className="flex items-center justify-between bg-gray-100 px-4 py-3 rounded-md dark:bg-gray-950">
                       <span>{tipoReclamo.nombre}</span>
                       <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditTipoClick(tipoReclamo)}
                            className="h-8 w-8" 
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar Tipo</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTipoClick(tipoReclamo.id)} className="h-8 w-8">
                            <DeleteIcon className="w-4 h-4" />
                            <span className="sr-only">Eliminar Tipo</span>
                          </Button>
                       </div>
                     </div>
                  ))
                ) : (
                   <p className="text-sm text-muted-foreground">No hay tipos de arreglos creados aún.</p>
                 )} 
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
             <div>
                <CardTitle>Administrar Roles</CardTitle>
                <CardDescription>
                  Administra los roles existentes o crea uno nuevo.
                </CardDescription>
             </div>
             <Button onClick={() => setIsCreateRoleDialogOpen(true)} size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Rol
             </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 mt-6">
              <h2 className="font-semibold text-lg">Roles Existentes</h2>
              <div className="grid gap-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between bg-gray-100 px-4 py-3 rounded-md dark:bg-gray-950">
                    <span>{role.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditRoleClick(role)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar Rol</span>
                    </Button>
                  </div>
                ))}
                {roles.length === 0 && (
                   <p className="text-sm text-muted-foreground">No hay roles creados aún.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <RolesCard 
            users={users} 
            roles={roles} 
            onRoleChange={handleRoleChange} 
            setUsers={setUsers}
            toast={toast}
        />
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cambio de Rol</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cambiar el rol de este usuario? 
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingRoleChange(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Nombre del Rol</DialogTitle>
            <DialogDescription>
              Cambia el nombre del rol. Haz clic en guardar cuando termines.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-name" className="text-right">
                Nombre
              </Label>
              <Input 
                id="role-name" 
                value={editedRoleName} 
                onChange={(e) => setEditedRoleName(e.target.value)}
                className="col-span-3" 
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveRoleEdit}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTipoDialogOpen} onOpenChange={setIsEditTipoDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Tipo de Arreglo</DialogTitle>
            <DialogDescription>
              Cambia el nombre del tipo de arreglo. Haz clic en guardar cuando termines.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipo-name" className="text-right">
                Nombre
              </Label>
              <Input 
                id="tipo-name" 
                value={editedTipoName} 
                onChange={(e) => setEditedTipoName(e.target.value)}
                className="col-span-3" 
              />
            </div>
          </div>
          <DialogFooter>
             <DialogClose asChild>
                 <Button type="button" variant="outline">Cancelar</Button>
             </DialogClose>
            <Button type="button" onClick={handleSaveTipoEdit}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Rol</DialogTitle>
            <DialogDescription>
              Ingresa el nombre del nuevo rol que deseas crear.
            </DialogDescription>
          </DialogHeader>
          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(onSubmitRole)} className="space-y-4 py-4">
              <FormField
                control={roleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Rol</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Moderador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Crear Rol</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateTipoDialogOpen} onOpenChange={setIsCreateTipoDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Tipo de Arreglo</DialogTitle>
            <DialogDescription>
              Ingresa el nombre del nuevo tipo de arreglo que deseas crear.
            </DialogDescription>
          </DialogHeader>
          <Form {...tipoReclamoForm}>
            <form onSubmit={tipoReclamoForm.handleSubmit(onSubmitTipoReclamo)} className="space-y-4 py-4">
              <FormField
                control={tipoReclamoForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Arreglo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Poste caído" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Crear Tipo</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el tipo de arreglo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTipoToDeleteId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTipoReclamo}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
