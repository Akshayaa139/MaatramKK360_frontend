"use client";

import { useState, useEffect } from "react";
import { useTabSession } from "@/hooks/useTabSession";
import api from "@/lib/api";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  User,
  FileText,
  Calendar,
  CheckCircle,
  Eye,
  MessageCircle,
  Video,
  Award,
  TrendingUp,
} from "lucide-react";

interface Student {
  _id: string;
  name: string;
  email?: string;
  grade?: string;
  subjects?: string[];
  avatar?: string;
  progress?: number;
}

interface TutorSession {
  _id: string;
  studentName: string;
  date: string; // ISO date string
  time?: string;
  duration?: number;
  type?: "individual" | "group";
  status?: string;
  topic?: string;
}

interface Application {
  _id: string;
  studentName: string;
  course: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewNotes?: string;
}

interface Performance {
  totalStudents: number;
  activeStudents: number;
  completedSessions: number;
  averageRating: number;
  totalHours: number;
}

export default function TutorDashboard() {
  const { data: session } = useTabSession();
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<TutorSession[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [performance, setPerformance] = useState<Performance>({
    totalStudents: 0,
    activeStudents: 0,
    completedSessions: 0,
    averageRating: 0,
    totalHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");

  useEffect(() => {
    fetchTutorData();
  }, [session]);

  const fetchTutorData = async () => {
    try {
      const [studentsRes, sessionsRes, applicationsRes, performanceRes] =
        await Promise.all([
          api.get("/tutor/students"),
          api.get("/tutor/sessions/upcoming"),
          api.get("/tutor/applications"),
          api.get("/tutor/performance"),
        ]);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setUpcomingSessions(
        Array.isArray(sessionsRes.data) ? sessionsRes.data : []
      );
      setApplications(
        Array.isArray(applicationsRes.data) ? applicationsRes.data : []
      );
      setPerformance(
        performanceRes.data || {
          totalStudents: 0,
          activeStudents: 0,
          completedSessions: 0,
          averageRating: 0,
          totalHours: 0,
        }
      );
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tutor data:", error);
      setLoading(false);
    }
  };

  const handleStartSession = (sessionId: string) => {
    window.open(`/tutor/session/${sessionId}`, "_blank");
  };

  const handleReviewApplication = (applicationId: string) => {
    window.location.href = `/tutor/applications/${applicationId}`;
  };

  const handleSendMessage = (studentId: string) => {
    window.location.href = `/chat?userId=${studentId}`;
  };

  const handleScheduleSession = (studentId: string) => {
    window.location.href = `/tutor/schedule?studentId=${studentId}`;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <Badge className="bg-green-500">{t(status)}</Badge>;
      case "cancelled":
      case "rejected":
        return <Badge className="bg-red-500">{t(status)}</Badge>;
      case "scheduled":
      case "pending":
        return <Badge className="bg-yellow-500">{t(status)}</Badge>;
      case "active":
        return <Badge className="bg-green-500">{t("active")}</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500">{t("inactive")}</Badge>;
      default:
        return <Badge variant="outline">{status ?? t("unknown")}</Badge>;
    }
  };

  const getSessionTypeIcon = (type?: string) => {
    return type === "individual" ? (
      <User className="h-4 w-4" />
    ) : (
      <Users className="h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("tutorDashboard")}</h1>
          <p className="text-muted-foreground">{t("welcomeTutor")}</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => (window.location.href = "/tutor/schedule")}>
            <Calendar className="h-4 w-4 mr-2" />
            {t("scheduleSession")}
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/tutor/students")}
          >
            <Users className="h-4 w-4 mr-2" />
            {t("myStudents")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalStudents")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">
              {performance.activeStudents} {t("active")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("completedSessions")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance.completedSessions}
            </div>
            <p className="text-xs text-muted-foreground">
              {performance.totalHours} {t("hoursTaught")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("averageRating")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance.averageRating}/5
            </div>
            <p className="text-xs text-muted-foreground">
              {t("basedOnReviews")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("pendingReviews")}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter((a) => a.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("requireAttention")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("todaySessions")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                upcomingSessions.filter(
                  (s) =>
                    new Date(s.date).toDateString() ===
                    new Date().toDateString()
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">{t("scheduled")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="students">{t("students")}</TabsTrigger>
          <TabsTrigger value="sessions">{t("sessions")}</TabsTrigger>
          <TabsTrigger value="applications">{t("applications")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("upcomingSessions")}</CardTitle>
                <CardDescription>{t("todaySchedule")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {upcomingSessions.slice(0, 5).map((session) => (
                      <div
                        key={session._id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {getSessionTypeIcon(session.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {session.studentName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.time} • {session.duration} {t("minutes")}
                            </p>
                            {session.topic && (
                              <p className="text-xs text-muted-foreground">
                                {t("topic")}: {session.topic}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(session.status)}
                          {session.status === "scheduled" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartSession(session._id)}
                            >
                              <Video className="h-4 w-4 mr-1" />
                              {t("start")}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("recentActivity")}</CardTitle>
                <CardDescription>{t("recentActivityDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {performance.completedSessions} {t("sessionsCompleted")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("thisMonth")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {performance.activeStudents} {t("activeStudents")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("currentlyLearning")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {t("topRatedTutor")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("consistencyAward")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t("myStudents")}</CardTitle>
                  <CardDescription>{t("manageStudents")}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/tutor/students")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {t("viewAll")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {students.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Class {student.grade || "-"}
                            {(student.subjects || []).length
                              ? ` • ${(student.subjects || [])
                                  .slice(0, 2)
                                  .join(", ")}${
                                  (student.subjects || []).length > 2
                                    ? ` +${(student.subjects || []).length - 2}`
                                    : ""
                                }`
                              : ""}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">Mapped</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {student.progress}%
                          </p>
                          <Progress
                            value={student.progress}
                            className="w-20 h-2"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendMessage(student._id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScheduleSession(student._id)}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("sessionHistory")}</CardTitle>
              <CardDescription>{t("sessionHistoryDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-lg ${
                            session.type === "individual"
                              ? "bg-blue-100"
                              : "bg-green-100"
                          }`}
                        >
                          {getSessionTypeIcon(session.type)}
                        </div>
                        <div>
                          <p className="font-medium">{session.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.date).toLocaleDateString()} at{" "}
                            {session.time}
                          </p>
                          {session.topic && (
                            <p className="text-xs text-muted-foreground">
                              {t("topic")}: {session.topic}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(session.status)}
                        <p className="text-sm font-medium">
                          {session.duration} {t("min")}
                        </p>
                        {session.status === "scheduled" && (
                          <Button
                            size="sm"
                            onClick={() => handleStartSession(session._id)}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            {t("start")}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("studentApplications")}</CardTitle>
              <CardDescription>{t("reviewApplications")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div
                      key={application._id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">
                            {application.studentName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {application.course}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("submittedOn")}:{" "}
                            {new Date(
                              application.submittedAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(application.status)}
                      </div>

                      {application.reviewNotes && (
                        <div className="mb-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">
                            {t("studentNotes")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {application.reviewNotes}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleReviewApplication(application._id)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t("reviewApplication")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
