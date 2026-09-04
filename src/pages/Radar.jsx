import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/editorial/PageHeader';
import StoryCard from '@/components/editorial/StoryCard';
const primary=['Todos','Última hora','Em alta','Acelerando','Monitorar'];
const categories=['Brasil','Política','Economia','Justiça','Segurança','Mundo','Tecnologia','Sociedade','Viral'];
export default function Radar(){
 const [stories,setStories]=useState([]),[filter,setFilter]=useState('Todos'),[category,setCategory]=useState('Todas'); useEffect(()=>{base44.entities.Story.list('-opportunity_score',50).then(setStories)},[]);
 const visible=stories.filter(s=>(filter==='Todos'||(filter==='Última hora'&&Date.now()-new Date(s.detected_at)<3600000)||s.trend===filter)&&(category==='Todas'||s.category===category));
 return <><PageHeader title="Radar 360" description="Ambiente preparado para descoberta, triagem e acompanhamento de assuntos."/><div className="mb-4 flex gap-2 overflow-x-auto pb-2">{primary.map(f=><button onClick={()=>setFilter(f)} key={f} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${filter===f?'bg-blue-600 text-white':'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{f}</button>)}</div><select value={category} onChange={e=>setCategory(e.target.value)} className="mb-5 rounded-xl border border-white/10 bg-[#0b1424] px-3 py-2 text-sm text-slate-300"><option>Todas</option>{categories.map(c=><option key={c}>{c}</option>)}</select><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map(s=><StoryCard key={s.id} story={s}/>)}</section></>
}