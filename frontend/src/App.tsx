import React, { useState, useEffect } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { Navbar } from './components/Navbar';
import { ClinicalTelemetryRibbon } from './components/ClinicalTelemetryRibbon';
import { StatsOverview } from './components/StatsOverview';
import { TrialPipelineSidebar } from './components/TrialPipelineSidebar';
import { ClinicalConsoleCockpit } from './components/ClinicalConsoleCockpit';
import { DeSciRegulatoryVaultSidebar } from './components/DeSciRegulatoryVaultSidebar';
import { TrialCard } from './components/TrialCard';
import { CreateTrialModal } from './components/CreateTrialModal';
import { SubmitDataModal } from './components/SubmitDataModal';
import { AuditInspectorModal } from './components/AuditInspectorModal';
import { AppealModal } from './components/AppealModal';
import { AdjudicateAppealModal } from './components/AdjudicateAppealModal';
import { BiostatisticsSimModal } from './components/BiostatisticsSimModal';
import { ClinicalTrialData, StatsData } from './types';
import { DEFAULT_CONTRACT_ADDRESS, CHAIN_ID_HEX } from './config/genlayer';
import { 
  Plus, 
  Activity, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Filter, 
  ShieldCheck, 
  Microscope, 
  Database,
  LayoutGrid,
  Columns3
} from 'lucide-react';

