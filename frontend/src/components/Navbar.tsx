import React from 'react';
import { Activity, ShieldCheck, Wallet, RefreshCw, ExternalLink } from 'lucide-react';
import { formatAddress, formatGen } from '../utils/formatters';

interface NavbarProps {
  account: string | null;
  balance: string;
  onConnect: () => void;
  onDisconnect: () => void;
  contractAddress: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  account,
  balance,
  onConnect,
  onDisconnect,
  contractAddress,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-clinical-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Activity className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-space font-bold text-xl tracking-tight text-slate-900">
                  Agent<span className="text-teal-600">FDA</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 uppercase font-semibold">
                  StudioNet 61999
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Autonomous Clinical Trial Milestone & Patient Safety Oracle
              </p>
            </div>
          </div>

          {/* Controls & Wallet */}
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-500 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh on-chain state"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
            </button>

            <a
              href={`https://genlayer-explorer.vercel.app/address/${contractAddress}`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Contract: {formatAddress(contractAddress)}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {account ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-3">
                <div className="text-right">
                  <div className="text-xs font-mono font-semibold text-slate-800">
                    {formatAddress(account)}
                  </div>
                  <div className="text-[11px] font-mono text-teal-600 font-medium">
                    {formatGen(balance)}
                  </div>
                </div>
                <button
                  onClick={onDisconnect}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/20 transition-all hover:shadow-md"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect MetaMask</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
