import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const editoriaStyle = {
  'Tecnologia': 'premium technology newsroom, subtle digital context, realistic editorial photography',
  'Economia': 'premium financial-news newsroom, subtle business/market context, realistic editorial photography',
  'Segurança': 'sober breaking-news newsroom, realistic editorial photography, no violence or weapons',
  'Política': 'premium political-news portrait, subtle institutional architecture, realistic editorial photography',
  'Justiça': 'premium judicial-news portrait, subtle STF/courthouse architecture, realistic editorial photography',
  'Mundo': 'premium international-news portrait, subtle geopolitical context, realistic editorial photography',
  'Sociedade': 'human-centered premium newsroom portrait, realistic editorial photography',
  'Viral': 'modern high-impact newsroom portrait without sensationalism',
  'Brasil': 'premium Brazilian newsroom portrait, subtle institutional Brazilian context'
};

function visualSchema() {
  return {
    type: 'object',
    properties: {
      has_people: { type: 'boolean' },
      protagonists: { type: 'array', items: { type: 'string' } },
      main_protagonist: { type: 'string' },
      visual_context: { type: 'string' }
    },
    required: ['has_people', 'protagonists', 'main_protagonist', 'visual_context']
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

    let visual = { has_people: false, protagonists: [], main_protagonist: '', visual_context: '' };
    try {
      visual = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Você é o diretor de arte de um veículo jornalístico. Identifique SOMENTE pessoas públicas/reais que sejam protagonistas centrais desta pauta.\nHeadline: ${headline}\nContexto factual: ${context || ''}\nTítulos das fontes: ${(source_titles || []).join(' | ')}\nRegras: retorne no máximo 2 protagonistas quando houver duas pessoas centrais; não inclua terceiros apenas citados; main_protagonist deve ser quem lidera a ação principal da headline; visual_context deve descrever apenas cenário institucional genérico adequado (ex.: STF ao fundo), sem inventar reunião, gesto ou acontecimento fotográfico.`,
        model: 'gemini_3_flash',
        response_json_schema: visualSchema()
      });
    } catch (_) {}

    const protagonists = Array.isArray(visual?.protagonists) ? visual.protagonists.filter(Boolean).slice(0, 2) : [];
    const hasPeople = Boolean(visual?.has_people && protagonists.length);
    const style = editoriaStyle[editoria] || 'premium modern newsroom editorial photography';

    let subjectDirection = '';
    if (hasPeople && protagonists.length === 1) {
      subjectDirection = `Create ONE recognizable, respectful editorial portrait likeness of the public figure ${protagonists[0]}. Exactly one person. No duplicate face, no additional person. Preserve recognizable facial identity, age, hair, skin tone and natural proportions. Waist-up or chest-up framing, serious neutral newsroom expression.`;
    } else if (hasPeople && protagonists.length >= 2) {
      const main = visual?.main_protagonist && protagonists.includes(visual.main_protagonist) ? visual.main_protagonist : protagonists[0];
      const secondary = protagonists.find(p => p !== main) || protagonists[1];
      subjectDirection = `Create EXACTLY TWO recognizable, respectful editorial portrait likenesses: ${main} as the main figure and ${secondary} as the secondary figure. Do not add a third person. Do not duplicate either face. Main figure slightly larger on the left, secondary figure on the right, both chest-up/waist-up. Preserve each person's recognizable facial identity, age, hair, skin tone and natural proportions. Neutral serious press-portrait expressions. They are an editorial composite and must NOT appear to be interacting or photographed together at a real event.`;
    } else {
      subjectDirection = `No reliable human protagonist was identified. Create a specific, high-quality conceptual editorial scene tied to the factual subject. Avoid generic stock-like icons when a concrete institutional/location context is available.`;
    }

    const prompt = `Create ONLY THE PHOTOGRAPHIC BASE for a vertical 4:5 Brazilian news poster. The application will add ALL typography later.\nNews subject: "${headline}".\nFactual context: ${context || ''}\nVisual context: ${visual?.visual_context || ''}\n${subjectDirection}\nStyle: ${style}; polished national-news magazine look; dark navy/black grading; subtle electric-blue accents; realistic studio/news photography; high contrast; clean separation of subjects from background. Composition rule: faces and upper bodies must occupy the TOP 58% of the frame; keep the LOWER 42% visually simple, dark and low-detail so a large headline can be overlaid by the app. ABSOLUTE TYPOGRAPHY BAN: generate ZERO text, ZERO letters, ZERO numbers, ZERO captions, ZERO logos, ZERO signs, ZERO watermarks, ZERO nameplates, ZERO UI elements. If architecture contains signage, crop/blur it so no readable letters appear. Never fabricate documentary evidence or a specific meeting/event. No violence, blood, weapons or shocking imagery.`;

    const res = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
    return Response.json({
      url: res.url,
      is_illustrative: true,
      image_origin: hasPeople ? 'ai_editorial_portrait_v21' : 'ai_editorial_concept_v21',
      protagonists,
      main_protagonist: visual?.main_protagonist || protagonists[0] || '',
      prompt
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
