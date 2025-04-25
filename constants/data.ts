import {
  LayoutDashboard,
  Users,
  Bot,
  Map,
  LogOut,
  List,
  Building,
  Settings
} from "lucide-react";
import { NavItem, SidebarNavItem } from "@/types";

export const navItems = {
  NavMain: [
    {
      title: "Panel",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
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
    title: "Ajustes",
    url: "/dashboard/settings",
    icon: Settings
   },
    {
      title: "Salir",
      url: "/",
      icon: LogOut,
    },
  ] 
}
