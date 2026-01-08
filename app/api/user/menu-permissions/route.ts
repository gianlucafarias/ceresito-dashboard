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
    console.log('🔐 Session:', JSON.stringify(session, null, 2));

    if (!session || !session.user) {
      console.log('❌ No hay sesión o usuario');
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log('👤 User ID:', userId, 'Type:', typeof userId);

    if (!userId) {
      console.log('❌ Usuario sin ID');
      return NextResponse.json(
        { error: "Usuario sin ID" },
        { status: 400 }
      );
    }

    // Consultar el usuario directamente desde la BD para obtener el rol actualizado
    console.log('🔍 Buscando usuario en BD...');
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

    console.log('📦 Usuario encontrado:', JSON.stringify(user, null, 2));

    if (!user || !user.role) {
      console.log('❌ Usuario o rol no encontrado');
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
    
    console.log('✅ Enviando permisos:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error al obtener permisos de menú:", error);
    return NextResponse.json(
      { error: "Error al obtener permisos de menú", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

