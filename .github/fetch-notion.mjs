// Fetch all rows of a Notion database and write data.json (keys = property names)
import { writeFileSync } from 'node:fs';

const { NOTION_TOKEN, NOTION_DATABASE_ID } = process.env;
if (!NOTION_TOKEN || !NOTION_DATABASE_ID) throw new Error('Missing NOTION_TOKEN or NOTION_DATABASE_ID');

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

const rows = [];
let cursor;
do {
  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ page_size: 100, ...(cursor && { start_cursor: cursor }) }),
  });
  if (!res.ok) throw new Error(`Notion API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  for (const page of data.results) {
    rows.push(Object.fromEntries(Object.entries(page.properties).map(([k, p]) => [k, String(val(p))])));
  }
  cursor = data.has_more ? data.next_cursor : undefined;
} while (cursor);

writeFileSync('data.json', JSON.stringify({ updated: new Date().toISOString(), rows }, null, 1));
console.log(`Saved ${rows.length} rows`);
