import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/editorial/PageHeader';
import StatCard from '@/components/editorial/StatCard';
import StoryCard from '@/components/editorial/StoryCard';
import EmptyState from '@/components/editorial/EmptyState';
import { Radar as RadarIcon } from 'lucide-react';
export default function Dashboard() {
  const [stories, setStories] = useState([]);
  const navigate = useNavigate();
  useEffect(() => { base44.entities.Story.filter({ ignored: false }, '-opportunity_score', 6).then(setStories); }, []);
  const stats = [
    ['Em alta agora', stories.filter(x => x.trend === 'Em alta' || x.trend === 'Última hora').length, 'última hora', 'bg-blue-400'],
    ['Em aceleração', stories.filter(x => x.trend === 'Acelerando').length, 'ganhando força', 'bg-cyan-400'],
    ['Pautas para revisar', stories.filter(x => x.status === 'Revisão').length, 'na fila', 'bg-amber-400'],
    ['Em produção', stories.filter(x => x.status === 'Em produção').length, 'editor IA', 'bg-violet-400'],
    ['Publicadas', stories.filter(x => x.status === 'Publicada').length, 'total', 'bg-emerald-400']
  ];
  return <>
    <PageHeader title="Visão geral" description="O pulso editorial do Realidade 360, em tempo real." />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{stats.map(s => <StatCard key={s[0]} label={s[0]} value={s[1]} note={s[2]} accent={s[3]} />)}</section>
    <div className="mb-4 mt-9 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Radar agora</h2><button onClick={() => navigate('/radar')} className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300"><RadarIcon className="h-4 w-4" />Abrir Radar 360</button></div>
    {stories.length ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{stories.map(s => <StoryCard key={s.id} story={s} />)}</section> : <EmptyState action={<button onClick={() => navigate('/radar')} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"><RadarIcon className="h-4 w-4" />Atualizar Radar 360</button>} />}
  </>;
}