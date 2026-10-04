import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, HeartPulse, Dna, FileCheck, ExternalLink } from 'lucide-react';

export const ClinicalTelemetryRibbon: React.FC = () => {
  const [activeOffset, setActiveOffset] = useState(0);

  // Live clinical biometric telemetry stream markers
  const telemetryStream = [
    { label: 'ORR', val: '74.2%', status: 'optimal' },
    { label: 'SAE', val: '1.8%', status: 'safe' },
    { label: 'P-VAL', val: '0.0012', status: 'optimal' },
    { label: 'DSMB', val: 'CLEAR', status: 'optimal' },
    { label: 'Q-SCORE', val: '99.8%', status: 'optimal' },
    { label: 'CANARY', val: 'VERIFIED', status: 'optimal' },
    { label: 'ICH-GCP', val: 'E6(R2)', status: 'safe' },
    { label: 'COHORT-N', val: '120 PTS', status: 'safe' },
    { label: 'GRADE-3/4', val: '0.0%', status: 'optimal' },
    { label: 'BIOHAZARD', val: 'NEGATIVE', status: 'optimal' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveOffset((prev) => (prev + 1) % telemetryStream.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [telemetryStream.length]);

  return (
    <div className="bg-slate-900 border-b border-teal-900/60 py-2 px-4 sm:px-6 lg:px-8 text-[11px] font-mono text-slate-300 shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <span className="font-bold text-[10px] uppercase tracking-wider text-teal-400">
            Real-Time DSMB Telemetry Stream
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-[10px] text-slate-400">
            GenVM Biostatistics Kernel Active
          </span>
        </div>

        {/* Streaming Data Tags */}
        <div className="flex items-center gap-2 overflow-x-auto select-none no-scrollbar">
          {telemetryStream.map((item, idx) => {
            const isHighlight = idx === activeOffset;
            return (
              <div
                key={idx}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] transition-all duration-300 ${
                  isHighlight
                    ? 'bg-teal-500/20 border-teal-400 text-teal-200 shadow-xs shadow-teal-500/30 scale-105'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-400'
                }`}
              >
                <span className="text-slate-500 font-semibold">{item.label}:</span>
                <span className="font-bold text-slate-200">{item.val}</span>
              </div>
            );
          })}
        </div>

        {/* Right Compliance Standard */}
        <div className="hidden lg:flex items-center gap-2 shrink-0 text-[10px] text-teal-400/80">
          <FileCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>FDA 21 CFR Part 11 Compliant Consensus</span>
        </div>
      </div>
    </div>
  );
};
