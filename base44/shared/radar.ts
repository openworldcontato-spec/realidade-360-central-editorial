// Núcleo do Radar 360: descoberta, agrupamento, scoring e armazenamento de pautas.
// Compartilhado entre runRadar, searchTopic e analyzeLink.

export const CATEGORIES = ["Brasil","Política","Economia","Justiça","Segurança","Mundo","Tecnologia","Sociedade","Viral"];

export const DISCOVERY_GROUPS = [
  { areas: "Brasil, política, economia, justiça e segurança (cenário nacional brasileiro)", label: "Nacional" },
  { areas: "Mundo e relações internacionais (cenário internacional)", label: "Mundo" },
  { areas: "Tecnologia, sociedade e assuntos virais", label: "Tecnologia/Sociedade/Viral" }
];

const MAJOR_OUTLETS = ["g1","globo","cnn","folha","estadao","estadão","uol","agencia brasil","agência brasil","bbc","reuters","veja","exame","valor","r7","terra","metropoles","metrópoles","sbt","band","valor econômico","o globo"];

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function discoverySchema() {
  return {
    type: "object",
    properties: {
      articles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            outlet: { type: "string" },
            url: { type: "string" },
            published_at: { type: "string" },
            summary: { type: "string" },
            category: { type: "string" },
            source_type: { type: "string" },
            primary_source_url: { type: "string" },
            is_primary: { type: "boolean" }
          },
          required: ["title", "outlet", "url"]
        }
      }
    },
    required: ["articles"]
  };
}

function groupingSchema() {
  return {
    type: "object",
    properties: {
      pautas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            consolidated_title: { type: "string" },
            category: { type: "string" },
            what_happened: { type: "string" },
            why_relevant: { type: "string" },
            confirmed_points: { type: "array", items: { type: "string" } },
            divergent_points: { type: "array", items: { type: "string" } },
            unconfirmed_points: { type: "array", items: { type: "string" } },
            timeline: { type: "array", items: { type: "string" } },
            article_indices: { type: "array", items: { type: "integer" } },
            primary_indices: { type: "array", items: { type: "integer" } },
            relevance: { type: "integer" },
            impact: { type: "integer" },
            shareability: { type: "integer" },
            novelty: { type: "integer" },
            reasoning: { type: "string" },
            matches_existing_story_id: { type: "string" }
          },
          required: ["consolidated_title", "category", "article_indices"]
        }
      }
    },
    required: ["pautas"]
  };
}

async function invokeLLM(base44, opts) {
  return base44.asServiceRole.integrations.Core.InvokeLLM(opts);
}

// Descoberta automática por grupo de editorias (ou por tema manual).
export async function discoverArticles(base44, areas, query) {
  const base = `Você é o radar editorial do Realidade 360, uma central jornalística brasileira. Sua tarefa é descobrir notícias e acontecimentos REAIS e atuais.`;
  const rules = `Regras absolutas:
- Use a busca web para encontrar matérias reais publicadas recentemente (priorize as últimas horas, máximo 48h).
- Para cada matéria, informe: título original, veículo, URL original real, data/hora de publicação quando disponível, resumo factual, editoria, tipo da fonte e URL de fonte primária oficial quando existir.
- NUNCA invente URL, fonte, data, declaração, documento ou informação ausente. Se não tiver, deixe vazio.
- Priorize veículos jornalísticos confiáveis e fontes oficiais (STF, STJ, TSE, Câmara, Senado, Banco Central, IBGE, DOU, ministérios, PF, Receita, Presidência, órgãos estaduais).
- Não repita a mesma matéria em itens diferentes.
- Se não encontrar dados reais suficientes, retorne lista vazia.`;
  const prompt = query
    ? `${base}\n\nBusque na web notícias e acontecimentos REAIS e recentes sobre: "${query}". Cubra todas as editorias relevantes ao assunto.\n\n${rules}`
    : `${base}\n\nBusque na web as notícias e acontecimentos MAIS RECENTES e relevantes nas áreas: ${areas}. Priorize conteúdos publicados hoje nas últimas horas.\n\n${rules}`;
  const res = await invokeLLM(base44, {
    prompt,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: discoverySchema()
  });
  return (res && res.articles) || [];
}

// Análise de um link colado manualmente: extrai a matéria e procura outras fontes do mesmo acontecimento.
export async function analyzeLinkArticles(base44, link) {
  const prompt = `Você é o radar editorial do Realidade 360. O usuário colou o link de uma matéria: ${link}

Busque na web o conteúdo desta matéria e procure OUTRAS fontes que estejam cobrindo o MESMO acontecimento. Retorne a matéria original (primeiro item) e as relacionadas encontradas. Se houver fonte primária oficial (documento, órgão), inclua com is_primary=true.

Regras: NUNCA invente URL, fonte ou data. Se não conseguir acessar o conteúdo, retorne apenas o que for real e verificável.`;
  const res = await invokeLLM(base44, {
    prompt,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: discoverySchema()
  });
  return (res && res.articles) || [];
}

