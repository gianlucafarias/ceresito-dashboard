"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, ReloadIcon } from "@radix-ui/react-icons"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Task, reclamoSchema } from "../data/schema"
import { Button } from "@/components/ui/button"
import { labels, prioridades } from "../data/data"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { createTask } from "@/lib/crear-reclamo"

export function CreateTaskDialog() {
  const [open, setOpen] = React.useState(false)
  const [isCreatePending, startCreateTransition] = React.useTransition()

  const form = useForm<Task>({
    resolver: zodResolver(reclamoSchema),
  })

  function onSubmit(input: Task) {
    startCreateTransition(async () => {
      const { error } = await createTask(input)

      if (error) {
        toast.error(error)
        return
      }

      form.reset()
      setOpen(false)
      toast.success("Reclamo creado")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="mr-2 size-4" aria-hidden="true" />
          Nuevo Reclamo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cargar un nuevo reclamo</DialogTitle>
          <DialogDescription>
            Completa los detalles a continuación para crear un nuevo reclamo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre:</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre y apellido (opcional)"
                      {...field}
                    />
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
                  <FormLabel>Telefono:</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Número de teléfono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ubicacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación:</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre y altura de la calle"
                      {...field}
                    />
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
                  <FormLabel>Barrio:</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre del Barrio"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="detalle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalle del Reclamo:</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brinda detalles del reclamo"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reclamo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reclamo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Tipo de Reclamo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {labels.map((label) => (
                          <SelectItem
                            key={label.value}
                            value={label.value}
                            className="capitalize"
                          >
                            {label.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Prioridad del Reclamo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {prioridades.map((prioridad) => (
                          <SelectItem
                            key={prioridad.value}
                            value={prioridad.value}
                            className="capitalize"
                          >
                            {prioridad.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 pt-2 sm:space-x-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button disabled={isCreatePending}>
                {isCreatePending && (
                  <ReloadIcon
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Crear Reclamo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
