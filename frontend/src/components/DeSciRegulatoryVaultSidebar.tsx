import React from 'react';
import { 
  Database, 
  ShieldCheck, 
  Lock, 
  FileCheck2, 
  AlertTriangle, 
  ExternalLink,
  Sparkles,
  Layers,
  Activity,
  HeartPulse
} from 'lucide-react';
import { StatsData, ClinicalTrialData } from '../types';
import { formatGen, formatAddress } from '../utils/formatters';
import { DEFAULT_CONTRACT_ADDRESS } from '../config/genlayer';

interface DeSciRegulatoryVaultSidebarProps {
  stats: StatsData;
  trials: ClinicalTrialData[];
  onOpenLibrary: () => void;
  onOpenCreate: () => void;
}

export const DeSciRegulatoryVaultSidebar: React.FC<DeSciRegulatoryVaultSidebarProps> = ({
  stats,
  trials,
  onOpenLibrary,
  onOpenCreate,
}) => {
  const approvedCount = trials.filter((t) => t.status === 3).length;
  const biohazardCount = trials.filter((t) => t.status === 4).length;
  const inTrialCount = trials.filter((t) => t.status === 1 || t.status === 2).length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-12rem)] max-h-[880px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-space font-extrabold text-xs uppercase tracking-wider text-slate-900">
                DeSci Regulatory Vault
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                GenLayer Studionet #61999
              </span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
        </div>
      </div>

      {/* Vault Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Treasury Card */}
        <div className="p-4 rounded-2xl bg-linear-to-br from-teal-900 to-slate-900 text-white space-y-2 shadow-sm">
          <span className="text-[10px] uppercase font-semibold text-teal-300 block tracking-wider">
            Total Clinical Escrow Locked
          </span>
          <div className="font-mono font-bold text-2xl text-teal-300">
            {formatGen(stats.total_grant_locked)}
          </div>
          <p className="text-[11px] text-slate-300">
            Cryptographically segregated across {stats.total_trials} active trial milestone contracts.
          </p>
        </div>

        {/* Milestone Outcomes Breakdown */}
        <div className="space-y-2">
          <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
            Regulatory Consensus Ledger
          </h4>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span className="text-[10px] font-bold block uppercase text-emerald-700">Approved</span>
              <span className="font-mono font-bold text-lg">{approvedCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
              <span className="text-[10px] font-bold block uppercase text-rose-700">Biohazard</span>
              <span className="font-mono font-bold text-lg">{biohazardCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
              <span className="text-[10px] font-bold block uppercase text-blue-700">In Review</span>
              <span className="font-mono font-bold text-lg">{inTrialCount}</span>
            </div>
          </div>
        </div>

        {/* Preset Case Study Library Action */}
        <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-2.5">
          <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Clinical Case Library</span>
          </div>
          <p className="text-[11px] text-teal-900 leading-relaxed">
            Quickly test on-chain consensus with simulated Oncology, Alzheimer, and CAR-T trial endpoints.
          </p>
          <button
            onClick={onOpenLibrary}
            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Open Preset Studies
          </button>
        </div>

        {/* Smart Contract Audit Stamp */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">Contract Address:</span>
            <a
              href={`https://genlayer-explorer.vercel.app/address/${DEFAULT_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-teal-600 font-mono flex items-center gap-1 hover:underline"
            >
              <span>{formatAddress(DEFAULT_CONTRACT_ADDRESS)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">Consensus Engine:</span>
            <span className="font-mono text-slate-700">GenVM semantic jury</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">Cooling Challenge:</span>
            <span className="font-mono text-slate-700">24 blocks (10% bond)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
