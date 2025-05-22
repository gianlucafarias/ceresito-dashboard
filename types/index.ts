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