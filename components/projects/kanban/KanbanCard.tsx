import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Stage {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  projectId: number;
}

interface KanbanCardProps {
  stage: Stage;
}

export function KanbanCard({ stage }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: String(stage.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-4 rounded-md shadow-md">
      <h3 className="font-bold">{stage.name}</h3>
      <p>{stage.description}</p>
      <p>Start Date: {new Date(stage.startDate).toLocaleDateString()}</p>
      <p>End Date: {new Date(stage.endDate).toLocaleDateString()}</p>
    </div>
  );
}
