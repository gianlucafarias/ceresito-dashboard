# 📚 API de Categorías - Plataforma Servicios CERES

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante API Key.

### Headers Requeridos

```http
x-admin-api-key: tu-api-key-aqui
Content-Type: application/json
```

---

## 📊 Conceptos Importantes

### Jerarquía de Categorías

La plataforma maneja dos jerarquías de categorización:

1. **OFICIOS** (estructura jerárquica de 2 niveles):
   - **Áreas** (nivel 1): "Construcción y mantenimiento", "Climatización", etc.
   - **Subcategorías** (nivel 2): "Plomero", "Electricista", etc.

2. **PROFESIONES** (estructura plana de 1 nivel):
   - **Subcategorías**: "Arquitectura", "Enfermería", "Marketing", etc.

### Tipos de Categorías

- **`area`**: Solo aplica a Oficios. Agrupa varias subcategorías (ej: "Construcción y mantenimiento")
- **`subcategory`**: Categoría específica de un servicio (ej: "Plomero", "Arquitectura")

---

## 📋 Endpoints

### 1. Listar Todas las Categorías

**Endpoint:** `GET /api/admin/categories`

**Descripción:** Obtiene todas las áreas y subcategorías, tanto de oficios como profesiones.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción | Valores |
|-----------|------|-----------|-------------|---------|
| `type` | string | No | Filtrar por tipo | `area`, `subcategory` |
| `group` | string | No | Filtrar por grupo | `oficios`, `profesiones` |
| `search` | string | No | Buscar por nombre o slug | Cualquier texto |

**Ejemplos de URLs:**
```
GET /api/admin/categories
GET /api/admin/categories?type=area
GET /api/admin/categories?group=oficios
GET /api/admin/categories?group=profesiones&type=subcategory
GET /api/admin/categories?search=plomero
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "areas": [
      {
        "id": "area-uuid-1",
        "name": "Construcción y mantenimiento",
        "slug": "construccion-mantenimiento",
        "group": "oficios",
        "image": "/images/servicios/construccion.jpg",
        "description": "Servicios relacionados con construcción y mantenimiento del hogar",
        "active": true,
        "subcategoryCount": 9,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "subcategoriesOficios": [
      {
        "id": "subcat-uuid-1",
        "name": "Plomero/a",
        "slug": "plomero",
        "group": "oficios",
        "areaId": "area-uuid-1",
        "areaSlug": "construccion-mantenimiento",
        "image": null,
        "description": "Servicios de plomería en general",
        "active": true,
        "professionalCount": 15,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "subcategoriesProfesiones": [
      {
        "id": "subcat-uuid-100",
        "name": "Arquitectura",
        "slug": "arquitectura",
        "group": "profesiones",
        "areaId": null,
        "areaSlug": null,
        "image": "/images/profesionales/arquitectura.jpg",
        "description": "Profesionales en diseño arquitectónico",
        "active": true,
        "professionalCount": 8,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "stats": {
      "totalAreas": 11,
      "totalSubcategoriesOficios": 28,
      "totalSubcategoriesProfesiones": 6,
      "totalCategories": 45
    }
  }
}
```

**Campos importantes:**
- `subcategoryCount` / `professionalCount`: Cantidad de subcategorías bajo un área / profesionales en una categoría
- `areaId` / `areaSlug`: Para subcategorías de oficios, referencia al área padre
- `active`: Si la categoría está activa y visible en la plataforma pública

---

### 2. Obtener Detalle de una Categoría

**Endpoint:** `GET /api/admin/categories/:id`

**Descripción:** Obtiene información detallada de una categoría específica (área o subcategoría).

