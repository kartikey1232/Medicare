'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, UserPlus, Mail, Lock, User, Calendar, Heart, Award } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | 'MODERATOR'>('PATIENT');
  
  // Patient fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [medicalHistory, setMedicalHistory] = useState('');

  // Doctor fields
  const [specialization, setSpecialization] = useState('General Medicine');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload: any = {
      email,
      password,
      role,
      name,
    };

    if (role === 'PATIENT') {
      payload.age = parseInt(age) || 30;
      payload.gender = gender;
      payload.medicalHistory = medicalHistory;
    } else if (role === 'DOCTOR') {
      payload.specialization = specialization;
    }

    try {
      const res = await fetch('http://localhost:4000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-teal-950 py-12 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-teal-500 p-2.5 rounded-2xl shadow-lg shadow-teal-500/20">
          <Activity className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">
          Medi<span className="text-teal-400">Desk</span>
        </h1>
      </div>

      <div className="glass max-w-lg w-full p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-teal-600"></div>

        <h2 className="text-2xl font-bold text-white text-center mb-1">Create Account</h2>
        <p className="text-slate-400 text-center text-sm mb-6">Join the medical coordination workspace</p>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950/40 rounded-xl border border-slate-700/30">
            {['PATIENT', 'DOCTOR', 'MODERATOR'].map((r) => (
              <button
                key={r}
                type="button"
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  role === r
                    ? 'bg-teal-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setRole(r as any)}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="email"
                  required
                  className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Patient Role Specifics */}
          {role === 'PATIENT' && (
            <div className="space-y-4 border-t border-slate-700/30 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Age</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                    <input
                      type="number"
                      required
                      className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-teal-500 text-sm"
                      placeholder="e.g. 28"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Gender</label>
                  <select
                    className="w-full bg-slate-950/35 border border-slate-700/50 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-teal-500 text-sm"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Brief Medical History (Optional)</label>
                <div className="relative">
                  <Heart className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <textarea
                    className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-teal-500 text-sm h-20 placeholder-slate-500"
                    placeholder="E.g., Asthma, Hypertension, Drug allergies..."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Doctor Role Specifics */}
          {role === 'DOCTOR' && (
            <div className="space-y-4 border-t border-slate-700/30 pt-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Clinical Specialization</label>
                <div className="relative">
                  <Award className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <select
                    className="w-full bg-slate-950/35 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-3 text-white focus:outline-none focus:border-teal-500 text-sm"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Psychiatry">Psychiatry</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Sign Up
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/" className="text-teal-400 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
