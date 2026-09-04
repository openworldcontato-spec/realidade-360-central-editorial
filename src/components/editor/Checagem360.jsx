import React from 'react';
import { CheckCircle2, ShieldCheck, Quote, AlertTriangle, HelpCircle, AlertCircle } from 'lucide-react';
const statusMap = {
  'Confirmado por múltiplas fontes': { icon: CheckCircle2, cls: 'text-emerald-400 bg-emerald-500/10' },
  'Confirmado por fonte primária': { icon: ShieldCheck, cls: 'text-[#d4af55] bg-[#d4af55]/10' },
  'Atribuído a uma fonte': { icon: Quote, cls: 'text-blue-300 bg-blue-500/10' },
  'Divergente': { icon: AlertTriangle, cls: 'text-amber-400 bg-amber-500/10' },
  'Não confirmado': { icon: HelpCircle, cls: 'text-slate-400 bg-slate-500/10' },
  'Exige revisão': { icon: AlertCircle, cls: 'text-red-400 bg-red-500/10' }
};
export default function Checagem360({ items }) {
  if (!items || !items.length) return <p className="text-sm text-slate-600">Execute a geração para ver a Checagem 360.</p>;
  return <div className="space-y-2">{items.map((c, i) => {
    const m = statusMap[c.status] || statusMap['Não confirmado']; const Icon = m.icon;
    return <div key={i} className="rounded-xl border border-white/7 bg-[#070d18] p-4">
      <div className="flex items-start justify-between gap-3"><p className="text-sm text-slate-200">{c.claim}</p><span className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${m.cls}`}><Icon className="h-3.5 w-3.5" />{c.status}</span></div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">{c.source && <span>Fonte: {c.source}</span>}{c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Abrir link ↗</a>}{c.note && <span className="text-slate-600">· {c.note}</span>}</div>
    </div>;
  })}</div>;
}