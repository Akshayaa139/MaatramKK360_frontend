"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type TV = {
  _id: string;
  status: string;
  remarks?: string;
  recommendation?: string;
  application: any;
};

type Panel = {
  _id: string;
  timeslot?: { startTime?: string; endTime?: string };
  meetingLink?: string;
  batch?: { students: { _id: string; applicationId?: string; personalInfo?: any; email?: string }[] };
};

export default function VolunteerDashboard() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const [items, setItems] = useState<TV[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);

  useEffect(() => {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    const load = async () => {
      try {
        const res = await api.get('/televerification/mine', { headers });
        setItems(Array.isArray(res.data) ? res.data : []);
        const p = await api.get('/panels/mine', { headers });
        setPanels(Array.isArray(p.data) ? p.data : []);
      } catch {}
    };
    load();
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Volunteer Tele-verifications</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assigned Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map(tv => (
                <div key={tv._id} className="p-3 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{tv.application?.personalInfo?.fullName}</div>
                      <div className="text-xs text-muted-foreground">{tv.application?.personalInfo?.email} • {tv.application?.personalInfo?.phone}</div>
                      <div className="text-xs">Subjects: {(tv.application?.educationalInfo?.subjects || []).map((s:any)=>s?.name||s).join(', ')}</div>
                    </div>
                    <Badge variant="outline">{tv.status}</Badge>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/volunteer/televerification/${tv._id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="text-sm text-muted-foreground">No assignments</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-3xl font-bold tracking-tight">Assigned Panels</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {panels.map(panel => (
          <Card key={panel._id}>
            <CardHeader>
              <CardTitle>Panel • {new Date(panel.timeslot?.startTime || '').toLocaleString() || '—'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>Meeting: {panel.meetingLink ? <a href={panel.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">Join</a> : '—'}</div>
              <div className="space-y-2">
                {(panel.batch?.students || []).map(st => (
                  <div key={st._id} className="p-3 border rounded-md">
                    <div className="font-medium">{st.personalInfo?.fullName || st.email || st.applicationId}</div>
                    <div className="text-xs text-muted-foreground">Deadline: {new Date(panel.timeslot?.endTime || '').toLocaleString() || '-'}</div>
                    <div className="mt-2 flex gap-2">
                      {['Strongly Recommend','Recommend','Do Not Recommend'].map(r => (
                        <Button key={r} variant="outline" size="sm" onClick={async ()=>{
                          const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
                          await api.post('/panel/evaluations', { applicationId: st._id, panelId: panel._id, evaluation: {}, recommendation: r, comments: '' }, { headers });
                        }}> {r} </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {panels.length === 0 && (
          <Card>
            <CardHeader><CardTitle>No assigned panels</CardTitle></CardHeader>
            <CardContent>—</CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
