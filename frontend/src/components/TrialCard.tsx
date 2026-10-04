import React from 'react';
import { ClinicalTrialData, STATUS_LABELS } from '../types';
import { formatAddress, formatGen, truncateText } from '../utils/formatters';
import { ShieldCheck, AlertOctagon, BrainCircuit, ExternalLink, ArrowRight, Gavel, Scale, Clock } from 'lucide-react';

interface TrialCardProps {
  trial: ClinicalTrialData;
  account: string | null;
  onOpenSubmitData: (trial: ClinicalTrialData) => void;
  onOpenAuditInspector: (trial: ClinicalTrialData) => void;
  onOpenAppeal: (trial: ClinicalTrialData) => void;
  onAdjudicate: (trialId: number) => Promise<void>;
  onFinalize: (trialId: number) => Promise<void>;
  onCancel: (trialId: number) => Promise<void>;
  isActionLoading: boolean;
}

export const TrialCard: React.FC<TrialCardProps> = ({
  trial,
  account,
  onOpenSubmitData,
  onOpenAuditInspector,
  onOpenAppeal,
  onAdjudicate,
  onFinalize,
  onCancel,
  isActionLoading,
}) => {
  const statusInfo = STATUS_LABELS[trial.status] || {
    label: "UNKNOWN",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200"
  };

  const isSponsor = account && account.toLowerCase() === trial.sponsor.toLowerCase();
  const isInvestigator = account && account.toLowerCase() === trial.investigator.toLowerCase();

  return (
    <div className="bg-white rounded-3xl border border-clinical-border shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Top Header */}
      <div className="p-5 border-b border-clinical-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                TRIAL #{trial.trial_id}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                {statusInfo.label}
              </span>
            </div>
            <h3 className="font-space font-bold text-base text-slate-900 group-hover:text-teal-600 transition-colors">
              {trial.drug_candidate}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Grant Escrow</span>
            <span className="font-mono font-bold text-base text-teal-700">
              {formatGen(trial.escrow_amount)}
            </span>
          </div>
        </div>

        {/* Clinical Safety & Efficacy Thresholds */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">SAE Threshold (Max)</span>
            <span className="font-mono font-bold text-rose-600">≤ {trial.max_tolerable_sae_pct}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Efficacy Target (Min)</span>
            <span className="font-mono font-bold text-teal-600">≥ {trial.min_efficacy_rate_pct}%</span>
          </div>
        </div>
      </div>

      {/* Middle Body: Measured Outcomes or Feeds */}
      <div className="p-5 space-y-4 grow">
        {trial.status >= 2 && trial.status <= 6 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Measured Outcomes</span>
              <span className="text-[11px] font-mono text-slate-500">
                Confidence: <strong className="text-slate-800">{trial.confidence}%</strong>
              </span>
            </div>

            {/* Efficacy Progress */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500">Efficacy Response Rate:</span>
                <span className="font-mono font-bold text-slate-800">{trial.measured_efficacy_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    trial.measured_efficacy_pct >= trial.min_efficacy_rate_pct ? 'bg-teal-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, trial.measured_efficacy_pct)}%` }}
                />
              </div>
            </div>

            {/* Serious Adverse Events Progress */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500">Serious Adverse Events (SAE):</span>
                <span className="font-mono font-bold text-rose-600">{trial.measured_sae_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    trial.measured_sae_pct > trial.max_tolerable_sae_pct ? 'bg-rose-600' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, trial.measured_sae_pct * 3)}%` }}
                />
              </div>
            </div>

            {/* AI Review Summary preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                <BrainCircuit className="w-3.5 h-3.5 text-teal-600" />
                <span>AI Regulatory Jury Audit</span>
              </div>
              <p className="text-slate-700 italic text-[11px] line-clamp-2">
                "{trial.reason}"
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Sponsor:</span>
              <span className="font-mono font-medium text-slate-800">{formatAddress(trial.sponsor)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Investigator / CRO:</span>
              <span className="font-mono font-medium text-slate-800">{formatAddress(trial.investigator)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600">
              {trial.status === 0
                ? "Trial is open for clinical site claims. CROs can connect and submit de-identified patient cohort logs."
                : "Trial cohort data linked. Stakeholders can trigger AI Adjudication to verify clinical safety."}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-50/70 border-t border-clinical-border flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenAuditInspector(trial)}
          className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <BrainCircuit className="w-3.5 h-3.5 text-teal-600" />
          <span>Audit Inspector</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Status 0: Open -> Submit Data */}
          {trial.status === 0 && (
            <button
              onClick={() => onOpenSubmitData(trial)}
              disabled={Boolean(isActionLoading || isSponsor)}
              title={isSponsor ? "Sponsor cannot act as trial CRO" : "Claim trial as CRO"}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                isSponsor
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
              }`}
            >
              <span>CRO Claim & Submit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Status 1: In Trial -> Adjudicate */}
          {trial.status === 1 && (
            <button
              onClick={() => onAdjudicate(trial.trial_id)}
              disabled={isActionLoading}
              className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Convene AI Jury</span>
            </button>
          )}

          {/* Status 2: Awaiting Payout -> Appeal or Finalize */}
          {trial.status === 2 && (
            <>
              <button
                onClick={() => onOpenAppeal(trial)}
                disabled={isActionLoading}
                className="px-3 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-all flex items-center gap-1"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Appeal (10% Bond)</span>
              </button>
              <button
                onClick={() => onFinalize(trial.trial_id)}
                disabled={isActionLoading}
                className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Finalize</span>
              </button>
            </>
          )}

          {/* Status 0 Expired / Inactive -> Cancel or Reclaim */}
          {trial.status === 0 && isSponsor && (
            <button
              onClick={() => onCancel(trial.trial_id)}
              disabled={isActionLoading}
              className="px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 rounded-xl"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
