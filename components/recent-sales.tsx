import { useEffect, useState, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

// Interfaz actualizada para Interaction
interface Interaction {
  id: number;
  phone: string;
  contact_name: string | null;
  lastInteraction: string; // Fecha como string ISO
  lastMessage: {
    answer: string;
    createdAt: string;
    conversation_id: string; // Añadido
  };
}

// Interfaz para la respuesta de la API de detalles
interface ConversationApiResponse {
  messages: any[]; // Deberías definir un tipo más específico para los mensajes si es posible
  totalMessages: number;
  currentPage: number;
  totalPages: number;
}

// Interfaz para las props de ConversationView
interface ConversationViewProps {
  details: {
    contactId: number;
    timestamp: string; // La referencia inicial ya no es estrictamente necesaria para la paginación, pero la mantenemos por si acaso
    conversationId: string | null;
  } | null;
}

const ConversationView = ({ details }: ConversationViewProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Estado para carga adicional
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); // Ref para el contenedor del chat
  const scrollHeightBeforeLoad = useRef<number>(0); // Para mantener la posición del scroll

  // Función para formatear mensajes (la lógica que ya teníamos)
  const formatMessages = useCallback((apiMessages: any[]) => {
    return apiMessages
      .map(msg => {
        let sender: 'user' | 'bot';
        if (msg.ref?.startsWith('cc')) {
          sender = 'user';
        } else if (msg.ref?.startsWith('ans')) {
          sender = 'bot';
        } else if (msg.keyword && !msg.ref?.startsWith('ans')) {
          sender = 'user';
        } else {
          sender = 'bot';
        }
        const answer = msg.answer || '';
        // Descomenta return null si quieres filtrar estos mensajes:
        // if (answer.startsWith('__capture_only_intended__') || 
        //     answer.startsWith('__call_action__') ||
        //     answer.startsWith('_event_voice_note__') ||
        //     answer === 'Estoy escuchando tu audio...') {
        //   return null;
        // }

        // NUEVO: Filtrar cualquier mensaje que comience con '__'
        if (answer.startsWith('__')) {
          return null; // Omitir este mensaje
        }

        return {
          id: msg.id,
          sender: sender,
          text: answer,
          timestamp: msg.createdAt
        };
      })
      .filter(msg => msg !== null && msg.text !== '');
  }, []);

  // Función para cargar más mensajes
  const loadMoreMessages = useCallback(async () => {
    if (!details || isLoadingMore || currentPage >= totalPages) {
      return;
    }

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    if (chatContainerRef.current) {
      scrollHeightBeforeLoad.current = chatContainerRef.current.scrollHeight;
    }

    const params = new URLSearchParams({
      contactId: details.contactId.toString(),
      page: nextPage.toString(),
      limit: '10'
    });

    const API_ENDPOINT = `https://api.ceres.gob.ar/api/api/conversation-details?${params.toString()}`;
    console.log(`Fetching MORE messages from: ${API_ENDPOINT}`);

    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) {
        throw new Error(`Error cargando más mensajes (status: ${response.status})`);
      }
      const data: ConversationApiResponse = await response.json();
      const newFormattedMessages = formatMessages(data.messages); // Usa la función memoizada

      setMessages(prevMessages => [...newFormattedMessages, ...prevMessages]);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);

    } catch (err: any) {
      console.error("Error fetching more messages:", err);
    } finally {
      setIsLoadingMore(false);
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
            const newScrollHeight = chatContainerRef.current.scrollHeight;
            chatContainerRef.current.scrollTop += newScrollHeight - scrollHeightBeforeLoad.current;
        }
      });
    }
  }, [details, isLoadingMore, currentPage, totalPages, formatMessages]);

  // Efecto para la carga inicial
  useEffect(() => {
    if (!details) return;

    const { contactId, conversationId } = details;
    setIsLoading(true);
    setError(null);
    setMessages([]);
    setCurrentPage(1); // Resetear página al cambiar de conversación
    setTotalPages(1);

    const params = new URLSearchParams({
      contactId: contactId.toString(),
      page: '1' // Siempre empezamos en la página 1
    });
    if (conversationId) {
      params.append('conversationId', conversationId);
    }

    const API_ENDPOINT = `https://api.ceres.gob.ar/api/api/conversation-details?${params.toString()}`;
    console.log(`Fetching initial conversation details from: ${API_ENDPOINT}`);

    fetch(API_ENDPOINT)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error al cargar la conversación (status: ${response.status})`);
        }
        return response.json();
      })
      .then((data: ConversationApiResponse) => {
        const formatted = formatMessages(data.messages);
        setMessages(formatted);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      })
      .catch(err => {
        console.error("Error fetching initial conversation:", err);
        setError(err.message || 'Error desconocido');
      })
      .finally(() => {
        setIsLoading(false);
        // Hacer scroll hasta el fondo después de la carga inicial
        requestAnimationFrame(() => { // Asegurar que el DOM esté listo
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        });
      });

  }, [details, formatMessages]);

  // Efecto para manejar el scroll
  useEffect(() => {
    const container = chatContainerRef.current;

    const handleScroll = () => {
      if (container) {
        console.log('[HANDLE_SCROLL] Scroll Top:', container.scrollTop, 'IsLoadingMore:', isLoadingMore, 'CurrentPage:', currentPage, 'TotalPages:', totalPages); // LOG DE DIAGNÓSTICO
        // Si el scroll está muy cerca de la parte superior (Aumentar umbral para prueba)
        if (container.scrollTop < 50 && !isLoadingMore && currentPage < totalPages) {
           console.log("[HANDLE_SCROLL] Threshold met! Attempting to load more..."); // LOG DE CONFIRMACIÓN
           loadMoreMessages();
        }
      }
    };

    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    // Limpieza al desmontar o cambiar la dependencia
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isLoadingMore, currentPage, totalPages, loadMoreMessages]);


  return (
    // Añadir la ref al contenedor y un estilo para permitir el scroll
    <div ref={chatContainerRef} className="mt-4 p-4 border rounded-md max-h-[500px] overflow-y-auto flex flex-col-reverse">
      {/* Contenido del chat (renderizado inverso) */}
      <div className="space-y-3">
        {/* Mensajes (ya están ordenados ASC) */} 
        {!isLoading && !error && messages.length > 0 && messages.map((msg) => (
           <div
              key={msg.id} // Asegúrate de que msg.id sea único incluso entre páginas
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-2 rounded-lg max-w-[70%] break-words ${ // break-words para texto largo
                  msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
        
         {/* Mostrar si no hay mensajes */} 
         {!isLoading && !error && messages.length === 0 && (
            <p className="text-center text-muted-foreground">No se encontraron mensajes.</p>
         )}

        {/* Mostrar error */}
        {error && <p className="text-red-500 text-center">Error: {error}</p>}
        
        {/* Indicador de carga inicial */} 
        {isLoading && <p className="text-center">Cargando conversación...</p>}
      </div>

      {/* Indicador de carga para scroll (arriba del contenido) */}
      {isLoadingMore && (
          <div className="text-center py-2">
            <p>Cargando mensajes anteriores...</p> 
            {/* Podrías poner un spinner aquí */}
          </div>
        )}
    </div>
  );
};

export function RecentSales() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Usaremos un objeto para guardar los detalles de la interacción seleccionada
  const [selectedInteractionDetails, setSelectedInteractionDetails] = useState<{
    contactId: number;
    timestamp: string;
    conversationId: string | null;
    displayName: string; // Para mostrar en el diálogo
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch('https://api.ceres.gob.ar/api/api/last-interactions')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al obtener las últimas interacciones');
        }
        return response.json();
      })
      .then((data: Interaction[]) => {
         // Ya no filtramos aquí, mostraremos todas las interacciones
         // const validData = data.filter(item => item.lastMessage?.conversation_id);
         // if (validData.length !== data.length) {
         //    console.warn("Algunas interacciones fueron filtradas por no tener lastMessage.conversation_id");
         // }
         // Usamos data directamente, limitado a 10
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

  const getInitials = (name: string | null, phone: string): string => {
    if (name) {
      const words = name.split(' ');
      const initials = words.map(word => word.charAt(0)).join('');
      return initials.toUpperCase();
    }
    return "#";
  };

  const truncateMessage = (message: string, maxLength = 50): string => {
    if (!message) return ""; // Manejar mensajes nulos o indefinidos
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength) + "...";
  };

  // Función para manejar el clic y abrir el diálogo
  // Ahora recibe toda la interacción para obtener los detalles necesarios
  const handleInteractionClick = (interaction: Interaction) => {
    // Asegurarse de que lastMessage y createdAt existan
    if (interaction.lastMessage?.createdAt) {
      setSelectedInteractionDetails({
        contactId: interaction.id, // Asumiendo que interaction.id es el contactId
        timestamp: interaction.lastMessage.createdAt,
        conversationId: interaction.lastMessage.conversation_id || null,
        displayName: interaction.contact_name || interaction.phone // Nombre para mostrar
      });
      setIsDialogOpen(true);
    } else {
      // No debería ocurrir si la lógica de renderizado es correcta, pero es bueno tenerlo
      console.warn("La interacción clickeada no tiene lastMessage o createdAt:", interaction);
      // Podríamos decidir no abrir el diálogo si falta información crucial
      // setIsDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ultimas Conversaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <div className="space-y-4">
            {isLoading ? (
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
              interactions.map((interaction) => {
                // La condición para ser clickeable es simplemente tener un lastMessage con fecha
                const isClickable = !!interaction.lastMessage?.createdAt;
                // const hasConversationId = !!interaction.lastMessage?.conversation_id;

                return (
                // Aplicar onClick y estilos de cursor/hover solo si es clickeable
                <div
                  key={interaction.id}
                  className={`flex items-center p-2 rounded-md ${
                    isClickable
                      ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'
                      : 'cursor-default'
                  }`}
                  // Pasamos toda la interacción al handler
                  onClick={isClickable ? () => handleInteractionClick(interaction) : undefined}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{getInitials(interaction.contact_name, interaction.phone)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1 flex-grow"> {/* Añadido flex-grow */}
                    <p className="text-sm font-medium leading-none">
                      {interaction.contact_name || interaction.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {truncateMessage(interaction.lastMessage?.answer)} {/* Añadido ? por seguridad */}
                    </p>
                  </div>
                  <div className="ml-auto text-sm text-muted-foreground pl-2"> {/* Añadido pl-2 */}
                    {formatDistanceToNow(new Date(interaction.lastInteraction), { addSuffix: true, locale: es })}
                  </div>
                </div>
               );
             })
            )}
          </div>

          {/* Contenido del Diálogo */}
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Historial de Conversación</DialogTitle>
              <DialogDescription>
                {/* Usar el displayName guardado en el estado */}
                Viendo la conversación con {selectedInteractionDetails?.displayName || 'Desconocido'}.
              </DialogDescription>
            </DialogHeader>
            {/* Pasar los detalles completos al componente ConversationView */}
            <ConversationView details={selectedInteractionDetails} />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}