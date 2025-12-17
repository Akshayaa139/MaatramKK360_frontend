"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

type AppDoc = {
  _id: string;
  applicationNumber: string;
  status: string;
  createdAt?: string;
  applicationPdf?: string;
  personalInfo?: any;
  educationalInfo?: any;
  familyInfo?: any;
  documents?: any;
  televerification?: any;
  tutorAssignment?: {
    tutor?: any;
    meetingLink?: string;
    schedule?: { day?: string; startTime?: string; endTime?: string };
  };
};

export default function AdminApplicationDetailsPage() {
  const { data: session } = useSession();
  const params = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const [data, setData] = useState<AppDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<{_id:string; name:string; email:string}[]>([]);
  const [assignId, setAssignId] = useState<string>("");
  const [tutors, setTutors] = useState<{_id:string; name:string; email:string}[]>([]);
  const [tutorAssignId, setTutorAssignId] = useState<string>("");

  useEffect(() => {
    const headers = (session as any)?.accessToken ? { Authorization: `Bearer ${(session as any).accessToken}` } : undefined;
    const load = async () => {
      try {
        const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
        if (!idParam) throw new Error('Invalid application id');
        const res = await api.get(`/admin/applications/${idParam}`, { headers });
        setData(res.data);
        const vols = await api.get(`/admin/users?role=volunteer&limit=100`, { headers });
        const alums = await api.get(`/admin/users?role=alumni&limit=100`, { headers });
        const vrows = (Array.isArray(vols.data?.users) ? vols.data.users : (Array.isArray(vols.data) ? vols.data : [])) as any[];
        const arows = (Array.isArray(alums.data?.users) ? alums.data.users : (Array.isArray(alums.data) ? alums.data : [])) as any[];
        setVolunteers([...vrows, ...arows].map(u => ({ _id: u._id, name: u.name, email: u.email })));
        const t = await api.get('/admin/tutors/details', { headers });
        const trows = Array.isArray(t.data) ? t.data : [];
        setTutors(trows.map((r:any)=>({_id:r.id,name:r.name,email:r.email})));
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load application");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, session]);

  const assignVolunteer = async () => {
    if (!assignId || !data?._id) return;
    const headers = (session as any)?.accessToken ? { Authorization: `Bearer ${(session as any).accessToken}` } : undefined;
    await api.post(`/televerification/assign`, { applicationId: data._id, volunteerId: assignId }, { headers });
    const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
    const res = await api.get(`/admin/applications/${idParam}`, { headers });
    setData(res.data);
    setAssignId("");
  };

  const assignTutor = async () => {
    if (!tutorAssignId || !data?._id) return;
    const headers = (session as any)?.accessToken ? { Authorization: `Bearer ${(session as any).accessToken}` } : undefined;
    await api.post(`/admin/applications/${data._id}/assign-tutor`, { tutorId: tutorAssignId }, { headers });
    const res = await api.get(`/admin/applications/${params.id}`, { headers });
    setData(res.data);
    setTutorAssignId("");
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  if (error) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-red-600">{error}</div>
        <Button variant="outline" onClick={() => router.push('/dashboard/admin')}>Back to Admin</Button>
      </div>
    );
  }

  const p = data?.personalInfo || {};
  const e = data?.educationalInfo || {};
  const f = data?.familyInfo || {};
  const d = data?.documents || {};
  const created = data?.createdAt ? new Date(data.createdAt) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Application {data?.applicationNumber}</h2>
        <Badge variant="outline">{data?.status || 'pending'}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Personal</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Name: {p.fullName}</div>
            <div>Email: {p.email}</div>
            <div>Phone: {p.phone}</div>
            <div>Address: {p.address ? `${p.address.street || ''}, ${p.address.city || ''}, ${p.address.state || ''} ${p.address.pincode || ''}` : '-'}</div>
            {created && <div>Submitted: {isNaN(created.getTime()) ? '-' : created.toLocaleString()}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Educational</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Class: {e.currentClass}</div>
            <div>School: {e.schoolName}</div>
            <div>Board: {e.board}</div>
            <div>Medium: {e.medium}</div>
            <div>Subjects: {(Array.isArray(e.subjects) ? e.subjects.map((s: any) => s?.name || s) : []).join(', ')}</div>
            <div>10th %: {e.tenthPercentage || '-'}</div>
            <div>Current %: {e.currentPercentage || '-'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Family</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Father: {f.fatherName} {f.fatherOccupation ? `• ${f.fatherOccupation}` : ''}</div>
            <div>Mother: {f.motherName} {f.motherOccupation ? `• ${f.motherOccupation}` : ''}</div>
            <div>Annual Income: {f.annualIncome || '-'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Photo: {d.photo ? <a className="text-blue-600 underline" href={d.photo} target="_blank" rel="noreferrer">View</a> : '—'}</div>
          <div>Marksheet: {d.marksheet ? <a className="text-blue-600 underline" href={d.marksheet} target="_blank" rel="noreferrer">View</a> : '—'}</div>
          <div>Income Certificate: {d.incomeCertificate ? <a className="text-blue-600 underline" href={d.incomeCertificate} target="_blank" rel="noreferrer">View</a> : '—'}</div>
          <div>ID Proof: {d.idProof ? <a className="text-blue-600 underline" href={d.idProof} target="_blank" rel="noreferrer">View</a> : '—'}</div>
          <div>Application PDF: {data?.applicationPdf ? <a className="text-blue-600 underline" href={data.applicationPdf} target="_blank" rel="noreferrer">Download</a> : '—'}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tele-verification</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {data?.televerification ? (
            <div className="space-y-1">
              <div>Status: <Badge variant="outline">{data.televerification.status}</Badge></div>
              {data.televerification.recommendation && <div>Recommendation: {data.televerification.recommendation}</div>}
              {data.televerification.remarks && <div>Remarks: {data.televerification.remarks}</div>}
              {data.televerification.volunteer && <div>Volunteer: {data.televerification.volunteer.name} ({data.televerification.volunteer.email})</div>}
            </div>
          ) : (
            <div className="text-muted-foreground">No tele-verification assigned</div>
          )}
          <div className="grid grid-cols-3 gap-3 items-end">
            <div className="col-span-2">
              <label className="text-xs">Assign Volunteer/Alumni</label>
              <select className="w-full border rounded-md px-3 py-2" value={assignId} onChange={e=>setAssignId(e.target.value)}>
                <option value="">Select volunteer</option>
                {volunteers.map(v => (<option key={v._id} value={v._id}>{v.name} • {v.email}</option>))}
              </select>
            </div>
            <Button onClick={assignVolunteer}>Assign</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tutor Assignment</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="text-muted-foreground">Assign a tutor and schedule based on tutor availability</div>
          <div className="grid grid-cols-3 gap-3 items-end">
            <div className="col-span-2">
              <label className="text-xs">Select Tutor</label>
              <select className="w-full border rounded-md px-3 py-2" value={tutorAssignId} onChange={e=>setTutorAssignId(e.target.value)}>
                <option value="">Select tutor</option>
                {tutors.map(t => (<option key={t._id} value={t._id}>{t.name} • {t.email}</option>))}
              </select>
            </div>
            <Button onClick={assignTutor}>Assign</Button>
          </div>
          {data?.tutorAssignment && (
            <div className="mt-3">
              <div>Meeting: {data.tutorAssignment.meetingLink ? <a href={data.tutorAssignment.meetingLink} className="text-blue-600 underline" target="_blank" rel="noreferrer">Join</a> : '—'}</div>
              <div>Schedule: {data.tutorAssignment.schedule?.day} {data.tutorAssignment.schedule?.startTime} - {data.tutorAssignment.schedule?.endTime}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
