"use client"

import { ChevronDownIcon } from "@radix-ui/react-icons"
import { CheckIcon, PlusCircle } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from 'react-hook-form'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"


// Define interfaces based on page.tsx (adjust if API returns different fields)
interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  email?: string; // Assuming email might be available, make optional for now
  role: Role[];
  roleId: number;
}

// <-- Definir schema de usuario (copiado de page.tsx)
const userSchema = z.object({
  email: z.string().email({ message: "Ingrese un correo electrónico válido." }),
  username: z.string().min(4, { message: "El nombre de usuario debe tener al menos 4 caracteres." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  roleId: z.string().min(1, { message: "Seleccione un rol." }),
});
// --> Fin schema

interface RolesCardProps {
  users: User[];
  roles: Role[];
  onRoleChange: (userId: number, newRoleId: number) => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  toast: ReturnType<typeof useToast>['toast'];
}

export function RolesCard({ users, roles, onRoleChange, setUsers, toast }: RolesCardProps) {
   const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);

   const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      roleId: "",
    },
  });

  const onSubmitUser = async (values: z.infer<typeof userSchema>) => {
    try {
      const response = await fetch('/api/users', { // Asumiendo que esta es la ruta correcta
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        userForm.reset();
        const nuevoUsuario = await response.json();
        // Actualizar el estado de usuarios en page.tsx
        setUsers(prev => [...prev, nuevoUsuario]);
        toast({
          description: "Usuario creado con éxito.",
          variant: 'default'
        });
        setIsCreateUserDialogOpen(false); // Cerrar diálogo
      } else {
        console.error('Error al crear el usuario');
        toast({
          title: "Error",
          description: "No se pudo crear el usuario.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error al crear el usuario:', error);
       toast({
         title: "Error",
         description: "Ocurrió un error de red al crear el usuario.",
         variant: "destructive",
       });
    }
  };

   const getInitials = (name: string) => {
     return name ? name.charAt(0).toUpperCase() : '?';
   };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
           <div>
            <CardTitle>Miembros del Equipo</CardTitle>
            <CardDescription>
              Administra los roles de los miembros o invita a uno nuevo.
            </CardDescription>
           </div>
           <Button onClick={() => setIsCreateUserDialogOpen(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Invitar Miembro
           </Button>
        </CardHeader>
        <CardContent className="grid gap-6">
           {(!users || users.length === 0) ? (
             <p className="text-sm text-muted-foreground">No se encontraron miembros.</p>
           ) : (
             users.map((user) => {
               const currentRoleId = user.roleId;
               const currentRole = roles.find(r => r.id === currentRoleId);
               const currentRoleName = currentRole?.name ?? "Select Role";

               return (
                 <div key={user.id} className="flex items-center justify-between space-x-4">
                   <div className="flex items-center space-x-4">
                     <Avatar className="h-8 w-8">
                       <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} alt={user.username} /> 
                       <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                     </Avatar>
                     <div>
                       <p className="text-sm font-medium leading-none">{user.username}</p>
                       <p className="text-sm text-muted-foreground">
                         {user.email ? user.email : currentRoleName}
                       </p>
                     </div>
                   </div>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto w-[110px] justify-between">
                         <span className="truncate">{currentRoleName}</span>
                         <ChevronDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-56" align="end">
                       <DropdownMenuGroup>
                         {roles.map((role) => (
                           <DropdownMenuItem
                             key={role.id}
                              onClick={() => {
                                if (role.id !== currentRoleId) {
                                  onRoleChange(user.id, role.id);
                                }
                              }}
                              disabled={role.id === currentRoleId}
                              className="cursor-pointer flex justify-between items-center"
                           >
                             <span>{role.name}</span>
                              {role.id === currentRoleId && <CheckIcon className="h-4 w-4" />}
                           </DropdownMenuItem>
                         ))}
                          {roles.length === 0 && <DropdownMenuItem disabled>No roles available</DropdownMenuItem>}
                       </DropdownMenuGroup>
                     </DropdownMenuContent>
                   </DropdownMenu>
                 </div>
               );
             })
           )}
        </CardContent>
      </Card>

      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
            <DialogDescription>
              Completa los detalles para invitar a un nuevo miembro al equipo.
            </DialogDescription>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4 py-4">
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="miembro@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="nombre.usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Temporal</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol Asignado</FormLabel>
                    <FormControl>
                       <Select onValueChange={field.onChange} value={field.value}>
                         <SelectTrigger>
                           <SelectValue placeholder="Seleccionar rol" />
                         </SelectTrigger>
                         <SelectContent>
                           {roles.map((role) => (
                             <SelectItem key={role.id} value={role.id.toString()}>
                               {role.name}
                             </SelectItem>
                           ))}
                           {roles.length === 0 && <div className="px-2 py-1.5 text-sm text-muted-foreground">No hay roles disponibles</div>}
                         </SelectContent>
                       </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Invitar Miembro</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}