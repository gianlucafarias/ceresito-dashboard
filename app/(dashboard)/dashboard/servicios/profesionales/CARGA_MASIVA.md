# 📤 Guía de Carga Masiva de Profesionales

Esta funcionalidad permite cargar múltiples profesionales a la vez mediante un archivo CSV.

## 📋 Formato del CSV

El archivo CSV debe tener las siguientes columnas (en cualquier orden):

### Columnas Requeridas

- **nombre** (o `firstname`, `first_name`, `primer nombre`): Nombre del profesional
- **apellido** (o `lastname`, `last_name`, `apellidos`): Apellido del profesional  
- **email** (o `correo`, `mail`, `e-mail`): Email del profesional (debe ser único y válido)

### Columnas Opcionales

- **telefono** (o `phone`, `tel`, `teléfono`): Número de teléfono
- **bio** (o `biografia`, `descripcion`, `description`, `biografía`): Biografía del profesional
- **grupo** (o `group`, `tipo`, `type`): Tipo de profesional (`oficios` o `profesiones`). Por defecto: `oficios`
- **ubicacion** (o `location`, `ciudad`, `city`, `ubicación`): Ubicación del profesional
- **experiencia** (o `experience`, `años`, `years`, `años de experiencia`): Años de experiencia (número)

## 📝 Ejemplo de CSV

```csv
nombre,apellido,email,telefono,bio,grupo,ubicacion,experiencia
Juan,Pérez,juan.perez@email.com,+54911234567,Plomero con 10 años de experiencia,oficios,Ceres,10
María,González,maria.gonzalez@email.com,+54911234568,Arquitecta especializada en diseño residencial,profesiones,Ceres,8
Carlos,Rodríguez,carlos.rodriguez@email.com,+54911234569,Electricista certificado,oficios,Hersilia,5
```

## 🚀 Cómo Usar

1. **Preparar el archivo CSV**
   - Usa Excel, Google Sheets o cualquier editor de texto
   - Guarda el archivo con extensión `.csv`
   - Asegúrate de que la primera fila contenga los nombres de las columnas

2. **Descargar la plantilla** (opcional)
   - Haz clic en el botón "Descargar plantilla" en el diálogo de carga masiva
   - Esto te dará un ejemplo del formato correcto

3. **Subir el archivo**
   - Haz clic en el botón "Carga Masiva (CSV)" en la página de profesionales
   - Selecciona tu archivo CSV
   - El sistema validará automáticamente los datos

4. **Revisar errores de validación**
   - Si hay errores, se mostrarán antes de la carga
   - Corrige los errores en tu CSV y vuelve a intentar

5. **Confirmar la carga**
   - Revisa la vista previa de los datos
   - Haz clic en "Cargar X Profesionales"
   - El sistema mostrará el progreso y los resultados

## ✅ Validaciones

El sistema valida automáticamente:

- ✅ Nombre y apellido son requeridos
- ✅ Email es requerido y debe tener formato válido
- ✅ Teléfono (si se proporciona) debe tener formato válido
- ✅ Años de experiencia (si se proporciona) debe ser un número positivo

## ⚠️ Notas Importantes

- Los emails deben ser únicos. Si un email ya existe, ese registro fallará
- El sistema procesa los profesionales en lotes para optimizar el rendimiento
- Si algunos profesionales fallan, se mostrará un resumen con los errores
- Los profesionales creados tendrán estado `pending` por defecto y requerirán aprobación

## 🔧 Endpoint de la API

La carga masiva utiliza el endpoint:

```
POST /api/admin/professionals/bulk
```

**Body:**
```json
{
  "professionals": [
    {
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@email.com",
      "phone": "+54911234567",
      "bio": "Plomero con experiencia",
      "professionalGroup": "oficios",
      "location": "Ceres",
      "experienceYears": 10
    }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "created": 8,
    "failed": 2,
    "errors": [
      {
        "email": "email.duplicado@email.com",
        "error": "El email ya está registrado"
      }
    ]
  }
}
```

## 🐛 Solución de Problemas

### Error: "El archivo no es válido"
- Asegúrate de que el archivo tenga extensión `.csv`
- Verifica que el archivo no esté corrupto

### Error: "No se encontraron profesionales"
- Verifica que el archivo tenga al menos una fila de datos (además del encabezado)
- Asegúrate de que las columnas estén correctamente nombradas

### Error: "Email no válido"
- Verifica el formato de los emails en tu CSV
- Asegúrate de que no haya espacios extra

### Algunos profesionales no se cargaron
- Revisa el resumen de errores al finalizar la carga
- Los errores comunes incluyen emails duplicados o datos inválidos

## 📞 Soporte

Si tienes problemas con la carga masiva, contacta al equipo de desarrollo con:
- El archivo CSV que intentaste cargar (sin datos sensibles)
- Los mensajes de error que recibiste
- Una captura de pantalla del problema
