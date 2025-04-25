import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// Importar prisma desde la ubicación centralizada
import prisma from "@/lib/prisma"; 
import bcrypt from "bcryptjs";

// Exportar el objeto de configuración
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      // La lógica authorize que ya tenías
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          // Podrías retornar null o lanzar un error específico para el frontend
          throw new Error("Por favor, ingrese correo y contraseña"); 
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          // Es mejor lanzar un error específico para diferenciarlo en el frontend
          // throw new Error("CredentialsSignin"); // O un código/mensaje específico
          throw new Error("No se encontró un usuario con ese correo"); 
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          // throw new Error("CredentialsSignin");
          throw new Error("Contraseña incorrecta");
        }

        // Devolver el objeto User con los campos necesarios para los callbacks
        return {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
          role: user.roleId, // Pasamos roleId como role para el callback jwt
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin", // Tu página de inicio de sesión personalizada
  },
  session: {
    // Especificar estrategia JWT es importante para los callbacks
    strategy: "jwt", 
  },
  callbacks: {
    // Callback jwt: se ejecuta al crear/actualizar el token JWT
    async jwt({ token, user }) {
      // El objeto 'user' solo está disponible la primera vez (después de authorize)
      if (user) {
        token.id = user.id; // user.id ya es string desde authorize
        token.username = (user as any).username; // Castear si no está en el tipo User estándar
        token.role = (user as any).role;         // Castear si no está en el tipo User estándar
      } 
      // Este token se encripta y se guarda en la cookie
      return token;
    },
    // Callback session: se ejecuta al consultar la sesión (ej: useSession, auth())
    async session({ session, token }) {
      // 'token' contiene los datos del JWT decodificado (lo que devolvió el callback jwt)
      // Pasamos los datos extra del token al objeto session.user
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as number;
        // session.user.email y name ya vienen por defecto si están en el token
      }
      // La sesión resultante es la que se expone al cliente/servidor
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET, // Asegúrate que NEXTAUTH_SECRET esté definido
  // debug: process.env.NODE_ENV === 'development', // Descomentar para ver logs de NextAuth en desarrollo
};
