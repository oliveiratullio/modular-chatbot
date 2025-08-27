// packages/backend/src/agents/ingest/crawler.ts
import { request } from 'undici';
import * as urlLib from 'node:url';

const MAX_URLS = Number(process.env.RAG_MAX_URLS ?? 30);

/**
 * Lê de envs:
 * - RAG_SEED_URLS: lista de URLs separadas por vírgula (uso direto)
 * - RAG_SEED_SITEMAP: URL de sitemap.xml OU página HTML “índice”
 * Retorna uma lista deduplicada, limitada a MAX_URLS.
 */
export async function getSeedUrls(): Promise<string[]> {
  const list: string[] = [];

  // 1) URLs explícitas
  const seedList = (process.env.RAG_SEED_URLS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  list.push(...seedList);

  // 2) Sitemap ou página
  const site = process.env.RAG_SEED_SITEMAP?.trim();
  if (site) {
    try {
      const res = await request(site, {
        headers: { 'user-agent': 'modular-chatbot/ingestor' },
      });
      const body = await res.body.text();

      if (isLikelyXml(body)) {
        // Sitemap XML: parse simples por <loc>
        const locs = Array.from(body.matchAll(/<loc>([^<]+)<\/loc>/gi)).map(
          (m) => m[1].trim(),
        );
        list.push(...locs);
      } else {
        // HTML: colete <a href> do mesmo host
        const origin = new urlLib.URL(site).origin;
        const hrefs = Array.from(body.matchAll(/href\s*=\s*"(.*?)"/gi))
          .map((m) => m[1].trim())
          .filter(Boolean)
          .map((href) => {
            try {
              return new urlLib.URL(href, origin).href;
            } catch {
              return null;
            }
          })
          .filter((u): u is string => !!u)
          // só do mesmo host e com caminho “útil”
          .filter((u) => new urlLib.URL(u).origin === origin)
          .filter(
            (u) =>
              !u.endsWith('#') &&
              !u.includes('mailto:') &&
              !u.includes('javascript:'),
          );

        list.push(...hrefs);
      }
    } catch {
      // silencioso: sem sitemap, seguimos com o que tiver
    }
  }

  // normalização + dedupe + corte
  const normalized = Array.from(
    new Set(
      list
        .map((u) => {
          try {
            const url = new urlLib.URL(u);
            // remova fragmentos, normaliza trailing slash
            url.hash = '';
            return url.href.replace(/\/+$/, '/');
          } catch {
            return '';
          }
        })
        .filter(Boolean),
    ),
  );

  return normalized.slice(0, MAX_URLS);
}

function isLikelyXml(s: string): boolean {
  // heurística simples
  return /<\?xml/i.test(s) || /<urlset/i.test(s) || /<sitemapindex/i.test(s);
}
