import React from 'react';

type Variant = 'critical' | 'high' | 'medium' | 'low' | 'open' | 'assigned' | 'in_review' | 'waiting' | 'resolved' | 'closed' | 'default';

const MAP: Record<Variant, string> = {
  critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
  high: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  medium: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  low: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  open: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
  assigned: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
  in_review: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  waiting: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  closed: 'bg-slate-600/20 text-slate-400 border border-slate-600/30',
  default: 'bg-slate-700/20 text-slate-400 border border-slate-700/30',
};

interface BadgeProps {
  label: string;
  variant?: Variant;
  className?: string;
}

export function Badge({ label, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${MAP[variant]} ${className}`}
    >
      {label.replace(/_/g, ' ')}
    </span>
  );
}

/** Derive variant from status string */
export function statusVariant(status: string): Variant {
  return (status.toLowerCase().replace('waiting_for_patient', 'waiting') as Variant) ?? 'default';
}

/** Derive variant from priority/severity string */
export function priorityVariant(priority: string): Variant {
  return (priority.toLowerCase() as Variant) ?? 'default';
}
