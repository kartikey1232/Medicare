'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Sparkles, MessageSquare, AlertCircle, Bookmark, CheckSquare, ShieldCheck, LogOut } from 'lucide-react';

export default function DoctorDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctorUser, setDoctorUser] = useState<any>(null);
  
  // Note/Update states
  const [noteText, setNoteText] = useState('');
  const [isNotePrivate, setIsNotePrivate] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('MEDIUM');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/');
      return;
    }

    setDoctorUser(JSON.parse(storedUser));

    // Fetch assigned tickets
    fetch('http://localhost:4000/tickets', {
      headers: { 'Authorization': `Bearer ${token}` }
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

  const loadTicketDetails = async (ticketId: string) => {
    const token = localStorage.getItem('token');
    setError('');
    setMessage('');
    
    try {
      const res = await fetch(`http://localhost:4000/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Error loading details');

      setSelectedTicket(data);
      setSelectedSeverity(data.severity);
    } catch (err: any) {
      setError(err.message || 'Error occurred loading details');
    }
  };

  const handleUpdateSeverity = async (ticketId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:4000/tickets/${ticketId}/severity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ severity: selectedSeverity }),
      });

      if (!res.ok) throw new Error('Failed to update severity');
      setMessage('Triage severity adjusted');
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, severity: selectedSeverity } : t));
    } catch (err: any) {
      setError(err.message || 'Error updating severity');
    }
  };

  const handleAddDoctorNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:4000/tickets/${selectedTicket.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          note: noteText,
          isPrivate: isNotePrivate,
        }),
      });

      if (!res.ok) throw new Error('Failed to save note');

      setMessage('Private clinical note recorded');
      setNoteText('');
      loadTicketDetails(selectedTicket.id);
    } catch (err: any) {
      setError(err.message || 'Error saving note');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:4000/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      setMessage('Ticket marked resolved successfully');
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'RESOLVED' } : t));
      loadTicketDetails(ticketId);
    } catch (err) {
      console.error(err);
    }
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

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#080d19] text-slate-900 dark:text-slate-100 flex flex-col min-h-screen">
      
      {/* Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-xl text-white">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Medi<span className="text-teal-500">Desk</span> Clinician Console
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-3 py-1.5 rounded-xl font-medium">
            <span>Specialist: {doctorUser?.name}</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Grid Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Left Side: Tickets Feed List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col max-h-[80vh]">
          <h3 className="text-base font-bold pb-2 border-b border-slate-800 mb-4 flex justify-between items-center">
            <span>Assigned Triage Cases</span>
            <span className="text-xs font-bold bg-slate-800 text-teal-400 px-2 py-0.5 rounded-full">{tickets.length}</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3">
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 italic">No tickets assigned yet.</div>
            ) : (
              tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => loadTicketDetails(t.id)}
                  className={`border p-4 rounded-2xl cursor-pointer transition flex flex-col gap-2 ${
                    selectedTicket?.id === t.id
                      ? 'bg-teal-950/20 border-teal-500/40'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-slate-500">{t.ticketNumber}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      t.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/35' :
                      t.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{t.severity}</span>
                  </div>

                  <h4 className="text-xs font-bold line-clamp-2 leading-snug">{t.title}</h4>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                    <span>Patient: {t.patient?.name}</span>
                    <span className="uppercase font-semibold text-[8px] bg-slate-800 px-1 py-0.5 rounded text-slate-400">{t.category}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Selected Case Details & AI Helper */}
        <div className="lg:col-span-2 space-y-6 max-h-[85vh] overflow-y-auto pr-1">
          {selectedTicket ? (
            <div className="space-y-6">
              
              {error && (
                <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
                  {message}
                </div>
              )}

              {/* Case Details Box */}
              <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug">{selectedTicket.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Patient ID: <span className="font-mono text-slate-300">{selectedTicket.patient?.name}</span> (Age: {selectedTicket.patient?.age})</p>
                  </div>
                  {selectedTicket.status !== 'RESOLVED' ? (
                    <button
                      onClick={() => handleResolveTicket(selectedTicket.id)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2 px-4 rounded-xl shadow transition"
                    >
                      Resolve Case
                    </button>
                  ) : (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1 rounded-xl">RESOLVED</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold uppercase">Category Area</label>
                    <p className="font-bold mt-0.5">{selectedTicket.category}</p>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold uppercase">Triage Severity Adjuster</label>
                    <div className="flex gap-2 mt-1">
                      <select
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none"
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value)}
                      >
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                      <button
                        onClick={() => handleUpdateSeverity(selectedTicket.id)}
                        className="text-[10px] font-bold bg-teal-500 text-slate-950 px-2 py-1 rounded-lg transition"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase">Symptom Description</label>
                  <p className="text-sm text-slate-200 mt-1 bg-slate-900/50 p-3 rounded-xl border border-slate-800 italic">"{selectedTicket.description}"</p>
                </div>
              </div>

              {/* AI Diagnostic draft generator helper tool */}
              {selectedTicket.aiPrediction && (
                <div className="bg-teal-950/20 border border-teal-500/20 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-teal-400">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    <h4 className="text-sm font-bold uppercase tracking-wider">AI Consultation Assistant</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Extracted Clinical Symptoms</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedTicket.aiPrediction.extractedSymptoms?.map((sym: string, i: number) => (
                          <span key={i} className="bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded">{sym}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Predicted Specialty Group</p>
                      <p className="text-white mt-1 font-bold">{selectedTicket.aiPrediction.predictedCategory}</p>
                    </div>
                  </div>

                  {selectedTicket.aiPrediction.suggestedResponse && (
                    <div className="bg-slate-950/50 border border-slate-800/40 p-4 rounded-2xl relative group">
                      <p className="text-xs text-slate-400 font-semibold mb-1">Suggested Message Draft</p>
                      <p className="text-xs text-slate-300 leading-relaxed italic">"{selectedTicket.aiPrediction.suggestedResponse}"</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTicket.aiPrediction.suggestedResponse);
                          setMessage('Draft response copied to clipboard');
                        }}
                        className="text-[9px] font-bold text-teal-400 hover:text-teal-300 mt-2 block hover:underline"
                      >
                        Copy Draft to Chat
                      </button>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 border-t border-teal-500/10 pt-3 flex gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal-500 shrink-0" />
                    <span>Clinical Safety Shield: Draft responses are hidden from patients until validated and shared by you.</span>
                  </div>
                </div>
              )}

              {/* Private Clinical Notes */}
              <div className="bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-teal-500" />
                  <span>Clinical Notes Diary (Private/Internal)</span>
                </h4>

                {/* Notes History */}
                {selectedTicket.doctorNotes?.length > 0 && (
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {selectedTicket.doctorNotes.map((n: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded-xl text-xs space-y-1">
                        <p className="text-slate-300 font-medium leading-relaxed">{n.note}</p>
                        <p className="text-[9px] text-slate-500">{new Date(n.createdAt).toLocaleString()} - {n.isPrivate ? 'Internal note' : 'Patient visible'}</p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddDoctorNote} className="space-y-3">
                  <textarea
                    required
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-teal-500 h-20"
                    placeholder="Enter clinical notes, diagnoses hypotheses, or records demands..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isNotePrivate}
                        onChange={(e) => setIsNotePrivate(e.target.checked)}
                      />
                      <span>Make note private (Doctors/Moderators only)</span>
                    </label>
                    <button
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg transition"
                    >
                      Record Note
                    </button>
                  </div>
                </form>
              </div>

              {/* Chat Thread redirect link */}
              <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-2xl flex justify-between items-center">
                <span className="text-xs text-slate-300">Need to message the patient? Go to the patient chat space.</span>
                <Link
                  href={`/dashboard/patient/ticket/${selectedTicket.id}`}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold py-2 px-4 rounded-xl shadow transition"
                >
                  Open Consultation Chat
                </Link>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-3xl p-12">
              Select a clinical case from the triage queue to load details.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
