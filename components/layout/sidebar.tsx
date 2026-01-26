"use client"
import * as React from "react"
import { NavMain } from "@/components/dashboard-nav";
import { navItems } from "@/constants/data";
// import { cn } from "@/lib/utils"; // No usado

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  // SidebarMenu, // No usado
  // SidebarMenuButton, // No usado
  // SidebarMenuItem, // No usado
} from "@/components/ui/sidebar"
import { UserNav } from "./user-nav";
// import { ArrowUpCircleIcon } from "lucide-react"; // No usado
import { apiClient } from "@/app/(dashboard)/dashboard/servicios/_lib/api-client";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [professionalCount, setProfessionalCount] = React.useState<number | undefined>(undefined);
  const [menuPermissions, setMenuPermissions] = React.useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = React.useState(true);

  // Cargar el contador de profesionales
  React.useEffect(() => {
    async function loadProfessionalCount() {
      try {
        const response = await apiClient.getStats();
        if (response.success) {
          setProfessionalCount(response.data.overview.totalProfessionals);
        }
      } catch (error) {
        console.error('Error loading professional count:', error);
      }
    }

    loadProfessionalCount();
  }, []);

  // Cargar permisos de menú del usuario
  React.useEffect(() => {
    async function loadMenuPermissions() {
      try {
        const response = await fetch('/api/user/menu-permissions');
        if (response.ok) {
          const data = await response.json();
          setMenuPermissions(data.menuPermissions || []);
        } else {
          const errorText = await response.text();
          console.error('❌ Error loading menu permissions:', response.status, errorText);
        }
      } catch (error) {
        console.error('❌ Error loading menu permissions:', error);
      } finally {
        setIsLoadingPermissions(false);
      }
    }

    loadMenuPermissions();
  }, []);

  // Filtrar menú según permisos y actualizar con badges
  const filteredNavItems = React.useMemo(() => {
    
    // Si aún está cargando permisos, mostrar todos los items temporalmente
    if (isLoadingPermissions) {
      return navItems.NavMain;
    }

    // Filtrar según permisos
    const filtered = navItems.NavMain.filter(item => {
      // Si no tiene id, permitir acceso (aunque todos deberían tener id ahora)
      if (!item.id) {
        return true;
      }
      // Verificar si el item está en los permisos
      const hasPermission = menuPermissions.includes(item.id);
      return hasPermission;
    });
    

    // Actualizar con badges de profesionales
    return filtered.map(item => {
      if (item.title === "Plataforma de Servicios" && item.items) {
        return {
          ...item,
          items: item.items.map(subItem => {
            if (subItem.title === "Profesionales") {
              return {
                ...subItem,
                badge: professionalCount !== undefined ? professionalCount : undefined
              };
            }
            return subItem;
          })
        };
      }
      return item;
    });
  }, [menuPermissions, professionalCount, isLoadingPermissions]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* SidebarHeader se deja vacío */}
      <SidebarHeader />
      <SidebarContent>
        {isLoadingPermissions ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Cargando menú...</p>
          </div>
        ) : filteredNavItems.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-sm text-muted-foreground text-center">
              No tienes permisos asignados. Contacta al administrador.
            </p>
          </div>
        ) : (
          <NavMain items={filteredNavItems} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  )
}