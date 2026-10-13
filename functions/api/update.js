// POST /api/update  { id, prop, value } -> updates one property of one Notion page
import { notion } from '../../lib/notion.js';

export async function onRequestPost({ request, env }) {
  try {
    const { id, prop, value } = await request.json();
    const n = notion(env);
    const db = await n('/databases/' + env.NOTION_DATABASE_ID);
    const p = db.properties[prop];
    if (!p) throw new Error('Unknown property: ' + prop);
    const v = String(value ?? '');
    let payload;
    switch (p.type) {
      case 'select': payload = { select: v ? { name: v } : null }; break;
      case 'status':
        if (!v) throw new Error('Status cannot be empty');
        payload = { status: { name: v } }; break;
      case 'multi_select': payload = { multi_select: v.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name })) }; break;
      case 'number': payload = { number: v === '' ? null : Number(v) }; break;
      case 'date': payload = { date: v ? { start: v } : null }; break;
      case 'checkbox': payload = { checkbox: value === true || v === 'true' || v === 'Yes' }; break;
      case 'rich_text': payload = { rich_text: v ? [{ type: 'text', text: { content: v } }] : [] }; break;
      case 'title': payload = { title: [{ type: 'text', text: { content: v } }] }; break;
      case 'email': payload = { email: v || null }; break;
      case 'url': payload = { url: v || null }; break;
      default: throw new Error('Property type not editable: ' + p.type);
    }
    await n('/pages/' + id, { method: 'PATCH', body: JSON.stringify({ properties: { [prop]: payload } }) });
    return Response.json({ ok: true });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
