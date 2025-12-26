"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type SelectedRow = { applicationId: string; name: string; subject: string; medium: string; tutors: { id: string; name: string }[] };

type Classified = {
  id: string;
  name: string;
  email: string;
  phone: string;
  grade: string;
  medium: string;
  board: string;
  schoolName: string;
  subjects: string[];
  tenthPercentage: string;
  currentPercentage: string;
  annualIncome: string;
  dropoutRisk: string;
};

export default function ManageStudents() {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [mediumFilter, setMediumFilter] = useState<string>('all');
  const [rows, setRows] = useState<SelectedRow[]>([]);
  const [classified, setClassified] = useState<Classified[]>([]);
  const [classSubj, setClassSubj] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('12');

  useEffect(() => {
    const load = async () => {
      try {
        const authHeader = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
        const res = await api.get('/admin/selected-students', { headers: authHeader });
        setRows(res.data || []);
      } catch {
        setRows([]);
      }
    };
    load();
  }, [session]);

  useEffect(() => {
    const loadClassified = async () => {
      try {
        const authHeader = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
        const params = new URLSearchParams();
        if (gradeFilter) params.set('grade', gradeFilter);
        if (classSubj !== 'all') params.set('subject', classSubj);
        const res = await api.get(`/admin/students/classified?${params.toString()}`, { headers: authHeader });
        setClassified(res.data || []);
      } catch {
        setClassified([]);
      }
    };
    loadClassified();
  }, [session, classSubj, gradeFilter]);

  const subjects = useMemo(() => Array.from(new Set(rows.map(r => r.subject))).sort(), [rows]);
  const mediums = useMemo(() => Array.from(new Set(rows.map(r => r.medium))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter(r => {
      const qmatch = r.name.toLowerCase().includes(q) || r.applicationId.toLowerCase().includes(q);
      const smatch = subjectFilter === 'all' || r.subject === subjectFilter;
      const mmatch = mediumFilter === 'all' || r.medium === mediumFilter;
      return qmatch && smatch && mmatch;
    });
  }, [rows, query, subjectFilter, mediumFilter]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="selected">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="selected">Selected Students</TabsTrigger>
          <TabsTrigger value="classified">Classified Students</TabsTrigger>
        </TabsList>
        <TabsContent value="selected" className="space-y-4 mt-4">
          <h1 className="text-2xl font-bold">Selected Students</h1>
          <p className="text-gray-600">View selected students by subject and medium, with mapped tutors</p>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input type="search" placeholder="Search by name or application id..." className="w-full md:w-1/2 rounded-md border px-3 py-2" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="w-full md:w-40 rounded-md border px-3 py-2" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="all">All Subjects</option>
              {subjects.map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
            <select className="w-full md:w-40 rounded-md border px-3 py-2" value={mediumFilter} onChange={(e) => setMediumFilter(e.target.value)}>
              <option value="all">All Mediums</option>
              {mediums.map(m => (<option key={m} value={m}>{m}</option>))}
            </select>
          </div>
          <div className="overflow-x-auto rounded-md border bg-white">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Application No.</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medium</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tutors</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dropout Prediction</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r, i) => (
                  <tr key={`${r.applicationId}-${r.subject}-${r.medium}-${i}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-sm">{r.applicationId}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-2 text-sm"><Badge variant="outline">{r.subject}</Badge></td>
                    <td className="px-4 py-2 text-sm"><Badge variant="outline">{r.medium}</Badge></td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {r.tutors.map(t => (<Badge key={t.id} variant="secondary">{t.name}</Badge>))}
                        {r.tutors.length === 0 && (<Badge variant="outline">No tutors mapped</Badge>)}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <Badge
                        variant={
                          (r as any).dropoutRisk === "Perfect" ? "default" :
                            (r as any).dropoutRisk === "Maybe Dropout" ? "outline" :
                              (r as any).dropoutRisk === "Sure Dropout" ? "destructive" : "secondary"
                        }
                        className={
                          (r as any).dropoutRisk === "Perfect" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                            (r as any).dropoutRisk === "Maybe Dropout" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""
                        }
                      >
                        {(r as any).dropoutRisk || "No Data"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No selected students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="classified" className="space-y-4 mt-4">
          <h1 className="text-2xl font-bold">Classified Students</h1>
          <p className="text-gray-600">Classified by grade with full details from initial application. Filter by grade and subjects.</p>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <select className="w-full md:w-40 rounded-md border px-3 py-2" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              {['', '10', '11', '12'].map(g => (<option key={g || 'all'} value={g}>{g ? `${g}th` : 'All Grades'}</option>))}
            </select>
            <select className="w-full md:w-40 rounded-md border px-3 py-2" value={classSubj} onChange={(e) => setClassSubj(e.target.value)}>
              <option value="all">All Subjects</option>
              {Array.from(new Set(classified.flatMap(c => c.subjects))).map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="overflow-x-auto rounded-md border bg-white">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medium</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Board</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">10th %</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current %</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Income</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dropout Prediction</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {classified.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-2 text-sm">{c.email}</td>
                    <td className="px-4 py-2 text-sm">{c.phone}</td>
                    <td className="px-4 py-2 text-sm"><Badge variant="outline">{c.medium || '—'}</Badge></td>
                    <td className="px-4 py-2 text-sm">{c.board || '—'}</td>
                    <td className="px-4 py-2 text-sm">{c.schoolName || '—'}</td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {c.subjects.map(s => (<Badge key={s} variant="secondary">{s}</Badge>))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">{c.tenthPercentage || '—'}</td>
                    <td className="px-4 py-2 text-sm">{c.currentPercentage || '—'}</td>
                    <td className="px-4 py-2 text-sm">{c.annualIncome || '—'}</td>
                    <td className="px-4 py-2 text-sm">
                      <Badge
                        variant={
                          c.dropoutRisk === "Perfect" ? "default" :
                            c.dropoutRisk === "Maybe Dropout" ? "outline" :
                              c.dropoutRisk === "Sure Dropout" ? "destructive" : "secondary"
                        }
                        className={
                          c.dropoutRisk === "Perfect" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                            c.dropoutRisk === "Maybe Dropout" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""
                        }
                      >
                        {c.dropoutRisk || "No Data"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {classified.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-6 text-center text-sm text-gray-500">No 12th students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
