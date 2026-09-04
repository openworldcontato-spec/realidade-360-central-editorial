import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const editoriaStyle = {
  'Tecnologia': 'modern technology newsroom aesthetic, restrained data and digital motifs',
  'Economia': 'premium financial-news aesthetic, restrained market and business motifs',
  'Segurança': 'sober breaking-news aesthetic, absolutely no violence or weapons',
  'Política': 'premium political-news composition, restrained institutional background',
  'Justiça': 'sober judicial-news composition, restrained courthouse or legal background',
  'Mundo': 'premium international-news composition, restrained geopolitical background',
  'Sociedade': 'human-centered premium newsroom composition',
  'Viral': 'modern high-impact newsroom composition without sensationalism',
  'Brasil': 'premium Brazilian newsroom composition with restrained institutional context'
};

function visualSchema() {
  return {
    type: 'object',
    properties: {
      has_people: { type: 'boolean' },
      protagonists: { type: 'array', items: { type: 'string' } },
      visual_context: { type: 'string' }
    },
    required: ['has_people', 'protagonists', 'visual_context']
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { editoria, headline, context, source_titles = [] } = body;
    if (!headline) return Response.json({ error: 'Informe a headline.' }, { status: 400 });

    let visual = { has_people: false, protagonists: [], visual_context: '' };
    try {
      visual = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Analise esta pauta jornalística e identifique somente pessoas públicas/reais que sejam protagonistas centrais do fato.\nHeadline: ${headline}\nContexto: ${context || ''}\nTítulos de fontes: ${(source_titles || []).join(' | ')}\nNão inclua pessoas apenas mencionadas lateralmente. Retorne no máximo 3 protagonistas. visual_context deve descrever em uma frase o contexto visual factual, sem inventar cena ou ação.`,
        model: 'gemini_3_flash',
        response_json_schema: visualSchema()
      });
    } catch (_) {}

    const protagonists = Array.isArray(visual?.protagonists) ? visual.protagonists.filter(Boolean).slice(0, 3) : [];
    const hasPeople = Boolean(visual?.has_people && protagonists.length);
    const style = editoriaStyle[editoria] || 'premium modern newsroom composition';

    const subjectDirection = hasPeople
      ? `PRIMARY VISUAL: recognizable editorial portrait composition of these public figures: ${protagonists.join(', ')}. Preserve recognizable facial identity and natural proportions. Use realistic press-portrait framing, with the main protagonist larger and secondary protagonist(s) supporting. Do not invent an event, meeting, gesture, expression, uniform, location, document or interaction that is not established by the supplied context. The result must read as an editorial composite/portrait, not as documentary evidence that these people were photographed together.`
      : `PRIMARY VISUAL: no reliable human protagonist was identified. Use a strong conceptual editorial visual directly tied to the factual subject; avoid generic stock-like symbols whenever a more specific contextual visual is possible.`;

    const prompt = `Create a vertical 4:5 premium Brazilian news-social-media base image for: "${headline}".\nFactual context: ${context || ''}\nVisual context: ${visual?.visual_context || ''}\n${subjectDirection}\nStyle: ${style}. Photorealistic editorial finish when people are present; polished magazine/newsroom treatment; dark navy/black lower gradient area reserved for the app to overlay its headline; strong subject separation; clean composition; electric-blue accents may be used subtly. IMPORTANT: no text, no captions, no logos, no watermarks, no letters. Never fabricate documentary evidence. No violence, blood, weapons or shocking imagery.`;

    const res = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
    return Response.json({
      url: res.url,
      is_illustrative: true,
      image_origin: hasPeople ? 'ai_editorial_portrait' : 'ai_editorial_concept',
      protagonists,
      prompt
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
