"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Video, FileText, MessageSquare, Loader2, Link as LinkIcon, Edit2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

interface Class {
  _id: string;
  title: string;
  description: string;
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
  };
  students: any[];
  status: string;
  materials?: string[];
  attendance?: number;
  feedback?: number;
  sessionLink?: string;
  nextDate?: Date;
}

const getNextClassDate = (dayName: string, startTime: string): Date => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIdx = days.indexOf(dayName);
  if (targetDayIdx === -1) return new Date();

  const now = new Date();
  const currentDayIdx = now.getDay();
  const [hours, minutes] = startTime.split(':').map(Number);

  let diff = targetDayIdx - currentDayIdx;

  if (diff === 0) {
    const classTime = new Date(now);
    classTime.setHours(hours, minutes, 0, 0);
    if (classTime < now) {
      diff = 7;
    }
  } else if (diff < 0) {
    diff += 7;
  }

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + diff);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
};

export default function MyClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start Class Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [meetingLink, setMeetingLink] = useState("");

  // Create Class Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    title: "",
    subject: "",
    description: "",
    day: "Monday",
    startTime: "",
    endTime: ""
  });

  // Assign All Students Feature State
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [assignAllStudents, setAssignAllStudents] = useState(false);

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
      nextDate: getNextClassDate(c.schedule.day, c.schedule.startTime)
    }))
    .sort((a, b) => (a.nextDate?.getTime() || 0) - (b.nextDate?.getTime() || 0));

  const pastClasses = classes.filter(c => c.status === 'completed' || c.status === 'cancelled');

  const handleStartClassClick = async (classItem: Class) => {
    const isInvalid = !classItem.sessionLink || classItem.sessionLink.includes("meet.google.com/kk-class-");

    if (isInvalid) {
      try {
        toast({ title: "Starting Class...", description: "Generating secure video room..." });
        const res = await api.post(`/classes/${classItem._id}/start`, {});
        const newLink = res.data?.sessionLink;
        if (newLink) {
          window.open(newLink, '_blank');
          fetchClasses();
        }
      } catch (e) {
        toast({ title: "Error", description: "Failed to auto-start class.", variant: "destructive" });
      }
    } else {
      window.open(classItem.sessionLink, '_blank');
      api.post(`/classes/${classItem._id}/start`, { sessionLink: classItem.sessionLink }).catch(console.error);
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
    if (!newClass.title || !newClass.subject || !newClass.day || !newClass.startTime || !newClass.endTime) {
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
      setNewClass({ title: "", subject: "", description: "", day: "Monday", startTime: "", endTime: "" });
      setAssignAllStudents(false);
      fetchClasses();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create class.", variant: "destructive" });
    }
  };

  const handleCancelClass = (classId: string) => {
    console.log(`Cancelling class ${classId}`);
  };

  const handleViewDetails = (classId: string) => {
    console.log(`Viewing details for class ${classId}`);
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
    <div className="space-y-6">
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
                <Card key={classItem._id} className="flex flex-col h-full border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{classItem.title}</CardTitle>
                      <Badge variant={
                        classItem.nextDate && classItem.nextDate.getDate() === new Date().getDate()
                          ? "default"
                          : "secondary"
                      }>
                        {classItem.nextDate && classItem.nextDate.getDate() === new Date().getDate() ? "Today" : "Upcoming"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{classItem.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 flex-grow">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-semibold text-foreground">
                          {classItem.nextDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
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
                  <CardFooter className="flex gap-2 pt-2">
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
                <Card key={classItem._id} className="flex flex-col h-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{classItem.title}</CardTitle>
                      <Badge variant="secondary">{classItem.status}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{classItem.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 flex-grow">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{classItem.schedule.day}</span>
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
                  <CardFooter className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleViewDetails(classItem._id)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
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
              <Label htmlFor="day" className="text-right">
                Day
              </Label>
              <Select
                value={newClass.day}
                onValueChange={(val) => setNewClass({ ...newClass, day: val })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </div>
  );
}
