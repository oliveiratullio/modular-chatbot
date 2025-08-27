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
}

export class RedisVectorStoreAdapter implements IVectorStoreAdapter {
  private readonly indexName: string;
  private readonly keyPrefix: string;
  private client: RedisClientType;
  private store?: RedisVectorStore;
  private readonly embedBatchSize: number;
  private readonly embedMaxRetries: number;
  private readonly embedBackoffMs: number;

  constructor(private readonly emb: IEmbeddingsAdapter) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL is required for vector store');

    this.indexName = process.env.REDIS_NAMESPACE
      ? `${process.env.REDIS_NAMESPACE}:index`
      : 'rag:index';
    this.keyPrefix = process.env.REDIS_NAMESPACE
      ? `${process.env.REDIS_NAMESPACE}:doc:`
      : 'rag:doc:';

    // v4: sem modules
    this.client = createClient({ url });

    // Controle de throughput p/ evitar 429 do provedor de embeddings
    this.embedBatchSize = Number(process.env.RAG_EMBED_BATCH ?? 8);
    this.embedMaxRetries = Number(process.env.RAG_EMBED_RETRIES ?? 3);
    this.embedBackoffMs = Number(process.env.RAG_EMBED_BACKOFF_MS ?? 1000);
  }

  private async connect(): Promise<void> {
    if (!this.client.isOpen) await this.client.connect();
  }

  private async getStore(): Promise<RedisVectorStore> {
    if (this.store) return this.store;
    await this.connect();
    this.store = new RedisVectorStore(this.emb, {
      redisClient: this.client, // v4 compatível
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

    for (let i = 0; i < points.length; i += this.embedBatchSize) {
      const batch = points.slice(i, i + this.embedBatchSize);
      const texts = batch.map((p) => p.text);

      // Retry com backoff exponencial para 429 e erros transitórios
      const vectors = await this.embedWithRetry(texts);

      const docs: Document[] = batch.map((p) => ({
        pageContent: p.text,
        metadata: p.metadata,
      }));
      const ids = batch.map((p) => p.id);

      await store.addVectors(vectors, docs, { keys: ids });
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
    return results.map(([doc, score]: [Document, number]) => ({
      text: doc.pageContent,
      metadata: doc.metadata as Record<string, unknown>,
      score,
    }));
  }

  private async embedWithRetry(texts: string[]) {
    let attempt = 0;

    while (true) {
      try {
        return await this.emb.embedDocuments(texts);
      } catch (e) {
        attempt += 1;
        if (attempt > this.embedMaxRetries) throw e;
        const delay = this.embedBackoffMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
}
