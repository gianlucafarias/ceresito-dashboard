"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

import { EncuestaVecinal } from "@/types"
import { updateEncuestaSchema, type UpdateEncuestaSchema } from "../_lib/validations"
import { updateEncuesta } from "../_lib/actions"

interface EditEncuestaDialogProps {
  encuesta: EncuestaVecinal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Opciones predefinidas para obras urgentes y servicios
const obrasOptions = [
  "Pavimentación de calles",
  "Veredas y rampas accesibles", 
  "Cordón cuneta",
  "Cloacas",
  "Desagües pluviales",
  "Limpieza",
  "Plazas y espacios verdes",
  "Alumbrado público",
  "Mantenimiento de las calles"
]

const serviciosOptions = [
  "Mantenimiento de las calles",
  "Mantenimiento de los espacios verdes",
  "Limpieza / recolección de residuos",
  "Arbolado / poda",
  "Alumbrado público",
  "Seguridad",
  "Transporte público"
]

export default function EditEncuestaDialog({
  encuesta,
  open,
  onOpenChange,
  onSuccess
}: EditEncuestaDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<UpdateEncuestaSchema>({
    resolver: zodResolver(updateEncuestaSchema),
    defaultValues: {
      id: encuesta?.id || 0,
      dni: encuesta?.dni || "",
      barrio: encuesta?.barrio || "",
      obrasUrgentes: encuesta?.obrasUrgentes || [],
      obrasUrgentesOtro: encuesta?.obrasUrgentesOtro || "",
      serviciosMejorar: encuesta?.serviciosMejorar || [],
      serviciosMejorarOtro: encuesta?.serviciosMejorarOtro || "",
      espacioMejorar: encuesta?.espacioMejorar || "",
      propuesta: encuesta?.propuesta || "",
      quiereContacto: encuesta?.quiereContacto || false,
      nombreCompleto: encuesta?.nombreCompleto || "",
      telefono: encuesta?.telefono || "",
      email: encuesta?.email || "",
    },
  })

  // Actualizar valores cuando cambia la encuesta
  useState(() => {
    if (encuesta && open) {
      form.reset({
        id: encuesta.id,
        dni: encuesta.dni,
        barrio: encuesta.barrio,
        obrasUrgentes: encuesta.obrasUrgentes,
        obrasUrgentesOtro: encuesta.obrasUrgentesOtro,
        serviciosMejorar: encuesta.serviciosMejorar,
        serviciosMejorarOtro: encuesta.serviciosMejorarOtro,
        espacioMejorar: encuesta.espacioMejorar,
        propuesta: encuesta.propuesta,
        quiereContacto: encuesta.quiereContacto,
        nombreCompleto: encuesta.nombreCompleto,
        telefono: encuesta.telefono,
        email: encuesta.email,
      })
    }
  }, [encuesta, open, form])

  function onSubmit(values: UpdateEncuestaSchema) {
    startTransition(async () => {
      try {
        const result = await updateEncuesta(values)
        
        if (result.error) {
          toast.error("Error al actualizar", {
            description: result.error,
          })
          return
        }

        toast.success("Encuesta actualizada", {
          description: "Los datos se han actualizado correctamente.",
        })
        
        onOpenChange(false)
        onSuccess?.()
        
      } catch (error) {
        toast.error("Error al actualizar", {
          description: "Ocurrió un error inesperado.",
        })
      }
    })
  }

  if (!encuesta) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Encuesta</DialogTitle>
          <DialogDescription>
            Modifica los datos de la encuesta #{encuesta.id} - {encuesta.barrio}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Básica</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dni"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DNI</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Obras Urgentes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Obras Urgentes (máximo 3)</h3>
                <FormField
                  control={form.control}
                  name="obrasUrgentes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            {obrasOptions.map((obra) => (
                              <div key={obra} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`obra-${obra}`}
                                  checked={field.value.includes(obra)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      if (field.value.length < 3) {
                                        field.onChange([...field.value, obra])
                                      } else {
                                        toast.error("Máximo 3 obras urgentes")
                                      }
                                    } else {
                                      field.onChange(field.value.filter((item) => item !== obra))
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`obra-${obra}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {obra}
                                </label>
                              </div>
                            ))}
                          </div>
                          
                          {/* Mostrar obras seleccionadas */}
                          {field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {field.value.map((obra, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                  {obra}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => {
                                      field.onChange(field.value.filter((item) => item !== obra))
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="obrasUrgentesOtro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Otra obra urgente (especificar)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Especifica otra obra..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Servicios a Mejorar */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Servicios a Mejorar (máximo 2)</h3>
                <FormField
                  control={form.control}
                  name="serviciosMejorar"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            {serviciosOptions.map((servicio) => (
                              <div key={servicio} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`servicio-${servicio}`}
                                  checked={field.value.includes(servicio)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      if (field.value.length < 2) {
                                        field.onChange([...field.value, servicio])
                                      } else {
                                        toast.error("Máximo 2 servicios a mejorar")
                                      }
                                    } else {
                                      field.onChange(field.value.filter((item) => item !== servicio))
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`servicio-${servicio}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {servicio}
                                </label>
                              </div>
                            ))}
                          </div>
                          
                          {/* Mostrar servicios seleccionados */}
                          {field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {field.value.map((servicio, index) => (
                                <Badge key={index} variant="outline" className="flex items-center gap-1">
                                  {servicio}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => {
                                      field.onChange(field.value.filter((item) => item !== servicio))
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="serviciosMejorarOtro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Otro servicio (especificar)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Especifica otro servicio..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Espacios y Propuestas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Espacios y Propuestas</h3>
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="espacioMejorar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Espacio específico a mejorar</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="propuesta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propuesta</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información de Contacto</h3>
                
                <FormField
                  control={form.control}
                  name="quiereContacto"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          ¿Quiere ser contactado?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("quiereContacto") && (
                  <div className="grid grid-cols-1 gap-4 pl-6">
                    <FormField
                      control={form.control}
                      name="nombreCompleto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isPending}
          >
            {isPending ? "Actualizando..." : "Actualizar Encuesta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}