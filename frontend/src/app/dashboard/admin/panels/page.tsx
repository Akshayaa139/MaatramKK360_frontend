"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import api from "@/lib/api";
import AutoMapButton from "@/components/admin/AutoMapButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Users,
  Video,
  Mail,
  CheckCircle,
  XCircle,
  UserCheck,
  Star,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PanelMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "alumni" | "volunteer" | "tutor" | "admin";
  expertise: string[];
  availability: string[];
  status: "available" | "busy" | "unavailable";
}

interface InterviewSlot {
  id: string;
  date: string;
  time: string;
  duration: number;
  panelMembers: PanelMember[];
  maxStudents: number;
  currentStudents: number;
  status: "open" | "scheduled" | "completed" | "cancelled";
  meetingLink?: string;
}

interface Student {
  id: string;
  name: string;
  applicationNumber: string;
  class: string;
  subjects: string[];
  phone: string;
  email: string;
  status: "pending" | "scheduled" | "completed" | "selected" | "rejected";
}

// No mock data; all members and students load from backend

export default function PanelInterviewManagement() {
  const { data: session } = useSession();
  const [panelMembers, setPanelMembers] = useState<PanelMember[]>([]);
  const [interviewSlots, setInterviewSlots] = useState<InterviewSlot[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<InterviewSlot | null>(null);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedTimeslotId, setSelectedTimeslotId] = useState<string>("");
  const [availableTimeslots, setAvailableTimeslots] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [createError, setCreateError] = useState<string>("");
  const [scheduleSlotId, setScheduleSlotId] = useState<string>("");
  const [interviewDate, setInterviewDate] = useState<string>("");
  const [interviewTimeCode, setInterviewTimeCode] = useState<string>("");
  // Recompute tutor availability status when time changes
  useEffect(() => {
    const map: Record<string, [number, number]> = {
      "10-12": [10, 12],
      "2-4": [14, 16],
      "4-6": [16, 18],
    };
    const range = map[interviewTimeCode];
    if (!interviewDate || !range) return;
    const d = new Date(interviewDate);
    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const hmToMinutes = (hm: string) => {
      const [h, m] = hm.split(":").map(Number);
      return h * 60 + (m || 0);
    };
    const startMin = range[0] * 60;
    setPanelMembers((prev) =>
      prev.map((m) => {
        const availList = m.availability || [];
        const available = availList.some((s: string) => {
          const parts = s.split(" ");
          // Handle "Monday - Dec 29" format or simple "Monday"
          const dayName = parts[0];
          // The time part is always the last part "10:00-12:00"
          const times = parts[parts.length - 1];

          if (!times || !times.includes("-")) return false; // Safety check

          const [st, en] = times.split("-");
          return (
            dayName === weekday &&
            hmToMinutes(st) <= startMin &&
            startMin < hmToMinutes(en)
          );
        });
        return {
          ...m,
          status: available ? "available" : "unavailable",
        } as PanelMember;
      })
    );
  }, [interviewDate, interviewTimeCode]);

  // Load panels, available timeslots, panel members, and selected students from backend
  useEffect(() => {
    if (!session || !session.accessToken) {
      console.log("[DEBUG] Waiting for session or accessToken...");
      return;
    }

    const token = session.accessToken;
    const authHeader = { Authorization: `Bearer ${token}` };
    const load = async () => {
      try {
        console.log("[DEBUG] Fetching panel data with token:", token.substring(0, 10) + "...");
        const [panelsRes, timeslotsRes, tutorsRes, selectedAppsRes] =
          await Promise.all([
            api.get("/admin/panels", { headers: authHeader }),
            api.get("/panel/timeslots/available", { headers: authHeader }),
            api.get("/admin/tutors/details", { headers: authHeader }),
            api.get("/admin/applications?status=selected&limit=500", {
              headers: authHeader,
            }),
          ]);

        console.log("[DEBUG] Data fetched successfully");

        const panels: any[] = panelsRes.data || [];
        const slots: InterviewSlot[] = panels.map((p) => ({
          id: String(p._id || p.id),
          date: p.timeslot
            ? new Date(p.timeslot.startTime).toLocaleDateString()
            : "",
          time: p.timeslot
            ? `${new Date(
              p.timeslot.startTime
            ).toLocaleTimeString()} - ${new Date(
              p.timeslot.endTime
            ).toLocaleTimeString()}`
            : "",
          duration: p.timeslot
            ? Math.round(
              (new Date(p.timeslot.endTime).getTime() -
                new Date(p.timeslot.startTime).getTime()) /
              60000
            )
            : 0,
          panelMembers: (p.members || []).map((m: any) => ({
            id: String(m._id || m.id),
            name: m.name,
            email: m.email,
            phone: m.phone || "",
            role:
              m.role === "tutor"
                ? "tutor"
                : m.role === "alumni"
                  ? "alumni"
                  : m.role === "admin"
                    ? "admin"
                    : "volunteer",
            expertise: [],
            availability: [],
            status: "available",
          })),
          maxStudents: Array.isArray(p.batch?.students)
            ? p.batch.students.length
            : 0,
          currentStudents: Array.isArray(p.batch?.students)
            ? p.batch.students.length
            : 0,
          status: "scheduled",
          meetingLink: p.meetingLink || "",
        }));
        setInterviewSlots(slots);

        setAvailableTimeslots(
          Array.isArray(timeslotsRes.data) ? timeslotsRes.data : []
        );

        const trows = Array.isArray(tutorsRes.data) ? tutorsRes.data : [];
        const mappedTutors: PanelMember[] = trows.map((t: any) => ({
          id: String(t.userId || t.id || t._id),
          name: t.name,
          email: t.email,
          phone: t.phone || "",
          role: "tutor" as "tutor", // Explicit cast
          expertise: t.subjects || [],
          availability: (t.availability || []).map(
            (a: any) => `${a.day} ${a.startTime}-${a.endTime}`
          ),
          status: "available" as "available", // Explicit cast
        }));

        // Inject current admin user if not present
        if (session?.user?.role === 'admin') {
          const adminMember = {
            id: session.user.id,
            name: session.user.name || "Admin",
            email: session.user.email || "",
            phone: "",
            role: "admin" as const,
            expertise: [],
            availability: [],
            status: "available" as const
          };
          // Avoid duplicates if admin is somehow in the list
          if (!mappedTutors.find((m: any) => m.id === adminMember.id)) {
            mappedTutors.push(adminMember);
          }
        }
        setPanelMembers(mappedTutors);

        const apps = Array.isArray(selectedAppsRes.data?.applications)
          ? selectedAppsRes.data.applications
          : Array.isArray(selectedAppsRes.data)
            ? selectedAppsRes.data
            : [];
        setStudents(
          apps.map((a: any) => ({
            id: String(a._id),
            name: a.personalInfo?.fullName || a.name,
            applicationNumber: a.applicationNumber || a.applicationId,
            class: a.educationalInfo?.currentClass || "",
            subjects: (a.educationalInfo?.subjects || []).map(
              (s: any) => s?.name || s
            ),
            phone: a.personalInfo?.phone || a.phone,
            email: a.personalInfo?.email || a.email,
            status: "pending",
          }))
        );
      } catch (err: any) {
        console.error("Error loading panel management data:", err);
        if (err.response) {
          console.error("API Response Error:", err.response.status, err.response.data);
          if (err.response.status === 401) {
            console.warn("Session invalid, signing out...");
            signOut({ callbackUrl: '/login' });
          }
        }
      }
    };
    load();
  }, [session]);

  const handleCreateSlot = async () => {
    setIsCreatingSlot(true);
    try {
      const authHeader = session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined;
      setCreateError("");
      setCreateError("");
      if (selectedMemberIds.length < 3 || selectedMemberIds.length > 4) {
        setCreateError("Select 3 or 4 members");
        return;
      }
      // Relaxed role check: Allow admins and other roles mixed as per backend logic
      // The backend handles the composition validation (e.g. 1 Alumni + 2 Volunteers OR 3 Tutors OR Admin mix)
      // So we mainly rely on backend error if composition is wrong, but we can do a basic check if needed.
      // For now, we trust the backend to validate stricter composition rules.
      // For now, we trust the backend to validate stricter composition rules.
      let timeslotId = "";
      if (!timeslotId) { // Always create new timeslot logic matches existing flow
        if (!interviewDate || !interviewTimeCode) {
          setCreateError("Choose an available timeslot or pick date/time");
          return;
        }
        // Build start/end from date + time code
        const toISO = (dateStr: string, hourStart: number, hourEnd: number) => {
          const d = new Date(dateStr);
          const start = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            hourStart,
            0,
            0
          );
          const end = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            hourEnd,
            0,
            0
          );
          return { startTime: start.toISOString(), endTime: end.toISOString() };
        };
        const map: Record<string, [number, number]> = {
          "10-12": [10, 12],
          "2-4": [14, 16],
          "4-6": [16, 18],
        };
        const range = map[interviewTimeCode];
        if (!range) {
          setCreateError("Invalid time slot selection");
          return;
        }
        const { startTime, endTime } = toISO(interviewDate, range[0], range[1]);
        const panelistId = selectedMemberIds[0];
        const createRes = await api.post(
          "/panel/timeslots/admin",
          { panelistId, startTime, endTime },
          { headers: authHeader }
        );
        timeslotId = String(
          createRes.data?.timeslot?._id || createRes.data?.timeslot?.id
        );
        if (!timeslotId) {
          setCreateError("Failed to create timeslot");
          return;
        }
      }
      const panelRes = await api.post(
        "/panel/create",
        { memberIds: selectedMemberIds, timeslotId: timeslotId },
        { headers: authHeader }
      );

      const newPanelId = panelRes.data?.panel?._id || panelRes.data?.panel?.id;

      // If students are selected, assign them immediately
      if (selectedStudentIds.length > 0 && newPanelId) {
        await api.post(
          "/panel/batches",
          { studentIds: selectedStudentIds, panelId: newPanelId },
          { headers: authHeader }
        );
        // Update local student status immediately
        setStudents((prev) =>
          prev.map((s) =>
            selectedStudentIds.includes(s.id) ? { ...s, status: "scheduled" } : s
          )
        );
      }

      const res = await api.get("/admin/panels", { headers: authHeader });
      const panels: any[] = res.data || [];
      const slots: InterviewSlot[] = panels.map((p) => ({
        id: String(p._id || p.id),
        date: p.timeslot
          ? new Date(p.timeslot.startTime).toLocaleDateString()
          : "",
        time: p.timeslot
          ? `${new Date(
            p.timeslot.startTime
          ).toLocaleTimeString()} - ${new Date(
            p.timeslot.endTime
          ).toLocaleTimeString()}`
          : "",
        duration: p.timeslot
          ? Math.round(
            (new Date(p.timeslot.endTime).getTime() -
              new Date(p.timeslot.startTime).getTime()) /
            60000
          )
          : 0,
        panelMembers: (p.members || []).map((m: any) => ({
          id: String(m._id || m.id),
          name: m.name,
          email: m.email,
          phone: m.phone || "",
          role:
            m.role === "tutor"
              ? "tutor"
              : m.role === "alumni"
                ? "alumni"
                : m.role === "admin"
                  ? "admin"
                  : "volunteer",
          expertise: [],
          availability: [],
          status: "available",
        })),
        maxStudents: Array.isArray(p.batch?.students)
          ? p.batch.students.length
          : 0,
        currentStudents: Array.isArray(p.batch?.students)
          ? p.batch.students.length
          : 0,
        status: "scheduled",
        meetingLink: p.meetingLink || "",
      }));
      setInterviewSlots(slots);
      setSelectedMemberIds([]);
      setSelectedStudentIds([]); // Clear selected students
      setInterviewDate("");
      setInterviewTimeCode("");
      setInterviewTimeCode("");
    } catch (e: any) {
      console.error(e);
      setCreateError(e.response?.data?.message || "Failed to create panel");
    }
    setIsCreatingSlot(false);
  };

  const assignStudentsToPanel = async (panelId: string) => {
    if (!selectedStudentIds.length) return;
    const authHeader = session?.accessToken
      ? { Authorization: `Bearer ${session.accessToken}` }
      : undefined;
    try {
      await api.post(
        "/panel/batches",
        { studentIds: selectedStudentIds, panelId },
        { headers: authHeader }
      );
      setStudents((prev) =>
        prev.map((s) =>
          selectedStudentIds.includes(s.id) ? { ...s, status: "scheduled" } : s
        )
      );
      setSelectedStudentIds([]);
      const res = await api.get("/admin/panels", { headers: authHeader });
      const panels: any[] = res.data || [];
      const slots: InterviewSlot[] = panels.map((p) => ({
        id: String(p._id || p.id),
        date: p.timeslot
          ? new Date(p.timeslot.startTime).toLocaleDateString()
          : "",
        time: p.timeslot
          ? `${new Date(
            p.timeslot.startTime
          ).toLocaleTimeString()} - ${new Date(
            p.timeslot.endTime
          ).toLocaleTimeString()}`
          : "",
        duration: p.timeslot
          ? Math.round(
            (new Date(p.timeslot.endTime).getTime() -
              new Date(p.timeslot.startTime).getTime()) /
            60000
          )
          : 0,
        panelMembers: (p.members || []).map((m: any) => ({
          id: String(m._id || m.id),
          name: m.name,
          email: m.email,
          phone: m.phone || "",
          role:
            m.role === "tutor"
              ? "tutor"
              : m.role === "alumni"
                ? "alumni"
                : m.role === "admin"
                  ? "admin"
                  : "volunteer",
          expertise: [],
          availability: [],
          status: "available",
        })),
        maxStudents: Array.isArray(p.batch?.students)
          ? p.batch.students.length
          : 0,
        currentStudents: Array.isArray(p.batch?.students)
          ? p.batch.students.length
          : 0,
        status: "scheduled",
        meetingLink: p.meetingLink || "",
      }));
      setInterviewSlots(slots);
    } catch { }
  };

  const runAutoMap = async () => {
    const authHeader = session?.accessToken
      ? { Authorization: `Bearer ${session.accessToken}` }
      : undefined;
    try {
      await api.post("/admin/automap", {}, { headers: authHeader });
    } catch { }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: "Open", className: "bg-green-100 text-green-800" },
      scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Completed", className: "bg-gray-100 text-gray-800" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStudentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Completed", className: "bg-gray-100 text-gray-800" },
      selected: { label: "Selected", className: "bg-green-100 text-green-800" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleScheduleInterview = (studentId: string, slotId: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, status: "scheduled" } : student
      )
    );

    setInterviewSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? { ...slot, currentStudents: slot.currentStudents + 1 }
          : slot
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel Interview Management
              </h1>
              <p className="text-gray-600 mt-2">
                Schedule and manage panel interviews for KK Program selection
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Interview Slot
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Interview Slot</DialogTitle>
                    <DialogDescription>
                      Schedule a new panel interview slot with available tutors
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="interviewDate">Interview Date</Label>
                        <Input
                          id="interviewDate"
                          type="date"
                          value={interviewDate}
                          onChange={(e) => setInterviewDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="interviewTime">Time Slot</Label>
                        <Select
                          value={interviewTimeCode}
                          onValueChange={setInterviewTimeCode}
                        >
                          <SelectTrigger id="interviewTime">
                            <SelectValue placeholder="Select time slot" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10-12">
                              10:00 AM - 12:00 PM
                            </SelectItem>
                            <SelectItem value="2-4">
                              2:00 PM - 4:00 PM
                            </SelectItem>
                            <SelectItem value="4-6">
                              4:00 PM - 6:00 PM
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Select Panel Members</Label>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose 3-4 members
                      </p>
                      <ScrollArea className="h-48 border rounded-md p-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {panelMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center space-x-3 p-3 border rounded-lg"
                            >
                              <Checkbox
                                checked={selectedMemberIds.includes(member.id)}
                                onCheckedChange={(val) => {
                                  setSelectedMemberIds((prev) => {
                                    if (val) return [...prev, member.id];
                                    return prev.filter((x) => x !== member.id);
                                  });
                                }}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-gray-600">
                                  {member.role === "tutor"
                                    ? "Tutor"
                                    : member.role === "alumni"
                                      ? "Alumni"
                                      : member.role === "admin"
                                        ? "Admin"
                                        : "Volunteer"}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  member.status === "available"
                                    ? "success"
                                    : "destructive"
                                }
                              >
                                {member.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>


                    <div>
                      <Label>Select Students (Optional)</Label>
                      <p className="text-sm text-gray-600 mb-4">
                        Select students to interview in this slot
                      </p>
                      <ScrollArea className="h-48 border rounded-md p-2">
                        <div className="space-y-2">
                          {students
                            .filter((s) => s.status === "pending")
                            .map((student) => (
                              <div key={student.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-white">
                                <Checkbox
                                  checked={selectedStudentIds.includes(student.id)}
                                  onCheckedChange={(val) => {
                                    setSelectedStudentIds((prev) => {
                                      if (val) return [...prev, student.id];
                                      return prev.filter((x) => x !== student.id);
                                    });
                                  }}
                                />
                                <div>
                                  <p className="font-medium text-sm">{student.name}</p>
                                  <p className="text-xs text-gray-500">{student.class} • {student.subjects.join(", ")}</p>
                                </div>
                              </div>
                            ))}
                          {students.filter(s => s.status === "pending").length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No pending students found</p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>


                  </div>
                  <DialogFooter>
                    {createError && (
                      <p className="text-sm text-red-600 mr-auto">
                        {createError}
                      </p>
                    )}
                    <Button
                      disabled={isCreatingSlot}
                      onClick={handleCreateSlot}
                    >
                      Create Interview Slot
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Auto-map not shown here by design */}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Panel Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {panelMembers.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {panelMembers.filter((m) => m.role === "alumni").length} Alumni,{" "}
                {panelMembers.filter((m) => m.role === "volunteer").length}{" "}
                Volunteers
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Interview Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {interviewSlots.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {interviewSlots.filter((s) => s.status === "open").length} open
                slots
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Students Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {students.filter((s) => s.status === "scheduled").length}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Out of {students.length} total students
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interview Slots */}
        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Interview Slots</CardTitle>
              <p className="text-gray-600">Available interview time slots</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interviewSlots.map((slot) => (
                  <div key={slot.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">
                          {slot.date} • {slot.time}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {slot.duration} minutes
                        </p>
                      </div>
                      {getStatusBadge(slot.status)}
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2">Panel Members:</p>
                      <div className="space-y-1">
                        {slot.panelMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center text-sm"
                          >
                            <UserCheck className="h-3 w-3 mr-2 text-gray-400" />
                            {member.name} (
                            {member.role === "alumni" ? "Alumni" : member.role === "admin" ? "Admin" : member.role === "tutor" ? "Tutor" : "Volunteer"})
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {slot.currentStudents}/{slot.maxStudents} students
                      </div>
                      {slot.meetingLink && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={slot.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Video className="h-3 w-3 mr-1" />
                            Meeting Link
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {interviewSlots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No interview slots created yet
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
