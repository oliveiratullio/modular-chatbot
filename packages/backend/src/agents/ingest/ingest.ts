import 'dotenv/config';
import { request } from 'undici';
import { htmlToCleanText, chunkString } from './text-utils.js';
import { OpenAIEmbeddingsAdapter } from '../adapters/embeddings.adapter.js';
import { RedisVectorStoreAdapter } from '../adapters/vectorstore.adapter.js';
import { logger } from '../../common/logging/logger.service.js';
import { getSeedUrls } from './crawler.js';

async function run() {
  const t0 = performance.now();
  const urls = await getSeedUrls();

  const emb = new OpenAIEmbeddingsAdapter();
  const vs = new RedisVectorStoreAdapter(emb);
  await vs.ensureIndex();

  let totalChunks = 0;

  for (const url of urls) {
    try {
      const res = await request(url, {
        headers: { 'user-agent': 'modular-chatbot/ingestor' },
      });
      if (res.statusCode !== 200) continue;
      const html = await res.body.text();
      const text = htmlToCleanText(html);
      // Indexa também páginas curtas
      if (text.length < 50) continue;

      const chunks = chunkString(
        text,
        Number(process.env.RAG_CHUNK_SIZE ?? 2800),
        Number(process.env.RAG_CHUNK_OVERLAP ?? 700),
      );

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

  const ms = performance.now() - t0;
  logger.info({
    level: 'INFO',
    ingestor: true,
    urls: urls.length,
    totalChunks,
    ms,
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
