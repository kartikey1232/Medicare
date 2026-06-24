'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store in localStorage for simplified client-side state
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      // Route depending on role
      const role = data.user.role;
      if (role === 'PATIENT') {
        router.push('/dashboard/patient');
      } else if (role === 'DOCTOR') {
        router.push('/dashboard/doctor');
      } else if (role === 'MODERATOR') {
        router.push('/dashboard/moderator');
      } else if (role === 'ADMIN') {
        router.push('/dashboard/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-teal-950 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-teal-500 p-2.5 rounded-2xl shadow-lg shadow-teal-500/20 animate-pulse">
          <Activity className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">
          Medi<span className="text-teal-400">Desk</span>
        </h1>
      </div>

      {/* Main card */}
      <div className="glass max-w-md w-full p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-teal-600"></div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-1">Welcome back</h2>
        <p className="text-slate-400 text-center text-sm mb-6">Enter details to enter the portal</p>

        {error && (
          <div className="mb-4 p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-red-300 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm transition"
                placeholder="doctor@medidesk.com or patient@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/25 transition active:scale-[0.99] flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          New to MediDesk?{' '}
          <Link href="/register" className="text-teal-400 hover:underline font-medium">
            Create an account
          </Link>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 mt-8 text-slate-500 text-xs">
        <ShieldCheck className="h-4 w-4" />
        <span>End-to-end encrypted medical logging system</span>
      </div>
    </div>
  );
}
