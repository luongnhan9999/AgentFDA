import React from 'react';
import { ClinicalTrialData, STATUS_LABELS } from '../types';
import { formatAddress, formatGen } from '../utils/formatters';
import {
  BrainCircuit,
  ArrowRight,
  Gavel,
  Scale,
  Clock,
  ShieldCheck,
  UserCheck,
  Building2,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface TrialCardProps {
  trial: ClinicalTrialData;
  account: string | null;
  onOpenSubmitData: (trial: ClinicalTrialData) => void;
  onOpenAuditInspector: (trial: ClinicalTrialData) => void;
  onOpenAppeal: (trial: ClinicalTrialData) => void;
  onOpenAdjudicateAppeal: (trial: ClinicalTrialData) => void;
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
  onOpenAdjudicateAppeal,
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

  const currentAddr = account ? account.toLowerCase() : '';
  const isSponsor = currentAddr && currentAddr === trial.sponsor.toLowerCase();
  const isInvestigator = currentAddr && currentAddr === trial.investigator.toLowerCase();
  const isDisputeInitiator = currentAddr && currentAddr === trial.dispute_initiator.toLowerCase();

  return (
    <div className="bg-white rounded-3xl border border-clinical-border shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:border-teal-500/40">
      {/* Top Header */}
      <div className="p-5 border-b border-clinical-border bg-slate-50/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
                TRIAL #{trial.trial_id}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                {statusInfo.label}
              </span>
            </div>
            <h3 className="font-space font-bold text-base text-slate-900 group-hover:text-teal-600 transition-colors">
              {trial.drug_candidate}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Grant Escrow</span>
            <span className="font-mono font-bold text-base text-teal-700 bg-teal-50/50 px-2 py-0.5 rounded-md border border-teal-100">
              {formatGen(trial.escrow_amount)}
            </span>
          </div>
        </div>

        {/* Clinical Safety & Efficacy Thresholds */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-2xs">
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
        {/* Role Indicator Banner */}
        <div className="flex items-center justify-between text-[11px] p-2 bg-slate-50 rounded-xl border border-slate-100 font-mono">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Sponsor: {formatAddress(trial.sponsor)}</span>
            {isSponsor && <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">YOU</span>}
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>CRO: {formatAddress(trial.investigator)}</span>
            {isInvestigator && <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded">YOU</span>}
          </div>
        </div>

        {trial.status >= 2 && trial.status <= 6 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Biostatistical Evaluation</span>
              <span className="text-[11px] font-mono text-slate-500">
                Confidence: <strong className="text-slate-800">{trial.confidence}%</strong>
              </span>
            </div>

            {/* Efficacy Progress */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500">Measured Efficacy Response:</span>
                <span className="font-mono font-bold text-slate-800">{trial.measured_efficacy_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
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
                  className={`h-full rounded-full transition-all duration-700 ${
                    trial.measured_sae_pct > trial.max_tolerable_sae_pct ? 'bg-rose-600' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, trial.measured_sae_pct * 3)}%` }}
                />
              </div>
            </div>

            {/* AI Review Summary preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold mb-1">
                <BrainCircuit className="w-3.5 h-3.5 text-teal-600" />
                <span>AI Regulatory Jury Audit Rationale</span>
              </div>
              <p className="text-slate-700 italic text-[11px] line-clamp-2">
                "{trial.reason}"
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
              {trial.status === 0 ? (
                <>
                  <strong className="text-slate-800 block mb-1">Trial Open for Independent CRO:</strong>
                  Sponsor has locked milestone capital in GenVM escrow. An independent Principal Investigator/CRO must connect and supply live patient cohort and DSMB safety feeds.
                </>
              ) : (
                <>
                  <strong className="text-slate-800 block mb-1">Telemetry Feeds Linked:</strong>
                  De-identified clinical data linked on-chain. Stakeholders (Sponsor, CRO, or Owner) can now convene the AI Regulatory Jury to audit p-values and safety markers.
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions with Granular Role Access Control */}
      <div className="p-4 bg-slate-50/70 border-t border-clinical-border flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenAuditInspector(trial)}
          className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
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
              title={isSponsor ? "Role Violation: Sponsor cannot act as independent trial investigator" : "Claim trial as CRO"}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                isSponsor
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs hover:shadow-md'
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
              className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
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
                disabled={Boolean(isActionLoading || (!isSponsor && !isInvestigator))}
                title={!isSponsor && !isInvestigator ? "Only Sponsor or CRO can appeal" : "Stake 10% bond to challenge"}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 ${
                  !isSponsor && !isInvestigator
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs hover:shadow-md'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Appeal (10% Bond)</span>
              </button>
              <button
                onClick={() => onFinalize(trial.trial_id)}
                disabled={isActionLoading}
                className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Finalize</span>
              </button>
            </>
          )}

          {/* Status 6: Disputed -> Adjudicate Appeal */}
          {trial.status === 6 && (
            <button
              onClick={() => onOpenAdjudicateAppeal(trial)}
              disabled={isActionLoading}
              className="px-3 py-2 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Appellate Tribunal</span>
            </button>
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
