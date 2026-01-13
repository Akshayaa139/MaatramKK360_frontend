import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
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
import { Plus, Trash, CheckCircle2 } from "lucide-react";
import { MathText } from "./MathText";

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: number;
}

interface Test {
  _id?: string;
  title: string;
  description: string;
  date?: string;
  duration?: string;
  classId?: string;
  class?: string | { _id: string }; // from backend
  questions?: Question[];
  status?: string;
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
  const [status, setStatus] = useState("scheduled");
  const [questions, setQuestions] = useState<Question[]>([
    { questionText: "", options: ["", "", "", ""], correctAnswer: 0 }
  ]);

  useEffect(() => {
    if (test) {
      setTitle(test.title);
      setDescription(test.description);
      setDate(test.date ? new Date(test.date).toISOString().split("T")[0] : "");
      setDuration(test.duration ?? "");
      setClassId((typeof test.class === 'string' ? test.class : test.class?._id) || test.classId || "");
      setStatus(test.status || "scheduled");
      setQuestions(test.questions && test.questions.length > 0 ? test.questions : [
        { questionText: "", options: ["", "", "", ""], correctAnswer: 0 }
      ]);
    } else {
      setTitle("");
      setDescription("");
      setDate("");
      setDuration("");
      setStatus("scheduled");
      setClassId(selectedClassId && selectedClassId !== "all" ? selectedClassId : "");
      setQuestions([{ questionText: "", options: ["", "", "", ""], correctAnswer: 0 }]);
    }
  }, [test, isOpen, selectedClassId]);

  const addQuestion = () => {
    setQuestions([...questions, { questionText: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number | string[]) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return newQuestions;
    });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      const targetQuestion = { ...newQuestions[qIndex] };
      const newOptions = [...targetQuestion.options];
      newOptions[oIndex] = value;
      targetQuestion.options = newOptions;
      newQuestions[qIndex] = targetQuestion;
      return newQuestions;
    });
  };

  const handleSubmit = () => {
    if (!classId && !test) {
      alert("Please select a class");
      return;
    }
    if (questions.some(q => !q.questionText || q.options.some(o => !o))) {
      alert("Please fill in all questions and options");
      return;
    }
    onSubmit({ _id: test?._id, title, description, date, duration, classId, questions, status });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{test ? "Edit Quiz" : "Create MCQ Quiz"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Mathematics Midterm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Assign to Class</Label>
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
              <Label htmlFor="date">Scheduled Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Quiz Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Instructions (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter instructions for students"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-lg font-bold">Quiz Questions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((q, qIdx) => (
              <Card key={qIdx} className="p-4 border-2 border-slate-100 relative group animate-in fade-in duration-300">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeQuestion(qIdx)}
                >
                  <Trash className="h-4 w-4" />
                </Button>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase font-bold text-slate-500">Question {qIdx + 1}</Label>
                    <Input
                      value={q.questionText}
                      onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)}
                      placeholder="Type your question here..."
                      className="font-medium"
                    />
                    {q.questionText.includes('$') && (
                      <div className="mt-1 p-2 bg-slate-50 rounded text-sm border border-slate-200">
                        <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Preview</span>
                        <MathText text={q.questionText} />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Button
                            variant={q.correctAnswer === oIdx ? "default" : "outline"}
                            size="icon"
                            type="button"
                            className={`h-8 w-8 shrink-0 ${q.correctAnswer === oIdx ? 'bg-green-500 hover:bg-green-600 border-green-500' : ''}`}
                            onClick={() => updateQuestion(qIdx, "correctAnswer", oIdx)}
                            title="Mark as correct answer"
                          >
                            {q.correctAnswer === oIdx ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs">{String.fromCharCode(65 + oIdx)}</span>}
                          </Button>
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className={`h-8 text-sm ${q.correctAnswer === oIdx ? 'border-green-200 bg-green-50' : ''}`}
                          />
                        </div>
                        {opt.includes('$') && (
                          <div className="ml-10 p-1 bg-slate-50/50 rounded text-xs border border-slate-100 italic">
                            <MathText text={opt} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-maatram-blue hover:bg-slate-800">
            {test ? "Save Changes" : "Publish Quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}
