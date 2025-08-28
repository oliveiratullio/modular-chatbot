import { RedisVectorStore } from '@langchain/community/vectorstores/redis';
import { createClient, type RedisClientType } from 'redis';
import type { Document } from '@langchain/core/documents';
import type { IEmbeddingsAdapter } from './embeddings.adapter.js';

export interface IVectorStoreAdapter {
  ensureIndex(): Promise<void>;
  upsert(
    points: { id: string; text: string; metadata: Record<string, unknown> }[],
  ): Promise<void>;
  similaritySearch(
    query: string,
    k: number,
  ): Promise<
    Array<{ text: string; metadata: Record<string, unknown>; score: number }>
  >;
  saveRaw(url: string, text: string): Promise<void>;
  loadRaw(url: string): Promise<string | null>;
  diagnostics(): Promise<{
    indexName: string;
    keyPrefix: string;
    indexExists: boolean;
    indexDocCount: number;
    keyCount: number;
    fallbackKeyCount: number;
    sampleKeys: string[];
    sampleDocIds: string[];
  }>;
}

export class RedisVectorStoreAdapter implements IVectorStoreAdapter {
  private readonly indexName: string;
  private readonly keyPrefix: string;
  private client: RedisClientType;
  private store?: RedisVectorStore;

  constructor(private readonly emb: IEmbeddingsAdapter) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL is required for vector store');

    this.indexName = process.env.REDIS_NAMESPACE
      ? `${process.env.REDIS_NAMESPACE}:index`
      : 'rag:index';
    this.keyPrefix = process.env.REDIS_NAMESPACE
      ? `${process.env.REDIS_NAMESPACE}:doc:`
      : 'rag:doc:';

