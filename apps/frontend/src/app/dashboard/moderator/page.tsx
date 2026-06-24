'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, UserCheck, ShieldAlert, GitMerge, AlertCircle, Ban, LogOut, ArrowRight, UserPlus } from 'lucide-react';

export default function ModeratorDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  // Filtering states
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Fetch tickets and mock doctors list
    Promise.all([
      fetch('http://localhost:4000/tickets', { headers: { 'Authorization': `Bearer ${token}` } }),
      // Mock Doctors fetch list
      fetch('http://localhost:4000/auth/me', { headers: { 'Authorization': `Bearer ${token}` } }) // testing route accessibility
    ])
      .then(async ([res1, res2]) => {
        const ticketData = await res1.json();
        setTickets(Array.isArray(ticketData) ? ticketData : []);
        
        // Mocking clinical specialists for mapping assignments
        setDoctors([
          { id: 'doc-1', name: 'Dr. Sarah Jenkins (Cardiology)' },
          { id: 'doc-2', name: 'Dr. Michael Chen (Orthopedics)' },
          { id: 'doc-3', name: 'Dr. Elena Rostova (Neurology)' },
          { id: 'doc-4', name: 'Dr. David Kim (General Medicine)' },
        ]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleAssignDoctor = async (ticketId: string, docId: string) => {
    const token = localStorage.getItem('token');
    setError('');
    setMessage('');
    
    try {
      const res = await fetch(`http://localhost:4000/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ doctorId: docId }),
      });

      if (!res.ok) throw new Error('Assignment failed');
      
      setMessage('Specialist assigned successfully');
      // Refresh local list state
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, doctorId: docId, status: 'ASSIGNED' } : t));
      setSelectedTicketId(null);
    } catch (err: any) {
      setError(err.message || 'Error occurred during assignment');
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:4000/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  // Group tickets into columns
  const getTicketsByStatus = (status: string) => {
    return tickets.filter(t => {
      const matchesStatus = t.status === status;
      const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
      const matchesSeverity = filterSeverity === 'ALL' || t.severity === filterSeverity;
      return matchesStatus && matchesCategory && matchesSeverity;
    });
  };

  const columns = [
    { key: 'OPEN', name: 'Open Intake' },
    { key: 'ASSIGNED', name: 'Assigned to Doctor' },
    { key: 'WAITING_FOR_PATIENT', name: 'Pending Patient Reply' },
    { key: 'RESOLVED', name: 'Resolved Queries' },
    { key: 'CLOSED', name: 'Closed Case files' },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#080d19] text-slate-900 dark:text-slate-100 flex flex-col min-h-screen">
      
      {/* Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-xl text-white">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Medi<span className="text-amber-500">Desk</span> Moderator Dashboard
          </h1>
        </div>

        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-8 space-y-6 flex flex-col">
        
        {/* Filters and Actions */}
        <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1">Filter Specialty</label>
              <select
                className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="GENERAL_MEDICINE">General Medicine</option>
                <option value="CARDIOLOGY">Cardiology</option>
                <option value="ORTHOPEDICS">Orthopedics</option>
                <option value="NEUROLOGY">Neurology</option>
                <option value="DERMATOLOGY">Dermatology</option>
                <option value="PSYCHIATRY">Psychiatry</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1">Filter Severity</label>
              <select
                className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Case Count: {tickets.length} total</span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
            <UserCheck className="h-5 w-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Board Columns Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 overflow-y-auto">
          
          {columns.map((col) => {
            const list = getTicketsByStatus(col.key);
            return (
              <div key={col.key} className="bg-slate-900/40 border border-slate-850 p-4 rounded-3xl flex flex-col min-w-[250px] max-h-[70vh]">
                
                {/* Column Title */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <h3 className="font-bold text-sm tracking-tight">{col.name}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-800 rounded-full text-slate-400">{list.length}</span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {list.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 italic">Empty queue</div>
                  ) : (
                    list.map((ticket: any) => (
                      <div
                        key={ticket.id}
                        className="bg-slate-950/60 hover:bg-slate-900/60 border border-slate-800 p-4 rounded-2xl transition space-y-3 cursor-pointer"
                        onClick={() => setSelectedTicketId(ticket.id === selectedTicketId ? null : ticket.id)}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono font-bold text-slate-500">{ticket.ticketNumber}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            ticket.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                            ticket.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}>{ticket.severity}</span>
                        </div>

                        <h4 className="text-xs font-bold leading-tight line-clamp-2">{ticket.title}</h4>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>{ticket.patient?.name}</span>
                          <span className="uppercase font-semibold text-[8px] bg-slate-800 px-1 py-0.5 rounded">{ticket.category}</span>
                        </div>

                        {/* Dropdown controls when ticket is clicked */}
                        {selectedTicketId === ticket.id && (
                          <div className="border-t border-slate-800 pt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                            
                            {/* Doctor Select dropdown */}
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Assign Specialist</label>
                              <div className="flex gap-1.5">
                                <select
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[11px] focus:outline-none"
                                  value={selectedDoctorId}
                                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                                >
                                  <option value="">Choose Dr...</option>
                                  {doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => selectedDoctorId && handleAssignDoctor(ticket.id, selectedDoctorId)}
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-1 rounded text-[10px] font-bold"
                                >
                                  Assign
                                </button>
                              </div>
                            </div>

                            {/* Status Quick Moves */}
                            <div className="flex gap-1.5 justify-between pt-1">
                              {col.key !== 'RESOLVED' && (
                                <button
                                  onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                                  className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold text-center"
                                >
                                  Mark Resolved
                                </button>
                              )}
                              <Link
                                href={`/dashboard/patient/ticket/${ticket.id}`}
                                className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[9px] font-bold text-center inline-flex items-center justify-center gap-0.5"
                              >
                                View Chat
                                <ArrowRight className="h-2.5 w-2.5" />
                              </Link>
                            </div>

                          </div>
                        )}

                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}

        </div>

      </main>
    </div>
  );
}
