import { request } from 'undici';

export async function getSeedUrls(): Promise<string[]> {
  const list = new Set<string>();

  const envList = (process.env.RAG_SEED_URLS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  envList.forEach((u) => list.add(u));

  const sitemap = process.env.RAG_SEED_SITEMAP;
  if (sitemap) {
    try {
      const res = await request(sitemap);
      const xml = await res.body.text();
      const matches = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map(
        (m) => m[1],
      );
      matches
        .filter((u) => u.includes('ajuda.infinitepay.io'))
        .forEach((u) => list.add(u));
    } catch {
      // ignora
    }
  }

  return Array.from(list).slice(0, 20);
}
