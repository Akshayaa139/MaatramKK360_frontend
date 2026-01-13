"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { useSession } from "next-auth/react";

export default function AutoMapButton({
  onComplete,
  compact = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onComplete?: (result: any) => void;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const runStudentsMap = async () => {
    const subject = window.prompt(
      "Enter subject to auto-map (leave blank to map all subjects):",
      ""
    );
    setLoading(true);
    try {
      const headers = session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined;
      const res = await api.post(
        "/admin/automap",
        { subject: subject && subject.trim() ? subject.trim() : undefined },
        { headers }
      );
      setLoading(false);
      const data = res.data || {};
      const count =
        typeof data.totalMapped === "number"
          ? data.totalMapped
          : (data.mappings || []).filter((m: { tutorId?: string }) => m.tutorId)
              .length;
      toast({
        title: "Auto-map complete",
        description: `${count} students assigned.`,
      });
      // pass full response so caller can read mappings and totalMapped
      if (onComplete) onComplete(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        toast({ title: "Auto-map failed", description: String(message) });
      }
    }
  };

  const runApplicationsMap = async () => {
    setLoading(true);
    try {
      const headers = session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined;
      const res = await api.post(
        "/admin/applications/automap",
        {},
        { headers }
      );

      setLoading(false);
      const data = res.data || {};

      toast({
        title: "Application auto-map complete",
        description: `${
          data.mappedCount || (data.mapped || []).length
        } assignments created.`,
      });
      if (onComplete) onComplete(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setLoading(false);
      const resp = err?.response?.data;
      const message =
        resp && typeof resp === "string"
          ? resp
          : (resp as { message?: string })?.message ||
            err?.message ||
            String(err);

      if (typeof message === "string" && message.trim().startsWith("<")) {
        toast({
          title: "Application auto-map error",
          description:
            "Server returned an HTML response (possible auth redirect or server error). Try refreshing your session or re-login.",
        });
      } else {
        toast({
          title: "Application auto-map failed",
          description: String(message),
        });
      }
    }
  };

  if (compact) {
    return (
      <Button variant="outline" onClick={runStudentsMap} disabled={loading}>
        {loading ? "Running…" : "Run Auto Mapping"}
      </Button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button variant="outline" onClick={runStudentsMap} disabled={loading}>
        {loading ? "Running…" : "Auto-map Students"}
      </Button>
      <Button onClick={runApplicationsMap} disabled={loading}>
        {loading ? "Running…" : "Auto-map Applications"}
      </Button>
    </div>
  );
}
