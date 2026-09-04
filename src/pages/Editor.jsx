import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Sparkles, RefreshCw, ImagePlus, Check, Send, Plus, Link2, Search, Loader2, History, AlertTriangle, ChevronDown, Save, FileText } from 'lucide-react';
import PageHeader from '@/components/editorial/PageHeader';
import EditorField from '@/components/editorial/EditorField';
import PautaContext from '@/components/editor/PautaContext';
import Checagem360 from '@/components/editor/Checagem360';
import ConfidenceMeter from '@/components/editor/ConfidenceMeter';
import VersionHistory from '@/components/editor/VersionHistory';
import CopyButton from '@/components/editor/CopyButton';

const empty = { main_title: '', art_headline: '', alternative_headlines: '', factual_summary: '', facebook_text: '', instagram_text: '', short_caption: '', source_notes: '', fact_check_notes: '', art_instructions: '' };
const emptyMeta = { checagem: [], confidence_score: 0, confidence_band: '', sources_text: '', has_divergence: false, divergence_note: '', is_developing: false, last_check_at: '', current_version_id: '' };
const rewriteModes = ['Mais objetivo', 'Mais explicativo', 'Mais curto', 'Mais detalhado', 'Tom mais neutro', 'Headline mais forte', 'Simplificar linguagem'];

