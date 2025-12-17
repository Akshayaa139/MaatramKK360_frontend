"use client";

import { useState } from "react";
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

export default function MentoringPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sample data for extra sessions
  const extraSessions = [
    {
      id: "1",
      title: "Advanced Calculus Review",
      date: "2023-12-15",
      time: "16:00 - 17:30",
      students: ["John Doe", "Jane Smith", "Mike Johnson"],
      status: "scheduled",
      topic: "Integration techniques and applications",
      notes: "Prepare examples of integration by parts and substitution"
    },
    {
      id: "2",
      title: "Physics Problem Solving",
      date: "2023-12-18",
      time: "15:00 - 16:30",
      students: ["Sarah Williams", "Alex Brown"],
      status: "scheduled",
      topic: "Mechanics and force problems",
      notes: "Focus on free-body diagrams and Newton's laws"
    },
    {
      id: "3",
      title: "Chemistry Lab Preparation",
      date: "2023-12-10",
      time: "14:00 - 15:30",
      students: ["Emily Davis", "Robert Wilson"],
      status: "completed",
      topic: "Titration techniques",
      notes: "Covered acid-base titration procedures and calculations"
    }
  ];
  
  // Sample data for mentoring requests
  const mentoringRequests = [
    {
      id: "1",
      student: "John Doe",
      date: "2023-12-20",
      time: "16:00 - 17:00",
      topic: "Career guidance in mathematics",
      status: "pending",
      message: "I'd like to discuss potential career paths in mathematics and what courses I should focus on."
    },
    {
      id: "2",
      student: "Jane Smith",
      date: "2023-12-22",
      time: "15:00 - 16:00",
      topic: "Study techniques for advanced topics",
      status: "approved",
      message: "I'm struggling with some advanced topics and would like advice on effective study techniques."
    },
    {
      id: "3",
      student: "Mike Johnson",
      date: "2023-12-08",
      time: "14:00 - 15:00",
      topic: "Feedback on research project",
      status: "completed",
      message: "I need feedback on my research project approach and methodology."
    }
  ];
  
  // Filter sessions based on search query and active tab
  const filteredSessions = extraSessions.filter(session => {
    const matchesSearch = 
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.students.some(student => student.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === "upcoming") {
      return matchesSearch && session.status === "scheduled";
    } else if (activeTab === "past") {
      return matchesSearch && session.status === "completed";
    }
    
    return matchesSearch;
  });
  
  // Filter mentoring requests based on search query and active tab
  const filteredRequests = mentoringRequests.filter(request => {
    const matchesSearch = 
      request.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "pending") {
      return matchesSearch && request.status === "pending";
    } else if (activeTab === "approved") {
      return matchesSearch && request.status === "approved";
    } else if (activeTab === "completed") {
      return matchesSearch && request.status === "completed";
    }
    
    return matchesSearch;
  });
  
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating new extra session");
    // Implementation would go here
  };
  
  const handleApproveRequest = (id: string) => {
    console.log(`Approving request ${id}`);
    // Implementation would go here
  };
  
  const handleRejectRequest = (id: string) => {
    console.log(`Rejecting request ${id}`);
    // Implementation would go here
  };
  
  const handleCancelSession = (id: string) => {
    console.log(`Cancelling session ${id}`);
    // Implementation would go here
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
                    <Input id="session-title" placeholder="e.g., Exam Review" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="session-topic">Topic</Label>
                    <Input id="session-topic" placeholder="Main topic to cover" />
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
                      <Select>
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
                      <Select>
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
                    <Select>
                      <SelectTrigger id="students">
                        <SelectValue placeholder="Select students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        <SelectItem value="john">John Doe</SelectItem>
                        <SelectItem value="jane">Jane Smith</SelectItem>
                        <SelectItem value="mike">Mike Johnson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="session-notes">Session Notes</Label>
                    <Textarea 
                      id="session-notes" 
                      placeholder="Add any notes or materials needed for the session"
                      rows={3}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Schedule Session
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
                        filteredSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{session.title}</div>
                                <div className="text-sm text-muted-foreground">{session.topic}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{session.date}</span>
                                <Clock className="h-4 w-4 mx-2 text-muted-foreground" />
                                <span>{session.time}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{session.students.length}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {session.students.slice(0, 2).join(", ")}
                                {session.students.length > 2 && ` +${session.students.length - 2} more`}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={session.status === "scheduled" ? "outline" : "secondary"}>
                                {session.status === "scheduled" ? "Upcoming" : "Completed"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {session.status === "scheduled" && (
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm">
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleCancelSession(session.id)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}
                              {session.status === "completed" && (
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
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
                    <Card key={request.id} className="overflow-hidden">
                      <div className={`h-1 ${
                        request.status === "pending" ? "bg-amber-500" : 
                        request.status === "approved" ? "bg-green-500" : 
                        "bg-slate-500"
                      }`} />
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{request.student}</h4>
                            <p className="text-sm text-muted-foreground">{request.topic}</p>
                          </div>
                          <Badge variant={
                            request.status === "pending" ? "outline" : 
                            request.status === "approved" ? "default" : 
                            "secondary"
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center mt-2 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          <span>{request.date}</span>
                          <Clock className="h-4 w-4 mx-2" />
                          <span>{request.time}</span>
                        </div>
                        
                        <div className="mt-3 p-3 bg-slate-50 rounded-md text-sm">
                          {request.message}
                        </div>
                        
                        {request.status === "pending" && (
                          <div className="flex space-x-2 mt-4">
                            <Button 
                              className="flex-1"
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        )}
                        
                        {request.status === "approved" && (
                          <div className="flex space-x-2 mt-4">
                            <Button className="flex-1">
                              Start Session
                            </Button>
                            <Button variant="outline" className="flex-1">
                              Reschedule
                            </Button>
                          </div>
                        )}
                        
                        {request.status === "completed" && (
                          <Button variant="outline" className="w-full mt-4">
                            View Session Notes
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium">No mentoring requests found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activeTab === "pending" 
                        ? "There are no pending mentoring requests at this time."
                        : activeTab === "approved"
                        ? "There are no approved mentoring sessions scheduled."
                        : "There are no completed mentoring sessions to display."}
                    </p>
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