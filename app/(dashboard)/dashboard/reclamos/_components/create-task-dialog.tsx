"use client";

import * as React from "react";
import { priorityEnum, labelEnum, statusEnum } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, ReloadIcon } from "@radix-ui/react-icons";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";

import { createTask } from "../_lib/actions";
import { createTaskSchema, type CreateTaskSchema } from "../_lib/validations";
import { Input } from "@/components/ui/input";

export function CreateTaskDialog() {
  const [open, setOpen] = React.useState(false);
  const [isCreatePending, startCreateTransition] = React.useTransition();

  const form = useForm<CreateTaskSchema>({
    resolver: zodResolver(createTaskSchema),
  });

  function onSubmit(input: CreateTaskSchema) {
    startCreateTransition(async () => {
      const { error } = await createTask(input);

      if (error) {
        toast.error(error);
        return;
      }

      form.reset();
      setOpen(false);
      toast.success("Reclamo creado");
    });
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
          <DialogTitle>Crear Reclamo</DialogTitle>
          <DialogDescription>
            Complete la información para cargar un nuevo reclamo.
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
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre del reclamante"
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Seleccione un tipo de reclamo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {labelEnum.map((item) => (
                          <SelectItem
                            key={item}
                            value={item}
                            className="capitalize"
                          >
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
                    <Textarea
                      placeholder="Detalle del reclamo"
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
              name="ubicacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ubicación del reclamo"
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
              name="barrio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barrio</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Barrio"
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
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Seleccione un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {statusEnum.map((item) => (
                          <SelectItem
                            key={item}
                            value={item}
                            className="capitalize"
                          >
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Seleccione una prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {priorityEnum.map((item) => (
                          <SelectItem
                            key={item}
                            value={item}
                            className="capitalize"
                          >
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
            <DialogFooter className="gap-2 pt-2 sm:space-x-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isCreatePending}>
                {isCreatePending && (
                  <ReloadIcon
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Cargar Reclamo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
