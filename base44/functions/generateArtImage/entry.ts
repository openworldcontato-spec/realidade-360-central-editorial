import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const editoriaStyle = {
  'Tecnologia': 'futuristic technological illustration, circuit and data motifs, clean digital aesthetic',
  'Economia': 'conceptual financial illustration, abstract market charts and currency graphics',
  'Segurança': 'conceptual environment, high contrast, no specific scene, absolutely no violence or weapons',
  'Política': 'institutional composition, government buildings, flags, national symbols, editorial',
  'Justiça': 'sober institutional composition, courthouse, scales of justice, legal symbols',
  'Mundo': 'geopolitical world map, flags, cities, global elements',
  'Sociedade': 'warm human-centered conceptual illustration, silhouettes, no identifiable real people',
  'Viral': 'light modern editorial illustration, playful but journalistic',
  'Brasil': 'national symbols, Brazilian flag colors as subtle accent, institutional'
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { editoria, headline, context } = body;
    if (!headline) return Response.json({ error: "Informe a headline." }, { status: 400 });
    const style = editoriaStyle[editoria] || 'modern editorial illustration';
    const prompt = `Editorial illustration for a news social media post about: "${headline}". ${context ? `Context: ${context}.` : ''} Style: ${style}. CRITICAL RULES: This is an ILLUSTRATION, NOT a documentary photograph. Do NOT depict a real specific event as if photographed. Do NOT show identifiable real people. Use a conceptual, illustrative, editorial approach. Dark navy background with electric blue and subtle gold accents, modern journalistic aesthetic, high contrast, clean minimal composition. No text, no words, no letters in the image. No violence, no blood, no weapons, no graphic injury, no sensational or shocking imagery.`;
    const res = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
    return Response.json({ url: res.url, is_illustrative: true, prompt });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}