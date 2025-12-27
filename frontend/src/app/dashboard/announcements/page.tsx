"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Bell, Calendar, Clock, Users, Plus, Edit, Trash, Eye } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function AnnouncementsPage() {
  const [activeTab, setActiveTab] = useState("announcements");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchClasses();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/announcements");
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get("/tutor/classes");
      setClasses(res.data || []);
    } catch (err) {
      console.error("Failed to fetch classes", err);
    }
  };

  // Sample data for notifications
  const notifications = [
    {
      id: "1",
      title: "New Assignment Submission",
      message: "John Doe has submitted the Calculus Problem Set",
      type: "submission",
      date: "2023-11-12",
      time: "14:30",
      read: false
    },
    {
      id: "2",
      title: "Class Rescheduled",
      message: "Your Physics Fundamentals class on Nov 16 has been rescheduled to Nov 17",
      type: "schedule",
      date: "2023-11-11",
      time: "09:45",
      read: true
    },
    {
      id: "3",
      title: "Student Question",
      message: "Sarah Williams has asked a question about the Chemistry homework",
      type: "question",
      date: "2023-11-10",
      time: "16:20",
      read: false
    },
    {
      id: "4",
      title: "Attendance Report",
      message: "Attendance report for Advanced Mathematics is now available",
      type: "report",
      date: "2023-11-09",
      time: "18:00",
      read: true
    }
  ];

  const handleCreateAnnouncement = async () => {
    if (!title || !message || !selectedClass) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/announcements", {
        title,
        message,
        targetClass: selectedClass === "all" ? undefined : selectedClass
      });
      toast.success("Announcement sent successfully");
      setTitle("");
      setMessage("");
      setSelectedClass("");
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to send announcement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAnnouncement = (id: string) => {
    console.log(`Editing announcement ${id}`);
  };

  const handleDeleteAnnouncement = (id: string) => {
    console.log(`Deleting announcement ${id}`);
  };

  const handleViewAnnouncement = (id: string) => {
    console.log(`Viewing announcement ${id}`);
  };

  const handleMarkAsRead = (id: string) => {
    console.log(`Marking notification ${id} as read`);
  };

  const handleDeleteNotification = (id: string) => {
    console.log(`Deleting notification ${id}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Announcements & Notifications</h2>

      <Tabs defaultValue="announcements" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Create Announcement Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Announcement</CardTitle>
                <CardDescription>
                  Send an announcement to your students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Announcement Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter a title for your announcement"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Enter your announcement message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

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
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="button" className="w-full" onClick={handleCreateAnnouncement}>
                    <Megaphone className="h-4 w-4 mr-2" />
                    Send Announcement
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Recent Announcements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Announcements</CardTitle>
                <CardDescription>
                  View and manage your recent announcements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <Card key={announcement._id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          <Badge variant="outline">
                            {announcement.class?.title || announcement.class?.subject || "All Classes"}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(announcement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            Read by: {announcement.readBy?.length || 0}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {announcement.message}
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2 pt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAnnouncement(announcement._id)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAnnouncement(announcement._id)}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Notifications</CardTitle>
                  <CardDescription>
                    Stay updated with student activities and system alerts
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  Mark All as Read
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start p-4 border rounded-lg ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                  >
                    <div className="mr-4">
                      {notification.type === 'submission' && (
                        <div className="bg-green-100 p-2 rounded-full">
                          <Plus className="h-5 w-5 text-green-600" />
                        </div>
                      )}
                      {notification.type === 'schedule' && (
                        <div className="bg-amber-100 p-2 rounded-full">
                          <Calendar className="h-5 w-5 text-amber-600" />
                        </div>
                      )}
                      {notification.type === 'question' && (
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Bell className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      {notification.type === 'report' && (
                        <div className="bg-purple-100 p-2 rounded-full">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{notification.title}</h4>
                        <div className="text-xs text-muted-foreground">
                          {new Date(notification.date).toLocaleDateString()} at {notification.time}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex justify-end space-x-2 mt-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <Trash className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}