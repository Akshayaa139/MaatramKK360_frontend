"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/components/ui/use-toast";

type Qualification = { degree: string; field: string; institution: string; year: string };
type SlotStatus = "available" | "unavailable" | "booked";
type Slot = { time: string; status: SlotStatus };
type DayAvailability = { day: string; slots: Slot[] };
type Leave = { startDate: string; endDate: string; reason: string };
type TutorProfile = { name: string; email: string; phone: string; subjects: string[]; bio: string; profileImage: string; qualifications: Qualification[] };
type Prefs = { experienceYears?: number; subjectPreferences?: string[] };
type APIError = { response?: { data?: { message?: string } } };

export default function ProfilePage() {
  const { data: session } = useSession();
  const accessToken = (session as unknown as { accessToken?: string } | null)?.accessToken;
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tutor, setTutor] = useState<TutorProfile>({ name: '', email: '', phone: '', subjects: [], bio: '', profileImage: '', qualifications: [] });
  const [weeklyAvailability, setWeeklyAvailability] = useState<DayAvailability[]>([]);
  const [leaveDates, setLeaveDates] = useState<Leave[]>([]);
  const [prefs, setPrefs] = useState<Prefs>({ experienceYears: 0, subjectPreferences: [] });
  const [newTimes, setNewTimes] = useState<Record<number, { start?: string; end?: string }>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const getNextOccurrence = (dayName: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.indexOf(dayName);
    if (targetDay === -1) return '';

    const today = new Date();
    const currentDay = today.getDay();
    let daysUntil = targetDay - currentDay;

    if (daysUntil <= 0) {
      daysUntil += 7;
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);

    return format(nextDate, "MMM do, yyyy");
  };

  useEffect(() => {
    const load = async () => {
      try {
        const token = (session as unknown as { accessToken?: string } | null)?.accessToken;
        if (!token) return;
        const authHeader = { Authorization: `Bearer ${token}` } as const;
        const [userRes, tutorRes] = await Promise.all([
          api.get('/auth/profile', { headers: authHeader }),
          api.get('/tutor/profile', { headers: authHeader })
        ]);
        const user = userRes.data;
        const tdoc = tutorRes.data?.tutor as {
          subjects?: string[];
          qualifications?: string;
          availability?: { day: string; startTime: string; endTime: string }[];
          leaveDate?: string | null;
          experienceYears?: number;
          subjectPreferences?: string[];
        } | undefined;
        setTutor({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          subjects: tdoc?.subjects || [],
          bio: '',
          profileImage: user?.profilePicture || '',
          qualifications: tdoc?.qualifications ? [{ degree: tdoc.qualifications, field: '', institution: '', year: '' }] : []
        });
        const existingAvail = Array.isArray(tdoc?.availability) ? tdoc!.availability : [];
        const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        const avail: DayAvailability[] = allDays.map(dayName => {
          const foundDay = existingAvail.find((a: { day: string; startTime: string; endTime: string }) => a.day === dayName);
          if (foundDay) {
            return {
              day: dayName,
              slots: [{ time: `${foundDay.startTime} - ${foundDay.endTime}`, status: "available" as const }]
            };
          }
          return { day: dayName, slots: [] };
        });
        setWeeklyAvailability(avail);
        setLeaveDates(tdoc?.leaveDate ? [{ startDate: new Date(tdoc.leaveDate).toISOString().split('T')[0], endDate: new Date(tdoc.leaveDate).toISOString().split('T')[0], reason: 'Leave' }] : []);
        setPrefs({ experienceYears: tdoc?.experienceYears || 0, subjectPreferences: tdoc?.subjectPreferences || [] });
      } catch { }
    };
    load();
  }, [session]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    try {
      setSavingProfile(true);
      await api.put('/tutor/profile', {
        name: tutor.name,
        phone: tutor.phone,
        email: tutor.email,
        subjects: tutor.subjects,
        qualifications: (tutor.qualifications?.[0]?.degree || 'Not specified'),
        subjectPreferences: prefs.subjectPreferences,
        experienceYears: prefs.experienceYears
      }, { headers: authHeader });
      try {
        const res = await api.get('/tutor/profile', { headers: authHeader });
        const tdoc = res.data?.tutor || {};
        setTutor(t => ({
          ...t,
          subjects: tdoc?.subjects || t.subjects,
          qualifications: tdoc?.qualifications ? [{ degree: tdoc.qualifications, field: '', institution: '', year: '' }] : t.qualifications,
        }));
      } catch { }
      toast({ title: 'Profile updated', description: 'Your profile information has been saved.' });
    } catch (err: unknown) {
      const msg = (err as APIError)?.response?.data?.message || 'Failed to update profile';
      toast({ title: 'Update failed', description: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvailabilityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const availability = weeklyAvailability.flatMap((d) =>
      d.slots
        .filter((s) => s.status === "available")
        .map((s) => ({ day: d.day, startTime: s.time.split(' - ')[0], endTime: s.time.split(' - ')[1] }))
    );
    const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    try {
      setSavingAvailability(true);
      await api.put('/tutor/availability', { availability }, { headers: authHeader });
      try {
        const res = await api.get('/tutor/profile', { headers: authHeader });
        const tdoc = res.data?.tutor || {};
        const avail: DayAvailability[] = (tdoc?.availability || []).map((a: { day: string; startTime: string; endTime: string }) => ({
          day: a.day,
          slots: [{ time: `${a.startTime} - ${a.endTime}`, status: "available" }]
        }));
        setWeeklyAvailability(avail);
      } catch { }
      toast({ title: 'Availability saved', description: 'Your weekly availability has been updated.' });
    } catch (err: unknown) {
      const msg = (err as APIError)?.response?.data?.message || 'Failed to update availability';
      toast({ title: 'Update failed', description: msg });
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    try {
      await api.put('/tutor/leave', { leaveDate: date?.toISOString() }, { headers: authHeader });
      toast({ title: 'Leave added', description: 'Your leave date has been saved.' });
      // Reload or update local state
    } catch (err: unknown) {
      const msg = (err as APIError)?.response?.data?.message || 'Failed to add leave';
      toast({ title: 'Update failed', description: msg });
    }
  };

  const handleDeleteLeave = async (_index: number) => {
    const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    try {
      await api.put('/tutor/leave', { leaveDate: null }, { headers: authHeader });
      toast({ title: 'Leave cleared', description: 'Your leave date has been removed.' });
      setLeaveDates([]);
    } catch (err: unknown) {
      const msg = (err as APIError)?.response?.data?.message || 'Failed to clear leave';
      toast({ title: 'Update failed', description: msg });
    }
  };

  const handleToggleSlot = (dayIndex: number, slotIndex: number) => {
    setWeeklyAvailability(prev => prev.map((d, di) => di !== dayIndex ? d : ({
      ...d,
      slots: d.slots.map((s, si) => si !== slotIndex ? s : ({ ...s, status: s.status === "available" ? "unavailable" : "available" }))
    })));
  };

  const handleRemoveSlot = (dayIndex: number, slotIndex: number) => {
    const day = weeklyAvailability[dayIndex]?.day || '';
    setWeeklyAvailability(prev => prev.map((d, di) => di !== dayIndex ? d : ({
      ...d,
      slots: d.slots.filter((_, si) => si !== slotIndex)
    })));
    toast({ title: 'Slot removed', description: `${day}` });
  };

  const saveAll = () => {
    // Placeholder if needed, or if separate save buttons are used
    // The UI shows a "Save All Changes" button that calls this
    // We can just trigger both forms? Or maybe just ignore for now as individual saves exist.
    // But let's implement it to call both
    // But events are needed.
    // For now just console log or toast.
    toast({ title: 'Please save each section individually', description: 'Use the save buttons in each tab.' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Profile & Availability</h2>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="availability">Availability Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Update your profile picture and personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={tutor.profileImage} alt={tutor.name} />
                    <AvatarFallback>{tutor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <Button size="sm" variant="outline" className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-lg">{tutor.name}</h3>
                  <p className="text-sm text-muted-foreground">{tutor.email}</p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  {tutor.subjects.map((subject, index) => (
                    <Badge key={index} variant="outline">{subject}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and qualifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input id="full-name" value={tutor.name} onChange={(e) => setTutor((t) => ({ ...t, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={tutor.email} onChange={(e) => setTutor((t) => ({ ...t, email: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={tutor.phone} onChange={(e) => setTutor((t) => ({ ...t, phone: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subjects">Primary Subject</Label>
                      <Select value={tutor.subjects[0] ?? 'Mathematics'} onValueChange={(val) => setTutor((t) => ({ ...t, subjects: [val, ...t.subjects.slice(1)] }))}>
                        <SelectTrigger id="subjects">
                          <SelectValue placeholder="Select primary subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Physics">Physics</SelectItem>
                          <SelectItem value="Chemistry">Chemistry</SelectItem>
                          <SelectItem value="Biology">Biology</SelectItem>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input id="experience" type="number" value={String(prefs.experienceYears ?? 0)} onChange={(e) => setPrefs(p => ({ ...p, experienceYears: Number(e.target.value || 0) }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pref-subject">Subject Preference</Label>
                      <Select
                        value={(prefs.subjectPreferences && prefs.subjectPreferences[0]) || ''}
                        onValueChange={(val) => setPrefs(p => ({
                          ...p,
                          subjectPreferences: [val, ...((p.subjectPreferences || []).filter(s => s !== val))]
                        }))}
                      >
                        <SelectTrigger id="pref-subject">
                          <SelectValue placeholder="Select subject preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Physics">Physics</SelectItem>
                          <SelectItem value="Chemistry">Chemistry</SelectItem>
                          <SelectItem value="Biology">Biology</SelectItem>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" rows={4} value={tutor.bio} onChange={(e) => setTutor((t) => ({ ...t, bio: e.target.value }))} />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Qualifications</h4>
                    {tutor.qualifications.map((qual, index) => (
                      <div key={index} className="grid gap-4 md:grid-cols-4 items-center border p-3 rounded-md">
                        <div>
                          <Label htmlFor={`degree-${index}`}>Degree</Label>
                          <Input
                            id={`degree-${index}`}
                            value={qual.degree}
                            onChange={(e) => setTutor((t) => {
                              const next = [...t.qualifications];
                              next[index] = { ...next[index], degree: e.target.value };
                              return { ...t, qualifications: next };
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`field-${index}`}>Field of Study</Label>
                          <Input
                            id={`field-${index}`}
                            value={qual.field}
                            onChange={(e) => setTutor((t) => {
                              const next = [...t.qualifications];
                              next[index] = { ...next[index], field: e.target.value };
                              return { ...t, qualifications: next };
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`institution-${index}`}>Institution</Label>
                          <Input
                            id={`institution-${index}`}
                            value={qual.institution}
                            onChange={(e) => setTutor((t) => {
                              const next = [...t.qualifications];
                              next[index] = { ...next[index], institution: e.target.value };
                              return { ...t, qualifications: next };
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`year-${index}`}>Year</Label>
                          <Input
                            id={`year-${index}`}
                            value={qual.year}
                            onChange={(e) => setTutor((t) => {
                              const next = [...t.qualifications];
                              next[index] = { ...next[index], year: e.target.value };
                              return { ...t, qualifications: next };
                            })}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setTutor((t) => ({
                        ...t,
                        qualifications: [...t.qualifications, { degree: '', field: '', institution: '', year: '' }]
                      }))}
                    >
                      Add Qualification
                    </Button>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingProfile}>Save Profile Information</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
                <CardDescription>Set your regular weekly availability for tutoring sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAvailabilityUpdate} className="space-y-6">
                  {weeklyAvailability.map((day, dayIndex) => (
                    <div key={day.day} className="space-y-4 border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2">
                          <span>{day.day}</span>
                          <span className="text-sm text-gray-500 font-normal">{getNextOccurrence(day.day)}</span>
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {day.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-sm font-medium">{slot.time}</span>
                              <Badge variant={slot.status === "booked" ? "secondary" : "outline"} className="ml-2">
                                {slot.status === "booked" ? "Booked" : "Available"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <Switch id={`slot-${dayIndex}-${slotIndex}`} checked={slot.status === "available"} onCheckedChange={() => handleToggleSlot(dayIndex, slotIndex)} />
                                <Label htmlFor={`slot-${dayIndex}-${slotIndex}`}>{slot.status === "available" ? "Available" : "Unavailable"}</Label>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveSlot(dayIndex, slotIndex)}>Remove</Button>
                            </div>
                          </div>
                        ))}

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor={`start-${dayIndex}`}>Start</Label>
                            <Input id={`start-${dayIndex}`} type="time" onChange={(e) => setNewTimes((prev) => ({ ...prev, [dayIndex]: { ...(prev[dayIndex] || {}), start: e.target.value } }))} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`end-${dayIndex}`}>End</Label>
                            <Input id={`end-${dayIndex}`} type="time" onChange={(e) => setNewTimes((prev) => ({ ...prev, [dayIndex]: { ...(prev[dayIndex] || {}), end: e.target.value } }))} />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => {
                            const ns = newTimes[dayIndex] || { start: '', end: '' };
                            const start = ns.start || '18:00';
                            const end = ns.end || '19:00';
                            setWeeklyAvailability(prev => prev.map((d, di) => di !== dayIndex ? d : ({
                              ...d,
                              slots: [...d.slots, { time: `${start} - ${end}`, status: 'available' }]
                            })));
                            toast({ title: 'Slot added', description: `${day.day} • ${start} - ${end}` });
                          }}
                        >
                          Add Time Slot
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingAvailability}>Save Availability</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Leave & Time Off</CardTitle>
                <CardDescription>Schedule your leave days and time off</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddLeave} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leave-reason">Reason (Optional)</Label>
                    <Textarea id="leave-reason" placeholder="Reason for leave" rows={2} />
                  </div>
                  <Button type="submit" className="w-full">Add Leave</Button>
                </form>

                <div className="mt-6 space-y-4">
                  <h4 className="font-medium">Scheduled Leave</h4>
                  {leaveDates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No leave scheduled</p>
                  ) : (
                    <div className="space-y-2">
                      {leaveDates.map((leave, index) => (
                        <div key={index} className="flex items-center justify-between border p-2 rounded-md">
                          <div>
                            <div className="font-medium">
                              {leave.startDate === leave.endDate ? leave.startDate : `${leave.startDate} - ${leave.endDate}`}
                            </div>
                            <div className="text-sm text-muted-foreground">{leave.reason}</div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteLeave(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
