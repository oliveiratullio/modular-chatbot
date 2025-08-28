import 'dotenv/config';
import { request } from 'undici';
import { htmlToCleanText, chunkString } from './text-utils.js';
import { OpenAIEmbeddingsAdapter } from '../adapters/embeddings.adapter.js';
import { RedisVectorStoreAdapter } from '../adapters/vectorstore.adapter.js';
import { logger } from '../../common/logging/logger.service.js';
import { getSeedUrls } from './crawler.js';

const CHUNK_SIZE = Number(process.env.RAG_CHUNK_SIZE ?? 3000);
const CHUNK_OVERLAP = Number(process.env.RAG_CHUNK_OVERLAP ?? 600);

/** Seed extra opcional via env */
function getExtraSeedFromEnv(): string[] {
  const raw = process.env.RAG_SEED_URLS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function fetchText(url: string): Promise<string | null> {
  const res = await request(url, {
    headers: { 'user-agent': 'modular-chatbot/ingestor' },
  });
  if (res.statusCode !== 200) return null;
  const html = await res.body.text();
  const text = htmlToCleanText(html);
  return text.length >= 200 ? text : null;
}

async function run() {
  const t0 = performance.now();

  const fromCrawler = await getSeedUrls();
  const extra = getExtraSeedFromEnv();
  const urls = Array.from(new Set([...extra, ...fromCrawler]));

  const emb = new OpenAIEmbeddingsAdapter();
  const vs = new RedisVectorStoreAdapter(emb);
  await vs.ensureIndex();

  let totalChunks = 0;

  for (const url of urls) {
    try {
      const full = await fetchText(url);
      if (!full) {
        logger.info({ level: 'INFO', ingestor: true, url, skipped: 'no_text' });
        continue;
      }

      // salva texto integral limpo (para síntese)
      await vs.saveRaw(url, full);

      // chunk para recall (embeddings)
      const chunks = chunkString(full, CHUNK_SIZE, CHUNK_OVERLAP);
      if (!chunks.length) {
        logger.info({
          level: 'INFO',
          ingestor: true,
          url,
          skipped: 'no_chunks',
        });
        continue;
      }

      const upserts = chunks.map((c, i) => ({
        id: `${url}#${i}`,
        text: c,
        metadata: { url, title: '' },
      }));

      await vs.upsert(upserts);
      totalChunks += upserts.length;

      logger.info({
        level: 'INFO',
        ingestor: true,
        url,
        chunks: upserts.length,
      });
    } catch (e) {
      logger.error({
        level: 'ERROR',
        ingestor: true,
        url,
        error: (e as Error).message,
      });
    }
  }

  // diagnóstico final
  try {
    const diag = await vs.diagnostics();
    logger.info({
      level: 'INFO',
      ingestor: true,
      urls: urls.length,
      totalChunks,
      indexName: diag.indexName,
      keyPrefix: diag.keyPrefix,
      indexExists: diag.indexExists,
      indexDocCount: diag.indexDocCount,
      keyCount: diag.keyCount,
      fallbackKeyCount: diag.fallbackKeyCount,
      sampleKeys: diag.sampleKeys,
      ms: performance.now() - t0,
    });
  } catch (e) {
    logger.error({
      level: 'ERROR',
      ingestor: true,
      message: 'diagnostics failed',
      error: (e as Error).message,
    });
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
