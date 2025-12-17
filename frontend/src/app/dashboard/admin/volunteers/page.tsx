"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Phone, Calendar, UserCheck, Clock, Mail, Award, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { useSession } from "next-auth/react";
import api from "@/lib/api";

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'volunteer' | 'alumni';
  status?: 'active' | 'inactive' | 'training';
  district?: string;
  education?: string;
  experience?: string;
  languages?: string[];
  assignedStudents?: number;
  averageRating?: number;
  completedCalls?: number;
  certificationStatus?: 'pending' | 'certified' | 'expired';
}

export default function VolunteerManagement() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<Volunteer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [appSearch, setAppSearch] = useState("");
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

  useEffect(() => {
    const load = async () => {
      try {
        const resV = await api.get('/admin/users?role=volunteer&limit=100', { headers });
        const resA = await api.get('/admin/users?role=alumni&limit=100', { headers });
        const vrows = Array.isArray(resV.data?.users) ? resV.data.users : [];
        const arows = Array.isArray(resA.data?.users) ? resA.data.users : [];
        const all = [...vrows, ...arows].map((u:any)=>({ id:u._id, name:u.name, email:u.email, phone:u.phone, role:u.role }));
        setVolunteers(all);
        setFilteredVolunteers(all);
      } catch {}
    };
    load();
  }, [accessToken]);

  useEffect(() => {
    const fetchApps = async () => {
      if (!selectedVolunteer) return;
      try {
        const res = await api.get('/admin/applications?status=pending&limit=200', { headers });
        const rows = Array.isArray(res.data?.applications) ? res.data.applications : [];
        setApplications(rows);
        setSelectedApplicationIds([]);
        setAppSearch("");
      } catch {}
    };
    fetchApps();
  }, [selectedVolunteer, accessToken]);

  // Filter volunteers
  useEffect(() => {
    let filtered = volunteers;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(volunteer => 
        String(volunteer.name || '').toLowerCase().includes(q) ||
        String(volunteer.email || '').toLowerCase().includes(q) ||
        String(volunteer.phone || '').includes(searchTerm) ||
        String(volunteer.district || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(volunteer => volunteer.status === statusFilter);
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(volunteer => volunteer.role === roleFilter);
    }

    if (districtFilter !== "all") {
      filtered = filtered.filter(volunteer => volunteer.district === districtFilter);
    }

    setFilteredVolunteers(filtered);
  }, [volunteers, searchTerm, statusFilter, roleFilter, districtFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", className: "bg-green-100 text-green-800" },
      inactive: { label: "Inactive", className: "bg-gray-100 text-gray-800" },
      training: { label: "In Training", className: "bg-yellow-100 text-yellow-800" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      volunteer: { label: "Volunteer", className: "bg-blue-100 text-blue-800" },
      alumni: { label: "Alumni", className: "bg-purple-100 text-purple-800" }
    } as const;
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getCertificationBadge = (status: string) => {
    const config = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      certified: { label: "Certified", className: "bg-green-100 text-green-800" },
      expired: { label: "Expired", className: "bg-red-100 text-red-800" }
    };
    
    const badgeConfig = config[status as keyof typeof config];
    return <Badge className={badgeConfig.className}>{badgeConfig.label}</Badge>;
  };

  const handleAssignStudents = async (volunteerId: string, applicationIds: string[]) => {
    if (!applicationIds.length) return;
    try {
      for (const appId of applicationIds) {
        await api.post('/televerification/assign', { applicationId: appId, volunteerId }, { headers });
      }
      setVolunteers(prev => prev.map(v => v.id === volunteerId ? { ...v, assignedStudents: (v.assignedStudents || 0) + applicationIds.length } : v));
      setSelectedApplicationIds([]);
    } catch {}
  };

  const handleUpdateStatus = (volunteerId: string, newStatus: string) => {
    setVolunteers(prev => 
      prev.map(volunteer => 
        volunteer.id === volunteerId 
          ? { ...volunteer, status: newStatus as Volunteer['status'] }
          : volunteer
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Volunteer Management</h1>
              <p className="text-gray-600 mt-2">Manage KK Program Volunteers - Televerification & Panel Members</p>
            </div>
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Add New Volunteer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Volunteer</DialogTitle>
                    <DialogDescription>
                      Register a new volunteer for the KK Program
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="Enter volunteer name" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="Enter email address" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" placeholder="Enter phone number" />
                      </div>
                      <div>
                        <Label htmlFor="district">District</Label>
                        <Select>
                          <SelectTrigger id="district">
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Chennai">Chennai</SelectItem>
                            <SelectItem value="Coimbatore">Coimbatore</SelectItem>
                            <SelectItem value="Madurai">Madurai</SelectItem>
                            <SelectItem value="Trichy">Trichy</SelectItem>
                            <SelectItem value="Salem">Salem</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select>
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="volunteer">Volunteer</SelectItem>
                            <SelectItem value="alumni">Alumni</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="education">Education</Label>
                        <Input id="education" placeholder="Educational background" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="experience">Experience</Label>
                      <Input id="experience" placeholder="Relevant experience" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={async()=>{
                      const name = (document.getElementById('name') as HTMLInputElement)?.value || '';
                      const email = (document.getElementById('email') as HTMLInputElement)?.value || '';
                      const phone = (document.getElementById('phone') as HTMLInputElement)?.value || '';
                      const roleEl = document.getElementById('role') as HTMLDivElement;
                      const role = (roleEl?.querySelector('[data-state="checked"]') as HTMLElement)?.getAttribute('data-value') || 'volunteer';
                      try {
                        await api.post('/auth/register', { name, email, password: 'Temp@1234', role, phone });
                        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
                        const resV = await api.get('/admin/users?role=volunteer&limit=100', { headers });
                        const resA = await api.get('/admin/users?role=alumni&limit=100', { headers });
                        const vrows = Array.isArray(resV.data?.users) ? resV.data.users : [];
                        const arows = Array.isArray(resA.data?.users) ? resA.data.users : [];
                        const all = [...vrows, ...arows].map((u:any)=>({ id:u._id, name:u.name, email:u.email, phone:u.phone, role:u.role }));
                        setVolunteers(all);
                        setFilteredVolunteers(all);
                      } catch {}
                    }}>Register Volunteer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{volunteers.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {volunteers.filter(v => v.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {volunteers.filter(v => v.role === 'volunteer').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Alumni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {volunteers.filter(v => v.role === 'alumni').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter Volunteers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="training">In Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="district">District</Label>
                <Select value={districtFilter} onValueChange={setDistrictFilter}>
                  <SelectTrigger id="district">
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    <SelectItem value="Chennai">Chennai</SelectItem>
                    <SelectItem value="Coimbatore">Coimbatore</SelectItem>
                    <SelectItem value="Madurai">Madurai</SelectItem>
                    <SelectItem value="Trichy">Trichy</SelectItem>
                    <SelectItem value="Salem">Salem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volunteers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Volunteers ({filteredVolunteers.length})</CardTitle>
            <p className="text-gray-600">Manage volunteer assignments and performance</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Volunteer Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Assigned Students</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVolunteers.map((volunteer) => (
                    <TableRow key={volunteer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{volunteer.name}</div>
                          <div className="text-sm text-gray-500">
                            {volunteer.education} • {volunteer.experience}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(Array.isArray(volunteer.languages) ? volunteer.languages : []).map((lang, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            {volunteer.email}
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {volunteer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(volunteer.role)}</TableCell>
                      <TableCell>{getStatusBadge(String(volunteer.status || 'active'))}</TableCell>
                      <TableCell>{volunteer.district}</TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{volunteer.assignedStudents}</div>
                          <div className="text-xs text-gray-500">students</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Award className="h-3 w-3 mr-1 text-gray-400" />
                            Rating: {volunteer.averageRating}/5
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-3 w-3 mr-1 text-gray-400" />
                            {volunteer.completedCalls} calls completed
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getCertificationBadge(String(volunteer.certificationStatus || 'pending'))}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedVolunteer(volunteer)}>
                                <Calendar className="h-4 w-4 mr-1" />
                                Assign
                              </Button>
                            </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Assign Students to {volunteer.name}</DialogTitle>
                                  <DialogDescription>
                                    Assign students for televerification or panel interviews
                                  </DialogDescription>
                                </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div>
                                  <Label>Search Applications</Label>
                                  <Input placeholder="Name, email, phone" value={appSearch} onChange={(e)=>setAppSearch(e.target.value)} />
                                </div>
                                <div>
                                  <Label>Select Students</Label>
                                  <ScrollArea className="h-64 border rounded-md p-2">
                                    <div className="space-y-2">
                                      {applications.filter((a:any)=>{
                                        const q = appSearch.toLowerCase();
                                        const nm = String(a.personalInfo?.fullName || a.name || '').toLowerCase();
                                        const em = String(a.personalInfo?.email || a.email || '').toLowerCase();
                                        const ph = String(a.personalInfo?.phone || a.phone || '');
                                        return !q || nm.includes(q) || em.includes(q) || ph.includes(appSearch);
                                      }).map((a:any)=>{
                                        const id = a._id;
                                        const checked = selectedApplicationIds.includes(id);
                                        return (
                                          <div key={id} className="flex items-center gap-3">
                                            <Checkbox checked={checked} onCheckedChange={(val)=>{
                                              setSelectedApplicationIds(prev=>{
                                                if (val) return [...prev, id];
                                                return prev.filter(x=>x!==id);
                                              });
                                            }} />
                                            <div className="text-sm">
                                              <div className="font-medium">{a.personalInfo?.fullName || a.name}</div>
                                              <div className="text-muted-foreground">{a.personalInfo?.email || a.email} • {a.personalInfo?.phone || a.phone}</div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {applications.length===0 && <div className="text-sm text-muted-foreground">No pending applications</div>}
                                    </div>
                                  </ScrollArea>
                                </div>
                                <div>
                                  <Label>Selected</Label>
                                  <div className="text-sm">{selectedApplicationIds.length} students</div>
                                  <div className="text-xs text-muted-foreground">
                                    {applications.filter((a:any)=>selectedApplicationIds.includes(a._id)).map((a:any)=>a.personalInfo?.fullName || a.name).join(', ')}
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={() => handleAssignStudents(volunteer.id, selectedApplicationIds)}>
                                  Assign Students
                                </Button>
                              </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          
                          <Select 
                            value={volunteer.status} 
                            onValueChange={(value) => handleUpdateStatus(volunteer.id, value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="training">Training</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredVolunteers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No volunteers found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
