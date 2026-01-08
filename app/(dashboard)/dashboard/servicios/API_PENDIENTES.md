# 📋 Endpoints Pendientes - API de Servicios

Este documento lista los endpoints que aún **NO están implementados** en la API de servicios y que actualmente se manejan con datos mock en el dashboard.

---

## ✅ Endpoints Ya Implementados

Los siguientes endpoints **YA ESTÁN funcionando** con la API real:

- ✅ `GET /api/admin/stats` - Estadísticas del dashboard
- ✅ `GET /api/admin/professionals` - Listar profesionales con filtros y paginación
- ✅ `GET /api/admin/professionals/:id` - Obtener detalle de un profesional
- ✅ `PUT /api/admin/professionals/:id` - Actualizar profesional
- ✅ `PUT /api/admin/professionals/:id/status` - Cambiar estado del profesional

---

## ❌ Endpoints Pendientes de Implementación

### 1. Reviews / Reseñas de Profesionales

**Endpoint sugerido:** `GET /api/admin/professionals/:id/reviews`

**Descripción:** Obtener todas las reseñas/calificaciones de un profesional específico.

**Formato de respuesta esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id": "review-uuid-1",
      "professionalId": "prof-uuid-123",
      "userId": "user-uuid-456",
      "rating": 5,
      "comment": "Excelente trabajo, muy profesional",
      "createdAt": "2025-02-10T15:30:00.000Z",
      "user": {
        "firstName": "María",
        "lastName": "González",
        "picture": "/uploads/profiles/maria.jpg"
      }
    }
  ]
}
```

**Uso actual en el dashboard:**
- Página: `app/(dashboard)/dashboard/servicios/profesionales/[id]/page.tsx`
- Mock: `mockReviews` en `_lib/mock-data.ts`
- Filtro actual: Se filtran por `professionalId`

**Campos requeridos:**
- `id` (string): UUID de la reseña
- `professionalId` (string): UUID del profesional
- `userId` (string): UUID del usuario que escribió la reseña
- `rating` (number): Calificación de 1 a 5
- `comment` (string): Comentario de la reseña
- `createdAt` (string/Date): Fecha de creación
- `user` (object): Información básica del usuario (firstName, lastName, picture opcional)

---

### 2. Contact Requests / Solicitudes de Contacto

**Endpoint sugerido:** `GET /api/admin/contact-requests`

**Descripción:** Listar todas las solicitudes de contacto entre usuarios y profesionales.

**Parámetros de filtrado sugeridos:**
- `page` (number): Número de página
- `limit` (number): Resultados por página
- `status` (string): Filtrar por estado ('pending', 'contacted', 'closed')
- `professionalId` (string): Filtrar por profesional específico

**Formato de respuesta esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id": "contact-uuid-1",
      "professionalId": "prof-uuid-123",
      "userId": "user-uuid-456",
      "serviceId": "service-uuid-789",
      "message": "Necesito reparar una canilla que gotea en mi cocina.",
      "status": "contacted",
      "createdAt": "2024-01-20T10:00:00.000Z",
      "professional": {
        "id": "prof-uuid-123",
        "user": {
          "firstName": "Juan",
          "lastName": "Pérez"
        }
      },
      "user": {
        "firstName": "María",
        "lastName": "González",
        "email": "maria@email.com",
        "phone": "+54911234567"
      },
      "service": {
        "id": "service-uuid-789",
        "title": "Reparaciones de plomería general"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Uso actual en el dashboard:**
- Mock: `mockContactRequests` en `_lib/mock-data.ts`
- **Nota:** Actualmente no se usa en ninguna página, pero sería útil para una sección de "Solicitudes" o "Mensajería"

**Campos requeridos:**
- `id` (string): UUID de la solicitud
- `professionalId` (string): UUID del profesional contactado
- `userId` (string): UUID del usuario que contacta
- `serviceId` (string, opcional): UUID del servicio por el que se contacta
- `message` (string): Mensaje del usuario
- `status` (string): Estado de la solicitud ('pending', 'contacted', 'closed')
- `createdAt` (string/Date): Fecha de creación
- `professional`, `user`, `service` (objects): Información relacionada

---

### 3. Support Tickets / Tickets de Soporte

**Endpoint sugerido:** `GET /api/admin/support-tickets`

**Descripción:** Listar todos los tickets de soporte, bugs, sugerencias y quejas de usuarios.

**Parámetros de filtrado sugeridos:**
- `page` (number): Número de página
- `limit` (number): Resultados por página
- `status` (string): Filtrar por estado ('open', 'in_progress', 'resolved', 'closed')
- `type` (string): Filtrar por tipo ('bug', 'feature', 'support', 'complaint', 'suggestion')
- `priority` (string): Filtrar por prioridad ('low', 'medium', 'high', 'urgent')
- `search` (string): Buscar en asunto y descripción

**Formato de respuesta esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ticket-uuid-1",
      "userId": "user-uuid-123",
      "type": "bug",
      "priority": "high",
      "subject": "Error al cargar fotos de perfil",
      "description": "Cuando intento subir una foto de perfil, la aplicación se cuelga...",
      "status": "open",
      "assignedTo": null,
      "response": null,
      "createdAt": "2024-04-01T10:00:00.000Z",
      "updatedAt": "2024-04-01T10:00:00.000Z",
      "resolvedAt": null,
      "user": {
        "id": "user-uuid-123",
        "firstName": "Juan",
        "lastName": "Pérez",
        "email": "juan.perez@email.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

**Uso actual en el dashboard:**
- Página: `app/(dashboard)/dashboard/servicios/solicitudes/page.tsx`
- Mock: `mockSupportTickets` en `_lib/mock-data.ts`

**Campos requeridos:**
- `id` (string): UUID del ticket
- `userId` (string): UUID del usuario que creó el ticket
- `type` (string): Tipo de ticket ('bug', 'feature', 'support', 'complaint', 'suggestion')
- `priority` (string): Prioridad ('low', 'medium', 'high', 'urgent')
- `subject` (string): Asunto/título del ticket
- `description` (string): Descripción detallada del problema/sugerencia
- `status` (string): Estado ('open', 'in_progress', 'resolved', 'closed')
- `assignedTo` (string, opcional): ID del admin asignado
- `response` (string, opcional): Respuesta del equipo de soporte
- `createdAt` (string/Date): Fecha de creación
- `updatedAt` (string/Date): Última actualización
- `resolvedAt` (string/Date, opcional): Fecha de resolución
- `user` (object): Información del usuario

**Endpoints adicionales sugeridos para tickets:**
- `PUT /api/admin/support-tickets/:id/status` - Cambiar estado del ticket
- `PUT /api/admin/support-tickets/:id/assign` - Asignar ticket a un admin
- `POST /api/admin/support-tickets/:id/response` - Responder a un ticket

---

## 🔄 Endpoints Opcionales / Mejoras Futuras

### 4. Estadísticas Extendidas

**Endpoint sugerido:** `GET /api/admin/stats/extended`

Agregar a las estadísticas existentes:

```json
{
  "monthlyRegistrations": [
    { "month": "Enero", "year": 2025, "count": 15 },
    { "month": "Febrero", "year": 2025, "count": 23 }
  ],
  "averageRating": 4.6,
  "totalReviews": 156,
  "contactRequestsStats": {
    "total": 450,
    "pending": 12,
    "contacted": 380,
    "closed": 58
  },
  "supportTicketsStats": {
    "total": 45,
    "open": 8,
    "in_progress": 5,
    "resolved": 20,
    "closed": 12
  }
}
```

**Uso:** Dashboard principal para mostrar evolución temporal y métricas completas.

---

### 5. Bulk Operations / Operaciones en Lote

Para mejorar la eficiencia del dashboard:

- `POST /api/admin/professionals/bulk-approve` - Aprobar múltiples profesionales
- `POST /api/admin/professionals/bulk-suspend` - Suspender múltiples profesionales
- `POST /api/admin/support-tickets/bulk-close` - Cerrar múltiples tickets

---

## 📝 Notas de Implementación

### Paginación Estándar
Todos los endpoints que retornen listas deberían incluir:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### Formato de Fechas
Usar formato ISO 8601: `"2025-10-15T14:30:00.000Z"`

### Autenticación
Todos los endpoints deben validar la API Key en el header:
```
x-admin-api-key: {API_KEY}
```

### Manejo de Errores
Formato consistente para errores:
```json
{
  "success": false,
  "error": "not_found",
  "message": "Recurso no encontrado"
}
```

---

## 📅 Prioridad de Implementación

### 🔴 Alta Prioridad
1. **Support Tickets** - Ya se usa en la página de solicitudes pero con datos mock

### 🟡 Media Prioridad
2. **Reviews** - Se muestra en detalle de profesional
3. **Estadísticas Extendidas** - Para gráficos de evolución en el dashboard

### 🟢 Baja Prioridad
4. **Contact Requests** - No se usa actualmente, pero será útil para futuras funcionalidades
5. **Bulk Operations** - Optimización para administradores

---

## 🤝 Integración en el Dashboard

Una vez que implementes estos endpoints:

1. Actualizar `api-client.ts` agregando los nuevos métodos
2. Crear adaptadores en `api-adapters.ts` si es necesario
3. Reemplazar imports de mock-data en las páginas correspondientes
4. Eliminar las exportaciones mock que ya no se necesiten

---

**Contacto:** Equipo de Dashboard CERES  
**Última actualización:** Octubre 2025  
**Versión:** 1.0

