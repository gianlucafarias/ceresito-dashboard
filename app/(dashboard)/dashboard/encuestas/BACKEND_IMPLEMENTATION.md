# Implementación Backend - Filtrado por Barrio

## Resumen de la Funcionalidad

Se ha implementado en el frontend un sistema de filtrado por barrio para el dashboard de encuestas. El usuario puede seleccionar entre "Todos los barrios" (por defecto) o un barrio específico para filtrar los datos.

## Componentes Frontend Implementados

### 1. Contexto de Filtro (`barrio-filter-context.tsx`)
- Maneja el estado global del filtro seleccionado
- Proporciona `selectedBarrio`, `isFiltered` y `setSelectedBarrio`
- Disponible en toda la página de encuestas

### 2. Selector de Barrio (`barrio-filter.tsx`)
- Dropdown con búsqueda para seleccionar barrio
- Muestra cantidad de encuestas por barrio
- Opción "Todos los barrios" siempre disponible

### 3. Indicadores Visuales
- Banner azul cuando hay filtro activo
- Banner verde con estadísticas del barrio seleccionado
- Botón para limpiar filtro

## Endpoints Backend Requeridos

### 1. Estadísticas Filtradas por Barrio
```
GET /api/encuestaobras/estadisticas?barrio={nombreBarrio}
```

**Parámetros:**
- `barrio` (opcional): Nombre del barrio para filtrar
- Si no se envía, devolver todas las estadísticas

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "totalEncuestas": 150,
    "totalBarrios": 1,
    "encuestasPorBarrio": [
      {
        "nombre": "Centro",
        "cantidad": 150
      }
    ],
    "obrasUrgentesTop": [...],
    "serviciosMejorarTop": [...],
    "participacionContacto": {
      "quieren": 45,
      "noQuieren": 105
    },
    "otrosComentarios": {...}
  }
}
```

### 2. Encuestas Filtradas por Barrio
```
GET /api/encuestaobras/todas?barrio={nombreBarrio}&page={page}&per_page={per_page}
```

**Parámetros:**
- `barrio` (opcional): Nombre del barrio para filtrar
- `page`, `per_page`: Paginación estándar
- Otros filtros existentes (estado, fechas, búsqueda)

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "encuestas": [...],
    "total": 150,
    "page": 1,
    "totalPages": 15
  }
}
```

## Lógica de Filtrado

### Cuando `barrio` está presente:
1. Filtrar encuestas por `barrio = {nombreBarrio}`
2. Calcular estadísticas solo para ese barrio
3. Mantener la misma estructura de respuesta

### Cuando `barrio` no está presente:
1. Devolver todas las encuestas (comportamiento actual)
2. Calcular estadísticas globales
3. Mantener la misma estructura de respuesta

## Consideraciones de Implementación

### 1. Validación
- Validar que el nombre del barrio existe en la base de datos
- Si el barrio no existe, devolver error 404 o lista vacía

### 2. Performance
- Considerar índices en la columna `barrio` de la tabla de encuestas
- Cache para estadísticas filtradas por barrio (Redis recomendado)

### 3. Compatibilidad
- Mantener compatibilidad con endpoints existentes
- El parámetro `barrio` debe ser opcional

### 4. Ordenamiento
- Mantener el ordenamiento por defecto (ID descendente)
- Permitir ordenamiento por otros campos cuando se filtre por barrio

## Ejemplo de Implementación (Pseudocódigo)

```typescript
// En el controlador de estadísticas
async function getEstadisticasEncuestas(req, res) {
  const { barrio } = req.query;
  
  let whereClause = {};
  if (barrio && barrio !== 'todos') {
    whereClause.barrio = barrio;
  }
  
  const encuestas = await Encuesta.findAll({
    where: whereClause,
    // ... resto de la lógica
  });
  
  // Calcular estadísticas basadas en encuestas filtradas
  const stats = calcularEstadisticas(encuestas);
  
  res.json({
    success: true,
    data: stats
  });
}
```

## Testing

### Casos de Prueba Recomendados:
1. **Sin filtro**: `GET /estadisticas` → Estadísticas globales
2. **Con filtro válido**: `GET /estadisticas?barrio=Centro` → Estadísticas del Centro
3. **Con filtro inválido**: `GET /estadisticas?barrio=BarrioInexistente` → Error o lista vacía
4. **Filtro en tabla**: `GET /todas?barrio=Centro&page=1` → Encuestas del Centro paginadas

## Próximos Pasos

1. **Backend**: Implementar filtrado en endpoints existentes
2. **Frontend**: Conectar filtro con llamadas a la API
3. **Testing**: Verificar funcionalidad end-to-end
4. **Performance**: Optimizar consultas y agregar cache si es necesario

## Contacto

Para consultas sobre la implementación frontend, revisar los componentes en `_components/`.
Para consultas sobre la implementación backend, contactar al equipo de desarrollo backend.
