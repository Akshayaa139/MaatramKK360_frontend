"use client";

import { useState, useEffect } from "react";
// import { useSession } from "next-auth/react";
import { useTabSession } from "@/hooks/useTabSession";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Eye, Edit, Trash, Download, Upload, Clock, Calendar, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { AssignmentDialog } from "@/components/AssignmentDialog";
import { SubmitAssignmentDialog } from "@/components/SubmitAssignmentDialog";
import { SubmissionReviewDialog } from "@/components/SubmissionReviewDialog";
import { TestDialog } from "@/components/TestDialog";
import { TakeQuizDialog } from "@/components/TakeQuizDialog";

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  class: string;
  dueDate: string;
  submissionCount: number;
  totalStudents: number;
  status: string;
  file?: File;
  classId?: string;
  isSubmitted?: boolean;
  submissions?: Submission[];
}

interface Test {
  _id?: string;
  title: string;
  description?: string;
  date?: string;
  duration?: string;
  status?: string;
  classId?: string;
  class?: string | { _id: string }; // API field
  questions?: {
    questionText: string;
    options: string[];
    correctAnswer: number;
  }[];
  submissions?: Submission[];
}

interface Submission {
  _id: string;
  student: string | { _id: string; name: string };
  file?: string;
  answers?: number[];
  score?: number;
  marks?: number;
  feedback?: string;
}

interface Class {
  _id: string;
  title: string;
  students?: any[];
}

