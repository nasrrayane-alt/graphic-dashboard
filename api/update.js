// POST /api/update  { id, prop, value } -> updates one property of one Notion page
const { n, DB } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { id, prop, value } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const db = await n('/databases/' + DB());
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
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
};
