import React from 'react';
import { 
  Activity, 
  Search, 
  Plus, 
  ChevronRight, 
  Filter,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Scale
} from 'lucide-react';
import { ClinicalTrialData, STATUS_LABELS } from '../types';
import { formatAddress, formatGen } from '../utils/formatters';

interface TrialPipelineSidebarProps {
  trials: ClinicalTrialData[];
  selectedTrialId: number | null;
  onSelectTrial: (trial: ClinicalTrialData) => void;
  onOpenCreate: () => void;
  selectedFilter: string;
  onFilterChange: (filter: any) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  account: string | null;
}

export const TrialPipelineSidebar: React.FC<TrialPipelineSidebarProps> = ({
  trials,
  selectedTrialId,
  onSelectTrial,
  onOpenCreate,
  selectedFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  account,
}) => {
  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'active', label: 'In Trial' },
    { id: 'cooling', label: 'Cooling' },
    { id: 'settled', label: 'Settled' },
    { id: 'disputed', label: 'Appeal' },
    ...(account ? [{ id: 'mine', label: 'Mine' }] : []),
  ];

  const filtered = trials.filter((t) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.drug_candidate.toLowerCase().includes(q) ||
        t.trial_id.toString().includes(q) ||
        t.sponsor.toLowerCase().includes(q) ||
        t.investigator.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Filter
    if (selectedFilter === 'mine' && account) {
      return (
        t.sponsor.toLowerCase() === account.toLowerCase() ||
        t.investigator.toLowerCase() === account.toLowerCase()
      );
    }
    if (selectedFilter === 'open') return t.status === 0;
    if (selectedFilter === 'active') return t.status === 1;
    if (selectedFilter === 'cooling') return t.status === 2;
    if (selectedFilter === 'settled') return t.status >= 3 && t.status <= 5;
    if (selectedFilter === 'disputed') return t.status === 6;
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-12rem)] max-h-[880px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-space font-extrabold text-xs uppercase tracking-wider text-slate-900">
                Protocol Pipeline
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {trials.length} Registered Trials
              </span>
            </div>
          </div>
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            title="Create Trial Grant"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Grant</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search drug candidate or trial ID..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-500 text-slate-800 placeholder-slate-400 font-sans"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                selectedFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trial List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
            <p className="text-xs font-semibold text-slate-700">
              {trials.length === 0 ? 'No Active Protocols Yet' : 'No trials match criteria'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {trials.length === 0
                ? 'Contract initialized. Create a milestone grant to initiate Trial #0.'
                : 'Try resetting filters or search terms'}
            </p>
          </div>
        ) : (
          filtered.map((t) => {
            const isSelected = selectedTrialId === t.trial_id;
            const statusMeta = STATUS_LABELS[t.status] || {
              label: 'UNKNOWN',
              color: 'text-slate-600',
              bg: 'bg-slate-50',
              border: 'border-slate-200',
            };

            return (
              <div
                key={t.trial_id}
                onClick={() => onSelectTrial(t)}
                className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      #{t.trial_id}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                      {statusMeta.label.split('/')[0]}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-teal-700">
                    {formatGen(t.escrow_amount)}
                  </span>
                </div>

                <h4 className="font-space font-bold text-xs text-slate-900 line-clamp-1 mb-1">
                  {t.drug_candidate}
                </h4>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>SAE: ≤{t.max_tolerable_sae_pct}%</span>
                  <span>Eff: ≥{t.min_efficacy_rate_pct}%</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-teal-600 translate-x-0.5' : 'text-slate-300'}`} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
