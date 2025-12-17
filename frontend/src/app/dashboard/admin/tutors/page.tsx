'use client';
import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useSession } from 'next-auth/react';

type TutorDetail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  qualifications: string;
  classes: { id: string; title: string; subject: string }[];
  meetLinks: { classId: string; title: string; link: string | null }[];
};

const ManageTutors = () => {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'all' | string>('all');

  const [tutors, setTutors] = useState<TutorDetail[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const authHeader = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
        const res = await api.get('/admin/tutors/details', { headers: authHeader });
        setTutors(res.data || []);
      } catch (e) {
        setTutors([]);
      }
    };
    load();
  }, [session]);

  const allSubjects = useMemo(() => Array.from(new Set(tutors.flatMap(t => t.subjects))).sort(), [tutors]);

  const filtered = useMemo(() => {
    return tutors.filter((t) => {
      const q = query.toLowerCase();
      const matchesQuery =
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.qualifications || '').toLowerCase().includes(q);
      const matchesSubject = subjectFilter === 'all' ? true : t.subjects.includes(subjectFilter);
      return matchesQuery && matchesSubject;
    });
  }, [query, subjectFilter, tutors]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manage Tutors</h1>
      <p className="text-gray-600">Search, filter, and manage tutor records.</p>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <input
          type="search"
          placeholder="Search by name or email..."
          className="w-full md:w-1/2 rounded-md border px-3 py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="w-full md:w-60 rounded-md border px-3 py-2"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value as any)}
        >
          <option value="all">All Subjects</option>
          {allSubjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-md border bg-white">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meeting Links</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{t.email}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{t.subjects.join(', ')}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{t.classes?.length || 0}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{(t.meetLinks || []).filter(l => !!l.link).length}</td>
                <td className="px-4 py-2 text-sm text-right">
                  <button className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50">View</button>
                  <button className="ml-2 rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700">Edit</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  No tutors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageTutors;
