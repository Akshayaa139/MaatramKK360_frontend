"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import {
  Search,
  Download,
  Eye,
  Filter,
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import AutoMapButton from "@/components/admin/AutoMapButton";

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
  attendanceRate?: number;
  assignmentReport?: { assignmentId: string; title: string }[];
  testReport?: { testId: string; title: string; marks: string }[];
}

interface APIApplication {
  _id?: string;
  id?: string;
  applicationNumber?: string;
  applicationId?: string;
  personalInfo?: { fullName?: string; email?: string; phone?: string };
  name?: string;
  email?: string;
  phone?: string;
  educationalInfo?: { currentClass?: string; subjects?: ({ name: string } | string)[]; medium?: string };
  status?: string;
  createdAt?: string;
  submissionDate?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
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
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const authHeader = session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined;
        const response = await api.get("/admin/applications", {
          headers: authHeader,
        });
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
            ? a.educationalInfo!.subjects!.map((s: { name: string } | string) => (typeof s === 'object' && 'name' in s ? s.name : s))
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
        const authHeader = session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined;
        const res = await api.get("/admin/selected-students", {
          headers: authHeader,
        });
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
        const authHeader = session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined;
        const res = await api.get("/admin/tutors/details", {
          headers: authHeader,
        });
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
      const authHeader = session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined;
      const res = await api.get(`/admin/students/${studentDetailId}/details`, {
        headers: authHeader,
      });
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
    total: applications.length,
    submitted: applications.filter((a) => a.status === "submitted").length,
    underReview: applications.filter((a) => a.status === "under_review").length,
    teleVerification: applications.filter(
      (a) => a.status === "tele_verification"
    ).length,
    panelInterview: applications.filter((a) => a.status === "panel_interview")
      .length,
    selected: applications.filter((a) => a.status === "selected").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    // waitlist: applications.filter(a => a.status === 'waitlist').length,
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                Total Applications
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {stats.total}
              </div>
              <p className="text-xs text-blue-600">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">
                Under Review
              </CardTitle>
              <Filter className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">
                {stats.underReview}
              </div>
              <p className="text-xs text-yellow-600">Awaiting initial review</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">
                Tele-verification
              </CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {stats.teleVerification}
              </div>
              <p className="text-xs text-purple-600">
                Phone screening in progress
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Selected
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {stats.selected}
              </div>
              <p className="text-xs text-green-600">Successfully admitted</p>
            </CardContent>
          </Card>
        </div>

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
                      <TableCell>{(td.classes || []).length}</TableCell>
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
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium mb-1">Assignments</div>
                    <div className="space-y-1">
                      {(studentDetail.assignmentReport || []).map((a) => (
                        <div key={a.assignmentId} className="text-sm">
                          {a.title}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm font-medium mt-3 mb-1">Tests</div>
                    <div className="space-y-1">
                      {(studentDetail.testReport || []).map((t) => (
                        <div key={t.testId} className="text-sm">
                          {t.title} • {t.marks}
                        </div>
                      ))}
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
