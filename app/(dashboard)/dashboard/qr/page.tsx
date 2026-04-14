import { redirect } from "next/navigation";

import { getMenuPermissionAccess } from "@/lib/menu-access";

import { QrDashboardClient } from "./qr-dashboard-client";

export const dynamic = "force-dynamic";

export default async function QrDashboardPage() {
  const access = await getMenuPermissionAccess("qr");

  if (!access.ok) {
    redirect("/dashboard");
  }

  return <QrDashboardClient />;
}
