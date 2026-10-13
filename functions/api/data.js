// GET /api/data -> all rows (with Notion page id) + property schema (types and select options)
import { notion, val } from '../../lib/notion.js';

export async function onRequestGet({ env }) {
  try {
    const n = notion(env);
    const db = await n('/databases/' + env.NOTION_DATABASE_ID);
    const schema = Object.fromEntries(
      Object.entries(db.properties).map(([k, p]) => [k, { type: p.type, options: (p[p.type]?.options || []).map(o => o.name) }])
    );
    const rows = [];
    let cursor;
    do {
      const d = await n(`/databases/${env.NOTION_DATABASE_ID}/query`, {
        method: 'POST',
        body: JSON.stringify({ page_size: 100, ...(cursor && { start_cursor: cursor }) }),
      });
      for (const pg of d.results) {
        rows.push({ _id: pg.id, ...Object.fromEntries(Object.entries(pg.properties).map(([k, p]) => [k, String(val(p))])) });
      }
      cursor = d.has_more ? d.next_cursor : undefined;
    } while (cursor);
    return Response.json({ updated: new Date().toISOString(), schema, rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
