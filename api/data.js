// GET /api/data -> all rows (with Notion page id) + property schema (types and select options)
const { n, DB, val } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const db = await n('/databases/' + DB());
    const schema = Object.fromEntries(
      Object.entries(db.properties).map(([k, p]) => [k, { type: p.type, options: (p[p.type]?.options || []).map(o => o.name) }])
    );
    const rows = [];
    let cursor;
    do {
      const d = await n(`/databases/${DB()}/query`, {
        method: 'POST',
        body: JSON.stringify({ page_size: 100, ...(cursor && { start_cursor: cursor }) }),
      });
      for (const pg of d.results) {
        rows.push({ _id: pg.id, ...Object.fromEntries(Object.entries(pg.properties).map(([k, p]) => [k, String(val(p))])) });
      }
      cursor = d.has_more ? d.next_cursor : undefined;
    } while (cursor);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ updated: new Date().toISOString(), schema, rows });
  } catch (e) {
    res.status(500).send(e.message);
  }
};
