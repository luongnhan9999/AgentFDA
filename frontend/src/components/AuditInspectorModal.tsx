import React from 'react';
import { X, BrainCircuit, ShieldAlert, CheckCircle, ExternalLink, Hash, Award, Activity } from 'lucide-react';
import { ClinicalTrialData } from '../types';
import { formatAddress, formatGen } from '../utils/formatters';

interface AuditInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  trial: ClinicalTrialData | null;
}

export const AuditInspectorModal: React.FC<AuditInspectorModalProps> = ({
  isOpen,
  onClose,
  trial,
}) => {
  if (!isOpen || !trial) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-clinical-border shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-clinical-border bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-space font-bold text-lg text-slate-900">
                AI Regulatory Jury Audit Report
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Trial #{trial.trial_id} | {trial.drug_candidate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Verdict Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            trial.verdict === 'MILESTONE_APPROVED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : trial.verdict === 'SAFETY_TERMINATED'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : trial.verdict === 'TRIAL_INCONCLUSIVE'
              ? 'bg-purple-50 border-purple-200 text-purple-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            {trial.verdict === 'MILESTONE_APPROVED' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : trial.verdict === 'SAFETY_TERMINATED' ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Activity className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-space font-bold text-sm tracking-wide uppercase">
                Consensus Verdict: {trial.verdict}
              </div>
              <p className="text-xs mt-1 text-slate-700">
                {trial.reason || 'Pending biometric adjudication...'}
              </p>
            </div>
          </div>

          {/* Metric Telemetry Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Measured Efficacy</span>
              <span className="font-mono font-bold text-lg text-teal-700">
                {trial.measured_efficacy_pct}%
              </span>
              <span className="text-[10px] text-slate-500 block">Target: ≥ {trial.min_efficacy_rate_pct}%</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Measured SAE Rate</span>
              <span className={`font-mono font-bold text-lg ${
                trial.measured_sae_pct > trial.max_tolerable_sae_pct ? 'text-rose-600' : 'text-slate-800'
              }`}>
                {trial.measured_sae_pct}%
              </span>
              <span className="text-[10px] text-slate-500 block">Limit: ≤ {trial.max_tolerable_sae_pct}%</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">AI Confidence</span>
              <span className="font-mono font-bold text-lg text-slate-800">
                {trial.confidence}%
              </span>
              <span className="text-[10px] text-slate-500 block">Biostatistics Score</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Escrow Grant</span>
              <span className="font-mono font-bold text-base text-slate-800">
                {formatGen(trial.escrow_amount)}
              </span>
              <span className="text-[10px] text-slate-500 block">Native GEN</span>
            </div>
          </div>

          {/* Cryptographic Proof & Feeds */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              On-Chain Audit Trail & Telemetry
            </h4>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-teal-600" />
                  <span>SHA-256 Evidence Digest:</span>
                </span>
                <span className="font-mono text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {trial.evidence_hash || 'Pending hash calculation'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Sponsor Address:</span>
                <span className="font-mono text-slate-800">{formatAddress(trial.sponsor)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Principal Investigator:</span>
                <span className="font-mono text-slate-800">{formatAddress(trial.investigator)}</span>
              </div>

              {trial.trial_data_url && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Patient Cohort Feed:</span>
                  <a
                    href={trial.trial_data_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 hover:text-teal-700 font-mono text-[11px] flex items-center gap-1 underline"
                  >
                    <span>View Endpoint</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {trial.safety_monitoring_url && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">DSMB Audit Feed:</span>
                  <a
                    href={trial.safety_monitoring_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 hover:text-teal-700 font-mono text-[11px] flex items-center gap-1 underline"
                  >
                    <span>View Endpoint</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-clinical-border flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
