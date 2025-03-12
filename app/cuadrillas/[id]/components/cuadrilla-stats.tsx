"use client"

import React from 'react';
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BarChart2, LineChart, CheckCircle, AlertTriangle, Clock } from "lucide-react"

type ReclamoStats = {
  completados: number;
  enProceso: number;
  asignados: number;
  tiempoPromedio: number; // en horas
}

interface CuadrillaStatsProps {
  cuadrillaId: string;
}

export function CuadrillaStats({ cuadrillaId }: CuadrillaStatsProps) {
  const [stats, setStats] = useState<ReclamoStats>({
    completados: 0,
    enProceso: 0,
    asignados: 0,
    tiempoPromedio: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Simulamos una llamada a la API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(`/api/cuadrillas/${cuadrillaId}/stats`);
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Si la API no está implementada, usamos datos ficticios
          setStats({
            completados: Math.floor(Math.random() * 100) + 50,
            enProceso: Math.floor(Math.random() * 20) + 5,
            asignados: Math.floor(Math.random() * 10) + 1,
            tiempoPromedio: Math.floor(Math.random() * 48) + 24
          });
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        // Datos ficticios en caso de error
        setStats({
          completados: 75,
          enProceso: 12,
          asignados: 5,
          tiempoPromedio: 36
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [cuadrillaId]);
  
  // Formatear tiempo promedio para visualización
  const formatTiempo = (horas: number) => {
    const dias = Math.floor(horas / 24);
    const horasRestantes = Math.floor(horas % 24);
    
    if (dias > 0) {
      return `${dias}d ${horasRestantes}h`;
    }
    return `${horasRestantes}h`;
  };
  
  // Calcular eficiencia (valor ficticio para demostración)
  const calcularEficiencia = () => {
    const total = stats.completados + stats.enProceso + stats.asignados;
    if (total === 0) return 0;
    
    // Peso de cada factor
    const completadosPeso = 0.6;
    const tiempoPeso = 0.4;
    
    // Normalizar tiempo (menor es mejor) - asumimos que 12h es excelente, 96h es malo
    const tiempoNormalizado = Math.max(0, Math.min(100, 100 - ((stats.tiempoPromedio - 12) / 84) * 100));
    
    // Factor de completados
    const factorCompletados = (stats.completados / total) * 100;
    
    return Math.round((factorCompletados * completadosPeso) + (tiempoNormalizado * tiempoPeso));
  };
  
  const getEficienciaColor = (valor: number) => {
    if (valor >= 80) return "bg-green-500";
    if (valor >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  const eficiencia = calcularEficiencia();
  
  return (
    <Tabs defaultValue="stats" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="stats" className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4" />
          Estadísticas
        </TabsTrigger>
        <TabsTrigger value="progress" className="flex items-center gap-2">
          <LineChart className="h-4 w-4" />
          Rendimiento
        </TabsTrigger>
      </TabsList>
      
      {/* Pestaña de Estadísticas */}
      <TabsContent value="stats" className="space-y-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Reclamos Completados
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start">
              <div className="text-2xl font-bold flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                {stats.completados}
              </div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(stats.completados * 0.1)} desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                En Proceso
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start">
              <div className="text-2xl font-bold flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                {stats.enProceso}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.enProceso > 5 ? "Por encima del promedio" : "Dentro del promedio"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Tiempo Promedio
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start">
              <div className="text-2xl font-bold flex items-center">
                <Clock className="h-5 w-5 text-blue-500 mr-2" />
                {formatTiempo(stats.tiempoPromedio)}
              </div>
              <p className="text-xs text-muted-foreground">
                Para completar un reclamo
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Reclamos Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start">
              <div className="text-2xl font-bold">
                {stats.asignados}
              </div>
              <p className="text-xs text-muted-foreground">
                Esperando inicio de trabajos
              </p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      {/* Pestaña de Rendimiento */}
      <TabsContent value="progress" className="space-y-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Eficiencia General</CardTitle>
            <CardDescription>
              Basado en tiempo de resolución y cantidad de reclamos completados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Eficiencia Global
                </span>
                <span className="text-sm font-medium">
                  {eficiencia}%
                </span>
              </div>
              <Progress value={eficiencia} className={getEficienciaColor(eficiencia)} />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Tasa de Completado
                </span>
                <span className="text-sm font-medium">
                  {Math.round(stats.completados / (stats.completados + stats.enProceso + stats.asignados) * 100)}%
                </span>
              </div>
              <Progress
                value={stats.completados / (stats.completados + stats.enProceso + stats.asignados) * 100}
                className="bg-blue-500"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
} 