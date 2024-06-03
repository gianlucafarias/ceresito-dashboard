import { useEffect, useState } from 'react';

interface Stage {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  projectId: number;
}

interface StageListProps {
  projectId: number;
}

export default function StageList({ projectId }: StageListProps) {
  const [stages, setStages] = useState<Stage[]>([]);

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/stages`);
        const data = await response.json();
        setStages(data);
      } catch (error) {
        console.error('Error fetching stages:', error);
      }
    };

    fetchStages();
  }, [projectId]);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/projects/stages/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setStages(stages.filter(stage => stage.id !== id));
      } else {
        console.error('Error deleting stage');
      }
    } catch (error) {
      console.error('Error deleting stage:', error);
    }
  };

  return (
    <div>
      <h2>Stages for Project {projectId}</h2>
      <ul>
        {stages.map(stage => (
          <li key={stage.id}>
            <h3>{stage.name}</h3>
            <p>{stage.description}</p>
            <p>Start Date: {new Date(stage.startDate).toLocaleDateString()}</p>
            <p>End Date: {new Date(stage.endDate).toLocaleDateString()}</p>
            <button onClick={() => handleDelete(stage.id)}>Delete</button>
            {/* Aquí puedes agregar un botón para editar la etapa */}
          </li>
        ))}
      </ul>
    </div>
  );
}
