import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { discoverArticles, normalizeUrl } from "../../shared/radar.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const storyId = body.story_id;
    if (!storyId) return Response.json({ error: "Informe a pauta." }, { status: 400 });
    const story = await base44.entities.Story.get(storyId);
    if (!story) return Response.json({ error: "Pauta não encontrada." }, { status: 404 });
    const sources = await base44.entities.StorySource.filter({ story_id: storyId }, null, 100);
    const found = await discoverArticles(base44, "todas as editorias", story.title);
    const existingNorm = new Set(sources.map(s => normalizeUrl(s.source_url)));
    const seenFound = new Set();
    const fresh = found.filter(a => {
      const n = normalizeUrl(a.url);
      if (!a.url || !n || existingNorm.has(n) || seenFound.has(n)) return false;
      seenFound.add(n); return true;
    });
    let added = [];
    if (fresh.length) {
      added = fresh.map(a => ({
        story_id: storyId, source_name: a.outlet || "", source_title: a.title,
        source_url: a.url, primary_source_url: a.primary_source_url || "",
        source_type: a.source_type || "Veículo jornalístico", is_primary: !!a.is_primary,
        published_at: a.published_at || "", summary: a.summary || ""
      }));
      await base44.entities.StorySource.bulkCreate(added);
    }
    const uniqueByUrl = new Map();
    [...sources, ...added].forEach(s => {
      const n = normalizeUrl(s.source_url);
      if (n && !uniqueByUrl.has(n)) uniqueByUrl.set(n, s);
    });
    const total = uniqueByUrl.size;
    // Fonte primária também precisa ser deduplicada; registros históricos
    // duplicados não podem inflar o contador documental.
    const primary = [...uniqueByUrl.values()].filter(s => s.is_primary).length;
    await base44.entities.Story.update(storyId, { source_count: total, primary_source_count: primary, last_updated_at: new Date().toISOString(), last_check_at: new Date().toISOString() });
    await base44.entities.RadarSnapshot.create({ story_id: storyId, snapshot_at: new Date().toISOString(), source_count: total, primary_count: primary });
    return Response.json({
      added: added.length, total,
      novidades: added.map(a => ({ source_name: a.source_name, source_title: a.source_title, source_url: a.source_url }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}