    this.client = createClient({ url });
  }

  private async connect(): Promise<void> {
    if (!this.client.isOpen) await this.client.connect();
  }

  private async getStore(): Promise<RedisVectorStore> {
    if (this.store) return this.store;
    await this.connect();
    this.store = new RedisVectorStore(this.emb, {
      redisClient: this.client,
      indexName: this.indexName,
      keyPrefix: this.keyPrefix,
    });
    return this.store;
  }

  async ensureIndex(): Promise<void> {
    await this.getStore();
  }

  async upsert(
    points: { id: string; text: string; metadata: Record<string, unknown> }[],
  ): Promise<void> {
    const store = await this.getStore();

    // particiona em lotes pequenos para não estourar rate limit do provedor
    const batchSize = Number(process.env.RAG_EMBED_BATCH ?? 8);

    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);

      const texts = batch.map((p) => p.text);
      const vectors = await this.embedWithRetry(texts);

      const docs: Document[] = batch.map((p) => ({
        pageContent: p.text,
        metadata: p.metadata,
      }));
      const ids = batch.map((p) => p.id);

      try {
        // Assinatura esperada: addVectors(vectors, docs, keys)
        await (
          store as unknown as {
            addVectors: (
              vectors: number[][],
              docs: Document[],
              ids: string[],
            ) => Promise<void>;
          }
        ).addVectors(vectors, docs, ids);
      } catch {
        // Fallback: algumas versões só suportam addDocuments(docs, { keys })
        await store.addDocuments(docs, { keys: ids });
      }
    }
  }

  async similaritySearch(
    query: string,
    k: number,
  ): Promise<
    Array<{ text: string; metadata: Record<string, unknown>; score: number }>
  > {
    const store = await this.getStore();
    const results = await store.similaritySearchWithScore(query, k);
    return results.map(([doc, score]) => ({
      text: doc.pageContent,
      metadata: doc.metadata as Record<string, unknown>,
      score,
    }));
  }

  async saveRaw(url: string, text: string): Promise<void> {
    await this.connect();
    const rawKey = `${this.keyPrefix}raw:${Buffer.from(url).toString('base64')}`;
    await this.client.set(rawKey, text);
  }

  async loadRaw(url: string): Promise<string | null> {
    await this.connect();
    const rawKey = `${this.keyPrefix}raw:${Buffer.from(url).toString('base64')}`;
    return await this.client.get(rawKey);
  }

  /**
   * Diagnóstico completo:
   * - FT.INFO para pegar `num_docs`
   * - FT.SEARCH * LIMIT 0 10 para amostrar docIds
   * - SCAN prefixo configurado (ex.: rag:doc:*)
   * - SCAN fallback `doc:*` (caso a lib ignore prefixo em alguma versão)
   */
  async diagnostics(): Promise<{
    indexName: string;
    keyPrefix: string;
    indexExists: boolean;
    indexDocCount: number;
    keyCount: number;
    fallbackKeyCount: number;
    sampleKeys: string[];
    sampleDocIds: string[];
  }> {
    await this.connect();

    let indexExists = true;
    let indexDocCount = 0;
    let sampleDocIds: string[] = [];
    try {
      const info = await this.client.sendCommand(['FT.INFO', this.indexName]);
      // o retorno é uma lista [k1, v1, k2, v2, ...]
      if (Array.isArray(info)) {
        for (let i = 0; i < info.length; i += 2) {
          const key = String(info[i]);
          if (key.toLowerCase() === 'num_docs') {
            const raw = info[i + 1];
            indexDocCount =
              typeof raw === 'number' ? raw : Number(raw ?? 0) || 0;
          }
        }
      }
      // Amostra de ids
      const search = (await this.client.sendCommand([
        'FT.SEARCH',
        this.indexName,
        '*',
        'NOCONTENT',
        'LIMIT',
        '0',
        '10',
      ])) as unknown;
      // Resposta típica: [ total, id1, id2, ... ]
      if (Array.isArray(search) && search.length > 1) {
        sampleDocIds = (search.slice(1) as string[]).map(String);
      }
    } catch {
      indexExists = false;
    }

    const keyCount = await this.scanCountByPrefix(this.keyPrefix);
    const fallbackKeyCount = await this.scanCountByPrefix('doc:');
    const sampleKeys =
      keyCount > 0
        ? await this.sampleKeysByPrefix(this.keyPrefix, 5)
        : await this.sampleKeysByPrefix('doc:', 5);

    return {
      indexName: this.indexName,
      keyPrefix: this.keyPrefix,
      indexExists,
      indexDocCount,
      keyCount,
      fallbackKeyCount,
      sampleKeys,
      sampleDocIds,
    };
  }

  private async scanCountByPrefix(prefix: string): Promise<number> {
    let count = 0;
    try {
      for await (const _ of this.client.scanIterator({
        MATCH: `${prefix}*`,
        COUNT: 1000,
      })) {
        count += 1;
      }
    } catch {
      // ignore scan errors
    }
    return count;
  }

  private async sampleKeysByPrefix(prefix: string, max = 5): Promise<string[]> {
    const out: string[] = [];
    try {
      for await (const key of this.client.scanIterator({
        MATCH: `${prefix}*`,
        COUNT: 200,
      })) {
        out.push(String(key));
        if (out.length >= max) break;
      }
    } catch {
      // ignore scan errors
    }
    return out;
  }

  private async embedWithRetry(texts: string[]): Promise<number[][]> {
    const maxRetries = Number(process.env.RAG_EMBED_RETRIES ?? 3);
    const backoffMs = Number(process.env.RAG_EMBED_BACKOFF_MS ?? 1000);
    let attempt = 0;

    while (true) {
      try {
        const out = await this.emb.embedDocuments(texts as unknown as string[]);
        // normaliza para number[][]
        return (out as unknown as Array<number[] | Float32Array>).map((v) =>
          Array.from(v as Float32Array | number[]),
        );
      } catch (e) {
        attempt += 1;
        if (attempt > maxRetries) throw e;
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
}
