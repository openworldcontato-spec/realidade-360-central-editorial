import React from 'react';
import { FORMATS, TEMPLATES } from './ArtCanvas';

const editorias = ['Brasil', 'Política', 'Economia', 'Justiça', 'Segurança', 'Mundo', 'Tecnologia', 'Sociedade', 'Viral'];
const Field = ({ label, children }) => <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">{label}</span>{children}</label>;

export default function ArtControls({ cfg, setCfg, image, onImageAction, busy }) {
  const up = (k, v) => setCfg(c => ({ ...c, [k]: v }));
  return <div className="space-y-4">
    <Field label="Formato"><div className="grid grid-cols-3 gap-1.5">{Object.entries(FORMATS).map(([id, f]) => <button key={id} onClick={() => up('format', id)} className={`rounded-lg px-2 py-2 text-[11px] font-semibold ${cfg.format === id ? 'bg-blue-600 text-white' : 'border border-white/10 bg-white/5 text-slate-300'}`}>{f.label.split(' ')[0]}</button>)}</div></Field>
    <Field label="Template"><select value={cfg.template} onChange={e => up('template', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#070d18] px-3 py-2 text-sm">{TEMPLATES.map(t => <option value={t.id} key={t.id}>{t.name}</option>)}</select></Field>
    <Field label="Editoria"><select value={cfg.editoria} onChange={e => up('editoria', e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#070d18] px-3 py-2 text-sm">{editorias.map(e => <option key={e}>{e}</option>)}</select></Field>
    <Field label="Headline"><textarea rows={3} value={cfg.headline} onChange={e => up('headline', e.target.value)} className="w-full resize-none rounded-xl border border-white/10 bg-[#070d18] px-3 py-2 text-sm text-slate-200" /></Field>
    <Field label="Destacar palavras (separadas por vírgula)"><input value={(cfg.highlights || []).join(', ')} onChange={e => up('highlights', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="ex.: STF, REGRA" className="w-full rounded-xl border border-white/10 bg-[#070d18] px-3 py-2 text-sm text-slate-200" /></Field>
    <Field label={`Tamanho do texto (${Math.round((cfg.fontSize || 1) * 100)}%)`}><input type="range" min="0.7" max="1.4" step="0.05" value={cfg.fontSize || 1} onChange={e => up('fontSize', parseFloat(e.target.value))} className="w-full accent-blue-500" /></Field>
    <Field label="Alinhamento"><div className="grid grid-cols-3 gap-1.5">{['left', 'center', 'right'].map(a => <button key={a} onClick={() => up('alignment', a)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold capitalize ${cfg.alignment === a ? 'bg-blue-600 text-white' : 'border border-white/10 bg-white/5 text-slate-300'}`}>{a === 'left' ? 'Esq.' : a === 'center' ? 'Centro' : 'Dir.'}</button>)}</div></Field>
    <Field label={`Enquadramento horizontal (${cfg.image_pos_x}%)`}><input type="range" min="0" max="100" value={cfg.image_pos_x} onChange={e => up('image_pos_x', parseInt(e.target.value))} className="w-full accent-blue-500" /></Field>
    <Field label={`Enquadramento vertical (${cfg.image_pos_y}%)`}><input type="range" min="0" max="100" value={cfg.image_pos_y} onChange={e => up('image_pos_y', parseInt(e.target.value))} className="w-full accent-blue-500" /></Field>
    <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={cfg.show_signature} onChange={e => up('show_signature', e.target.checked)} className="accent-blue-500" /> Mostrar assinatura</label>
    <div className="border-t border-white/10 pt-3">
      <p className="mb-2 text-xs font-semibold text-slate-400">Imagem principal</p>
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => onImageAction('ai')} disabled={busy} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50">{busy ? 'Gerando...' : 'Gerar por IA'}</button>
        <button onClick={() => onImageAction('pauta')} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10">Da pauta</button>
        <button onClick={() => onImageAction('upload')} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10">Enviar imagem</button>
        <button onClick={() => onImageAction('official')} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10">Oficial</button>
        <button onClick={() => onImageAction('none')} className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10">Sem fotografia</button>
      </div>
      {image.origin === 'ai' && image.isIllustrative && <p className="mt-2 text-[11px] text-blue-300">Imagem ilustrativa (não documental).</p>}
      {image.sourceName && <p className="mt-2 break-all text-[11px] text-slate-500">Origem: {image.sourceName}</p>}
      {image.rightsWarning && <p className="mt-2 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-300">⚠ Verifique os direitos de uso desta imagem antes da publicação.</p>}
    </div>
  </div>;
}