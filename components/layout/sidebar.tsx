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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* SidebarHeader se deja vacío */}
      <SidebarHeader />
      <SidebarContent>
        <NavMain items={navItems.NavMain} />
      </SidebarContent>
      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  )
}