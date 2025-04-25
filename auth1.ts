import NextAuth from "next-auth";
// Importar las opciones centralizadas
import { authOptions } from "@/lib/auth-options";

// Inicializar NextAuth con las opciones
const nextAuthInstance = NextAuth(authOptions);

// --- DEBUG: Ver qué devuelve NextAuth() ---
console.log("Resultado de NextAuth(authOptions):", nextAuthInstance);
// ------------------------------------------

// Exportar SOLAMENTE lo necesario para el App Router (server-side)
// y potencialmente para llamadas directas de signIn/signOut
export const { auth, signIn, signOut } = nextAuthInstance;

// NO exportar los handlers aquí para evitar conflicto con app/api/auth/[...nextauth]/route.ts
// export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authOptions); 