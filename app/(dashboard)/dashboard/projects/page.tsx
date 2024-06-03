"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Project {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  status: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        } else {
          console.error("Error fetching projects");
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleNewProject = () => {
    router.push("/dashboard/projects/new");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <Button onClick={handleNewProject}>Crear Nuevo Proyecto</Button>
      </div>
      {loading ? (
        <p>Cargando proyectos...</p>
      ) : projects.length === 0 ? (
        <p>No hay proyectos.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="shadow-lg">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{project.description}</p>
                <p><strong>Inicio:</strong> {new Date(project.startDate).toLocaleDateString()}</p>
                <p><strong>Fin:</strong> {new Date(project.endDate).toLocaleDateString()}</p>
                {project.budget && <p><strong>Presupuesto:</strong> ${project.budget}</p>}
                <p><strong>Estado:</strong> {project.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