**Path Parameters:**
- `id` (string, required): UUID de la categoría

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "area-uuid-1",
    "type": "area",
    "name": "Construcción y mantenimiento",
    "slug": "construccion-mantenimiento",
    "group": "oficios",
    "image": "/images/servicios/construccion.jpg",
    "description": "Servicios relacionados con construcción y mantenimiento del hogar",
    "active": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "subcategories": [
      {
        "id": "subcat-uuid-1",
        "name": "Plomero/a",
        "slug": "plomero",
        "professionalCount": 15
      },
      {
        "id": "subcat-uuid-2",
        "name": "Electricista",
        "slug": "electricista",
        "professionalCount": 23
      }
    ],
    "_count": {
      "subcategories": 9,
      "professionals": 87
    }
  }
}
```

**Respuesta para una subcategoría:**
```json
{
  "success": true,
  "data": {
    "id": "subcat-uuid-1",
    "type": "subcategory",
    "name": "Plomero/a",
    "slug": "plomero",
    "group": "oficios",
    "areaId": "area-uuid-1",
    "areaSlug": "construccion-mantenimiento",
    "image": null,
    "description": "Servicios de plomería en general",
    "active": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "area": {
      "id": "area-uuid-1",
      "name": "Construcción y mantenimiento",
      "slug": "construccion-mantenimiento"
    },
    "professionals": [
      {
        "id": "prof-uuid-1",
        "user": {
          "firstName": "Juan",
          "lastName": "Pérez"
        },
        "rating": 4.8,
        "verified": true
      }
    ],
    "_count": {
      "professionals": 15,
      "services": 28
    }
  }
}
```

**Errores:**
- `404` - Categoría no encontrada

---

### 3. Crear Nueva Categoría

**Endpoint:** `POST /api/admin/categories`

**Descripción:** Crea una nueva área (solo para oficios) o subcategoría.

**Request Body:**

**Para crear un Área (solo oficios):**
```json
{
  "type": "area",
  "name": "Nueva Área de Servicios",
  "slug": "nueva-area-servicios",
  "group": "oficios",
  "description": "Descripción de la nueva área",
  "image": "/images/servicios/nueva-area.jpg",
  "active": true
}
```

**Para crear una Subcategoría de Oficios:**
```json
{
  "type": "subcategory",
  "name": "Nuevo Oficio",
  "slug": "nuevo-oficio",
  "group": "oficios",
  "areaId": "area-uuid-1",
  "areaSlug": "construccion-mantenimiento",
  "description": "Descripción del nuevo oficio",
  "image": null,
  "active": true
}
```

**Para crear una Subcategoría de Profesiones:**
```json
{
  "type": "subcategory",
  "name": "Nueva Profesión",
  "slug": "nueva-profesion",
  "group": "profesiones",
  "areaId": null,
  "areaSlug": null,
  "description": "Descripción de la nueva profesión",
  "image": "/images/profesionales/nueva-profesion.jpg",
  "active": true
}
```

**Validaciones:**
- `name` (string, requerido): Nombre de la categoría
- `slug` (string, requerido): URL-friendly, único en el grupo
- `group` (string, requerido): `"oficios"` o `"profesiones"`
- `type` (string, requerido): `"area"` o `"subcategory"`
- `areaId` (string, requerido si type=subcategory y group=oficios): ID del área padre
- `description` (string, opcional): Descripción de la categoría
- `image` (string, opcional): URL de la imagen
- `active` (boolean, opcional): Default true

**Reglas de Negocio:**
- ❌ NO se pueden crear áreas para el grupo "profesiones"
- ✅ Las subcategorías de oficios DEBEN tener un área padre (`areaId`)
- ✅ Las subcategorías de profesiones NO tienen área padre
- ✅ El `slug` debe ser único dentro del mismo grupo

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "type": "subcategory",
    "name": "Nuevo Oficio",
    "slug": "nuevo-oficio",
    "group": "oficios",
    "areaId": "area-uuid-1",
    "description": "Descripción del nuevo oficio",
    "image": null,
    "active": true,
    "createdAt": "2025-10-15T14:30:00.000Z",
    "updatedAt": "2025-10-15T14:30:00.000Z"
  },
  "message": "Categoría creada exitosamente"
}
```

**Errores:**
- `400` - Validación fallida (slug duplicado, área requerida para oficios, etc.)
- `404` - Área padre no encontrada

---

### 4. Actualizar Categoría

**Endpoint:** `PUT /api/admin/categories/:id`

**Descripción:** Actualiza una categoría existente (área o subcategoría).

**Path Parameters:**
- `id` (string, required): UUID de la categoría

**Request Body:**
```json
{
  "name": "Nombre Actualizado",
  "description": "Nueva descripción",
  "image": "/images/servicios/updated.jpg",
  "active": false,
  "areaId": "area-uuid-2"
}
```

