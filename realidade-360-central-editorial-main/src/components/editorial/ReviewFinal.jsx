import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { X, Edit3, RefreshCw, ImagePlus, Check, ArrowLeft, ShieldCheck, AlertTriangle, Clock, Copy, Check as CheckIcon, Loader2 } from 'lucide-react';
import Checagem360 from '@/components/editor/Checagem360';
import ConfidenceMeter from '@/components/editor/ConfidenceMeter';

export default function ReviewFinal({ storyId, versionId, artworkId, partial, onClose }) {
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [version, setVersion] = useState(null);
  const [sources, setSources] = useState([]);
  const [artwork, setArtwork] = useState(null);
  const [headline, setHeadline] = useState('');
  const [editingHead, setEditingHead] = useState(false);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState('');

  const load = async () => {
    const s = await base44.entities.Story.get(storyId).catch(() => null);
    setStory(s);
    const v = versionId ? await base44.entities.ContentVersion.get(versionId).catch(() => null) : null;
    setVersion(v);
    setHeadline(v?.art_headline || s?.title || '');
    const srcs = await base44.entities.StorySource.filter({ story_id: storyId }, '-published_at', 100);
    setSources(srcs);
    if (artworkId) { const a = await base44.entities.Artwork.get(artworkId).catch(() => null); setArtwork(a); }
  };
  useEffect(() => { load(); }, [storyId, versionId, artworkId]);

  const copy = async (key, text) => { await navigator.clipboard.writeText(text || ''); setCopied(key); setTimeout(() => setCopied(''), 1500); };

  const saveHeadline = async () => {
    setBusy('head');
    try {
      await base44.entities.ContentVersion.update(version.id, { art_headline: headline });
      if (artwork) await base44.entities.Artwork.update(artwork.id, { headline });
      setVersion(v => ({ ...v, art_headline: headline }));
      setEditingHead(false); setNotice('Headline atualizada.');
    } catch { setNotice('Não foi possível salvar a headline.'); }
    setBusy('');
  };
  const updateApur = async () => {
    setBusy('apur'); setNotice('Atualizando apuração...');
    try {
      const r = await base44.functions.invoke('updateApuracao', { story_id: storyId });
      const d = r.data;
      if (d.error) setNotice('Não foi possível atualizar a apuração agora.');
      else { await load(); setNotice(d.added > 0 ? `${d.added} nova(s) fonte(s) encontrada(s).` : 'Apuração atualizada.'); }
    } catch { setNotice('Não foi possível atualizar a apuração agora.'); }
    setBusy('');
  };
  const approve = async () => {
    if (!confirm('Aprovar conteúdo e marcar a pauta como Pronta? Você ainda poderá publicar depois.')) return;
    setBusy('approve');
    try {
      await base44.entities.ContentVersion.update(version.id, { is_final: true });
      await base44.entities.Story.update(storyId, { status: 'Pronta' });
      await load(); setNotice('Conteúdo aprovado. Status: Pronta.');
    } catch { setNotice('Não foi possível aprovar agora. O conteúdo está preservado.'); }
    setBusy('');
  };

  if (!story || !version) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"><Loader2 className="h-6 w-6 animate-spin text-blue-400" /></div>;

  const alerts = [];
  if (version.has_divergence) alerts.push({ icon: AlertTriangle, tone: 'amber', text: version.divergence_note || 'Fontes apresentam versões diferentes.' });
  if (version.is_developing || story.trend === 'Última hora' || story.trend === 'Acelerando') alerts.push({ icon: Clock, tone: 'amber', text: 'Notícia em desenvolvimento — recheque antes de publicar.' });
  if (partial) alerts.push({ icon: AlertTriangle, tone: 'amber', text: 'Pacote parcial: alguma etapa não foi concluída. Revise antes de aprovar.' });

  const openStudio = () => artwork ? navigate(`/estudio?art=${artwork.id}`) : navigate(`/estudio?story=${story.id}&headline=${encodeURIComponent(headline)}&cv=${version.id}`);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 sm:p-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#0b1424] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl border-b border-white/7 bg-[#0b1424] px-5 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><ShieldCheck className="h-5 w-5 text-blue-400" />Revisão Final 360</h2>
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{story.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-white/7 bg-[#070d18] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Headline da arte</span>
                <button onClick={() => setEditingHead(e => !e)} className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"><Edit3 className="h-3 w-3" />{editingHead ? 'Cancelar' : 'Trocar'}</button>
              </div>
              {editingHead ? (
                <div className="space-y-2">
                  <textarea rows={2} value={headline} onChange={e => setHeadline(e.target.value)} className="w-full resize-none rounded-lg border border-white/10 bg-[#0b1424] px-3 py-2 text-sm text-slate-200" />
                  <button onClick={saveHeadline} disabled={busy === 'head'} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{busy === 'head' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}Salvar headline</button>
                </div>
              ) : <p className="text-sm font-semibold text-white">{headline || '—'}</p>}
            </div>

            <Block label="Texto Facebook" onCopy={() => copy('fb', version.facebook_text)} copied={copied === 'fb'}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{version.facebook_text || '—'}</p>
            </Block>
            <Block label="Texto Instagram" onCopy={() => copy('ig', version.instagram_text)} copied={copied === 'ig'}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{version.instagram_text || '—'}</p>
            </Block>
            {version.factual_summary && <Block label="Resumo factual"><p className="text-sm leading-relaxed text-slate-300">{version.factual_summary}</p></Block>}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/7 bg-[#070d18] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Arte 1080×1350</span>
                {artwork && <span className="text-[10px] text-slate-500">v{artwork.version || 1} · {artwork.status}</span>}
              </div>
              {(artwork?.composed_url || artwork?.image_url)
                ? <Image src={artwork.composed_url || artwork.image_url} alt={artwork.headline} className="aspect-[4/5] w-full rounded-lg" fittingType="fill" />
                : <div className="flex aspect-[4/5] items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-slate-500">Arte não gerada</div>}
              {artwork?.is_illustrative && <p className="mt-2 text-[10px] text-blue-300">Imagem ilustrativa (não documental)</p>}
              <button onClick={openStudio} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"><ImagePlus className="h-3.5 w-3.5" />{artwork ? 'Abrir no Estúdio' : 'Gerar arte no Estúdio'}</button>
            </div>

            <div className="rounded-xl border border-white/7 bg-[#070d18] p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Fontes ({sources.length})</span>
              <ul className="mt-2 space-y-1.5">{sources.map((s, i) => <li key={i} className="text-xs text-slate-300"><a href={s.source_url} target="_blank" rel="noreferrer" className="hover:text-blue-300">{s.is_primary && <span className="text-[#d4af55]">● </span>}{s.source_name || 'Veículo'} — {s.source_title || s.source_url}</a></li>)}</ul>
            </div>

            <div><h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-400">Checagem 360</h3><Checagem360 items={version.checagem || []} /></div>
            <ConfidenceMeter score={version.confidence_score || 0} band={version.confidence_band} />

            {alerts.length > 0 && <div className="space-y-2">{alerts.map((a, i) => <div key={i} className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${a.tone === 'amber' ? 'border-amber-500/20 bg-amber-500/5 text-amber-200' : 'border-blue-500/20 bg-blue-500/5 text-blue-200'}`}><a.icon className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{a.text}</span></div>)}</div>}

            <div className="rounded-xl border border-white/7 bg-[#070d18] p-3 text-[11px] text-slate-500">
              Última atualização da pauta: {story.last_updated_at ? new Date(story.last_updated_at).toLocaleString('pt-BR') : '—'} · Status: {story.status}
            </div>
          </div>
        </div>

        {notice && <div className="mx-5 mb-3 rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-sm text-slate-300">{notice}</div>}

        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 rounded-b-2xl border-t border-white/7 bg-[#0b1424] px-5 py-4">
          <button onClick={() => navigate(`/editor?story=${story.id}`)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"><ArrowLeft className="h-3.5 w-3.5" />Voltar ao Editor</button>
          <button onClick={updateApur} disabled={busy === 'apur'} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50">{busy === 'apur' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Atualizar apuração</button>
          <button onClick={openStudio} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"><ImagePlus className="h-3.5 w-3.5" />Regenerar arte</button>
          <button onClick={() => navigate(`/editor?story=${story.id}`)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"><Edit3 className="h-3.5 w-3.5" />Editar texto</button>
          <button onClick={approve} disabled={busy === 'approve' || version.is_final} className="ml-auto flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {busy === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {version.is_final ? 'Aprovado' : 'Aprovar conteúdo'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Block({ label, children, onCopy, copied }) {
  return <div className="rounded-xl border border-white/7 bg-[#070d18] p-4">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{label}</span>
      {onCopy && <button onClick={onCopy} className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">{copied ? <><CheckIcon className="h-3 w-3" />Copiado</> : <><Copy className="h-3 w-3" />Copiar</>}</button>}
    </div>
    {children}
  </div>;
}