'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowLeft, Send, Upload, File, X, AlertCircle } from 'lucide-react';

export default function RaiseTicketPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GENERAL_MEDICINE');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setUploading(true);

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch('http://localhost:4000/attachments/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'File upload failed');

      setAttachments(prev => [...prev, data]);
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const token = localStorage.getItem('token');
    const payload = {
      title,
      description,
      category,
      patientName,
      age: parseInt(age) || 30,
      gender,
      symptoms,
      duration,
      medicalHistory,
      attachments,
    };

    try {
      const res = await fetch('http://localhost:4000/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit ticket');

      router.push('/dashboard/patient');
    } catch (err: any) {
      setError(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#080d19] text-slate-900 dark:text-slate-100 min-h-screen pb-12 flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/patient" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="bg-teal-500 p-2 rounded-xl text-white">
            <Activity className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Raise New Medical Consultation</h1>
        </div>
      </header>

      <main className="max-w-3xl w-full mx-auto p-6 mt-6">
        <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          
          <h2 className="text-xl font-bold mb-1">Clinical Case Questionnaire</h2>
          <p className="text-slate-400 text-sm mb-6">Explain symptoms thoroughly. An AI-triage analyzer will auto-predict initial severity and route this query to clinical specialists.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Form Fields Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1.5">Query Topic / Title</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-teal-500 text-sm"
                  placeholder="e.g. Chronic knee swelling after jog"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1.5">Medical Category Selection</label>
                <select
                  className="w-full bg-slate-950/35 border border-slate-700/50 rounded-xl py-3 px-3 text-white focus:outline-none focus:border-teal-500 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="GENERAL_MEDICINE">General Medicine</option>
                  <option value="DERMATOLOGY">Dermatology</option>
                  <option value="ORTHOPEDICS">Orthopedics</option>
                  <option value="PSYCHIATRY">Psychiatry</option>
                  <option value="CARDIOLOGY">Cardiology</option>
                  <option value="PEDIATRICS">Pediatrics</option>
                  <option value="NEUROLOGY">Neurology</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1.5">Patient Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-teal-500 text-sm"
                  placeholder="e.g. John Doe"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-1.5">Age</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-teal-500 text-sm"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-1.5">Gender</label>
                  <select
                    className="w-full bg-slate-950/35 border border-slate-700/50 rounded-xl py-3 px-3 text-white focus:outline-none focus:border-teal-500 text-sm"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1.5">Primary Symptoms</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-teal-500 text-sm"
                  placeholder="e.g. sharp localized pain, swelling, warmth"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1.5">Duration of symptoms</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-teal-500 text-sm"
                  placeholder="e.g. 3 days, 2 weeks"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-1.5">Comprehensive Query Description</label>
              <textarea
                required
                className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-teal-500 text-sm h-32"
                placeholder="Please describe what happened, when the pain triggers, past injuries, and any medications currently taken."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-1.5">Medical History & Allergies (Optional)</label>
              <textarea
                className="w-full bg-slate-950/30 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-teal-500 text-sm h-20"
                placeholder="List any details that will help clinical specialists evaluate your condition."
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
              />
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-1.5">Upload Medical Reports / Images / Videos</label>
              
              <div className="border-2 border-dashed border-slate-700/50 hover:border-teal-500/60 rounded-2xl p-6 text-center cursor-pointer transition relative group bg-slate-950/10">
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Upload className="h-8 w-8 mx-auto text-slate-500 group-hover:text-teal-400 transition mb-2" />
                <p className="text-sm font-medium text-slate-300">
                  {uploading ? 'Processing file...' : 'Drag & Drop files here, or click to upload'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP, PDF, DOCX, MP4 up to 100MB</p>
              </div>

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-slate-950/40 border border-slate-800 rounded-xl relative group">
                      <File className="h-5 w-5 text-teal-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white truncate font-medium">{att.filename}</p>
                        <p className="text-[10px] text-slate-500">{(att.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-400 text-white rounded-full p-0.5 shadow transition opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 border-t border-slate-700/30 pt-6">
              <Link href="/dashboard/patient" className="text-slate-400 hover:text-white font-semibold text-sm transition">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3.5 px-6 rounded-2xl flex items-center gap-2 shadow-lg transition active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Medical Query
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
