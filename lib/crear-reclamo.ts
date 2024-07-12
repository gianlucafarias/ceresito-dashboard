import { Task } from "@/app/(dashboard)/dashboard/reclamosold/data/schema";

export async function createTask(task: Task) {
  try {
    const response = await fetch('https://api.ceres.gob.ar/api/api/reclamos/crear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: errorText };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error };
  }
}