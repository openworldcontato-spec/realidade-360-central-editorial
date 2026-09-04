import React from 'react';
import { Copy } from 'lucide-react';
export default function EditorField({ label, value, onChange, rows=3 }) {
 const copy=()=>navigator.clipboard.writeText(value||'');
 return <label className="block"><span className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400">{label}<button type="button" onClick={copy} className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"><Copy className="h-3 w-3"/>Copiar</button></span><textarea rows={rows} value={value||''} onChange={e=>onChange(e.target.value)} className="w-full resize-none rounded-xl border border-white/10 bg-[#070d18] px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-blue-500/60" /></label>
}