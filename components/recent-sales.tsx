import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from './ui/card';
import { CardContent, CardTitle } from './ui/card';
import { CardHeader } from './ui/card';

// Interfaz para el tipo de datos esperado de la API /last-interactions
interface Interaction {
  id: number;
  phone: string;
  contact_name: string | null;
  lastInteraction: string; // Fecha como string ISO
  lastMessage: {
    answer: string;
    createdAt: string;
  };
}

export function RecentSales() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch('https://api.ceres.gob.ar/api/api/last-interactions') // Cambiar endpoint
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al obtener las últimas interacciones');
        }
        return response.json();
      })
      .then((data: Interaction[]) => {
        // Los datos ya deberían venir ordenados por la API, si no, ordenar aquí:
        // data.sort((a, b) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime());
        
        // Limitar a las últimas 10 interacciones
        setInteractions(data.slice(0, 10)); 
      })
      .catch(error => {
        console.error(error);
        setError(error.message || "Error desconocido");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Función para obtener iniciales (si no hay nombre, usar #)
  const getInitials = (name: string | null, phone: string): string => {
    if (name) {
      const words = name.split(' ');
      const initials = words.map(word => word.charAt(0)).join('');
      return initials.toUpperCase();
    } 
    // Si no hay nombre, quizás usar los últimos dígitos del teléfono o un símbolo?
    return "#"; // Placeholder simple
  };

  // Truncar mensaje largo
  const truncateMessage = (message: string, maxLength = 50): string => {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength) + "...";
  };

  return (
    <Card>
    <CardHeader>
      <CardTitle>Ultimas Conversaciones</CardTitle>
    </CardHeader>
    <CardContent>
    <div className="space-y-4"> {/* Revertir a solo space-y-4 para arreglar alineación de fecha */}
      {isLoading ? (
        // Mostrar skeletons mientras carga
        Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))
      ) : error ? (
        <p className="text-sm text-destructive">Error: {error}</p>
      ) : interactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay interacciones recientes.</p>
      ) : (
        interactions.map((interaction) => (
          <div key={interaction.id} className="flex items-center">
            <Avatar className="h-9 w-9">
              {/* Podríamos intentar generar un avatar basado en el número/nombre */}
              {/* <AvatarImage src={`/api/avatar/${interaction.phone}`} alt="Avatar" /> */}
              <AvatarFallback>{getInitials(interaction.contact_name, interaction.phone)}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">
                {interaction.contact_name || interaction.phone} {/* Mostrar nombre o teléfono */}
              </p>
              <p className="text-sm text-muted-foreground">
                {truncateMessage(interaction.lastMessage.answer)} {/* Mostrar último mensaje truncado */}
              </p>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              {/* Formatear fecha relativa */}
              {formatDistanceToNow(new Date(interaction.lastInteraction), { addSuffix: true, locale: es })}
            </div>
          </div>
        ))
      )}
    </div>
    </CardContent>
    </Card>
  );
}