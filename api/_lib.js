// Shared helpers for the Notion API (files starting with "_" are not exposed as endpoints)
const DB = () => process.env.NOTION_DATABASE_ID;

async function n(path, opt = {}) {
  const r = await fetch('https://api.notion.com/v1' + path, {
    ...opt,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
  });
  if (!r.ok) throw new Error(`Notion ${r.status}: ${await r.text()}`);
  return r.json();
}

const txt = a => (a || []).map(x => x.plain_text).join('');
function val(p) {
  switch (p.type) {
    case 'title': return txt(p.title);
    case 'rich_text': return txt(p.rich_text);
    case 'number': return p.number ?? '';
    case 'select': return p.select?.name ?? '';
    case 'status': return p.status?.name ?? '';
    case 'multi_select': return p.multi_select.map(x => x.name).join(', ');
    case 'date': return p.date?.start ?? '';
    case 'checkbox': return p.checkbox ? 'Yes' : 'No';
    case 'people': return p.people.map(x => x.name || '').join(', ');
    case 'email': return p.email ?? '';
    case 'url': return p.url ?? '';
    case 'unique_id': return (p.unique_id.prefix ? p.unique_id.prefix + '-' : '') + p.unique_id.number;
    case 'formula': return val({ type: p.formula.type, [p.formula.type]: p.formula[p.formula.type] });
    case 'created_time': return p.created_time;
    default: return '';
  }
}
module.exports = { n, DB, val };
