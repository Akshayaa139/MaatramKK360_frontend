"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";
import {
  Search,
  Download,
  Eye,
  Filter,
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  CalendarDays,
  FileText,
  Video,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import AutoMapButton from "@/components/admin/AutoMapButton";
import { useTabSession } from "@/hooks/useTabSession";

interface Application {
  id: string;
  applicationNumber: string;
  studentName: string;
  email: string;
  phone: string;
  currentClass: string;
  subjects: string[];
  medium: string;
  status:
  | "submitted"
  | "under_review"
  | "tele_verification"
  | "panel_interview"
  | "selected"
  | "rejected"
  | "waitlist";
  submissionDate: string;
  teleVerificationStatus?: "pending" | "completed" | "assigned";
  panelInterviewStatus?: "pending" | "scheduled" | "completed";
  volunteerAssigned?: string;
  panelMembers?: string[];
  tenthPercentage?: number;
  currentPercentage?: number;
  annualIncome?: string;
}

interface StudentDetail {
  basic?: {
    name: string;
    email: string;
    phone: string;
    grade: string;
    subjects: string[];
  };
  strength?: {
    midTerm: string;
    quarterly: string;
    halfYearly: string;
  };
  attendanceRate?: number; // Restored
  assignmentReport?: { assignmentId: string; title: string }[];
  testReport?: { testId: string; title: string; marks: string }[];
  history?: {
    date: string;
    title: string;
    type: string;
    score: number;
    maxScore: number;
  }[]; // Added
  notes?: string; // Added
}

interface APIApplication {
  _id?: string;
  id?: string;
  applicationNumber?: string;
  applicationId?: string;
  name?: string;
  email?: string;
  phone?: string;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
  };
  educationalInfo?: {
    currentClass?: string;
    subjects?: ({ name: string } | string)[];
    medium?: string;
  };
  status?: string;
  createdAt?: string;
  submissionDate?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session } = useTabSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
  const [dashboardStats, setDashboardStats] = useState<{
    total: number;
    underReview: number;
    teleVerification: number;
    selected: number;
  }>({ total: 0, underReview: 0, teleVerification: 0, selected: 0 });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBySubject, setSelectedBySubject] = useState<
    {
      applicationId: string;
      name: string;
      subject: string;
      medium: string;
      tutors: { id: string; name: string }[];
    }[]
  >([]);
  const [tutorDetails, setTutorDetails] = useState<
    {
      id: string;
      name: string;
      email: string;
      phone: string;
      subjects: string[];
      qualifications: string;
      classes: { id: string; title: string; subject: string }[];
      meetLinks: { classId: string; title: string; link: string | null }[];
    }[]
  >([]);
  const [studentDetailId, setStudentDetailId] = useState<string>("");
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(
    null
  );
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [selectedTutorForDetails, setSelectedTutorForDetails] =
    useState<any>(null); // Added
  const [isTutorDetailsOpen, setIsTutorDetailsOpen] = useState(false); // Added

  useEffect(() => {
    const fetchLive = async () => {
      try {
        // Auth handled by interceptor
        const res = await api.get("/classes/sessions/live");
        setLiveSessions(res.data || []);
      } catch (e) {
        console.error("Failed to fetch live sessions", e);
      }
    };
    if (session?.user) fetchLive();
  }, [session]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        if (res.data) {
          setDashboardStats({
            total: res.data.totalApplications || 0,
            underReview: res.data.pendingApplications || 0,
            teleVerification: res.data.teleVerificationApplications || 0,
            selected: res.data.selectedApplications || 0,
          });
        }
      } catch (e) {
        console.error("Failed to fetch dashboard stats", e);
      }
    };
    if (session?.user) fetchStats();
  }, [session]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Auth handled by interceptor
        const response = await api.get("/admin/applications");
        const raw = Array.isArray(response.data)
          ? response.data
          : response.data?.applications || [];
        const normalizeStatus = (s: string) => {
          if (!s) return "under_review";
          const t = s.toLowerCase();
          if (t === "pending") return "under_review";
          if (t === "tele-verification") return "tele_verification";
          if (t === "panel-interview") return "panel_interview";
          return s;
        };
        const apps = raw.map((a: APIApplication) => ({
          id: a._id || a.id || "",
          applicationNumber:
            a.applicationNumber || a.applicationId || a._id || "",
          studentName: a.personalInfo?.fullName || a.name || "",
          email: a.personalInfo?.email || a.email || "",
          phone: a.personalInfo?.phone || a.phone || "",
          currentClass: a.educationalInfo?.currentClass || "",
          subjects: Array.isArray(a.educationalInfo?.subjects)
            ? a.educationalInfo!.subjects!.map((s: { name: string } | string) =>
              typeof s === "object" && "name" in s ? s.name : s
            )
            : [],
          medium: a.educationalInfo?.medium || "",
          status: normalizeStatus(a.status || ""),
          submissionDate:
            a.createdAt || a.submissionDate || new Date().toISOString(),
        }));
        setApplications(apps);
        setFilteredApplications(apps);
      } catch (error) {
        console.error("Failed to fetch applications", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [session]);

  useEffect(() => {
    const fetchSelected = async () => {
      try {
        // Auth handled by interceptor
        const res = await api.get("/admin/selected-students");
        const rows = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.rows)
            ? res.data.rows
            : [];
        setSelectedBySubject(rows);
      } catch { }
    };
    fetchSelected();
  }, [session]);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        // Auth handled by interceptor
        const res = await api.get("/admin/tutors/details");
        const rows = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.tutors)
            ? res.data.tutors
            : [];
        setTutorDetails(rows);
      } catch { }
    };
    fetchTutors();
  }, [session]);

  const loadStudentDetail = async () => {
    try {
      if (!studentDetailId) return;
      // Auth handled by interceptor
      const res = await api.get(`/admin/students/${studentDetailId}/details`);
      setStudentDetail(res.data);
    } catch {
      setStudentDetail(null);
    }
  };

  useEffect(() => {
    let filtered = applications;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Apply class filter
    if (classFilter !== "all") {
      filtered = filtered.filter((app) => app.currentClass === classFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          String(app.studentName || "")
            .toLowerCase()
            .includes(query) ||
          String(app.applicationNumber || "")
            .toLowerCase()
            .includes(query) ||
          String(app.email || "")
            .toLowerCase()
            .includes(query) ||
          String(app.phone || "")
            .toLowerCase()
            .includes(query)
      );
    }

    setFilteredApplications(filtered);
  }, [applications, statusFilter, classFilter, searchQuery]);

  const getStatusBadgeVariant = (
    status: string
  ): "default" | "destructive" | "outline" | "secondary" | "success" => {
    switch (status) {
      case "submitted":
        return "default";
      case "under_review":
        return "secondary";
      case "tele_verification":
        return "outline";
      case "panel_interview":
        return "secondary";
      case "selected":
        return "success";
      case "rejected":
        return "destructive";
      case "waitlist":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "submitted":
        return "Submitted";
      case "under_review":
        return "Under Review";
      case "tele_verification":
        return "Tele-verification";
      case "panel_interview":
        return "Panel Interview";
      case "selected":
        return "Selected";
      case "rejected":
        return "Rejected";
      case "waitlist":
        return "Waitlist";
      default:
        return status;
    }
  };

  const stats = {
    total: dashboardStats.total,
    underReview: dashboardStats.underReview,
    teleVerification: dashboardStats.teleVerification,
    selected: dashboardStats.selected,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/admin/volunteers")}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Volunteers
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/admin/panels")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Panel Management
            </Button>
            <Button onClick={() => router.push("/dashboard/admin/reports")}>
              <Download className="h-4 w-4 mr-2" />
              Download Reports
            </Button>
            <AutoMapButton compact />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-blue-800">
                Total Applications
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {stats.total}
              </div>
              <p className="text-xs text-blue-600 mt-1 font-medium">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200 overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-yellow-800">
                Under Review
              </CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Filter className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">
                {stats.underReview}
              </div>
              <p className="text-xs text-yellow-600 mt-1 font-medium">
                Awaiting initial review
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-purple-800">
                Tele-verification
              </CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {stats.teleVerification}
              </div>
              <p className="text-xs text-purple-600 mt-1 font-medium">
                Phone screening in progress
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-green-800">
                Selected
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {stats.selected}
              </div>
              <p className="text-xs text-green-600 mt-1 font-medium">
                Successfully admitted
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live Sessions */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Live Class Sessions ({liveSessions.length} active)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveSessions.length === 0 ? (
              <p className="text-sm text-red-600/80">
                No active classes at the moment.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Deduplicate sessions by class ID just in case */}
                {Array.from(
                  new Map(
                    liveSessions.map((s) => [s.class?._id || s._id, s])
                  ).values()
                ).map((ls) => (
                  <div
                    key={ls._id}
                    className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-red-500 border-t border-r border-b border-gray-100 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900">
                          {ls.class?.title || "Class"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {ls.tutor?.user?.name || "Unknown Tutor"}
                        </div>
                      </div>
                      <Badge variant="destructive" className="animate-pulse">
                        Live
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs mt-2 text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{ls.activeParticipants} Joining</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Started{" "}
                          {new Date(ls.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white border-none text-xs h-8"
                      asChild
                    >
                      <Link
                        href={`/dashboard/meeting/${ls.class?._id || ls.class}`}
                      >
                        <Video className="h-3 w-3 mr-1" />
                        Join Session
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, application number, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="tele_verification">
                    Tele-verification
                  </SelectItem>
                  <SelectItem value="panel_interview">
                    Panel Interview
                  </SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="waitlist">Waitlist</SelectItem>
                </SelectContent>
              </Select>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="9">Class 9</SelectItem>
                  <SelectItem value="10">Class 10</SelectItem>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selected Students by Subject & Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application No.</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Medium</TableHead>
                    <TableHead>Tutors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedBySubject.map((row, idx) => (
                    <TableRow
                      key={`${row.applicationId}-${row.subject}-${row.medium}-${idx}`}
                    >
                      <TableCell className="font-mono">
                        {row.applicationId}
                      </TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.subject}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.medium}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(row.tutors || []).map((t) => (
                            <Badge key={t.id} variant="secondary">
                              {t.name}
                            </Badge>
                          ))}
                          {(row.tutors || []).length === 0 && (
                            <Badge variant="outline">No tutors mapped</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {selectedBySubject.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No selected students found
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tutor Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Meeting Links</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutorDetails.map((td) => (
                    <TableRow key={td.id}>
                      <TableCell className="font-medium">{td.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(td.subjects || []).map((s) => (
                            <Badge key={s} variant="outline">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{td.qualifications || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{(td.classes || []).length} Classes</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTutorForDetails(td);
                              setIsTutorDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(td.meetLinks || []).filter((m) => !!m.link).length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {tutorDetails.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tutor records
              </div>
            )}

            {/* Tutor Class Details Dialog */}
            <Dialog
              open={isTutorDetailsOpen}
              onOpenChange={setIsTutorDetailsOpen}
            >
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>
                    Class Schedule & Students - {selectedTutorForDetails?.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                  {selectedTutorForDetails?.classes &&
                    selectedTutorForDetails.classes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Class Title</TableHead>
                          <TableHead>Schedule (Tutor)</TableHead>
                          <TableHead>Students</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTutorForDetails.classes.map((cls: any) => (
                          <TableRow key={cls.id}>
                            <TableCell className="font-medium">
                              {cls.title}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {cls.schedule?.day || "No Day"} <br />
                                <span className="text-muted-foreground text-xs">
                                  {cls.schedule?.startTime} -{" "}
                                  {cls.schedule?.endTime}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {(cls.students || []).length > 0 ? (
                                  (cls.students || []).map((st: any) => (
                                    <div
                                      key={st.id}
                                      className="text-sm flex items-center gap-1"
                                    >
                                      <Users className="h-3 w-3 text-gray-400" />
                                      {st.name}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground italic text-xs">
                                    No students enrolled
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No classes assigned.
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-center mb-4">
              <Input
                placeholder="Enter Student ID"
                value={studentDetailId}
                onChange={(e) => setStudentDetailId(e.target.value)}
                className="w-64"
              />
              <Button onClick={loadStudentDetail}>View</Button>
            </div>
            {studentDetail && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">{studentDetail.basic?.name}</div>
                    <div className="text-sm text-gray-600">
                      {studentDetail.basic?.email} •{" "}
                      {studentDetail.basic?.phone}
                    </div>
                    <div className="text-sm">
                      Grade: {studentDetail.basic?.grade}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(studentDetail.basic?.subjects || []).map(
                        (s: string) => (
                          <Badge key={s} variant="outline">
                            {s}
                          </Badge>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Strength</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      Mid Term: {studentDetail.strength?.midTerm}
                    </div>
                    <div className="text-sm">
                      Quarterly: {studentDetail.strength?.quarterly}
                    </div>
                    <div className="text-sm">
                      Half Yearly: {studentDetail.strength?.halfYearly}
                    </div>
                    <div className="text-sm mt-2">
                      Attendance Rate: {studentDetail.attendanceRate}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Activity & Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Recent History
                        </h4>
                        <ScrollArea className="h-[200px] border rounded-md p-3">
                          {studentDetail.history &&
                            studentDetail.history.length > 0 ? (
                            <div className="space-y-3">
                              {studentDetail.history.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-start border-b pb-2 last:border-0"
                                >
                                  <div>
                                    <div className="text-sm font-medium">
                                      {item.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.type} •{" "}
                                      {new Date(item.date).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      item.score >= 70
                                        ? "secondary"
                                        : "destructive"
                                    }
                                  >
                                    {item.score}/{item.maxScore}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No recent history available.
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Tutor Notes
                        </h4>
                        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 h-[200px] overflow-y-auto">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {studentDetail.notes ||
                              "No notes recorded for this student."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications ({filteredApplications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Medium</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-mono font-medium">
                        {application.applicationNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {application.studentName}
                      </TableCell>
                      <TableCell>Class {application.currentClass}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {application.subjects
                            .slice(0, 2)
                            .map((subject, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {subject}
                              </Badge>
                            ))}
                          {application.subjects.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{application.subjects.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{application.medium}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(application.status)}
                        >
                          {getStatusText(application.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const d = new Date(application.submissionDate);
                          return isNaN(d.getTime())
                            ? "-"
                            : d.toLocaleDateString();
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/admin/applications/${application.applicationNumber}`
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              /* Handle edit */
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredApplications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No applications found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
