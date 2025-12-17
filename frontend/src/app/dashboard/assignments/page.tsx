"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
}

interface Test {
  _id?: string;
  title: string;
  description?: string;
  date?: string;
  duration?: string;
  file?: File | null;
  status?: string;
  classId?: string;
}

interface Class {
  _id: string;
  title: string;
  students?: any[];
}

export default function AssignmentsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
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

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const endpoint = role === 'student' ? "/students/classes" : "/classes/tutor";
        const response = await api.get(endpoint);
        setClasses(response.data);
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
          const mappedAssignments = response.data.map((a: any) => {
            const cls = classes.find((c) => c._id === (typeof a.class === 'string' ? a.class : a.class?._id));
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
          setTests(response.data);
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
        const formData = new FormData();
        formData.append("title", safeTest.title);
        formData.append("description", safeTest.description ?? "");
        formData.append("date", safeTest.date || "");
        formData.append("duration", safeTest.duration ?? "");
        if (safeTest.file) {
          formData.append("file", safeTest.file);
        }

        if (safeTest._id) {
          // Update
          const response = await api.put(`/tests/${safeTest._id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          setTests(tests.map((t) => (t._id === safeTest._id ? response.data : t)));
        } else {
          // Create
          formData.append("class", safeTest.classId || filterClass);
          const response = await api.post("/tests", formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
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
                            {assignment.submissionCount} / {assignment.totalStudents}
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
                                  {assignment.submissionCount > 0 ? "Resubmit" : "Submit"}
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTests.map((test) => (
                        <TableRow key={test._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                              {test.title}
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
                            <Badge variant={test.status === "scheduled" ? "default" : "secondary"}>
                              {test.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {role === 'tutor' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {role === 'tutor' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { }}
                                >
                                  <Trash className="h-4 w-4" />
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
    </div>
  );
}
