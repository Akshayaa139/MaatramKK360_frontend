"use client";

import { useEffect, useMemo, useState } from "react";
import { useTabSession } from "@/hooks/useTabSession";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Calendar, MessageCircle } from "lucide-react";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type Tutor = {
  id: string;
  userId?: string; // Added
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  qualifications: string;
  availability: { day: string; startTime: string; endTime: string }[];
  classes: { id: string; title: string; subject: string }[];
  attendanceLog?: { classId: string; status: string }[];
  timeHandling?: {
    classId: string;
    day?: string;
    startTime?: string;
    endTime?: string;
  }[];
  meetLinks?: { classId: string; title: string; link: string | null }[];
};

export default function TutorsPage() {
  const { data: session } = useTabSession();
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const { toast } = useToast();

  // Message Dialog State
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleContact = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsMessageOpen(true);
    setMessageContent("");
  };

  const handleSendMessage = async () => {
    if (!selectedTutor || !messageContent.trim()) return;

    setSending(true);
    try {
      await api.post("/messages", {
        receiver: selectedTutor.userId || selectedTutor.id, // Use userId if available
        content: messageContent,
      });

      toast({
        title: "Message sent",
        description: `Message sent to ${selectedTutor.name}`,
      });
      setIsMessageOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send message",
      });
    } finally {
      setSending(false);
    }
  };

  const normalizeSubject = (s: string) => {
    const key = s.trim().toLowerCase();
    if (["math", "mathematics", "advanced mathematics"].includes(key))
      return "Mathematics";
    if (["physics", "phys"].includes(key)) return "Physics";
    if (["chemistry", "chem"].includes(key)) return "Chemistry";
    if (["biology", "bio"].includes(key)) return "Biology";
    if (key) return s.replace(/\b\w/g, (c) => c.toUpperCase());
    return s;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const authHeader = (session?.user as any)?.accessToken
          ? { Authorization: `Bearer ${(session?.user as any)?.accessToken}` }
          : undefined;
        const res = await api.get("/admin/tutors/details", {
          headers: authHeader,
        });
        setTutors(res.data || []);
      } catch {
        setTutors([]);
      }
    };
    load();
  }, [session]);

  const subjects = useMemo(() => {
    const all = tutors.flatMap((t) => (t.subjects || []).map(normalizeSubject));
    return Array.from(new Set(all)).sort();
  }, [tutors]);
  const filtered = tutors.filter((t) => {
    const q = query.toLowerCase();
    const matchesQuery =
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.qualifications || "").toLowerCase().includes(q);
    const tutorSubjectsNorm = (t.subjects || []).map(normalizeSubject);
    const matchesSubject = subjectFilter
      ? tutorSubjectsNorm.includes(subjectFilter)
      : true;
    return matchesQuery && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search tutors by name, email, or qualification..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={subjectFilter === null ? "default" : "outline"}
            onClick={() => setSubjectFilter(null)}
            className="h-10"
          >
            All Subjects
          </Button>
          {subjects.map((subject) => (
            <Button
              key={subject}
              variant={subjectFilter === subject ? "default" : "outline"}
              onClick={() => setSubjectFilter(subject)}
              className="h-10"
            >
              {subject}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tutor) => (
          <Card key={tutor.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{tutor.name}</CardTitle>
                  <CardDescription>{tutor.email}</CardDescription>
                  <div className="mt-1 text-sm">
                    {(tutor.subjects || []).map(normalizeSubject).join(", ")}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  Availability:{" "}
                  {tutor.availability
                    ?.map((a) => `${a.day} ${a.startTime}-${a.endTime}`)
                    .join(", ") || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Classes: {tutor.classes.length}</span>
              </div>
              {tutor.qualifications && (
                <div>Qualifications: {tutor.qualifications}</div>
              )}
              {Array.isArray(tutor.meetLinks) &&
                tutor.meetLinks.length > 0 &&
                // Special-case: hide per-student meet links for tutor "dharshini"
                // to avoid showing a long list of per-student meeting links.
                !String(tutor.name || "")
                  .toLowerCase()
                  .includes("dharshini") && (
                  <div>
                    <div className="font-medium">Meet Links</div>
                    <ul className="list-disc list-inside">
                      {tutor.meetLinks.slice(0, 5).map((m) => (
                        <li key={m.classId}>
                          {m.title}: {m.link || "N/A"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              {Array.isArray(tutor.timeHandling) &&
                tutor.timeHandling.length > 0 && (
                  <div>
                    <div className="font-medium">Schedules</div>
                    <div className="text-xs">
                      {tutor.timeHandling
                        .slice(0, 5)
                        .map(
                          (t) =>
                            `${t.day || ""} ${t.startTime || ""}-${t.endTime || ""
                            }`
                        )
                        .join(", ")}
                    </div>
                  </div>
                )}
              {Array.isArray(tutor.attendanceLog) &&
                tutor.attendanceLog.length > 0 && (
                  <div>
                    <div className="font-medium">Attendance Logs</div>
                    <div className="text-xs">
                      {tutor.attendanceLog
                        .slice(0, 10)
                        .map((a) => a.status)
                        .join(", ")}
                    </div>
                  </div>
                )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleContact(tutor)}
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Match / Contact
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {selectedTutor?.name}</DialogTitle>
            <DialogDescription>
              Send a message directly to this tutor's dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Type your message here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sending || !messageContent.trim()}
            >
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
