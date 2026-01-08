# Requerimiento Backend: Corrección de Nombres de Contactos

## Problema Identificado

Los contactos se están guardando en la base de datos con el campo `contact_name` como `"N/A"` (literalmente la cadena "N/A") en lugar del nombre real del contacto de WhatsApp.

## Contexto

- **Endpoint afectado**: `/api/api/contacts`
- **Campo afectado**: `contact_name` (tipo: `string | null`)
- **Comportamiento actual**: El backend está guardando la cadena literal `"N/A"` cuando no encuentra el nombre
- **Comportamiento esperado**: El backend debería guardar el nombre real del contacto o `null` si no está disponible

## Análisis del Frontend

### Estructura de Datos Esperada

Según el código del frontend, la estructura de un contacto es:

```typescript
interface Contact {
  id: number;
  phone: string | null;
  contact_name: string | null;  // ⚠️ Este campo se está guardando como "N/A"
  createdAt: string;
  updatedIn: string | null;
  lastInteraction: string | null;
  values: Record<string, any> | null;
}
```

### Uso en el Frontend

El frontend maneja el caso de `null` correctamente:

```typescript
// En las columnas de la tabla
const name = row.original.contact_name || "N/A";  // Muestra "N/A" solo si es null

// En las tarjetas de información
"Nombre": contact.contact_name || "N/A"  // Muestra "N/A" solo si es null
```

**El frontend NO envía "N/A" al backend**. El frontend solo muestra "N/A" cuando el valor es `null` o `undefined`.

## Requerimiento para el Backend

### 1. Origen de los Datos

Los contactos se crean automáticamente cuando llegan mensajes de WhatsApp a través de webhooks. El backend debe:

1. **Extraer el nombre del webhook de WhatsApp** correctamente
2. **Mapear el campo correcto** del webhook al campo `contact_name` de la base de datos
3. **Guardar `null` en lugar de "N/A"** cuando el nombre no esté disponible

### 2. Estructura del Webhook de WhatsApp

Según la documentación de WhatsApp Business API, el webhook puede contener el nombre del contacto en diferentes lugares:

#### Opción A: En el objeto `profile` del contacto
```json
{
  "contacts": [{
    "profile": {
      "name": "Juan Pérez"  // ⚠️ Este es el campo que debe usarse
    },
    "wa_id": "5493412345678"
  }],
  "messages": [...]
}
```

#### Opción B: En el objeto `from` del mensaje
```json
{
  "messages": [{
    "from": "5493412345678",
    "profile": {
      "name": "Juan Pérez"  // ⚠️ Este campo puede estar aquí
    }
  }]
}
```

#### Opción C: En el objeto `context` (para mensajes de respuesta)
```json
{
  "messages": [{
    "context": {
      "from": "5493412345678",
      "referred_product": {...}
    }
  }]
}
```

### 3. Recomendaciones de Implementación

#### 3.1. Prioridad de Campos para Extraer el Nombre

El backend debe intentar obtener el nombre en este orden:

1. **`contacts[].profile.name`** (más confiable, viene del perfil de WhatsApp)
2. **`messages[].profile.name`** (alternativa si está disponible)
3. **`contacts[].name`** (si existe en el webhook)
4. **`null`** (si ninguno de los anteriores está disponible)

#### 3.2. Validación y Limpieza

Antes de guardar, el backend debe:

```javascript
// Pseudocódigo de ejemplo
function extractContactName(webhookData) {
  // Intentar obtener el nombre del perfil
  let name = webhookData.contacts?.[0]?.profile?.name 
          || webhookData.messages?.[0]?.profile?.name
          || webhookData.contacts?.[0]?.name;
  
  // Validar que no sea una cadena vacía o solo espacios
  if (name && typeof name === 'string') {
    name = name.trim();
    if (name.length === 0) {
      name = null;
    }
  } else {
    name = null;
  }
  
  // ⚠️ NUNCA guardar "N/A" como valor
  if (name === "N/A" || name === "N/A" || name === "n/a") {
    name = null;
  }
  
  return name;
}
```

#### 3.3. Actualización de Contactos Existentes

Si un contacto ya existe y se recibe un nuevo mensaje con un nombre válido:

- Si el contacto tiene `contact_name = "N/A"` o `null`, actualizar con el nuevo nombre
- Si el contacto ya tiene un nombre válido, mantener el existente (o actualizar si el nuevo es diferente, según la lógica de negocio)

### 4. Casos de Prueba Sugeridos

El backend debe probar estos escenarios:

1. **Webhook con nombre en `contacts[].profile.name`**
   - ✅ Debe guardar el nombre correctamente
   
2. **Webhook con nombre en `messages[].profile.name`**
   - ✅ Debe guardar el nombre correctamente
   
3. **Webhook sin nombre disponible**
   - ✅ Debe guardar `null` (NO "N/A")
   
4. **Webhook con nombre vacío o solo espacios**
   - ✅ Debe guardar `null` (NO "N/A")
   
5. **Webhook con nombre "N/A" literal**
   - ✅ Debe guardar `null` (NO "N/A")
   
6. **Actualización de contacto existente con "N/A"**
   - ✅ Debe actualizar a `null` o al nuevo nombre si está disponible

### 5. Migración de Datos Existentes

Si hay contactos existentes con `contact_name = "N/A"`, se recomienda:

```sql
-- Ejemplo de migración
UPDATE contacts 
SET contact_name = NULL 
WHERE contact_name = 'N/A';
```

## Resumen

- **Problema**: El backend guarda `"N/A"` literal en lugar del nombre real o `null`
- **Causa probable**: El backend no está extrayendo correctamente el nombre del webhook de WhatsApp o está usando un valor por defecto incorrecto
- **Solución**: 
  1. Extraer el nombre de los campos correctos del webhook (`contacts[].profile.name` o `messages[].profile.name`)
  2. Guardar `null` en lugar de `"N/A"` cuando el nombre no esté disponible
  3. Validar y limpiar el nombre antes de guardarlo
- **Impacto**: El frontend ya maneja correctamente los valores `null`, así que solo se necesita corregir el backend

## Contacto

Para más información sobre cómo el frontend maneja estos datos, consultar:
- `types/contact.ts` - Definición de la interfaz Contact
- `components/tables/contact-tables/columns.tsx` - Renderizado de la tabla
- `app/(dashboard)/dashboard/ceresito/contacts/[contactId]/_components/contact-info-card.tsx` - Visualización de detalles
