import { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';

import { useParams } from 'next/navigation';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
interface Stage {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  projectId: number;
}

export default function KanbanBoard() {
  const { id } = useParams();
  const [stages, setStages] = useState<Stage[]>([]);
  const [activeStage] = useState<Stage | null>(null);

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await fetch(`/api/projects/${id}/stages`);
        const data = await response.json();
        setStages(data);
      } catch (error) {
        console.error('Error fetching stages:', error);
      }
    };

    fetchStages();
  }, [id]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      setStages((prevStages) => {
        const oldIndex = prevStages.findIndex((stage) => stage.id === Number(active.id));
        const newIndex = prevStages.findIndex((stage) => stage.id === Number(over.id));
        return arrayMove(prevStages, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex space-x-4">
        <SortableContext items={stages.map((stage) => String(stage.id))}>
          <KanbanColumn stages={stages} />
        </SortableContext>
      </div>
      <DragOverlay>{activeStage ? <KanbanCard stage={activeStage} /> : null}</DragOverlay>
    </DndContext>
  );
}
