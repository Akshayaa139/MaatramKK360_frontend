"use client";

import React, { useState } from "react";
import { toast } from "../../components/ui/use-toast"; // relative import from app/admin -> components
import AutoMapButton from "@/components/admin/AutoMapButton";
// adjust path if your folder structure differs

export default function AdminDashboardPage() {
  interface Mapping {
    studentId: string;
    tutorId?: string;
    studentName: string;
    tutorName?: string;
    subject: string;
    note: string;
  }

  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [appGroups, setAppGroups] = useState<any[]>([]);
  const [lastMappedCount, setLastMappedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const runAutoMap = async () => {
    // prompt for subject (blank = all)
    const subject = window.prompt(
      "Enter subject to auto-map (leave blank to map all subjects):",
      ""
    );
    setLoading(true);
    try {
      const headers =
        (window as any).__NEXT_DATA__?.props?.pageProps?.session?.accessToken ||
        undefined;
      // prefer next-auth session if available via useSession in this component; using api default localStorage token fallback
      const res = await (
        await import("@/lib/api")
      ).default.post(
        "/admin/automap",
        { subject: subject && subject.trim() ? subject.trim() : undefined },
        {
          headers: headers ? { Authorization: `Bearer ${headers}` } : undefined,
        }
      );
      setLoading(false);
      const data = res.data || {};
      setMappings(data.mappings || []);
      const mappedCount = (data.mappings || []).filter(
        (m: Mapping) => m.tutorId
      ).length;
      toast({
        title: "Auto-map complete",
        description: `${mappedCount} students assigned.`,
      });
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      const resp = err?.response?.data;
      const message =
        resp && typeof resp === "string"
          ? resp
          : resp?.message || err?.message || String(err);
      if (typeof message === "string" && message.trim().startsWith("<")) {
        toast({
          title: "Auto-map error",
          description:
            "Server returned an HTML response (possible auth redirect or server error). Try refreshing your session or re-login.",
        });
      } else {
        toast({ title: "Auto-map error", description: String(message) });
      }
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>

      <div style={{ marginBottom: 16 }}>
        <AutoMapButton
          onComplete={(result) => {
            // result can be either { mappings: [...] } for student auto-map
            // or a full response for application auto-map with mapped + groupsByTutor
            if (result?.mapped) {
              setMappings(result.mapped || []);
              setAppGroups(result.groupsByTutor || []);
              if (typeof result.mappedCount === "number") {
                setLastMappedCount(result.mappedCount);
              } else {
                setLastMappedCount(null);
              }
            } else if (result?.mappings) {
              setMappings(result.mappings || []);
              setAppGroups([]);
              if (typeof result.totalMapped === "number")
                setLastMappedCount(result.totalMapped);
              else setLastMappedCount(null);
            } else {
              // fallback: set mappings if array
              if (Array.isArray(result)) setMappings(result as any);
            }
          }}
        />
      </div>

      <section>
        <h2>Recent Auto-map Results</h2>
        {mappings.length === 0 && appGroups.length === 0 && (
          <div>No mapping results yet.</div>
        )}
        {lastMappedCount !== null && (
          <div style={{ marginBottom: 8 }}>
            <strong>{lastMappedCount}</strong> students were assigned in the
            last run.
          </div>
        )}
        {appGroups.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <h3>Application Groups by Tutor</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ddd", padding: 8 }}>
                    Tutor
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 8 }}>
                    Subject
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 8 }}>
                    Schedule
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 8 }}>
                    Class
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 8 }}>
                    Meeting Link
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 8 }}>
                    Applications
                  </th>
                </tr>
              </thead>
              <tbody>
                {appGroups.map((g: any) => (
                  <tr key={String(g.classId) + String(g.tutorId)}>
                    <td style={{ border: "1px solid #ddd", padding: 8 }}>
                      {g.tutorName || String(g.tutorId)}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: 8 }}>
                      {g.subject}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: 8 }}>
                      {g.schedule?.day ? (
                        `${g.schedule.day} ${g.schedule.startTime || ""}-${
                          g.schedule.endTime || ""
                        }`
                      ) : (
                        <em>—</em>
                      )}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: 8 }}>
                      {String(g.classId)}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: 8 }}>
                      {g.meetingLink ? (
                        <a
                          href={g.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {g.meetingLink}
                        </a>
                      ) : (
                        <em>—</em>
                      )}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: 8 }}>
                      {g.applicationCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {mappings.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>
                  Student
                </th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>Tutor</th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>
                  Subject
                </th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>Note</th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m: any) => (
                <tr key={String(m.studentId) + String(m.tutorId)}>
                  <td style={{ border: "1px solid #ddd", padding: 8 }}>
                    {m.studentName}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: 8 }}>
                    {m.tutorName ?? <em>Unassigned</em>}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: 8 }}>
                    {m.subject}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: 8 }}>
                    {m.note}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: 8 }}>
                    {m.status === "no_slot" ? (
                      <button
                        onClick={async () => {
                          const tutorId = window.prompt(
                            "Enter tutorId to assign this student to:"
                          );
                          const day = window.prompt(
                            "Enter day (e.g., Monday):"
                          );
                          const start = window.prompt(
                            "Enter start time (HH:MM):"
                          );
                          const end = window.prompt("Enter end time (HH:MM):");
                          if (!tutorId || !day || !start || !end)
                            return alert("All fields required");
                          try {
                            const res = await (
                              await import("@/lib/api")
                            ).default.post("/admin/force-create-class", {
                              tutorId,
                              subject: m.subject,
                              slot: { day, startTime: start, endTime: end },
                              applicationIds: [m.applicationId],
                            });
                            alert("Class created and student assigned");
                          } catch (e) {
                            alert("Failed to create class");
                          }
                        }}
                      >
                        Force Create Class
                      </button>
                    ) : (
                      <em>—</em>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
