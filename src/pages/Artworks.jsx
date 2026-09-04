import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Plus, Filter } from 'lucide-react';
import PageHeader from '@/components/editorial/PageHeader';

const editorias = ['Todas', 'Brasil', 'Política', 'Economia', 'Justiça', 'Segurança', 'Mundo', 'Tecnologia', 'Sociedade', 'Viral'];
const statuses = ['Todos', 'Rascunho', 'Em edição', 'Aprovada', 'Publicada'];
const dateFilters = [{ id: 'all', label: 'Tudo' }, { id: 'today', label: 'Hoje' }, { id: '7d', label: 'Últimos 7 dias' }];

export default function Artworks() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [date, setDate] = useState('all');
  const [cat, setCat] = useState('Todas');
  const [st, setSt] = useState('Todos');
  const [storyFilter, setStoryFilter] = useState('');
  const [stories, setStories] = useState([]);

  useEffect(() => {
    base44.entities.Artwork.list('-created_date', 100).then(setItems);
    base44.entities.Story.list('-updated_date', 50).then(setStories);
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach(a => { const key = a.parent_id || a.id; if (!map.has(key) || (a.version || 1) > (map.get(key).version || 1)) map.set(key, a); });
    return Array.from(map.values());
  }, [items]);

  const now = new Date();
  const visible = groups.filter(a => {
    if (cat !== 'Todas' && (a.editoria || a.category) !== cat) return false;
    if (st !== 'Todos' && (a.status || 'Rascunho') !== st) return false;
    if (storyFilter && a.story_id !== storyFilter) return false;
    if (date !== 'all') { const d = new Date(a.created_date); const diff = (now - d) / 86400000; if (date === 'today' && diff > 1) return false; if (date === '7d' && diff > 7) return false; }
    return true;
  });

  return <>
    <PageHeader title="Artes" description="Biblioteca visual organizada por pauta, data, editoria e status." />
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <button onClick={() => navigate('/estudio')} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"><Plus className="h-4 w-4" />Nova arte</button>
      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0b1424] p-1">{dateFilters.map(f => <button key={f.id} onClick={() => setDate(f.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${date === f.id ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>{f.label}</button>)}</div>
      <select value={cat} onChange={e => setCat(e.target.value)} className="rounded-xl border border-white/10 bg-[#0b1424] px-3 py-2 text-sm">{editorias.map(c => <option key={c}>{c}</option>)}</select>
      <select value={st} onChange={e => setSt(e.target.value)} className="rounded-xl border border-white/10 bg-[#0b1424] px-3 py-2 text-sm">{statuses.map(s => <option key={s}>{s}</option>)}</select>
      <select value={storyFilter} onChange={e => setStoryFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#0b1424] px-3 py-2 text-sm"><option value="">Todas as pautas</option>{stories.map(s => <option value={s.id} key={s.id}>{s.title}</option>)}</select>
    </div>
    {visible.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-slate-500"><Filter className="mx-auto mb-3 h-8 w-8 opacity-40" />Nenhuma arte encontrada.</div> :
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map(a => <article key={a.id} onClick={() => navigate(`/estudio?art=${a.id}`)} className="cursor-pointer overflow-hidden rounded-2xl border border-white/7 bg-[#0b1424] transition hover:border-blue-500/40">
        <Image src={a.composed_url || a.image_url} alt={a.headline} className="aspect-[4/5] w-full" fittingType="fill" />
        <div className="p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{a.editoria || a.category}</span><span className="text-[10px] text-slate-500">v{a.version || 1}</span></div>
          <h3 className="mt-2 line-clamp-2 font-semibold text-white">{a.headline || a.title}</h3>
          <p className="mt-2 text-xs text-slate-500">{a.status || 'Rascunho'} · {a.template} · {new Date(a.created_date).toLocaleDateString('pt-BR')}</p>
          {a.is_illustrative && <p className="mt-1 text-[10px] text-blue-300">Imagem ilustrativa</p>}
          {a.rights_warning && <p className="mt-1 text-[10px] text-amber-300">⚠ Verificar direitos de uso</p>}
        </div>
      </article>)}</div>}
  </>;
}