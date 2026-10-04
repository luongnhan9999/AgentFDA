import React, { useState } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  ExternalLink, 
  BrainCircuit, 
  CheckCircle, 
  Hash, 
  Copy, 
  Check, 
  Clock, 
  ArrowRight,
  Gavel,
  Scale,
  Building2,
  UserCheck,
  FileText,
  Microscope,
  CheckCircle2,
  XCircle,
  AlertOctagon
} from 'lucide-react';
import { ClinicalTrialData, STATUS_LABELS } from '../types';
import { formatAddress, formatGen, truncateText } from '../utils/formatters';

interface ClinicalConsoleCockpitProps {
  trial: ClinicalTrialData | null;
  account: string | null;
  onOpenSubmitData: (trial: ClinicalTrialData) => void;
  onOpenAuditInspector: (trial: ClinicalTrialData) => void;
  onOpenAppeal: (trial: ClinicalTrialData) => void;
  onOpenAdjudicateAppeal: (trial: ClinicalTrialData) => void;
  onAdjudicate: (trialId: number) => Promise<void>;
  onFinalize: (trialId: number) => Promise<void>;
  onCancel: (trialId: number) => Promise<void>;
  isProcessing: boolean;
}

export const ClinicalConsoleCockpit: React.FC<ClinicalConsoleCockpitProps> = ({
  trial,
  account,
  onOpenSubmitData,
  onOpenAuditInspector,
  onOpenAppeal,
  onOpenAdjudicateAppeal,
  onAdjudicate,
  onFinalize,
  onCancel,
  isProcessing,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!trial) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center h-[calc(100vh-12rem)] max-h-[880px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 border border-teal-100 shadow-inner">
          <Microscope className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="font-space text-lg font-bold text-slate-900">
          Awaiting Clinical Protocol Selection
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
          Select a clinical trial protocol from the pipeline on the left or deposit a new milestone grant to initialize on-chain biostatistical consensus screening.
        </p>
      </div>
    );
  }

  const statusMeta = STATUS_LABELS[trial.status] || {
    label: 'UNKNOWN',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  };

  const currentAddr = account ? account.toLowerCase() : '';
  const isSponsor = currentAddr && currentAddr === trial.sponsor.toLowerCase();
  const isInvestigator = currentAddr && currentAddr === trial.investigator.toLowerCase();

  const handleCopyHash = () => {
    if (trial.evidence_hash) {
      navigator.clipboard.writeText(trial.evidence_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  // Circular gauge for biostatistical efficacy
  const effRadius = 40;
  const effCircumference = 2 * Math.PI * effRadius;
  const effOffset = effCircumference - (Math.min(100, trial.measured_efficacy_pct) / 100) * effCircumference;

  // Radial calculation for safety SAE
  const saeRadius = 40;
  const saeCircumference = 2 * Math.PI * saeRadius;
  const saeOffset = saeCircumference - (Math.min(100, trial.measured_sae_pct * 3) / 100) * saeCircumference;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-12rem)] max-h-[880px] overflow-hidden">
      {/* Top Banner Cockpit Header */}
      <div className="p-6 border-b border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-teal-950 text-white shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-400/30">
                PROTOCOL #{trial.trial_id}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                {statusMeta.label}
              </span>
            </div>
            <h2 className="font-space font-bold text-xl sm:text-2xl tracking-tight text-white">
              {trial.drug_candidate}
            </h2>
          </div>

          <div className="text-left sm:text-right bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] uppercase font-semibold text-teal-300 block tracking-wider">
              Milestone Escrow Grant
            </span>
            <span className="font-mono font-bold text-2xl text-teal-400">
              {formatGen(trial.escrow_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Cockpit Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Role Access Indicator Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Sponsor / Pharma DAO</span>
                <span className="font-semibold text-slate-800">{formatAddress(trial.sponsor)}</span>
              </div>
            </div>
            {isSponsor && (
              <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold text-[10px]">
                ACTIVE USER
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-500" />
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Investigator / Site CRO</span>
                <span className="font-semibold text-slate-800">{formatAddress(trial.investigator)}</span>
              </div>
            </div>
            {isInvestigator && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                ACTIVE USER
              </span>
            )}
          </div>
        </div>

        {/* Central Telemetry Gauge Cockpit (If Evaluated) */}
        {trial.status >= 2 && trial.status <= 6 ? (
          <div className="space-y-6">
            {/* Verdict Alert Header */}
            <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
              trial.verdict === 'MILESTONE_APPROVED'
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : trial.verdict === 'SAFETY_TERMINATED'
                ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                : 'bg-purple-50/80 border-purple-300 text-purple-950'
            }`}>
              {trial.verdict === 'MILESTONE_APPROVED' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
              ) : trial.verdict === 'SAFETY_TERMINATED' ? (
                <AlertOctagon className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Scale className="w-7 h-7 text-purple-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-space font-extrabold text-base tracking-wide uppercase">
                  Consensus Verdict: {trial.verdict}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  "{trial.reason}"
                </p>
              </div>
            </div>

            {/* Twin High-Precision Biostatistical Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Efficacy Gauge */}
              <div className="p-5 rounded-3xl border border-slate-200 bg-white shadow-2xs flex items-center gap-5">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={effRadius} stroke="#E2E8F0" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r={effRadius}
                      stroke={trial.measured_efficacy_pct >= trial.min_efficacy_rate_pct ? '#0D9488' : '#D97706'}
                      strokeWidth="8"
                      strokeDasharray={effCircumference}
                      strokeDashoffset={effOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                    <span className="text-xl font-bold text-slate-900">{trial.measured_efficacy_pct}%</span>
                    <span className="text-[9px] text-slate-400">RESPONSE</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <h4 className="font-space font-bold text-slate-900">Efficacy Response Rate (ORR)</h4>
                  <p className="text-[11px] text-slate-500">
                    Required Milestone Baseline: <strong className="font-mono text-teal-700">≥ {trial.min_efficacy_rate_pct}%</strong>
                  </p>
                  <div className="pt-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trial.measured_efficacy_pct >= trial.min_efficacy_rate_pct
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {trial.measured_efficacy_pct >= trial.min_efficacy_rate_pct ? 'Target Reached' : 'Endpoint Deficit'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Safety SAE Gauge */}
              <div className="p-5 rounded-3xl border border-slate-200 bg-white shadow-2xs flex items-center gap-5">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={saeRadius} stroke="#E2E8F0" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r={saeRadius}
                      stroke={trial.measured_sae_pct > trial.max_tolerable_sae_pct ? '#E11D48' : '#10B981'}
                      strokeWidth="8"
                      strokeDasharray={saeCircumference}
                      strokeDashoffset={saeOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                    <span className={`text-xl font-bold ${trial.measured_sae_pct > trial.max_tolerable_sae_pct ? 'text-rose-600' : 'text-slate-900'}`}>
                      {trial.measured_sae_pct}%
                    </span>
                    <span className="text-[9px] text-slate-400">SAE RATE</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <h4 className="font-space font-bold text-slate-900">Serious Adverse Events (SAE)</h4>
                  <p className="text-[11px] text-slate-500">
                    Maximum Tolerable Ceiling: <strong className="font-mono text-rose-600">≤ {trial.max_tolerable_sae_pct}%</strong>
                  </p>
                  <div className="pt-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trial.measured_sae_pct <= trial.max_tolerable_sae_pct
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {trial.measured_sae_pct <= trial.max_tolerable_sae_pct ? 'Toxicity Compliant' : 'Biohazard Limit Breached'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Biostatistics Quality & Evidence Snapshot */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
                  <Hash className="w-3.5 h-3.5 text-teal-600" />
                  <span>SHA-256 Clinical Evidence Digest:</span>
                </span>
                <button
                  onClick={handleCopyHash}
                  className="font-mono text-[11px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 hover:border-slate-300 flex items-center gap-1"
                >
                  <span>{truncateText(trial.evidence_hash, 32) || 'Calculating on-chain digest...'}</span>
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Biostatistical Confidence Score:</span>
                <span className="font-mono font-bold text-slate-800">{trial.confidence}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-3xl border border-slate-200 bg-slate-50/50 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h4 className="font-space font-bold text-base text-slate-900">
              {trial.status === 0 ? 'Trial Open for CRO Submission' : 'Telemetry Feeds Linked — Ready for Adjudication'}
            </h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {trial.status === 0
                ? 'The trial milestone grant is currently secured in GenVM escrow. An independent Principal Investigator / CRO must connect their wallet and submit public endpoints for patient outcomes and DSMB safety audits.'
                : 'Cohort telemetry has been submitted. Any trial stakeholder (Sponsor, CRO, or Owner) can now convene the AI Regulatory Jury to render the clinical safety verdict.'}
            </p>
          </div>
        )}
      </div>

      {/* Cockpit Actions Toolbar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <button
          onClick={() => onOpenAuditInspector(trial)}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
        >
          <BrainCircuit className="w-4 h-4 text-teal-600" />
          <span>Full Audit Report</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Status 0: Open -> Submit Data */}
          {trial.status === 0 && (
            <button
              onClick={() => onOpenSubmitData(trial)}
              disabled={Boolean(isProcessing || isSponsor)}
              title={isSponsor ? 'Sponsors are strictly barred from acting as trial investigators' : 'Claim trial as CRO'}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                isSponsor
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-md'
              }`}
            >
              <span>CRO Claim & Submit Feeds</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Status 1: In Trial -> Adjudicate */}
          {trial.status === 1 && (
            <button
              onClick={() => onAdjudicate(trial.trial_id)}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <Gavel className="w-4 h-4" />
              <span>Convene AI Regulatory Jury</span>
            </button>
          )}

          {/* Status 2: Awaiting Payout -> Appeal or Finalize */}
          {trial.status === 2 && (
            <>
              <button
                onClick={() => onOpenAppeal(trial)}
                disabled={Boolean(isProcessing || (!isSponsor && !isInvestigator))}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                  !isSponsor && !isInvestigator
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Appeal (Stake 10% Bond)</span>
              </button>
              <button
                onClick={() => onFinalize(trial.trial_id)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Finalize Payout</span>
              </button>
            </>
          )}

          {/* Status 6: Disputed -> Adjudicate Appeal */}
          {trial.status === 6 && (
            <button
              onClick={() => onOpenAdjudicateAppeal(trial)}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <Gavel className="w-4 h-4" />
              <span>Supreme Appellate Tribunal</span>
            </button>
          )}

          {/* Status 0 Expired / Inactive -> Cancel or Reclaim */}
          {trial.status === 0 && isSponsor && (
            <button
              onClick={() => onCancel(trial.trial_id)}
              disabled={isProcessing}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 rounded-xl"
            >
              Cancel & Reclaim
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
