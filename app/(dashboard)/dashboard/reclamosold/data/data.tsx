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

export const labels = [
  {
    value: "Arboles",
    label: "Arboles",
  },
  {
    value: "Luminarias",
    label: "Luminarias",
  },
  {
    value: "Animales",
    label: "Animales en la Vía Pública",
  },
  {
    value: "Arreglos",
    label: "Arreglos",
  },
  {
    value: "Higiene Urbana",
    label: "Higiene Urbana",
  },
]

export const estados = [
  {
    value: "PENDIENTE",
    label: "Pendiente",
    icon: QuestionMarkCircledIcon,
    color: "",

  },
  {
    value: "ASIGNADO",
    label: "Asignado",
    icon: CircleIcon,
    color: "#3b82f6",

  },
  {
    value: "EN_PROCESO",
    label: "En Ejecución",
    icon: StopwatchIcon,
    color: "#eab308",

  },
  {
    value: "COMPLETADO",
    label: "Completado",
    icon: CheckCircledIcon,
    color: "#22c55e",

  },
  {
    value: "CANCELADO",
    label: "Cancelado",
    icon: CrossCircledIcon,
    color: "#ef4444",

  },
]

export const prioridades = [
  {
    value: null,
    label: "Normal",
    icon: ArrowDownIcon,
  },
  {
    value: "MEDIA",
    label: "Media",
    icon: ArrowRightIcon,
  },
  {
    value: "ALTA",
    label: "Alta",
    icon: ArrowUpIcon,
  },
]