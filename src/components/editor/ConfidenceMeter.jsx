import React from 'react';
const bandCls = { 'Documentação muito forte': 'text-emerald-400', 'Boa sustentação': 'text-blue-300', 'Revisão recomendada': 'text-amber-400', 'Não recomendar publicação sem revisão': 'text-red-400' };
export default function ConfidenceMeter({ score, band }) {
  const s = score || 0;
  const color = s >= 90 ? 'bg-emerald-500' : s >= 75 ? 'bg-blue-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const label = band || (s >= 90 ? 'Documentação muito forte' : s >= 75 ? 'Boa sustentação' : s >= 60 ? 'Revisão recomendada' : 'Não recomendar publicação sem revisão');
  return <div className="rounded-2xl border border-white/7 bg-[#0b1424] p-4">
    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">Confiança editorial</span><span className="text-2xl font-bold text-white">{s}</span></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${color}`} style={{ width: `${s}%` }} /></div>
    <p className={`mt-2 text-xs ${bandCls[label] || 'text-slate-400'}`}>{label}</p>
    <p className="mt-2 text-[11px] leading-relaxed text-slate-600">Indica o suporte documental — não a verdade.</p>
  </div>;
}