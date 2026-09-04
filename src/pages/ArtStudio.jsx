import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Sparkles, Save, Download, Copy, Trash2, Loader2, ArrowLeft, Layers } from 'lucide-react';
import PageHeader from '@/components/editorial/PageHeader';
import ArtCanvas, { FORMATS } from '@/components/art/ArtCanvas';
import ArtControls from '@/components/art/ArtControls';

export default function ArtStudio() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInput = useRef(null);
  const [story, setStory] = useState(null);
  const [storyId, setStoryId] = useState('');
  const [cvId, setCvId] = useState('');
  const [cfg, setCfg] = useState({ template: 'destaque', format: 'feed', headline: '', editoria: 'Brasil', highlights: [], fontSize: 1, alignment: 'left', show_signature: true, image_pos_x: 50, image_pos_y: 50, image_url: '' });
  const [image, setImage] = useState({ url: '', origin: 'none', sourceName: '', sourceUrl: '', isIllustrative: false, rightsWarning: false });
  const [imgEl, setImgEl] = useState(null);
  const [currentArt, setCurrentArt] = useState(null);
  const [versions, setVersions] = useState([]);
  const [status, setStatus] = useState('Rascunho');
  const [busy, setBusy] = useState({ img: false, save: false });
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState('feed');

  useEffect(() => {
    const sid = params.get('story'); const hl = params.get('headline'); const cv = params.get('cv'); const art = params.get('art');
    if (art) loadArt(art); else if (sid) { setStoryId(sid); setCvId(cv || ''); base44.entities.Story.get(sid).then(s => { setStory(s); setCfg(c => ({ ...c, headline: hl || s?.title || '', editoria: s?.category || 'Brasil' })); }); }
  }, []);

  useEffect(() => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => setImgEl(im); im.onerror = () => setImgEl(null); if (image.url) im.src = image.url; else setImgEl(null); }, [image.url]);
  useEffect(() => { setCfg(c => ({ ...c, image_url: image.url })); }, [image.url]);

  const loadArt = async (id) => {
    const a = await base44.entities.Artwork.get(id);
    if (!a) return;
    setCurrentArt(a); setStatus(a.status || 'Rascunho'); setStoryId(a.story_id); setCvId(a.content_version_id || '');
    setCfg({ template: a.template || 'destaque', format: a.format || 'feed', headline: a.headline || a.title || '', editoria: a.editoria || a.category || 'Brasil', highlights: a.highlight_words || [], fontSize: a.font_size || 1, alignment: a.alignment || 'left', show_signature: a.show_signature !== false, image_pos_x: a.image_pos_x ?? 50, image_pos_y: a.image_pos_y ?? 50, image_url: a.image_url || '' });
    setImage({ url: a.image_url || '', origin: a.image_origin || 'none', sourceName: a.image_source_name || '', sourceUrl: a.image_source_url || '', isIllustrative: !!a.is_illustrative, rightsWarning: !!a.rights_warning });
    if (a.story_id) base44.entities.Story.get(a.story_id).then(setStory);
    const vers = await base44.entities.Artwork.filter({ parent_id: a.parent_id || a.id }, '-version', 50);
    setVersions(vers);
  };

  const onImageAction = async (mode) => {
    if (mode === 'none') { setImage({ url: '', origin: 'none', sourceName: '', sourceUrl: '', isIllustrative: false, rightsWarning: false }); return; }
    if (mode === 'ai') {
      if (!cfg.headline) { setNotice('Defina a headline antes de gerar a imagem.'); return; }
      setBusy(b => ({ ...b, img: true })); setNotice('Gerando imagem ilustrativa por IA...');
      try {
        const res = await base44.functions.invoke('generateArtImage', { editoria: cfg.editoria, headline: cfg.headline, context: story?.what_happened || story?.summary || '' });
        const d = res.data;
        if (d.error) setNotice(`Erro: ${d.error}`); else { setImage({ url: d.url, origin: 'ai', sourceName: 'Imagem ilustrativa gerada por IA', sourceUrl: d.url, isIllustrative: true, rightsWarning: false }); setNotice('Imagem ilustrativa gerada.'); }
      } catch (e) { setNotice(`Erro: ${e.message}`); } setBusy(b => ({ ...b, img: false })); return;
    }
    if (mode === 'pauta') { setNotice('Nenhuma imagem encontrada na pauta (a apuração atual não extrai imagens das matérias). Use enviar imagem ou gerar por IA.'); return; }
    if (mode === 'upload' || mode === 'official') { setNotice(''); fileInput.current.dataset.mode = mode; fileInput.current.click(); return; }
  };
  const onFile = async (e) => {
    const f = e.target.files[0]; if (!f) return; const mode = fileInput.current.dataset.mode;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      setImage({ url: file_url, origin: mode, sourceName: mode === 'official' ? 'Imagem oficial/institucional' : 'Imagem enviada manualmente', sourceUrl: file_url, isIllustrative: false, rightsWarning: true });
      setNotice('Imagem enviada.');
    } catch (err) { setNotice(`Erro no upload: ${err.message}`); }
    e.target.value = '';
  };

  const headlineTooLong = useMemo(() => { const w = (cfg.headline || '').split(/\s+/).filter(Boolean).length; return w > 16; }, [cfg.headline]);

  const buildPayload = (composed_url) => ({
    story_id: storyId, content_version_id: cvId, title: cfg.headline, category: cfg.editoria, headline: cfg.headline, editoria: cfg.editoria,
    template: cfg.template, format: cfg.format, image_url: image.url || '', image_origin: image.origin, image_source_url: image.sourceUrl,
    image_source_name: image.sourceName, is_illustrative: image.isIllustrative, rights_warning: image.rightsWarning, composed_url,
    show_signature: cfg.show_signature, highlight_words: cfg.highlights, font_size: cfg.fontSize, alignment: cfg.alignment,
    image_pos_x: cfg.image_pos_x, image_pos_y: cfg.image_pos_y, status
  });

  const saveArt = async (asNewVersion) => {
    if (!storyId) { setNotice('Selecione uma pauta.'); return; }
    if (!cfg.headline) { setNotice('Defina a headline.'); return; }
    setBusy(b => ({ ...b, save: true })); setNotice('Renderizando e salvando arte...');
    try {
      const blob = await canvasRef.current.toBlob('image/png');
      const file = new File([blob], 'arte.png', { type: 'image/png' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const payload = buildPayload(file_url);
      let saved;
      if (!currentArt) { saved = await base44.entities.Artwork.create({ ...payload, parent_id: '', version: 1 }); await base44.entities.Artwork.update(saved.id, { parent_id: saved.id }); saved = { ...saved, parent_id: saved.id }; }
      else if (asNewVersion) { saved = await base44.entities.Artwork.create({ ...payload, parent_id: currentArt.parent_id, version: (currentArt.version || 1) + 1 }); }
      else { await base44.entities.Artwork.update(currentArt.id, payload); saved = { ...currentArt, ...payload }; }
      setCurrentArt(saved);
      const vers = await base44.entities.Artwork.filter({ parent_id: saved.parent_id }, '-version', 50); setVersions(vers);
      setNotice(`Arte v${saved.version} salva.`);
    } catch (e) { setNotice(`Erro ao salvar: ${e.message}`); } setBusy(b => ({ ...b, save: false }));
  };

  const download = async (type) => {
    try {
      const blob = await canvasRef.current.toBlob(type, 0.95);
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
      const ext = type === 'image/jpeg' ? 'jpg' : 'png'; const date = new Date().toISOString().slice(0, 10);
      const slug = (cfg.headline || 'arte').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'arte';
      a.download = `realidade360-${date}-${(cfg.editoria || 'pauta').toLowerCase()}-${slug}-v${currentArt?.version || 1}.${ext}`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { setNotice(`Erro no download: ${e.message}`); }
  };

  const duplicate = async () => {
    if (!currentArt) return;
    const blob = await canvasRef.current.toBlob('image/png'); const file = new File([blob], 'arte.png', { type: 'image/png' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const d = await base44.entities.Artwork.create({ ...buildPayload(file_url), parent_id: '', version: 1, status: 'Rascunho' });
    await base44.entities.Artwork.update(d.id, { parent_id: d.id }); setNotice('Arte duplicada.'); loadArt(d.id);
  };
  const remove = async () => { if (!currentArt || !confirm('Excluir esta arte?')) return; await base44.entities.Artwork.delete(currentArt.id); setNotice('Arte excluída.'); navigate('/artes'); };
  const restore = (v) => { loadArt(v.id); setNotice(`Versão v${v.version} restaurada.`); };
  const changeStatus = async (s) => { setStatus(s); if (currentArt) { await base44.entities.Artwork.update(currentArt.id, { status: s }); setCurrentArt(a => ({ ...a, status: s })); setNotice(`Status: ${s}.`); } };

  const Btn = ({ onClick, disabled, icon: Icon, children, primary }) => <button onClick={onClick} disabled={disabled} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${primary ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}><Icon className="h-4 w-4" />{children}</button>;
  const { w, h } = FORMATS[preview] || FORMATS.feed;

  return <>
    <PageHeader title="Estúdio de Artes 360" description="Gere, edite e salve artes jornalísticas para Facebook e Instagram." />
    <div className="mb-5"><button onClick={() => navigate('/editor')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Voltar ao Editor IA</button></div>
    <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFile} />
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Prévia:</span>
          {Object.entries(FORMATS).map(([id, f]) => <button key={id} onClick={() => setPreview(id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${preview === id ? 'bg-blue-600 text-white' : 'border border-white/10 bg-white/5 text-slate-300'}`}>{f.label}</button>)}
        </div>
        <div className="mx-auto" style={{ maxWidth: 460 }}>
          <ArtCanvas ref={canvasRef} cfg={{ ...cfg, format: preview }} img={imgEl} />
        </div>
        {headlineTooLong && <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">Headline muito longa para este template — idealmente 6 a 16 palavras.</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Btn onClick={() => saveArt(true)} disabled={busy.save} icon={busy.save ? Loader2 : Sparkles} primary>{busy.save ? 'Salvando...' : currentArt ? 'Gerar nova versão' : 'Gerar arte'}</Btn>
          <Btn onClick={() => saveArt(false)} disabled={busy.save || !currentArt} icon={Save}>Salvar arte</Btn>
          <Btn onClick={() => download('image/png')} icon={Download}>Salvar imagem (PNG)</Btn>
          <Btn onClick={() => download('image/jpeg')} icon={Download}>JPG</Btn>
          <Btn onClick={duplicate} disabled={!currentArt} icon={Copy}>Duplicar</Btn>
          <Btn onClick={remove} disabled={!currentArt} icon={Trash2}>Excluir</Btn>
        </div>
        {notice && <div className="mt-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm text-slate-300">{notice}</div>}
        {versions.length > 1 && <div className="mt-5"><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><Layers className="h-4 w-4 text-blue-400" />Versões</h3><div className="flex flex-wrap gap-2">{versions.map(v => <button key={v.id} onClick={() => restore(v)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${currentArt?.id === v.id ? 'border-blue-500 bg-blue-600/20 text-blue-200' : 'border-white/10 bg-white/5 text-slate-300'}`}>v{v.version}</button>)}</div></div>}
      </div>
      <div className="rounded-2xl border border-white/7 bg-[#0b1424] p-4">
        <ArtControls cfg={cfg} setCfg={setCfg} image={image} onImageAction={onImageAction} busy={busy.img} />
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs font-semibold text-slate-400">Status</p>
          <div className="grid grid-cols-2 gap-1.5">{['Rascunho', 'Em edição', 'Aprovada', 'Publicada'].map(s => <button key={s} onClick={() => changeStatus(s)} className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold ${status === s ? 'bg-blue-600 text-white' : 'border border-white/10 bg-white/5 text-slate-300'}`}>{s}</button>)}</div>
        </div>
      </div>
    </div>
  </>;
}