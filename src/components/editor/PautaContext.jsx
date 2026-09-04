import React from 'react';
import { TrendingUp, Clock, ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, ExternalLink } from 'lucide-react';
import TrendBadge from '@/components/editorial/TrendBadge';
import ScoreBand from '@/components/editorial/ScoreBand';
const Block = ({ icon: Icon, title, color, children }) => <div className="rounded-xl border border-white/7 bg-[#070d18] p-4"><h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400"><Icon className={`h-3.5 w-3.5 ${color}`} />{title}</h4>{children}</div>;
const List = ({ items, empty }) => items && items.length ? <ul className="space-y-1 text-xs text-slate-300">{items.map((x, i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />{x}</li>)}</ul> : <p className="text-xs text-slate-600">{empty}</p>;
export default function PautaContext({ story, sources }) {
  if (!story) return null;
  const primary = sources.filter(s => s.is_primary);
  return <div className="rounded-2xl border border-white/7 bg-[#0b1424] p-5">
    <div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">{story.category}</span><TrendBadge trend={story.trend} /><ScoreBand band={story.score_band} score={story.opportunity_score} /></div>
    <h3 className="mt-3 text-base font-semibold text-white">{story.title}</h3>
    {story.is_developing && <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300"><AlertTriangle className="h-4 w-4" />Notícia em desenvolvimento · Última checagem: {story.last_check_at ? new Date(story.last_check_at).toLocaleTimeString('pt-BR') : '—'}</div>}
    {story.divergent_points && story.divergent_points.length > 0 && <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300"><strong>⚠ Versões divergentes:</strong> {story.divergent_points.join(' · ')}</div>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Block icon={HelpCircle} title="O que aconteceu" color="text-blue-400"><p className="text-xs leading-relaxed text-slate-300">{story.what_happened || story.summary || '—'}</p></Block>
      <Block icon={TrendingUp} title="Por que é relevante" color="text-cyan-400"><p className="text-xs leading-relaxed text-slate-300">{story.why_relevant || '—'}</p></Block>
      <Block icon={Clock} title="Cronologia" color="text-slate-400"><List items={story.timeline} empty="Sem cronologia." /></Block>
      <Block icon={ShieldCheck} title="Fontes primárias" color="text-[#d4af55]">{primary.length ? <ul className="space-y-1 text-xs text-slate-300">{primary.map(s => <li key={s.id}>{s.source_name}</li>)}</ul> : <p className="text-xs text-slate-600">Nenhuma.</p>}</Block>
      <Block icon={CheckCircle2} title="Confirmados" color="text-emerald-400"><List items={story.confirmed_points} empty="Nenhum." /></Block>
      <Block icon={AlertTriangle} title="Divergentes" color="text-amber-400"><List items={story.divergent_points} empty="Nenhum." /></Block>
      <Block icon={HelpCircle} title="Não confirmados" color="text-slate-400"><List items={story.unconfirmed_points} empty="Nenhum." /></Block>
      <Block icon={ExternalLink} title={`Cobertura (${sources.length})`} color="text-blue-400">{sources.length ? <ul className="space-y-1 text-xs">{sources.map(s => <li key={s.id}><a href={s.source_url} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-blue-400">{s.source_name || s.source_title}</a></li>)}</ul> : <p className="text-xs text-slate-600">Nenhuma.</p>}</Block>
    </div>
  </div>;
}