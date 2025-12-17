"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function TeleverificationDetailsPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    callDate: new Date().toISOString().split('T')[0],
    callDurationMinutes: '',
    communicationSkills: 0,
    subjectKnowledge: 0,
    confidenceLevel: 0,
    familySupport: 0,
    financialNeed: 0,
    overallRating: 0,
    recommendation: 'neutral',
    remarks: '',
    comments: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
        const res = await api.get(`/televerification/${id}/details`, { headers });
        setApplication(res.data?.application || null);
      } catch (e) {
        toast.error("Unable to load application details");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, accessToken]);

  const submit = async () => {
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
      await api.put(`/televerification/${id}`, { ...form, status: 'Completed' }, { headers });
      toast.success("Televerification feedback submitted");
      router.push('/dashboard/volunteer');
    } catch {
      toast.error("Failed to submit feedback");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Application Details</h2>
        <Button variant="outline" onClick={()=>router.push('/dashboard/volunteer')}>Back</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Name: {application?.personalInfo?.fullName || '—'}</div>
            <div>Email: {application?.personalInfo?.email || '—'}</div>
            <div>Phone: {application?.personalInfo?.phone || '—'}</div>
            <div>Gender: {application?.personalInfo?.gender || '—'}</div>
            <div>Address: {[
              application?.personalInfo?.address?.street,
              application?.personalInfo?.address?.city,
              application?.personalInfo?.address?.state,
              application?.personalInfo?.address?.pincode
            ].filter(Boolean).join(', ') || '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Educational Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Class: {application?.educationalInfo?.currentClass || '—'}</div>
            <div>School: {application?.educationalInfo?.schoolName || '—'}</div>
            <div>Board: {application?.educationalInfo?.board || '—'}</div>
            <div>Medium: {application?.educationalInfo?.medium || '—'}</div>
            <div>Subjects: {(application?.educationalInfo?.subjects || []).map((s:any)=>s?.name||s).join(', ') || '—'}</div>
            <div>10th %: {application?.educationalInfo?.tenthPercentage || '—'}</div>
            <div>Current %: {application?.educationalInfo?.currentPercentage || '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Family Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Father: {application?.familyInfo?.fatherName || '—'} ({application?.familyInfo?.fatherOccupation || '—'})</div>
            <div>Mother: {application?.familyInfo?.motherName || '—'} ({application?.familyInfo?.motherOccupation || '—'})</div>
            <div>Annual Income: {application?.familyInfo?.annualIncome || '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Why KK: {application?.additionalInfo?.whyKK || '—'}</div>
            <div>Goals: {application?.additionalInfo?.goals || '—'}</div>
            <div>Challenges: {application?.additionalInfo?.challenges || '—'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Televerification Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Call Date</Label>
                <Input type="date" value={form.callDate} onChange={e=>setForm({...form, callDate:e.target.value})} />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" value={form.callDurationMinutes} onChange={e=>setForm({...form, callDurationMinutes:e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['communicationSkills','subjectKnowledge','confidenceLevel','familySupport','financialNeed','overallRating'] as const).map(key => (
                <div key={key}>
                  <Label>{key}</Label>
                  <Input type="number" min={0} max={100} value={(form as any)[key]} onChange={e=>setForm({...form, [key]: Number(e.target.value)})} />
                </div>
              ))}
            </div>
            <div>
              <Label>Recommendation</Label>
              <div className="flex gap-2 mt-1">
                {['selected','rejected','waitlist','neutral'].map(r => (
                  <Button key={r} variant={form.recommendation===r?'default':'outline'} size="sm" onClick={()=>setForm({...form, recommendation:r as any})}>{r}</Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Remarks</Label>
              <Input value={form.remarks} onChange={e=>setForm({...form, remarks:e.target.value})} />
            </div>
            <div>
              <Label>Comments</Label>
              <Input value={form.comments} onChange={e=>setForm({...form, comments:e.target.value})} />
            </div>
            <Button onClick={submit}>Submit</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

