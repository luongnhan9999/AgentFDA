import React from 'react';
import { Lock, FileCheck2, Users, AlertTriangle } from 'lucide-react';
import { StatsData } from '../types';
import { formatGen } from '../utils/formatters';

interface StatsOverviewProps {
  stats: StatsData;
  activeCount: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, activeCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      <div className="bg-white rounded-2xl border border-clinical-border p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Grants Locked
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <Lock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 font-mono font-bold text-2xl text-slate-900">
          {formatGen(stats.total_grant_locked)}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Cryptographically escrowed on GenLayer
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-clinical-border p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Registered Trials
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 font-mono font-bold text-2xl text-slate-900">
          {stats.total_trials}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Total protocol cohort evaluations
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-clinical-border p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Trials Settled
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <FileCheck2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 font-mono font-bold text-2xl text-slate-900">
          {stats.total_trials_settled}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          AI consensus milestone verdicts finalized
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-clinical-border p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active In-Progress
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 font-mono font-bold text-2xl text-slate-900">
          {activeCount}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Awaiting submission or dispute cooling window
        </p>
      </div>
    </div>
  );
};
