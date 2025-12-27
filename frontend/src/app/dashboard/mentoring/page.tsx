"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Search, Users, CheckCircle, XCircle, CalendarDays } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function MentoringPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string>("");
  const [mentoringRequests, setMentoringRequests] = useState<any[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchSessions();
    fetchStudents();
    fetchRequests();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/mentoring");
      setSessions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/tutor/students");
      setStudents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  }; const fetchRequests = async () => {
    try {
      const res = await api.get("/mentoring/requests");
      setMentoringRequests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };


  // Filter sessions based on search query and active tab
  const filteredSessions = sessions.filter((session: any) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.students && session.students.some((s: any) => s.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())));

    if (activeTab === "upcoming") {
      return matchesSearch && session.status === "scheduled";
    } else if (activeTab === "past") {
      return matchesSearch && session.status === "completed";
    }

    return matchesSearch;
  });

  // Filter mentoring requests based on search query and active tab
  const filteredRequests = mentoringRequests.filter(request => {
    const studentName = request.requestedBy?.user?.name || "Student";
    const matchesSearch =
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.topic.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "pending") {
      return matchesSearch && request.status === "pending";
    } else if (activeTab === "approved") {
      return matchesSearch && request.status === "scheduled"; // In backend, approved sessions become scheduled
    } else if (activeTab === "completed") {
      return matchesSearch && request.status === "completed";
    }

    return matchesSearch;
  });

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !topic || !date || !startTime || !duration || !selectedStudents) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/mentoring", {
        title,
        topic,
        date,
        startTime,
        duration,
        students: selectedStudents,
        notes
      });
      toast.success("Session scheduled successfully");
      setTitle("");
      setTopic("");
      setNotes("");
      fetchSessions();
    } catch (err) {
      toast.error("Failed to schedule session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await api.put(`/mentoring/requests/${id}/status`, { status: "approved" });
      toast.success("Request approved and scheduled");
      fetchRequests();
      fetchSessions();
    } catch (err) {
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await api.put(`/mentoring/requests/${id}/status`, { status: "rejected" });
      toast.success("Request declined");
      fetchRequests();
    } catch (err) {
      toast.error("Failed to decline request");
    }
  };

  const handleCancelSession = async (id: string) => {
    try {
      await api.put(`/mentoring/${id}/cancel`);
      toast.success("Session cancelled");
      fetchSessions();
    } catch (err) {
      toast.error("Failed to cancel session");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Mentoring & Extra Sessions</h2>
      </div>

      <Tabs defaultValue="extra-sessions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="extra-sessions">Extra Sessions</TabsTrigger>
          <TabsTrigger value="mentoring-requests">Mentoring Requests</TabsTrigger>
        </TabsList>

        {/* Extra Sessions Tab */}
        <TabsContent value="extra-sessions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Create New Session Form */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Create Extra Session</CardTitle>
                <CardDescription>
                  Schedule additional sessions for your students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-title">Session Title</Label>
                    <Input
                      id="session-title"
                      placeholder="e.g., Exam Review"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-topic">Topic</Label>
                    <Input
                      id="session-topic"
                      placeholder="Main topic to cover"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-time">Start Time</Label>
                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger id="start-time">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, i) => (
                            <SelectItem key={i} value={`${i}:00`}>
                              {`${i}:00`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger id="duration">
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="students">Select Students</Label>
                    <Select value={selectedStudents} onValueChange={setSelectedStudents}>
                      <SelectTrigger id="students">
                        <SelectValue placeholder="Select students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        {students.map((student) => (
                          <SelectItem key={student._id} value={student._id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-notes">Session Notes</Label>
                    <Textarea
                      id="session-notes"
                      placeholder="Add any notes or materials needed for the session"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Scheduling..." : "Schedule Session"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Sessions List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Extra Sessions</CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription>
                    Manage your scheduled extra sessions
                  </CardDescription>
                  <div className="flex items-center space-x-2">
                    <TabsList className="grid grid-cols-2 w-[200px]">
                      <TabsTrigger
                        value="upcoming"
                        onClick={() => setActiveTab("upcoming")}
                        className={activeTab === "upcoming" ? "data-[state=active]:bg-primary" : ""}
                      >
                        Upcoming
                      </TabsTrigger>
                      <TabsTrigger
                        value="past"
                        onClick={() => setActiveTab("past")}
                        className={activeTab === "past" ? "data-[state=active]:bg-primary" : ""}
                      >
                        Past
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sessions..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.length > 0 ? (
                        filteredSessions.map((session: any) => (
                          <TableRow key={session._id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{session.title}</div>
                                <div className="text-sm text-muted-foreground">{session.topic}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{new Date(session.date).toLocaleDateString()}</span>
                                <Clock className="h-4 w-4 mx-2 text-muted-foreground" />
                                <span>{session.startTime} ({session.duration}m)</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{session.students?.length || 0}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {session.students?.slice(0, 2).map((s: any) => s.user?.name).join(", ")}
                                {session.students?.length > 2 && ` +${session.students.length - 2} more`}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={session.status === "scheduled" ? "outline" : "secondary"}>
                                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {session.status === "scheduled" && (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelSession(session._id)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No sessions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mentoring Requests Tab */}
        <TabsContent value="mentoring-requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mentoring Requests</CardTitle>
              <div className="flex items-center justify-between">
                <CardDescription>
                  Review and manage student mentoring requests
                </CardDescription>
                <div className="flex items-center space-x-2">
                  <TabsList className="grid grid-cols-3 w-[300px]">
                    <TabsTrigger
                      value="pending"
                      onClick={() => setActiveTab("pending")}
                      className={activeTab === "pending" ? "data-[state=active]:bg-primary" : ""}
                    >
                      Pending
                    </TabsTrigger>
                    <TabsTrigger
                      value="approved"
                      onClick={() => setActiveTab("approved")}
                      className={activeTab === "approved" ? "data-[state=active]:bg-primary" : ""}
                    >
                      Approved
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      onClick={() => setActiveTab("completed")}
                      className={activeTab === "completed" ? "data-[state=active]:bg-primary" : ""}
                    >
                      Completed
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <Card key={request._id} className="overflow-hidden">
                      <div className={`h-1 ${request.status === "pending" ? "bg-amber-500" :
                        request.status === "scheduled" ? "bg-green-500" :
                          "bg-slate-500"
                        }`} />
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{request.requestedBy?.user?.name || "Student"}</h4>
                            <p className="text-sm text-muted-foreground">{request.topic}</p>
                          </div>
                          <Badge variant={
                            request.status === "pending" ? "outline" :
                              request.status === "scheduled" ? "default" :
                                "secondary"
                          }>
                            {request.status}
                          </Badge>
                        </div>

                        <div className="flex items-center mt-2 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          <span>{new Date(request.date).toLocaleDateString()}</span>
                          <Clock className="h-4 w-4 mx-2" />
                          <span>{request.startTime}</span>
                        </div>

                        <div className="mt-3 p-3 bg-slate-50 rounded-md text-sm italic border border-slate-100 italic">
                          "{request.message || "No message provided."}"
                        </div>

                        {request.status === "pending" && (
                          <div className="flex space-x-2 mt-4">
                            <Button
                              className="flex-1 bg-maatram-yellow hover:bg-maatram-yellow/90 text-slate-900 font-semibold shadow-sm"
                              onClick={() => handleApproveRequest(request._id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-slate-200"
                              onClick={() => handleRejectRequest(request._id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        )}

                        {request.status === "scheduled" && (
                          <div className="flex space-x-2 mt-4">
                            <Button className="flex-1" variant="outline" disabled>
                              Session Scheduled
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-600">No requests found</h3>
                    <p className="text-slate-400">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}