"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Check, 
  X, 
  MessageSquare,
  Calendar,
  User,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Bug,
  Clock,
  UserCheck
} from "lucide-react";
import { mockSupportTickets } from "../_lib/mock-data";
import { SupportTicket, SUPPORT_TYPES, SUPPORT_PRIORITIES } from "../_types";

export default function SolicitudesPage() {
  const [supportTickets] = useState<SupportTicket[]>(mockSupportTickets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredTickets = supportTickets.filter((ticket) => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesType = typeFilter === "all" || ticket.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-red-500">Abierto</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">En Progreso</Badge>;
      case "resolved":
        return <Badge className="bg-green-500">Resuelto</Badge>;
      case "closed":
        return <Badge className="bg-gray-500">Cerrado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = SUPPORT_PRIORITIES.find(p => p.id === priority);
    return (
      <Badge className={`${priorityConfig?.color || 'bg-gray-500'} text-white`}>
        {priorityConfig?.name || priority}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-4 w-4" />;
      case 'feature':
        return <Lightbulb className="h-4 w-4" />;
      case 'support':
        return <HelpCircle className="h-4 w-4" />;
      case 'complaint':
        return <AlertTriangle className="h-4 w-4" />;
      case 'suggestion':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeName = (type: string) => {
    const typeConfig = SUPPORT_TYPES.find(t => t.id === type);
    return typeConfig?.name || type;
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Centro de Soporte
          </h2>
          <p className="text-muted-foreground">
            Gestiona tickets de soporte, reportes de errores y sugerencias de usuarios
          </p>
        </div>
        
      </div>

      
      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tickets Abiertos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supportTickets.filter(t => t.status === "open").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              En Progreso
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supportTickets.filter(t => t.status === "in_progress").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Siendo atendidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resueltos
            </CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supportTickets.filter(t => t.status === "resolved").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Esperando confirmación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Urgentes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supportTickets.filter(t => t.priority === "urgent").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Prioridad máxima
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por asunto, descripción o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="bug">Error/Bug</SelectItem>
                <SelectItem value="feature">Nueva funcionalidad</SelectItem>
                <SelectItem value="support">Soporte técnico</SelectItem>
                <SelectItem value="complaint">Queja</SelectItem>
                <SelectItem value="suggestion">Sugerencia</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tickets</CardTitle>
          <CardDescription>
            Haz clic en un ticket para ver los detalles y gestionar la respuesta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <span className="text-sm font-mono text-muted-foreground">
                      #{ticket.id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(ticket.type)}
                      <span className="text-sm">{getTypeName(ticket.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {ticket.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {ticket.user?.firstName} {ticket.user?.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.user?.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(ticket.priority)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(ticket.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        {ticket.status === "open" && (
                          <>
                            <DropdownMenuItem className="text-blue-600">
                              <Clock className="mr-2 h-4 w-4" />
                              Marcar en progreso
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Asignar a mi
                            </DropdownMenuItem>
                          </>
                        )}
                        {ticket.status === "in_progress" && (
                          <DropdownMenuItem className="text-green-600">
                            <Check className="mr-2 h-4 w-4" />
                            Marcar como resuelto
                          </DropdownMenuItem>
                        )}
                        {ticket.status === "resolved" && (
                          <DropdownMenuItem className="text-gray-600">
                            <X className="mr-2 h-4 w-4" />
                            Cerrar ticket
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          Responder
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <X className="mr-2 h-4 w-4" />
                          Cerrar ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredTickets.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No se encontraron tickets que coincidan con los filtros aplicados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Distribución por tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Tipo de Ticket</CardTitle>
          <CardDescription>
            Análisis de los tipos de consultas más comunes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {SUPPORT_TYPES.map((type) => {
              const count = supportTickets.filter(t => t.type === type.id).length;
              const percentage = supportTickets.length > 0 ? (count / supportTickets.length) * 100 : 0;
              
              return (
                <div key={type.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(type.id)}
                    <span className="text-sm font-medium">{type.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                      <Badge variant="secondary" className="text-xs">
                        {percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}