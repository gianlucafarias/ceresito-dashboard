"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateTask } from "../../../_lib/actions"
import { updateTaskSchema, type UpdateTaskSchema } from "../../../_lib/validations"
import { Reclamo } from "../../../_components/tasks-table-columns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { labelEnum, priorityEnum, statusEnum } from "@/db/schema"

interface EditarReclamoFormProps {
  reclamo: Reclamo
}

export function EditarReclamoForm({ reclamo }: EditarReclamoFormProps) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)
  
  const form = useForm<UpdateTaskSchema>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      nombre: reclamo.nombre,
      telefono: reclamo.telefono,
      reclamo: reclamo.reclamo,
      ubicacion: reclamo.ubicacion,
      barrio: reclamo.barrio,
      detalle: reclamo.detalle,
      estado: reclamo.estado,
      prioridad: reclamo.prioridad
    }
  })
  
  async function onSubmit(data: UpdateTaskSchema) {
    setIsPending(true)
    
    const result = await updateTask({
      ...data,
      id: reclamo.id.toString()
    })
    
    setIsPending(false)
    
    if (result.error) {
      return toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      })
    }
    
    toast({
      title: "Reclamo actualizado",
      description: "El reclamo ha sido actualizado correctamente"
    })
    
    router.push(`/dashboard/reclamos/${reclamo.id}`)
    router.refresh()
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="informacion" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informacion">Información General</TabsTrigger>
            <TabsTrigger value="ubicacion">Ubicación</TabsTrigger>
            <TabsTrigger value="estado">Estado y Prioridad</TabsTrigger>
          </TabsList>
          
          {/* Pestaña de Información General */}
          <TabsContent value="informacion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del Solicitante</CardTitle>
                <CardDescription>
                  Datos de la persona que realizó el reclamo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del solicitante" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="Teléfono de contacto" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Reclamo</CardTitle>
                <CardDescription>
                  Información sobre el tipo y descripción del reclamo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="reclamo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Reclamo</FormLabel>
                      <Select 
                        value={field.value || ""} 
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo de reclamo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {labelEnum.map((label) => (
                            <SelectItem key={label} value={label}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="detalle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describa el problema en detalle"
                          className="min-h-[120px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Pestaña de Ubicación */}
          <TabsContent value="ubicacion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ubicación del Reclamo</CardTitle>
                <CardDescription>
                  Dirección y barrio donde se encuentra el problema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="ubicacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Calle y número o referencia"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Ejemplo: "Av. Belgrano 123" o "Frente a la plaza principal"
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="barrio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barrio</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Barrio o zona"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Pestaña de Estado y Prioridad */}
          <TabsContent value="estado" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estado y Prioridad</CardTitle>
                <CardDescription>
                  Gestión del estado actual y nivel de prioridad del reclamo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select 
                        value={field.value || ""} 
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusEnum.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="prioridad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridad</FormLabel>
                      <Select 
                        value={field.value || ""} 
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar prioridad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityEnum.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <div className="flex gap-4 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/dashboard/reclamos/${reclamo.id}`)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 