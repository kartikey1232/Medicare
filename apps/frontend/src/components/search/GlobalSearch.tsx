'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, User } from 'lucide-react';
import { searchApi } from '../../lib/api';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setOpen(false);
      return;
    }

    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchApi.global(query.trim());
        setResults(data);
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function clear() {
    setQuery('');
    setResults(null);
    setOpen(false);
  }

  function navigate(ticketId: string) {
    clear();
    router.push(`/dashboard/patient/ticket/${ticketId}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-slate-500 pointer-events-none" />
        <input
          id="global-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tickets, patients, symptoms…"
          className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 pl-9 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
        />
        {loading && (
          <div className="absolute right-3 h-4 w-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        )}
        {!loading && query && (
          <button onClick={clear} className="absolute right-3 text-slate-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results && (
        <div className="absolute top-12 left-0 w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Tickets */}
          {results.tickets?.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900/50">
                Tickets
              </p>
              {results.tickets.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => navigate(t.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-900/60 transition text-left"
                >
                  <FileText className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-white">{t.title}</p>
                    <p className="text-[10px] text-slate-400">{t.ticketNumber} · {t.status}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Patients */}
          {results.patients?.length > 0 && (
            <div className="border-t border-slate-800">
              <p className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900/50">
                Patients
              </p>
              {results.patients.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                  <p className="text-xs font-semibold text-white">{p.name}</p>
                </div>
              ))}
            </div>
          )}

          {(!results.tickets?.length && !results.patients?.length) && (
            <div className="py-8 text-center text-sm text-slate-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
