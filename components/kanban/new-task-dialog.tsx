"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogTrigger, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

// Definir tipo para el usuario que viene de la API /api/users
interface AssignableUser {
    id: number;
    username: string;
    email: string;
}

interface NewTaskDialogProps {
  boardId: number;
  status: string; 
  onTaskCreated?: () => void; // Callback opcional
}

export function NewTaskDialog({ boardId, status, onTaskCreated }: NewTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(null);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const { toast } = useToast();

  // Fetch users cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setIsFetchingUsers(true);
        try {
          const response = await fetch('/api/users');
          if (!response.ok) {
            throw new Error('Failed to fetch users');
          }
          const data: AssignableUser[] = await response.json();
          setUsers(data);
        } catch (error) {
          console.error("Error fetching users:", error);
          // Mostrar error en toast?
          toast({ variant:"destructive", title:"Error", description:"No se pudo cargar la lista de usuarios."}) 
        } finally {
          setIsFetchingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen, toast]); // Dependencia de isOpen y toast

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast({ variant: "destructive", title: "Error", description: "El título es obligatorio." });
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/kanban/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          boardId, 
          status, 
          // Incluir assigneeId si está seleccionado (no enviar si es null)
          assigneeId: selectedAssigneeId, 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status} al crear tarea`);
      }

      toast({ title: "Éxito", description: "Tarea creada correctamente." });
      
      // Limpiar formulario, resetear estado y cerrar
      setTitle('');
      setDescription('');
      setSelectedAssigneeId(null);
      setIsOpen(false); 

      if (onTaskCreated) {
        onTaskCreated();
      } else {
         console.warn("onTaskCreated callback no fue proporcionado...");
      }

    } catch (error: any) {
      console.error("Error creando tarea:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssigneeChange = (value: string) => {
    // value será el ID del usuario como string, o "unassigned"
    if (value === "unassigned") {
        setSelectedAssigneeId(null);
    } else {
        setSelectedAssigneeId(parseInt(value, 10));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          + Añadir tarea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Tarea en {status}</DialogTitle>
          <DialogDescription>Añade los detalles de la nueva tarea.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Título de la tarea" 
                required 
                disabled={isLoading} 
            />
          </div>
          <div>
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Añade más detalles..." 
                disabled={isLoading} 
            />
          </div>
          <div>
            <Label htmlFor="assignee">Asignar a</Label>
            <Select 
                value={selectedAssigneeId?.toString() ?? "unassigned"} 
                onValueChange={handleAssigneeChange}
                disabled={isLoading || isFetchingUsers}
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder={isFetchingUsers ? "Cargando usuarios..." : "Seleccionar usuario..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">-- Sin asignar --</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.username} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Tarea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
