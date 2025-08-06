import { Icons } from "@/components/icons";

export interface NavItem {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;


export interface Reclamo {
  id: string | number;
  fecha: string;
  nombre: string;
  reclamo: string;
  ubicacion: string;
  barrio: string;
  telefono: string;
  estado: string;
  detalle: string;
  prioridad: string | null;
  latitud: string;
  longitud: string;
  imagen?: string;
  cuadrillaId: number | null;
}

export interface Cuadrilla {
  id: number;
  nombre: string;
  telefono: string;
  disponible: boolean;
  ultimaAsignacion: string;
  limiteReclamosSimultaneos: number;
  reclamosAsignados: Reclamo[];
  tipo: Array<{ id: number; nombre: string }>;
}

export interface SearchParams {
  [key: string]: string | string[] | undefined
}

export interface Option {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  withCount?: boolean
}

export interface DataTableFilterField<TData> {
  label: string
  value: keyof TData
  placeholder?: string
  options?: Option[]
}

export interface DataTableFilterOption<TData> {
  id: string
  label: string
  value: keyof TData
  options: Option[]
  filterValues?: string[]
  filterOperator?: string
  isMulti?: boolean
}

// Tipos para Encuestas Vecinales
export interface EncuestaVecinal {
  id: number;
  dni: string;
  barrio: string;
  obrasUrgentes: string[];
  obrasUrgentesOtro: string;
  serviciosMejorar: string[];
  serviciosMejorarOtro: string;
  espacioMejorar: string;
  propuesta: string;
  quiereContacto: boolean;
  nombreCompleto: string;
  telefono: string;
  email: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  estado: string;
}

export interface EncuestasResponse {
  success: boolean;
  data: {
    encuestas: EncuestaVecinal[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface EstadisticaItem {
  nombre: string;
  cantidad: number;
  porcentaje?: number;
}

export interface ComentarioOtro {
  comentario: string;
  encuestaId: number;
}

export interface EstadisticasEncuestas {
  success: boolean;
  data: {
    totalEncuestas: number;
    totalBarrios: number;
    encuestasPorBarrio: EstadisticaItem[];
    obrasUrgentesTop: EstadisticaItem[];
    serviciosMejorarTop: EstadisticaItem[];
    participacionContacto: {
      quieren: number;
      noQuieren: number;
    };
    otrosComentarios: {
      obrasUrgentesOtro: ComentarioOtro[];
      serviciosMejorarOtro: ComentarioOtro[];
      espaciosYPropuestas: {
        espacioMejorar: ComentarioOtro[];
        propuestas: ComentarioOtro[];
      };
    };
    ultimasEncuestas: EncuestaVecinal[];
  };
}

// Tipos auxiliares para forms y validaciones
export interface CreateEncuestaSchema {
  dni: string;
  barrio: string;
  obrasUrgentes: string[];
  obrasUrgentesOtro?: string;
  serviciosMejorar: string[];
  serviciosMejorarOtro?: string;
  espacioMejorar?: string;
  propuesta?: string;
  quiereContacto: boolean;
  nombreCompleto?: string;
  telefono?: string;
  email?: string;
}

export interface UpdateEncuestaSchema extends Partial<CreateEncuestaSchema> {
  id: number;
}