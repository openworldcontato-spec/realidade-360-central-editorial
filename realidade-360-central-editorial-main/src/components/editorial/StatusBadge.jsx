import React from 'react';

const colors = { Detectada: 'bg-sky-500/10 text-sky-300', Monitorando: 'bg-amber-500/10 text-amber-300', Selecionada: 'bg-violet-500/10 text-violet-300', 'Em produção': 'bg-blue-500/10 text-blue-300', Revisão: 'bg-orange-500/10 text-orange-300', Pronta: 'bg-emerald-500/10 text-emerald-300', Publicada: 'bg-teal-500/10 text-teal-300', Arquivada: 'bg-slate-500/10 text-slate-400' };
export default function StatusBadge({ status }) {
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colors[status] || colors.Detectada}`}>{status}</span>;
}