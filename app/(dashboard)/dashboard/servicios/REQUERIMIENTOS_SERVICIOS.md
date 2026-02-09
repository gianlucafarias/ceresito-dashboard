# 📋 Requerimientos API - Gestión de Servicios de Profesionales

Este documento describe los endpoints requeridos para gestionar los servicios que ofrecen los profesionales en la plataforma.

## ✅ Estado de Implementación

**Todos los endpoints están implementados y funcionando:**

### Endpoints de Servicios
- ✅ `POST /api/admin/professionals/:professionalId/services` - Crear servicio
- ✅ `PUT /api/admin/professionals/:professionalId/services/:serviceId` - Actualizar servicio
- ✅ `DELETE /api/admin/professionals/:professionalId/services/:serviceId` - Eliminar servicio
- ✅ `GET /api/admin/professionals/:id` - Incluye servicios en la respuesta

### Endpoints de Usuarios (Actualizados)
- ✅ `PUT /api/admin/users/:id` - Actualizado para soportar `suspended: true/false`
  - Si el usuario tiene un Professional, se actualiza su status a 'suspended' o 'active'
- ✅ `DELETE /api/admin/users/:id` - Elimina usuario permanentemente
  - Elimina en cascada: Professional, servicios, reviews, contactRequests, etc.
  - Retorna información sobre lo eliminado para auditoría

**Fecha de implementación:** Enero 2025

**Notas de implementación:**
- Todos los endpoints validan correctamente las relaciones (servicio pertenece al profesional, etc.)
- La eliminación de usuarios maneja correctamente las relaciones en cascada
- Suspender es reversible: cambiar `suspended: false` reactiva al profesional
- Eliminar es permanente: usar con precaución

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante API Key.

### Headers Requeridos

```http
x-admin-api-key: tu-api-key-aqui
Content-Type: application/json
```

---

## 📊 Conceptos Importantes

### Servicios de Profesionales

Un **servicio** representa una oferta específica que un profesional ofrece en la plataforma. Cada servicio debe estar asociado a:
- Un **profesional** (obligatorio)
- Una **categoría/subcategoría** (obligatorio) - debe ser una subcategoría activa
- Información básica: título, descripción, rango de precio, disponibilidad

### Estados de un Servicio

- **available**: `true` - El servicio está disponible y visible
- **available**: `false` - El servicio no está disponible temporalmente

---

## 📋 Endpoints Requeridos

### 1. Crear Servicio

**Endpoint:** `POST /api/admin/professionals/:professionalId/services`

**Descripción:** Crea un nuevo servicio para un profesional específico.

**Path Parameters:**
- `professionalId` (string, required): UUID del profesional

**Request Body:**
```json
{
  "categoryId": "subcat-uuid-123",
  "title": "Reparación de cañerías",
  "description": "Servicio completo de reparación y mantenimiento de sistemas de plomería residencial y comercial",
  "priceRange": "$5.000 - $15.000",
  "available": true
}
```

**Validaciones:**
- `categoryId` (string, requerido): Debe ser el ID de una subcategoría activa (no un área)
- `title` (string, requerido): Título del servicio (mínimo 3 caracteres, máximo 200)
- `description` (string, requerido): Descripción detallada del servicio (mínimo 10 caracteres, máximo 2000)
- `priceRange` (string, opcional): Rango de precios o "A consultar" (máximo 100 caracteres)
- `available` (boolean, opcional): Disponibilidad del servicio (default: `true`)

**Reglas de Negocio:**
- ✅ El profesional debe existir y estar activo
- ✅ La categoría debe ser una subcategoría (no un área)
- ✅ La categoría debe estar activa
- ✅ El profesional puede tener múltiples servicios en la misma categoría
- ✅ El profesional puede tener múltiples servicios en diferentes categorías

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": "service-uuid-123",
    "professionalId": "prof-uuid-456",
    "categoryId": "subcat-uuid-123",
    "title": "Reparación de cañerías",
    "description": "Servicio completo de reparación y mantenimiento de sistemas de plomería residencial y comercial",
    "priceRange": "$5.000 - $15.000",
    "available": true,
    "categoryGroup": "oficios",
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  },
  "message": "Servicio creado exitosamente"
}
```

**Errores:**
- `400` - Validación fallida (campos requeridos faltantes, categoría inválida, etc.)
- `404` - Profesional no encontrado
- `404` - Categoría no encontrada o no es una subcategoría
- `400` - Categoría inactiva

---

### 2. Actualizar Servicio

**Endpoint:** `PUT /api/admin/professionals/:professionalId/services/:serviceId`

**Descripción:** Actualiza la información de un servicio existente.

**Path Parameters:**
- `professionalId` (string, required): UUID del profesional
- `serviceId` (string, required): UUID del servicio

**Request Body:**
```json
{
  "categoryId": "subcat-uuid-456",
  "title": "Reparación de cañerías - Actualizado",
  "description": "Nueva descripción actualizada del servicio",
  "priceRange": "$6.000 - $18.000",
  "available": false
}
```

**Notas:**
- Todos los campos son opcionales
- Solo se actualizarán los campos enviados
- Si se envía `categoryId`, debe ser una subcategoría activa válida

**Validaciones:**
- `categoryId` (string, opcional): Debe ser el ID de una subcategoría activa
- `title` (string, opcional): Mínimo 3 caracteres, máximo 200
- `description` (string, opcional): Mínimo 10 caracteres, máximo 2000
- `priceRange` (string, opcional): Máximo 100 caracteres
- `available` (boolean, opcional): Valor booleano

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "service-uuid-123",
    "professionalId": "prof-uuid-456",
    "categoryId": "subcat-uuid-456",
    "title": "Reparación de cañerías - Actualizado",
    "description": "Nueva descripción actualizada del servicio",
    "priceRange": "$6.000 - $18.000",
    "available": false,
    "categoryGroup": "oficios",
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T15:45:00.000Z"
  },
  "message": "Servicio actualizado correctamente"
}
```

