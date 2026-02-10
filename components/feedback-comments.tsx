"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ConversationView,
  ConversationViewProps,
} from "@/components/conversation/conversation-view"

interface FeedbackData {
  id: number
  nombre: string | null
  calificacion: string
  comentario: string | null
  timestamp: string
  conversation_id?: string | null
  contact_id?: number | string | null
}

const getInitials = (name: string | null): string => {
  if (name) {
    const words = name.split(" ")
    const initials = words.map((word) => word.charAt(0)).join("")
    return initials.toUpperCase()
  }
  return "?"
}

const hasLinkedConversation = (comment: FeedbackData): boolean =>
  typeof comment.conversation_id === "string" &&
  comment.conversation_id.trim().length > 0

const parseContactId = (value: FeedbackData["contact_id"]): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export function FeedbackComments() {
  const [comments, setComments] = React.useState<FeedbackData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [conversationDetailsForModal, setConversationDetailsForModal] =
    React.useState<ConversationViewProps["details"]>(null)
  const [displayNameForModal, setDisplayNameForModal] = React.useState("")
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const handleCommentClick = (comment: FeedbackData) => {
    if (!hasLinkedConversation(comment)) return

    setConversationDetailsForModal({
      contactId: parseContactId(comment.contact_id),
      conversationId: comment.conversation_id!.trim(),
    })
    setDisplayNameForModal(comment.nombre || "Anonimo")
    setIsModalOpen(true)
  }

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const apiUrl = `/api/core/feedback`
        const response = await fetch(apiUrl, { cache: "no-store" })
        if (!response.ok) {
          throw new Error(`Error al obtener feedback: ${response.statusText}`)
        }
        const data: FeedbackData[] = await response.json()

        const processedComments = data
          .filter((item) => item.comentario && item.comentario.trim() !== "")
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 15)

        setComments(processedComments)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Ocurrio un error desconocido")
        }
        console.error("Error fetching feedback comments:", err)
        setComments([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Ultimos Comentarios</CardTitle>
        <CardDescription>Comentarios recientes del feedback.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
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
          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open)
              if (!open) {
                setConversationDetailsForModal(null)
              }
            }}
          >
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {comments.map((comment) => {
                  const isClickable = hasLinkedConversation(comment)
                  return (
                    <div
                      key={comment.id}
                      className={`flex items-start space-x-3 rounded-md p-2 transition-colors ${
                        isClickable
                          ? "cursor-pointer hover:bg-accent hover:text-accent-foreground"
                          : "cursor-not-allowed opacity-80"
                      }`}
                      onClick={isClickable ? () => handleCommentClick(comment) : undefined}
                      title={
                        isClickable
                          ? `Ver conversacion de ${comment.nombre || "Anonimo"}`
                          : "Este feedback no tiene conversacion vinculada"
                      }
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(comment.nombre)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-medium">{comment.nombre || "Anonimo"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.timestamp), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.comentario}</p>
                        {!isClickable && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Conversacion no disponible para este feedback.
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {conversationDetailsForModal && (
              <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-4 pb-2 border-b">
                  <DialogTitle className="text-lg">
                    Conversacion con {displayNameForModal || "Desconocido"}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-y-hidden p-1 pb-2 pr-0 mr-0">
                  <ConversationView details={conversationDetailsForModal} />
                </div>
              </DialogContent>
            )}
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
