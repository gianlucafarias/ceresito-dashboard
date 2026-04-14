import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export type MenuAccessSuccess = {
  ok: true;
  userId: number;
  menuPermissions: string[];
};

type MenuAccessFailure = {
  ok: false;
  error: string;
  status: number;
};

export type MenuAccessResult = MenuAccessSuccess | MenuAccessFailure;

export async function getMenuPermissionAccess(
  permission: string,
): Promise<MenuAccessResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      ok: false,
      error: "No autorizado",
      status: 401,
    };
  }

  const userId = Number.parseInt(session.user.id, 10);
  if (Number.isNaN(userId)) {
    return {
      ok: false,
      error: "ID de usuario invalido",
      status: 400,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          menuPermissions: true,
        },
      },
    },
  });

  if (!user?.role) {
    return {
      ok: false,
      error: "Usuario o rol no encontrado",
      status: 404,
    };
  }

  const menuPermissions = user.role.menuPermissions || [];
  if (!menuPermissions.includes(permission)) {
    return {
      ok: false,
      error: "Sin permisos para acceder a este modulo",
      status: 403,
    };
  }

  return {
    ok: true,
    userId,
    menuPermissions,
  };
}
