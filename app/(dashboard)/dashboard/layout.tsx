import { AppSidebar } from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Panel",
  description: "Gobierno de la Ciudad de Ceres",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-col h-screen">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:gap-6 md:p-6">
            {children}
          </div>
          <Toaster/>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
