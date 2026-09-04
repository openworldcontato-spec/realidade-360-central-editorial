import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/editorial/PageHeader';
import StatCard from '@/components/editorial/StatCard';
import StoryCard from '@/components/editorial/StoryCard';
export default function Dashboard(){
 const [stories,setStories]=useState([]); useEffect(()=>{base44.entities.Story.list('-opportunity_score',6).then(setStories)},[]);
 const stats=[['Em alta agora',stories.filter(x=>x.trend==='Em alta').length||3,'última hora','bg-blue-400'],['Em aceleração',stories.filter(x=>x.trend==='Acelerando').length||2,'ganhando força','bg-cyan-400'],['Pautas para revisar',stories.filter(x=>x.status==='Revisão').length||1,'na fila','bg-amber-400'],['Produzidos hoje',4,'conteúdos','bg-violet-400'],['Publicados',2,'hoje','bg-emerald-400']];
 return <><PageHeader title="Visão geral" description="O pulso editorial do Realidade 360, em tempo real."/><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{stats.map(s=><StatCard key={s[0]} label={s[0]} value={s[1]} note={s[2]} accent={s[3]}/>)}</section><div className="mb-4 mt-9 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Radar agora</h2><span className="text-xs text-slate-500">Dados demonstrativos</span></div><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{stories.map(s=><StoryCard key={s.id} story={s}/>)}</section></>
}