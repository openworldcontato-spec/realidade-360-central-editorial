import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { generatePackage } from "../../shared/content.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const storyId = body.story_id;
    if (!storyId) return Response.json({ error: "Informe a pauta." }, { status: 400 });

    const { package: pkg, newSources, sourcesCount } = await generatePackage(base44, storyId);
    const existing = await base44.entities.ContentVersion.filter({ story_id: storyId }, null, 200);
    const versionNumber = (existing.length || 0) + 1;
    const version = await base44.entities.ContentVersion.create({
      story_id: storyId, version_number: versionNumber, generation_type: "gerar",
      main_title: pkg.main_title || "", art_headline: pkg.art_headline || "",
      alternative_headlines: pkg.alternative_headlines || [],
      factual_summary: pkg.factual_summary || "", facebook_text: pkg.facebook_text || "",
      instagram_text: pkg.instagram_text || "", short_caption: pkg.short_caption || "",
      sources_text: pkg.sources_text || "", source_notes: "", fact_check_notes: "", art_instructions: "",
      checagem: pkg.checagem || [], confidence_score: pkg.confidence_score || 0,
      confidence_band: pkg.confidence_band || "", has_divergence: !!pkg.has_divergence,
      divergence_note: pkg.divergence_note || "", is_developing: !!pkg.is_developing,
      last_check_at: new Date().toISOString(), is_final: false
    });
    await base44.entities.Story.update(storyId, { status: "Em produção", last_updated_at: new Date().toISOString() });
    return Response.json({ version, newSources, sourcesCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}