/**
 * Cliente para la API de Servicios
 */

// Configuración de la API
// En el cliente siempre usamos el proxy de Next.js para evitar problemas de CORS
// En el servidor podemos usar directamente la URL externa
const USE_PROXY = typeof window !== 'undefined'; // Solo usar proxy en el cliente
const API_BASE_URL = USE_PROXY 
  ? '/api/servicios-externos' // Ruta del proxy en Next.js (ruta API real)
  : process.env.NEXT_PUBLIC_SERVICES_API_URL || process.env.SERVICES_API_URL || 'https://ceresenred.ceres.gob.ar';
const API_KEY = USE_PROXY 
  ? process.env.NEXT_PUBLIC_ADMIN_API_KEY // Opcional en cliente si el proxy no tiene la key
  : (process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_API_KEY);

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
  registrationType?: 'email' | 'google' | 'facebook';
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

// Tipos para Usuarios
export interface APIUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  location?: string;
  role: 'citizen' | 'professional' | 'admin';
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  professional?: {
    id: string;
    status: 'pending' | 'active' | 'suspended';
    verified: boolean;
  };
  stats?: {
    contactRequests: number;
    reviews: number;
    hasProfessional: boolean;
  };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: 'citizen' | 'professional' | 'admin';
  verified?: boolean;
  search?: string;
}

export interface UpdateUserData {
  role?: 'citizen' | 'professional' | 'admin';
  verified?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  birthDate?: string;
}

// Tipos para Categorías
export interface APICategoryResponse {
  id: string;
  type: 'area' | 'subcategory';
  name: string;
  slug: string;
  group: 'oficios' | 'profesiones';
  areaId?: string | null;
  areaSlug?: string | null;
  image?: string;
  description?: string;
  active: boolean;
  subcategoryCount?: number;
  professionalCount?: number;
  createdAt: string;
  updatedAt: string;
  subcategories?: Array<{
    id: string;
    name: string;
    slug: string;
    professionalCount: number;
  }>;
  area?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    subcategories?: number;
    professionals?: number;
    services?: number;
  };
}

export interface CategoriesListResponse {
  areas: APICategoryResponse[];
  subcategoriesOficios: APICategoryResponse[];
  subcategoriesProfesiones: APICategoryResponse[];
  stats: {
    totalAreas: number;
    totalSubcategoriesOficios: number;
    totalSubcategoriesProfesiones: number;
    totalCategories: number;
  };
}

export interface ListCategoriesParams {
  type?: 'area' | 'subcategory';
  group?: 'oficios' | 'profesiones';
  search?: string;
}

export interface CreateCategoryData {
  type: 'area' | 'subcategory';
  name: string;
  slug: string;
  group: 'oficios' | 'profesiones';
  parentId?: string | null;
  description?: string;
  image?: string;
  active?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  image?: string;
  active?: boolean;
  parentId?: string | null;
}

// Tipos para Bug Reports
export interface APIBugReportResponse {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userEmail?: string;
  context?: {
    browser?: string;
    os?: string;
    url?: string;
    [key: string]: any;
  };
  adminNotes?: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListBugReportsParams {
  page?: number;
  limit?: number;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  search?: string;
}

export interface UpdateBugReportData {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  adminNotes?: string;
}

// Tipos para Certificaciones
export interface APICertificationResponse {
  id: string;
  professionalId: string;
  certificationType: string;
  certificationNumber?: string | null;
  issuingOrganization?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  adminNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  professional?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ListCertificationsParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  professionalId?: string; // Filtrar por profesional específico
}

export interface UpdateCertificationData {
  status: 'approved' | 'rejected' | 'suspended';
  adminNotes?: string;
}

/**
 * Cliente de API de Servicios
 */
class ServicesAPIClient {
  private baseURL: string;
  private apiKey: string | undefined;

  constructor(baseURL: string = API_BASE_URL, apiKey: string | undefined = API_KEY) {
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
      // Construir la URL final hacia el backend externo.
      // Importante: NO eliminar el prefijo /api porque el backend expone
      // los endpoints como /api/admin/... según la documentación.
      const url = `${this.baseURL}${endpoint}`;
      
      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };
      
