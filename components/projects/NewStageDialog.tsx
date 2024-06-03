import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface NewStageDialogProps {
  projectId: number;
  onStageCreated: () => void;
}

export default function NewStageDialog({ projectId, onStageCreated }: NewStageDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newStage = {
      name,
      description,
      startDate,
      endDate,
      projectId,
    };

    try {
      const response = await fetch(`/api/projects/stages/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStage),
      });

      if (response.ok) {
        onStageCreated();
        setName('');
        setDescription('');
        setStartDate('');
        setEndDate('');
      } else {
        console.error('Error creating stage');
      }
    } catch (error) {
      console.error('Error creating stage:', error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          + Add New Stage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Stage</DialogTitle>
        </DialogHeader>
        <form id="stage-form" onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Input
              id="name"
              name="name"
              placeholder="Stage name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              id="description"
              name="description"
              placeholder="Stage description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              type="date"
              id="startDate"
              name="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              id="endDate"
              name="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" size="sm" form="stage-form">
              Add Stage
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
