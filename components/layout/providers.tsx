"use client";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { SessionProvider, type SessionProviderProps } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

// Crear una instancia de QueryClient
const queryClient = new QueryClient();

export default function Providers({
  session,
  children,
}: {
  session: SessionProviderProps["session"];
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
