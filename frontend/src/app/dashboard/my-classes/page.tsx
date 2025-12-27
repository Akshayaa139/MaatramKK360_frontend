"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Users, Video, FileText, MessageSquare, Loader2, Link as LinkIcon, Edit2, Plus, Check, X, UserCheck, XCircle, CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

interface Class {
  _id: string;
  title: string;
  description: string;
  schedule: {
    day: string;
    date?: string;
    startTime: string;
    endTime: string;
  };
  students: any[];
  status: string;
  materials?: string[];
  attendance?: number;
  feedback?: number;
  sessionLink?: string;
  recordingLink?: string;
  notesLink?: string;
  nextDate?: Date;
  isLive?: boolean;
}

const getNextClassDate = (dayName: string, startTime: string, endTime: string, classDate?: string): Date => {
  const [hours, minutes] = startTime.split(':').map(Number);

  if (classDate) {
    const d = new Date(classDate);
    d.setHours(hours || 0, minutes || 0, 0, 0);
    return d;
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIdx = days.indexOf(dayName);
  if (targetDayIdx === -1) return new Date();

  const now = new Date();
  const currentDayIdx = now.getDay();
  // ... rest same
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  let diff = targetDayIdx - currentDayIdx;

  if (diff === 0) {
    const classEndTime = new Date(now);
    classEndTime.setHours(endHours || 23, endMinutes || 59, 0, 0);

    if (classEndTime < now) {
      diff = 7;
    }
  } else if (diff < 0) {
    diff += 7;
  }

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + diff);
  nextDate.setHours(hours || 0, minutes || 0, 0, 0);
  return nextDate;
};

