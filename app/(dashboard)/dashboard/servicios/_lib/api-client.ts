/**
 * Cliente para la API de Servicios
 */

// Configuración de la API
const USE_PROXY = typeof window !== 'undefined'; // Solo usar proxy en el cliente
const API_BASE_URL = USE_PROXY 
  ? '/api/servicios-externos' // Ruta del proxy en Next.js
  : process.env.NEXT_PUBLIC_SERVICES_API_URL || 'http://localhost:3000';
const API_KEY = process.env.ADMIN_API_KEY || 'ola-ke-ase';

export interface APIError {
  success: false;
  error: string;
  message: string;
}

export interface APIResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginatedAPIResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos de respuesta de la API (formato crudo de la API)
export interface APIStatsResponse {
  overview: {
    totalProfessionals: number;
    activeProfessionals: number;
    pendingProfessionals: number;
    suspendedProfessionals: number;
    totalServices: number;
    activeLocations: number;
  };
  categoryDistribution: Array<{
    category: string;
    count: number;
  }>;
  geographicDistribution: Array<{
    location: string;
    count: number;
  }>;
}

export interface APIProfessionalResponse {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  bio: string;
  status: 'pending' | 'active' | 'suspended';
  verified: boolean;
  professionalGroup?: 'oficios' | 'profesiones';
  experienceYears?: number;
  rating?: number;
  reviewCount?: number;
  serviceCount?: number;
  location?: string;
  serviceLocations?: string[];
  ProfilePicture?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  CV?: string;
  createdAt: string;
  updatedAt: string;
  services?: Array<{
    id: string;
    title: string;
    category?: string;
    description?: string;
    priceRange?: string;
    available?: boolean;
    categoryId?: string;
    categoryGroup?: 'oficios' | 'profesiones';
    createdAt?: string;
    updatedAt?: string;
  }>;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    birthDate?: string;
    location?: string;
    verified?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  reviews?: Array<{
    id: string;
    professionalId: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  }>;
  _count?: {
    services: number;
    reviews: number;
    contactRequests: number;
  };
}

export interface ListProfessionalsParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'pending' | 'suspended';
  grupo?: 'oficios' | 'profesiones';
  search?: string;
}

export interface UpdateProfessionalData {
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    location?: string;
  };
  bio?: string;
  experienceYears?: number;
  professionalGroup?: 'oficios' | 'profesiones';
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  location?: string;
  serviceLocations?: string[];
  specialties?: string[];
  schedule?: Record<string, { start: string; end: string }>;
  verified?: boolean;
  certified?: boolean;
}

/**
 * Cliente de API de Servicios
 */
class ServicesAPIClient {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string = API_BASE_URL, apiKey: string = API_KEY) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  /**
   * Realiza una petición HTTP a la API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T> | PaginatedAPIResponse<T> | APIError> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'x-admin-api-key': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        return {
          success: false,
          error: errorData.error || 'unknown_error',
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        success: false,
        error: 'network_error',
        message: error instanceof Error ? error.message : 'Error de conexión con la API',
      };
    }
  }

  /**
   * Obtiene las estadísticas del dashboard
   */
  async getStats(): Promise<APIResponse<APIStatsResponse> | APIError> {
    const result = await this.request<APIStatsResponse>('/api/admin/stats');
    // Asegurar que retornamos solo APIResponse o APIError, no PaginatedAPIResponse
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIStatsResponse> | APIError;
  }

  /**
   * Lista todos los profesionales con filtros y paginación
   */
  async listProfessionals(
    params?: ListProfessionalsParams
  ): Promise<PaginatedAPIResponse<APIProfessionalResponse> | APIError> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.grupo) queryParams.set('grupo', params.grupo);
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    const endpoint = `/api/admin/professionals${query ? `?${query}` : ''}`;

    const result = await this.request<APIProfessionalResponse>(endpoint);
    // Verificar que sea una respuesta paginada
    if (result.success && !('pagination' in result)) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta paginada'
      };
    }
    return result as PaginatedAPIResponse<APIProfessionalResponse> | APIError;
  }

  /**
   * Obtiene el detalle completo de un profesional
   */
  async getProfessional(id: string): Promise<APIResponse<APIProfessionalResponse> | APIError> {
    const result = await this.request<APIProfessionalResponse>(`/api/admin/professionals/${id}`);
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIProfessionalResponse> | APIError;
  }

  /**
   * Actualiza la información de un profesional
   */
  async updateProfessional(
    id: string,
    data: UpdateProfessionalData
  ): Promise<APIResponse<APIProfessionalResponse> | APIError> {
    const result = await this.request<APIProfessionalResponse>(`/api/admin/professionals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIProfessionalResponse> | APIError;
  }

  /**
   * Actualiza el estado de un profesional (aprobar/rechazar/suspender)
   */
  async updateProfessionalStatus(
    id: string,
    status: 'active' | 'pending' | 'suspended',
    verified?: boolean
  ): Promise<APIResponse<APIProfessionalResponse> | APIError> {
    const result = await this.request<APIProfessionalResponse>(`/api/admin/professionals/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, verified }),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIProfessionalResponse> | APIError;
  }
}

// Exportar instancia singleton
export const apiClient = new ServicesAPIClient();

// Exportar clase para testing o instancias personalizadas
export default ServicesAPIClient;

