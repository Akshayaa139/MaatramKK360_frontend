"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, FileText, Eye, MessageSquare } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

type StudentProgress = {
  id: string;
  name: string;
  class: string;
  attendance: number;
  assignments: {
    completed: number;
    total: number;
    avgScore: number;
  };
  tests: {
    completed: number;
    total: number;
    avgScore: number;
  };
  trend: string;
};

type HistoryItem = {
  id: string;
  date: string;
  type: string;
  title: string;
  score: number;
  maxScore: number;
  feedback: string;
};

type StudentDetail = {
  id: string;
  name: string;
  class: string;
  attendance: number;
  notes: string;
  history: HistoryItem[];
  // Merged fields for display convenience
  assignments: { avgScore: number };
  tests: { avgScore: number };
};

export default function StudentProgressPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const accessToken = (session as unknown as { accessToken?: string })?.accessToken;

  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [classes, setClasses] = useState<{ id: string, name: string }[]>([]);
  const [studentDetails, setStudentDetails] = useState<StudentDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    const fetchProgress = async () => {
      try {
        const res = await api.get<StudentProgress[]>("/tutor/progress", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (Array.isArray(res.data)) {
          setStudents(res.data);
          // Extract unique classes
          const uniqueClasses = Array.from(new Set(res.data.map(s => s.class))).map((c, i) => ({
            id: String(i),
            name: c
          }));
          setClasses(uniqueClasses);
        }
      } catch (e) {
        console.error("Failed to fetch progress", e);
      }
    };
    fetchProgress();
  }, [accessToken]);

  const filteredStudents = students.filter(student => {
    return (
      (selectedClass === "all" || student?.class === selectedClass) &&
      (student?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  });

  const handleViewDetails = async (studentId: string) => {
    setSelectedStudent(studentId);
    setLoadingDetails(true);
    setStudentDetails(null);
    try {
      const res = await api.get<StudentDetail>(`/tutor/progress/${studentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      // Merge summary stats into details for display
      const summary = students.find(s => s.id === studentId);
      if (res.data && summary) {
        setStudentDetails({
          ...res.data,
          assignments: summary.assignments,
          tests: summary.tests,
          attendance: summary.attendance // Ensure it uses the summary calc if detail is 0
        });
      }
    } catch (e) {
      console.error("Failed to fetch details", e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddNote = async (studentId: string) => {
    const note = window.prompt("Enter note for student:");
    if (!note) return;
    try {
      await api.post(`/tutor/student/${studentId}/note`, { note }, { headers: { Authorization: `Bearer ${accessToken}` } });
      toast({ title: "Note added successfully" });
      handleViewDetails(studentId); // Refresh details
    } catch (e) {
      toast({ title: "Failed to add note", variant: "destructive" });
    }
  };

  const handleContactStudent = async (studentId: string) => {
    const message = window.prompt("Enter message to student:");
    if (!message) return;
    try {
      await api.post(`/tutor/student/${studentId}/message`, { message }, { headers: { Authorization: `Bearer ${accessToken}` } });
      toast({ title: "Message sent successfully" });
    } catch (e) {
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  };

  const handleGenerateReport = async (studentId: string) => {
    try {
      const response = await api.get(`/reports/student/${studentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Student_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: "Report downloaded" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate report", variant: "destructive" });
    }
  };

  const handleGenerateClassReport = async () => {
    if (selectedClass === 'all') {
      toast({ title: "Please select a specific class", variant: "destructive" });
      return;
    }
    try {
      const response = await api.get(`/reports/class?className=${encodeURIComponent(selectedClass)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Class_Report_${selectedClass.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: "Class report downloaded" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate class report", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-4xl font-extrabold tracking-tight">Student Progress Tracking</h2>
        <Button onClick={handleGenerateClassReport} className="bg-black hover:bg-zinc-800 text-white rounded-lg px-6">
          <FileText className="h-4 w-4 mr-2" />
          Generate Class Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Overview</CardTitle>
              <CardDescription>
                Track and monitor your students' academic progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="class-select">Select Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger id="class-select">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.name}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-student">Search Student</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-student"
                      placeholder="Search by name"
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Assignments</TableHead>
                      <TableHead>Tests</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>
                          <Badge variant={student.attendance >= 90 ? "default" : student.attendance >= 75 ? "outline" : "destructive"}>
                            {student.attendance}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{student.assignments?.completed || 0}/{student.assignments?.total || 0}</span>
                            <span className="text-[10px] text-muted-foreground">Avg: {student.assignments?.avgScore || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{student.tests?.completed || 0}/{student.tests?.total || 0}</span>
                            <span className="text-[10px] text-muted-foreground">Avg: {student.tests?.avgScore || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.trend === "up" && (
                            <div className="flex items-center text-green-600 text-xs font-medium">
                              <span className="mr-1">-</span>
                              <span>Improving</span>
                            </div>
                          )}
                          {student.trend === "down" && (
                            <div className="flex items-center text-red-600 text-xs font-medium">
                              <span className="mr-1">-</span>
                              <span>Declining</span>
                            </div>
                          )}
                          {student.trend === "stable" && (
                            <div className="flex items-center text-amber-600 text-xs font-medium">
                              <span className="mr-1">-</span>
                              <span>Stable</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(student.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Details Panel */}
        <div>
          {loadingDetails ? (
            <Card>
              <CardContent className="py-12 flex justify-center">Loading details...</CardContent>
            </Card>
          ) : selectedStudent && studentDetails ? (
            <Card>
              <CardHeader>
                <CardTitle>{studentDetails.name}</CardTitle>
                <CardDescription>
                  {studentDetails.class}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-muted-foreground mb-1">Attendance</div>
                    <div className="text-2xl font-bold">{studentDetails.attendance}%</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-muted-foreground mb-1">Overall Grade</div>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        (studentDetails.tests.avgScore * 0.4) +
                        (studentDetails.assignments.avgScore * 0.3) +
                        (studentDetails.attendance * 0.3)
                      )}%
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Progress Trend</h4>
                  <div className="h-28 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
                    <TrendingUp className="h-10 w-10 text-slate-300 transform -rotate-12 absolute right-4 bottom-4" />
                    <svg className="w-full h-full px-4" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <path d="M0 25 Q 25 20, 50 15 T 100 5" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400" />
                    </svg>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Tutor Notes</h4>
                  <div className="bg-slate-100 p-3 rounded-md text-sm">
                    {studentDetails.notes || "No notes available for this student."}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Recent Progress</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {studentDetails.history.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No recent activity</div>
                    ) : studentDetails.history.map((item) => (
                      <div key={item.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.type} • {new Date(item.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center justify-center bg-black text-white text-[10px] font-bold px-2 py-1 rounded min-w-[50px]">
                            {item.score}/{item.maxScore}
                          </div>
                        </div>
                        <div className="text-sm mt-2">
                          {item.feedback || "No feedback"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleAddNote(studentDetails.id)}
                  >
                    <FileText className="h-4 w-4 mr-1" /> Add Note
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleContactStudent(studentDetails.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" /> Contact
                  </Button>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleGenerateReport(studentDetails.id)}
                >
                  Generate Progress Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Student Details</CardTitle>
                <CardDescription>
                  Select a student to view detailed progress
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No student selected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Click on "Details" next to a student to view their progress
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}