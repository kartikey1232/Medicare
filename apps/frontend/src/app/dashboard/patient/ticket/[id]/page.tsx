'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import io from 'socket.io-client';
import { Activity, ArrowLeft, Send, User, Calendar, Paperclip, CheckSquare, Sparkles } from 'lucide-react';

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [doctorTyping, setDoctorTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);

    // Fetch ticket details
    fetch(`http://localhost:4000/tickets/${ticketId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setTicket(data);
        setMessages(data.messages || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Connect to WebSocket gateway
    const socket = io('http://localhost:4000', {
      query: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_ticket', { ticketId });
    });

    socket.on('new_message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
      socket.emit('read_receipt', { ticketId, messageId: msg.id });
    });

    socket.on('typing', (data: any) => {
      if (data.userId !== parsedUser.id) {
        setDoctorTyping(data.isTyping);
      }
    });

    return () => {
      socket.emit('leave_ticket', { ticketId });
      socket.disconnect();
    };
  }, [ticketId, router]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, doctorTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      ticketId,
      message: newMessage,
    });

    setNewMessage('');
    // Clear local typing state
    socketRef.current.emit('typing', { ticketId, isTyping: false });
    setIsTyping(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!socketRef.current) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { ticketId, isTyping: true });
    }

    // Debounce typing status
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing', { ticketId, isTyping: false });
      setIsTyping(false);
    }, 2000);
  };

  const getDashboardPath = () => {
    if (!currentUser) return '/';
    switch (currentUser.role) {
      case 'ADMIN':
        return '/dashboard/admin';
      case 'MODERATOR':
        return '/dashboard/moderator';
      case 'DOCTOR':
        return '/dashboard/doctor';
      default:
        return '/dashboard/patient';
    }
  };
  const dashboardPath = getDashboardPath();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950">
        <p className="text-slate-400">Consultation record not found</p>
        <Link href={dashboardPath} className="text-teal-500 mt-2 font-bold hover:underline">
          Go back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#080d19] text-slate-900 dark:text-slate-100 flex flex-col min-h-screen">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href={dashboardPath} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="bg-teal-500 p-2 rounded-xl text-white">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">{ticket.title}</h1>
            <p className="text-[11px] text-slate-400">Ticket ID: <span className="font-mono text-white">{ticket.ticketNumber}</span></p>
          </div>
        </div>
      </header>

      {/* Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Left Side: Ticket Metadata Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold pb-2 border-b border-slate-800">Case Diagnosis Summary</h3>
            
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Consultation Specialization</p>
              <p className="text-sm font-semibold mt-0.5">{ticket.category}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Assigned Clinical Specialist</p>
              <p className="text-sm font-semibold mt-0.5">{ticket.doctor ? ticket.doctor.name : 'Awaiting specialist assignment'}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Triage Severity Status</p>
              <div className="mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  ticket.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  ticket.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  ticket.severity === 'MEDIUM' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                  'bg-slate-500/10 text-slate-500 border-slate-500/20'
                }`}>
                  {ticket.severity} Triage Priority
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Symptoms Description</p>
              <p className="text-sm text-slate-300 mt-1 italic">"{ticket.description}"</p>
            </div>
          </div>

          {/* AI Clinical Warning */}
          <div className="bg-teal-950/20 border border-teal-500/20 p-5 rounded-3xl flex gap-3">
            <Sparkles className="h-6 w-6 text-teal-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wide">AI Safeguard Active</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Triage categories and severity rates are generated as initial guidelines by our clinical AI engine. Final diagnosis and care details are subject to specialist clinician reviews.
              </p>
            </div>
          </div>

          {/* Attachments Drawer */}
          {ticket.attachments?.length > 0 && (
            <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
              <h3 className="text-base font-bold pb-2 border-b border-slate-800 mb-3">Case Attachments</h3>
              <div className="grid grid-cols-2 gap-2">
                {ticket.attachments.map((att: any) => (
                  <a
                    key={att.id}
                    href={`http://localhost:4000${att.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-slate-900 border border-slate-850 hover:border-teal-500/40 transition rounded-xl flex flex-col gap-1 items-center justify-center text-center group"
                  >
                    {att.thumbnailUrl ? (
                      <img src={`http://localhost:4000${att.thumbnailUrl}`} alt="" className="h-12 w-12 object-cover rounded mb-1" />
                    ) : (
                      <Paperclip className="h-6 w-6 text-slate-500 group-hover:text-teal-400 transition" />
                    )}
                    <span className="text-[10px] text-white truncate w-full font-medium">{att.filename}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Consultation Live Chat */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col h-[75vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="text-sm font-bold">Encrypted Discussion Feed</h3>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Send a message to initiate the discussion.
              </div>
            )}
            
            {messages.map((msg, idx) => {
              const isSelf = msg.senderId === currentUser?.id;
              return (
                <div key={idx} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl p-4 text-sm ${
                    isSelf 
                      ? 'bg-teal-500 text-slate-950 rounded-tr-none font-medium' 
                      : 'bg-slate-200 dark:bg-slate-900 text-slate-950 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-800'
                  }`}>
                    <p className="text-[10px] opacity-60 font-bold mb-1 uppercase tracking-wide">
                      {isSelf ? 'You' : msg.senderRole}
                    </p>
                    <p className="leading-relaxed">{msg.message}</p>
                    <p className="text-[9px] opacity-40 text-right mt-1.5 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}

            {doctorTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 bg-teal-500 rounded-full animate-bounce"></span>
                    <span className="h-1.5 w-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span>Specialist is typing...</span>
                </div>
              </div>
            )}
            
            <div ref={chatBottomRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
            <input
              type="text"
              required
              className="flex-1 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:border-teal-500 text-sm"
              placeholder="Ask a question or reply to clinician requests..."
              value={newMessage}
              onChange={handleTyping}
            />
            <button
              type="submit"
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 p-3 rounded-xl transition hover:scale-105 active:scale-[0.97]"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
