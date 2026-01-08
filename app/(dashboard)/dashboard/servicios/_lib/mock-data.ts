/**
 * NOTA: Este archivo contiene solo datos mock que AÚN NO están disponibles en la API.
 * 
 * Los siguientes datos ya se obtienen de la API real:
 * - Profesionales (mockProfessionals) -> API: /api/admin/professionals
 * - Servicios (mockServices) -> Incluidos en la respuesta de profesionales
 * - Usuarios (mockUsers) -> Incluidos en la respuesta de profesionales
 * - Estadísticas (mockDashboardStats) -> API: /api/admin/stats
 * 
 * Pendientes de implementación en la API:
 * - Reviews (mockReviews)
 * - Contact Requests (mockContactRequests)
 * - Support Tickets (mockSupportTickets)
 * 
 * Ver archivo API_PENDIENTES.md para más detalles sobre los endpoints faltantes.
 */

import { Review, ContactRequest, SupportTicket, User } from '../_types';

// ============================================================================
// DATOS MOCK - AÚN NO DISPONIBLES EN LA API
// ============================================================================

// Usuarios básicos para referenciar en reviews y tickets
// TODO: Eliminar cuando las reviews y tickets incluyan la información del usuario desde la API
const mockUsersForReferences: User[] = [
  {
    id: "1",
    email: "juan.perez@email.com",
    firstName: "Juan",
    lastName: "Pérez",
    phone: "+54 3491 123456",
    birthDate: new Date("1985-03-15"),
    location: "Ceres",
    role: "professional",
    createdAt: new Date("2024-01-15"),
    verified: true,
    // Información adicional de contacto
    whatsapp: "+54 3491 123456",
    instagram: "@juanplomero",
    facebook: "Juan Pérez Plomero",
    linkedin: "juan-perez-plomero",
    website: "www.juanplomero.com",
    portfolio: "www.juanplomero.com/portfolio",
    cv: "/docs/cv-juan-perez.pdf",
    picture: "/images/professionals/juan-perez.jpg",
    emailVerified: true,
  },
  {
    id: "2",
    email: "maria.rodriguez@email.com",
    firstName: "María",
    lastName: "Rodríguez",
    phone: "+54 3491 234567",
    birthDate: new Date("1990-07-22"),
    location: "Hersilia",
    role: "professional",
    createdAt: new Date("2024-02-10"),
    verified: false,
    whatsapp: "+54 3491 234567",
    instagram: "@mariaenfermera",
    facebook: "María Rodríguez Enfermera",
    linkedin: "maria-rodriguez-enfermera",
    emailVerified: false,
  },
  {
    id: "3",
    email: "carlos.gomez@email.com",
    firstName: "Carlos",
    lastName: "Gómez",
    phone: "+54 3491 345678",
    birthDate: new Date("1988-11-08"),
    location: "Ambrosetti",
    role: "professional",
    createdAt: new Date("2024-03-05"),
    verified: true,
  },
  {
    id: "4",
    email: "ana.lopez@email.com",
    firstName: "Ana",
    lastName: "López",
    phone: "+54 3491 456789",
    birthDate: new Date("1992-05-12"),
    location: "Ceres",
    role: "professional",
    createdAt: new Date("2024-03-20"),
    verified: false,
  },
  {
    id: "5",
    email: "pedro.martinez@email.com",
    firstName: "Pedro",
    lastName: "Martínez",
    phone: "+54 3491 567890",
    birthDate: new Date("1987-09-30"),
    location: "San Cristóbal",
    role: "professional",
    createdAt: new Date("2024-04-01"),
    verified: true,
  },
];

// ============================================================================
// REVIEWS - Pendiente de endpoint en la API
// ============================================================================
// TODO: Implementar endpoint GET /api/admin/professionals/:id/reviews en la API
export const mockReviews: Review[] = [
  {
    id: "1",
    professionalId: "1",
    userId: "user1",
    rating: 5,
    comment: "Excelente trabajo, muy profesional y puntual.",
    createdAt: new Date("2024-01-25"),
  },
  {
    id: "2",
    professionalId: "1",
    userId: "user2",
    rating: 4,
    comment: "Buen servicio, resolvió el problema rápidamente.",
    createdAt: new Date("2024-02-05"),
  },
  {
    id: "3",
    professionalId: "3",
    userId: "user3",
    rating: 5,
    comment: "Muy buen mecánico, dejó el auto como nuevo.",
    createdAt: new Date("2024-03-10"),
  },
];

