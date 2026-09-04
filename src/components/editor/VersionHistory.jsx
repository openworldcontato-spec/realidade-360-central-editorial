import React from 'react';
import { X, History, RotateCcw } from 'lucide-react';
const typeLabel = { gerar: 'Geração', reescrever: 'Reescrita', manual: 'Manual' };
export default function VersionHistory({ versions, onClose, onRestore }) {
  if (!versions) return null;
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="my-8 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#070d18] p-6" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-semibold text-white"><History className="h-5 w-5" />Histórico de versões</h3><button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button></div>
      <div className="mt-5 space-y-2">{versions.map(v => <div key={v.id} className="flex items-center justify-between rounded-xl border border-white/7 bg-[#0b1424] p-4">
        <div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-blue-400">v{v.version_number}</span><span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">{typeLabel[v.generation_type] || v.generation_type}{v.rewrite_mode ? ` · ${v.rewrite_mode}` : ''}</span>{v.is_final && <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">Final</span>}</div><p className="mt-1 text-sm text-slate-200">{v.main_title || v.art_headline || '(sem título)'}</p><p className="mt-1 text-xs text-slate-500">{new Date(v.created_date).toLocaleString('pt-BR')}</p></div>
        <button onClick={() => onRestore(v)} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"><RotateCcw className="h-3.5 w-3.5" />Restaurar</button></div>)}</div>
    </div>
  </div>;
}