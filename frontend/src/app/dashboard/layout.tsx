"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
  Bell,
  ClipboardCheck,
  FileEdit,
  Clock,
  UserCog,
  HelpCircle,
  Award,
} from "lucide-react";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3); // Example notification count

  const role = (session?.user as any)?.role;
  const isTutor = role === "tutor";
  const isAdmin = role === "admin" || role === "lead";
  const isStudent = role === "student";
  const isVolunteer = role === "volunteer" || role === "alumni";

  // Admin/default navigation
  const adminNavigation = [
    { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Admin", href: "/dashboard/admin", icon: UserCog },
    { name: "Tutors", href: "/dashboard/tutors", icon: Users },
    { name: "Classes", href: "/dashboard/classes", icon: Calendar },
    { name: "Students", href: "/dashboard/students", icon: BookOpen },
    { name: "Engagement", href: "/dashboard/engagement", icon: MessageSquare },
  ];

  // Tutor-specific navigation
  const tutorNavigation = [
    { name: "Dashboard", href: "/dashboard/tutor", icon: LayoutDashboard },
    { name: "My Classes", href: "/dashboard/my-classes", icon: Calendar },
    { name: "Attendance", href: "/dashboard/attendance", icon: ClipboardCheck },
    {
      name: "Assignments & Tests",
      href: "/dashboard/assignments",
      icon: FileEdit,
    },
    { name: "Reschedule/Cancel", href: "/dashboard/reschedule", icon: Clock },
    {
      name: "Announcements",
      href: "/dashboard/announcements",
      icon: Bell,
      notificationCount: notificationCount,
    },
    {
      name: "Student Progress",
      href: "/dashboard/student-progress",
      icon: Award,
    },
    {
      name: "Study Materials",
      href: "/dashboard/tutor/study-materials",
      icon: BookOpen,
    },
    { name: "Mentoring", href: "/dashboard/mentoring", icon: Users },
    {
      name: "Profile & Availability",
      href: "/dashboard/profile",
      icon: UserCog,
    },
    { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
  ];

  const studentNavigation = [
    { name: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
    { name: "Classes", href: "/dashboard/classes", icon: Calendar },
    {
      name: "Assignments & Tests",
      href: "/dashboard/assignments",
      icon: FileEdit,
    },
    { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
  ];

  const volunteerNavigation = [
    { name: "Dashboard", href: "/dashboard/volunteer", icon: LayoutDashboard },
    {
      name: "My Tele-verifications",
      href: "/dashboard/volunteer",
      icon: ClipboardCheck,
    },
    { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
  ];

  const navigation = isAdmin
    ? adminNavigation
    : isTutor
      ? tutorNavigation
      : isVolunteer
        ? volunteerNavigation
        : studentNavigation;

  // Fetch notifications for student
  useEffect(() => {
    if (isStudent) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch('/api/students/notifications'); // Use fetch or axios
          if (res.ok) {
            const data = await res.json();
            setNotificationCount(data.assignments || 0);
          }
        } catch (e) {
          console.error("Failed to fetch notifications");
        }
      };

      fetchNotifications();
      // Optional: Polling every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isStudent]);

  // Update navigation with count
  const finalNavigation = navigation.map(item => {
    if (item.name === "Assignments & Tests" && isStudent) {
      return { ...item, notificationCount: notificationCount };
    }
    return item;
  });

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Mobile sidebar */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 top-4 z-40"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            <div className="flex h-16 items-center justify-center border-b">
              <h2 className="text-xl font-bold">KK360 Platform</h2>
            </div>
            <nav className="mt-5 px-2">
              {finalNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium ${pathname === item.href
                    ? "bg-gray-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${pathname === item.href
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-500"
                        }`}
                    />
                    {item.name}
                  </div>
                  {(item as any).notificationCount && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                      {(item as any).notificationCount}
                    </div>
                  )}
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 w-full border-t p-4">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    {session?.user?.name?.[0] || "U"}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href="/dashboard/settings"
                  className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Settings
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Sign out
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden w-64 border-r bg-white lg:block">
          <div className="flex h-16 items-center justify-center border-b">
            <h2 className="text-xl font-bold">KK360 Platform</h2>
          </div>
          <nav className="mt-5 px-2">
            {finalNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium ${pathname === item.href
                  ? "bg-gray-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <div className="flex items-center">
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${pathname === item.href
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-gray-500"
                      }`}
                  />
                  {item.name}
                </div>
                {(item as any).notificationCount && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {(item as any).notificationCount}
                  </div>
                )}
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-0 w-64 border-t p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/dashboard/settings"
                className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                Settings
              </Link>
              <Link
                href="/api/auth/signout"
                className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                Sign out
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="bg-white shadow">
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold text-gray-900">
                {pathname === "/dashboard"
                  ? "Dashboard"
                  : (pathname.split("/").pop()?.charAt(0).toUpperCase() || "") +
                  pathname.split("/").pop()?.slice(1) || ""}
              </h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      <ToastViewport />
    </ToastProvider>
  );
}
