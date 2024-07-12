"use client"
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge"; // Importar el componente Badge
import { Button } from '@/components/ui/button';

const CuadrillaPage = () => {
  const { id } = useParams();
  const [reclamosAsignados, setReclamosAsignados] = useState([]);
  const [reclamosEnProceso, setReclamosEnProceso] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [expandedReclamo, setExpandedReclamo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchReclamos = async () => {
        try {
          const response = await fetch(`/api/registro-reclamo?cuadrillaId=${id}`);
          if (response.ok) {
            const data = await response.json();
            setReclamosAsignados(data.filter(reclamo => reclamo.estado === 'ASIGNADO'));
            setReclamosEnProceso(data.filter(reclamo => reclamo.estado === 'EN_PROCESO'));
            setHistorial(data.filter(reclamo => reclamo.estado === 'COMPLETADO'));
          } else {
            console.error('Error al obtener los reclamos asignados');
          }
        } catch (error) {
          console.error('Error al obtener los reclamos asignados:', error);
        }
      };

      const fetchMensajes = async () => {
        try {
          const response = await fetch(`/api/cuadrillas/${id}/mensajes`);
          if (response.ok) {
            const data = await response.json();
            setMensajes(data);
          } else {
            console.error('Error al obtener los mensajes');
          }
        } catch (error) {
          console.error('Error al obtener los mensajes:', error);
        }
      };

      fetchReclamos();
      fetchMensajes();
    }
  }, [id]);

  const handleMarkAsInProcess = async (reclamoId) => {
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
        setReclamosAsignados((prevReclamos) =>
          prevReclamos.filter(reclamo => reclamo.id !== reclamoId)
        );
        setReclamosEnProceso((prevReclamos) =>
          [...prevReclamos, { ...updatedReclamo, estado: 'EN_PROCESO' }]
        );
      } else {
        console.error('Error al marcar el reclamo como en proceso');
      }
    } catch (error) {
      console.error('Error al marcar el reclamo como en proceso:', error);
    }
  };

  const handleMarkAsCompleted = async (reclamoId) => {
    try {
      const response = await fetch(`/api/registro-reclamo/${reclamoId}/completar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'COMPLETADO' }),
      });

      if (response.ok) {
        const updatedReclamo = reclamosEnProceso.find(reclamo => reclamo.id === reclamoId);
        setReclamosEnProceso((prevReclamos) =>
          prevReclamos.filter(reclamo => reclamo.id !== reclamoId)
        );
        setHistorial((prevHistorial) => [updatedReclamo, ...prevHistorial]);
      } else {
        console.error('Error al marcar el reclamo como completado');
      }
    } catch (error) {
      console.error('Error al marcar el reclamo como completado:', error);
    }
  };

  const toggleReclamoDetails = (reclamoId) => {
    setExpandedReclamo(expandedReclamo === reclamoId ? null : reclamoId);
  };

  const handleNuevoMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    try {
      const response = await fetch(`/api/cuadrillas/${id}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contenido: nuevoMensaje,
          remitente: 'Cuadrilla', // Asumiendo que los mensajes de la cuadrilla tienen el remitente "Cuadrilla"
        }),
      });

      if (response.ok) {
        const mensaje = await response.json();
        setMensajes((prevMensajes) => [...prevMensajes, mensaje]);
        setNuevoMensaje('');
      } else {
        console.error('Error al enviar el mensaje');
      }
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
    }
  };

  const getProgress = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return '10%';
      case 'ASIGNADO':
        return '35%';
      case 'EN_PROCESO':
        return '70%';
      case 'COMPLETADO':
        return '100%';
      default:
        return '0%';
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-900 text-white py-4 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cuadrilla de trabajo Nº {id}</h1>
        <div className="flex items-center space-x-4">
          <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded">Perfil</button>
          <button
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            Chat <MessageCircle className="inline-block ml-2" />
          </button>
        </div>
      </header>
      <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Reclamos Asignados</h2>
          {reclamosAsignados.length === 0 ? (
            <p className="text-center text-gray-500">No hay reclamos registrados.</p>
          ) : (
            reclamosAsignados.map((reclamo) => (
              <div key={reclamo.id} className="flex flex-col gap-6 p-6 md:p-8 lg:p-10 border-b last:border-b-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold">Reclamo #{reclamo.reclamoId}</h1>
                    <div className="text-sm text-gray-500">{reclamo.reclamo}</div>
                    <div className="text-sm text-gray-500">{reclamo.direccion}</div>
                    <div className="text-sm text-gray-500">{new Date(reclamo.fechaRegistro).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{reclamo.estado}</Badge>
                    <button onClick={() => toggleReclamoDetails(reclamo.id)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded">
                      {expandedReclamo === reclamo.id ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  </div>
                </div>
                {expandedReclamo === reclamo.id && (
                  <>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Detalles</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Categoría</span>
                          <span className="text-base font-medium">{reclamo.reclamo}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Prioridad</span>
                          <span className="text-base font-medium">{reclamo.prioridad || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Asignado a</span>
                          <span className="text-base font-medium">Cuadrilla N° 00{reclamo.cuadrillaId}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</span>
                          <span className="text-base font-medium">{reclamo.detalle}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {reclamo.estado === 'ASIGNADO' && (
                        <Button
                          onClick={() => handleMarkAsInProcess(reclamo.id)}
                        >
                          Aceptar Reclamo
                        </Button>
                      )}
                      {reclamo.estado === 'EN_PROCESO' && (
                        <button
                          onClick={() => handleMarkAsCompleted(reclamo.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                        >
                          Marcar como Completado
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-4 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Progreso</span>
                      </div>
                      <div className="relative h-4 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                        <div className="absolute left-0 top-0 h-full rounded-full bg-primary" style={{ width: getProgress(reclamo.estado) }} />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Pendiente</span>
                        <span>Asignado</span>
                        <span>En Proceso</span>
                        <span>Solucionado</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}

          <h2 className="text-xl font-bold mt-8 mb-4">Reclamos En Proceso</h2>
          {reclamosEnProceso.length === 0 ? (
            <p className="text-center text-gray-500">No hay reclamos registrados.</p>
          ) : (
            reclamosEnProceso.map((reclamo) => (
              <div key={reclamo.id} className="flex flex-col gap-6 p-6 md:p-8 lg:p-10 border-b last:border-b-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold">Reclamo #{reclamo.reclamoId}</h1>
                    <div className="text-sm text-gray-500">{reclamo.reclamo}</div>
                    <div className="text-sm text-gray-500">{reclamo.direccion}</div>
                    <div className="text-sm text-gray-500">{new Date(reclamo.fechaRegistro).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">{reclamo.estado}</Badge>
                    <button onClick={() => toggleReclamoDetails(reclamo.id)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded">
                      {expandedReclamo === reclamo.id ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  </div>
                </div>
                {expandedReclamo === reclamo.id && (
                  <>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Detalles</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Categoría</span>
                          <span className="text-base font-medium">{reclamo.reclamo}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Prioridad</span>
                          <span className="text-base font-medium">{reclamo.prioridad || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Asignado a</span>
                          <span className="text-base font-medium">Juan Pérez</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</span>
                          <span className="text-base font-medium">{reclamo.detalle}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {reclamo.estado === 'EN_PROCESO' && (
                        <button
                          onClick={() => handleMarkAsCompleted(reclamo.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                        >
                          Marcar como Completado
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-4 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Progreso</span>
                      </div>
                      <div className="relative h-4 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                        <div className="absolute left-0 top-0 h-full rounded-full bg-primary" style={{ width: getProgress(reclamo.estado) }} />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Pendiente</span>
                        <span>Asignado</span>
                        <span>En Proceso</span>
                        <span>Solucionado</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Historial de Reclamos</h2>
            {historial.length === 0 ? (
              <p className="text-center text-gray-500">No hay reclamos registrados.</p>
            ) : (
              <div className="space-y-4">
                {historial.map((reclamo) => (
                  <div key={reclamo.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{reclamo.reclamo}</p>
                      <p>{reclamo.direccion}</p>
                    </div>
                    <div>
                      <p className="text-green-500 font-bold">Completado</p>
                      <p className="text-gray-500">{new Date(reclamo.fechaSolucion).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {isChatOpen && (
        <div className="fixed bottom-0 right-0 bg-white rounded-lg shadow-lg p-4 m-6 w-full max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Chat</h2>
            <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-gray-700">
              Cerrar
            </button>
          </div>
          <div className="mb-4 max-h-64 overflow-y-auto">
            {mensajes.map((mensaje) => (
              <div key={mensaje.id} className={`rounded-lg p-4 mb-2 ${mensaje.remitente === 'Cuadrilla' ? 'bg-blue-200' : 'bg-gray-200'}`}>
                <p>{mensaje.contenido}</p>
                <p className="text-right text-gray-500">{mensaje.remitente}</p>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              className="flex-1 bg-gray-200 rounded-l-lg px-4 py-2 focus:outline-none"
              placeholder="Escribe un mensaje..."
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
            />
            <button
              onClick={handleNuevoMensaje}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuadrillaPage;
