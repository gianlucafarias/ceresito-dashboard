"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChatMessage } from "@/types/contact-detail"; // Usamos el tipo ChatMessage
import { Skeleton } from "@/components/ui/skeleton"; // Podría ser útil para un estado de carga de mensajes individuales

// Interfaz para la respuesta de la API de detalles de conversación (mensajes)
interface ConversationMessagesApiResponse {
  messages: any[]; // Mantener any[] por ahora, ya que la estructura interna no está completamente definida aquí
  totalMessages: number;
  currentPage: number;
  totalPages: number;
  // Podrías tener más campos como contact_name, etc., si la API los devuelve.
}

// Interfaz para las props de ConversationView
export interface ConversationViewProps {
  details: {
    contactId: number;
    conversationId: string | null; // Puede ser nulo si se cargan los más recientes por contactId
    // timestamp: string; // Ya no es estrictamente necesario para la lógica actual de este componente
  } | null;
  // Opcional: un nombre para mostrar en el encabezado, si se pasa.
  // displayName?: string; 
}

export const ConversationView = ({ details }: ConversationViewProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollHeightBeforeLoad = useRef<number>(0);

  const formatMessages = useCallback((apiMessages: any[]): ChatMessage[] => {
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
        if (answer.startsWith('__')) {
          return null;
        }

        return {
          id: msg.id, // Asegúrate que este id sea único para la key de React
          sender: sender,
          text: answer,
          timestamp: msg.createdAt
        };
      })
      .filter((msg): msg is ChatMessage => msg !== null && msg.text !== ''); // Type guard
  }, []);

  const fetchConversationMessages = useCallback(async (page: number, contactId: number, convId: string | null) => {
    const params = new URLSearchParams({
      contactId: contactId.toString(),
      page: page.toString(),
      limit: '10' // O el límite que prefieras
    });
    if (convId) {
      params.append('conversationId', convId);
    }

    const API_ENDPOINT = `https://api.ceres.gob.ar/api/api/conversation-details?${params.toString()}`;
    // console.log(`Fetching messages from: ${API_ENDPOINT}`);

    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Error cargando mensajes (status: ${response.status})`);
    }
    return response.json() as Promise<ConversationMessagesApiResponse>;
  }, []);


  const loadMoreMessages = useCallback(async () => {
    if (!details || isLoadingMore || currentPage >= totalPages) {
      return;
    }
    setIsLoadingMore(true);
    if (chatContainerRef.current) {
      scrollHeightBeforeLoad.current = chatContainerRef.current.scrollHeight;
    }
    try {
      const data = await fetchConversationMessages(currentPage + 1, details.contactId, details.conversationId);
      const newFormattedMessages = formatMessages(data.messages);
      setMessages(prevMessages => [...newFormattedMessages, ...prevMessages]); // Nuevos mensajes arriba
      setCurrentPage(data.currentPage);
      // totalPages se setea en la carga inicial o si la API lo devuelve aquí también
    } catch (err: any) {
      console.error("Error fetching more messages:", err);
      // Considerar mostrar un error específico para la carga de más mensajes
    } finally {
      setIsLoadingMore(false);
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
            const newScrollHeight = chatContainerRef.current.scrollHeight;
            chatContainerRef.current.scrollTop += newScrollHeight - scrollHeightBeforeLoad.current;
        }
      });
    }
  }, [details, isLoadingMore, currentPage, totalPages, formatMessages, fetchConversationMessages]);

  useEffect(() => {
    if (!details) {
      setMessages([]);
      return;
    }

    const { contactId, conversationId } = details;
    setIsLoading(true);
    setError(null);
    setMessages([]);
    setCurrentPage(1);
    setTotalPages(1);

    fetchConversationMessages(1, contactId, conversationId)
      .then(data => {
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
        requestAnimationFrame(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        });
      });
  }, [details, formatMessages, fetchConversationMessages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    const handleScroll = () => {
      if (container && container.scrollTop < 50 && !isLoadingMore && currentPage < totalPages) {
           loadMoreMessages();
      }
    };
    if (container) container.addEventListener('scroll', handleScroll);
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [isLoadingMore, currentPage, totalPages, loadMoreMessages]);

  if (!details && !isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Seleccione una conversación para ver los detalles.</div>;
  }

  return (
    <div ref={chatContainerRef} className="mt-1 p-1 border rounded-md max-h-[500px] h-[500px] overflow-y-auto flex flex-col-reverse bg-muted/20">
      <div className="space-y-3 p-3">
        {isLoading && messages.length === 0 && (
            Array.from({ length: 5 }).map((_, index) => (
                <div key={`skel-${index}`} className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <Skeleton className={`h-8 w-3/5 rounded-lg ${index % 2 === 0 ? 'bg-blue-200' : 'bg-gray-300'}`} />
                </div>
            ))
        )}

        {!isLoading && error && <p className="text-red-500 text-center">Error: {error}</p>}
        
        {!isLoading && !error && messages.length === 0 && (
            <p className="text-center text-muted-foreground">No se encontraron mensajes para esta conversación.</p>
        )}

        {messages.map((msg) => (
           <div
              key={msg.id} 
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`p-2 px-3 rounded-lg max-w-[75%] break-words shadow-sm ${ 
                  msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
              <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'} text-gray-500 dark:text-gray-400`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>

      {isLoadingMore && (
          <div className="text-center py-3 sticky top-0 bg-muted/80 w-full backdrop-blur-sm">
            <p className="text-sm">Cargando mensajes anteriores...</p> 
          </div>
        )}
    </div>
  );
}; 