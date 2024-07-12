import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function NewTaskModal({ onNewTask }) {
  const [open, setOpen] = React.useState(false)
  const [task, setTask] = React.useState({
    nombre: "",
    reclamo: "",
    ubicacion: "",
    barrio: "",
    telefono: "",
    detalle: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setTask((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    onNewTask(task)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Input name="nombre" placeholder="Nombre" onChange={handleChange} />
          <Input name="reclamo" placeholder="Reclamo" onChange={handleChange} />
          <Input name="ubicacion" placeholder="Ubicación" onChange={handleChange} />
          <Input name="barrio" placeholder="Barrio" onChange={handleChange} />
          <Input name="telefono" placeholder="Teléfono" onChange={handleChange} />
          <Input name="detalle" placeholder="Detalle" onChange={handleChange} />
        </div>
        <Button onClick={handleSubmit}>Create</Button>
      </DialogContent>
    </Dialog>
  )
}
