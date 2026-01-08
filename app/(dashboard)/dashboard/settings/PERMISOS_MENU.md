# Sistema de Permisos de Menú por Rol

## Descripción

Este sistema permite que el administrador configure qué secciones del menú principal puede ver cada rol. Los usuarios solo verán las secciones para las que su rol tiene permisos.

## Características

- ✅ Configuración visual mediante checkboxes en la página de Ajustes
- ✅ Persistencia en base de datos (PostgreSQL)
- ✅ Filtrado automático del menú según permisos del rol
- ✅ Controla secciones principales (Panel, Obras, Encuestas, Plataforma de Servicios, Ceresito, Ajustes, Salir)
- ✅ Los subitems se heredan automáticamente de la sección principal

## Cómo Usar

### 1. Configurar Permisos (Admin)

1. Ir a **Ajustes** (`/dashboard/settings`)
2. Buscar la sección **"Permisos de Menú por Rol"**
3. Hacer clic en el rol que deseas configurar para expandir sus opciones
4. Marcar las secciones del menú que deseas permitir
5. Usar los botones "Seleccionar Todas" o "Deseleccionar Todas" para rapidez
6. Hacer clic en **"Guardar Permisos"**

### 2. Resultado

Los usuarios con ese rol verán solo las secciones permitidas en el menú lateral cuando inicien sesión.

### 3. Casos Especiales

- **Sin permisos configurados**: Si un rol no tiene ningún permiso configurado, los usuarios verán un mensaje indicando que contacten al administrador.
- **Acceso directo por URL**: Aunque un usuario no vea una sección en el menú, podría intentar acceder directamente por URL. Se recomienda agregar validaciones en las páginas protegidas.

## Estructura Técnica

### Base de Datos

**Tabla**: `Role`
- Campo agregado: `menuPermissions` (String[])
- Contiene array de IDs de secciones permitidas: `['panel', 'obras', 'encuestas']`

### Secciones del Menú

| ID | Título | URL |
|---|---|---|
| `panel` | Panel | `/dashboard` |
| `obras` | Obras | `/dashboard/obras` |
| `encuestas` | Encuestas | `/dashboard/encuestas` |
| `servicios` | Plataforma de Servicios | `/dashboard/servicios` |
| `ceresito` | Ceresito | `/dashboard/ceresito` |
| `ajustes` | Ajustes | `/dashboard/settings` |
| `salir` | Salir | `/` |

### APIs Disponibles

#### Obtener permisos del usuario actual
```bash
GET /api/user/menu-permissions
```
Respuesta:
```json
{
  "roleId": 1,
  "roleName": "Moderador",
  "menuPermissions": ["panel", "obras", "encuestas"]
}
```

#### Obtener permisos de un rol específico
```bash
GET /api/user/roles/[id]/permissions
```

#### Actualizar permisos de un rol
```bash
PATCH /api/user/roles/[id]/permissions
Content-Type: application/json

{
  "menuPermissions": ["panel", "obras", "servicios"]
}
```

## Archivos Modificados/Creados

### Nuevos Archivos
- `types/menu-permissions.ts` - Tipos y constantes para permisos
- `lib/menu-permissions.ts` - Funciones helper para manejar permisos
- `app/api/user/menu-permissions/route.ts` - API para obtener permisos del usuario actual
- `app/api/user/roles/[id]/permissions/route.ts` - API para gestionar permisos por rol
- `app/(dashboard)/dashboard/settings/components/MenuPermissionsCard.tsx` - UI para configurar permisos

### Archivos Modificados
- `prisma/schema.prisma` - Agregado campo `menuPermissions` al modelo `Role`
- `constants/data.ts` - Agregado campo `id` a cada sección del menú
- `types/index.ts` - Agregado campo `id` opcional a `NavItem`
- `components/layout/sidebar.tsx` - Implementado filtrado de menú según permisos
- `components/dashboard-nav.tsx` - Actualizado tipo para incluir `id`
- `app/(dashboard)/dashboard/settings/page.tsx` - Integrado componente de permisos
- `app/(dashboard)/dashboard/settings/components/RolesCard.tsx` - Actualizado tipo `Role`

## Ejemplo de Uso

### Escenario: Crear un rol "Operador" con acceso limitado

1. Ir a Ajustes
2. Crear un nuevo rol llamado "Operador"
3. En "Permisos de Menú por Rol", expandir "Operador"
4. Marcar solo: Panel, Obras, Ceresito
5. Guardar permisos
6. Asignar el rol "Operador" a un usuario
7. Cuando ese usuario inicie sesión, solo verá Panel, Obras y Ceresito en el menú

## Notas de Desarrollo

- El filtrado ocurre en el cliente (componente sidebar)
- Los permisos se cargan una vez al cargar la sesión
- Si se cambian permisos, el usuario debe cerrar sesión y volver a iniciar para ver los cambios
- Se recomienda implementar validación del lado del servidor en las rutas protegidas para mayor seguridad

