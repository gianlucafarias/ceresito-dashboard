export interface MenuSection {
  id: string;
  title: string;
  url: string;
}

export interface RolePermissions {
  roleId: number;
  roleName: string;
  menuPermissions: string[];
}

export const MENU_SECTIONS: MenuSection[] = [
  { id: 'panel', title: 'Panel', url: '/dashboard' },
  { id: 'obras', title: 'Obras', url: '/dashboard/obras' },
  { id: 'encuestas', title: 'Encuestas', url: '/dashboard/encuestas' },
  { id: 'servicios', title: 'Plataforma de Servicios', url: '/dashboard/servicios' },
  { id: 'ceresito', title: 'Ceresito', url: '/dashboard/ceresito' },
  { id: 'ajustes', title: 'Ajustes', url: '/dashboard/settings' },
  { id: 'salir', title: 'Salir', url: '/' },
];

