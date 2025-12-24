"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, TrendingUp, Clock, Calendar, Users, FileText } from "lucide-react";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type Student = {
  id: string;
  name: string;
  email: string;
  grade: string;
  status: string;
  subjects: string[];
  attendanceRate: number;
  upcomingClasses: number;
  completedClasses: number;
};

export default function StudentsPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const authHeader = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
        const res = await api.get('/admin/students/all', { headers: authHeader });
        setStudents(res.data || []);
      } catch {
        setStudents([]);
      }
    };
    load();
  }, [session]);

  const subjects = Array.from(new Set(students.flatMap(s => s.subjects))).sort();
  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleViewDetails = async (studentId: string) => {
    setLoadingDetails(true);
    try {
      const authHeader = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
      const res = await api.get(`/admin/students/${studentId}/details`, { headers: authHeader });
      setSelectedStudent(res.data);
      setIsDetailsOpen(true);
    } catch (e) {
      console.error("Failed to fetch details", e);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Program Students</CardTitle>
          <CardDescription>All enrolled students with key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {subjects.map((sub) => (
                <Badge key={sub} variant="secondary">{sub}</Badge>
              ))}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <Card key={s.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{s.name}</CardTitle>
                  <CardDescription>{s.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>Grade: {s.grade}</span>
                  </div>
                  <div className="text-sm">Subjects: {s.subjects.join(', ')}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>Attendance: {s.attendanceRate}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Upcoming: {s.upcomingClasses}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Completed: {s.completedClasses}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => handleViewDetails(s.id)}>View details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Student Details - {selectedStudent?.basic?.name}</DialogTitle>
              </DialogHeader>
              {loadingDetails ? (
                <div className="py-8 text-center">Loading details...</div>
              ) : selectedStudent ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-slate-50">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Basic Info</CardTitle></CardHeader>
                      <CardContent className="text-sm">
                        <div>{selectedStudent.basic?.email}</div>
                        <div>{selectedStudent.basic?.phone}</div>
                        <div className="font-medium mt-1">Grade: {selectedStudent.basic?.grade}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Academic</CardTitle></CardHeader>
                      <CardContent className="text-sm">
                        <div>Attendance: {selectedStudent.attendanceRate}%</div>
                        <div>Mid Term: {selectedStudent.strength?.midTerm || '-'}</div>
                        <div>Quarterly: {selectedStudent.strength?.quarterly || '-'}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Subjects</CardTitle></CardHeader>
                      <CardContent className="text-sm">
                        <div className="flex flex-wrap gap-1">
                          {(selectedStudent.basic?.subjects || []).map((s: string) => (
                            <Badge key={s} variant="outline" className="bg-white">{s}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Recent History
                      </h4>
                      <ScrollArea className="h-[200px] border rounded-md p-3">
                        {selectedStudent.history && selectedStudent.history.length > 0 ? (
                          <div className="space-y-3">
                            {selectedStudent.history.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-start border-b pb-2 last:border-0">
                                <div>
                                  <div className="text-sm font-medium">{item.title}</div>
                                  <div className="text-xs text-muted-foreground">{item.type} • {new Date(item.date).toLocaleDateString()}</div>
                                </div>
                                <Badge variant={item.score >= 70 ? "secondary" : "destructive"}>
                                  {item.score}/{item.maxScore}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No recent history available.</div>
                        )}
                      </ScrollArea>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Tutor Notes
                      </h4>
                      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 h-[200px] overflow-y-auto">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedStudent.notes || "No notes recorded for this student."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              ) : null}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div >
  );
}
