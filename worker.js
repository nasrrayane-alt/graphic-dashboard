// Cloudflare Worker entry: serves /api/* and falls back to static files in /public
import { onRequestGet as getData } from './functions/api/data.js';
import { onRequestPost as postUpdate } from './functions/api/update.js';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/data' && request.method === 'GET') return getData({ request, env, ctx });
    if (pathname === '/api/update' && request.method === 'POST') return postUpdate({ request, env, ctx });
    if (pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
