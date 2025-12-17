import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface Assignment {
  _id?: string;
  title: string;
  description?: string;
  dueDate: string;
  file?: File;
  classId?: string;
}

interface Class {
  _id: string;
  title: string;
}

interface AssignmentDialogProps {
  assignment?: Assignment;
  classes: Class[];
  selectedClassId?: string; // Pre-selected class from filter
  onSubmit: (assignment: Assignment) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function AssignmentDialog({ assignment, classes, selectedClassId, onSubmit, isOpen, onClose }: AssignmentDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [classId, setClassId] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title);
      setDescription(assignment.description || "");
      setDueDate(new Date(assignment.dueDate).toISOString().split('T')[0]);
      setClassId(assignment.classId || "");
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setFile(undefined);
      // Default to selected filter class if it's not "all", otherwise empty (force selection)
      setClassId(selectedClassId && selectedClassId !== "all" ? selectedClassId : "");
    }
  }, [assignment, isOpen, selectedClassId]);

  const handleSubmit = () => {
    if (!classId) {
      alert("Please select a class");
      return;
    }
    onSubmit({ _id: assignment?._id, title, description, dueDate, file, classId });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{assignment ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
          <DialogDescription>
            {assignment ? "Update the details below." : "Fill in the details below to create a new assignment."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="class" className="text-right">
              Class
            </Label>
            <Select value={classId} onValueChange={setClassId} disabled={!!assignment}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls._id} value={cls._id}>{cls.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">
              Due Date
            </Label>
            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              File
            </Label>
            <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0])} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>{assignment ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}