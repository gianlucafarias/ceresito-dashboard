# Instrucciones para Corregir Roles en Producción

## Problema
El Prisma Client en producción no reconoce el campo `menuPermissions` en el modelo `Role`, lo que indica que:
1. La migración no se ha ejecutado en producción
2. El Prisma Client no está sincronizado con el schema

## Solución Paso a Paso

### Paso 1: Verificar el Estado Actual

Conéctate a PostgreSQL en tu VPS y ejecuta las consultas de verificación:

```bash
# Opción 1: Desde el VPS con psql
psql -U tu_usuario -d tu_base_de_datos -f prisma/verificar-db-produccion.sql

# Opción 2: Ejecutar consultas manualmente
psql -U tu_usuario -d tu_base_de_datos
```

Luego ejecuta las consultas del archivo `verificar-db-produccion.sql` una por una.

**Resultados esperados:**
- ✅ La tabla `Role` debe existir
- ⚠️ La columna `menuPermissions` puede no existir (ese es el problema)
- ✅ Debe haber roles existentes (verificar cuáles)

### Paso 2: Aplicar la Corrección

#### Opción A: Usar Prisma Migrate (Recomendado)

```bash
# 1. Asegúrate de estar en el directorio del proyecto
cd ~/ceresito-dashboard

# 2. Verifica que el schema.prisma esté actualizado
cat prisma/schema.prisma | grep -A 5 "model Role"

# 3. Aplica las migraciones pendientes
npx prisma migrate deploy

# 4. Regenera el Prisma Client
npx prisma generate

# 5. Verifica que funciona
npx tsx prisma/seed-roles-admin.ts
```

#### Opción B: Aplicar SQL Manualmente (Si migrate no funciona)

```bash
# 1. Conéctate a PostgreSQL
psql -U tu_usuario -d tu_base_de_datos

# 2. Ejecuta el script SQL
\i prisma/fix-menu-permissions-production.sql

# O copia y pega el contenido del archivo directamente en psql
```

### Paso 3: Regenerar Prisma Client

Después de aplicar la migración, **SIEMPRE** regenera el Prisma Client:

```bash
npx prisma generate
```

Esto actualizará el cliente de Prisma con los nuevos campos.

### Paso 4: Ejecutar el Seed

Ahora deberías poder ejecutar el seed sin problemas:

```bash
npx tsx prisma/seed-roles-admin.ts
```

### Paso 5: Verificar

Ejecuta estas consultas para verificar que todo está correcto:

```sql
-- Ver todos los roles con sus permisos
SELECT id, name, "menuPermissions" FROM "Role";

-- Ver usuarios y sus roles
SELECT 
    u.email,
    u.username,
    r.name as role_name,
    r."menuPermissions"
FROM "User" u
JOIN "Role" r ON u."roleId" = r.id;
```

## Solución de Problemas

### Error: "relation does not exist"
- La tabla `Role` no existe. Necesitas ejecutar todas las migraciones desde el inicio.

### Error: "column already exists"
- La columna ya existe, pero el Prisma Client no está actualizado.
- Solución: Ejecuta `npx prisma generate`

### Error: "permission denied"
- No tienes permisos para modificar la base de datos.
- Solución: Usa un usuario con permisos de administrador o contacta al DBA.

### El seed funciona pero los permisos no se aplican
- Verifica que el campo `menuPermissions` tenga datos:
  ```sql
  SELECT name, "menuPermissions" FROM "Role" WHERE name = 'Admin';
  ```
- Si está vacío o es NULL, ejecuta el script SQL de actualización.

## Comandos Útiles

```bash
# Ver estado de migraciones
npx prisma migrate status

# Ver schema actual en la base de datos
npx prisma db pull

# Comparar schema con base de datos
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma

# Resetear base de datos (⚠️ CUIDADO: Borra todos los datos)
npx prisma migrate reset
```

## Notas Importantes

1. **Backup**: Siempre haz backup antes de modificar la base de datos en producción
2. **Prisma Client**: Después de cada cambio en el schema, ejecuta `npx prisma generate`
3. **Migraciones**: Usa `prisma migrate deploy` en producción (no `migrate dev`)
4. **Variables de Entorno**: Asegúrate de que `DATABASE_URL` esté configurada correctamente

## Estructura Esperada Final

Después de aplicar la corrección, la tabla `Role` debe tener esta estructura:

```sql
CREATE TABLE "Role" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT UNIQUE NOT NULL,
    "menuPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[]
);
```

Y debe contener al menos estos roles:
- Admin (con todos los permisos)
- Moderador
- Operador
- Visualizador
