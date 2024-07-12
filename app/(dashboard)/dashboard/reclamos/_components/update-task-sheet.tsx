"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { labelEnum, statusEnum, priorityEnum } from "@/db/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { updateTask } from "../_lib/actions";
import { updateTaskSchema, type UpdateTaskSchema } from "../_lib/validations";
import { ReloadIcon } from "@radix-ui/react-icons";

interface UpdateTaskSheetProps extends React.ComponentPropsWithRef<typeof Sheet> {
  task: Task;
}

export function UpdateTaskSheet({ task, ...props }: UpdateTaskSheetProps) {
  const [isUpdatePending, startUpdateTransition] = React.useTransition();

  const form = useForm<UpdateTaskSchema>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      nombre: task.nombre ?? "",
      telefono: task.telefono ?? "",
      detalle: task.detalle,
      ubicacion: task.ubicacion,
      barrio: task.barrio,
      reclamo: task.reclamo,
      estado: task.estado,
      prioridad: task.prioridad,
    },
  });

  function onSubmit(input: UpdateTaskSchema) {
    startUpdateTransition(async () => {
      const { error } = await updateTask({
        id: task.id,
        ...input,
      });

      if (error) {
        toast.error(error);
        return;
      }

      form.reset();
      props.onOpenChange?.(false);
      toast.success("Reclamo actualizado");
    });
  }

  return (
    <Sheet {...props}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Editar Reclamo</SheetTitle>
          <SheetDescription>
            Actualiza los detalles y guarda los cambios.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del reclamante" className="resize-none" {...field} />
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
                    <Input
                      placeholder="Teléfono de contacto (Ej: +543491440890)"
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
                  <FormLabel>Tipo de Reclamo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Seleccione un tipo de reclamo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {labelEnum.map((item) => (
                          <SelectItem key={item} value={item} className="capitalize">
                            {item}
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
              name="detalle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalle</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalle del reclamo" className="resize-none" {...field} />
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
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ubicación del reclamo" className="resize-none" {...field} />
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
                    <Input placeholder="Barrio" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Seleccione un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {statusEnum.map((item) => (
                          <SelectItem key={item} value={item} className="capitalize">
                            {item}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Seleccione una prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {priorityEnum.map((item) => (
                          <SelectItem key={item} value={item} className="capitalize">
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="gap-2 pt-2 sm:space-x-0">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </SheetClose>
              <Button disabled={isUpdatePending}>
                {isUpdatePending && (
                  <ReloadIcon className="mr-2 size-4 animate-spin" aria-hidden="true" />
                )}
                Guardar
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
