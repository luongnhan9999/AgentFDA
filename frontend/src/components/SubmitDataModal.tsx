import React, { useState } from 'react';
import { X, Send, AlertCircle, Loader2, Link2 } from 'lucide-react';
import { ClinicalTrialData } from '../types';

interface SubmitDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  trial: ClinicalTrialData | null;
  onSubmit: (trialId: number, dataUrl: string, safetyUrl: string) => Promise<void>;
  isLoading: boolean;
}

export const SubmitDataModal: React.FC<SubmitDataModalProps> = ({
  isOpen,
  onClose,
  trial,
  onSubmit,
  isLoading,
}) => {
  const [dataUrl, setDataUrl] = useState(
    'https://raw.githubusercontent.com/luongnhan9999/AgentFDA/main/README.md'
  );
  const [safetyUrl, setSafetyUrl] = useState(
    'https://raw.githubusercontent.com/luongnhan9999/AgentFDA/main/contracts/contract.py'
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !trial) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanData = dataUrl.trim();
    const cleanSafety = safetyUrl.trim();

    if (!cleanData.startsWith('http://') && !cleanData.startsWith('https://')) {
      setError('Please provide a valid HTTP/HTTPS patient cohort data URL.');
      return;
    }

    if (!cleanSafety.startsWith('http://') && !cleanSafety.startsWith('https://')) {
      setError('Please provide a valid HTTP/HTTPS DSMB safety audit URL.');
      return;
    }

    try {
      await onSubmit(trial.trial_id, cleanData, cleanSafety);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Transaction failed on GenLayer.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-clinical-border shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-5 border-b border-clinical-border bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-space font-bold text-lg text-slate-900">
                Submit Patient Cohort Feeds
              </h3>
              <p className="text-xs text-slate-500">Trial #{trial.trial_id}: {trial.drug_candidate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-800">
            <strong>Role Enforcement Notice:</strong> As Principal Investigator / CRO, you are submitting live public data endpoints for AI consensus review. The trial sponsor is strictly barred from claiming this step.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              De-identified Patient Cohort Outcomes (JSON/CSV)
            </label>
            <input
              type="url"
              value={dataUrl}
              onChange={(e) => setDataUrl(e.target.value)}
              placeholder="https://clinicaltrials.gov/.../cohort_phase2.json"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono text-slate-900"
              required
            />
            <span className="text-[11px] text-slate-400">GenVM nodes will render & parse efficacy outcomes</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data Safety Monitoring Board (DSMB) Audit URL
            </label>
            <input
              type="url"
              value={safetyUrl}
              onChange={(e) => setSafetyUrl(e.target.value)}
              placeholder="https://dsmb-audit.org/reports/safety_q3.txt"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono text-slate-900"
              required
            />
            <span className="text-[11px] text-slate-400">Independent safety log & SAE incidence records</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Feeds on-chain...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Link Feeds & Enter Active Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