// ============================================================================
// CONTACT REQUESTS - Pendiente de endpoint en la API
// ============================================================================
// TODO: Implementar endpoint GET /api/admin/contact-requests en la API
export const mockContactRequests: ContactRequest[] = [
  {
    id: "1",
    professionalId: "1",
    userId: "user1",
    serviceId: "1",
    message: "Necesito reparar una canilla que gotea en mi cocina.",
    status: "contacted",
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    professionalId: "2",
    userId: "user2",
    serviceId: "3",
    message: "Busco enfermera para cuidar a mi madre mayor.",
    status: "pending",
    createdAt: new Date("2024-02-15"),
  },
  {
    id: "3",
    professionalId: "3",
    userId: "user3",
    serviceId: "4",
    message: "Mi auto tiene problemas con la transmisión.",
    status: "closed",
    createdAt: new Date("2024-03-08"),
  },
];

// ============================================================================
// SUPPORT TICKETS - Pendiente de endpoint en la API
// ============================================================================
// TODO: Implementar endpoint GET /api/admin/support-tickets en la API
export const mockSupportTickets: SupportTicket[] = [
  {
    id: "1",
    userId: "1",
    user: mockUsersForReferences[0],
    type: "bug",
    priority: "high",
    subject: "Error al cargar fotos de perfil",
    description: "Cuando intento subir una foto de perfil, la aplicación se cuelga y no permite continuar. He probado con diferentes formatos (JPG, PNG) y tamaños pero el problema persiste.",
    status: "open",
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2024-04-01"),
  },
  {
    id: "2",
    userId: "2",
    user: mockUsersForReferences[1],
    type: "suggestion",
    priority: "medium",
    subject: "Agregar filtro por ubicación",
    description: "Sería muy útil poder filtrar los profesionales por barrio o zona específica dentro de la ciudad. Actualmente solo se puede filtrar por ciudad completa.",
    status: "in_progress",
    assignedTo: "admin1",
    response: "Gracias por tu sugerencia. Estamos evaluando esta funcionalidad para una futura actualización.",
    createdAt: new Date("2024-03-28"),
    updatedAt: new Date("2024-03-30"),
  },
  {
    id: "3",
    userId: "3",
    user: mockUsersForReferences[2],
    type: "support",
    priority: "medium",
    subject: "No recibo notificaciones de mensajes",
    description: "He configurado las notificaciones en mi perfil pero no estoy recibiendo avisos cuando alguien me contacta por WhatsApp. ¿Hay algún problema con la configuración?",
    status: "resolved",
    assignedTo: "admin1",
    response: "El problema ha sido resuelto. Era un error en la configuración de notificaciones que ya fue corregido.",
    createdAt: new Date("2024-03-25"),
    updatedAt: new Date("2024-03-27"),
    resolvedAt: new Date("2024-03-27"),
  },
  {
    id: "4",
    userId: "4",
    user: mockUsersForReferences[3],
    type: "complaint",
    priority: "urgent",
    subject: "Profesional con comportamiento inadecuado",
    description: "Un profesional me contactó y fue muy grosero cuando le pregunté sobre sus servicios. Creo que debería ser removido de la plataforma.",
    status: "open",
    createdAt: new Date("2024-04-02"),
    updatedAt: new Date("2024-04-02"),
  },
  {
    id: "5",
    userId: "5",
    user: mockUsersForReferences[4],
    type: "feature",
    priority: "low",
    subject: "Calendario de disponibilidad",
    description: "Sería genial que los profesionales pudieran mostrar sus horarios de disponibilidad en un calendario para que los clientes sepan cuándo pueden contactarlos.",
    status: "open",
    createdAt: new Date("2024-03-30"),
    updatedAt: new Date("2024-03-30"),
  },
  {
    id: "6",
    userId: "1",
    user: mockUsersForReferences[0],
    type: "support",
    priority: "low",
    subject: "Cómo cambiar mi información de contacto",
    description: "Necesito actualizar mi número de teléfono pero no encuentro la opción en mi perfil. ¿Podrían ayudarme?",
    status: "closed",
    assignedTo: "admin2",
    response: "Puedes actualizar tu información de contacto desde tu perfil > Configuración > Información personal. Si necesitas ayuda adicional, no dudes en contactarnos.",
    createdAt: new Date("2024-03-20"),
    updatedAt: new Date("2024-03-22"),
    resolvedAt: new Date("2024-03-22"),
  },
];

// ============================================================================
// NOTA FINAL
// ============================================================================
// Ya NO exportamos mockDashboardStats, mockProfessionals, mockServices, mockUsers
// porque estos datos ahora se obtienen de la API real.
// 
// Solo mantenemos como mock: mockReviews, mockContactRequests, mockSupportTickets
