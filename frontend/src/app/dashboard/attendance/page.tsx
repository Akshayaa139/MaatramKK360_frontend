"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Search, Download, Check, X, AlertCircle, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

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
  students: any[];
}

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = (session as unknown as { accessToken?: string })?.accessToken;

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get("/classes/tutor");
        setClasses(response.data);
        // If no class selected, default to the first class for quicker workflow
        if (response.data && response.data.length > 0 && selectedClass === "all") {
          setSelectedClass(response.data[0]._id);
        }
      } catch (err) {
        setError("Failed to fetch classes.");
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      // Don't fetch until a valid class is selected
      if (!selectedClass || selectedClass === "all") {
        setAttendanceRecord(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      let existingAttendance: any[] = [];

      try {
        const response = await api.get(`/attendance/${selectedClass}?date=${selectedDate}`);
        existingAttendance = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.log("No existing attendance found, defaulting to empty list to allow marking.");
        existingAttendance = [];
      }
      console.log('DEBUG: Existing Attendance:', existingAttendance);

      try {
        // Get the selected class to access its full student list
        const currentClass = classes.find(c => c._id === selectedClass);

        if (!currentClass) {
          setLoading(false);
          return;
        }

        const allStudents = currentClass?.students || [];

        // Merge lists: Map all allocated students to attendance status
        const students: Student[] = allStudents
          .filter((s: any) => s && s._id) // Filter out nulls or invalid objects
          .map((classStudent: any) => {
            // Find if this student has an attendance record for this date
            const record = existingAttendance.find((r: any) => String(r._id) === String(classStudent._id) || String(r.user?._id) === String(classStudent._id));
            if (record) console.log(`DEBUG: Student ${classStudent.name} found in attendance list`, record);

            let status: "present" | "absent" = "absent";
            if (record) {
              if (record.status) status = record.status;
              else if (Array.isArray(record.attendance)) {
                // Fix: Find attendance record that matches BOTH class AND date
                const att = record.attendance.find((a: any) => {
                  console.log(`DEBUG: Checking attendance entry date: ${a.date} vs selected ${selectedDate}`);
                  if (String(a.class) !== selectedClass) return false;

                  // Safe comparison using ISO Strings (YYYY-MM-DD)
                  try {
                    const recordDateStr = new Date(a.date).toISOString().split('T')[0];
                    const selectedDateStr = selectedDate;
                    return recordDateStr === selectedDateStr;
                  } catch (e) {
                    return false;
                  }
                });

                if (att) status = att.status;
              }
            }

            return {
              _id: String(classStudent._id),
              name: classStudent.user?.name || classStudent.name || classStudent.email || 'Student',
              status: status
            };
          });

        const presentCount = students.filter(s => s.status === 'present').length;
        const absentCount = students.length - presentCount;

        const record: AttendanceRecord = {
          _id: selectedClass,
          className: currentClass?.title || 'Class',
          date: selectedDate,
          totalStudents: students.length,
          presentCount,
          absentCount,
          students
        };

        setAttendanceRecord(record);
      } catch (err) {
        console.error(err);
        setError("Failed to process attendance data.");
        setAttendanceRecord(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedClass, selectedDate, classes]);


  const handleMarkAttendance = async (studentId: string, status: "present" | "absent") => {
    if (!selectedClass || !selectedDate) return;

    try {
      await api.put(`/attendance/${selectedClass}`, {
        attendanceData: [{ studentId, status }],
        date: selectedDate
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
      toast({ title: status === 'present' ? 'Marked Present' : 'Marked Absent' });
    } catch (err) {
      setError("Failed to update attendance.");
      toast({ title: 'Error', description: 'Failed to update attendance', variant: 'destructive' });
    }
  };

  const handleBulkMark = async (status: "present" | "absent") => {
    if (!attendanceRecord || !selectedClass) return;
    const attendanceData = attendanceRecord.students.map((s) => ({ studentId: s._id, status }));

    try {
      await api.put(`/attendance/${selectedClass}`, { attendanceData, date: selectedDate });

      // Optimistically update UI
      setAttendanceRecord((prev) => {
        if (!prev) return prev;
        const updatedStudents = prev.students.map((s) => ({ ...s, status } as Student));
        const presentCount = updatedStudents.filter((s) => s.status === 'present').length;
        const absentCount = updatedStudents.length - presentCount;
        return { ...prev, students: updatedStudents, presentCount, absentCount };
      });

      toast({ title: status === 'present' ? 'All marked present' : 'All marked absent' });
    } catch (err) {
      setError('Failed to bulk update attendance.');
      toast({ title: 'Error', description: 'Failed to update attendance', variant: 'destructive' });
    }
  };

  const handleExportAttendance = async () => {
    if (!selectedClass) return;
    try {
      const response = await api.get(`/attendance/${selectedClass}/export`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_${selectedClass}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: "Attendance exported" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to export attendance", variant: "destructive" });
    }
  };

  const handleConfirm = () => {
    toast({ title: "Attendance Confirmed", description: "Attendance records are saved." });
    // Removed router.push to prevent navigating away
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportAttendance}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm Attendance
          </Button>
        </div>
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
                      {attendanceRecord.totalStudents
                        ? Math.round((attendanceRecord.presentCount / attendanceRecord.totalStudents) * 100) + "%"
                        : "0%"}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="flex justify-end space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkMark('present')} disabled={loading || !attendanceRecord}>
                  Mark All Present
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkMark('absent')} disabled={loading || !attendanceRecord}>
                  Mark All Absent
                </Button>
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
                              variant={student.status === 'present' ? 'default' : 'outline'}
                              size="sm"
                              className={student.status === 'present' ? 'bg-green-600 hover:bg-green-700' : 'hover:text-green-600 hover:border-green-600'}
                              onClick={() => student.status !== 'present' && handleMarkAttendance(student._id, "present")}
                              disabled={student.status === 'present'}
                            >
                              <Check className="h-3 w-3 mr-1" /> {student.status === 'present' ? 'Present' : 'Mark Present'}
                            </Button>
                            <Button
                              variant={student.status === 'absent' ? 'default' : 'outline'}
                              size="sm"
                              className={student.status === 'absent' ? 'bg-red-600 hover:bg-red-700' : 'hover:text-red-600 hover:border-red-600'}
                              onClick={() => student.status !== 'absent' && handleMarkAttendance(student._id, "absent")}
                              disabled={student.status === 'absent'}
                            >
                              <X className="h-3 w-3 mr-1" /> {student.status === 'absent' ? 'Absent' : 'Mark Absent'}
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
