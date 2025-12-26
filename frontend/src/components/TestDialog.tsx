import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Test {
  _id?: string;
  title: string;
  description: string;
  date?: string;
  duration?: string;

  classId?: string;
}

interface Class {
  _id: string;
  title: string;
}

interface TestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (test: Test) => void;
  test?: Test;
  classes: Class[];
  selectedClassId?: string;
}
export function TestDialog({
  isOpen,
  onClose,
  onSubmit,
  test,
  classes,
  selectedClassId,
}: TestDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("");

  const [classId, setClassId] = useState("");

  useEffect(() => {
    if (test) {
      setTitle(test.title);
      setDescription(test.description);
      setDate(test.date ? new Date(test.date).toISOString().split("T")[0] : "");
      setDuration(test.duration ?? "");
    } else {
      setTitle("");
      setDescription("");
      setDate("");
      setDuration("");

      setClassId(selectedClassId && selectedClassId !== "all" ? selectedClassId : "");
    }
  }, [test, isOpen, selectedClassId]);

  const handleSubmit = () => {
    if (!classId && !test) {
      alert("Please select a class");
      return;
    }
    onSubmit({ _id: test?._id, title, description, date, duration, classId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{test ? "Edit Test" : "Create Test"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter test title"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="class">Class</Label>
          <Select
            value={classId}
            onValueChange={setClassId}
            disabled={!!test}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls._id} value={cls._id}>
                  {cls.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter test description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (in minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Enter test duration"
            />
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {test ? "Save Changes" : "Create Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
