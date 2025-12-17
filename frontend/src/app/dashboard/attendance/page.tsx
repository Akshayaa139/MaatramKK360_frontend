"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Search, Download, Check, X, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";

interface Student {
  _id: string;
  name: string;
  status: "present" | "absent";
  joinTime?: string;
  leaveTime?: string;
  duration?: string;
}

interface AttendanceRecord {
  _id: string;
  className: string;
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  students: Student[];
}

interface Class {
  _id: string;
  title: string;
}

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get("/classes/tutor");
        setClasses(response.data);
      } catch (err) {
        setError("Failed to fetch classes.");
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedClass !== 'all' && selectedDate) {
      const fetchAttendance = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get(`/attendance/${selectedClass}?date=${selectedDate}`);
          const studentsRaw: any[] = Array.isArray(response.data) ? response.data : [];
          const students: Student[] = studentsRaw.map((s:any)=>({ _id: String(s._id), name: s.user?.name || 'Student', status: (Array.isArray(s.attendance)? (s.attendance.find((a:any)=>String(a.class)===selectedClass)?.status || 'absent') : 'absent') }));
          const presentCount = students.filter(s=>s.status==='present').length;
          const absentCount = students.length - presentCount;
          const record: AttendanceRecord = { _id: selectedClass, className: classes.find(c=>c._id===selectedClass)?.title || 'Class', date: selectedDate, totalStudents: students.length, presentCount, absentCount, students };
          setAttendanceRecord(record);
        } catch (err) {
          setError("Failed to fetch attendance data.");
          setAttendanceRecord(null);
        } finally {
          setLoading(false);
        }
      };
      fetchAttendance();
    }
  }, [selectedClass, selectedDate, classes]);

  const handleMarkAttendance = async (studentId: string, status: "present" | "absent") => {
    if (!selectedClass || !selectedDate) return;

    try {
      await api.put(`/attendance/${selectedClass}`, {
        attendanceData: [{ studentId, status }],
      });

      // Optimistically update the UI
      setAttendanceRecord((prevRecord) => {
        if (!prevRecord) return null;

        const updatedStudents = prevRecord.students.map((student) =>
          student._id === studentId ? { ...student, status } : student
        );

        const presentCount = updatedStudents.filter((s) => s.status === "present").length;
        const absentCount = updatedStudents.length - presentCount;

        return {
          ...prevRecord,
          students: updatedStudents,
          presentCount,
          absentCount,
        };
      });
    } catch (err) {
      setError("Failed to update attendance.");
    }
  };

  const handleExportAttendance = () => {
    // Logic to export attendance data
    console.log("Exporting attendance data");
  };

  const filteredStudents = attendanceRecord
    ? attendanceRecord.students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Attendance Tracking</h2>
        <Button onClick={handleExportAttendance}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Attendance Management</CardTitle>
          <CardDescription>
            View and manage attendance for your classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="space-y-2">
              <Label htmlFor="class-select">Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Select a class" />
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
            
            <div className="space-y-2">
              <Label htmlFor="date-select">Select Date</Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
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
          
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {attendanceRecord ? (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-50">
                  <CardHeader className="pb-2">
                    <CardDescription>Present</CardDescription>
                    <CardTitle className="text-2xl text-green-600">
                      {attendanceRecord.presentCount} / {attendanceRecord.totalStudents}
                    </CardTitle>
                  </CardHeader>
                </Card>
                
                <Card className="bg-red-50">
                  <CardHeader className="pb-2">
                    <CardDescription>Absent</CardDescription>
                    <CardTitle className="text-2xl text-red-600">
                      {attendanceRecord.absentCount} / {attendanceRecord.totalStudents}
                    </CardTitle>
                  </CardHeader>
                </Card>
                
                <Card className="bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardDescription>Attendance Rate</CardDescription>
                    <CardTitle className="text-2xl text-blue-600">
                      {Math.round((attendanceRecord.presentCount / attendanceRecord.totalStudents) * 100)}%
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Time</TableHead>
                      <TableHead>Leave Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          {student.status === "present" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" /> Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <X className="h-3 w-3 mr-1" /> Absent
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{student.joinTime || "-"}</TableCell>
                        <TableCell>{student.leaveTime || "-"}</TableCell>
                        <TableCell>{student.duration || "-"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleMarkAttendance(student._id, "present")}
                            >
                              <Check className="h-3 w-3 mr-1" /> Mark Present
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleMarkAttendance(student._id, "absent")}
                            >
                              <X className="h-3 w-3 mr-1" /> Mark Absent
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No attendance records found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please select a class and date to view attendance records
                </p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