// Agrupamento semântico: transforma artigos em pautas únicas.
export async function groupAndAnalyze(base44, articles, existingStories) {
  if (!articles.length) return [];
  const articlesBlock = articles.map((a, i) =>
    `[${i}] Título: ${a.title}\nVeículo: ${a.outlet || ""}\nURL: ${a.url}\nData: ${a.published_at || "desconhecida"}\nResumo: ${a.summary || ""}\nEditoria: ${a.category || ""}\nTipo: ${a.source_type || ""}\nPrimária: ${a.is_primary ? "sim" : "não"}`
  ).join("\n\n");
  const existingBlock = existingStories.length
    ? existingStories.map(s => `ID: ${s.id} | Título: ${s.title} | Editoria: ${s.category}`).join("\n")
    : "Nenhuma pauta aberta.";

  const prompt = `Você é o agrupador editorial do Realidade 360. Receberá várias matérias reais e deve agrupar aquelas que tratam do MESMO acontecimento em uma única pauta — mesmo quando os títulos são diferentes. Se 6 veículos falam do mesmo fato, crie 1 pauta com 6 fontes, não 6 pautas.

ARTIGOS ENCONTRADOS:
${articlesBlock}

PAUTAS ABERTAS EXISTENTES (para reutilizar quando o acontecimento for o mesmo):
${existingBlock}

Para cada pauta, produza:
- consolidated_title: título único e informativo.
- category: uma das editorias (Brasil, Política, Economia, Justiça, Segurança, Mundo, Tecnologia, Sociedade, Viral).
- what_happened: resumo ESTRITAMENTE factual baseado nas fontes.
- why_relevant: por que está ganhando relevância agora.
- confirmed_points: informações corroboradas por mais de uma fonte.
- divergent_points: pontos em que as fontes divergem (mostre a divergência, não escolha lado).
- unconfirmed_points: alegações ou informações sem confirmação suficiente.
- timeline: acontecimentos conhecidos organizados por horário/data (cada item "HH:mm - fato" ou "DD/MM - fato").
- article_indices: índices dos artigos que compõem esta pauta.
- primary_indices: índices dos artigos que são fonte primária/oficial.
- relevance (0-15): relevância pública.
- impact (0-15): impacto potencial.
- shareability (0-5): potencial de compartilhamento em redes sociais.
- novelty (0-5): novidade do assunto.
- reasoning: justificativa curta da pontuação.
- matches_existing_story_id: ID de uma pauta aberta existente se for o mesmo acontecimento, senão string vazia.

Regra editorial fundamental: diferencie fato confirmado, declaração, alegação, opinião, informação preliminar e informação não confirmada. Nunca transforme acusação ou alegação em afirmação factual. Não invente nada.`;

  const res = await invokeLLM(base44, {
    prompt,
    model: "claude_sonnet_4_6",
    response_json_schema: groupingSchema()
  });
  return (res && res.pautas) || [];
}

function recencyScore(latestPublishedAt) {
  if (!latestPublishedAt) return 4;
  const t = new Date(latestPublishedAt).getTime();
  if (isNaN(t)) return 4;
  const hours = (Date.now() - t) / 3600000;
  if (hours <= 1) return 20;
  if (hours <= 3) return 14;
  if (hours <= 6) return 9;
  if (hours <= 12) return 5;
  if (hours <= 24) return 2;
  return 0;
}
function sourceCountScore(n) { return Math.min(n * 2, 15); }
function sourceRelevanceScore(articles) {
  let s = 0;
  if (articles.some(a => a.is_primary || a.source_type === "Fonte oficial" || a.source_type === "Documento/Fonte primária")) s += 6;
  if (articles.some(a => MAJOR_OUTLETS.some(o => (a.outlet || "").toLowerCase().includes(o)))) s += 4;
  return Math.min(s, 10);
}
function velocityScore(prevSnapshots, totalSources) {
  if (!prevSnapshots || prevSnapshots.length === 0) return Math.min(totalSources * 1.5, 15);
  const prev = prevSnapshots[prevSnapshots.length - 1];
  const ratio = prev.source_count > 0 ? totalSources / prev.source_count : 2;
  if (ratio >= 2) return 15;
  if (ratio >= 1.5) return 11;
  if (ratio >= 1.2) return 7;
  if (ratio >= 1) return 4;
  return 2;
}
function computeTrend(detectedAt, score, totalSources, prevSnapshots) {
  const ageMin = (Date.now() - new Date(detectedAt).getTime()) / 60000;
  const prev = prevSnapshots && prevSnapshots.length ? prevSnapshots[prevSnapshots.length - 1] : null;
  const accelerating = prev && prev.source_count >= 2 && totalSources / prev.source_count >= 1.5;
  if (ageMin <= 60 && score >= 60) return "Última hora";
  if (accelerating) return "Acelerando";
  if (totalSources >= 5 && score >= 70) return "Em alta";
  return "Monitorar";
}
function bandFor(score) {
  if (score >= 90) return "PUBLICAR AGORA";
  if (score >= 75) return "ALTO POTENCIAL";
  if (score >= 60) return "ACOMPANHAR";
  return "BAIXA PRIORIDADE";
}

