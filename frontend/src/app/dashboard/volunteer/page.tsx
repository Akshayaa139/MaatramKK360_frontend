"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTabSession } from "@/hooks/useTabSession";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Application = {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  educationalInfo?: {
    subjects: Array<{ name: string } | string>;
  };
};

type TV = {
  _id: string;
  status: string;
  remarks?: string;
  recommendation?: string;
  application: Application;
};

type Student = {
  _id: string;
  applicationId?: string;
  personalInfo?: { fullName: string };
  email?: string;
};

type Panel = {
  _id: string;
  timeslot?: { startTime?: string; endTime?: string };
  meetingLink?: string;
  batch?: { students: Student[] };
};

export default function VolunteerDashboard() {
  const { data: session } = useTabSession();
  const [items, setItems] = useState<TV[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string>("Recommend");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      const router = useRouter();
      router.push("/login");
      return;
    }
    if (status === "loading" || !session?.user) return;

    const load = async () => {
      try {
        setLoading(true);
        // api.ts handles the token from sessionStorage automatically
        const res = await api.get("/televerification/mine");
        setItems(Array.isArray(res.data) ? res.data : []);

        const p = await api.get("/panels/mine");
        setPanels(Array.isArray(p.data) ? p.data : []);
      } catch (e) {
        console.error(e);
        // toast.error("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };
    if (session?.user) {
      load();
    }
  }, [session]);

  const openEvaluationDialog = (
    student: Student,
    panelId: string,
    rec: string
  ) => {
    setSelectedStudent(student);
    setSelectedPanelId(panelId);
    setRecommendation(rec);
    setIsDialogOpen(true);
  };

  const submitEvaluation = async () => {
    if (!selectedStudent || !selectedPanelId) return;
    try {
      setSubmitting(true);
      await api.post("/panel/evaluations", {
        applicationId: selectedStudent._id, // assuming student._id maps to application or student id expected by backend
        panelId: selectedPanelId,
        evaluation: {}, // Empty for quick recommendation? Or should be full form?
        recommendation: recommendation,
        comments: "",
      });
      toast.success("Evaluation submitted");
      setIsDialogOpen(false);

      // Refresh panels
      const p = await api.get("/panels/mine");
      setPanels(Array.isArray(p.data) ? p.data : []);
    } catch (e) {
      toast.error("Failed to submit evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">
        Volunteer Tele-verifications
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Televerification Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((tv) => (
                <div
                  key={tv._id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <div className="font-medium">
                      {tv.application?.personalInfo?.fullName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tv.application?.personalInfo?.email} •{" "}
                      {tv.application?.personalInfo?.phone}
                    </div>
                    <div className="text-xs">
                      Subjects:{" "}
                      {(tv.application?.educationalInfo?.subjects || [])
                        .map((s) => (typeof s === "string" ? s : s.name))
                        .join(", ")}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/dashboard/volunteer/televerification/${tv._id}`}
                    >
                      View
                    </Link>
                  </Button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No assignments
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panels */}
        <Card>
          <CardHeader>
            <CardTitle>My Panels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {panels.map((panel) => (
                <div key={panel._id} className="border rounded p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">
                      Panel •{" "}
                      {new Date(
                        panel.timeslot?.startTime || ""
                      ).toLocaleString() || "—"}
                    </div>
                    {panel.meetingLink && (
                      <a
                        href={panel.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline text-sm"
                      >
                        Join Meeting
                      </a>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(panel.batch?.students || []).map((st) => (
                      <div key={st._id} className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">
                          {st.personalInfo?.fullName || st.email || "Student"}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[
                            "Strongly Recommend",
                            "Recommend",
                            "Do Not Recommend",
                          ].map((r) => (
                            <Button
                              key={r}
                              variant={
                                r === "Do Not Recommend"
                                  ? "destructive"
                                  : "outline"
                              }
                              size="sm"
                              className="text-xs h-7"
                              onClick={() =>
                                openEvaluationDialog(st, panel._id, r)
                              }
                            >
                              {r}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(panel.batch?.students || []).length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No students in this panel
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {panels.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No assigned panels
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Evaluation</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark{" "}
              <b>{selectedStudent?.personalInfo?.fullName}</b> as{" "}
              <b>{recommendation}</b>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitEvaluation} disabled={submitting}>
              {submitting ? "Submitting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
