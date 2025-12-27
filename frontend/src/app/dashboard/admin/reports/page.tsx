"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Search, Users, Calendar } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function AdminReportsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [tutors, setTutors] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [studentRes, tutorRes] = await Promise.all([
                api.get("/admin/applications"),
                api.get("/admin/tutors/details")
            ]);
            setStudents(studentRes.data?.applications || []);

            const allTutors = tutorRes.data || [];
            setTutors(allTutors);

            // Extract all classes from tutors
            const extractedClasses: any[] = [];
            allTutors.forEach((tutor: any) => {
                if (tutor.classes) {
                    tutor.classes.forEach((cls: any) => {
                        if (!extractedClasses.find(c => c.id === cls.id)) {
                            extractedClasses.push(cls);
                        }
                    });
                }
            });
            setClasses(extractedClasses);
        } catch (err) {
            console.error("Failed to fetch data for reports", err);
        }
    };

    const handleDownloadStudentReport = async (studentId: string) => {
        try {
            setIsDownloading(`student-${studentId}`);
            const res = await api.get(`/reports/student/${studentId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `student_report_${studentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            toast.success("Report downloaded successfully");
        } catch (err) {
            toast.error("Failed to download report");
        } finally {
            setIsDownloading(null);
        }
    };

    const handleDownloadClassReport = async (classId: string) => {
        try {
            setIsDownloading(`class-${classId}`);
            // Changed from /reports/class?classId= to /reports/class/:id to match backend fix
            const res = await api.get(`/reports/class/${classId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `class_report_${classId}.pdf`);
            document.body.appendChild(link);
            link.click();
            toast.success("Report downloaded successfully");
        } catch (err) {
            toast.error("Failed to download report");
        } finally {
            setIsDownloading(null);
        }
    };

    const handleDownloadGlobalReport = async () => {
        try {
            setIsDownloading('global');
            const res = await api.get('/reports/global', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `global_platform_report.pdf`);
            document.body.appendChild(link);
            link.click();
            toast.success("Global report downloaded successfully");
        } catch (err) {
            toast.error("Failed to generate global report");
        } finally {
            setIsDownloading(null);
        }
    };

    const handleDownloadTutorReport = async (tutorId: string) => {
        try {
            setIsDownloading(`tutor-${tutorId}`);
            const res = await api.get(`/reports/tutor/${tutorId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tutor_report_${tutorId}.pdf`);
            document.body.appendChild(link);
            link.click();
            toast.success("Tutor report downloaded successfully");
        } catch (err) {
            toast.error("Failed to download tutor report");
        } finally {
            setIsDownloading(null);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.applicationId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Report Generation</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Student Reports */}
                <Card>
                    <CardHeader>
                        <CardTitle>Student Progress Reports</CardTitle>
                        <CardDescription>Generate comprehensive reports for individual students</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2 mb-4">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="max-h-[400px] overflow-y-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map((s) => (
                                        <TableRow key={s._id}>
                                            <TableCell>
                                                <div className="font-medium">{s.personalInfo?.fullName || s.name}</div>
                                                <div className="text-xs text-muted-foreground">{s.applicationNumber || s.applicationId}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownloadStudentReport(s._id || s.id)}
                                                    disabled={isDownloading === `student-${s._id || s.id}`}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    {isDownloading === `student-${s._id || s.id}` ? "Generating..." : "Download"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Class Reports */}
                <Card>
                    <CardHeader>
                        <CardTitle>Class Performance Reports</CardTitle>
                        <CardDescription>Generate overall performance reports for specific classes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[450px] overflow-y-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classes.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell>
                                                <div className="font-medium">{c.title}</div>
                                                <div className="text-xs text-muted-foreground">{c.subject}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownloadClassReport(c.id)}
                                                    disabled={isDownloading === `class-${c.id}`}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    {isDownloading === `class-${c.id}` ? "Generating..." : "Download"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Tutor Reports */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Tutor Performance Reports</CardTitle>
                        <CardDescription>Generate performance summaries for individual tutors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[400px] overflow-y-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tutor</TableHead>
                                        <TableHead>Subjects</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tutors.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell>
                                                <div className="font-medium">{t.name}</div>
                                                <div className="text-xs text-muted-foreground">{t.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {(t.subjects || []).map((sub: string) => (
                                                        <span key={sub} className="px-2 py-0.5 bg-slate-100 text-[10px] rounded-full uppercase font-semibold">
                                                            {sub}
                                                        </span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownloadTutorReport(t.id)}
                                                    disabled={isDownloading === `tutor-${t.id}`}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    {isDownloading === `tutor-${t.id}` ? "Generating..." : "Download"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Global Statistics Report</CardTitle>
                    <CardDescription>Download a comprehensive overview of platform performance</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                    <Button
                        size="lg"
                        className="px-10 bg-maatram-yellow hover:bg-maatram-yellow/90 text-slate-900 font-bold"
                        onClick={handleDownloadGlobalReport}
                        disabled={isDownloading === 'global'}
                    >
                        {isDownloading === 'global' ? (
                            "Generating Report..."
                        ) : (
                            <>
                                <FileText className="h-5 w-5 mr-2" />
                                Generate Global Platform Report (PDF)
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
