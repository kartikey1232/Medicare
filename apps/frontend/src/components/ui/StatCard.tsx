import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  Icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; positive: boolean };
}

export function StatCard({
  title,
  value,
  Icon,
  iconColor = 'text-teal-500',
  iconBg = 'bg-teal-500/10',
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition">
      <div className={`p-3 rounded-xl ${iconBg} shrink-0`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider truncate">{title}</p>
        <h3 className="text-2xl font-extrabold mt-1 tabular-nums">{value}</h3>
        {trend && (
          <p className={`text-[11px] font-semibold mt-1 ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value} this week
          </p>
        )}
      </div>
    </div>
  );
}
