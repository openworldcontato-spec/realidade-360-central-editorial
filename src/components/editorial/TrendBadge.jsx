import React from 'react';
import { Zap, Flame, Rocket, Eye } from 'lucide-react';
const map = {
  'Última hora': { icon: Zap, cls: 'text-yellow-300' },
  'Em alta': { icon: Flame, cls: 'text-orange-400' },
  'Acelerando': { icon: Rocket, cls: 'text-cyan-400' },
  'Monitorar': { icon: Eye, cls: 'text-slate-400' }
};
export default function TrendBadge({ trend }) {
  const m = map[trend] || map['Monitorar'];
  const Icon = m.icon;
  return <span className={`flex items-center gap-1 text-[11px] font-semibold ${m.cls}`}><Icon className="h-3.5 w-3.5" />{trend}</span>;
}