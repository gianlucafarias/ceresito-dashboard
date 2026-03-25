# API de Categorias

Documento alineado al backend actual de `plataforma-servicios-ceres`.

## Autenticacion

Todos los endpoints admin usan:

```http
x-admin-api-key: <api-key>
Content-Type: application/json
```

El panel consume estos endpoints a traves del proxy:

```text
/api/servicios-externos/api/...
```

## Modelo real

- `group = oficios`
  - `type = area`: categoria padre, solo valida para oficios.
  - `type = subcategory`: categoria hija de un area, requiere `parentId`.
- `group = profesiones`
  - Siempre se maneja como `type = subcategory`.
  - No tiene padre.

## GET /api/admin/categories

### Sin query params

Devuelve la estructura agrupada que hoy usa el panel:

```json
{
  "success": true,
  "data": {
    "areas": [
      {
        "id": "cat_1",
        "name": "Construccion",
        "slug": "construccion",
        "group": "oficios",
        "image": "https://cdn.example.com/construccion.jpg",
        "description": "Servicios del rubro construccion",
        "active": true,
        "subcategoryCount": 4
      }
    ],
    "subcategoriesOficios": [
      {
        "id": "cat_2",
        "name": "Plomeria",
        "slug": "plomeria",
        "group": "oficios",
        "areaId": "cat_1",
        "areaSlug": "construccion",
        "image": null,
        "description": "Servicios de plomeria",
        "active": true,
        "professionalCount": 7
      }
    ],
    "subcategoriesProfesiones": [
      {
        "id": "cat_3",
        "name": "Arquitectura",
        "slug": "arquitectura",
        "group": "profesiones",
        "areaId": null,
        "areaSlug": null,
        "image": null,
        "description": "Servicios profesionales",
        "active": true,
        "professionalCount": 5
      }
    ],
    "stats": {
      "totalAreas": 1,
      "totalSubcategoriesOficios": 1,
      "totalSubcategoriesProfesiones": 1,
      "totalCategories": 3
    }
  }
}
```

### Con `type`, `group` o `search`

El backend cambia de forma y devuelve una lista plana:

```json
{
  "success": true,
  "data": [
    {
      "id": "cat_2",
      "type": "subcategory",
      "name": "Plomeria",
      "slug": "plomeria",
      "group": "oficios",
      "parentId": "cat_1",
      "parentSlug": "construccion",
      "image": null,
      "description": "Servicios de plomeria",
      "active": true,
      "subcategoryCount": 0,
      "professionalCount": 7
    }
  ]
}
```

Nota: por esa diferencia de contrato, la pantalla del panel carga el arbol completo y filtra localmente.

## GET /api/admin/categories/:id

Devuelve detalle real de una categoria:

```json
{
  "success": true,
  "data": {
    "id": "cat_1",
    "type": "area",
    "name": "Construccion",
    "slug": "construccion",
    "group": "oficios",
    "parentId": null,
    "image": "https://cdn.example.com/construccion.jpg",
    "description": "Servicios del rubro construccion",
    "active": true,
    "parent": null,
    "subcategories": [
      {
        "id": "cat_2",
        "name": "Plomeria",
        "slug": "plomeria"
      }
    ],
    "professionals": [],
    "_count": {
      "children": 1,
      "services": 0
    }
  }
}
```

## POST /api/admin/categories

### Crear area de oficios

```json
{
  "type": "area",
  "name": "Construccion",
  "slug": "construccion",
  "group": "oficios",
  "description": "Servicios del rubro construccion",
  "image": "https://cdn.example.com/construccion.jpg",
  "active": true
}
```

### Crear subcategoria hija de oficios

```json
{
  "type": "subcategory",
  "name": "Plomeria",
  "slug": "plomeria",
  "group": "oficios",
  "parentId": "cat_1",
  "description": "Servicios de plomeria",
  "image": null,
  "active": true
}
```

### Crear profesion

```json
{
  "type": "subcategory",
  "name": "Arquitectura",
  "slug": "arquitectura",
  "group": "profesiones",
  "description": "Servicios profesionales",
  "image": null,
  "active": true
}
```

Reglas:

- `type = area` solo es valido para `group = oficios`.
- `group = oficios` y `type = subcategory` requiere `parentId`.
- `slug` debe ser unico.

## PUT /api/admin/categories/:id

Campos soportados hoy:

```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripcion",
  "image": "https://cdn.example.com/nueva.jpg",
  "active": true,
  "parentId": "cat_padre"
}
```

Nota: el backend actual no expone update de `slug`.

## DELETE /api/admin/categories/:id

El panel usa:

```text
DELETE /api/admin/categories/:id?deactivate=true
```

Limitacion actual del backend:

- Si la categoria tiene hijas o servicios asociados y no se usa `force=true`, devuelve `409`.
- Esa restriccion aplica incluso cuando se intenta desactivar.

## Upload de imagen alineado con R2

Las categorias no suben imagen directo al endpoint admin. El panel usa el mismo flujo de upload del proyecto de servicios:

1. `POST /api/upload/grant`

```json
{
  "context": "register",
  "type": "image"
}
```

Respuesta:

```json
{
  "success": true,
  "token": "upload_token",
  "expiresAt": "2026-03-17T12:00:00.000Z"
}
```

2. `POST /api/upload`

- `multipart/form-data`
- campos: `file`, `type=image`
- header adicional: `x-upload-token: <token>`

Respuesta:

```json
{
  "success": true,
  "filename": "profiles/123.jpg",
  "path": "https://cdn.example.com/profiles/123.jpg",
  "url": "https://cdn.example.com/profiles/123.jpg",
  "value": "https://cdn.example.com/profiles/123.jpg",
  "storage": "r2"
}
```

El panel persiste `url` en `image`.

## Contrato del panel

El cliente del panel normaliza:

- `areas` -> `type = area`
- `subcategoriesOficios` -> `type = subcategory`
- `subcategoriesProfesiones` -> `type = subcategory`
- `parentId` y `areaId` para que la UI no dependa de formas distintas del backend

Eso deja estable la UI sin tocar aun el proyecto de servicios.