// Persiste pautas, fontes e snapshots; calcula score e tendência.
export async function storePautas(base44, pautas, articles, mode, searchQuery) {
  const results = [];
  for (const p of pautas) {
    const pautaArticles = (p.article_indices || []).map(i => articles[i]).filter(Boolean);
    if (pautaArticles.length === 0) continue;
    const primaryArticles = (p.primary_indices || []).map(i => articles[i]).filter(Boolean);
    const latestPub = pautaArticles.map(a => a.published_at).filter(Boolean).sort().pop();
    const recency = recencyScore(latestPub);
    const sc = sourceCountScore(pautaArticles.length);
    const sr = sourceRelevanceScore(pautaArticles);

    let storyId = p.matches_existing_story_id || null;
    let prevSnapshots = [];
    let existingSources = [];
    let detectedAt = new Date().toISOString();

    if (storyId) {
      const existing = await base44.entities.Story.get(storyId).catch(() => null);
      if (existing) {
        detectedAt = existing.detected_at || detectedAt;
        const snaps = await base44.entities.RadarSnapshot.filter({ story_id: storyId }, "snapshot_at", 20);
        prevSnapshots = snaps || [];
        existingSources = await base44.entities.StorySource.filter({ story_id: storyId }, null, 100);
      } else {
        storyId = null;
      }
    }

    const totalSources = pautaArticles.length + existingSources.length;
    const totalPrimary = primaryArticles.length + existingSources.filter(s => s.is_primary).length;
    const velocity = velocityScore(prevSnapshots, totalSources);
    const relevance = clamp(p.relevance || 0, 0, 15);
    const impact = clamp(p.impact || 0, 0, 15);
    const share = clamp(p.shareability || 0, 0, 5);
    const novelty = clamp(p.novelty || 0, 0, 5);
    const score = Math.round(recency + sc + sr + velocity + relevance + impact + share + novelty);
    const trend = computeTrend(detectedAt, score, totalSources, prevSnapshots);
    const band = bandFor(score);
    const scoreReason = `Recência ${recency}/20 · ${totalSources} fontes (${sc}/15) · relevância de fontes ${sr}/10 · velocidade ${velocity}/15 · relevância pública ${relevance}/15 · impacto ${impact}/15 · compartilhamento ${share}/5 · novidade ${novelty}/5. ${(p.reasoning || "").trim()}`.trim();

    const storyData = {
      title: p.consolidated_title,
      category: p.category || pautaArticles[0].category || "Brasil",
      trend,
      opportunity_score: score,
      score_band: band,
      score_reason: scoreReason,
      detected_at: detectedAt,
      last_updated_at: new Date().toISOString(),
      summary: p.what_happened || "",
      what_happened: p.what_happened || "",
      why_relevant: p.why_relevant || "",
      source_count: totalSources,
      primary_source_count: totalPrimary,
      confirmed_points: p.confirmed_points || [],
      divergent_points: p.divergent_points || [],
      unconfirmed_points: p.unconfirmed_points || [],
      timeline: p.timeline || [],
      is_manual: mode !== "auto",
      search_query: searchQuery || ""
    };

    if (storyId) {
      await base44.entities.Story.update(storyId, storyData);
    } else {
      const created = await base44.entities.Story.create({ ...storyData, status: "Detectada" });
      storyId = created.id;
    }

    const existingUrls = new Set(existingSources.map(s => s.source_url));
    const newSources = [];
    for (const a of pautaArticles) {
      if (!a.url || existingUrls.has(a.url)) continue;
      existingUrls.add(a.url);
      newSources.push({
        story_id: storyId,
        source_name: a.outlet || "",
        source_title: a.title,
        source_url: a.url,
        primary_source_url: a.primary_source_url || "",
        source_type: a.source_type || "Veículo jornalístico",
        is_primary: !!a.is_primary,
        published_at: a.published_at || "",
        summary: a.summary || ""
      });
    }
    if (newSources.length) await base44.entities.StorySource.bulkCreate(newSources);

    await base44.entities.RadarSnapshot.create({
      story_id: storyId,
      snapshot_at: new Date().toISOString(),
      source_count: totalSources,
      primary_count: totalPrimary
    });

    results.push({ id: storyId, title: p.consolidated_title, score, sources: totalSources });
  }
  return results;
}

export async function getOpenStories(base44) {
  const recent = await base44.entities.Story.list("-updated_date", 30);
  return recent.filter(s => !s.ignored && !["Publicada", "Arquivada"].includes(s.status));
}