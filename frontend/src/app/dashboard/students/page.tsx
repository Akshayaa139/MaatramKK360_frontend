"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, TrendingUp, Clock, Calendar, Users } from "lucide-react";
import api from "@/lib/api";

type Student = {
  id: string;
  name: string;
  email: string;
  grade: string;
  status: string;
  subjects: string[];
  attendanceRate: number;
  upcomingClasses: number;
  completedClasses: number;
};

export default function StudentsPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const authHeader = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
        const res = await api.get('/admin/students/all', { headers: authHeader });
        setStudents(res.data || []);
      } catch {
        setStudents([]);
      }
    };
    load();
  }, [session]);

  const subjects = Array.from(new Set(students.flatMap(s => s.subjects))).sort();
  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Program Students</CardTitle>
          <CardDescription>All enrolled students with key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {subjects.map((sub) => (
                <Badge key={sub} variant="secondary">{sub}</Badge>
              ))}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <Card key={s.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{s.name}</CardTitle>
                  <CardDescription>{s.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>Grade: {s.grade}</span>
                  </div>
                  <div className="text-sm">Subjects: {s.subjects.join(', ')}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>Attendance: {s.attendanceRate}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Upcoming: {s.upcomingClasses}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Completed: {s.completedClasses}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline">View details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
