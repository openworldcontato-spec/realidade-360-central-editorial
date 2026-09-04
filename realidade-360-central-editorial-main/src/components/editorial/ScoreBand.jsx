import React from 'react';
const map = {
  'PUBLICAR AGORA': 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  'ALTO POTENCIAL': 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30',
  'ACOMPANHAR': 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  'BAIXA PRIORIDADE': 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20'
};
export default function ScoreBand({ band, score }) {
  return <span className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-[11px] font-bold ${map[band] || map['BAIXA PRIORIDADE']}`}><span>{band}</span>{typeof score === 'number' && <span className="text-white">{score}</span>}</span>;
}