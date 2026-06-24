'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Plus, Clock, FileText, ArrowRight, User, LogOut, CheckCircle } from 'lucide-react';

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(storedUser));

    // Fetch patient tickets
    fetch('http://localhost:4000/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTickets(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';
      case 'ASSIGNED': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      case 'IN_REVIEW': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20';
      case 'WAITING_FOR_PATIENT': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeTickets = tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#080d19] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-xl text-white">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Medi<span className="text-teal-500">Desk</span> Patient Portal
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-sm font-medium">
            <User className="h-4.5 w-4.5 text-teal-500" />
            <span>{user?.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-3xl p-6 md:p-8 text-slate-950 shadow-xl shadow-teal-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Hello, {user?.name}</h2>
            <p className="text-teal-950 font-medium text-sm md:text-base mt-1.5">
              Need medical attention? Describe your symptoms, upload reports, and connect with our clinical experts immediately.
            </p>
          </div>
          <Link
            href="/dashboard/patient/raise"
            className="bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center gap-2 shadow-lg transition active:scale-[0.98] shrink-0"
          >
            <Plus className="h-5 w-5" />
            Raise Medical Query
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Active Queries</p>
              <h3 className="text-2xl font-bold mt-1">{activeTickets}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Resolved Queries</p>
              <h3 className="text-2xl font-bold mt-1">{resolvedTickets}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Queries</p>
              <h3 className="text-2xl font-bold mt-1">{tickets.length}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Critical Cases</p>
              <h3 className="text-2xl font-bold mt-1">{tickets.filter(t => t.severity === 'CRITICAL').length}</h3>
            </div>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold mb-4">Your Consultation History</h3>
          
          {tickets.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-850 rounded-2xl">
              <p className="text-slate-400">No medical queries raised yet.</p>
              <Link href="/dashboard/patient/raise" className="text-teal-400 font-bold text-sm mt-2 inline-block hover:underline">
                Raise your first ticket
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Ticket ID</th>
                    <th className="pb-3 font-semibold">Title</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Triage Severity</th>
                    <th className="pb-3 font-semibold">Created</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {tickets.map(t => (
                    <tr key={t.id} className="hover:bg-slate-500/5 transition">
                      <td className="py-4 font-bold text-slate-400">{t.ticketNumber}</td>
                      <td className="py-4 font-semibold">{t.title}</td>
                      <td className="py-4 text-xs font-semibold uppercase">{t.category}</td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                          t.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          t.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          t.severity === 'MEDIUM' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {t.severity}
                        </span>
                      </td>
                      <td className="py-4 text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 text-right">
                        <Link
                          href={`/dashboard/patient/ticket/${t.id}`}
                          className="p-2 text-teal-400 hover:text-teal-300 rounded-xl hover:bg-teal-500/5 inline-flex items-center gap-1 text-xs font-bold transition"
                        >
                          View Details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
