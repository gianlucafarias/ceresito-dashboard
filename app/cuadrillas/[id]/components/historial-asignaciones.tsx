"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar, Search, ChevronDown, Clock, CheckCircle, AlertTriangle, 
  Calendar as CalendarIcon, Filter, Download 
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ReclamoHistorial {
  id: number;
  reclamoId: number;
  detalle: string;
  ubicacion: string;
  barrio: string;
  fechaAsignacion: string;
  fechaInicio: string;
  fechaCompletado: string;
  tipo: string;
}

interface HistorialAsignacionesProps {
  cuadrillaId: string;
}

export function HistorialAsignaciones({ cuadrillaId }: HistorialAsignacionesProps) {
  const [historial, setHistorial] = useState<ReclamoHistorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroFecha, setFiltroFecha] = useState<Date | undefined>(undefined);
  const [busqueda, setBusqueda] = useState<string>("");
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const elementosPorPagina = 5;
  
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        // Simulamos una llamada a la API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(`/api/cuadrillas/${cuadrillaId}/historial`);
        
        if (response.ok) {
          const data = await response.json();
          setHistorial(data);
        } else {
          // Si la API no está implementada, usamos datos ficticios
          const mockData: ReclamoHistorial[] = Array.from({ length: 15 }, (_, i) => ({
            id: i + 1,
            reclamoId: 1000 + i,
            detalle: `Reclamo completado #${i + 1}`,
            ubicacion: `Calle ${Math.floor(Math.random() * 100) + 1}`,
            barrio: [`Centro`, `Norte`, `Sur`, `Este`, `Oeste`][Math.floor(Math.random() * 5)],
            fechaAsignacion: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
            fechaInicio: new Date(Date.now() - (Math.random() * 20 * 24 * 60 * 60 * 1000)).toISOString(),
            fechaCompletado: new Date(Date.now() - (Math.random() * 10 * 24 * 60 * 60 * 1000)).toISOString(),
            tipo: [`Luminarias`, `Arreglos`, `Arboles`, `Animales`, `Higiene Urbana`][Math.floor(Math.random() * 5)]
          }));
          
          setHistorial(mockData);
        }
      } catch (error) {
        console.error("Error al cargar historial:", error);
        // Datos ficticios en caso de error
        setHistorial([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistorial();
  }, [cuadrillaId]);
  
  // Filtrar historial
  const historialFiltrado = historial.filter(item => {
    // Filtro por tipo
    if (filtroTipo && item.tipo !== filtroTipo) return false;
    
    // Filtro por fecha
    if (filtroFecha) {
      const fecha = new Date(item.fechaCompletado);
      if (
        fecha.getDate() !== filtroFecha.getDate() ||
        fecha.getMonth() !== filtroFecha.getMonth() ||
        fecha.getFullYear() !== filtroFecha.getFullYear()
      ) {
        return false;
      }
    }
    
    // Filtro por búsqueda
    if (busqueda) {
      const terminoBusqueda = busqueda.toLowerCase();
      return (
        item.detalle.toLowerCase().includes(terminoBusqueda) ||
        item.ubicacion.toLowerCase().includes(terminoBusqueda) ||
        item.barrio.toLowerCase().includes(terminoBusqueda)
      );
    }
    
    return true;
  });
  
  // Paginar resultados
  const totalPaginas = Math.ceil(historialFiltrado.length / elementosPorPagina);
  const historialPaginado = historialFiltrado.slice(
    (paginaActual - 1) * elementosPorPagina,
    paginaActual * elementosPorPagina
  );
  
  // Funciones de paginación
  const irAPagina = (pagina: number) => {
    setPaginaActual(Math.max(1, Math.min(pagina, totalPaginas)));
  };
  
  // Resetear filtros
  const resetearFiltros = () => {
    setFiltroTipo("");
    setFiltroFecha(undefined);
    setBusqueda("");
    setPaginaActual(1);
  };
  
  // Exportar a CSV
  const exportarCSV = () => {
    // Crear cabeceras CSV
    const cabeceras = [
      "ID Reclamo", 
      "Detalle", 
      "Ubicación", 
      "Barrio", 
      "Tipo", 
      "Fecha Asignación", 
      "Fecha Inicio", 
      "Fecha Completado"
    ].join(",");
    
    // Crear filas CSV
    const filas = historialFiltrado.map(item => [
      item.reclamoId,
      `"${item.detalle.replace(/"/g, '""')}"`, // Escapar comillas
      `"${item.ubicacion.replace(/"/g, '""')}"`,
      `"${item.barrio.replace(/"/g, '""')}"`,
      `"${item.tipo.replace(/"/g, '""')}"`,
      format(new Date(item.fechaAsignacion), "dd/MM/yyyy"),
      format(new Date(item.fechaInicio), "dd/MM/yyyy"),
      format(new Date(item.fechaCompletado), "dd/MM/yyyy")
    ].join(","));
    
    // Combinar cabeceras y filas
    const csv = [cabeceras, ...filas].join("\n");
    
    // Crear blob y descargar
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `historial_cuadrilla_${cuadrillaId}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const tiposUnicos = Array.from(new Set(historial.map(item => item.tipo)));
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Historial de Asignaciones</CardTitle>
        <CardDescription>
          Reclamos completados por esta cuadrilla
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Barra de filtros */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-8" 
              placeholder="Buscar por ubicación o detalle..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{filtroTipo || "Tipo"}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los tipos</SelectItem>
              {tiposUnicos.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-[160px] flex items-center justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filtroFecha ? (
                  format(filtroFecha, "d 'de' MMMM, yyyy", { locale: es })
                ) : (
                  <span>Fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={filtroFecha}
                onSelect={setFiltroFecha}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" onClick={resetearFiltros}>Resetear</Button>
          <Button variant="outline" onClick={exportarCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
        
        {/* Listado de historial */}
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p>Cargando historial...</p>
          </div>
        ) : historialPaginado.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p>No hay registros que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {historialPaginado.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-4 md:p-6">
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-lg">Reclamo #{item.reclamoId}</h3>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Completado
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.detalle}</p>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Ubicación: </span>
                        {item.ubicacion}
                      </div>
                      <div>
                        <span className="font-medium">Barrio: </span>
                        {item.barrio}
                      </div>
                      <div>
                        <span className="font-medium">Tipo: </span>
                        {item.tipo}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 md:p-6 md:w-[220px] flex flex-col justify-center">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium">Asignado</p>
                          <p className="text-xs">
                            {format(new Date(item.fechaAsignacion), "d/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-xs font-medium">Iniciado</p>
                          <p className="text-xs">
                            {format(new Date(item.fechaInicio), "d/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs font-medium">Completado</p>
                          <p className="text-xs">
                            {format(new Date(item.fechaCompletado), "d/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center space-x-2 py-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => irAPagina(paginaActual - 1)} 
              disabled={paginaActual === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                <Button
                  key={pagina}
                  variant={pagina === paginaActual ? "default" : "outline"}
                  size="sm"
                  onClick={() => irAPagina(pagina)}
                  className="w-8 h-8 p-0"
                >
                  {pagina}
                </Button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => irAPagina(paginaActual + 1)} 
              disabled={paginaActual === totalPaginas}
            >
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 