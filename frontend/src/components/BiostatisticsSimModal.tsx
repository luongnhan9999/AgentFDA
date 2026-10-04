import React, { useState } from 'react';
import { X, ExternalLink, Activity, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface BiostatisticsSimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (drug: string, sae: number, minEff: number, dataUrl: string, safetyUrl: string) => void;
}

const SAMPLE_STUDIES = [
  {
    title: "Oncology Kinase Inhibitor (Phase II NSCLC)",
    drug: "CTX-904 Kinase Inhibitor",
    target: "EGFR T790M Mutation",
    sponsorRole: "BioPharma DAO Escrow",
    maxSae: 5,
    minEff: 65,
    dataUrl: "https://raw.githubusercontent.com/luongnhan9999/AgentFDA/main/README.md",
    safetyUrl: "https://raw.githubusercontent.com/luongnhan9999/AgentFDA/main/contracts/contract.py",
    expectedVerdict: "MILESTONE_APPROVED",
    expectedColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    description: "Multi-center clinical trial cohort with 120 patients. Low adverse event profile and high objective response rate.",
  },
  {
    title: "Alzheimer Peptide Therapy (Phase III Early AD)",
    drug: "NEURO-712 Amyloid Peptide",
    target: "Amyloid-Beta 42 Oligomers",
    sponsorRole: "NeuroScience Foundation",
    maxSae: 4,
    minEff: 50,
    dataUrl: "https://raw.githubusercontent.com/luongnhan9999/AgentFDA/main/README.md",
    safetyUrl: "https://raw.githubusercontent.com/luongnhan9999/AgentFDA/main/contracts/contract.py",
    expectedVerdict: "SAFETY_TERMINATED / BIOHAZARD",
    expectedColor: "text-rose-700 bg-rose-50 border-rose-200",
    description: "Biostatistical audit detects elevated neuro-inflammation and ARIA-E brain edema exceeding the 4% safety boundary.",
  },
  {
    title: "CAR-T Cell Immunotherapy (Phase I/II Refractory Lymphoma)",
    drug: "CAR-T-99 Immunotherapy",
    target: "CD19 B-Cell Antigen",
    sponsorRole: "OncoGen Therapeutics",
    maxSae: 6,
    minEff: 70,
    dataUrl: "https://raw.githubusercontent.com/luongnhan9999/AgentFDA/main/README.md",
    safetyUrl: "https://raw.githubusercontent.com/luongnhan9999/AgentFDA/main/contracts/contract.py",
    expectedVerdict: "TRIAL_INCONCLUSIVE / DISPUTED",
    expectedColor: "text-purple-700 bg-purple-50 border-purple-200",
    description: "Marginal clinical response (p-value > 0.05). Demonstrates 24-block dispute cooling-off window and 10% appeal bond.",
  },
];

export const BiostatisticsSimModal: React.FC<BiostatisticsSimModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-clinical-border shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-clinical-border bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-space font-bold text-lg text-slate-900">
                Clinical Study Case Library
              </h3>
              <p className="text-xs text-slate-500">
                Preset trial scenarios with real public endpoints for live on-chain demonstration
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

        {/* List of Studies */}
        <div className="p-6 overflow-y-auto space-y-4">
          {SAMPLE_STUDIES.map((study, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 hover:border-teal-500 bg-white hover:bg-slate-50/50 transition-all duration-200 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      CASE #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${study.expectedColor}`}>
                      {study.expectedVerdict}
                    </span>
                  </div>
                  <h4 className="font-space font-bold text-sm text-slate-900">
                    {study.title}
                  </h4>
                </div>
                <button
                  onClick={() => {
                    onSelectSample(study.drug, study.maxSae, study.minEff, study.dataUrl, study.safetyUrl);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-2xs whitespace-nowrap"
                >
                  Apply to Form
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {study.description}
              </p>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-[11px] font-mono border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">SAE Limit</span>
                  <span className="font-bold text-rose-600">≤ {study.maxSae}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">Min Efficacy</span>
                  <span className="font-bold text-teal-600">≥ {study.minEff}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">Target</span>
                  <span className="font-bold text-slate-700 truncate block">{study.target}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-clinical-border flex items-center justify-between text-xs text-slate-500">
          <span>Click "Apply to Form" to pre-fill parameters and deposit grant on-chain.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
