// Agente Jornalista 360: geração e reescrita do pacote editorial.
import { discoverArticles, normalizeUrl } from "./radar.ts";

function contentSchema() {
  return {
    type: "object",
    properties: {
      main_title: { type: "string" },
      art_headline: { type: "string" },
      alternative_headlines: { type: "array", items: { type: "string" } },
      factual_summary: { type: "string" },
      facebook_text: { type: "string" },
      instagram_text: { type: "string" },
      short_caption: { type: "string" },
      sources_text: { type: "string" },
      checagem: {
        type: "array",
        items: {
          type: "object",
          properties: {
            claim: { type: "string" },
            status: { type: "string" },
            source: { type: "string" },
            url: { type: "string" },
            note: { type: "string" }
          },
          required: ["claim", "status"]
        }
      },
      confidence_score: { type: "integer" },
      confidence_band: { type: "string" },
      has_divergence: { type: "boolean" },
      divergence_note: { type: "string" },
      is_developing: { type: "boolean" }
    },
    required: ["main_title", "art_headline", "facebook_text", "instagram_text", "checagem", "confidence_score"]
  };
}

async function invokeLLM(base44, opts) {
  return base44.asServiceRole.integrations.Core.InvokeLLM(opts);
}

function buildContext(story, sources) {
  const sourcesBlock = sources.map((s, i) =>
    `[${i}] ${s.is_primary ? "[PRIMÁRIA] " : ""}${s.source_name || "Veículo"}\nTítulo: ${s.source_title || ""}\nURL: ${s.source_url || ""}\nData: ${s.published_at ? new Date(s.published_at).toLocaleString("pt-BR") : "desconhecida"}\nResumo: ${s.summary || ""}`
  ).join("\n\n");
  return `PAUTA:
Título consolidado: ${story.title}
Editoria: ${story.category}
Classificação do Radar: ${story.trend} (Opportunity Score ${story.opportunity_score})
O que aconteceu: ${story.what_happened || story.summary || ""}
Por que é relevante: ${story.why_relevant || ""}
Cronologia: ${(story.timeline || []).join(" | ") || "não informada"}
Pontos confirmados: ${(story.confirmed_points || []).join(" | ") || "nenhum"}
Pontos divergentes: ${(story.divergent_points || []).join(" | ") || "nenhum"}
Não confirmados: ${(story.unconfirmed_points || []).join(" | ") || "nenhum"}

FONTES VINCULADAS (${sources.length}):
${sourcesBlock}`;
}

export async function loadStoryContextText(base44, storyId) {
  const story = await base44.entities.Story.get(storyId).catch(() => null);
  if (!story) return "";
  const sources = await base44.entities.StorySource.filter({ story_id: storyId }, null, 100);
  return buildContext(story, sources);
}

