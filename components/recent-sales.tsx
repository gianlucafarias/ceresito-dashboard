import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RecentSales() {
  const [conversaciones, setConversaciones] = useState([]);

  useEffect(() => {
    fetch('https://api.ceres.gob.ar/api/api/conversaciones')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al obtener los datos de conversaciones');
        }
        return response.json();
      })
      .then(data => {
        // Ordenar las conversaciones de manera descendente por fecha y hora
        const sortedConversaciones = data.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
  
        // Seleccionar solo las primeras 6 conversaciones
        const recentConversaciones = sortedConversaciones.slice(0, 6);
  
        // Actualizar el estado con las 6 últimas conversaciones
        setConversaciones(recentConversaciones);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  // Función para formatear la fecha y la hora
  const formatDateTime = (dateTimeString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    const dateTime = new Date(dateTimeString);
    return dateTime.toLocaleDateString('es-ES', options);
  };

  const getInitials = (name) => {
    const words = name.split(' ');
    const initials = words.map(word => word.charAt(0)).join('');
    return initials.toUpperCase();
  };

  return (
    <div className="space-y-8">
      {conversaciones.map((conversacion, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`/avatars/${index + 1}.png`} alt="Avatar" />
            <AvatarFallback>{getInitials(conversacion.nombre)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{conversacion.nombre}</p>
            <p className="text-sm text-muted-foreground">{formatDateTime(conversacion.fecha_hora)}</p>
          </div>
          <div className="ml-auto font-medium">{conversacion.duracion_minutos} min</div>
        </div>
      ))}
    </div>
  );
}