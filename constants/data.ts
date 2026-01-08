import {
  LayoutDashboard,
  Users,
  Bot,
  Map,
  LogOut,
  List,
  Building,
  Settings,
  ClipboardList,
  Briefcase
} from "lucide-react";
import { NavItem, SidebarNavItem } from "@/types";

export const navItems = {
  NavMain: [
    {
      id: "panel",
      title: "Panel",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "obras",
      title: "Obras",
      url: "/dashboard/obras",
      icon: Building,
      items: [
        {
          title: "Reclamos",
          url: "/dashboard/reclamos",
        },
        {
          title: "Cuadrillas",
          url: "/dashboard/cuadrillas",
        },
        {
          title: "Mapa",
          url: "/dashboard/mapa",
        },
        {
          title: "Poda",
          url: "/dashboard/reclamos/poda",
        }
      ]
    },
    {
      id: "encuestas",
      title: "Encuestas",
      url: "/dashboard/encuestas",
      icon: ClipboardList,
      items: [
        {
          title: "Estadísticas",
          url: "/dashboard/encuestas",
        },
        {
          title: "Todas las encuestas",
          url: "/dashboard/encuestas",
        }
      ]
    },
    {
      id: "servicios",
      title: "Plataforma de Servicios",
      url: "/dashboard/servicios",
      icon: Briefcase,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard/servicios",
        },
        {
          title: "Profesionales",
          url: "/dashboard/servicios/profesionales",
        },
        {
          title: "Categorías",
          url: "/dashboard/servicios/categorias",
        },
        {
          title: "Soporte",
          url: "/dashboard/servicios/solicitudes",
        }
      ]
    },
    
    /*
    {
      title: "Cuadrillas",
      href: "/dashboard/cuadrillas",
      icon: Users,
      label: "profile",
    },
    */
   {
    id: "ceresito",
    title: "Ceresito",
    url: "/dashboard/ceresito",
    icon: Bot,
    items: [
      {
        title: "Estadisticas",
        url: "/dashboard/ceresito",
      },
      {
        title: "Mensajes de bienvenida",
        url: "/dashboard/ceresito/mensajes-bienvenida",
      },
      {
        title: "Contactos",
        url: "/dashboard/contacts",
      },
    ],
   },
    /*
    {
      title: "Tareas",
      url: "/dashboard/kanban",
      icon: List,
    },
    */
   {
    id: "ajustes",
    title: "Ajustes",
    url: "/dashboard/settings",
    icon: Settings
   },
    {
      id: "salir",
      title: "Salir",
      url: "/",
      icon: LogOut,
    },
  ] 
}
