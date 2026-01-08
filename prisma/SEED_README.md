# Seed de Roles y Usuario Admin

Este archivo documenta el proceso de seed para crear roles con permisos de menú y un usuario administrador.

## ¿Qué hace el seed?

El script `seed-roles-admin.ts` realiza las siguientes acciones:

1. **Crea/actualiza 4 roles predefinidos con permisos:**
   - **Admin**: Acceso completo a todas las secciones
   - **Moderador**: Acceso a la mayoría de secciones excepto Ajustes
   - **Operador**: Solo acceso a Panel y Obras
   - **Visualizador**: Solo acceso al Panel (solo lectura)

2. **Asigna rol Admin a usuario existente:**
   - Busca el usuario con email: `comunicacion@ceres.gob.ar`
   - Le asigna el rol Admin (con todos los permisos)
   - Si el usuario no existe, muestra una advertencia

3. **Actualiza roles existentes sin permisos:**
   - Asigna permisos mínimos (Panel y Salir) a roles que no tengan permisos configurados

## Cómo ejecutar el seed

### Opción 1: Usando npm script (Recomendado)
```bash
npm run seed:roles
```

### Opción 2: Directamente con tsx
```bash
npx tsx prisma/seed-roles-admin.ts
```

## Resultado esperado

Cuando ejecutas el seed, verás una salida similar a esta:

```
🌱 Iniciando seed de roles y usuario admin...
📝 Creando roles con permisos...
✅ Rol Admin creado/actualizado
✅ Rol Moderador creado/actualizado
✅ Rol Operador creado/actualizado
✅ Rol Visualizador creado/actualizado

👤 Asignando rol Admin al usuario comunicacion@ceres.gob.ar...
✅ Rol Admin asignado a comunicacion@ceres.gob.ar

🔄 Actualizando roles existentes sin permisos...
✅ Permisos básicos asignados al rol: [nombre del rol]

✨ Seed completado exitosamente!

📋 Resumen:
   - Roles creados/actualizados: 4
   - Usuario admin: creado
   - Roles actualizados: X
```

## Permisos por Rol

### Admin
- ✅ Panel
- ✅ Obras
- ✅ Encuestas
- ✅ Plataforma de Servicios
- ✅ Ceresito
- ✅ Ajustes
- ✅ Salir

### Moderador
- ✅ Panel
- ✅ Obras
- ✅ Encuestas
- ✅ Plataforma de Servicios
- ✅ Ceresito
- ❌ Ajustes
- ✅ Salir

### Operador
- ✅ Panel
- ✅ Obras
- ❌ Encuestas
- ❌ Plataforma de Servicios
- ❌ Ceresito
- ❌ Ajustes
- ✅ Salir

### Visualizador
- ✅ Panel
- ❌ Obras
- ❌ Encuestas
- ❌ Plataforma de Servicios
- ❌ Ceresito
- ❌ Ajustes
- ✅ Salir

## Notas importantes

1. **Usuario requerido**: El script busca el usuario `comunicacion@ceres.gob.ar` para asignarle el rol Admin. Si este usuario no existe, recibirás una advertencia y deberás crear el usuario primero o modificar el email en el script.

2. **Idempotencia**: El script es seguro de ejecutar múltiples veces. Si los roles ya existen, se actualizarán. Si el usuario ya tiene un rol, este se reemplazará por Admin.

3. **Roles personalizados**: Los roles que no están en la lista predefinida pero que ya existen en la base de datos recibirán permisos mínimos (Panel y Salir) si no tienen permisos configurados.

4. **Configuración posterior**: Después de ejecutar el seed, puedes:
   - Modificar los permisos de los roles desde Ajustes > Permisos de Menú por Rol
   - Crear nuevos roles personalizados
   - Asignar roles a otros usuarios

## Solución de problemas

### Error: "Cannot read properties of undefined (reading 'length')"
Si ves este error en la UI, significa que algunos roles no tienen el campo `menuPermissions` inicializado. Ejecuta el seed para solucionarlo:
```bash
npm run seed:roles
```

### Advertencia: "Usuario comunicacion@ceres.gob.ar no encontrado"
Esto significa que el usuario no existe en la base de datos. Debes:
1. Crear el usuario desde Ajustes > Miembros del Equipo
2. O modificar el email en el script `seed-roles-admin.ts` línea 67 por un usuario existente

### Error de conexión a la base de datos
Verifica que:
1. PostgreSQL esté corriendo
2. Las variables de entorno en `.env` sean correctas
3. La base de datos exista y sea accesible

## Siguientes pasos

Después de ejecutar el seed exitosamente:

1. **Iniciar sesión con el usuario admin:**
   ```
   Email: comunicacion@ceres.gob.ar
   (Usa tu contraseña existente)
   ```

2. **Verificar permisos:**
   - Inicia sesión y verifica que tengas acceso a todas las secciones
   - Deberías ver: Panel, Obras, Encuestas, Servicios, Ceresito, Ajustes y Salir

3. **Configurar permisos personalizados:**
   - Ve a Ajustes > Permisos de Menú por Rol
   - Ajusta los permisos según las necesidades de tu organización

4. **Crear usuarios:**
   - Ve a Ajustes > Miembros del Equipo
   - Crea nuevos usuarios y asigna roles apropiados

