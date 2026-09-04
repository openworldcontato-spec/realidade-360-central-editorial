import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { discoverArticles, groupAndAnalyze, storePautas, getOpenStories } from "../../shared/radar.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = (body.query || "").trim();
    if (!query) return Response.json({ error: "Informe um assunto ou acontecimento." }, { status: 400 });

    const run = await base44.entities.RadarRun.create({
      run_at: new Date().toISOString(),
      status: "em_andamento",
      mode: "search"
    });

    const articles = await discoverArticles(base44, "todas as editorias", query);

    if (articles.length === 0) {
      await base44.entities.RadarRun.update(run.id, {
        status: "concluida",
        articles_found: 0,
        stories_found: 0,
        detail: "Nenhuma fonte encontrada para este assunto."
      });
      return Response.json({ articles: 0, pautas: 0, detail: "Nenhuma fonte encontrada para este assunto." });
    }

    const existing = await getOpenStories(base44);
    const pautas = await groupAndAnalyze(base44, articles, existing);
    const stored = await storePautas(base44, pautas, articles, "search", query);

    await base44.entities.RadarRun.update(run.id, {
      status: "concluida",
      articles_found: articles.length,
      stories_found: stored.length
    });

    return Response.json({ articles: articles.length, pautas: stored.length, results: stored });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}