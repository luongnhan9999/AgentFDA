import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle, Loader2 } from 'lucide-react';

interface CreateTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (drugCandidate: string, maxSae: number, minEfficacy: number, durationBlocks: number, amountGen: string) => Promise<void>;
  isLoading: boolean;
}

export const CreateTrialModal: React.FC<CreateTrialModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [drugCandidate, setDrugCandidate] = useState('CTX-904 Oncology Kinase Inhibitor');
  const [maxSae, setMaxSae] = useState(5);
  const [minEfficacy, setMinEfficacy] = useState(60);
  const [durationBlocks, setDurationBlocks] = useState(6000);
  const [amountGen, setAmountGen] = useState('1.0');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!drugCandidate.trim() || drugCandidate.length < 4) {
      setError('Please provide a valid drug candidate code or name (at least 4 characters).');
      return;
    }

    if (maxSae < 1 || maxSae > 30) {
      setError('Maximum tolerable SAE must be between 1% and 30%.');
      return;
    }

    if (minEfficacy < 20 || minEfficacy > 95) {
      setError('Minimum efficacy rate must be between 20% and 95%.');
      return;
    }

    const amt = parseFloat(amountGen);
    if (isNaN(amt) || amt <= 0) {
      setError('Milestone grant amount must be greater than 0 GEN.');
      return;
    }

    try {
      await onSubmit(drugCandidate, maxSae, minEfficacy, durationBlocks, amountGen);
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
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-space font-bold text-lg text-slate-900">
                Register Clinical Trial Grant
              </h3>
              <p className="text-xs text-slate-500">Pharma Sponsor / DAO Escrow Protocol</p>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Drug Candidate / Molecule Code & Target
            </label>
            <input
              type="text"
              value={drugCandidate}
              onChange={(e) => setDrugCandidate(e.target.value)}
              placeholder="e.g. CTX-904 Oncology Kinase Inhibitor"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Tolerable SAE (%)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={maxSae}
                onChange={(e) => setMaxSae(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono text-slate-900"
                required
              />
              <span className="text-[11px] text-slate-400">Strict Safety Threshold</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Min Efficacy Response (%)
              </label>
              <input
                type="number"
                min={20}
                max={95}
                value={minEfficacy}
                onChange={(e) => setMinEfficacy(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono text-slate-900"
                required
              />
              <span className="text-[11px] text-slate-400">Target Endpoint</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Escrow Milestone Grant (GEN)
              </label>
              <input
                type="text"
                value={amountGen}
                onChange={(e) => setAmountGen(e.target.value)}
                placeholder="1.0"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono text-slate-900 font-bold"
                required
              />
              <span className="text-[11px] text-slate-400">Locked in contract</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Blocks)
              </label>
              <input
                type="number"
                min={100}
                value={durationBlocks}
                onChange={(e) => setDurationBlocks(parseInt(e.target.value) || 6000)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono text-slate-900"
                required
              />
              <span className="text-[11px] text-slate-400">~6000 blocks ≈ 24h</span>
            </div>
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
                  <span>Locking Grant on GenLayer...</span>
                </>
              ) : (
                <span>Deposit & Create Milestone Escrow</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
