"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Users, BookOpen, MessageSquare, Send } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function StudentMentoringPage() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [tutors, setTutors] = useState<any[]>([]);
    const [selectedTutor, setSelectedTutor] = useState("");
    const [title, setTitle] = useState("");
    const [topic, setTopic] = useState("");
    const [startTime, setStartTime] = useState("");
    const [duration, setDuration] = useState("60");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [myRequests, setMyRequests] = useState<any[]>([]);

    useEffect(() => {
        fetchTutors();
        fetchMyRequests();
    }, []);

    const fetchTutors = async () => {
        try {
            // Fetch all available tutors for the student
            const res = await api.get("/students/tutors");
            setTutors(res.data || []);
        } catch (err) {
            console.error("Failed to fetch tutors", err);
        }
    };

    const fetchMyRequests = async () => {
        try {
            const res = await api.get("/mentoring/sessions"); // Assuming students can view their sessions here
            // Filter if needed, or update backend to provide only student's own requests
            setMyRequests(res.data || []);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        }
    };

    const handleRequestMentoring = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTutor || !title || !topic || !date || !startTime) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setIsLoading(true);
            await api.post("/mentoring/request", {
                tutorId: selectedTutor,
                title,
                topic,
                date: date.toISOString(),
                startTime,
                duration,
                message
            });
            toast.success("Mentoring request sent successfully!");
            setTitle("");
            setTopic("");
            setMessage("");
            fetchMyRequests();
        } catch (err) {
            toast.error("Failed to send mentoring request");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Mentoring</h2>
                <p className="text-muted-foreground">Request 1-on-1 guidance from our expert tutors</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-thick-yellow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-maatram-blue" />
                                Request a Session
                            </CardTitle>
                            <CardDescription>Fill out the form to request a mentoring session</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleRequestMentoring} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Select Tutor</Label>
                                    <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a tutor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tutors.map((tutor) => (
                                                <SelectItem key={tutor._id} value={tutor._id}>
                                                    {tutor.user?.name} ({tutor.subjects?.join(", ")})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Session Title</Label>
                                    <Input
                                        placeholder="e.g., Mathematics Career Guidance"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Topic of Discussion</Label>
                                    <Input
                                        placeholder="e.g., Higher studies in Engineering"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label>Preferred Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {date ? format(date, "PP") : <span>Pick a date</span>}
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
                                        <Label>Start Time</Label>
                                        <Input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Message to Tutor (Optional)</Label>
                                    <Textarea
                                        placeholder="Briefly describe what you want to achieve from this session..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={4}
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-maatram-yellow hover:bg-maatram-yellow/90 text-slate-900 font-bold" disabled={isLoading}>
                                    {isLoading ? "Sending..." : "Send Request"}
                                    <Send className="h-4 w-4 ml-2" />
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-maatram-blue" />
                                My Mentoring Sessions
                            </CardTitle>
                            <CardDescription>Track the status of your mentoring requests</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {myRequests.length > 0 ? (
                                    myRequests.map((req) => (
                                        <Card key={req._id} className="overflow-hidden hover:shadow-md transition-shadow">
                                            <div className={`h-1 ${req.status === 'pending' ? 'bg-amber-500' :
                                                req.status === 'scheduled' ? 'bg-green-500' :
                                                    'bg-slate-500'
                                                }`} />
                                            <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-lg">{req.title}</h4>
                                                        <Badge className={
                                                            req.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                                                                req.status === 'scheduled' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                                    'bg-slate-100 text-slate-700'
                                                        }>
                                                            {req.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-slate-600 font-medium">{req.topic}</p>
                                                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-2">
                                                        <div className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            Tutor: {req.tutor?.user?.name || "TBA"}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <CalendarIcon className="h-4 w-4" />
                                                            {new Date(req.date).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {req.startTime}
                                                        </div>
                                                    </div>
                                                </div>
                                                {req.status === 'scheduled' && (
                                                    <Button className="w-full md:w-auto bg-maatram-blue hover:bg-maatram-blue/90 text-white">
                                                        Join Session
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                        <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                        <h3 className="text-lg font-semibold text-slate-600">No requests yet</h3>
                                        <p className="text-slate-400">Request your first mentoring session to get started!</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
