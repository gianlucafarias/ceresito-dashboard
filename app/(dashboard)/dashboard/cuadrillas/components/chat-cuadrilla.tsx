"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Mensaje {
    id: number;
    contenido: string;
    remitente: string;
  }
  


const ChatPage = () => {
  const { id } = useParams();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  useEffect(() => {
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

    fetchMensajes();
  }, [id]);

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
          remitente: 'Usuario', // Cambia esto según sea necesario
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

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-900 text-white py-4 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat de la Cuadrilla #{id}</h1>
      </header>
      <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">Chat</h2>
          <div className="mb-4">
            {mensajes.map((mensaje) => (
              <div key={mensaje.id} className={`rounded-lg p-4 mb-2 ${mensaje.remitente === 'Cuadrilla' ? 'bg-blue-200' : 'bg-gray-200'}`}>
                <p>{mensaje.contenido}</p>
                <p className="text-right text-gray-500">{mensaje.remitente}</p>
              </div>
            ))}
          </div>
          <div className="flex">
            <Textarea
              className="flex-1 bg-gray-200 rounded-l-lg px-4 py-2 focus:outline-none"
              placeholder="Escribe tu mensaje aquí..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
            />
            <Button onClick={handleNuevoMensaje} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg">
              Enviar
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;