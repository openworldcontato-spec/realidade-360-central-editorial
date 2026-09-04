import React from 'react';
import { ArrowUpRight } from 'lucide-react';
export default function StatCard({ label, value, note, accent }) {
  return <div className="rounded-2xl border border-white/7 bg-[#0b1424] p-4 transition hover:border-blue-500/30">
    <div className="flex items-start justify-between"><p className="text-xs font-medium text-slate-400">{label}</p><span className={`h-2 w-2 rounded-full ${accent}`} /></div>
    <div className="mt-4 flex items-end justify-between"><strong className="text-3xl font-semibold text-white">{value}</strong><span className="flex items-center gap-1 text-[11px] text-slate-500">{note}<ArrowUpRight className="h-3 w-3" /></span></div>
  </div>
}