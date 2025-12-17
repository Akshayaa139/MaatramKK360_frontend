"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

const nextDateForDay = (day: string) => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
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
  recording?: string;
  notes?: string;
}

export default function ClassesPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<Class[]>([]);
  const [pastClasses, setPastClasses] = useState<Class[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<string[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [tutorFilter, setTutorFilter] = useState<string>('all');

  useEffect(() => {
    const fetchClasses = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setIsLoading(true);
        const authHeader = (session as any)?.accessToken ? { Authorization: `Bearer ${(session as any).accessToken}` } : undefined;
        let res;
        if ((session as any)?.user?.role === 'admin' || (session as any)?.user?.role === 'lead') {
          res = await api.get('/classes/all', { headers: authHeader });
        } else {
          res = await api.get('/classes/tutor', { headers: authHeader });
        }
        const data = res.data || [];
        const mapped: Class[] = data.map((c: any) => ({
          id: c._id,
          title: c.title,
          description: c.subject || '',
          tutor: c.tutor?.user?.name || (session as any)?.user?.name || 'Unknown',
          date: nextDateForDay(c.schedule?.day || ''),
          time: `${c.schedule?.startTime || ''} - ${c.schedule?.endTime || ''}`,
          subject: c.subject,
          status: c.status === 'completed' ? 'completed' : (c.status === 'cancelled' ? 'cancelled' : 'scheduled'),
          participants: Array.isArray(c.students) ? c.students.length : undefined,
          maxParticipants: undefined,
        }));
        const upcoming = mapped.filter(m => m.status !== 'completed');
        const past = mapped.filter(m => m.status === 'completed');
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
                      <Badge 
                        variant={
                          classItem.status === "full" ? "secondary" : 
                          classItem.status === "cancelled" ? "destructive" : "default"
                        }
                      >
                        {classItem.status?.toUpperCase()}
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
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      disabled={
                        classItem.status === "full" || 
                        classItem.status === "cancelled" ||
                        enrolledClasses.includes(classItem.id)
                      }
                      onClick={() => handleEnroll(classItem.id)}
                    >
                      {enrolledClasses.includes(classItem.id) 
                        ? "Enrolled" 
                        : classItem.status === "full"
                          ? "Class Full"
                          : "Enroll Now"}
                    </Button>
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
                  <CardFooter className="flex gap-2 mt-auto">
                    <Button variant="outline" className="flex-1" asChild>
                      <a 
                        href={classItem.recording} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
                        </svg>
                        Recording
                      </a>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <a 
                        href={classItem.notes} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Notes
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
