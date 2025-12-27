"use client";

import { useTabSession } from "@/hooks/useTabSession";
import { useState, useEffect } from "react";
// import { useSession } from "next-auth/react";
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
import ChatWidget from "@/components/ChatWidget";
import api from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useTabSession();
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
    {
      name: "Study Materials",
      href: "/dashboard/study-materials",
      icon: BookOpen,
    },
    { name: "Mentoring", href: "/dashboard/student/mentoring", icon: Users },
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
          const res = await api.get('/students/notifications');
          setNotificationCount(res.data.assignments || 0);
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
      <div className="flex h-screen bg-gray-50 font-sans">
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
            className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-sidebar transition duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            <div className="flex h-16 items-center justify-center border-b border-sidebar-border bg-sidebar">
              <h2 className="text-xl font-heading font-bold text-sidebar-primary tracking-tight">Maatram KK</h2>
            </div>
            <nav className="mt-5 px-3 space-y-1">
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
                        ? "text-sidebar-primary"
                        : "text-gray-400 group-hover:text-sidebar-primary"
                        }`}
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {(item as any).notificationCount && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                      {(item as any).notificationCount}
                    </div>
                  )}
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 w-full border-t border-sidebar-border p-4 bg-sidebar">
              <div className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent border border-sidebar-border">
                  <span className="text-sm font-bold text-sidebar-primary">
                    {session?.user?.name?.[0] || "U"}
                  </span>
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-bold text-sidebar-foreground truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <Link
                  href="/dashboard/settings"
                  className="group flex items-center rounded-lg px-2 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors"
                >
                  <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-sidebar-primary" />
                  Settings
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="group flex items-center rounded-lg px-2 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors"
                >
                  <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-sidebar-primary" />
                  Sign out
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
          <div className="flex h-16 items-center justify-center border-b border-sidebar-border bg-sidebar">
            <h2 className="text-xl font-heading font-bold text-sidebar-primary tracking-tight">Maatram KK</h2>
          </div>
          <nav className="mt-5 px-3 space-y-1">
            {finalNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary"
                  }`}
              >
                <div className="flex items-center">
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${pathname === item.href
                      ? "text-sidebar-primary"
                      : "text-gray-400 group-hover:text-sidebar-primary"
                      }`}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                {(item as any).notificationCount && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-bold text-sidebar-primary-foreground">
                    {(item as any).notificationCount}
                  </div>
                )}
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-0 w-64 border-t border-sidebar-border p-4 bg-sidebar">
            <div className="flex items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent border border-sidebar-border">
                <span className="text-sm font-bold text-sidebar-primary">
                  {session?.user?.name?.[0] || "U"}
                </span>
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-bold text-sidebar-foreground truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{session?.user?.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <Link
                href="/dashboard/settings"
                className="group flex items-center rounded-lg px-2 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors"
              >
                <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-sidebar-primary" />
                Settings
              </Link>
              <Link
                href="/api/auth/signout"
                className="group flex items-center rounded-lg px-2 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-sidebar-primary" />
                Sign out
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200">
            <div className="px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <h1 className="text-xl font-heading font-bold text-gray-900 tracking-tight">
                {pathname === "/dashboard"
                  ? "Dashboard"
                  : (pathname.split("/").pop()?.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "")}
              </h1>
              <div className="flex items-center gap-4">
                {/* Additional header items could go here */}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      <ToastViewport />
      {session?.user?.role === 'student' && <ChatWidget />}
    </ToastProvider>
  );
}
