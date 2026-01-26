"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface BarrioFilterContextType {
  selectedBarrio: string
  setSelectedBarrio: (barrio: string) => void
  isFiltered: boolean
}

const BarrioFilterContext = createContext<BarrioFilterContextType | undefined>(undefined)

interface BarrioFilterProviderProps {
  children: ReactNode
}

export function BarrioFilterProvider({ children }: BarrioFilterProviderProps) {
  const [selectedBarrio, setSelectedBarrio] = useState<string>("todos")

  const isFiltered = selectedBarrio !== "todos"


  const value = {
    selectedBarrio,
    setSelectedBarrio: (barrio: string) => {
      setSelectedBarrio(barrio)
    },
    isFiltered
  }

  return (
    <BarrioFilterContext.Provider value={value}>
      {children}
    </BarrioFilterContext.Provider>
  )
}

export function useBarrioFilter() {
  const context = useContext(BarrioFilterContext)
  if (context === undefined) {
    throw new Error("useBarrioFilter debe ser usado dentro de un BarrioFilterProvider")
  }
  return context
}

