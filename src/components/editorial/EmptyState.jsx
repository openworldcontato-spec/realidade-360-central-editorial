import React from 'react';
import { Radar as RadarIcon } from 'lucide-react';
export default function EmptyState({ title = 'Nenhuma pauta encontrada. Execute uma atualização do Radar 360.', action }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[.02] px-6 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10"><RadarIcon className="h-7 w-7 text-blue-400" /></div>
    <p className="mt-5 max-w-md text-sm text-slate-400">{title}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>;
}