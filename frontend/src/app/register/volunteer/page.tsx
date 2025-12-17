"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function VolunteerRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    setStatus(null);
    try {
      const res = await api.post('/auth/register', { name, email, password, role: 'volunteer', phone });
      if (res.status === 201) {
        setStatus('Registered');
        const result = await signIn('credentials', { email, password, redirect: false });
        if (result && !result.error) {
          router.push('/dashboard');
        }
      } else {
        setStatus('Failed');
      }
    } catch {
      setStatus('Failed');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Volunteer Registration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <Button onClick={submit}>Register</Button>
          {status && <div className={status==='Registered'?"text-green-600":"text-red-600"}>{status}</div>}
          {status==='Registered' && (
            <div className="text-sm">
              If not redirected, please <a className="text-blue-600 underline" href="/login">login</a>.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
