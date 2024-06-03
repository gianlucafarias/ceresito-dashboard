"use client"
import { useParams } from 'next/navigation';
import TaskList from '@/components/projects/TaskList';
import StageList from '@/components/projects/StageList';
import NewStageDialog from '@/components/projects/NewStageDialog';
import { useEffect, useState } from 'react';
import KanbanBoard from '@/components/projects/kanban/KanbanBoard';

export default function ProjectPage() {
  const { id } = useParams();
  const [reloadStages, setReloadStages] = useState(false);

  if (!id) {
    return <div>Loading...</div>;
  }

  const handleStageCreated = () => {
    setReloadStages(!reloadStages);
  };

  useEffect(() => {
    // Aquí podrías cargar cualquier dato adicional que necesites para el proyecto
  }, [id, reloadStages]);

  return (
    <div>
      <h1>Project {id}</h1>
      {/* Otras secciones del proyecto */}
      <StageList projectId={parseInt(id as string)} />
      <NewStageDialog projectId={parseInt(id as string)} onStageCreated={handleStageCreated} />
      <TaskList projectId={parseInt(id as string)} />
      <KanbanBoard/>

    </div>
  );
}
