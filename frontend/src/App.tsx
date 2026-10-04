import React, { useState, useEffect } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { TrialCard } from './components/TrialCard';
import { CreateTrialModal } from './components/CreateTrialModal';
import { SubmitDataModal } from './components/SubmitDataModal';
import { AuditInspectorModal } from './components/AuditInspectorModal';
import { AppealModal } from './components/AppealModal';
import { ClinicalTrialData, StatsData } from './types';
import { DEFAULT_CONTRACT_ADDRESS, CHAIN_ID_HEX } from './config/genlayer';
import { Plus, Activity, RefreshCw, AlertCircle, Sparkles, Filter, ShieldCheck, Microscope } from 'lucide-react';

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

  // Filters
  const [filterRole, setFilterRole] = useState<'all' | 'mine' | 'open' | 'active' | 'settled' | 'disputed'>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitTargetTrial, setSubmitTargetTrial] = useState<ClinicalTrialData | null>(null);
  const [inspectTrial, setInspectTrial] = useState<ClinicalTrialData | null>(null);
  const [appealTrial, setAppealTrial] = useState<ClinicalTrialData | null>(null);

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
        setTrials(parsedTrials.reverse());
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

  // Filtered Trials
  const filteredTrials = trials.filter((t) => {
    if (filterRole === 'mine' && account) {
      return (
        t.sponsor.toLowerCase() === account.toLowerCase() ||
        t.investigator.toLowerCase() === account.toLowerCase()
      );
    }
    if (filterRole === 'open') return t.status === 0;
    if (filterRole === 'active') return t.status === 1 || t.status === 2;
    if (filterRole === 'settled') return t.status >= 3 && t.status <= 5;
    if (filterRole === 'disputed') return t.status === 6;
    return true;
  });

  const activeCount = trials.filter((t) => t.status === 0 || t.status === 1 || t.status === 2 || t.status === 6).length;

  return (
    <div className="min-h-screen bg-clinical-slate flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        account={account}
        balance={balance}
        onConnect={connectWallet}
        onDisconnect={() => setAccount(null)}
        contractAddress={DEFAULT_CONTRACT_ADDRESS}
        onRefresh={fetchContractState}
        isRefreshing={isLoadingData}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grow w-full">
        {/* Banner Hero */}
        <div className="bg-linear-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-6">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold mb-4">
              <Microscope className="w-3.5 h-3.5" />
              <span>DeSci × Intelligent Oracle Protocol</span>
            </div>
            <h1 className="font-space font-bold text-2xl sm:text-4xl tracking-tight leading-tight">
              Autonomous Clinical Trial Milestones & Patient Safety Oracle
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
              Eliminate sponsor bias and clinical p-hacking. GenLayer GenVM validators independently ingest de-identified cohort datasets, audit DSMB safety feeds, and release milestone grants upon mathematical consensus.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Deposit Milestone Grant</span>
              </button>
              <a
                href="https://github.com/luongnhan9999/AgentFDA"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium text-xs sm:text-sm rounded-xl border border-white/20 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Protocol Specs & Architecture</span>
              </a>
            </div>
          </div>

          {/* Decorative Background Blob */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-40 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Global Stats Overview */}
        <StatsOverview
          stats={stats || { total_trials: trials.length, total_grant_locked: '0', total_trials_settled: 0, owner: '' }}
          activeCount={activeCount}
        />

        {/* Status / Transaction Pending Notification */}
        {isTxPending && (
          <div className="my-4 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-3 animate-pulse shadow-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-teal-600 shrink-0" />
            <div>
              <div className="font-semibold text-xs uppercase tracking-wider text-teal-700">
                GenLayer GenVM Consensus Active
              </div>
              <div className="text-xs text-teal-800">{txMessage}</div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="my-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-xs">
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

        {/* Filter Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="font-space font-bold text-xl text-slate-900">
              Clinical Trial Protocols
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
              {filteredTrials.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: 'All Trials' },
                { id: 'open', label: 'Open for CRO' },
                { id: 'active', label: 'Active Review' },
                { id: 'settled', label: 'Settled' },
                { id: 'disputed', label: 'Disputed' },
                ...(account ? [{ id: 'mine', label: 'My Trials' }] : []),
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterRole(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterRole === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trials Grid */}
        {filteredTrials.length === 0 ? (
          <div className="bg-white rounded-3xl border border-clinical-border p-12 text-center shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="font-space font-bold text-lg text-slate-800">
              No Clinical Trials Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              No trials currently match the selected filter. As a Pharma Sponsor, you can register a new milestone grant.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-teal-600/20"
            >
              Deposit New Milestone Grant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrials.map((trial) => (
              <TrialCard
                key={trial.trial_id}
                trial={trial}
                account={account}
                onOpenSubmitData={(t) => setSubmitTargetTrial(t)}
                onOpenAuditInspector={(t) => setInspectTrial(t)}
                onOpenAppeal={(t) => setAppealTrial(t)}
                onAdjudicate={handleAdjudicate}
                onFinalize={handleFinalize}
                onCancel={handleCancel}
                isActionLoading={isTxPending}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-clinical-border bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-space font-bold text-slate-800">AgentFDA</span>
            <span>•</span>
            <span>GenLayer StudioNet Consensus</span>
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
    </div>
  );
}

export default App;
