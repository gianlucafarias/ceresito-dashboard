"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, ExternalLink } from "lucide-react"
import type { ComentarioOtro } from "@/types"

interface ComentariosOtrosCardProps {
  title: string
  comentarios: ComentarioOtro[]
  onComentarioClick: (encuestaId: number) => void
  compact?: boolean
}

export default function ComentariosOtrosCard({ 
  title, 
  comentarios, 
  onComentarioClick,
  compact = false
}: ComentariosOtrosCardProps) {
  if (!comentarios || comentarios.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay comentarios adicionales
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {title}
          </div>
          <span className="text-xs text-muted-foreground font-normal">
            {comentarios.length} comentario{comentarios.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className={`${compact ? 'h-32' : 'h-64'} w-full`}>
          <div className="space-y-3 pr-3">
            {[...comentarios].reverse().map((item, index) => (
              <div
                key={index}
                className="group cursor-pointer rounded-lg border p-3 bg-muted/30 hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200"
                onClick={() => onComentarioClick(item.encuestaId)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed mb-2">
                      {item.comentario}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Encuesta #{item.encuestaId}</span>
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
          Haz clic en cualquier comentario para ver la encuesta completa
        </p>
      </CardContent>
    </Card>
  )
}