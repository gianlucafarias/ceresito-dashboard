"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Save, X } from 'lucide-react'; // Import icons

// Tipos (Duplicados aquí por simplicidad, idealmente importar)
interface AssigneeInfo {
    id: number;
    username: string;
    email: string;
}
interface KanbanTask {
    id: number;
    title: string;
    description: string | null;
    status: string;
    order: number;
    boardId: number;
    creatorId: number;
    assigneeId: number | null;
    createdAt: string;
    updatedAt: string;
    assignee?: AssigneeInfo | null;
}
// Tipo para la lista de usuarios del dropdown
interface AssignableUser {
    id: number;
    username: string;
    email: string;
}

interface TaskDetailsModalProps {
  task: KanbanTask | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void; // Callback para refrescar tras la actualización
}

export function TaskDetailsModal({ task, isOpen, onClose, onTaskUpdated }: TaskDetailsModalProps) {
  // Estados locales para el formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(null);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  
  // Estados de carga y UI
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const { toast } = useToast();

  // Efecto para poblar el formulario cuando la tarea cambia o se abre el modal
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || '');
      setSelectedAssigneeId(task.assigneeId);
    } 
  }, [task, isOpen]);

  // Efecto para cargar usuarios
  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setIsFetchingUsers(true);
        try {
          const response = await fetch('/api/users');
          if (!response.ok) throw new Error('Failed to fetch users');
          const data: AssignableUser[] = await response.json();
          setUsers(data);
        } catch (error) {
          console.error("Error fetching users:", error);
          toast({ variant:"destructive", title:"Error", description:"No se pudo cargar la lista de usuarios."}) 
        } finally {
          setIsFetchingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen, toast]);

  // Handler para cambios en el select de asignado
  const handleAssigneeChange = (value: string) => {
    setSelectedAssigneeId(value === "unassigned" ? null : parseInt(value, 10));
  };

  // Handler para guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return; 
    if (!title) {
      toast({ variant: "destructive", title: "Error", description: "El título es obligatorio." });
      return;
    }
    setIsLoading(true);

    try {
      // Construir payload solo con campos cambiados
      const bodyPayload = {
        title: title !== task.title ? title : undefined, 
        description: description !== (task.description || '') ? description : undefined,
        assigneeId: selectedAssigneeId !== task.assigneeId ? selectedAssigneeId : undefined,
      };
      const filteredPayload = Object.fromEntries(Object.entries(bodyPayload).filter(([_, v]) => v !== undefined));

      if (Object.keys(filteredPayload).length === 0) {
          toast({ title: "Sin cambios", description: "No se detectaron cambios para guardar." });
          onClose(); 
          return;
      }

      // Llamada PUT a la API
      const response = await fetch(`/api/kanban/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filteredPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status} al actualizar tarea`);
      }

      toast({ title: "Éxito", description: "Tarea actualizada correctamente." });
      onTaskUpdated(); // Refrescar tablero
      onClose(); // Cerrar modal

    } catch (error: any) {
      console.error("Error actualizando tarea:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // No renderizar si no está abierto o no hay tarea
  if (!isOpen || !task) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}> 
      <DialogContent className="sm:max-w-[425px]"> {/* Ajustar ancho si es necesario */} 
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          {/* <DialogDescription>Modifica los detalles de la tarea.</DialogDescription> */}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
           {/* Título */}
           <div>
             <Label htmlFor="edit-title">Título</Label>
             <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isLoading} />
           </div>
           {/* Descripción */}
           <div>
             <Label htmlFor="edit-description">Descripción</Label>
             <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} placeholder="Añade una descripción..." />
           </div>
           {/* Asignado */}
           <div>
            <Label htmlFor="edit-assignee">Asignado a</Label>
            <Select 
                value={selectedAssigneeId?.toString() ?? "unassigned"} 
                onValueChange={handleAssigneeChange}
                disabled={isLoading || isFetchingUsers}
            >
              <SelectTrigger id="edit-assignee">
                <SelectValue placeholder={isFetchingUsers ? "Cargando..." : "Seleccionar usuario"} />
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
          {/* Pie del Modal */}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}> <X className="h-4 w-4 mr-1"/> Cancelar</Button>
            <Button type="submit" disabled={isLoading}> <Save className="h-4 w-4 mr-1"/> {isLoading ? 'Guardando...' : 'Guardar Cambios'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 