export default function AssignmentsPage() {
  const { data: session } = useTabSession();
  const role = session?.user?.role?.toLowerCase();
  const [activeTab, setActiveTab] = useState("assignments");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | undefined>(undefined);
  const [selectedTest, setSelectedTest] = useState<Test | undefined>(undefined);
  const [isTakeQuizOpen, setIsTakeQuizOpen] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const endpoint = role === 'student' ? "/students/classes" : "/classes/tutor";
        const response = await api.get(endpoint);
        // Deduplicate classes by _id to prevent key warnings
        const uniqueClasses = response.data
          .filter((c: Class) => c?._id)
          .filter((c: Class, index: number, self: Class[]) =>
            index === self.findIndex((t) => t._id === c._id)
          );
        setClasses(uniqueClasses);
      } catch (err) {
        setError("Failed to fetch classes.");
      }
    };
    fetchClasses();
  }, [role]);

  useEffect(() => {
    if (filterClass) {
      const fetchAssignments = async () => {
        setLoading(true);
        setError(null);
        try {
          const endpoint = role === 'student' ? `/students/assignments/${filterClass}` : `/assignments/${filterClass}`;
          const response = await api.get(endpoint);
          const mappedAssignments = response.data.map((a: Assignment) => {
            const cls = classes.find((c) => c._id === (typeof a.class === 'string' ? a.class : (a.class as any)?._id));
            const now = new Date();
            const due = new Date(a.dueDate);
            return {
              ...a,
              status: due > now ? "active" : "ended",
              submissionCount: a.submissions ? a.submissions.length : 0,
              totalStudents: cls ? cls.students?.length || 0 : 0,
              classId: a.class,
            };
          });
          setAssignments(mappedAssignments);
        } catch (err: any) {
          console.error("Fetch assignments error:", err);
          setError(`Failed to fetch assignments: ${err.message || 'Unknown error'}`);
          setAssignments([]);
        } finally {
          setLoading(false);
        }
      };

      const fetchTests = async () => {
        setLoading(true);
        setError(null);
        try {
          const endpoint = role === 'student' ? `/students/tests/${filterClass}` : `/tests/${filterClass}`;
          const response = await api.get(endpoint);
          const mappedTests = response.data.map((t: Test) => ({
            ...t,
            classId: typeof t.class === 'string' ? t.class : t.class?._id,
          }));
          setTests(mappedTests);
        } catch (err) {
          setError("Failed to fetch tests.");
          setTests([]);
        } finally {
          setLoading(false);
        }
      };

      if (role && activeTab === 'assignments') {
        fetchAssignments();
      } else if (role) {
        fetchTests();
      }
    }
  }, [filterClass, activeTab, role]);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (role === "student" && !studentId) {
        try {
          const response = await api.get("/students/profile");
          if (response.data.student) {
            setStudentId(response.data.student._id);
          }
        } catch (error) {
          console.error("Failed to fetch student profile", error);
        }
      }
    };
    fetchStudentProfile();
  }, [role]);

  const handleCreateAssignment = () => {
    setSelectedAssignment(undefined);
    setIsAssignmentDialogOpen(true);
  };

  const handleEditAssignment = (id: string) => {
    const assignment = assignments.find((a) => a._id === id);
    if (assignment) {
      // Map 'class' to 'classId' for the dialog
      setSelectedAssignment({ ...assignment, classId: assignment.class });
    }
    setIsAssignmentDialogOpen(true);
  };

  const handleAssignmentFormSubmit = async (assignment: { _id?: string; title: string; description?: string; dueDate: string; file?: File | undefined; classId?: string }) => {
    try {
      const formData = new FormData();
      formData.append("title", assignment.title);
      formData.append("description", assignment.description || "");
      formData.append("dueDate", assignment.dueDate);
      if (assignment.file) {
        formData.append("file", assignment.file);
      }

      if (assignment._id) {
        // Update
        const response = await api.put(`/assignments/${assignment._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setAssignments(assignments.map((a) => (a._id === assignment._id ? response.data : a)));
      } else {
        // Create
        // Use the selected classId from the dialog
        formData.append("classId", assignment.classId || "");
        const response = await api.post("/assignments", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        // Process the new assignment to match the display interface
        const cls = classes.find((c) => c._id === assignment.classId);
        const newAssignment = {
          ...response.data,
          status: "active",
          submissionCount: 0,
          totalStudents: cls ? cls.students?.length || 0 : 0,
          classId: assignment.classId,
        };
        setAssignments([...assignments, newAssignment]);
      }
      setIsAssignmentDialogOpen(false);
    } catch (err) {
      setError("Failed to save assignment.");
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments(assignments.filter((a) => a._id !== id));
    } catch (err) {
      setError("Failed to delete assignment.");
    }
  };

  const handleCreateTest = () => {
    setSelectedTest(undefined);
    setIsTestDialogOpen(true);
  };

  const handleEditTest = (id: string) => {
    const test = tests.find((t) => t._id === id);
    if (test) {
      // Ensure required fields are not undefined
      setSelectedTest({
        ...test,
        description: test.description ?? "",
        duration: test.duration ?? "",
      });
    } else {
      setSelectedTest(undefined);
    }
    setIsTestDialogOpen(true);
  };

  const handleTestFormSubmit = (test: Test) => {
    // Ensure required fields are not undefined
    const safeTest: Test = {
      ...test,
      description: test.description ?? "",
      duration: test.duration ?? "",
      date: test.date ?? new Date().toISOString().split('T')[0],
    };

    (async () => {
      try {
        const payload = {
          title: safeTest.title,
          description: safeTest.description ?? "",
          date: safeTest.date || "",
          duration: Number(safeTest.duration ?? 0),
          questions: safeTest.questions || [],
          status: safeTest.status || "scheduled",
          class: safeTest.classId || filterClass,
        };

        if (safeTest._id) {
          // Update
          const response = await api.put(`/tests/${safeTest._id}`, payload);
          setTests(tests.map((t) => (t._id === safeTest._id ? response.data : t)));
        } else {
          // Create
          const response = await api.post("/tests", payload);
          setTests([...tests, response.data]);
        }
        setIsTestDialogOpen(false);
      } catch (err) {
        setError("Failed to save test.");
      }
    })();
  };

  const handleDeleteTest = async (id: string) => {
    try {
      await api.delete(`/tests/${id}`);
      setTests(tests.filter((t) => t._id !== id));
    } catch (err) {
      setError("Failed to delete test.");
    }
  };

  const handleDownloadSubmissions = (id: string) => {
    console.log(`Downloading submissions for assignment ${id}`);
  };

  const filteredAssignments = assignments.filter(assignment => {
    return (
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!filterStatus || filterStatus === "all" || assignment.status === filterStatus)
    );
  });

  const filteredTests = tests.filter(test => {
    return (
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!filterStatus || filterStatus === "all" || test.status === filterStatus)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Assignments & Tests</h2>
        {role === 'tutor' && (
          activeTab === "assignments" ? (
            <Button onClick={handleCreateAssignment}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          ) : (
            <Button onClick={handleCreateTest}>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Button>
          )
        )}
      </div>

      <Tabs defaultValue="assignments" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="tests">Tests & Quizzes</TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{role === 'tutor' ? 'Manage Assignments' : 'Assignments'}</CardTitle>
              <CardDescription>
                {role === 'tutor' ? 'Create, view, and grade student assignments' : 'View assignments for your enrolled classes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assignments..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading && <p>Loading...</p>}
              {error && <p className="text-red-500">{error}</p>}

              {filteredAssignments.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssignments.map((assignment) => (
                        <TableRow key={assignment._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                              {assignment.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                              {assignment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {role === 'tutor' ? (
                              `${assignment.submissionCount} / ${assignment.totalStudents}`
                            ) : (
                              <Badge variant={assignment.isSubmitted ? "success" : "outline"}>
                                {assignment.isSubmitted ? "Submitted" : "Pending"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {/* Tutor Actions */}
                              {role === 'tutor' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setIsSubmissionDialogOpen(true);
                                    }}
                                    title="View Submissions & Grade"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditAssignment(assignment._id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteAssignment(assignment._id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </>
                              )}

                              {/* Student Actions */}
                              {role === 'student' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAssignment(assignment);
                                    setIsSubmitDialogOpen(true);
                                  }}
                                >
                                  {assignment.isSubmitted ? "Resubmit" : "Submit"}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No assignments found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {role === 'tutor' ? 'Create a new assignment or adjust your filters' : 'Try adjusting filters or check back later'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tests Tab */}
        <TabsContent value="tests" className="space-y-4 mt-4">
          {/* ... Tests Content (unchanged) ... */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{role === 'tutor' ? 'Manage Tests & Quizzes' : 'Tests & Quizzes'}</CardTitle>
              <CardDescription>
                {role === 'tutor' ? 'Create, schedule, and grade tests and quizzes' : 'View scheduled and completed tests for your classes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* ... (Existing Tests Logic) ... */}
              {/* Re-insert Tests Content here if truncated in previous views, but assuming unchanged for now, just closing tags correctly */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tests..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading && <p>Loading...</p>}
              {error && <p className="text-red-500">{error}</p>}

              {filteredTests.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        {role === 'student' && <TableHead>Score</TableHead>}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTests.map((test) => (
                        <TableRow key={test._id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <CheckCircle2 className={`h-4 w-4 mr-2 ${test.questions && test.questions.length > 0 ? 'text-maatram-blue' : 'text-muted-foreground'}`} />
                                {test.title}
                              </div>
                              {test.questions && test.questions.length > 0 && (
                                <span className="text-[10px] text-maatram-blue font-bold uppercase ml-6 mt-1">MCQ Quiz</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              {test.date ? new Date(test.date).toLocaleDateString() : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              {test.duration} mins
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              test.status === "scheduled" ? "default" :
                                test.status === "active" ? "success" :
                                  test.status === "completed" ? "secondary" : "outline"
                            }>
                              {test.status || "scheduled"}
                            </Badge>
                          </TableCell>
                          {role === 'student' && (
                            <TableCell>
                              {(() => {
                                const sub = test.submissions?.find((s: any) =>
                                  String(s.student) === String(studentId) ||
                                  String(s.student?._id || s.student) === String(studentId)
                                );
                                return sub ? (
                                  <Badge variant="success" className="bg-green-100 text-green-700">
                                    {sub.marks}%
                                  </Badge>
                                ) : (
                                  test.questions && test.questions.length > 0 ? (
                                    <Badge variant="outline" className="text-maatram-blue font-semibold border-maatram-blue/30">Ready to Take</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-slate-400 italic">No Questions</Badge>
                                  )
                                );
                              })()}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex space-x-2">
                              {/* Student View Action */}
                              {role === 'student' && test.questions && test.questions.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTest(test);
                                    setIsTakeQuizOpen(true);
                                  }}
                                  className="border-maatram-blue text-maatram-blue hover:bg-blue-50"
                                >
                                  {(() => {
                                    const sub = test.submissions?.find((s: any) =>
                                      String(s.student) === String(studentId) ||
                                      String(s.student?._id || s.student) === String(studentId)
                                    );
                                    return sub ? "Retake Quiz" : "Take Quiz";
                                  })()}
                                </Button>
                              )}

                              {/* Tutors manage via Edit button */}

                              {role === 'tutor' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditTest(test._id!)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteTest(test._id!)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No tests found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {role === 'tutor' ? 'Create a new test or adjust your filters' : 'Try adjusting filters or check back later'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <AssignmentDialog
        isOpen={isAssignmentDialogOpen}
        onClose={() => setIsAssignmentDialogOpen(false)}
        onSubmit={handleAssignmentFormSubmit}
        assignment={selectedAssignment}
        classes={classes}
        selectedClassId={filterClass}
      />

      {/* New Dialogs */}
      {selectedAssignment && (
        <>
          <SubmitAssignmentDialog
            assignmentId={selectedAssignment._id}
            assignmentTitle={selectedAssignment.title}
            isOpen={isSubmitDialogOpen}
            onClose={() => setIsSubmitDialogOpen(false)}
            onSuccess={() => {
              // Start refreshing logic if needed, or simple alert
              alert("Assignment submitted!");
            }}
          />
          <SubmissionReviewDialog
            assignmentId={selectedAssignment._id}
            isOpen={isSubmissionDialogOpen}
            onClose={() => setIsSubmissionDialogOpen(false)}
          />
        </>
      )}



      <TestDialog
        isOpen={isTestDialogOpen}
        onClose={() => setIsTestDialogOpen(false)}
        onSubmit={handleTestFormSubmit}
        test={
          selectedTest
            ? {
              ...selectedTest,
              description: selectedTest.description ?? "",
              duration: selectedTest.duration ?? "",
            }
            : undefined
        }
        classes={classes}
        selectedClassId={filterClass}
      />

      <TakeQuizDialog
        isOpen={isTakeQuizOpen}
        onClose={() => setIsTakeQuizOpen(false)}
        test={selectedTest as any}
        onSuccess={(marks) => {
          // Re-fetch tests to update status if needed
          // For now, marks are shown in the dialog
        }}
      />
    </div>
  );
}
