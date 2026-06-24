'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Users, FileText, CheckSquare, BarChart3, ShieldAlert, LogOut, Ban, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Fetch analytics and mock users list
    Promise.all([
      fetch('http://localhost:4000/analytics', { headers: { 'Authorization': `Bearer ${token}` } }),
      // Mock Users list for demonstration of management features
      Promise.resolve([
        { id: 'u-1', email: 'patient.alice@gmail.com', role: 'PATIENT', isSuspended: false, name: 'Alice Watson' },
        { id: 'u-2', email: 'doctor.sarah@medidesk.com', role: 'DOCTOR', isSuspended: false, name: 'Dr. Sarah Jenkins' },
        { id: 'u-3', email: 'moderator.bob@medidesk.com', role: 'MODERATOR', isSuspended: false, name: 'Bob Johnson' },
        { id: 'u-4', email: 'abusive.spammer@gmail.com', role: 'PATIENT', isSuspended: true, name: 'Spam User' },
      ])
    ])
      .then(async ([res1, userMock]) => {
        const stats = await res1.json();
        setAnalytics(stats);
        setUsers(userMock);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const toggleUserSuspension = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: !u.isSuspended } : u));
    // Trigger mock audit log note
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeWorkloadData = analytics?.doctorWorkload || [
    { doctorName: 'Dr. Sarah Jenkins', activeTickets: 3 },
    { doctorName: 'Dr. Michael Chen', activeTickets: 5 },
    { doctorName: 'Dr. Elena Rostova', activeTickets: 2 },
    { doctorName: 'Dr. David Kim', activeTickets: 4 },
  ];

  const trendData = analytics?.ticketTrends || [
    { month: 'Jan', tickets: 45, resolved: 38 },
    { month: 'Feb', tickets: 55, resolved: 48 },
    { month: 'Mar', tickets: 80, resolved: 65 },
    { month: 'Apr', tickets: 95, resolved: 85 },
    { month: 'May', tickets: 120, resolved: 100 },
    { month: 'Jun', tickets: 150, resolved: 130 },
  ];

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#080d19] text-slate-900 dark:text-slate-100 flex flex-col min-h-screen">
      
      {/* Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 p-2 rounded-xl text-white">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Medi<span className="text-red-500">Desk</span> Administration Panel
          </h1>
        </div>

        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
        
        {/* Banner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Users</p>
              <h3 className="text-2xl font-bold mt-1">{users.length + 50}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Queries Raised</p>
              <h3 className="text-2xl font-bold mt-1">{analytics?.cards?.totalTickets || 154}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Resolved Queries</p>
              <h3 className="text-2xl font-bold mt-1">{analytics?.cards?.resolvedTickets || 112}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Unassigned Cases</p>
              <h3 className="text-2xl font-bold mt-1">{analytics?.cards?.openTickets || 42}</h3>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Ticket Trends */}
          <div className="bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-teal-400" />
              <span>Monthly Tickets Growth & Resolutions</span>
            </h3>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                  <Line type="monotone" dataKey="tickets" stroke="#38bdf8" name="Raised" strokeWidth={2} />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Resolved" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Doctor Workload */}
          <div className="bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-red-400" />
              <span>Active Speciality Clinician Workload</span>
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeWorkloadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="doctorName" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                  <Bar dataKey="activeTickets" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Active Cases" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* User Management Section */}
        <div className="bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold mb-4">User Roles & Moderation Desk</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">User Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Workspace Role</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-500/5 transition">
                    <td className="py-4 font-semibold">{u.name}</td>
                    <td className="py-4 text-slate-400 font-mono text-xs">{u.email}</td>
                    <td className="py-4 font-bold text-xs uppercase text-slate-300">{u.role}</td>
                    <td className="py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        u.isSuspended ? 'bg-red-500/20 text-red-500 border border-red-500/35' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {u.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => toggleUserSuspension(u.id)}
                        className={`text-xs font-bold py-1.5 px-3 rounded-lg border transition ${
                          u.isSuspended
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20'
                        }`}
                      >
                        {u.isSuspended ? 'Reactivate' : 'Suspend User'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
