"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteIcon } from "lucide-react";
import {useForm} from 'react-hook-form'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast"
import { RolesCard } from "./components/RolesCard";

interface Role {
  id: number,
  name: string
}

interface User {
  id: number,
  username: string,
  role: Role[];
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

const userSchema = z.object({
  email: z.string().email({ message: "Ingrese un correo electrónico válido." }),
  username: z.string().min(4, { message: "El nombre de usuario debe tener al menos 4 caracteres." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  roleId: z.string().min(1, { message: "Seleccione un rol." }),
});

export default function Page() {
  const { register, handleSubmit, reset } = useForm()
  const [tipoReclamos, setTipoReclamos] = useState<TipoReclamo[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

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
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Error al obtener los datos:', error);
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

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      roleId: "",
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
          description: "Tipo de reclamo cargado con éxito.",
          variant: 'default'
        });
      } else {
        console.error('Error al enviar el tipo de reclamo');
      }
    } catch (error) {
      console.error('Error al enviar el tipo de reclamo:', error);
    }
  };

  const onSubmitRole = async (values: z.infer<typeof roleSchema>) => {
    try {
      const response = await fetch('/api/roles', {
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
      } else {
        console.error('Error al crear el rol');
      }
    } catch (error) {
      console.error('Error al crear el rol:', error);
    }
  };

  const onSubmitUser = async (values: z.infer<typeof userSchema>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        userForm.reset();
        const nuevoUsuario = await response.json();
        setUsers(prev => [...prev, nuevoUsuario]);
        toast({
          description: "Usuario creado con éxito.",
          variant: 'default'
        });
      } else {
        console.error('Error al crear el usuario');
      }
    } catch (error) {
      console.error('Error al crear el usuario:', error);
    }
  };

  const handleDeleteTipoReclamo = async (id: number) => {
    try {
      const response = await fetch('/api/tipoReclamo', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setTipoReclamos(tipoReclamos.filter(tipo => tipo.id !== id));
      }
    } catch (error) {
      console.error('Error al eliminar el tipo de reclamo:', error);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] bg-gray-100/40 flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 dark:bg-gray-800/40">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Arreglos</CardTitle>
            <CardDescription>
              Crea, edita y elimina los diferentes tipos de arreglos que se pueden reportar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...tipoReclamoForm}>
              <div className="grid gap-4">
                <form onSubmit={tipoReclamoForm.handleSubmit(onSubmitTipoReclamo)} className="space-y-8">
                  <div className="grid gap-2">
                    <FormField
                      control={tipoReclamoForm.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Arreglo: </FormLabel>
                          <FormControl>
                            <Input placeholder="Luminarias" {...field} />
                          </FormControl>
                          <FormDescription>
                            This is your public display name.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Cargar</Button>
                  </div>
                </form>
              </div>
            </Form>
            <div className="grid gap-4 mt-6">
              <h2 className="font-semibold text-lg">Tipos de Arreglos Existentes</h2>
              <div className="grid gap-2">
                {tipoReclamos.map((tipoReclamo) => (
                  <div key={tipoReclamo.id} className="flex items-center justify-between bg-gray-100 px-4 py-3 rounded-md dark:bg-gray-950">
                    <span>{tipoReclamo.nombre}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => handleDeleteTipoReclamo(tipoReclamo.id)}>
                        <DeleteIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear Roles</CardTitle>
            <CardDescription>
              Crea nuevos roles para asignar a los usuarios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...roleForm}>
              <div className="grid gap-4">
                <form onSubmit={roleForm.handleSubmit(onSubmitRole)} className="space-y-8">
                  <div className="grid gap-2">
                    <FormField
                      control={roleForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Rol: </FormLabel>
                          <FormControl>
                            <Input placeholder="Administrador" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Cargar</Button>
                  </div>
                </form>
              </div>
            </Form>
            <div className="grid gap-4 mt-6">
              <h2 className="font-semibold text-lg">Roles Existentes</h2>
              <div className="grid gap-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between bg-gray-100 px-4 py-3 rounded-md dark:bg-gray-950">
                    <span>{role.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear Usuarios</CardTitle>
            <CardDescription>
              Crea nuevos usuarios y asigna roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...userForm}>
              <div className="grid gap-4">
                <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-8">
                  <div className="grid gap-2">
                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico: </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="correo@ejemplo.com" {...field} />
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
                          <FormLabel>Nombre de Usuario: </FormLabel>
                          <FormControl>
                            <Input placeholder="nombredeusuario" {...field} />
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
                          <FormLabel>Contraseña: </FormLabel>
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
                          <FormLabel>Rol: </FormLabel>
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
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Cargar</Button>
                  </div>
                </form>
              </div>
            </Form>

            <div className="grid gap-4 mt-6">
              <h2 className="font-semibold text-lg">Usuarios Existentes</h2>
              <div className="grid gap-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between bg-gray-100 px-4 py-3 rounded-md dark:bg-gray-950">
                    <span>{user.username} - {user.role.name}</span>
                    <div className="flex items-center gap-2">
                      {/* Implementa aquí el botón para editar usuarios */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <RolesCard/>
      </div>
    </main>
  )
}
