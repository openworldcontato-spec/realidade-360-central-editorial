import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Check, AlertTriangle, X, Sparkles } from 'lucide-react';

const STEPS = [
  { key: 'apuracao', label: 'Atualizando apuração e confirmando fontes...' },
  { key: 'conteudo', label: 'Cruzando informações e gerando conteúdo...' },
  { key: 'checagem', label: 'Executando Checagem 360 e Confiança Editorial...' },
  { key: 'arte', label: 'Preparando briefing visual e gerando arte 1080×1350...' },
  { key: 'salvar', label: 'Salvando rascunho e abrindo revisão final...' }
];

function friendlyError(err, stepKey) {
  const raw = err?.message || String(err);
  if (/Unauthorized|401/i.test(raw)) return 'Sessão expirada. O conteúdo já produzido foi preservado. Faça login novamente.';
  if (/timeout|timed out/i.test(raw)) return 'A operação demorou demais. O que já foi gerado está preservado. Você pode retomar pela Revisão.';
  if (stepKey === 'arte') return 'Não foi possível gerar a arte agora. O conteúdo editorial já está salvo. Você pode gerar a arte depois no Estúdio.';
  if (stepKey === 'conteudo' || stepKey === 'checagem') return 'Não foi possível concluir o conteúdo. A apuração já atualizada foi preservada.';
  if (stepKey === 'apuracao') return 'Não foi possível atualizar a apuração agora. Tente novamente em instantes.';
  return 'Não foi possível concluir esta etapa. O conteúdo já produzido foi preservado.';
}

export default function FullPackageModal({ story, onClose, onComplete }) {
  const [stepIdx, setStepIdx] = useState(-1);
  const [statuses, setStatuses] = useState({}); // key -> 'done'|'error'
  const [error, setError] = useState(null);
  const [partial, setPartial] = useState({});
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true); setError(null); setStatuses({}); setPartial({});
    const acc = {};
    let curKey = 'apuracao';
    try {
      // 1. Apuração
      curKey = 'apuracao'; setStepIdx(0);
      const r1 = await base44.functions.invoke('updateApuracao', { story_id: story.id });
      if (r1.data?.error) throw Object.assign(new Error(r1.data.error), { step: 'apuracao' });
      acc.apuracao = r1.data;
      setStatuses(s => ({ ...s, apuracao: 'done' }));

      // 2 + 3. Conteúdo (já inclui checagem + confiança)
      curKey = 'conteudo'; setStepIdx(1);
      const r2 = await base44.functions.invoke('generateContent', { story_id: story.id });
      if (r2.data?.error) throw Object.assign(new Error(r2.data.error), { step: 'conteudo' });
      acc.version = r2.data.version;
      setStatuses(s => ({ ...s, conteudo: 'done', checagem: 'done' }));

      // 4. Arte
      curKey = 'arte'; setStepIdx(3);
      const v = acc.version;
      const r3 = await base44.functions.invoke('generateArtImage', {
        editoria: story.category,
        headline: v?.art_headline || story.title,
        context: v?.factual_summary || story.what_happened || story.summary || ''
      });
      if (r3.data?.error) throw Object.assign(new Error(r3.data.error), { step: 'arte' });
      acc.imageUrl = r3.data.url;

      // 5. Salvar arte como rascunho
      curKey = 'salvar'; setStepIdx(4);
      const artwork = await base44.entities.Artwork.create({
        story_id: story.id,
        content_version_id: v?.id || '',
        title: v?.art_headline || story.title,
        headline: v?.art_headline || story.title,
        editoria: story.category,
        category: story.category,
        template: 'destaque',
        format: 'feed',
        image_url: acc.imageUrl,
        image_origin: 'ai',
        is_illustrative: true,
        status: 'Rascunho',
        version: 1
      });
      acc.artwork = artwork;
      setStatuses(s => ({ ...s, arte: 'done', salvar: 'done' }));
      setStepIdx(5);
      setRunning(false);
      onComplete({ story, version: acc.version, artwork: acc.artwork, apuracao: acc.apuracao });
    } catch (e) {
      const stepKey = e.step || curKey;
      setError(friendlyError(e, stepKey));
      setStatuses(s => ({ ...s, [stepKey]: 'error' }));
      setPartial(acc);
      setRunning(false);
    }
  };

  const stoppedAt = error ? STEPS[stepIdx]?.label : null;
  const canOpenPartial = partial.version; // conteúdo já gerado

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1424] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><Sparkles className="h-5 w-5 text-blue-400" />Pacote Completo</h2>
            <p className="mt-1 line-clamp-1 text-sm text-slate-400">{story.title}</p>
          </div>
          <button onClick={onClose} disabled={running} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 disabled:opacity-40"><X className="h-4 w-4" /></button>
        </div>

        {stepIdx === -1 ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-300">Vamos executar o fluxo assistido: apuração → conteúdo → Checagem 360 → Confiança Editorial → arte padrão → rascunho → revisão final. Você poderá revisar tudo antes de aprovar.</p>
            <button onClick={run} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"><Sparkles className="h-4 w-4" />Gerar pacote completo</button>
          </div>
        ) : (
          <ol className="space-y-3">
            {STEPS.map((s, i) => {
              const st = statuses[s.key];
              const active = i === stepIdx && running;
              return (
                <li key={s.key} className="flex items-start gap-3">
                  <span className="mt-0.5">
                    {st === 'done' ? <Check className="h-4 w-4 text-emerald-400" /> :
                     st === 'error' ? <AlertTriangle className="h-4 w-4 text-red-400" /> :
                     active ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> :
                     <span className="block h-4 w-4 rounded-full border border-white/15" />}
                  </span>
                  <span className={`text-sm ${st === 'done' ? 'text-slate-300' : active ? 'text-white' : st === 'error' ? 'text-red-300' : 'text-slate-500'}`}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-red-300"><AlertTriangle className="h-4 w-4" />O fluxo parou</p>
            <p className="mt-1 text-sm text-slate-300">{error}</p>
            {stoppedAt && <p className="mt-1 text-xs text-slate-500">Etapa interrompida: {stoppedAt}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {canOpenPartial && <button onClick={() => { setRunning(false); onComplete({ story, version: partial.version, artwork: partial.artwork, apuracao: partial.apuracao, partial: true }); }} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">Abrir revisão parcial</button>}
              <button onClick={run} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">Tentar novamente</button>
              <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-white/10">Fechar</button>
            </div>
          </div>
        )}

        {!error && stepIdx >= 0 && stepIdx < 5 && running && (
          <p className="mt-5 text-xs text-slate-500">Não feche esta janela. O que já foi gerado está sendo preservado automaticamente.</p>
        )}
      </div>
    </div>
  );
}