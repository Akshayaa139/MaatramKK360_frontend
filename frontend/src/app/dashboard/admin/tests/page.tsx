"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, FileText, Users, BarChart2 } from "lucide-react";

interface Test {
    id: string;
    title: string;
    date: string;
    registered: number;
}

const TestDashboard = () => {
    const { data: session } = useSession();
    const [stats, setStats] = useState({ upcomingTests: 0, studentsRegistered: 0, resultsPublished: 0, averageScore: 0 });
    const [upcomingTests, setUpcomingTests] = useState<Test[]>([]);

    useEffect(() => {
        console.log("Session object:", session);
        const fetchData = async () => {
            if (!session) {
                console.log("No session, returning...");
                return;
            }
            console.log("Session exists, fetching data...");

            const api = axios.create({
                baseURL: "/api",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            try {
                const [statsRes, upcomingTestsRes] = await Promise.all([
                    api.get("/tests/stats"),
                    api.get("/tests/upcoming"),
                ]);
                setStats(statsRes.data);
                setUpcomingTests(upcomingTestsRes.data);
            } catch (error) {
                toast.error("Failed to fetch test data.");
                console.error(error);
            }
        };

        fetchData();
    }, [session]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Test Conducting Team Dashboard</h1>
                    <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create New Test
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Upcoming Tests</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.upcomingTests}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Students Registered</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.studentsRegistered}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Results Published</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.resultsPublished}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                            <BarChart2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.averageScore}%</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Tests Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Test Title</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Registered Students</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upcomingTests.map((test) => (
                                    <TableRow key={test.id}>
                                        <TableCell className="font-medium">{test.title}</TableCell>
                                        <TableCell>{new Date(test.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{test.registered}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm">View Details</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TestDashboard;