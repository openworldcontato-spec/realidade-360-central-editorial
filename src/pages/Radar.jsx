import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/editorial/PageHeader';
import StoryCard from '@/components/editorial/StoryCard';
import EmptyState from '@/components/editorial/EmptyState';
import PautaDetail from '@/components/editorial/PautaDetail';
import FullPackageModal from '@/components/editorial/FullPackageModal';
import ReviewFinal from '@/components/editorial/ReviewFinal';
import { Radar as RadarIcon, Loader2, Search, Link2, Eye, Ban, FileText, Activity, Sparkles } from 'lucide-react';
const primary = ['Todos', 'Última hora', 'Em alta', 'Acelerando', 'Monitorar'];
const categories = ['Todas', 'Brasil', 'Política', 'Economia', 'Justiça', 'Segurança', 'Mundo', 'Tecnologia', 'Sociedade', 'Viral'];
export default function Radar() {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [filter, setFilter] = useState('Todos');
  const [category, setCategory] = useState('Todas');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [lastRun, setLastRun] = useState(null);
  const [query, setQuery] = useState('');
  const [link, setLink] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [detail, setDetail] = useState(null);
  const [pkgStory, setPkgStory] = useState(null);
  const [review, setReview] = useState(null);
  const load = () => base44.entities.Story.filter({ ignored: false }, '-opportunity_score', 60).then(setStories);
  const loadRun = () => base44.entities.RadarRun.filter({ status: 'concluida' }, '-run_at', 1).then(r => setLastRun(r[0] || null));
  useEffect(() => { load(); loadRun(); }, []);
  const run = async (fn, payload, label) => {
    setLoading(true); setNotice(label);
    try {
      const res = await base44.functions.invoke(fn, payload);
      const d = res.data;
      if (d.error) setNotice(`Erro: ${d.error}`);
      else setNotice(d.pautas > 0 ? `${d.pautas} pauta(s) encontrada(s) a partir de ${d.articles} fonte(s).` : (d.detail || 'Nenhuma pauta encontrada.'));
      await load(); await loadRun();
    } catch (e) { setNotice(`Erro: ${e.message}`); }
    setLoading(false);
  };
  const visible = stories.filter(s => (filter === 'Todos' || (filter === 'Última hora' && s.trend === 'Última hora') || s.trend === filter) && (category === 'Todas' || s.category === category));
  const act = (id, fn, after) => { base44.entities.Story.update(id, fn).then(() => { setStories(v => after ? v.filter(x => x.id !== id) : v.map(x => x.id === id ? { ...x, ...fn } : x)); }); };
  const createContent = (s) => { base44.entities.Story.update(s.id, { status: 'Em produção' }).then(() => navigate(`/editor?story=${s.id}`)); };
  const lastText = lastRun ? `Última atualização: ${new Date(lastRun.run_at).toLocaleString('pt-BR')}` : 'Última atualização: —';
  return <>
    <PageHeader title="Radar 360" description="Descoberta e análise de pautas jornalísticas em tempo real." action={<button onClick={() => run('runRadar', {}, 'Analisando fontes e identificando pautas...')} disabled={loading} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><RadarIcon className="h-4 w-4" />Atualizar Radar</button>} />
    <div className="mb-5 flex flex-wrap items-center gap-3 text-xs">
      <span className="flex items-center gap-1.5 text-slate-400"><Activity className="h-3.5 w-3.5 text-emerald-400" /><span className="font-semibold text-emerald-400">Radar ativo</span></span>
      <span className="text-slate-600">·</span>
      <span className="text-slate-500">{lastText}</span>
    </div>
    {loading && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-200"><Loader2 className="h-4 w-4 animate-spin" />{notice}</div>}
    {!loading && notice && <div className="mb-5 rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm text-slate-300">{notice}</div>}
    <div className="mb-5 grid gap-3 rounded-2xl border border-white/7 bg-[#0b1424] p-4 lg:grid-cols-[1fr_auto]">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-500" />
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && query.trim() && run('searchTopic', { query: query.trim() }, 'Pesquisando assunto...')} placeholder="Pesquisar assunto ou acontecimento (ex.: Eleições 2026, Nova decisão do STF)" className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => query.trim() && run('searchTopic', { query: query.trim() }, 'Pesquisando assunto...')} disabled={loading} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 lg:flex-none">Pesquisar</button>
        <button onClick={() => setShowLink(!showLink)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300"><Link2 className="h-4 w-4" />Colar link</button>
      </div>
    </div>
    {showLink && <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/7 bg-[#0b1424] p-4">
      <input value={link} onChange={e => setLink(e.target.value)} placeholder="Cole o URL de uma matéria encontrada manualmente" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#070d18] px-3 py-2.5 text-sm text-slate-200" />
      <button onClick={() => link.trim() && run('analyzeLink', { link: link.trim() }, 'Analisando link e procurando fontes...')} disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Analisar link</button>
    </div>}
    <div className="mb-4 flex gap-2 overflow-x-auto pb-2">{primary.map(f => <button onClick={() => setFilter(f)} key={f} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${filter === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{f}</button>)}</div>
    <select value={category} onChange={e => setCategory(e.target.value)} className="mb-5 rounded-xl border border-white/10 bg-[#0b1424] px-3 py-2 text-sm text-slate-300">{categories.map(c => <option key={c}>{c}</option>)}</select>
    {visible.length ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map(s => <StoryCard key={s.id} story={s} actions={<>
      <button onClick={() => setDetail(s)} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"><Eye className="h-3.5 w-3.5" />Abrir pauta</button>
      <button onClick={() => setPkgStory(s)} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"><Sparkles className="h-3.5 w-3.5" />Gerar pacote completo</button>
      <button onClick={() => createContent(s)} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"><FileText className="h-3.5 w-3.5" />Criar conteúdo</button>
      <button onClick={() => act(s.id, { monitoring: true, status: 'Monitorando' })} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"><Activity className="h-3.5 w-3.5" />Monitorar</button>
      <button onClick={() => act(s.id, { ignored: true }, true)} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-white/10"><Ban className="h-3.5 w-3.5" />Ignorar</button>
    </>} />)}</section> : <EmptyState title={loading ? 'Analisando fontes e identificando pautas...' : 'Nenhuma pauta encontrada. Execute uma atualização do Radar 360.'} action={!loading && <button onClick={() => run('runRadar', {}, 'Analisando fontes e identificando pautas...')} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"><RadarIcon className="h-4 w-4" />Atualizar Radar 360</button>} />}
    <PautaDetail story={detail} onClose={() => setDetail(null)} />
    {pkgStory && <FullPackageModal story={pkgStory} onClose={() => setPkgStory(null)} onComplete={(r) => { setPkgStory(null); setReview({ storyId: r.story.id, versionId: r.version?.id, artworkId: r.artwork?.id, partial: !!r.partial }); }} />}
    {review && <ReviewFinal storyId={review.storyId} versionId={review.versionId} artworkId={review.artworkId} partial={review.partial} onClose={() => { setReview(null); load(); }} />}
  </>;
}