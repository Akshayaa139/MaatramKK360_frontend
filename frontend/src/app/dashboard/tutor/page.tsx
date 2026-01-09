"use client";

import { useEffect, useState } from "react";
// import { useSession } from "next-auth/react";
import { useTabSession } from "@/hooks/useTabSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileEdit, Link2, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type SessionItem = {
  id: string;
  title: string;
  subject?: string;
  day?: string;
  time?: string;
  status?: string;
};
type StudentItem = {
  _id: string;
  name: string;
  email?: string;
  grade?: string;
  subjects?: string[];
};
type ClassItem = {
  _id: string;
  title?: string;
  subject?: string;
  sessionLink?: string;
  isLive?: boolean;
  activeSessionId?: string;
};
type Perf = {
  totalStudents: number;
  activeStudents: number;
  completedSessions: number;
  averageRating: number;
  totalHours: number;
};

type Message = {
  _id: string;
  sender: { _id: string; name: string; role: string };
  content: string;
  read: boolean;
  createdAt: string;
};

export default function TutorDashboard() {
  const { data: session } = useTabSession();
  const router = useRouter();
  // removed accessToken local var
  const [upcoming, setUpcoming] = useState<SessionItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [perf, setPerf] = useState<Perf | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [error, setError] = useState("");
  const [joiningClassId, setJoiningClassId] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(""); // clear old errors
      const [s1, s2, s3, s4, tprof, msgs] = await Promise.all([
        api.get<SessionItem[]>("/tutor/sessions/upcoming"),
        api.get<StudentItem[]>("/tutor/students"),
        api.get<Perf>("/tutor/performance"),
        api.get<ClassItem[]>("/classes/tutor"),
        api.get<{
          tutor?: {
            subjects?: string[];
            availability?: unknown[];
            experienceYears?: number;
          };
        }>("/tutor/profile"),
        api.get<Message[]>("/messages"),
      ]);
      setUpcoming(Array.isArray(s1.data) ? s1.data : []);
      setStudents(Array.isArray(s2.data) ? s2.data : []);
      setPerf(s3.data);
      setClasses(Array.isArray(s4.data) ? s4.data : []);
      setMessages(Array.isArray(msgs.data) ? msgs.data : []);
      const tp = tprof?.data?.tutor || {};
      const needSubjects =
        !tp.subjects ||
        (Array.isArray(tp.subjects) && tp.subjects.length === 0);
      const needAvailability =
        !tp.availability ||
        (Array.isArray(tp.availability) && tp.availability.length === 0);
      const needExperience =
        typeof tp.experienceYears !== "number" ||
        (tp.experienceYears || 0) <= 0;
      setProfileIncomplete(
        !!(needSubjects || needAvailability || needExperience)
      );
    } catch (err: any) {
      console.error("Dashboard load error", err);
      setError("Failed to load dashboard data. Server might be down.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStartSession = async (cls: ClassItem) => {
    setJoiningClassId(cls._id);
    try {
      // Call start endpoint
      const res = await api.post<{ sessionLink: string, sessionId: string, message: string }>(`/classes/${cls._id}/start`, {});

      // Update local state to show as live immediately
      setClasses(prev => prev.map(c =>
        c._id === cls._id
          ? { ...c, isLive: true, activeSessionId: res.data.sessionId, sessionLink: res.data.sessionLink }
          : c
      ));

      // Open link
      if (res.data.sessionLink) {
        window.open(res.data.sessionLink, "_blank");
      }
    } catch (e) {
      console.error("Failed to start session", e);
      // Fallback
      if (cls.sessionLink) window.open(cls.sessionLink, "_blank");
    } finally {
      setJoiningClassId(null);
    }
  };

  const handleEndSession = async (cls: ClassItem) => {
    if (!cls.activeSessionId) return;
    try {
      await api.post(`/classes/session/${cls.activeSessionId}/log`, { action: 'leave' });
      // Update local state
      setClasses(prev => prev.map(c =>
        c._id === cls._id
          ? { ...c, isLive: false, activeSessionId: undefined }
          : c
      ));
    } catch (e) {
      console.error("Failed to end session", e);
    }
  };

  const isDharshini = String(session?.user?.name || "")
    .toLowerCase()
    .includes("dharshini");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Tutor Dashboard</h2>
        <div className="flex gap-2">
          {error && <Badge variant="destructive" className="mr-2">{error}</Badge>}
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/attendance")}
          >
            <ClipboardCheckIcon />
            Attendance
          </Button>
          <Button
            variant="outline"
            disabled
            title="Auto mapping runs in Admin panel"
          >
            Auto Map
          </Button>
          <Button onClick={() => router.push("/dashboard/assignments")}>
            <FileEdit className="h-4 w-4 mr-2" />
            Assignments & Tests
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {profileIncomplete && (
          <Card className="md:col-span-3 border-yellow-300">
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Please update your subjects, availability, and experience to
                  enable automated student matching.
                </div>
                <Button onClick={() => router.push("/dashboard/profile")}>
                  Update Profile & Availability
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Students</div>
                <div className="text-xl font-bold">
                  {perf?.totalStudents ?? 0}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Completed Sessions</div>
                <div className="text-xl font-bold">
                  {perf?.completedSessions ?? 0}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Rating</div>
                <div className="text-xl font-bold">
                  {perf?.averageRating ?? 0}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Hours</div>
                <div className="text-xl font-bold">{perf?.totalHours ?? 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {upcoming.map((s) => (
                <div key={s.id} className="p-3 border rounded-md">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{s.day || ""}</span>
                    <Clock className="h-3 w-3" />
                    <span>{s.time || ""}</span>
                    <Badge variant="outline" className="ml-auto">
                      {s.status || ""}
                    </Badge>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No upcoming sessions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>My Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg._id} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          {msg.sender?.name || "Admin"}
                          <Badge variant="secondary" className="text-[10px]">{msg.sender?.role}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 pl-6">{msg.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">No messages received.</div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {students.map((st) => (
              <div key={st._id} className="p-3 border rounded-md">
                <div className="font-medium">{st.name}</div>
                <div className="text-xs text-muted-foreground">{st.email}</div>
                <div className="text-xs mt-1">Grade: {st.grade}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(st.subjects || []).map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            {students.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No students found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Class Meeting Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {classes.map((c) => (
              <div
                key={c._id}
                className="p-3 border rounded-md flex items-center justify-between"
              >
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {c.title}
                    {c.isLive && <Badge variant="destructive" className="animate-pulse px-1.5 py-0 text-[10px]">LIVE</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.subject}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!c.isLive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartSession(c)}
                      disabled={joiningClassId === c._id}
                    >
                      {joiningClassId === c._id ? "Starting..." : <><Link2 className="h-4 w-4 mr-1" /> Start Class</>}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => window.open(c.sessionLink, "_blank")}
                      >
                        Resume
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleEndSession(c)}
                      >
                        End Session
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {classes.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No classes found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClipboardCheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4 mr-2"
    >
      <path d="M9 2a1 1 0 0 0-1 1v1H7a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-1V3a1 1 0 0 0-1-1H9zm0 3h6V3H9v2zm8 4-5.5 5.5-2.5-2.5-1.5 1.5 4 4L19 12l-2-3z" />
    </svg>
  );
}
