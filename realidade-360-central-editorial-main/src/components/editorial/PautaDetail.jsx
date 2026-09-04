import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, ExternalLink, ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, Clock, Files, TrendingUp } from 'lucide-react';
import ScoreBand from './ScoreBand';
import TrendBadge from './TrendBadge';
import StatusBadge from './StatusBadge';
export default function PautaDetail({ story, onClose }) {
  const [sources, setSources] = useState([]);
  useEffect(() => { if (story) base44.entities.StorySource.filter({ story_id: story.id }, '-published_at', 100).then(setSources); }, [story]);
  if (!story) return null;
  const primary = sources.filter(s => s.is_primary);
  const Section = ({ icon: Icon, title, color, children }) => <section className="rounded-2xl border border-white/7 bg-[#0b1424] p-5"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Icon className={`h-4 w-4 ${color}`} />{title}</h3>{children}</section>;
  const List = ({ items, empty }) => items && items.length ? <ul className="space-y-2 text-sm text-slate-300">{items.map((x, i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" /><span>{x}</span></li>)}</ul> : <p className="text-sm text-slate-600">{empty}</p>;
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="my-8 w-full max-w-3xl rounded-3xl border border-white/10 bg-[#070d18] p-6 sm:p-8" onClick={e => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-4">
        <div><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">{story.category}</span><TrendBadge trend={story.trend} /><StatusBadge status={story.status} /></div><h2 className="mt-3 text-xl font-semibold leading-snug text-white sm:text-2xl">{story.title}</h2></div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5"><X className="h-5 w-5" /></button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><ScoreBand band={story.score_band} score={story.opportunity_score} /></div>
      {story.score_reason && <p className="mt-3 rounded-xl bg-white/[.03] p-3 text-[11px] leading-relaxed text-slate-400">{story.score_reason}</p>}
      <div className="mt-5 space-y-4">
        <Section icon={HelpCircle} title="O que aconteceu" color="text-blue-400"><p className="text-sm leading-relaxed text-slate-300">{story.what_happened || story.summary || 'Resumo não disponível.'}</p></Section>
        <Section icon={TrendingUp} title="Por que está ganhando relevância" color="text-cyan-400"><p className="text-sm leading-relaxed text-slate-300">{story.why_relevant || 'Análise de tendência não disponível.'}</p></Section>
        <Section icon={Clock} title="Cronologia" color="text-slate-400"><List items={story.timeline} empty="Cronologia não disponível." /></Section>
        <Section icon={Files} title="Cobertura encontrada" color="text-blue-400"><div className="space-y-2">{sources.length ? sources.map(s => <a key={s.id} href={s.source_url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[.02] p-3 transition hover:border-blue-500/30"><div><p className="text-sm font-medium text-slate-200">{s.source_title}</p><p className="mt-1 text-xs text-slate-500">{s.source_name}{s.published_at ? ` · ${new Date(s.published_at).toLocaleString('pt-BR')}` : ''}</p></div><ExternalLink className="h-4 w-4 shrink-0 text-blue-400" /></a>) : <p className="text-sm text-slate-600">Nenhuma fonte registrada.</p>}</div></Section>
        <Section icon={ShieldCheck} title="Fontes primárias" color="text-[#d4af55]"><div className="space-y-2">{primary.length ? primary.map(s => <a key={s.id} href={s.primary_source_url || s.source_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-[#d4af55]/20 bg-[#d4af55]/5 p-3"><div><p className="text-sm font-medium text-[#d4af55]">{s.source_name}</p><p className="mt-1 text-xs text-slate-500">{s.source_title}</p></div><ExternalLink className="h-4 w-4 shrink-0 text-[#d4af55]" /></a>) : <p className="text-sm text-slate-600">Nenhuma fonte primária oficial encontrada.</p>}</div></Section>
        <div className="grid gap-4 md:grid-cols-3">
          <Section icon={CheckCircle2} title="Pontos confirmados" color="text-emerald-400"><List items={story.confirmed_points} empty="Nenhum ponto corroborado por múltiplas fontes." /></Section>
          <Section icon={AlertTriangle} title="Pontos divergentes" color="text-amber-400"><List items={story.divergent_points} empty="Sem divergências registradas." /></Section>
          <Section icon={HelpCircle} title="Ainda não confirmado" color="text-slate-400"><List items={story.unconfirmed_points} empty="Nenhuma alegação não confirmada." /></Section>
        </div>
      </div>
    </div>
  </div>;
}