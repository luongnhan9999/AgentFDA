import React, { useState } from 'react';
import { X, Scale, AlertCircle, Loader2 } from 'lucide-react';
import { ClinicalTrialData } from '../types';
import { formatGen } from '../utils/formatters';

interface AppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  trial: ClinicalTrialData | null;
  onSubmitAppeal: (trialId: number, disputeReason: string, bondGen: string) => Promise<void>;
  isLoading: boolean;
}

export const AppealModal: React.FC<AppealModalProps> = ({
  isOpen,
  onClose,
  trial,
  onSubmitAppeal,
  isLoading,
}) => {
  const [disputeReason, setDisputeReason] = useState(
    'Supplemental independent pathology review indicates SAE event was non-drug related.'
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !trial) return null;

  // Calculate 10% required dispute bond
  const requiredBondWei = (BigInt(trial.escrow_amount) * 10n) / 100n;
  const bondGen = (Number(requiredBondWei) / 1e18).toFixed(4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (disputeReason.trim().length < 10) {
      setError('Please provide a detailed dispute rationale (at least 10 characters).');
      return;
    }

    try {
      await onSubmitAppeal(trial.trial_id, disputeReason.trim(), bondGen);
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
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-space font-bold text-lg text-slate-900">
                Appeal Clinical Verdict
              </h3>
              <p className="text-xs text-slate-500">24-Block Dispute Cooling-Off Window</p>
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

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-semibold">Staked Dispute Bond Requirement:</div>
            <div>
              Appeals require staking a <strong className="font-mono">10% bond ({formatGen(requiredBondWei.toString())})</strong>. If the Supreme Appellate Tribunal dismisses the appeal, this bond is forfeited to the counterparty.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispute Justification & Clinical Defense Rationale
            </label>
            <textarea
              rows={4}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-sans text-slate-900"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Staking Bond & Submitting Dispute...</span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  <span>Stake {formatGen(requiredBondWei.toString())} & File Appeal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
