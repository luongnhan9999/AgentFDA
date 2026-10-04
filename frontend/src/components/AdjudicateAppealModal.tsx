import React, { useState } from 'react';
import { X, Gavel, AlertCircle, Loader2, Link2, ShieldCheck } from 'lucide-react';
import { ClinicalTrialData } from '../types';

interface AdjudicateAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  trial: ClinicalTrialData | null;
  onSubmit: (trialId: number, supplementalUrl: string) => Promise<void>;
  isLoading: boolean;
}

export const AdjudicateAppealModal: React.FC<AdjudicateAppealModalProps> = ({
  isOpen,
  onClose,
  trial,
  onSubmit,
  isLoading,
}) => {
  const [supplementalUrl, setSupplementalUrl] = useState(
    'https://raw.githubusercontent.com/luongnhan9999/AgentFDA/main/README.md'
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !trial) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUrl = supplementalUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setError('Please provide a valid HTTP/HTTPS supplemental clinical audit URL.');
      return;
    }

    try {
      await onSubmit(trial.trial_id, cleanUrl);
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
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-space font-bold text-lg text-slate-900">
                Adjudicate Appellate Tribunal
              </h3>
              <p className="text-xs text-slate-500">Trial #{trial.trial_id} Under Dispute Challenge</p>
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

          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <span>Supreme Appellate Deliberation</span>
            </div>
            <div>
              GenVM validators will render the supplemental clinical dossier, independently audit patient safety vs. efficacy, and reach a final binding consensus verdict (Overturn / Inconclusive / Dismiss).
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supplemental Third-Party Audit / Dossier Endpoint URL
            </label>
            <input
              type="url"
              value={supplementalUrl}
              onChange={(e) => setSupplementalUrl(e.target.value)}
              placeholder="https://independent-audit.org/re-analysis.json"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 font-mono text-slate-900"
              required
            />
            <span className="text-[11px] text-slate-400">Re-audited logs or corrected pathology records</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Convening Appellate Tribunal on GenVM...</span>
                </>
              ) : (
                <>
                  <Gavel className="w-4 h-4" />
                  <span>Execute Appellate Adjudication & Settle Escrow</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
