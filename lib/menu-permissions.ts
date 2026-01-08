import prisma from "@/lib/prisma";

/**
 * Obtiene los permisos de menú para un rol específico
 * @param roleId - ID del rol
 * @returns Array de identificadores de secciones permitidas
 */
export async function getRoleMenuPermissions(roleId: number): Promise<string[]> {
  try {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { menuPermissions: true },
    });

    return role?.menuPermissions || [];
  } catch (error) {
    console.error("Error al obtener permisos del rol:", error);
    return [];
  }
}

/**
 * Filtra los items del menú según los permisos del rol
 * @param menuItems - Array de items del menú
 * @param permissions - Array de permisos (IDs de secciones)
 * @returns Array de items filtrados
 */
export function filterMenuByPermissions<T extends { id?: string }>(
  menuItems: T[],
  permissions: string[]
): T[] {
  // Si no hay permisos definidos, no mostrar nada (admin debe configurar)
  if (permissions.length === 0) {
    return [];
  }

  return menuItems.filter((item) => {
    // Si el item no tiene id, lo dejamos pasar (no está sujeto a permisos)
    if (!item.id) {
      return true;
    }
    // Verificar si el id del item está en los permisos
    return permissions.includes(item.id);
  });
}

