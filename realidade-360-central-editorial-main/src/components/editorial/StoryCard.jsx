import React from 'react';
import { Clock, RefreshCw, Files, ShieldCheck } from 'lucide-react';
import TrendBadge from './TrendBadge';
import ScoreBand from './ScoreBand';
import StatusBadge from './StatusBadge';
export default function StoryCard({ story, actions }) {
  const first = story.detected_at ? new Date(story.detected_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
  const last = story.last_updated_at ? new Date(story.last_updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : first;
  return <article className="flex flex-col rounded-2xl border border-white/7 bg-[#0b1424] p-5 transition hover:border-blue-500/30">
    <div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">{story.category}</span><span className="text-slate-700">•</span><TrendBadge trend={story.trend} /></div>
    <h3 className="mt-3 text-base font-semibold leading-snug text-slate-100">{story.title}</h3>
    {story.summary && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">{story.summary}</p>}
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      <span className="flex items-center gap-1" title="Primeira detecção"><Clock className="h-3.5 w-3.5" />{first}</span>
      <span className="flex items-center gap-1" title="Última atualização"><RefreshCw className="h-3.5 w-3.5" />{last}</span>
      <span className="flex items-center gap-1"><Files className="h-3.5 w-3.5" />{story.source_count || 0} fontes</span>
      {story.primary_source_count > 0 && <span className="flex items-center gap-1 text-[#d4af55]"><ShieldCheck className="h-3.5 w-3.5" />{story.primary_source_count} primárias</span>}
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><ScoreBand band={story.score_band} score={story.opportunity_score} /><StatusBadge status={story.status} /></div>
    {story.score_reason && <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{story.score_reason}</p>}
    {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
  </article>;
}