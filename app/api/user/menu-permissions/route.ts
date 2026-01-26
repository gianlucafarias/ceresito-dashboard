import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

/**
 * GET - Obtener permisos de menú del usuario actual
 * Devuelve los permisos basados en el rol del usuario en sesión
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Usuario sin ID" },
        { status: 400 }
      );
    }

    // Consultar el usuario directamente desde la BD para obtener el rol actualizado
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            menuPermissions: true,
          }
        }
      }
    });

    if (!user || !user.role) {
      return NextResponse.json(
        { error: "Usuario o rol no encontrado" },
        { status: 404 }
      );
    }

    const result = {
      roleId: user.role.id,
      roleName: user.role.name,
      menuPermissions: user.role.menuPermissions || [],
    };
    

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error al obtener permisos de menú:", error);
    return NextResponse.json(
      { error: "Error al obtener permisos de menú", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

