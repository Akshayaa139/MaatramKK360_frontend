import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Download, Save } from "lucide-react";

interface Submission {
  student: {
    _id: string;
    name?: string; // Depends on population
    email?: string;
    user?: {
      name?: string;
      email?: string;
    };
  };
  file: string;
  submittedAt: string;
  grade?: string;
}

interface SubmissionReviewDialogProps {
  assignmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SubmissionReviewDialog({
  assignmentId,
  isOpen,
  onClose,
}: SubmissionReviewDialogProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState<Record<string, string>>({}); // studentId -> grade

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/assignments/${assignmentId}/details`);
      const assignment = response.data;
      if (assignment.submissions) {
        setSubmissions(assignment.submissions);
        // Initialize grading state
        const initialGrades: Record<string, string> = {};
        assignment.submissions.forEach((sub: Submission) => {
          if (sub.grade) initialGrades[sub.student._id] = sub.grade;
        });
        setGrading(initialGrades);
      }
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    if (isOpen && assignmentId) {
      fetchSubmissions();
    }
  }, [isOpen, assignmentId, fetchSubmissions]);

  const handleGradeChange = (studentId: string, value: string) => {
    setGrading((prev) => ({ ...prev, [studentId]: value }));
  };

  const saveGrade = async (studentId: string) => {
    try {
      await api.post(`/assignments/${assignmentId}/grade`, {
        studentId,
        grade: grading[studentId],
      });
      alert("Grade saved!");
    } catch {
      alert("Failed to save grade");
    }
  };

  const downloadFile = (path: string) => {
    // Assuming file path is relative to server root or needs a preamble
    // Typically backend should serve uploads via static route or verified download link
    const fileUrl = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    }/${path.replace(/\\/g, "/")}`;
    window.open(fileUrl, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submission Review</DialogTitle>
          <DialogDescription>
            Review student submissions and award grades.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p>Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">
            No submissions yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => (
                <TableRow key={sub.student._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {sub.student.user?.name ||
                          sub.student.name ||
                          "Student"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.student.user?.email || sub.student.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {sub.file && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(sub.file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20"
                      placeholder="Marks"
                      value={grading[sub.student._id] || ""}
                      onChange={(e) =>
                        handleGradeChange(sub.student._id, e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => saveGrade(sub.student._id)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
