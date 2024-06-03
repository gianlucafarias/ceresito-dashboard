import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import type { Metadata } from "next";

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
    <>
      <Header />
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-16">{children}</main>
      </div>
    </>
  );
}