export function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isTxPending, setIsTxPending] = useState(false);
  const [txMessage, setTxMessage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Contract Data
  const [trials, setTrials] = useState<ClinicalTrialData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrialData | null>(null);

  // Layout View Mode: 'cockpit' (3-Panel Command Console) vs 'grid' (Ledger Grid)
  const [layoutMode, setLayoutMode] = useState<'cockpit' | 'grid'>('cockpit');

  // Filters & Search
  const [filterRole, setFilterRole] = useState<'all' | 'mine' | 'open' | 'active' | 'cooling' | 'settled' | 'disputed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [submitTargetTrial, setSubmitTargetTrial] = useState<ClinicalTrialData | null>(null);
  const [inspectTrial, setInspectTrial] = useState<ClinicalTrialData | null>(null);
  const [appealTrial, setAppealTrial] = useState<ClinicalTrialData | null>(null);
  const [adjudicateAppealTrial, setAdjudicateAppealTrial] = useState<ClinicalTrialData | null>(null);

  // Pre-fill parameters for Create Modal from Library
  const [presetDrug, setPresetDrug] = useState('CTX-904 Oncology Kinase Inhibitor');
  const [presetMaxSae, setPresetMaxSae] = useState(5);
  const [presetMinEff, setPresetMinEff] = useState(60);

  // Initialize and check MetaMask on load
  useEffect(() => {
    if ((window as any).ethereum) {
      (window as any).ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            fetchBalance(accounts[0]);
          }
        })
        .catch(console.error);

      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchBalance(accounts[0]);
        } else {
          setAccount(null);
          setBalance('0');
        }
      });
    }
    fetchContractState();
  }, []);

  const fetchBalance = async (addr: string) => {
    try {
      if ((window as any).ethereum) {
        const balHex = await (window as any).ethereum.request({
          method: 'eth_getBalance',
          params: [addr, 'latest'],
        });
        setBalance(BigInt(balHex).toString());
      }
    } catch (e) {
      console.warn('Failed to fetch balance:', e);
    }
  };

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      alert('MetaMask or Web3 wallet not detected. Please install MetaMask.');
      return;
    }
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      // 1. Switch to GenLayer StudioNet
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CHAIN_ID_HEX }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902 || switchError.code === -32603) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: CHAIN_ID_HEX,
                chainName: 'Genlayer Studio Network',
                nativeCurrency: { name: 'GEN Token', symbol: 'GEN', decimals: 18 },
                rpcUrls: ['https://studio.genlayer.com/api'],
                blockExplorerUrls: ['https://genlayer-explorer.vercel.app'],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      // 2. Request accounts
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await fetchBalance(accounts[0]);
      }
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setErrorMsg(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const getClient = () => {
    if (!account) {
      return createClient({ chain: studionet });
    }
    return createClient({ chain: studionet, account: account as `0x${string}` });
  };

  const fetchContractState = async () => {
    setIsLoadingData(true);
    try {
      const client = getClient();

      // Read all trials
      const rawAllTrials = await (client as any).readContract({
        address: DEFAULT_CONTRACT_ADDRESS,
        functionName: 'get_all_trials',
        args: [],
      });

      if (rawAllTrials) {
        const parsedTrials: ClinicalTrialData[] =
          typeof rawAllTrials === 'string' ? JSON.parse(rawAllTrials) : rawAllTrials;
        const reversed = parsedTrials.reverse();
        setTrials(reversed);

        // Auto-select first trial for cockpit if none selected
        if (reversed.length > 0) {
          setSelectedTrial((prev) => {
            if (!prev) return reversed[0];
            const updated = reversed.find((t) => t.trial_id === prev.trial_id);
            return updated || reversed[0];
          });
        }
      }

      // Read stats
      const rawStats = await (client as any).readContract({
        address: DEFAULT_CONTRACT_ADDRESS,
        functionName: 'get_stats',
        args: [],
      });

      if (rawStats) {
        const parsedStats: StatsData =
          typeof rawStats === 'string' ? JSON.parse(rawStats) : rawStats;
        setStats(parsedStats);
      }
    } catch (err: any) {
      console.error('Error fetching on-chain state:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ── Smart Contract Write Actions ──────────────────────────────────

  const handleCreateTrial = async (
    drugCandidate: string,
    maxSae: number,
    minEfficacy: number,
    durationBlocks: number,
    amountGen: string
  ) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsTxPending(true);
    setTxMessage('Submitting Clinical Trial Escrow Grant to GenLayer StudioNet...');
    setErrorMsg(null);
    try {
      const client = getClient();
      const weiDeposit = BigInt(Math.floor(parseFloat(amountGen) * 1e18));

      const tx = await (client as any).writeContract({
        address: DEFAULT_CONTRACT_ADDRESS,
        functionName: 'create_trial_grant',
        args: [drugCandidate, maxSae, minEfficacy, durationBlocks],
        value: weiDeposit,
      });

      setTxMessage('Milestone grant deposited! Awaiting GenVM block confirmation...');
      await (client as any).waitForTransactionReceipt({ hash: tx });
      setIsCreateOpen(false);
      await fetchContractState();
      if (account) fetchBalance(account);
    } catch (err: any) {
      console.error('Create trial error:', err);
      setErrorMsg(err.message || 'Transaction failed');
    } finally {
      setIsTxPending(false);
      setTxMessage('');
    }
  };

  const handleSubmitData = async (trialId: number, dataUrl: string, safetyUrl: string) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsTxPending(true);
    setTxMessage(`Claiming Trial #${trialId} as CRO & Linking Clinical Cohort Logs...`);
    setErrorMsg(null);
    try {
      const client = getClient();
      const tx = await (client as any).writeContract({
        address: DEFAULT_CONTRACT_ADDRESS,
        functionName: 'submit_trial_data',
        args: [trialId, dataUrl, safetyUrl],
      });

      setTxMessage('Clinical data linked! Awaiting GenVM block inclusion...');
      await (client as any).waitForTransactionReceipt({ hash: tx });
      setSubmitTargetTrial(null);
      await fetchContractState();
    } catch (err: any) {
      console.error('Submit data error:', err);
      setErrorMsg(err.message || 'Transaction failed');
    } finally {
      setIsTxPending(false);
      setTxMessage('');
    }
  };

  const handleAdjudicate = async (trialId: number) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsTxPending(true);
    setTxMessage(
      `Convening AI Regulatory Jury on Trial #${trialId}... GenVM validators rendering patient cohort outcomes & analyzing biostatistical p-values.`
    );
    setErrorMsg(null);
    try {
      const client = getClient();
      const tx = await (client as any).writeContract({
        address: DEFAULT_CONTRACT_ADDRESS,
        functionName: 'adjudicate_milestone',
        args: [trialId],
      });

      setTxMessage('AI consensus reached! Finalizing clinical regulatory verdict on StudioNet...');
      await (client as any).waitForTransactionReceipt({ hash: tx });
      await fetchContractState();
    } catch (err: any) {
      console.error('Adjudication error:', err);
      setErrorMsg(err.message || 'Adjudication failed');
    } finally {
      setIsTxPending(false);
      setTxMessage('');
    }
  };

  const handleAppealSubmit = async (trialId: number, disputeReason: string, bondGen: string) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsTxPending(true);
    setTxMessage(`Staking 10% Dispute Bond and Filing Appeal for Trial #${trialId}...`);
    setErrorMsg(null);
    try {
      const client = getClient();
      const weiBond = BigInt(Math.floor(parseFloat(bondGen) * 1e18));

      const tx = await (client as any).writeContract({
        address: DEFAULT_CONTRACT_ADDRESS,
        functionName: 'appeal_verdict',
        args: [trialId, disputeReason],
        value: weiBond,
      });

      setTxMessage('Dispute registered! Entering appellate challenge status...');
      await (client as any).waitForTransactionReceipt({ hash: tx });
      setAppealTrial(null);
      await fetchContractState();
      if (account) fetchBalance(account);
    } catch (err: any) {
      console.error('Appeal error:', err);
      setErrorMsg(err.message || 'Appeal failed');
    } finally {
      setIsTxPending(false);
      setTxMessage('');
    }
  };

  const handleAdjudicateAppeal = async (trialId: number, supplementalUrl: string) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsTxPending(true);
    setTxMessage(`Convening Supreme Appellate Tribunal for Trial #${trialId}... GenVM validators rendering supplemental audit logs.`);
    setErrorMsg(null);
    try {
      const client = getClient();
      const tx = await (client as any).writeContract({
        address: DEFAULT_CONTRACT_ADDRESS,
        functionName: 'adjudicate_appeal',
        args: [trialId, supplementalUrl],
      });

      setTxMessage('Appellate tribunal consensus reached! Settling escrow & dispute bond on StudioNet...');
      await (client as any).waitForTransactionReceipt({ hash: tx });
      setAdjudicateAppealTrial(null);
      await fetchContractState();
      if (account) fetchBalance(account);
    } catch (err: any) {
      console.error('Adjudicate appeal error:', err);
      setErrorMsg(err.message || 'Appellate adjudication failed');
    } finally {
      setIsTxPending(false);
      setTxMessage('');
    }
  };

  const handleFinalize = async (trialId: number) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsTxPending(true);
    setTxMessage(`Finalizing settlement payout for Trial #${trialId} after cooling-off window...`);
    setErrorMsg(null);
    try {
      const client = getClient();
      const tx = await (client as any).writeContract({
        address: DEFAULT_CONTRACT_ADDRESS,
        functionName: 'finalize_settlement',
        args: [trialId],
      });

      setTxMessage('Settlement processed! Releasing milestone funds on StudioNet...');
      await (client as any).waitForTransactionReceipt({ hash: tx });
      await fetchContractState();
      if (account) fetchBalance(account);
    } catch (err: any) {
      console.error('Finalize error:', err);
      setErrorMsg(err.message || 'Finalize settlement failed');
    } finally {
      setIsTxPending(false);
      setTxMessage('');
    }
  };

  const handleCancel = async (trialId: number) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsTxPending(true);
    setTxMessage(`Reclaiming expired trial grant for Trial #${trialId}...`);
    setErrorMsg(null);
    try {
      const client = getClient();
      const tx = await (client as any).writeContract({
        address: DEFAULT_CONTRACT_ADDRESS,
        functionName: 'cancel_or_reclaim',
        args: [trialId],
      });

      setTxMessage('Grant reclaimed! Refunding escrow to sponsor...');
      await (client as any).waitForTransactionReceipt({ hash: tx });
      await fetchContractState();
      if (account) fetchBalance(account);
    } catch (err: any) {
      console.error('Cancel error:', err);
      setErrorMsg(err.message || 'Cancel trial failed');
    } finally {
      setIsTxPending(false);
      setTxMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        account={account}
        balance={balance}
        onConnect={connectWallet}
        onDisconnect={() => setAccount(null)}
        contractAddress={DEFAULT_CONTRACT_ADDRESS}
        onRefresh={fetchContractState}
        isRefreshing={isLoadingData}
      />

      {/* Real-time DSMB Biostatistical Telemetry Ribbon */}
      <ClinicalTelemetryRibbon />

      {/* Main Workspace Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grow w-full space-y-6">
        {/* Global Action Bar with Layout Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setLayoutMode('cockpit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  layoutMode === 'cockpit'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5 text-teal-400" />
                <span>Regulatory Console</span>
              </button>
              <button
                onClick={() => setLayoutMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  layoutMode === 'grid'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-teal-400" />
                <span>Protocol Grid</span>
              </button>
            </div>

            <button
              onClick={() => setIsLibraryOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-semibold shadow-2xs transition-all"
            >
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>Study Case Library</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Deposit Milestone Grant</span>
            </button>
          </div>
        </div>

        {/* Global Stats Overview */}
        <StatsOverview
          stats={stats || { total_trials: trials.length, total_grant_locked: '0', total_trials_settled: 0, owner: '' }}
          activeCount={trials.filter((t) => t.status < 3 || t.status === 6).length}
        />

        {/* Transaction Status Pill */}
        {isTxPending && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-3 animate-pulse shadow-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-teal-600 shrink-0" />
            <div>
              <div className="font-semibold text-xs uppercase tracking-wider text-teal-700">
                GenVM Consensus Transaction In Progress
              </div>
              <div className="text-xs text-teal-800">{txMessage}</div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs uppercase tracking-wider text-rose-700">
                  Transaction Alert
                </div>
                <div className="text-xs text-rose-800">{errorMsg}</div>
              </div>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* PROMAX 3-PANEL REGULATORY CONSOLE (COCKPIT MODE) */}
        {layoutMode === 'cockpit' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 3 Cols: Protocol Pipeline Sidebar */}
            <div className="lg:col-span-3">
              <TrialPipelineSidebar
                trials={trials}
                selectedTrialId={selectedTrial?.trial_id || null}
                onSelectTrial={(t) => setSelectedTrial(t)}
                onOpenCreate={() => setIsCreateOpen(true)}
                selectedFilter={filterRole}
                onFilterChange={(f) => setFilterRole(f)}
                searchQuery={searchQuery}
                onSearchChange={(q) => setSearchQuery(q)}
                account={account}
              />
            </div>

            {/* Middle 6 Cols: High-Precision Clinical Inspection Cockpit */}
            <div className="lg:col-span-6">
              <ClinicalConsoleCockpit
                trial={selectedTrial}
                account={account}
                onOpenSubmitData={(t) => setSubmitTargetTrial(t)}
                onOpenAuditInspector={(t) => setInspectTrial(t)}
                onOpenAppeal={(t) => setAppealTrial(t)}
                onOpenAdjudicateAppeal={(t) => setAdjudicateAppealTrial(t)}
                onAdjudicate={handleAdjudicate}
                onFinalize={handleFinalize}
                onCancel={handleCancel}
                isProcessing={isTxPending}
              />
            </div>

            {/* Right 3 Cols: DeSci Regulatory Vault & Treasury Panel */}
            <div className="lg:col-span-3">
              <DeSciRegulatoryVaultSidebar
                stats={stats || { total_trials: trials.length, total_grant_locked: '0', total_trials_settled: 0, owner: '' }}
                trials={trials}
                onOpenLibrary={() => setIsLibraryOpen(true)}
                onOpenCreate={() => setIsCreateOpen(true)}
              />
            </div>
          </div>
        ) : (
          /* TRADITIONAL PROTOCOL GRID MODE */
          <div className="space-y-6">
            {trials.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-100 shadow-inner">
                  <Database className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="font-space text-lg font-bold text-slate-900">
                  New Contract Initialized — 0 Protocols On-Chain
                </h3>
                <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
                  Contract <span className="font-mono text-teal-700 bg-slate-100 px-1.5 py-0.5 rounded font-bold">{DEFAULT_CONTRACT_ADDRESS.slice(0, 8)}...{DEFAULT_CONTRACT_ADDRESS.slice(-6)}</span> is fresh and ready. Previous contract trials have been reset. Deposit a milestone grant to launch the first clinical protocol.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Deposit Milestone Grant</span>
                  </button>
                  <button
                    onClick={() => setIsLibraryOpen(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Load Case Study Preset</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trials.map((trial) => (
                  <TrialCard
                    key={trial.trial_id}
                    trial={trial}
                    account={account}
                    onOpenSubmitData={(t) => setSubmitTargetTrial(t)}
                    onOpenAuditInspector={(t) => setInspectTrial(t)}
                    onOpenAppeal={(t) => setAppealTrial(t)}
                    onOpenAdjudicateAppeal={(t) => setAdjudicateAppealTrial(t)}
                    onAdjudicate={handleAdjudicate}
                    onFinalize={handleFinalize}
                    onCancel={handleCancel}
                    isActionLoading={isTxPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-space font-bold text-slate-800">AgentFDA</span>
            <span>•</span>
            <span>GenLayer StudioNet Biostatistical Consensus</span>
            <span>•</span>
            <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
              Chain ID: 61999
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal-600 transition-colors"
            >
              GenLayer Studio
            </a>
            <a
              href="https://genlayer-explorer.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal-600 transition-colors"
            >
              Block Explorer
            </a>
            <a
              href={`https://genlayer-explorer.vercel.app/address/${DEFAULT_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal-600 transition-colors font-mono"
            >
              {DEFAULT_CONTRACT_ADDRESS.slice(0, 10)}...
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateTrialModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTrial}
        isLoading={isTxPending}
        initialDrug={presetDrug}
        initialMaxSae={presetMaxSae}
        initialMinEff={presetMinEff}
      />

      <SubmitDataModal
        isOpen={Boolean(submitTargetTrial)}
        onClose={() => setSubmitTargetTrial(null)}
        trial={submitTargetTrial}
        onSubmit={handleSubmitData}
        isLoading={isTxPending}
      />

      <AuditInspectorModal
        isOpen={Boolean(inspectTrial)}
        onClose={() => setInspectTrial(null)}
        trial={inspectTrial}
      />

      <AppealModal
        isOpen={Boolean(appealTrial)}
        onClose={() => setAppealTrial(null)}
        trial={appealTrial}
        onSubmitAppeal={handleAppealSubmit}
        isLoading={isTxPending}
      />

      <AdjudicateAppealModal
        isOpen={Boolean(adjudicateAppealTrial)}
        onClose={() => setAdjudicateAppealTrial(null)}
        trial={adjudicateAppealTrial}
        onSubmit={handleAdjudicateAppeal}
        isLoading={isTxPending}
      />

      <BiostatisticsSimModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectSample={(drug, sae, minEff) => {
          setPresetDrug(drug);
          setPresetMaxSae(sae);
          setPresetMinEff(minEff);
          setIsCreateOpen(true);
        }}
      />
    </div>
  );
}

export default App;
