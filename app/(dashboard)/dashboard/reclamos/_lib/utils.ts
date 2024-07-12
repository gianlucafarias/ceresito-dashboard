import { type Task } from "@/db/schema"
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons"

/**
 * Returns the appropriate status icon based on the provided status.
 * @param status - The status of the task.
 * @returns A React component representing the status icon.
 */
export function getStatusIcon(estado: Task["estado"]) {
  const statusIcons = {
    canceled: CrossCircledIcon,
    "COMPLETADO": CheckCircledIcon,
    "EN_PROCESO": StopwatchIcon,
    todo: QuestionMarkCircledIcon,
  }

  return statusIcons[estado] || CircleIcon
}

/**
 * Returns the appropriate priority icon based on the provided priority.
 * @param priority - The priority of the task.
 * @returns A React component representing the priority icon.
 */
export function getPriorityIcon(prioridad: Task["prioridad"]) {
  const priorityIcons = {
    ALTA: ArrowUpIcon,
    BAJA: ArrowDownIcon,
    MEDIA: ArrowRightIcon,
  }

  return priorityIcons[prioridad] || CircleIcon
}
