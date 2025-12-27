"use client";

// import { useSession } from "next-auth/react";
import { useTabSession } from "@/hooks/useTabSession";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  BookOpen,
  Calendar,
  MessageSquare
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Stat {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
}

interface Activity {
  type: string;
  timestamp: string;
}

interface Session {
  title: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { data: session, status } = useTabSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = (session?.user as any)?.role;
    if (role === 'admin' || role === 'lead') {
      router.replace('/dashboard/admin');
      return;
    }
    if (role === 'tutor') {
      router.replace('/dashboard/tutor');
      return;
    }
    if (role === 'student') {
      router.replace('/dashboard/student');
      return;
    }
    if (role === 'volunteer' || role === 'alumni') {
      router.replace('/dashboard/volunteer');
      return;
    }
    const fetchData = async () => {
      try {
        // Auth handled by interceptor
        const [statsRes, activitiesRes, sessionsRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/dashboard/recent-activities"),
          api.get("/dashboard/upcoming-sessions"),
        ]);

        const { tutorCount, studentCount, upcomingClassesCount, engagementRate } = statsRes.data;
        setStats([
          {
            title: "Total Tutors",
            value: tutorCount,
            icon: Users,
            description: "Active tutors in the system",
          },
          {
            title: "Total Students",
            value: studentCount,
            icon: BookOpen,
            description: "Registered students",
          },
          {
            title: "Upcoming Classes",
            value: upcomingClassesCount,
            icon: Calendar,
            description: "Classes in next 24 hours",
          },
          {
            title: "Engagement Rate",
            value: engagementRate,
            icon: MessageSquare,
            description: "Average student participation",
          },
        ]);

        setRecentActivities(activitiesRes.data);
        setUpcomingSessions(sessionsRes.data);

      } catch (error: any) {
        if (error?.response?.status === 401) {
          console.warn("Unauthorized: admin token required for dashboard stats");
        } else {
          console.error("Failed to fetch dashboard data", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, router]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-gray-900 tracking-tight">
          Welcome back, {session?.user?.name || "User"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Here's what's happening with your KK360 platform today.
        </p>
      </div>

      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.title}</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <stat.icon className="h-4 w-4 text-gray-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.type}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.map((session, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{session.title}</p>
                    <p className="text-xs text-gray-500">{session.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
