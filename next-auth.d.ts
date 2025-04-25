import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// Extiende el tipo User que retorna 'authorize' y recibe 'jwt'
declare module "next-auth" {
  interface User extends DefaultUser {
    id: string; // Asegúrate que id es string
    username?: string | null;
    role?: number | null; // Coincide con roleId
  }

  // Extiende el tipo Session para incluir los nuevos campos en session.user
  interface Session extends DefaultSession {
    user: {
      id: string;
      username?: string | null;
      role?: number | null;
    } & DefaultSession["user"]; // Mantiene name, email, image
  }
}

// Extiende el tipo JWT para incluir los campos que añadimos en el callback 'jwt'
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    username?: string | null;
    role?: number | null;
  }
}
