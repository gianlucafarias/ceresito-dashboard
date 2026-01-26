# 🔐 Requerimientos para el Servicio Externo de Profesionales

Este documento describe los requerimientos que debe cumplir el servicio externo (`localhost:3000`) para manejar correctamente la carga masiva de profesionales y su acceso posterior.

## 📋 Endpoint de Carga Masiva

### `POST /api/admin/professionals/bulk`

**Descripción:** Crea múltiples profesionales y sus usuarios asociados en una sola operación.

**Headers:**
```
x-admin-api-key: <ADMIN_API_KEY>
Content-Type: application/json
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

**Respuesta Esperada:**
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

## 🔑 Requerimientos de Creación de Usuario

Cuando se crea un profesional mediante carga masiva, el servicio externo debe:

### 1. Crear el Usuario Base

- **Email:** Usar el email proporcionado
- **Contraseña inicial:** Generar una contraseña temporal segura
- **Rol:** Asignar rol `professional`
- **Estado:** Usuario activo pero con contraseña temporal

### 2. Generar Credenciales Temporales

El servicio debe generar:
- Una contraseña temporal aleatoria y segura
- Un token de activación único
- Una fecha de expiración para el token (ej: 7 días)

### 3. Enviar Email de Bienvenida

El servicio debe enviar un email al profesional con:
- **Asunto:** "Bienvenido a la Plataforma de Servicios CERES"
- **Contenido:**
  - Mensaje de bienvenida
  - Sus credenciales temporales:
    - Email: `{email}`
    - Contraseña temporal: `{password_temporal}`
  - Link de activación: `https://plataforma-servicios.com/activar-cuenta?token={token}`
  - Instrucciones para cambiar la contraseña en el primer acceso
  - Link directo a la plataforma: `https://plataforma-servicios.com/login`

### 4. Crear el Perfil Profesional

- Vincular el usuario creado con el perfil profesional
- Estado inicial: `pending` (requiere aprobación del admin)
- Verificado: `false` (requiere verificación)

## 🔄 Flujo de Primer Acceso

### Opción A: Activación por Token (Recomendado)

1. Usuario recibe email con link de activación
2. Usuario hace clic en el link
3. Sistema valida el token
4. Usuario establece su contraseña definitiva
5. Cuenta activada y puede iniciar sesión

### Opción B: Login con Contraseña Temporal

1. Usuario recibe email con credenciales temporales
2. Usuario inicia sesión con email y contraseña temporal
3. Sistema fuerza cambio de contraseña en primer acceso
4. Usuario establece contraseña definitiva
5. Puede continuar usando la plataforma

## 📧 Template de Email Sugerido

```
Asunto: Bienvenido a la Plataforma de Servicios CERES

Hola {firstName} {lastName},

Te damos la bienvenida a la Plataforma de Servicios CERES.

Tu cuenta ha sido creada con los siguientes datos:

📧 Email: {email}
🔑 Contraseña temporal: {temporaryPassword}

IMPORTANTE: Por seguridad, deberás cambiar esta contraseña en tu primer acceso.

🔗 Activar cuenta: {activationLink}

O inicia sesión directamente en:
https://plataforma-servicios.com/login

Una vez que inicies sesión, podrás:
- Completar tu perfil profesional
- Agregar tus servicios
- Gestionar tus solicitudes de contacto
- Ver tus reseñas

Tu perfil está actualmente en estado "Pendiente" y será revisado por nuestro equipo de administración.

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
Equipo CERES
```

## 🔐 Endpoints Adicionales Necesarios

### 1. Activación de Cuenta

```
POST /api/auth/activate-account
Body: { token: string, newPassword: string }
```

### 2. Cambio de Contraseña Forzado

```
POST /api/auth/force-password-change
Headers: Authorization: Bearer <token>
Body: { currentPassword: string, newPassword: string }
```

### 3. Reenvío de Credenciales

```
POST /api/admin/professionals/{id}/resend-credentials
Headers: x-admin-api-key: <ADMIN_API_KEY>
```

## 📝 Campos Adicionales en la Respuesta

Cuando se crea un profesional, sería útil que el servicio retorne:

```json
{
  "id": "prof-uuid",
  "userId": "user-uuid",
  "email": "juan.perez@email.com",
  "status": "pending",
  "credentialsSent": true,
  "activationToken": "token-uuid",
  "createdAt": "2025-01-15T10:00:00.000Z"
}
```

## ⚠️ Consideraciones de Seguridad

1. **Contraseñas temporales:**
   - Mínimo 12 caracteres
   - Combinación de letras, números y símbolos
   - Expiración automática después de 7 días

2. **Tokens de activación:**
   - Únicos y no predecibles
   - Expiración de 7 días
   - Un solo uso

3. **Emails:**
   - Validar que el email sea válido antes de enviar
   - Manejar errores de envío de email
   - Log de emails enviados

4. **Rate Limiting:**
   - Limitar intentos de activación por IP
   - Limitar reenvíos de credenciales

## 🔄 Integración con el Dashboard

El dashboard de administración:

1. ✅ Envía los datos al servicio externo mediante `/api/admin/professionals/bulk`
2. ✅ Muestra el resultado de la carga (éxitos y errores)
3. ⏳ Podría mostrar si las credenciales fueron enviadas (si el servicio lo retorna)
4. ⏳ Podría tener opción de reenviar credenciales desde el dashboard

## 📋 Checklist para el Servicio Externo

- [ ] Endpoint `/api/admin/professionals/bulk` implementado
- [ ] Creación automática de usuarios con rol `professional`
- [ ] Generación de contraseñas temporales seguras
- [ ] Generación de tokens de activación
- [ ] Sistema de envío de emails configurado
- [ ] Template de email de bienvenida implementado
- [ ] Endpoint de activación de cuenta
- [ ] Forzar cambio de contraseña en primer acceso
- [ ] Endpoint de reenvío de credenciales
- [ ] Manejo de errores y validaciones
- [ ] Logs de auditoría

## 🚀 Próximos Pasos

1. El equipo del servicio externo debe implementar estos endpoints y funcionalidades
2. Una vez implementado, probar la integración completa desde el dashboard
3. Documentar el proceso para los administradores que usarán la carga masiva
