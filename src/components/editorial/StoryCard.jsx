import React from 'react';
import { Clock, Files } from 'lucide-react';
import StatusBadge from './StatusBadge';
export default function StoryCard({ story, children }) {
  const time = story.detected_at ? new Date(story.detected_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora';
  return <article className="group rounded-2xl border border-white/7 bg-[#0b1424] p-5 transition hover:-translate-y-0.5 hover:border-blue-500/30">
    <div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">{story.category}</span><span className="text-slate-700">•</span><span className="text-xs text-slate-500">{story.trend}</span></div>
    <h3 className="mt-3 text-base font-semibold leading-snug text-slate-100">{story.title}</h3>
    <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{time}</span><span className="flex items-center gap-1"><Files className="h-3.5 w-3.5" />{story.source_count || 0} fontes</span><span className="ml-auto font-semibold text-[#d4af55]">Score {story.opportunity_score}</span></div>
    <div className="mt-4 flex items-center justify-between"><StatusBadge status={story.status} />{children}</div>
  </article>
}