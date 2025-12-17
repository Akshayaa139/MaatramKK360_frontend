"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock, AlertCircle, Calendar as CalendarIcon2, Users, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import api from "@/lib/api";

export default function ReschedulePage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reason, setReason] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [upcomingSessions, setUpcomingSessions] = useState<{ id: string; title: string; date: string; time: string; students: number; status: string }[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    const load = async () => {
      try {
        const [sessionsRes, profileRes] = await Promise.all([
          api.get('/tutor/sessions/upcoming', { headers }),
          api.get('/tutor/profile', { headers })
        ]);
        const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
        setUpcomingSessions(sessions.map((s:any)=>({ id:String(s.id||s._id), title:s.title, date: new Date().toISOString().split('T')[0], time: `${s.time||''}`, students: 0, status: s.status||'scheduled' })));
        const tdoc = profileRes.data?.tutor;
        const slots = Array.isArray(tdoc?.availability) ? tdoc.availability.map((a:any)=>`${a.startTime} - ${a.endTime}`) : [];
        setAvailableTimeSlots(Array.from(new Set(slots)));
      } catch {}
    };
    load();
  }, [accessToken]);
  
  const handleReschedule = async () => {
    if (!selectedClass || !date || !selectedTime) return;
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    const [start, end] = selectedTime.split(' - ');
    const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    try {
      await api.put(`/classes/${selectedClass}/schedule`, { day, startTime: start, endTime: end, status: 'rescheduled' }, { headers });
      const sessionsRes = await api.get('/tutor/sessions/upcoming', { headers });
      const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      setUpcomingSessions(sessions.map((s:any)=>({ id:String(s.id||s._id), title:s.title, date: new Date().toISOString().split('T')[0], time: `${s.time||''}`, students: 0, status: s.status||'scheduled' })));
      setSelectedClass("");
      setSelectedTime("");
      setReason("");
    } catch {}
  };
  
  const handleCancel = async (sessionId: string) => {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    try {
      await api.put(`/classes/${sessionId}/schedule`, { status: 'cancelled' }, { headers });
      const sessionsRes = await api.get('/tutor/sessions/upcoming', { headers });
      const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      setUpcomingSessions(sessions.map((s:any)=>({ id:String(s.id||s._id), title:s.title, date: new Date().toISOString().split('T')[0], time: `${s.time||''}`, students: 0, status: s.status||'scheduled' })));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Reschedule or Cancel Sessions</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Reschedule Form */}
        <Card>
          <CardHeader>
            <CardTitle>Reschedule a Session</CardTitle>
            <CardDescription>
              Select a class and new date/time to reschedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class-select">Select Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class-select">
                    <SelectValue placeholder="Select a class to reschedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {upcomingSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.title} - {new Date(session.date).toLocaleDateString()} ({session.time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>New Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time-select">New Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger id="time-select">
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map((timeSlot) => (
                      <SelectItem key={timeSlot} value={timeSlot}>
                        {timeSlot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Rescheduling</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for rescheduling this session"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              
              <Button type="button" className="w-full" onClick={handleReschedule}>
                Reschedule Session
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>
              View and manage your upcoming scheduled sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.title}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <CalendarIcon2 className="h-4 w-4 mr-2 text-muted-foreground" />
                              {new Date(session.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center mt-1">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              {session.time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            {session.students} students
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancel(session.id)}
                          >
                            <X className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No upcoming sessions</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have any scheduled sessions
                </p>
              </div>
            )}
            
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Important Notice</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Rescheduling or cancelling a session less than 24 hours before the scheduled time may affect your tutor rating. Please ensure you provide adequate notice.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
