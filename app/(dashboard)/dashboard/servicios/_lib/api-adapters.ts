/**
 * Adaptadores para transformar datos de la API al formato local
 * Convierte respuestas de la API en los tipos definidos en _types/index.ts
 */

import { Professional, Service, User } from '../_types';
import { APIProfessionalResponse, APIStatsResponse } from './api-client';

/**
 * Convierte una fecha string a objeto Date
 */
function parseDate(dateString: string | undefined): Date {
  if (!dateString) return new Date();
  return new Date(dateString);
}

/**
 * Adapta el usuario de la respuesta de la API
 */
export function adaptUser(apiUser: APIProfessionalResponse['user'], apiProfessional?: APIProfessionalResponse): User | undefined {
  if (!apiUser) {
    // Si no hay user anidado, intentar construir desde los datos del profesional
    if (!apiProfessional) return undefined;
    
    return {
      id: apiProfessional.userId,
      email: apiProfessional.email || '',
      firstName: apiProfessional.name?.split(' ')[0] || '',
      lastName: apiProfessional.name?.split(' ').slice(1).join(' ') || '',
      phone: apiProfessional.phone,
      location: apiProfessional.location,
      role: 'professional',
      verified: apiProfessional.verified,
      whatsapp: apiProfessional.whatsapp,
      instagram: apiProfessional.instagram,
      facebook: apiProfessional.facebook,
      linkedin: apiProfessional.linkedin,
      website: apiProfessional.website,
      portfolio: apiProfessional.portfolio,
      cv: apiProfessional.CV,
      picture: apiProfessional.ProfilePicture,
      createdAt: parseDate(apiProfessional.createdAt),
      emailVerified: apiProfessional.verified,
    };
  }

  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    phone: apiUser.phone,
    birthDate: apiUser.birthDate ? parseDate(apiUser.birthDate) : undefined,
    location: apiUser.location,
    role: 'professional',
    createdAt: apiUser.createdAt ? parseDate(apiUser.createdAt) : undefined,
    verified: apiUser.verified,
    // Información adicional de contacto desde el profesional
    whatsapp: apiProfessional?.whatsapp,
    instagram: apiProfessional?.instagram,
    facebook: apiProfessional?.facebook,
    linkedin: apiProfessional?.linkedin,
    website: apiProfessional?.website,
    portfolio: apiProfessional?.portfolio,
    cv: apiProfessional?.CV,
    picture: apiProfessional?.ProfilePicture,
    emailVerified: apiUser.verified,
  };
}

/**
 * Adapta un servicio de la respuesta de la API
 */
export function adaptService(apiService: APIProfessionalResponse['services'][0], professionalId: string): Service {
  return {
    id: apiService.id,
    professionalId: professionalId,
    categoryId: apiService.categoryId || '',
    categoryGroup: apiService.categoryGroup,
    title: apiService.title,
    description: apiService.description || '',
    priceRange: apiService.priceRange || 'A consultar',
    available: apiService.available !== undefined ? apiService.available : true,
    createdAt: apiService.createdAt ? parseDate(apiService.createdAt) : new Date(),
    updatedAt: apiService.updatedAt ? parseDate(apiService.updatedAt) : new Date(),
  };
}

/**
 * Adapta un profesional de la respuesta de la API
 */
export function adaptProfessional(apiProfessional: APIProfessionalResponse): Professional {
  const user = adaptUser(apiProfessional.user, apiProfessional);
  
  const services = apiProfessional.services?.map(service => 
    adaptService(service, apiProfessional.id)
  ) || [];

  return {
    id: apiProfessional.id,
    userId: apiProfessional.userId,
    user: user,
    location: apiProfessional.location || apiProfessional.serviceLocations?.[0],
    bio: apiProfessional.bio || '',
    experienceYears: apiProfessional.experienceYears || 0,
    verified: apiProfessional.verified,
    certified: false, // La API no retorna este campo aún, por defecto false
    status: apiProfessional.status,
    rating: apiProfessional.rating || 0,
    reviewCount: apiProfessional.reviewCount || apiProfessional._count?.reviews || 0,
    createdAt: parseDate(apiProfessional.createdAt),
    updatedAt: parseDate(apiProfessional.updatedAt),
    services: services,
  };
}

/**
 * Adapta una lista de profesionales
 */
export function adaptProfessionals(apiProfessionals: APIProfessionalResponse[]): Professional[] {
  return apiProfessionals.map(adaptProfessional);
}

/**
 * Adapta las estadísticas del dashboard
 */
export function adaptDashboardStats(apiStats: APIStatsResponse) {
  return {
    totalProfessionals: apiStats.overview.totalProfessionals,
    activeProfessionals: apiStats.overview.activeProfessionals,
    pendingProfessionals: apiStats.overview.pendingProfessionals,
    totalServices: apiStats.overview.totalServices,
    totalContactRequests: 0, // No disponible en API aún
    pendingContactRequests: 0, // No disponible en API aún
    averageRating: 0, // No disponible en API aún, calcular del lado del cliente si es necesario
    professionalsByCategory: apiStats.categoryDistribution.map(item => ({
      category: item.category === 'oficios' ? 'Oficios' : 'Profesiones',
      count: item.count,
    })),
    professionalsByLocation: apiStats.geographicDistribution.map(item => ({
      location: item.location,
      count: item.count,
    })),
    monthlyRegistrations: [], // No disponible en API aún
  };
}

/**
 * Prepara los datos de un profesional para enviar a la API
 * Transforma del formato local al formato esperado por la API
 */
export function prepareUpdateProfessionalData(formData: any) {
  const data: any = {};

  // Datos del usuario
  if (formData.firstName || formData.lastName || formData.email || formData.phone || formData.birthDate || formData.location) {
    data.user = {};
    if (formData.firstName) data.user.firstName = formData.firstName;
    if (formData.lastName) data.user.lastName = formData.lastName;
    if (formData.email) data.user.email = formData.email;
    if (formData.phone) data.user.phone = formData.phone;
    if (formData.birthDate) data.user.birthDate = formData.birthDate;
    if (formData.location) data.user.location = formData.location;
  }

  // Datos del profesional
  if (formData.bio !== undefined) data.bio = formData.bio;
  if (formData.experienceYears !== undefined) data.experienceYears = formData.experienceYears;
  if (formData.professionalGroup) data.professionalGroup = formData.professionalGroup;
  if (formData.whatsapp) data.whatsapp = formData.whatsapp;
  if (formData.instagram) data.instagram = formData.instagram;
  if (formData.facebook) data.facebook = formData.facebook;
  if (formData.linkedin) data.linkedin = formData.linkedin;
  if (formData.website) data.website = formData.website;
  if (formData.portfolio) data.portfolio = formData.portfolio;
  if (formData.location) data.location = formData.location;
  if (formData.serviceLocations) data.serviceLocations = formData.serviceLocations;
  if (formData.verified !== undefined) data.verified = formData.verified;
  if (formData.certified !== undefined) data.certified = formData.certified;

  return data;
}




