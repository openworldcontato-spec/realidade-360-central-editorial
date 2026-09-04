import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/editorial/PageHeader';
import StoryCard from '@/components/editorial/StoryCard';
import EmptyState from '@/components/editorial/EmptyState';
import { Radar as RadarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const statuses = ['Detectada', 'Monitorando', 'Selecionada', 'Em produção', 'Revisão', 'Pronta', 'Publicada', 'Arquivada'];
export default function Stories() {
  const [stories, setStories] = useState([]);
  const [filter, setFilter] = useState('Todas');
  const navigate = useNavigate();
  const load = () => base44.entities.Story.filter({ ignored: false }, '-updated_date', 60).then(setStories);
  useEffect(() => { load(); }, []);
  const change = async (id, status) => { await base44.entities.Story.update(id, { status }); setStories(v => v.map(s => s.id === id ? { ...s, status } : s)); };
  const visible = filter === 'Todas' ? stories : stories.filter(s => s.status === filter);
  return <>
    <PageHeader title="Pautas" description="Acompanhe cada assunto do primeiro sinal à publicação." />
    <div className="mb-5 flex gap-2 overflow-x-auto pb-2"><button onClick={() => setFilter('Todas')} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs ${filter === 'Todas' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'}`}>Todas</button>{statuses.map(s => <button key={s} onClick={() => setFilter(s)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs ${filter === s ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'}`}>{s}</button>)}</div>
    {visible.length ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map(s => <StoryCard key={s.id} story={s} actions={<select value={s.status} onChange={e => change(s.id, e.target.value)} className="max-w-[150px] rounded-lg border border-white/10 bg-[#070d18] px-2 py-1.5 text-[11px] text-slate-300">{statuses.map(x => <option key={x}>{x}</option>)}</select>} />)}</section> : <EmptyState title="Nenhuma pauta cadastrada. Execute uma atualização do Radar 360 para descobrir assuntos." action={<button onClick={() => navigate('/radar')} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"><RadarIcon className="h-4 w-4" />Abrir Radar 360</button>} />}
  </>;
}