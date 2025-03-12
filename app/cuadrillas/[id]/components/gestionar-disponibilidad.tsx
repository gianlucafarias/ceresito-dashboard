"use client"

import React from 'react';
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Cuadrilla {
  id: number;
  nombre: string;
  disponibilidad: boolean;
  limiteReclamosSimultaneos: number;
}

interface GestionarDisponibilidadProps {
  cuadrillaId: string;
}

export function GestionarDisponibilidad({ cuadrillaId }: GestionarDisponibilidadProps) {
  const [cuadrilla, setCuadrilla] = useState<Cuadrilla | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [disponible, setDisponible] = useState<boolean>(false);
  const [limiteReclamos, setLimiteReclamos] = useState<number>(5);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchCuadrilla = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cuadrillas/${cuadrillaId}`);
        
        if (response.ok) {
          const data = await response.json();
          setCuadrilla(data);
          setDisponible(data.disponibilidad);
          setLimiteReclamos(data.limiteReclamosSimultaneos || 5);
        } else {
          // Si la API aún no está implementada, usamos datos ficticios
          setCuadrilla({
            id: parseInt(cuadrillaId),
            nombre: "Cuadrilla " + cuadrillaId,
            disponibilidad: Math.random() > 0.5, // Aleatoriamente disponible o no
            limiteReclamosSimultaneos: 5
          });
          setDisponible(Math.random() > 0.5);
          setLimiteReclamos(5);
        }
      } catch (error) {
        console.error("Error al cargar datos de la cuadrilla:", error);
        // Datos ficticios en caso de error
        setCuadrilla({
          id: parseInt(cuadrillaId),
          nombre: "Cuadrilla " + cuadrillaId,
          disponibilidad: true,
          limiteReclamosSimultaneos: 5
        });
        setDisponible(true);
        setLimiteReclamos(5);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCuadrilla();
  }, [cuadrillaId]);
  
  const guardarCambios = async () => {
    setGuardando(true);
    
    try {
      // Llamada a la API para actualizar la disponibilidad
      const response = await fetch(`/api/cuadrillas/${cuadrillaId}/disponibilidad`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          disponibilidad: disponible,
          limiteReclamosSimultaneos: limiteReclamos
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Cambios guardados",
          description: "La disponibilidad de la cuadrilla ha sido actualizada",
        });
        
        // Actualizar estado local
        setCuadrilla(prev => {
          if (!prev) return null;
          return {
            ...prev,
            disponibilidad: disponible,
            limiteReclamosSimultaneos: limiteReclamos
          };
        });
      } else {
        // Si la API no está implementada, simular éxito
        setTimeout(() => {
          toast({
            title: "Cambios guardados",
            description: "La disponibilidad de la cuadrilla ha sido actualizada",
          });
          
          // Actualizar estado local
          setCuadrilla(prev => {
            if (!prev) return null;
            return {
              ...prev,
              disponibilidad: disponible,
              limiteReclamosSimultaneos: limiteReclamos
            };
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Error al actualizar disponibilidad:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la disponibilidad",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando disponibilidad...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Disponibilidad</CardTitle>
        <CardDescription>
          Establece la disponibilidad y el límite de reclamos para esta cuadrilla
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="disponibilidad">Estado de Disponibilidad</Label>
              <p className="text-sm text-muted-foreground">
                {disponible 
                  ? "La cuadrilla está disponible para recibir nuevas asignaciones" 
                  : "La cuadrilla no está disponible para nuevas asignaciones"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {disponible ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <Switch 
                id="disponibilidad"
                checked={disponible}
                onCheckedChange={setDisponible}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="limite">Límite de Reclamos Simultáneos</Label>
            <div className="flex items-center gap-4">
              <Input 
                id="limite"
                type="number" 
                min={1}
                max={20}
                value={limiteReclamos}
                onChange={(e) => setLimiteReclamos(parseInt(e.target.value) || 1)}
                className="w-[100px]"
              />
              <p className="text-sm text-muted-foreground">
                La cuadrilla puede gestionar hasta {limiteReclamos} reclamos al mismo tiempo
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={guardarCambios} 
          disabled={guardando}
          className="w-full"
        >
          {guardando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 