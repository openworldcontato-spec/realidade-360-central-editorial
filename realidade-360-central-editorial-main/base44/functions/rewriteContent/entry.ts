import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { rewritePackage, loadStoryContextText } from "../../shared/content.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { content, mode, story_id } = body;
    if (!content || !mode) return Response.json({ error: "Conteúdo e modo são obrigatórios." }, { status: 400 });
    const ctx = story_id ? await loadStoryContextText(base44, story_id) : "";
    const pkg = await rewritePackage(base44, content, mode, ctx);
    const existing = story_id ? await base44.entities.ContentVersion.filter({ story_id }, null, 200) : [];
    const versionNumber = (existing.length || 0) + 1;
    const last = existing[0];
    const version = await base44.entities.ContentVersion.create({
      story_id: story_id || "", version_number: versionNumber, generation_type: "reescrever", rewrite_mode: mode,
      main_title: pkg.main_title || "", art_headline: pkg.art_headline || "",
      alternative_headlines: pkg.alternative_headlines || [],
      factual_summary: pkg.factual_summary || "", facebook_text: pkg.facebook_text || "",
      instagram_text: pkg.instagram_text || "", short_caption: pkg.short_caption || "",
      sources_text: pkg.sources_text || "", source_notes: content.source_notes || "",
      fact_check_notes: content.fact_check_notes || "", art_instructions: content.art_instructions || "",
      checagem: pkg.checagem || [], confidence_score: pkg.confidence_score || 0,
      confidence_band: pkg.confidence_band || "", has_divergence: !!pkg.has_divergence,
      divergence_note: pkg.divergence_note || "", is_developing: !!pkg.is_developing,
      last_check_at: (last && last.last_check_at) || new Date().toISOString(), is_final: false
    });
    return Response.json({ version });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}