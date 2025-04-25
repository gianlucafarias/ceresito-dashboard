"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar" // Usaremos Avatar para iniciales

// Interfaz para los datos de feedback de la API (reutilizable o definir aquí)
interface FeedbackData {
  id: number;
  nombre: string | null;
  calificacion: string;
  comentario: string | null;
  timestamp: string;
}

// Función para obtener iniciales
const getInitials = (name: string | null): string => {
  if (name) {
    const words = name.split(' ');
    const initials = words.map(word => word.charAt(0)).join('');
    return initials.toUpperCase();
  } 
  return "?"; // Fallback si no hay nombre
};

export function FeedbackComments() {
  const [comments, setComments] = React.useState<FeedbackData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = `http://localhost:3001/api/feedback`; // Asegúrate que la URL es correcta
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Error al obtener feedback: ${response.statusText}`);
        }
        const data: FeedbackData[] = await response.json();

        // Filtrar, ordenar y limitar comentarios
        const processedComments = data
          .filter(item => item.comentario && item.comentario.trim() !== "") // Solo con comentarios no vacíos
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Más recientes primero
          .slice(0, 15); // Limitar a los últimos 15 comentarios (puedes ajustar)

        setComments(processedComments);

      } catch (err) {
         if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Ocurrió un error desconocido");
        }
        console.error("Error fetching feedback comments:", err);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Card className="h-full flex flex-col"> {/* Asegurar que use toda la altura */} 
      <CardHeader>
        <CardTitle>Últimos Comentarios</CardTitle>
        <CardDescription>Comentarios recientes del feedback.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden"> {/* Permitir que ScrollArea crezca */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-destructive">
            Error: {error}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No hay comentarios recientes.
          </div>
        ) : (
          <ScrollArea className="h-full pr-4"> {/* Ajustar altura y padding si es necesario */} 
            <div className="space-y-6"> {/* Espacio entre comentarios */} 
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(comment.nombre)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">
                        {comment.nombre || "Anónimo"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {comment.comentario}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
} 