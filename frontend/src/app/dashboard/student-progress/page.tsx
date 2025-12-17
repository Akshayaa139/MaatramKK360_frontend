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
      (selectedClass === "all" || student.class === selectedClass) &&
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleAddNote = (studentId: string) => {
    console.log(`Adding note for student ${studentId}`);
    // Future implementation: Open modal to POST note
  };

  const handleContactStudent = (studentId: string) => {
    console.log(`Contacting student ${studentId}`);
    // Future implementation
  };

  const handleGenerateReport = (studentId: string) => {
    console.log(`Generating report for student ${studentId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Student Progress Tracking</h2>
        <Button>
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
                            <span>{student.assignments.completed}/{student.assignments.total}</span>
                            <span className="text-xs text-muted-foreground">Avg: {student.assignments.avgScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{student.tests.completed}/{student.tests.total}</span>
                            <span className="text-xs text-muted-foreground">Avg: {student.tests.avgScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.trend === "up" && (
                            <div className="flex items-center text-green-600">
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              <span>Improving</span>
                            </div>
                          )}
                          {student.trend === "down" && (
                            <div className="flex items-center text-red-600">
                              <ArrowDownRight className="h-4 w-4 mr-1" />
                              <span>Declining</span>
                            </div>
                          )}
                          {student.trend === "stable" && (
                            <div className="flex items-center text-amber-600">
                              <Minus className="h-4 w-4 mr-1" />
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
                  <div className="bg-slate-100 p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Attendance</div>
                    <div className="text-2xl font-bold">{studentDetails.attendance}%</div>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Overall Grade</div>
                    <div className="text-2xl font-bold">
                      {Math.round((studentDetails.assignments.avgScore + studentDetails.tests.avgScore) / 2)}%
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Progress Trend</h4>
                  <div className="h-24 bg-slate-100 rounded-md flex items-center justify-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground" />
                    {/* Placeholder for actual chart */}
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
                          <Badge variant={item.score >= 85 ? "default" : item.score >= 70 ? "outline" : "destructive"}>
                            {item.score}/{item.maxScore}
                          </Badge>
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