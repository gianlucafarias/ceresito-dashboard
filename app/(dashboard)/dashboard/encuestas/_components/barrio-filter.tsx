"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useBarrioFilter } from "./barrio-filter-context"

interface BarrioFilterProps {
  barrios: Array<{ nombre: string; cantidad: number }>
  className?: string
}

export default function BarrioFilter({
  barrios,
  className
}: BarrioFilterProps) {
  const [open, setOpen] = useState(false)
  const { selectedBarrio, setSelectedBarrio } = useBarrioFilter()


  // Preparar opciones: "Todos los barrios" + barrios específicos
  const barrioOptions = [
    { value: "todos", label: "Todos los barrios", cantidad: barrios.reduce((sum, b) => sum + b.cantidad, 0) },
    ...barrios.map(barrio => ({
      value: barrio.nombre,
      label: barrio.nombre,
      cantidad: barrio.cantidad
    }))
  ]

  const selectedOption = barrioOptions.find(option => option.value === selectedBarrio) || barrioOptions[0]

  const handleBarrioChange = (barrio: string) => {
    setSelectedBarrio(barrio)
    setOpen(false)
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[280px] justify-between"
          >
            <div className="flex items-center space-x-2">
              <span className="truncate">{selectedOption.label}</span>
              <Badge variant="secondary" className="ml-2">
                {selectedOption.cantidad} encuestas
              </Badge>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandList>
              <CommandGroup>
                {barrioOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      handleBarrioChange(option.value)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedBarrio === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{option.label}</span>
                      <Badge variant="outline" className="ml-2">
                        {option.cantidad}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Indicador de debug */}
      <div className="text-xs text-muted-foreground">
        Seleccionado: {selectedBarrio}
      </div>
    </div>
  )
}