**Errores:**
- `400` - Validación fallida
- `404` - Profesional no encontrado
- `404` - Servicio no encontrado
- `403` - El servicio no pertenece al profesional especificado
- `404` - Categoría no encontrada (si se envía categoryId)

---

### 3. Eliminar Servicio

**Endpoint:** `DELETE /api/admin/professionals/:professionalId/services/:serviceId`

**Descripción:** Elimina un servicio de un profesional.

**Path Parameters:**
- `professionalId` (string, required): UUID del profesional
- `serviceId` (string, required): UUID del servicio

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "service-uuid-123"
  },
  "message": "Servicio eliminado exitosamente"
}
```

**Errores:**
- `404` - Profesional no encontrado
- `404` - Servicio no encontrado
- `403` - El servicio no pertenece al profesional especificado

**Notas:**
- La eliminación es permanente (hard delete)
- Considerar si se necesita soft delete en el futuro

---

## 📝 Estructura de Datos

### Service Response

```typescript
interface ServiceResponse {
  id: string;                    // UUID del servicio
  professionalId: string;        // UUID del profesional
  categoryId: string;            // UUID de la subcategoría
  title: string;                 // Título del servicio
  description: string;            // Descripción detallada
  priceRange: string;            // Rango de precios o "A consultar"
  available: boolean;            // Disponibilidad del servicio
  categoryGroup?: 'oficios' | 'profesiones';  // Grupo de la categoría (opcional, para facilitar filtros)
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

---

## 🔄 Integración con Endpoint Existente

### GET /api/admin/professionals/:id

El endpoint existente que obtiene un profesional **debe incluir** los servicios en la respuesta:

```json
{
  "success": true,
  "data": {
    "id": "prof-uuid-456",
    "userId": "user-uuid-789",
    "bio": "...",
    "status": "active",
    "verified": true,
    "services": [
      {
        "id": "service-uuid-123",
        "title": "Reparación de cañerías",
        "description": "...",
        "priceRange": "$5.000 - $15.000",
        "available": true,
        "categoryId": "subcat-uuid-123",
        "categoryGroup": "oficios",
        "createdAt": "2025-01-20T10:30:00.000Z",
        "updatedAt": "2025-01-20T10:30:00.000Z"
      }
    ],
    // ... otros campos del profesional
  }
}
```

**Nota:** Este endpoint ya existe, solo necesita asegurarse de incluir el array `services` en la respuesta.

---

## ✅ Casos de Uso

### Caso 1: Crear un nuevo servicio
1. Admin selecciona un profesional
2. Admin hace clic en "Agregar Servicio"
3. Admin completa el formulario (categoría, título, descripción, precio, disponibilidad)
4. Al guardar cambios del profesional, se llama a `POST /api/admin/professionals/:id/services`
5. El servicio se crea y se asocia al profesional

### Caso 2: Editar un servicio existente
1. Admin ve la lista de servicios del profesional
2. Admin hace clic en "Editar" en un servicio
3. Admin modifica los campos necesarios
4. Al guardar cambios del profesional, se llama a `PUT /api/admin/professionals/:id/services/:serviceId`
5. El servicio se actualiza

### Caso 3: Cambiar disponibilidad de un servicio
1. Admin edita un servicio
2. Admin cambia el switch de disponibilidad
3. Al guardar cambios, se llama a `PUT /api/admin/professionals/:id/services/:serviceId` con `available: false`
4. El servicio se marca como no disponible

### Caso 4: Eliminar un servicio
1. Admin hace clic en "Eliminar" en un servicio
2. Admin confirma la eliminación
3. Al guardar cambios, se llama a `DELETE /api/admin/professionals/:id/services/:serviceId`
4. El servicio se elimina permanentemente

---

## 🚨 Consideraciones Importantes

1. **Validación de Categorías:**
   - Solo se pueden usar subcategorías (no áreas)
   - La subcategoría debe estar activa
   - Verificar que la categoría existe antes de crear/actualizar

2. **Relación con Profesional:**
   - Todos los servicios deben pertenecer a un profesional válido
   - Al eliminar un profesional, considerar qué hacer con sus servicios (eliminar en cascada o mantener)

3. **Performance:**
   - El endpoint `GET /api/admin/professionals/:id` debe incluir servicios de forma eficiente
   - Considerar paginación si un profesional tiene muchos servicios

4. **Auditoría:**
   - Considerar registrar quién creó/modificó/eliminó cada servicio (opcional)

---

## 📌 Prioridad de Implementación

**Alta Prioridad:**
- ✅ `POST /api/admin/professionals/:professionalId/services` - Crear servicio
- ✅ `PUT /api/admin/professionals/:professionalId/services/:serviceId` - Actualizar servicio
- ✅ `DELETE /api/admin/professionals/:professionalId/services/:serviceId` - Eliminar servicio

**Media Prioridad:**
- Actualizar `GET /api/admin/professionals/:id` para incluir servicios (si no lo hace ya)

---

## 📞 Notas Adicionales

- Todos los timestamps deben estar en formato ISO 8601
- Los IDs deben ser UUIDs
- Las respuestas de error deben seguir el formato estándar de la API:
  ```json
  {
    "success": false,
    "error": "error_code",
    "message": "Mensaje descriptivo del error"
  }
  ```
