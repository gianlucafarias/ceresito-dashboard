"use client"
import { useEffect, useState } from 'react';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  projectId: number;
}

interface TaskListProps {
  projectId: number;
}

export default function TaskList({ projectId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/tasks`);
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [projectId]);

  return (
    <div>
      <h2>Tasks for Project {projectId}</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <p>Status: {task.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
