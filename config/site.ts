import { env } from "@/env"

export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Panel Gobierno de la Ciudad de Ceres",
  description:
    "Panel de Control",
  url:
    env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://table.sadmn.com",
}
