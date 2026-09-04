import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
export default function EditorField({ label, value, onChange, rows = 3 }) {
  const [done, setDone] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(value || ''); setDone(true); setTimeout(() => setDone(false), 1800); };
  return <label className="block">
    <span className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-400">
      <span className="min-w-0 break-words">{label}</span>
      <button type="button" onClick={copy} className="flex shrink-0 items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">{done ? <><Check className="h-3 w-3" />Copiado.</> : <><Copy className="h-3 w-3" />Copiar</>}</button>
    </span>
    <textarea rows={rows} value={value || ''} onChange={e => onChange(e.target.value)} className="w-full resize-none rounded-xl border border-white/10 bg-[#070d18] px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-blue-500/60" />
  </label>;
}