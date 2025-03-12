"use client"
import React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, MessageCircle, ArrowLeft, Users, Settings } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CuadrillaStats } from './components/cuadrilla-stats';
import { HistorialAsignaciones } from './components/historial-asignaciones';
import { GestionarDisponibilidad } from './components/gestionar-disponibilidad';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';

interface CuadrillaCompleta {
  id: number;
  nombre: string;
  tipo: Array<{ id: number; nombre: string }>;
  disponibilidad: boolean;
  telefono: string;
  limiteReclamosSimultaneos: number;
  ultimaAsignacion: string | null;
  reclamosActivos: number;
}

// Interfaz para los reclamos
interface Reclamo {
  id: number;
  reclamoId: number;
  estado: string;
  detalle: string;
  ubicacion: string;
  barrio: string;
  fechaAsignacion: string;
  fechaInicio?: string;
  fechaCompletado?: string;
  cuadrillaId?: number;
}

const CuadrillaPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cuadrilla, setCuadrilla] = useState<CuadrillaCompleta | null>(null);
  const [reclamosAsignados, setReclamosAsignados] = useState<Reclamo[]>([]);
  const [reclamosEnProceso, setReclamosEnProceso] = useState<Reclamo[]>([]);
  const [expandedReclamo, setExpandedReclamo] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      const fetchCuadrilla = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/cuadrillas/${id}`);
          
          if (response.ok) {
            const data = await response.json();
            setCuadrilla(data);
          } else {
            // Datos ficticios si la API no está implementada
            setCuadrilla({
              id: parseInt(id as string),
              nombre: `Cuadrilla ${id}`,
              tipo: [
                { id: 1, nombre: 'Luminarias' },
                { id: 2, nombre: 'Arreglos' }
              ],
              disponibilidad: true,
              telefono: '123456789',
              limiteReclamosSimultaneos: 5,
              ultimaAsignacion: new Date().toISOString(),
              reclamosActivos: 3
            });
          }
        } catch (error) {
          console.error('Error al obtener datos de la cuadrilla:', error);
        } finally {
          setLoading(false);
        }
      };

      const fetchReclamos = async () => {
        try {
          const response = await fetch(`/api/registro-reclamo?cuadrillaId=${id}`);
          if (response.ok) {
            const data = await response.json();
            setReclamosAsignados(data.filter((reclamo: Reclamo) => reclamo.estado === 'ASIGNADO'));
            setReclamosEnProceso(data.filter((reclamo: Reclamo) => reclamo.estado === 'EN_PROCESO'));
          } else {
            // Datos ficticios si la API no está implementada
            setReclamosAsignados([]);
            setReclamosEnProceso([]);
          }
        } catch (error) {
          console.error('Error al obtener los reclamos:', error);
        }
      };

      fetchCuadrilla();
      fetchReclamos();
    }
  }, [id]);

  const handleMarkAsInProcess = async (reclamoId: number) => {
    try {
      const response = await fetch(`/api/registro-reclamo/${reclamoId}/en-proceso`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'EN_PROCESO' }),
      });

      if (response.ok) {
        const updatedReclamo = reclamosAsignados.find(reclamo => reclamo.id === reclamoId);
        if (updatedReclamo) {
          setReclamosAsignados((prevReclamos) =>
            prevReclamos.filter(reclamo => reclamo.id !== reclamoId)
          );
          setReclamosEnProceso((prevReclamos) =>
            [...prevReclamos, { ...updatedReclamo, estado: 'EN_PROCESO' }]
          );
        }
      } else {
        console.error('Error al marcar el reclamo como en proceso');
      }
    } catch (error) {
      console.error('Error al marcar el reclamo como en proceso:', error);
    }
  };

  const handleMarkAsCompleted = async (reclamoId: number) => {
    try {
      const response = await fetch(`/api/registro-reclamo/${reclamoId}/completar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'COMPLETADO' }),
      });

      if (response.ok) {
        setReclamosEnProceso((prevReclamos) =>
          prevReclamos.filter(reclamo => reclamo.id !== reclamoId)
        );
      } else {
        console.error('Error al marcar el reclamo como completado');
      }
    } catch (error) {
      console.error('Error al marcar el reclamo como completado:', error);
    }
  };

  const toggleReclamoDetails = (reclamoId: number) => {
    setExpandedReclamo(expandedReclamo === reclamoId ? null : reclamoId);
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full p-4 md:p-8">
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Cargando detalles de la cuadrilla...</h1>
        </div>
      </div>
    );
  }

  if (!cuadrilla) {
    return (
      <div className="flex flex-col w-full p-4 md:p-8">
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Cuadrilla no encontrada</h1>
        </div>
        <p>No se encontró información para esta cuadrilla.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full p-4 md:p-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => router.push('/cuadrillas')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{cuadrilla.nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="outline" 
                className={`${cuadrilla.disponibilidad ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {cuadrilla.disponibilidad ? 'Disponible' : 'No disponible'}
              </Badge>
              {cuadrilla.tipo.map(tipo => (
                <Badge key={tipo.id} variant="secondary">{tipo.nombre}</Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/cuadrillas/${id}/editar`)}>
            <Settings className="h-4 w-4 mr-2" />
            Editar Cuadrilla
          </Button>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {/* Estadísticas y Gestión */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <CuadrillaStats cuadrillaId={id as string} />
        </div>
        <div>
          <GestionarDisponibilidad cuadrillaId={id as string} />
        </div>
      </div>
      
      {/* Tabs de Reclamos y Historial */}
      <Tabs defaultValue="activos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activos" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Reclamos Activos ({reclamosAsignados.length + reclamosEnProceso.length})
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>
        
        {/* Pestaña de Reclamos Activos */}
        <TabsContent value="activos" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Reclamos Asignados */}
            <Card>
              <CardHeader>
                <CardTitle>Reclamos Asignados</CardTitle>
                <CardDescription>Pendientes de iniciar trabajo ({reclamosAsignados.length})</CardDescription>
              </CardHeader>
              <CardContent>
                {reclamosAsignados.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay reclamos asignados</p>
                ) : (
                  <div className="space-y-4">
                    {reclamosAsignados.map(reclamo => (
                      <Card key={reclamo.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">Reclamo #{reclamo.reclamoId}</h3>
                              <p className="text-sm text-muted-foreground">{reclamo.detalle}</p>
                              
                              {expandedReclamo === reclamo.id && (
                                <div className="mt-4 space-y-2">
                                  <p className="text-sm"><span className="font-medium">Ubicación:</span> {reclamo.ubicacion}</p>
                                  <p className="text-sm"><span className="font-medium">Barrio:</span> {reclamo.barrio}</p>
                                  <p className="text-sm"><span className="font-medium">Fecha asignación:</span> {new Date(reclamo.fechaAsignacion).toLocaleDateString()}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleReclamoDetails(reclamo.id)}
                              >
                                {expandedReclamo === reclamo.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsInProcess(reclamo.id)}
                            >
                              Iniciar Trabajo
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Reclamos En Proceso */}
            <Card>
              <CardHeader>
                <CardTitle>Reclamos En Proceso</CardTitle>
                <CardDescription>Actualmente en ejecución ({reclamosEnProceso.length})</CardDescription>
              </CardHeader>
              <CardContent>
                {reclamosEnProceso.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay reclamos en proceso</p>
                ) : (
                  <div className="space-y-4">
                    {reclamosEnProceso.map(reclamo => (
                      <Card key={reclamo.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">Reclamo #{reclamo.reclamoId}</h3>
                              <p className="text-sm text-muted-foreground">{reclamo.detalle}</p>
                              
                              {expandedReclamo === reclamo.id && (
                                <div className="mt-4 space-y-2">
                                  <p className="text-sm"><span className="font-medium">Ubicación:</span> {reclamo.ubicacion}</p>
                                  <p className="text-sm"><span className="font-medium">Barrio:</span> {reclamo.barrio}</p>
                                  <p className="text-sm"><span className="font-medium">Fecha inicio:</span> {reclamo.fechaInicio ? new Date(reclamo.fechaInicio).toLocaleDateString() : 'No disponible'}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleReclamoDetails(reclamo.id)}
                              >
                                {expandedReclamo === reclamo.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsCompleted(reclamo.id)}
                            >
                              Marcar como Completado
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Pestaña de Historial */}
        <TabsContent value="historial" className="mt-6">
          <HistorialAsignaciones cuadrillaId={id as string} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CuadrillaPage;
