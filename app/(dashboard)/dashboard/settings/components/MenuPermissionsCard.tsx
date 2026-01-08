"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Shield } from "lucide-react";
import { MENU_SECTIONS } from "@/types/menu-permissions";

interface Role {
  id: number;
  name: string;
  menuPermissions: string[];
}

interface MenuPermissionsCardProps {
  roles: Role[];
}

export function MenuPermissionsCard({ roles: initialRoles }: MenuPermissionsCardProps) {
  const [roles, setRoles] = useState<Role[]>(
    initialRoles.map(role => ({
      ...role,
      menuPermissions: role.menuPermissions || []
    }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState<number | null>(null);
  const { toast } = useToast();

  // Actualizar roles cuando cambien desde el componente padre
  // Asegurarse de que menuPermissions esté inicializado
  useEffect(() => {
    setRoles(initialRoles.map(role => ({
      ...role,
      menuPermissions: role.menuPermissions || []
    })));
  }, [initialRoles]);

  const handlePermissionChange = (roleId: number, sectionId: string, checked: boolean) => {
    setRoles(prevRoles =>
      prevRoles.map(role => {
        if (role.id === roleId) {
          const currentPermissions = role.menuPermissions || [];
          const newPermissions = checked
            ? [...currentPermissions, sectionId]
            : currentPermissions.filter(p => p !== sectionId);
          return { ...role, menuPermissions: newPermissions };
        }
        return role;
      })
    );
  };

  const handleSavePermissions = async (roleId: number) => {
    setSavingRoleId(roleId);
    try {
      const role = roles.find(r => r.id === roleId);
      if (!role) return;

      const response = await fetch(`/api/user/roles/${roleId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ menuPermissions: role.menuPermissions || [] }),
      });

      if (response.ok) {
        toast({
          description: "Permisos actualizados con éxito.",
          variant: 'default'
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error al actualizar permisos:', response.status, errorData);
        toast({
          title: "Error",
          description: `No se pudieron actualizar los permisos. ${errorData.error || ''}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error de red al actualizar permisos:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error de red al actualizar los permisos.",
        variant: "destructive",
      });
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleSelectAll = (roleId: number) => {
    setRoles(prevRoles =>
      prevRoles.map(role => {
        if (role.id === roleId) {
          return { ...role, menuPermissions: MENU_SECTIONS.map(s => s.id) };
        }
        return role;
      })
    );
  };

  const handleDeselectAll = (roleId: number) => {
    setRoles(prevRoles =>
      prevRoles.map(role => {
        if (role.id === roleId) {
          return { ...role, menuPermissions: [] };
        }
        return role;
      })
    );
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Permisos de Menú por Rol</CardTitle>
        </div>
        <CardDescription>
          Configura qué secciones del menú puede ver cada rol. Los usuarios verán solo las secciones permitidas para su rol.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <Accordion type="single" collapsible className="w-full">
            {roles.map((role) => (
              <AccordionItem key={role.id} value={`role-${role.id}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold">{role.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {(role.menuPermissions || []).length} / {MENU_SECTIONS.length} secciones
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(role.id)}
                      >
                        Seleccionar Todas
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeselectAll(role.id)}
                      >
                        Deseleccionar Todas
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      {MENU_SECTIONS.map((section) => (
                        <div
                          key={section.id}
                          className="flex items-center space-x-3 space-y-0 rounded-md border p-4"
                        >
                          <Checkbox
                            id={`${role.id}-${section.id}`}
                            checked={role.menuPermissions.includes(section.id)}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(role.id, section.id, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`${role.id}-${section.id}`}
                            className="flex-1 cursor-pointer font-normal"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{section.title}</span>
                              <span className="text-sm text-muted-foreground">{section.url}</span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => handleSavePermissions(role.id)}
                        disabled={savingRoleId === role.id}
                      >
                        {savingRoleId === role.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          'Guardar Permisos'
                        )}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

