import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
interface Stage {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  projectId: number;
}

interface KanbanColumnProps {
  stages: Stage[];
}

export function KanbanColumn({ stages }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: 'column' });

  return (
    <div ref={setNodeRef} className="bg-gray-100 p-4 rounded-md shadow-md w-1/3">
      <h2 className="font-bold mb-4">Stages</h2>
      <div className="space-y-4">
        {stages.map((stage) => (
          <KanbanCard key={stage.id} stage={stage} />
        ))}
      </div>
    </div>
  );
}
