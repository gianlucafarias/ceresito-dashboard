"use client"

import * as React from "react"

import { type DataTableConfig } from "@/config/data-table"


type FeatureFlagValue = DataTableConfig["featureFlags"][number]["value"]

interface TasksTableContextProps {
  featureFlags: FeatureFlagValue[]
  setFeatureFlags: React.Dispatch<React.SetStateAction<FeatureFlagValue[]>>
}

const TasksTableContext = React.createContext<TasksTableContextProps>({
  featureFlags: [],
  setFeatureFlags: () => {},
})

export function useTasksTable() {
  const context = React.useContext(TasksTableContext)
  if (!context) {
    throw new Error("useTasksTable must be used within a TasksTableProvider")
  }
  return context
}

export function TasksTableProvider({ children }: React.PropsWithChildren) {
  const [featureFlags, setFeatureFlags] = React.useState<FeatureFlagValue[]>(["floatingBar"]);

  return (
    <TasksTableContext.Provider
      value={{
        featureFlags,
        setFeatureFlags,
      }}
    >
     
      {children}
    </TasksTableContext.Provider>
  )
}