const getLastClassDate = (dayName: string, startTime: string, endTime: string, classDate?: string): Date | null => {
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  if (classDate) {
    const d = new Date(classDate);
    d.setHours(endHours || 23, endMinutes || 59, 0, 0);
    const now = new Date();
    if (d < now) return d;
    return null;
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIdx = days.indexOf(dayName);
  const now = new Date();
  const currentDayIdx = now.getDay();

  // Calculate if a session finished TODAY
  if (currentDayIdx === targetDayIdx) {
    const classEndTime = new Date(now);
    classEndTime.setHours(endHours || 23, endMinutes || 59, 0, 0);

    if (classEndTime < now) {
      // It finished today
      return classEndTime;
    }
  }
  return null;
}

export default function MyClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start Class Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [meetingLink, setMeetingLink] = useState("");

  // Edit Links (Recording/Notes) State
  const [isEditLinksModalOpen, setIsEditLinksModalOpen] = useState(false);
  const [editingLinksClass, setEditingLinksClass] = useState<Class | null>(null);
  const [recordingLink, setRecordingLink] = useState("");
  const [notesLink, setNotesLink] = useState("");
  const [savingLinks, setSavingLinks] = useState(false);

  // Create Class Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClass, setNewClass] = useState<{
    title: string;
    subject: string;
    description: string;
    day: string;
    date: Date | undefined;
    startTime: string;
    endTime: string;
  }>({
    title: "",
    subject: "",
    description: "",
    day: "Monday",
    date: undefined,
    startTime: "",
    endTime: ""
  });

  // Assign All Students Feature State
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [assignAllStudents, setAssignAllStudents] = useState(false);

  // Attendance Modal State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceClass, setAttendanceClass] = useState<Class | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, "present" | "absent">>({});
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(null);

  // Session Details State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [classSessions, setClassSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchStudents();
    }
  }, [isCreateModalOpen]);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/tutor/students");
      setAvailableStudents(res.data || []);
    } catch (e) {
      console.error("Failed to fetch students");
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get("/classes/tutor");
      setClasses(response.data);
    } catch (err) {
      setError("Failed to fetch classes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const upcomingClasses = classes
    .filter(c => c.status === 'scheduled' || c.status === 'rescheduled')
    .map(c => ({
      ...c,
      nextDate: getNextClassDate(c.schedule.day, c.schedule.startTime, c.schedule.endTime, c.schedule.date)
    }))
    .sort((a, b) => (a.nextDate?.getTime() || 0) - (b.nextDate?.getTime() || 0));

  // Determine "Virtual" Past Classes (Active classes that finished today)
  const virtualPastClasses = classes
    .filter(c => c.status === 'scheduled' || c.status === 'rescheduled')
    .map(c => {
      const lastDate = getLastClassDate(c.schedule.day, c.schedule.startTime, c.schedule.endTime, c.schedule.date);
      if (lastDate) {
        return { ...c, status: 'completed', nextDate: lastDate, _virtual: true };
      }
      return null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const pastClasses = [
    ...classes.filter(c => c.status === 'completed' || c.status === 'cancelled'),
    ...virtualPastClasses
  ].filter(c => !!c).sort((a, b) => {
    const timeA = a!.nextDate ? new Date(a!.nextDate).getTime() : 0;
    const timeB = b!.nextDate ? new Date(b!.nextDate).getTime() : 0;
    return timeB - timeA;
  }); // Sort newest first

  const handleStartClassClick = async (classItem: Class) => {
    // Open attendance modal immediately
    setAttendanceClass(classItem);
    setIsAttendanceModalOpen(true);
    setAttendanceStatus({}); // Reset local status

    // Navigate to internal meeting page
    router.push(`/dashboard/meeting/${classItem._id}`);
  };

  const handleMarkAttendance = async (studentId: string, status: "present" | "absent") => {
    if (!attendanceClass) return;
    setMarkingAttendance(studentId);
    try {
      // Optimistic update
      setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));

      await api.put(`/attendance/${attendanceClass._id}`, {
        attendanceData: [{ studentId, status: status }],
        date: new Date().toISOString().split('T')[0] // Ensure date is sent if needed by backend API logic
      });

      toast({ title: status === 'present' ? "Marked Present" : "Marked Absent", duration: 1000 });
    } catch (error) {
      console.error("Failed to mark attendance", error);
      toast({ title: "Error", description: "Failed to save attendance.", variant: "destructive" });
      // Revert on failure
      setAttendanceStatus(prev => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
    } finally {
      setMarkingAttendance(null);
    }
  };

  const handleEditLink = (classItem: Class, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClass(classItem);
    setMeetingLink(classItem.sessionLink || "");
    setIsLinkModalOpen(true);
  };

  const handleSaveAndStart = async () => {
    if (!selectedClass) return;
    if (!meetingLink) {
      toast({ title: "Link required", description: "Please enter a valid meeting link.", variant: "destructive" });
      return;
    }

    try {
      const res = await api.post(`/classes/${selectedClass._id}/start`, { sessionLink: meetingLink });
      const finalLink = res.data?.sessionLink || meetingLink;

      setIsLinkModalOpen(false);
      window.open(finalLink, '_blank');
      fetchClasses();
      toast({ title: "Class Started", description: "Meeting link saved and attendance tracking started." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to start class.", variant: "destructive" });
    }
  };

  const handleCreateClass = async () => {
    // Validation
    if (!newClass.title || !newClass.subject || (!newClass.day && !newClass.date) || !newClass.startTime || !newClass.endTime) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    const payload = {
      ...newClass,
      students: assignAllStudents ? availableStudents.map(s => s._id) : []
    };

    try {
      await api.post("/classes", payload);
      toast({ title: "Success", description: `Class created with ${payload.students.length} students assigned.` });
      setIsCreateModalOpen(false);
      // Reset form
      setNewClass({ title: "", subject: "", description: "", day: "Monday", date: undefined, startTime: "", endTime: "" });
      setAssignAllStudents(false);
      fetchClasses();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create class.", variant: "destructive" });
    }
  };

  const handleCancelClass = (classId: string) => {
    console.log(`Cancelling class ${classId}`);
  };

  const handleViewDetails = async (classId: string) => {
    setSelectedClass(classes.find(c => c._id === classId) || null);
    setIsDetailsModalOpen(true);
    setLoadingSessions(true);
    try {
      const res = await api.get(`/classes/${classId}/sessions`);
      setClassSessions(res.data);
    } catch (e) {
      toast({ title: "Error", description: "Failed to fetch session details.", variant: "destructive" });
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleOpenEditLinks = (cls: Class) => {
    setEditingLinksClass(cls);
    setRecordingLink(cls.recordingLink || "");
    setNotesLink(cls.notesLink || "");
    setIsEditLinksModalOpen(true);
  };

  const handleSaveLinks = async () => {
    if (!editingLinksClass) return;
    setSavingLinks(true);
    try {
      await api.put(`/classes/${editingLinksClass._id}/schedule`, {
        recordingLink,
        notesLink
      });
      toast({ title: "Success", description: "Links updated successfully." });
      setIsEditLinksModalOpen(false);
      fetchClasses();
    } catch (e) {
      toast({ title: "Error", description: "Failed to update links.", variant: "destructive" });
    } finally {
      setSavingLinks(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-10 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">My Classes</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create New Class
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
          <TabsTrigger value="past">Past Classes</TabsTrigger>
        </TabsList>

        {/* Upcoming Classes Tab */}
        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No upcoming classes scheduled.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingClasses.map((classItem) => (
                <Card key={classItem._id} className="flex flex-col h-full border-l-4 border-l-primary overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{classItem.title}</CardTitle>
                      <div className="flex gap-1">
                        {classItem.isLive && (
                          <Badge className="bg-red-600 hover:bg-red-700 animate-pulse text-white">
                            LIVE
                          </Badge>
                        )}
                        <Badge variant={
                          classItem.nextDate && classItem.nextDate.getDate() === new Date().getDate()
                            ? "default"
                            : "secondary"
                        }>
                          {classItem.nextDate && classItem.nextDate.getDate() === new Date().getDate() ? "Today" : "Upcoming"}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">{classItem.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-semibold text-foreground">
                          {classItem.schedule.date
                            ? new Date(classItem.schedule.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                            : classItem.nextDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                          }
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{classItem.schedule.startTime} - {classItem.schedule.endTime}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{classItem.students.length} students</span>
                      </div>
                      {classItem.sessionLink && (
                        <div className="flex items-center text-blue-600 overflow-hidden">
                          <LinkIcon className="h-3 w-3 mr-2 shrink-0" />
                          <span className="truncate text-xs">{classItem.sessionLink}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-4">
                    <Button
                      className="flex-1"
                      onClick={() => handleStartClassClick(classItem)}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Start Class
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEditLink(classItem, e)}
                      title="Edit Link"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCancelClass(classItem._id)}
                    >
                      Cancel
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Past Classes Tab */}
        <TabsContent value="past" className="space-y-4 mt-4">
          {pastClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No past classes found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastClasses.map((classItem) => (
                <Card key={classItem._id} className="flex flex-col h-full overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{classItem.title}</CardTitle>
                      <Badge variant="secondary">{classItem.status}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{classItem.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{classItem.schedule.date ? format(new Date(classItem.schedule.date), "PPP") : classItem.schedule.day}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{classItem.schedule.startTime} - {classItem.schedule.endTime}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Attendance: {classItem.attendance || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[120px]"
                      onClick={() => handleViewDetails(classItem._id)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[120px]"
                      onClick={() => handleOpenEditLinks(classItem)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Add Links
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Start Class Dialog */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Class Meeting</DialogTitle>
            <DialogDescription>
              To start this class, please enter a valid Google Meet or Zoom link.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link">Meeting URL</Label>
              <Input
                id="link"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAndStart}>Save & Start Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>
              Set up a new recurring class schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                className="col-span-3"
                value={newClass.title}
                onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                placeholder="e.g. Physics Grade 12"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input
                id="subject"
                className="col-span-3"
                value={newClass.subject}
                onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                placeholder="e.g. Physics"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newClass.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {newClass.date ? format(newClass.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newClass.date}
                      onSelect={(date) => setNewClass(prev => ({ ...prev, date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start" className="text-right">
                Start Time
              </Label>
              <Input
                id="start"
                type="time"
                className="col-span-3"
                value={newClass.startTime}
                onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end" className="text-right">
                End Time
              </Label>
              <Input
                id="end"
                type="time"
                className="col-span-3"
                value={newClass.endTime}
                onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Students</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="assignAll"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={assignAllStudents}
                  onChange={(e) => setAssignAllStudents(e.target.checked)}
                />
                <label htmlFor="assignAll" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Assign to all my students ({availableStudents.length})
                </label>
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateClass}>Create Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Modal */}
      <Dialog open={isAttendanceModalOpen} onOpenChange={setIsAttendanceModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mark Attendance - {attendanceClass?.title}</DialogTitle>
            <DialogDescription>
              Mark students explicitly as present or absent.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4">
            {attendanceClass?.students && attendanceClass.students.length > 0 ? (
              attendanceClass.students.map((student: any) => (
                <div key={student._id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex flex-col">
                    <span className="font-medium">{student.user?.name || student.name || student.email || "Student"}</span>
                    <span className="text-xs text-muted-foreground">ID: {student.studentId || "N/A"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={attendanceStatus[student._id] === 'present' ? "default" : "outline"}
                      className={attendanceStatus[student._id] === 'present' ? "bg-green-600 hover:bg-green-700" : "hover:text-green-600 hover:border-green-600"}
                      onClick={() => handleMarkAttendance(student._id, 'present')}
                      disabled={markingAttendance === student._id}
                    >
                      {markingAttendance === student._id && attendanceStatus[student._id] === 'present' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={attendanceStatus[student._id] === 'absent' ? "default" : "outline"}
                      className={attendanceStatus[student._id] === 'absent' ? "bg-red-600 hover:bg-red-700" : "hover:text-red-600 hover:border-red-600"}
                      onClick={() => handleMarkAttendance(student._id, 'absent')}
                      disabled={markingAttendance === student._id}
                    >
                      {markingAttendance === student._id && attendanceStatus[student._id] === 'absent' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-1" />
                      )}
                      Absent
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No students assigned to this class.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsAttendanceModalOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Session Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Session History - {selectedClass?.title}</DialogTitle>
            <DialogDescription>
              View when the class started, ended, and who attended.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4">
            {loadingSessions ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
            ) : classSessions.length > 0 ? (
              <div className="space-y-4">
                {classSessions.map((session) => (
                  <Card key={session._id} className="border border-muted">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <Badge variant={session.status === 'completed' ? "secondary" : "default"}>
                          {session.status === 'completed' ? "Completed" : "Ongoing"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Start Time</span>
                          <span>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> End Time</span>
                          <span>{session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <span className="text-muted-foreground flex items-center gap-1 mb-2"><Users className="h-3 w-3" /> Participants ({session.participantCount})</span>
                        <div className="flex flex-wrap gap-1">
                          {session.participants.length > 0 ? (
                            session.participants.map((name: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{name}</Badge>
                            ))
                          ) : (
                            <span className="text-xs italic text-muted-foreground">No students logged</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No session history found for this class.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Links Modal */}
      <Dialog open={isEditLinksModalOpen} onOpenChange={setIsEditLinksModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource Links</DialogTitle>
            <DialogDescription>
              Provide links for the class recording and study notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recLink">Recording URL</Label>
              <Input
                id="recLink"
                placeholder="https://..."
                value={recordingLink}
                onChange={(e) => setRecordingLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notesLnk">Notes URL</Label>
              <Input
                id="notesLnk"
                placeholder="https://..."
                value={notesLink}
                onChange={(e) => setNotesLink(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditLinksModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLinks} disabled={savingLinks}>
              {savingLinks ? <Loader2 className="animate-spin" /> : "Save Links"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
