'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Activity, 
  UserCheck, 
  ShieldAlert, 
  AlertCircle, 
  LogOut, 
  ArrowRight, 
  Search, 
  Filter, 
  SlidersHorizontal,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  Clock,
  User,
  Tag,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function ModeratorDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  // Filtering & Search states
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchDashboardData = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    setLoading(true);
    setError('');

    // Fetch tickets and try to fetch real doctors (fallback to mock if empty/fails)
    Promise.all([
      fetch('http://localhost:4000/tickets', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('http://localhost:4000/tickets/doctors', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
    ])
      .then(async ([res1, res2]) => {
        const ticketData = await res1.json();
        setTickets(Array.isArray(ticketData) ? ticketData : []);
        
        let doctorsData: any[] = [];
        if (res2 && res2.ok) {
          doctorsData = await res2.json();
        }

        // If no doctors returned from backend, fall back to realistic mock doctors
        if (!Array.isArray(doctorsData) || doctorsData.length === 0) {
          setDoctors([
            { id: 'doc-1', name: 'Dr. Sarah Jenkins', specialization: 'Cardiology' },
            { id: 'doc-2', name: 'Dr. Michael Chen', specialization: 'Orthopedics' },
            { id: 'doc-3', name: 'Dr. Elena Rostova', specialization: 'Neurology' },
            { id: 'doc-4', name: 'Dr. David Kim', specialization: 'General Medicine' },
          ]);
        } else {
          setDoctors(doctorsData);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to refresh dashboard data.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Assignment failed');
      }
      
      const assignedDoc = doctors.find(d => d.id === docId);
      setMessage(`Assigned successfully to ${assignedDoc ? assignedDoc.name : 'specialist'}`);
      
      // Refresh local list state
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, doctorId: docId, status: 'ASSIGNED', doctor: assignedDoc } : t));
      setSelectedTicketId(null);
      setSelectedDoctorId('');
    } catch (err: any) {
      setError(err.message || 'Error occurred during assignment. Ensure the doctor exists in the system.');
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    const token = localStorage.getItem('token');
    setError('');
    setMessage('');
    
    try {
      const res = await fetch(`http://localhost:4000/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Status update failed');
      
      setMessage(`Case status updated to ${status}`);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
    } catch (err: any) {
      setError(err.message || 'Error occurred updating status');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  // Filter and Search tickets
  const getFilteredTickets = () => {
    return tickets.filter(t => {
      const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
      const matchesSeverity = filterSeverity === 'ALL' || t.severity === filterSeverity;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        t.title.toLowerCase().includes(searchLower) ||
        t.ticketNumber.toLowerCase().includes(searchLower) ||
        (t.patient?.name && t.patient.name.toLowerCase().includes(searchLower)) ||
        t.category.toLowerCase().includes(searchLower);

      return matchesCategory && matchesSeverity && matchesSearch;
    });
  };

  const filteredList = getFilteredTickets();

  // Group tickets by status for Kanban columns
  const getTicketsByStatus = (status: string) => {
    return filteredList.filter(t => t.status === status);
  };

  const columns = [
    { key: 'OPEN', name: 'Open Intake', color: 'border-t-sky-500', bg: 'bg-sky-500/10', text: 'text-sky-400' },
    { key: 'ASSIGNED', name: 'Assigned to Doctor', color: 'border-t-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
    { key: 'WAITING_FOR_PATIENT', name: 'Pending Reply', color: 'border-t-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    { key: 'RESOLVED', name: 'Resolved', color: 'border-t-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    { key: 'CLOSED', name: 'Closed Case', color: 'border-t-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-400' },
  ];

  // Calculate statistics
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    assigned: tickets.filter(t => t.status === 'ASSIGNED').length,
    pending: tickets.filter(t => t.status === 'WAITING_FOR_PATIENT').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#080d19] min-h-screen">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <Activity className="absolute h-6 w-6 text-amber-500 animate-pulse" />
        </div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse">Loading clinical workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#080d19] text-slate-900 dark:text-slate-100 flex flex-col min-h-screen font-sans transition-colors duration-300">
      
      {/* Navigation Header */}
      <header className="border-b border-slate-200 dark:border-slate-850 bg-white/80 dark:bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-600 to-amber-400 p-2.5 rounded-2xl text-white shadow-md shadow-amber-500/10">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-1.5 leading-none">
              Medi<span className="text-amber-500">Desk</span>
            </h1>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Moderator Space</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDashboardData} 
            title="Refresh Board"
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-500/10 border border-slate-200 dark:border-slate-800 rounded-xl transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 space-y-6 flex flex-col max-w-[1600px] w-full mx-auto overflow-hidden">
        
        {/* Statistics Dashboard Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Cases', val: stats.total, icon: ClipboardList, color: 'from-slate-500 to-slate-400', shadow: 'shadow-slate-500/5' },
            { label: 'Open Intake', val: stats.open, icon: Clock, color: 'from-sky-500 to-sky-400', shadow: 'shadow-sky-500/5' },
            { label: 'Assigned to MD', val: stats.assigned, icon: UserCheck, color: 'from-indigo-500 to-indigo-400', shadow: 'shadow-indigo-500/5' },
            { label: 'Pending Reply', val: stats.pending, icon: ShieldAlert, color: 'from-amber-500 to-amber-400', shadow: 'shadow-amber-500/5' },
            { label: 'Resolved Case', val: stats.resolved, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-400', shadow: 'shadow-emerald-500/5' },
          ].map((item, idx) => (
            <div key={idx} className={`bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl flex items-center justify-between shadow-sm ${item.shadow}`}>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.label}</span>
                <h3 className="text-2xl font-black mt-1 tracking-tight">{item.val}</h3>
              </div>
              <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${item.color} text-white`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>

        {/* Filter Toolbar & Real-time Search */}
        <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center shadow-sm">
          {/* Real-time Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by patient, ticket #, symptoms, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/60 transition"
            />
          </div>

          {/* Filters Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters:</span>
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-amber-500 transition cursor-pointer"
            >
              <option value="ALL">All Specialties</option>
              <option value="GENERAL_MEDICINE">General Medicine</option>
              <option value="CARDIOLOGY">Cardiology</option>
              <option value="ORTHOPEDICS">Orthopedics</option>
              <option value="NEUROLOGY">Neurology</option>
              <option value="DERMATOLOGY">Dermatology</option>
              <option value="PSYCHIATRY">Psychiatry</option>
              <option value="PEDIATRICS">Pediatrics</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-amber-500 transition cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Severity</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>

            {/* Clear filters shortcut */}
            {(filterCategory !== 'ALL' || filterSeverity !== 'ALL' || searchQuery) && (
              <button
                onClick={() => { setFilterCategory('ALL'); setFilterSeverity('ALL'); setSearchQuery(''); }}
                className="text-xs font-bold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-3 animate-fadeIn">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-3 animate-fadeIn">
            <UserCheck className="h-5 w-5 shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
        )}

        {/* Responsive Kanban Board Container */}
        <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="flex gap-5 min-h-[600px] h-[calc(100vh-320px)] pr-2">
            
            {columns.map((col) => {
              const list = getTicketsByStatus(col.key);
              return (
                <div 
                  key={col.key} 
                  className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-2xl w-[310px] min-w-[310px] flex flex-col h-full overflow-hidden shadow-sm"
                >
                  {/* Column Header */}
                  <div className={`p-4 border-t-4 ${col.color} border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center shrink-0`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${col.key === 'OPEN' ? 'bg-sky-500' : col.key === 'ASSIGNED' ? 'bg-indigo-500' : col.key === 'WAITING_FOR_PATIENT' ? 'bg-amber-500' : col.key === 'RESOLVED' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                      <h3 className="font-bold text-sm tracking-tight text-slate-700 dark:text-slate-300">{col.name}</h3>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">{list.length}</span>
                  </div>

                  {/* Cards Scrollable Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20 dark:bg-transparent scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {list.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
                        <span className="text-slate-300 dark:text-slate-700 text-3xl font-black">∅</span>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium italic mt-1">Queue is empty</p>
                      </div>
                    ) : (
                      list.map((ticket: any) => {
                        const isExpanded = selectedTicketId === ticket.id;
                        return (
                          <div
                            key={ticket.id}
                            onClick={() => {
                              setSelectedTicketId(isExpanded ? null : ticket.id);
                              setSelectedDoctorId(ticket.doctorId || '');
                            }}
                            className={`bg-white dark:bg-slate-950/60 border hover:border-slate-300 dark:hover:border-slate-700 p-4 rounded-xl transition-all duration-250 cursor-pointer shadow-sm relative group flex flex-col gap-3 ${
                              isExpanded 
                                ? 'border-amber-500/40 ring-1 ring-amber-500/20 shadow-md' 
                                : 'border-slate-200 dark:border-slate-850'
                            }`}
                          >
                            {/* Card Header Tag & Severity */}
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[9px] font-bold font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                                {ticket.ticketNumber}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                ticket.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20' :
                                ticket.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20' :
                                ticket.severity === 'MEDIUM' ? 'bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20' :
                                'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20'
                              }`}>
                                {ticket.severity}
                              </span>
                            </div>

                            {/* Title & Description */}
                            <div className="space-y-1">
                              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                                {ticket.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {ticket.description}
                              </p>
                            </div>

                            {/* Patient Info & Specialization Badge */}
                            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-850">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-slate-400" />
                                <span className="font-semibold truncate max-w-[100px]">{ticket.patient?.name || 'Unknown Patient'}</span>
                              </div>
                              <span className="font-extrabold text-[8px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded uppercase text-slate-600 dark:text-slate-400">
                                {ticket.category.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Assigned Doctor Display */}
                            {ticket.doctor && (
                              <div className="text-[10px] bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 p-2 rounded-lg border border-indigo-500/10 flex items-center gap-1.5">
                                <UserCheck className="h-3 w-3" />
                                <span className="font-semibold truncate">MD: {ticket.doctor.name}</span>
                              </div>
                            )}

                            {/* Expanded Interactive Actions */}
                            {isExpanded && (
                              <div className="border-t border-slate-100 dark:border-slate-850 pt-3 mt-1 space-y-3 animate-slideDown" onClick={(e) => e.stopPropagation()}>
                                
                                {/* Doctor Assignment Dropdown */}
                                <div>
                                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                                    Assign Specialist
                                  </label>
                                  <div className="flex gap-1.5">
                                    <select
                                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold focus:outline-none focus:border-amber-500 transition cursor-pointer"
                                      value={selectedDoctorId}
                                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                                    >
                                      <option value="">Choose Dr...</option>
                                      {doctors.map(d => (
                                        <option key={d.id} value={d.id}>
                                          {d.name} ({d.specialization})
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => selectedDoctorId && handleAssignDoctor(ticket.id, selectedDoctorId)}
                                      disabled={!selectedDoctorId}
                                      className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition active:scale-[0.98]"
                                    >
                                      Assign
                                    </button>
                                  </div>
                                </div>

                                {/* Status Management Quick Updates */}
                                <div className="space-y-2">
                                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    Quick Operations
                                  </label>
                                  
                                  <div className="flex flex-wrap gap-1.5">
                                    {col.key !== 'RESOLVED' && col.key !== 'CLOSED' && (
                                      <button
                                        onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                                        className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-bold transition text-center"
                                      >
                                        Resolve Case
                                      </button>
                                    )}
                                    
                                    {col.key !== 'WAITING_FOR_PATIENT' && col.key !== 'CLOSED' && col.key !== 'RESOLVED' && (
                                      <button
                                        onClick={() => handleUpdateStatus(ticket.id, 'WAITING_FOR_PATIENT')}
                                        className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-bold transition text-center"
                                      >
                                        Ask Patient
                                      </button>
                                    )}

                                    <Link
                                      href={`/dashboard/patient/ticket/${ticket.id}`}
                                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold text-center flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-800 transition"
                                    >
                                      <span>Consultation Room</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </Link>
                                  </div>
                                </div>

                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })}

          </div>
        </div>

      </main>
    </div>
  );
}
