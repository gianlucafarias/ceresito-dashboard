"use client";

import { HistoryEntry } from "@/types/contact-detail";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface HistoryListProps {
  historyEntries: HistoryEntry[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  totalHistory: number;
}

export function HistoryList({ 
  historyEntries, 
  loading, 
  onLoadMore, 
  hasMore,
  totalHistory 
}: HistoryListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial ({totalHistory})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {historyEntries.length === 0 && !loading && (
          <p>No se encontró historial para este contacto.</p>
        )}
        {historyEntries.map((entry, index) => (
          <div key={entry.id || index} className="p-3 border rounded-md shadow-sm bg-muted/50">
            <p className="text-xs text-muted-foreground">
              {new Date(entry.timestamp).toLocaleString()} - Event: {entry.event_type}
            </p>
            <pre className="text-sm mt-1 whitespace-pre-wrap bg-background p-2 rounded">{JSON.stringify(entry.details, null, 2)}</pre>
            {/* Podrías formatear 'details' de una manera más amigable */}
          </div>
        ))}
        {loading && <p className="text-center py-4">Cargando historial...</p>}
      </CardContent>
      {hasMore && !loading && historyEntries.length > 0 && (
        <CardFooter>
          <Button onClick={onLoadMore} className="w-full">
            Cargar más historial
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 