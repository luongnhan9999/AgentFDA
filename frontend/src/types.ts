export interface ClinicalTrialData {
  trial_id: number;
  sponsor: string;
  investigator: string;
  dispute_initiator: string;
  escrow_amount: string;
  dispute_bond: string;
  drug_candidate: string;
  max_tolerable_sae_pct: number;
  min_efficacy_rate_pct: number;
  trial_data_url: string;
  safety_monitoring_url: string;
  evidence_hash: string;
  status: number;
  verdict: string;
  reason: string;
  confidence: number;
  measured_efficacy_pct: number;
  measured_sae_pct: number;
  created_at_block: string;
  expires_at_block: string;
  audit_completed_block: string;
}

export interface StatsData {
  total_trials: number;
  total_grant_locked: string;
  total_trials_settled: number;
  owner: string;
}

export const STATUS_LABELS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  0: { label: "OPEN / AWAITING CRO", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  1: { label: "IN CLINICAL TRIAL", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  2: { label: "AWAITING PAYOUT / DISPUTE WINDOW", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  3: { label: "SETTLED: MILESTONE APPROVED", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
  4: { label: "SETTLED: BIOHAZARD REFUND", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
  5: { label: "SETTLED: INCONCLUSIVE (50/50)", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  6: { label: "DISPUTED / UNDER APPEAL", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  7: { label: "CANCELLED / RECLAIMED", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-300" },
};