      // Si tenemos API key, agregarla (opcional si usamos proxy, el proxy la agrega del servidor)
      // Si no usamos proxy, la API key es obligatoria
      if (this.apiKey) {
        headers['x-admin-api-key'] = this.apiKey;
      } else if (!USE_PROXY) {
        // Solo validar si NO estamos usando proxy (ejecución en servidor)
        console.error('ADMIN_API_KEY no está configurada. Configura ADMIN_API_KEY en las variables de entorno del servidor.');
        return {
          success: false,
          error: 'configuration_error',
          message: 'API Key no configurada. Por favor, configura ADMIN_API_KEY en las variables de entorno del servidor.',
        };
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
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

  /**
   * Carga masiva de profesionales desde CSV
   * Envía un array de profesionales para crear en lote
   */
  async bulkCreateProfessionals(
    professionals: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      bio?: string;
      professionalGroup?: 'oficios' | 'profesiones';
      location?: string;
      experienceYears?: number;
    }>
  ): Promise<APIResponse<{
    created: number;
    failed: number;
    errors: Array<{
      email: string;
      error: string;
    }>;
  }> | APIError> {
    const result = await this.request<{
      created: number;
      failed: number;
      errors: Array<{
        email: string;
        error: string;
      }>;
    }>('/api/admin/professionals/bulk', {
      method: 'POST',
      body: JSON.stringify({ professionals }),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<{
      created: number;
      failed: number;
      errors: Array<{
        email: string;
        error: string;
      }>;
    }> | APIError;
  }

  // ==================== USUARIOS ====================

  /**
   * Lista todos los usuarios con filtros y paginación
   */
  async listUsers(
    params?: ListUsersParams
  ): Promise<PaginatedAPIResponse<APIUserResponse> | APIError> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.role) queryParams.set('role', params.role);
    if (params?.verified !== undefined) queryParams.set('verified', params.verified.toString());
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    const endpoint = `/api/admin/users${query ? `?${query}` : ''}`;

    const result = await this.request<APIUserResponse>(endpoint);
    if (result.success && !('pagination' in result)) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta paginada'
      };
    }
    return result as PaginatedAPIResponse<APIUserResponse> | APIError;
  }

  /**
   * Obtiene el detalle completo de un usuario
   */
  async getUser(id: string): Promise<APIResponse<APIUserResponse> | APIError> {
    const result = await this.request<APIUserResponse>(`/api/admin/users/${id}`);
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIUserResponse> | APIError;
  }

  /**
   * Actualiza la información de un usuario
   */
  async updateUser(
    id: string,
    data: UpdateUserData
  ): Promise<APIResponse<APIUserResponse> | APIError> {
    const result = await this.request<APIUserResponse>(`/api/admin/users/${id}`, {
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
    return result as APIResponse<APIUserResponse> | APIError;
  }

  // ==================== CATEGORÍAS ====================

  /**
   * Lista todas las categorías (áreas y subcategorías)
   */
  async listCategories(
    params?: ListCategoriesParams
  ): Promise<APIResponse<CategoriesListResponse> | APIError> {
    const queryParams = new URLSearchParams();
    
    if (params?.type) queryParams.set('type', params.type);
    if (params?.group) queryParams.set('group', params.group);
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    const endpoint = `/api/admin/categories${query ? `?${query}` : ''}`;

    const result = await this.request<CategoriesListResponse>(endpoint);
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<CategoriesListResponse> | APIError;
  }

  /**
   * Obtiene el detalle completo de una categoría
   */
  async getCategory(id: string): Promise<APIResponse<APICategoryResponse> | APIError> {
    const result = await this.request<APICategoryResponse>(`/api/admin/categories/${id}`);
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APICategoryResponse> | APIError;
  }

  /**
   * Crea una nueva categoría o área
   */
  async createCategory(
    data: CreateCategoryData
  ): Promise<APIResponse<APICategoryResponse> | APIError> {
    const result = await this.request<APICategoryResponse>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APICategoryResponse> | APIError;
  }

  /**
   * Actualiza una categoría
   */
  async updateCategory(
    id: string,
    data: UpdateCategoryData
  ): Promise<APIResponse<APICategoryResponse> | APIError> {
    const result = await this.request<APICategoryResponse>(`/api/admin/categories/${id}`, {
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
    return result as APIResponse<APICategoryResponse> | APIError;
  }

  /**
   * Elimina o desactiva una categoría
   */
  async deleteCategory(
    id: string,
    options?: { force?: boolean; deactivate?: boolean }
  ): Promise<APIResponse<{ id: string; active?: boolean }> | APIError> {
    const queryParams = new URLSearchParams();
    if (options?.force) queryParams.set('force', 'true');
    if (options?.deactivate) queryParams.set('deactivate', 'true');

    const query = queryParams.toString();
    const endpoint = `/api/admin/categories/${id}${query ? `?${query}` : ''}`;

    const result = await this.request<{ id: string; active?: boolean }>(endpoint, {
      method: 'DELETE',
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<{ id: string; active?: boolean }> | APIError;
  }

  // ==================== BUG REPORTS ====================

  /**
   * Lista todos los bug reports con filtros y paginación
   */
  async listBugReports(
    params?: ListBugReportsParams
  ): Promise<PaginatedAPIResponse<APIBugReportResponse> | APIError> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.severity) queryParams.set('severity', params.severity);
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    const endpoint = `/api/admin/bug-reports${query ? `?${query}` : ''}`;

    const result = await this.request<APIBugReportResponse>(endpoint);
    if (result.success && !('pagination' in result)) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta paginada'
      };
    }
    return result as PaginatedAPIResponse<APIBugReportResponse> | APIError;
  }

  /**
   * Obtiene el detalle completo de un bug report
   */
  async getBugReport(id: string): Promise<APIResponse<APIBugReportResponse> | APIError> {
    const result = await this.request<APIBugReportResponse>(`/api/admin/bug-reports/${id}`);
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIBugReportResponse> | APIError;
  }

  // ==================== CERTIFICACIONES ====================

  /**
   * Lista todas las certificaciones con filtros y paginación
   */
  async listCertifications(
    params?: ListCertificationsParams
  ): Promise<PaginatedAPIResponse<APICertificationResponse> | APIError> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.professionalId) queryParams.set('professionalId', params.professionalId);

    const query = queryParams.toString();
    const endpoint = `/api/admin/certifications${query ? `?${query}` : ''}`;

    const result = await this.request<APICertificationResponse>(endpoint);
    if (result.success && !('pagination' in result)) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta paginada'
      };
    }
    return result as PaginatedAPIResponse<APICertificationResponse> | APIError;
  }

  /**
   * Actualiza el estado de una certificación (aprobar / rechazar / suspender)
   */
  async updateCertification(
    id: string,
    data: UpdateCertificationData
  ): Promise<APIResponse<APICertificationResponse> | APIError> {
    const result = await this.request<APICertificationResponse>(`/api/admin/certifications/${id}`, {
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
    return result as APIResponse<APICertificationResponse> | APIError;
  }

  /**
   * Elimina una certificación (casos excepcionales)
   */
  async deleteCertification(
    id: string
  ): Promise<APIResponse<{ id: string }> | APIError> {
    const result = await this.request<{ id: string }>(`/api/admin/certifications/${id}`, {
      method: 'DELETE',
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<{ id: string }> | APIError;
  }

  /**
   * Actualiza un bug report (cambiar estado, agregar notas, etc.)
   */
  async updateBugReport(
    id: string,
    data: UpdateBugReportData
  ): Promise<APIResponse<APIBugReportResponse> | APIError> {
    const result = await this.request<APIBugReportResponse>(`/api/admin/bug-reports/${id}`, {
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
    return result as APIResponse<APIBugReportResponse> | APIError;
  }
}

// Exportar instancia singleton
export const apiClient = new ServicesAPIClient();

// Exportar clase para testing o instancias personalizadas
export default ServicesAPIClient;

