"use client";

import { useState, useEffect } from "react";
// import { useSession } from "next-auth/react";
import { useTabSession } from "@/hooks/useTabSession";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, BookOpen, Loader2, AlertCircle, Video, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import api from "@/lib/api";

const nextDateForDay = (day: string) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const target = days.indexOf(day);
  if (target < 0) return new Date().toISOString();
  const now = new Date();
  const diff = (target - now.getDay() + 7) % 7;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  return next.toISOString();
};

interface Class {
  id: string;
  title: string;
  description: string;
  tutor: string;
  date: string;
  time: string;
  subject: string;
  participants?: number;
  maxParticipants?: number;
  status?: 'scheduled' | 'cancelled' | 'completed' | 'full';
  attendance?: 'present' | 'absent' | 'pending';
  recordingLink?: string;
  notesLink?: string;
  isEnrolled?: boolean;
  isLive?: boolean;
}

export default function ClassesPage() {
  const { data: session, status } = useTabSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<Class[]>([]);
  const [pastClasses, setPastClasses] = useState<Class[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<string[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [tutorFilter, setTutorFilter] = useState<string>('all');

  // Session Details
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classSessions, setClassSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      if (status !== 'authenticated') return;

      try {
        setIsLoading(true);
        // Auth handled by interceptor
        let res;
        if ((session as any)?.user?.role === 'admin' || (session as any)?.user?.role === 'lead') {
          res = await api.get('/classes/all');
        } else if ((session as any)?.user?.role === 'student') {
          res = await api.get('/students/classes');
        } else {
          res = await api.get('/classes/tutor');
        }
        const data = res.data || [];

        let mapped: Class[] = [];
        // Helper to map data based on source (Student API returns different shape)
        if ((session as any)?.user?.role === 'student') {
          mapped = data.map((c: any) => ({
            id: c.id || c._id,
            title: c.title,
            description: c.subject || '',
            tutor: c.tutor?.name || 'Unknown', // Student API returns { tutor: { name: ... } }
            date: c.schedule?.date || nextDateForDay(c.schedule?.day || ''),
            time: `${c.schedule?.startTime || ''} - ${c.schedule?.endTime || ''}`,
            subject: c.subject,
            status: c.status === 'completed' ? 'completed' : (c.status === 'cancelled' ? 'cancelled' : 'scheduled'),
            participants: undefined,
            maxParticipants: undefined,
            recordingLink: c.recordingLink,
            notesLink: c.notesLink,
            isEnrolled: c.isEnrolled,
            isLive: c.isLive,
          }));
          const enrolled = data.filter((c: any) => c.isEnrolled).map((c: any) => c.id || c._id);
          setEnrolledClasses(enrolled);
        } else {
          // Admin/Tutor default mapping
          mapped = data.map((c: any) => ({
            id: c._id,
            title: c.title,
            description: c.subject || '',
            tutor: c.tutor?.user?.name || (session as any)?.user?.name || 'Unknown',
            date: c.schedule?.date || nextDateForDay(c.schedule?.day || ''),
            time: `${c.schedule?.startTime || ''} - ${c.schedule?.endTime || ''}`,
            subject: c.subject,
            status: c.status === 'completed' ? 'completed' : (c.status === 'cancelled' ? 'cancelled' : 'scheduled'),
            participants: Array.isArray(c.students) ? c.students.length : undefined,
            maxParticipants: undefined,
            recordingLink: c.recordingLink,
            notesLink: c.notesLink,
            isLive: c.isLive,
          }));
        }

        const now = new Date();
        const upcoming: Class[] = [];
        const past: Class[] = [];

        mapped.forEach((m) => {
          // Parse start time to compare accurately
          try {
            // m.date is already an ISO string for the day
            const d = new Date(m.date);
            // m.time format "HH:mm - HH:mm"
            const endStr = m.time.split(' - ')[1];
            if (endStr) {
              const [hours, minutes] = endStr.split(':').map(Number);
              if (!isNaN(hours)) {
                d.setHours(hours, minutes || 0, 0, 0);
              }
            }

            // DEBUG LOGGING
            const isPast = d < now;
            console.log(`Class: ${m.title}, DateStr: ${m.date}, TimeStr: ${m.time}, ParsedDate: ${d.toString()}, Now: ${now.toString()}, IsPast: ${isPast}, Status: ${m.status}`);

            // If completed OR time has passed
            if (m.status === 'completed' || d < now) {
              past.push(m);
            } else {
              upcoming.push(m);
            }
          } catch (e) {
            // Fallback
            if (m.status === 'completed') past.push(m);
            else upcoming.push(m);
          }
        });

        setUpcomingClasses(upcoming);
        setPastClasses(past);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes. Please try again later.');
        toast({
          title: "Error",
          description: "Failed to load classes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [status]);

  const isAdmin = (session as any)?.user?.role === 'admin' || (session as any)?.user?.role === 'lead';
  const subjects = Array.from(new Set([...upcomingClasses, ...pastClasses].map(c => c.subject))).sort();
  const tutors = Array.from(new Set([...upcomingClasses, ...pastClasses].map(c => c.tutor))).sort();
  const filterMatch = (c: Class) => (subjectFilter === 'all' || c.subject === subjectFilter) && (tutorFilter === 'all' || c.tutor === tutorFilter);

  const handleEnroll = async (classId: string) => {
    try {
      // Replace with actual API call
      // await fetch(`/api/classes/${classId}/enroll`, { method: 'POST' });

      setEnrolledClasses(prev => [...prev, classId]);
      toast({
        title: "Success",
        description: "Successfully enrolled in the class",
      });
    } catch (err) {
      console.error('Error enrolling in class:', err);
      toast({
        title: "Error",
        description: "Failed to enroll in class",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = async (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDetailsModalOpen(true);
    setLoadingSessions(true);
    try {
      const res = await api.get(`/classes/${classItem.id}/sessions`);
      setClassSessions(res.data);
    } catch (e) {
      toast({ title: "Error", description: "Failed to fetch session details.", variant: "destructive" });
    } finally {
      setLoadingSessions(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>;
  }

  if (status === 'unauthenticated') {
    return <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-2">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
        <p className="text-lg font-medium">Authentication Required</p>
        <p>Please sign in to view your classes.</p>
      </div>
    </div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 bg-red-50 rounded-md">
      <p>{error}</p>
    </div>;
  }

  const ClassCardSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{isAdmin ? 'All Classes' : 'My Classes'}</h1>
      {isAdmin && (
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <select className="w-full md:w-40 rounded-md border px-3 py-2" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="all">All Subjects</option>
            {subjects.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <select className="w-full md:w-40 rounded-md border px-3 py-2" value={tutorFilter} onChange={(e) => setTutorFilter(e.target.value)}>
            <option value="all">All Tutors</option>
            {tutors.map(t => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
      )}

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
          <TabsTrigger value="past">Past Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <ClassCardSkeleton key={i} />)}
            </div>
          ) : upcomingClasses.filter(filterMatch).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No upcoming classes scheduled. Create your first class.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingClasses.filter(filterMatch).map((classItem) => (
                <Card key={classItem.id} className="flex flex-col h-full">
                  <CardHeader className="pb-2 flex-grow">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{classItem.title}</CardTitle>
                      <div className="flex gap-1">
                        {classItem.isLive && (
                          <Badge className="bg-red-600 hover:bg-red-700 animate-pulse">
                            LIVE
                          </Badge>
                        )}
                        <Badge
                          variant={
                            classItem.status === "full" ? "secondary" :
                              classItem.status === "cancelled" ? "destructive" : "default"
                          }
                        >
                          {classItem.status?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">{classItem.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="truncate">Tutor: {classItem.tutor}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{new Date(classItem.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{classItem.time}</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{classItem.subject}</span>
                      </div>
                      {classItem.participants !== undefined && classItem.maxParticipants !== undefined && (
                        <div className="pt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(classItem.participants / classItem.maxParticipants) * 100}%`
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {classItem.participants} of {classItem.maxParticipants} spots filled
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    {/* Show Enroll button if not enrolled and not admin */}
                    {!isAdmin && !enrolledClasses.includes(classItem.id) && (
                      <Button
                        className="flex-1 min-w-[120px]"
                        disabled={
                          classItem.status === "full" ||
                          classItem.status === "cancelled"
                        }
                        onClick={() => handleEnroll(classItem.id)}
                      >
                        {classItem.status === "full"
                          ? "Class Full"
                          : "Enroll Now"}
                      </Button>
                    )}

                    {/* Show Join button if enrolled and not admin */}
                    {enrolledClasses.includes(classItem.id) && !isAdmin && (
                      <Button
                        className={`flex-1 min-w-[120px] text-white ${classItem.isLive
                          ? "bg-red-600 hover:bg-red-700 animate-pulse shadow-lg"
                          : "bg-green-600 hover:bg-green-700"
                          }`}
                        asChild
                      >
                        <Link href={`/dashboard/meeting/${classItem.id}`}>
                          <Video className="h-4 w-4 mr-2" />
                          {classItem.isLive ? "JOIN LIVE NOW" : "Join Class"}
                        </Link>
                      </Button>
                    )}
                    <div className="flex flex-wrap gap-2 w-full pt-2">
                      {classItem.recordingLink && (
                        <Button variant="outline" className="flex-1 min-w-[120px] bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700" asChild>
                          <a
                            href={classItem.recordingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center font-medium"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Recording
                          </a>
                        </Button>
                      )}
                      {classItem.notesLink && (
                        <Button variant="outline" className="flex-1 min-w-[120px] bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700" asChild>
                          <a
                            href={classItem.notesLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center font-medium"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Class Notes
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <ClassCardSkeleton key={i} />)}
            </div>
          ) : pastClasses.filter(filterMatch).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No past classes found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastClasses.filter(filterMatch).map((classItem) => (
                <Card key={classItem.id} className="flex flex-col h-full">
                  <CardHeader className="pb-2 flex-grow">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{classItem.title}</CardTitle>
                      <Badge
                        variant={
                          classItem.attendance === "present"
                            ? "default"
                            : classItem.attendance === "absent"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {classItem.attendance?.toUpperCase() || "PENDING"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{classItem.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="truncate">Tutor: {classItem.tutor}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{new Date(classItem.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{classItem.time}</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{classItem.subject}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 mt-auto">
                    <Button variant="outline" className="flex-1 min-w-[100px]" onClick={() => handleViewDetails(classItem)}>
                      <Users className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <div className="flex flex-wrap gap-2 w-full pt-2">
                      {classItem.recordingLink && (
                        <Button variant="outline" className="flex-1 min-w-[120px] bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700" asChild>
                          <a
                            href={classItem.recordingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center font-medium"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Recording
                          </a>
                        </Button>
                      )}
                      {classItem.notesLink && (
                        <Button variant="outline" className="flex-1 min-w-[120px] bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700" asChild>
                          <a
                            href={classItem.notesLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center font-medium"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Class Notes
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
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
                          <Calendar className="h-4 w-4 text-muted-foreground" />
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
                      {(session.participantCount > 0 || isAdmin) && (
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
                      )}
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
    </div>
  );
}