export async function generatePackage(base44, storyId) {
  const story = await base44.entities.Story.get(storyId);
  if (!story) throw new Error("Pauta não encontrada.");
  let sources = await base44.entities.StorySource.filter({ story_id: storyId }, "-published_at", 100);

  // Complementação de apuração: busca web por outras fontes do mesmo assunto.
  let newCount = 0;
  try {
    const found = await discoverArticles(base44, "todas as editorias", story.title);
    const existingNorm = new Set(sources.map(s => normalizeUrl(s.source_url)));
    const seenFound = new Set();
    const fresh = found.filter(a => {
      const n = normalizeUrl(a.url);
      if (!a.url || !n || existingNorm.has(n) || seenFound.has(n)) return false;
      seenFound.add(n); return true;
    });
    if (fresh.length) {
      const toCreate = fresh.map(a => ({
        story_id: storyId, source_name: a.outlet || "", source_title: a.title,
        source_url: a.url, primary_source_url: a.primary_source_url || "",
        source_type: a.source_type || "Veículo jornalístico", is_primary: !!a.is_primary,
        published_at: a.published_at || "", summary: a.summary || ""
      }));
      await base44.entities.StorySource.bulkCreate(toCreate);
      sources = sources.concat(toCreate);
      newCount = fresh.length;
    }
    // contagem única por URL normalizada
    const allNorm = new Set(); const uniqueAll = [];
    for (const s of sources) { const n = normalizeUrl(s.source_url); if (!n || allNorm.has(n)) continue; allNorm.add(n); uniqueAll.push(s); }
    const primary = uniqueAll.filter(s => s.is_primary).length;
    await base44.entities.Story.update(storyId, { source_count: uniqueAll.length, primary_source_count: primary, last_updated_at: new Date().toISOString() });
    await base44.entities.RadarSnapshot.create({ story_id: storyId, snapshot_at: new Date().toISOString(), source_count: uniqueAll.length, primary_count: primary });
  } catch (e) { /* complemento é best-effort */ }

  const context = buildContext(story, sources);
  const prompt = `Você é o editor-jornalista do Realidade 360. Transforme a pauta abaixo em um PACOTE EDITORIAL completo para publicação manual no Facebook e Instagram.

${context}

REGRAS EDITORIAIS OBRIGATÓRIAS:
1. Estilo: informativo, claro, moderno, contextualizado e direto. Fato primeiro, contexto depois.
2. NÃO escreva como assessoria de imprensa, militância ou postagem pessoal. Não exagere adjetivos.
3. NUNCA use "bombástico", "chocante", "absurdo", "escândalo", "ninguém esperava", "internet vai à loucura" — salvo em citação atribuída.
4. ATRIBUIÇÃO OBRIGATÓRIA: nunca transforme alegação em fato. Acusações, denúncias, investigações, suspeitas e opiniões devem ser atribuídas ("Segundo o MP...", "A investigação apura suspeitas de...").
5. NÃO reproduza parágrafos inteiros das fontes. Redija texto próprio. Citações diretas só quando relevantes e com atribuição.
6. Diferencie fato confirmado, declaração, alegação, opinião e informação não confirmada.
7. Se houver divergência entre fontes, NÃO escolha lado — reflita a incerteza no texto.

PACOTE A GERAR:
- main_title: título jornalístico claro e objetivo.
- art_headline: manchete curta e forte para imagem social (8 a 16 palavras).
- alternative_headlines: exatamente 3, com abordagens diferentes, sem sensacionalismo.
- factual_summary: síntese curta do acontecimento.
- facebook_text: texto completo pronto para publicar. Estrutura: fato principal no 1º parágrafo, contexto, detalhes, declarações com atribuição, o que acontece agora. Sem subtítulos artificiais. Encerre com "Fontes: ..." (nomes dos veículos, NÃO as URLs).
- instagram_text: versão mais curta, parágrafos curtos, contexto suficiente, sem linguagem apelativa. Hashtags só quando úteis. Encerre com "Fontes: ...".
- short_caption: legenda curta opcional para posts em que a arte já carrega a informação.
- sources_text: linha "Fontes: A, B e C." com os nomes dos veículos.
- checagem: analise as principais afirmações do conteúdo. Para cada: claim, status (um de: "Confirmado por múltiplas fontes", "Confirmado por fonte primária", "Atribuído a uma fonte", "Divergente", "Não confirmado", "Exige revisão"), source, url (link que sustenta), note.
- confidence_score: 0 a 100 representando o suporte documental (NÃO a verdade). Considere: afirmações sustentadas, fonte primária, fontes independentes, divergências, não confirmados.
- confidence_band: um de "Documentação muito forte" (90-100), "Boa sustentação" (75-89), "Revisão recomendada" (60-74), "Não recomendar publicação sem revisão" (<60).
- has_divergence: true se há divergência relevante.
- divergence_note: explicação curta da divergência.
- is_developing: true se a pauta muda rapidamente (classificação "Última hora" ou "Acelerando").

Baseie-se ESTRITAMENTE nas fontes fornecidas. Não invente informações, URLs, datas ou declarações.`;

  const pkg = await invokeLLM(base44, { prompt, model: "claude_sonnet_4_6", response_json_schema: contentSchema() });
  return { package: pkg, newSources: newCount, sourcesCount: sources.length };
}

export async function rewritePackage(base44, content, mode, storyContext) {
  const prompt = `Você é o editor do Realidade 360. Reescreva o pacote editorial abaixo aplicando a orientação: "${mode}".

Regras: NÃO altere fatos. NÃO remova atribuições importantes. Mantenha o estilo editorial (informativo, claro, contextualizado). Sem expressões sensacionalistas. Continue atribuindo acusações/alegações corretamente.

${storyContext ? `CONTEXTO DA PAUTA:\n${storyContext}\n\n` : ""}PACOTE ATUAL:
${JSON.stringify(content, null, 2)}

Retorne o pacote completo reescrito (mesma estrutura).`;
  const pkg = await invokeLLM(base44, { prompt, model: "claude_sonnet_4_6", response_json_schema: contentSchema() });
  return pkg;
}