**Notas:**
- Todos los campos son opcionales
- Solo se actualizarán los campos enviados
- No se puede cambiar el `type` ni el `group` una vez creada
- No se puede cambiar el `slug` (podría romper referencias)

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    // Objeto completo de la categoría actualizada
  },
  "message": "Categoría actualizada correctamente"
}
```

**Errores:**
- `404` - Categoría no encontrada
- `400` - Validación fallida

---

### 5. Eliminar Categoría

**Endpoint:** `DELETE /api/admin/categories/:id`

**Descripción:** Elimina una categoría (área o subcategoría).

**Path Parameters:**
- `id` (string, required): UUID de la categoría

**Validaciones antes de eliminar:**
- ❌ NO se puede eliminar un área que tiene subcategorías asociadas
- ❌ NO se puede eliminar una subcategoría que tiene profesionales activos
- ⚠️ Opcionalmente: Desactivar en lugar de eliminar (soft delete)

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `force` | boolean | Forzar eliminación (eliminar subcategorías/desvincular profesionales) |
| `deactivate` | boolean | Desactivar en lugar de eliminar (soft delete) |

**Ejemplos:**
```
DELETE /api/admin/categories/uuid-123
DELETE /api/admin/categories/uuid-123?deactivate=true
DELETE /api/admin/categories/uuid-123?force=true
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Categoría eliminada exitosamente",
  "affected": {
    "subcategories": 0,
    "professionals": 0
  }
}
```

**Respuesta con Soft Delete:**
```json
{
  "success": true,
  "message": "Categoría desactivada exitosamente",
  "data": {
    "id": "uuid-123",
    "active": false
  }
}
```

**Errores:**
- `404` - Categoría no encontrada
- `409` - Conflicto (tiene subcategorías o profesionales asociados)
```json
{
  "success": false,
  "error": "conflict",
  "message": "No se puede eliminar: tiene 5 subcategorías asociadas",
  "details": {
    "subcategoryCount": 5,
    "professionalCount": 0
  }
}
```

---

### 6. Cambiar Orden de Categorías (Opcional)

**Endpoint:** `PUT /api/admin/categories/reorder`

**Descripción:** Cambia el orden de visualización de las categorías.

**Request Body:**
```json
{
  "group": "oficios",
  "type": "area",
  "order": [
    "area-uuid-1",
    "area-uuid-3",
    "area-uuid-2"
  ]
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Orden actualizado correctamente"
}
```

---

### 7. Estadísticas de Categorías

**Endpoint:** `GET /api/admin/categories/stats`

**Descripción:** Obtiene estadísticas generales de las categorías.

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalAreas": 11,
      "totalSubcategoriesOficios": 28,
      "totalSubcategoriesProfesiones": 6,
      "totalActiveCategories": 43,
      "totalInactiveCategories": 2
    },
    "topCategories": [
      {
        "id": "subcat-uuid-1",
        "name": "Plomero/a",
        "group": "oficios",
        "professionalCount": 45
      },
      {
        "id": "subcat-uuid-2",
        "name": "Electricista",
        "group": "oficios",
        "professionalCount": 38
      }
    ],
    "emptyCategories": [
      {
        "id": "subcat-uuid-50",
        "name": "Categoría sin profesionales",
        "group": "oficios"
      }
    ]
  }
}
```

---

## 📝 Modelo de Datos

### Área (solo para Oficios)

```typescript
interface Area {
  id: string;
  type: 'area';
  name: string;
  slug: string;
  group: 'oficios';
  image?: string;
  description?: string;
  active: boolean;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Subcategoría

```typescript
interface Subcategory {
  id: string;
  type: 'subcategory';
  name: string;
  slug: string;
  group: 'oficios' | 'profesiones';
  areaId?: string; // Solo para oficios
  areaSlug?: string; // Solo para oficios
  image?: string;
  description?: string;
  active: boolean;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔒 Seguridad

### Validaciones del Lado del Servidor

1. **Slugs únicos** por grupo
2. **Nombres únicos** por grupo (case-insensitive)
3. **Área requerida** para subcategorías de oficios
4. **No áreas para profesiones**
5. **No eliminar si tiene dependencias** (subcategorías/profesionales)

### Sanitización

- Slugs: solo letras minúsculas, números y guiones
- Nombres: sin HTML, máximo 100 caracteres
- Descripciones: sin HTML peligroso, máximo 500 caracteres

---

## 🧪 Casos de Uso del Dashboard

### Página de Categorías

```javascript
// 1. Cargar todas las categorías al iniciar
GET /api/admin/categories

// 2. Crear nueva categoría
POST /api/admin/categories
{
  "type": "subcategory",
  "name": "Jardinero/a",
  "slug": "jardinero",
  "group": "oficios",
  "areaId": "area-jardineria-uuid"
}

// 3. Editar categoría existente
PUT /api/admin/categories/uuid-123
{
  "name": "Jardinero/a (actualizado)",
  "description": "Nueva descripción"
}

// 4. Ver detalles de categoría
GET /api/admin/categories/uuid-123

// 5. Eliminar categoría (con validación)
DELETE /api/admin/categories/uuid-123

// 6. Buscar categorías
GET /api/admin/categories?search=plomero
```

---

## 📅 Prioridad de Implementación

### 🔴 Alta Prioridad
1. `GET /api/admin/categories` - Listar todas
2. `POST /api/admin/categories` - Crear nueva
3. `PUT /api/admin/categories/:id` - Actualizar

### 🟡 Media Prioridad
4. `GET /api/admin/categories/:id` - Ver detalle
5. `DELETE /api/admin/categories/:id` - Eliminar (con validaciones)

### 🟢 Baja Prioridad
6. `GET /api/admin/categories/stats` - Estadísticas
7. `PUT /api/admin/categories/reorder` - Reordenar

---

## 💡 Consideraciones Adicionales

### Imágenes
- Las imágenes deberían subirse a través de un endpoint separado de upload
- O usar URLs externas si las imágenes están en un CDN

### Slugs
- Se recomienda generar el slug automáticamente desde el nombre en el backend
- Validar que sea único antes de guardar

### Soft Delete
- Considerar implementar soft delete (marcar como inactivo) en lugar de eliminar físicamente
- Permite recuperar categorías eliminadas por error

### Cache
- Las categorías cambian poco, ideal para cachear
- Invalidar cache al crear/actualizar/eliminar

---

**Contacto:** Equipo de Dashboard CERES  
**Última actualización:** Octubre 2025  
**Versión:** 1.0