export default function Editor() {
  const [params] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [storyId, setStoryId] = useState('');
  const [story, setStory] = useState(null);
  const [sources, setSources] = useState([]);
  const [versions, setVersions] = useState([]);
  const [form, setForm] = useState(empty);
  const [meta, setMeta] = useState(emptyMeta);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState({ gen: false, rewrite: false, apur: false, save: false, final: false, pub: false, produce: false });
  const [showRewrite, setShowRewrite] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [produce, setProduce] = useState(null);
  const [linkInput, setLinkInput] = useState('');
  const [topicInput, setTopicInput] = useState('');

  useEffect(() => { base44.entities.Story.filter({ ignored: false }, '-updated_date', 50).then(v => { setStories(v); const p = params.get('story'); setStoryId(p && v.find(s => s.id === p) ? p : (v[0] ? v[0].id : '')); }); }, []);
  useEffect(() => { if (storyId) loadStory(storyId); else { setStory(null); setSources([]); setVersions([]); setForm(empty); setMeta(emptyMeta); } }, [storyId]);

  const loadStory = async (id) => {
    const s = await base44.entities.Story.get(id).catch(() => null);
    setStory(s);
    const srcs = await base44.entities.StorySource.filter({ story_id: id }, '-published_at', 100);
    setSources(srcs);
    const vers = await base44.entities.ContentVersion.filter({ story_id: id }, '-version_number', 50);
    setVersions(vers);
    if (vers.length) applyVersion(vers[0]); else { setForm({ ...empty, factual_summary: s?.what_happened || s?.summary || '' }); setMeta(emptyMeta); }
  };
  const applyVersion = (v) => {
    setForm({ main_title: v.main_title || '', art_headline: v.art_headline || '', alternative_headlines: (v.alternative_headlines || []).join('\n'), factual_summary: v.factual_summary || '', facebook_text: v.facebook_text || '', instagram_text: v.instagram_text || '', short_caption: v.short_caption || '', source_notes: v.source_notes || '', fact_check_notes: v.fact_check_notes || '', art_instructions: v.art_instructions || '' });
    setMeta({ checagem: v.checagem || [], confidence_score: v.confidence_score || 0, confidence_band: v.confidence_band || '', sources_text: v.sources_text || '', has_divergence: !!v.has_divergence, divergence_note: v.divergence_note || '', is_developing: !!v.is_developing, last_check_at: v.last_check_at || '', current_version_id: v.id });
  };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const reloadVersions = async () => { const vers = await base44.entities.ContentVersion.filter({ story_id: storyId }, '-version_number', 50); setVersions(vers); };
  const reloadSources = async () => { const s = await base44.entities.StorySource.filter({ story_id: storyId }, '-published_at', 100); setSources(s); };
  const reloadStory = async () => { const s = await base44.entities.Story.get(storyId); setStory(s); };

  const formToVersion = () => ({
    main_title: form.main_title, art_headline: form.art_headline, alternative_headlines: form.alternative_headlines.split('\n').filter(Boolean),
    factual_summary: form.factual_summary, facebook_text: form.facebook_text, instagram_text: form.instagram_text,
    short_caption: form.short_caption, sources_text: meta.sources_text, source_notes: form.source_notes,
    fact_check_notes: form.fact_check_notes, art_instructions: form.art_instructions, checagem: meta.checagem,
    confidence_score: meta.confidence_score, confidence_band: meta.confidence_band, has_divergence: meta.has_divergence,
    divergence_note: meta.divergence_note, is_developing: meta.is_developing, last_check_at: meta.last_check_at
  });

  const generate = async () => {
    if (!story) return; setBusy(b => ({ ...b, gen: true })); setNotice('Produzindo pacote editorial...');
    try {
      const res = await base44.functions.invoke('generateContent', { story_id: story.id });
      const d = res.data;
      if (d.error) setNotice(`Erro: ${d.error}`);
      else { await reloadVersions(); await reloadSources(); await reloadStory(); const latest = await base44.entities.ContentVersion.filter({ story_id: story.id }, '-version_number', 1); if (latest[0]) applyVersion(latest[0]); setNotice(`Pacote gerado.${d.newSources > 0 ? ` ${d.newSources} nova(s) fonte(s) encontrada(s) na apuração complementar.` : ''}`); }
    } catch (e) { setNotice(`Erro: ${e.message}`); } setBusy(b => ({ ...b, gen: false }));
  };
  const rewrite = async (mode) => {
    setShowRewrite(false); setBusy(b => ({ ...b, rewrite: true })); setNotice(`Reescrevendo: ${mode}...`);
    try {
      const res = await base44.functions.invoke('rewriteContent', { content: { ...formToVersion(), source_notes: form.source_notes, fact_check_notes: form.fact_check_notes, art_instructions: form.art_instructions }, mode, story_id: story.id });
      const d = res.data;
      if (d.error) setNotice(`Erro: ${d.error}`); else { await reloadVersions(); applyVersion(d.version); setNotice('Reescrita concluída.'); }
    } catch (e) { setNotice(`Erro: ${e.message}`); } setBusy(b => ({ ...b, rewrite: false }));
  };
  const updateApur = async () => {
    setBusy(b => ({ ...b, apur: true })); setNotice('Atualizando apuração...');
    try {
      const res = await base44.functions.invoke('updateApuracao', { story_id: story.id });
      const d = res.data;
      if (d.error) setNotice(`Erro: ${d.error}`); else { await reloadSources(); await reloadStory(); setNotice(d.added > 0 ? `${d.added} nova(s) fonte(s) encontrada(s).` : 'Nenhuma fonte nova encontrada.'); }
    } catch (e) { setNotice(`Erro: ${e.message}`); } setBusy(b => ({ ...b, apur: false }));
  };
  const saveManual = async () => {
    if (!story) return; setBusy(b => ({ ...b, save: true }));
    try {
      await base44.entities.ContentVersion.create({ ...formToVersion(), story_id: story.id, version_number: (versions.length || 0) + 1, generation_type: 'manual', is_final: false });
      await reloadVersions(); setNotice('Versão manual salva.');
    } catch (e) { setNotice(`Erro: ${e.message}`); } setBusy(b => ({ ...b, save: false }));
  };
  const finalizar = async () => {
    if (!story) return;
    if (!form.art_headline || !form.facebook_text || !form.instagram_text) { setNotice('Finalizar exige headline, texto Facebook e texto Instagram.'); return; }
    if (!meta.checagem || meta.checagem.length === 0) { setNotice('Execute a geração para rodar a Checagem 360 antes de finalizar.'); return; }
    const critical = meta.checagem.filter(c => c.status === 'Exige revisão' || c.status === 'Não confirmado');
    if (critical.length && !confirm(`Há ${critical.length} item(ns) não confirmado(s) ou exigindo revisão. Finalizar mesmo assim?`)) return;
    setBusy(b => ({ ...b, final: true }));
    try {
      await base44.entities.ContentVersion.create({ ...formToVersion(), story_id: story.id, version_number: (versions.length || 0) + 1, generation_type: 'manual', is_final: true });
      await base44.entities.Story.update(story.id, { status: 'Pronta' });
      await reloadVersions(); await reloadStory(); setNotice('Conteúdo finalizado. Status: Pronta.');
    } catch (e) { setNotice(`Erro: ${e.message}`); } setBusy(b => ({ ...b, final: false }));
  };
  const publish = async () => {
    if (!story) return;
    if (!confirm('Confirmar publicação manual? O conteúdo será registrado no histórico de Publicados.')) return;
    setBusy(b => ({ ...b, pub: true }));
    try {
      await base44.entities.Publication.create({ story_id: story.id, published_at: new Date().toISOString(), category: story.category, headline: form.art_headline || story.title, used_text: form.facebook_text, art_url: '', platforms: ['Facebook', 'Instagram'] });
      await base44.entities.Story.update(story.id, { status: 'Publicada' });
      await reloadStory(); setNotice('Marcado como publicado.');
    } catch (e) { setNotice(`Erro: ${e.message}`); } setBusy(b => ({ ...b, pub: false }));
  };
  const restore = (v) => { applyVersion(v); setShowVersions(false); setNotice(`Versão v${v.version_number} restaurada. Salve para fixar.`); };

  const produceFromLink = async () => {
    if (!linkInput.trim()) return; setBusy(b => ({ ...b, produce: true })); setNotice('Analisando link e produzindo conteúdo...');
    try {
      const r1 = await base44.functions.invoke('analyzeLink', { link: linkInput.trim() });
      const d1 = r1.data;
      if (d1.error || !d1.results || !d1.results.length) { setNotice('Não foi possível criar a pauta a partir do link.'); return; }
      const newId = d1.results[0].id; setStoryId(newId);
      await base44.functions.invoke('generateContent', { story_id: newId });
      await loadStory(newId);
      setNotice(d1.articles <= 1 ? 'Pacote gerado. Aviso: pauta baseada em fonte única — verifique a limitação.' : 'Pacote gerado.');
      setProduce(null); setLinkInput('');
    } catch (e) { setNotice(`Erro: ${e.message}`); } setBusy(b => ({ ...b, produce: false }));
  };
  const produceFromTopic = async () => {
    if (!topicInput.trim()) return; setBusy(b => ({ ...b, produce: true })); setNotice('Pesquisando e produzindo conteúdo...');
    try {
      const r1 = await base44.functions.invoke('searchTopic', { query: topicInput.trim() });
      const d1 = r1.data;
      if (d1.error || !d1.results || !d1.results.length) { setNotice('Nenhuma pauta encontrada para este assunto.'); return; }
      const newId = d1.results[0].id; setStoryId(newId);
      await base44.functions.invoke('generateContent', { story_id: newId });
      await loadStory(newId);
      setNotice('Pacote gerado.'); setProduce(null); setTopicInput('');
    } catch (e) { setNotice(`Erro: ${e.message}`); } setBusy(b => ({ ...b, produce: false }));
  };

  const sourcesText = meta.sources_text || `Fontes: ${sources.map(s => s.source_name).filter(Boolean).join(', ')}.`;
  const fullPackage = `${form.main_title}\n\nHEADLINE: ${form.art_headline}\n\nRESUMO: ${form.factual_summary}\n\nFACEBOOK:\n${form.facebook_text}\n\nINSTAGRAM:\n${form.instagram_text}\n\nLEGENDA CURTA: ${form.short_caption}\n\n${sourcesText}`;
  const Btn = ({ onClick, disabled, icon: Icon, children, primary }) => <button onClick={onClick} disabled={disabled} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${primary ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}><Icon className="h-4 w-4" />{children}</button>;
  const loading = busy.gen || busy.rewrite || busy.apur || busy.produce;

  return <>
    <PageHeader title="Editor IA" description="Agente Jornalista 360 — transforme pautas do Radar em pacote editorial completo." />
    <div className="mb-5 rounded-2xl border border-white/7 bg-[#0b1424] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-400">Produzir novo conteúdo</p>
        <div className="flex gap-2">
          <button onClick={() => setProduce(produce === 'link' ? null : 'link')} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"><Link2 className="h-3.5 w-3.5" />Novo conteúdo por link</button>
          <button onClick={() => setProduce(produce === 'topic' ? null : 'topic')} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"><Search className="h-3.5 w-3.5" />Pesquisar e produzir</button>
        </div>
      </div>
      {produce === 'link' && <div className="mt-3 flex flex-wrap items-center gap-2"><input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="Cole o URL de uma matéria" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#070d18] px-3 py-2.5 text-sm text-slate-200" /><Btn onClick={produceFromLink} disabled={busy.produce} icon={busy.produce ? Loader2 : Sparkles}>{busy.produce ? 'Produzindo...' : 'Produzir'}</Btn></div>}
      {produce === 'topic' && <div className="mt-3 flex flex-wrap items-center gap-2"><input value={topicInput} onChange={e => setTopicInput(e.target.value)} placeholder="Ex.: O que aconteceu hoje sobre o caso X?" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#070d18] px-3 py-2.5 text-sm text-slate-200" /><Btn onClick={produceFromTopic} disabled={busy.produce} icon={busy.produce ? Loader2 : Sparkles}>{busy.produce ? 'Produzindo...' : 'Produzir'}</Btn></div>}
    </div>

    <div className="mb-5 rounded-2xl border border-white/7 bg-[#0b1424] p-4"><label className="text-xs text-slate-400">Pauta em produção</label><select value={storyId} onChange={e => setStoryId(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#070d18] px-3 py-2.5 text-sm text-slate-200"><option value="">Selecione uma pauta</option>{stories.map(s => <option value={s.id} key={s.id}>{s.title}</option>)}</select></div>

    {story && <div className="mb-5"><PautaContext story={story} sources={sources} /></div>}

    {story && <div className="mb-5 flex flex-wrap gap-2 relative">
      <Btn onClick={generate} disabled={loading} icon={busy.gen ? Loader2 : Sparkles} primary>{busy.gen ? 'Produzindo...' : 'Gerar conteúdo'}</Btn>
      <div className="relative">
        <button onClick={() => setShowRewrite(!showRewrite)} disabled={loading} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${busy.rewrite ? 'animate-spin' : ''}`} />Reescrever<ChevronDown className="h-3.5 w-3.5" /></button>
        {showRewrite && <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-white/10 bg-[#0b1424] p-2 shadow-xl">{rewriteModes.map(m => <button key={m} onClick={() => rewrite(m)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/10">{m}</button>)}</div>}
      </div>
      <Btn onClick={updateApur} disabled={loading} icon={busy.apur ? Loader2 : RefreshCw}>{busy.apur ? 'Atualizando...' : 'Atualizar apuração'}</Btn>
      <Btn onClick={saveManual} disabled={busy.save} icon={Save}>{busy.save ? 'Salvando...' : 'Salvar versão'}</Btn>
      <Btn onClick={() => setShowVersions(true)} icon={History}>Ver versões</Btn>
      <Btn onClick={finalizar} disabled={busy.final} icon={Check}>{busy.final ? 'Finalizando...' : 'Finalizar'}</Btn>
      <Btn onClick={publish} disabled={busy.pub} icon={Send}>{busy.pub ? 'Publicando...' : 'Marcar como publicado'}</Btn>
    </div>}

    {loading && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-200"><Loader2 className="h-4 w-4 animate-spin" />{notice}</div>}
    {!loading && notice && <div className="mb-5 rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm text-slate-300">{notice}</div>}

    {story && (meta.is_developing || story.trend === 'Última hora' || story.trend === 'Acelerando') && <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"><div className="flex items-center gap-2 text-sm text-amber-300"><AlertTriangle className="h-4 w-4" />Notícia em desenvolvimento · Última checagem: {meta.last_check_at ? new Date(meta.last_check_at).toLocaleTimeString('pt-BR') : '—'}</div><button onClick={updateApur} className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/30">Atualizar apuração</button></div>}
    {story && meta.has_divergence && <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300"><strong>⚠ Versões divergentes:</strong> {meta.divergence_note || 'As fontes apresentam versões diferentes.'}</div>}

    {story && <div className="grid gap-5 xl:grid-cols-2">
      <EditorField label="Título principal da pauta" value={form.main_title} onChange={v => set('main_title', v)} rows={1} />
      <div className="flex items-end gap-2"><div className="flex-1"><EditorField label="Headline da arte" value={form.art_headline} onChange={v => set('art_headline', v)} rows={2} /></div></div>
      <EditorField label="3 headlines alternativas (uma por linha)" value={form.alternative_headlines} onChange={v => set('alternative_headlines', v)} rows={3} />
      <EditorField label="Resumo factual" value={form.factual_summary} onChange={v => set('factual_summary', v)} rows={4} />
      <EditorField label="Texto Facebook" value={form.facebook_text} onChange={v => set('facebook_text', v)} rows={8} />
      <EditorField label="Texto Instagram" value={form.instagram_text} onChange={v => set('instagram_text', v)} rows={8} />
      <EditorField label="Legenda curta (opcional)" value={form.short_caption} onChange={v => set('short_caption', v)} rows={3} />
      <EditorField label="Observações de checagem" value={form.fact_check_notes} onChange={v => set('fact_check_notes', v)} rows={4} />
      <EditorField label="Instruções da arte" value={form.art_instructions} onChange={v => set('art_instructions', v)} rows={4} />
    </div>}

    {story && <div className="mt-5 flex flex-wrap gap-2">
      <CopyButton text={form.art_headline} label="Copiar headline" className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200" />
      <CopyButton text={form.facebook_text} label="Copiar Facebook" className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200" />
      <CopyButton text={form.instagram_text} label="Copiar Instagram" className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200" />
      <CopyButton text={sourcesText} label="Copiar fontes" className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200" />
      <CopyButton text={fullPackage} label="Copiar pacote completo" className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200" />
      <button onClick={() => setNotice('Estrutura pronta para o futuro gerador de artes.')} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10"><ImagePlus className="h-4 w-4" />Gerar arte</button>
    </div>}

    {story && <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_280px]">
      <div><h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><FileText className="h-5 w-5 text-blue-400" />Checagem 360</h2><Checagem360 items={meta.checagem} /></div>
      <ConfidenceMeter score={meta.confidence_score} band={meta.confidence_band} />
    </div>}

    <VersionHistory versions={versions} onClose={() => setShowVersions(false)} onRestore={restore} />
  </>;
}