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
    const texts = points.map((p) => p.text);
    const vectors = await this.emb.embedDocuments(texts);

    const docs: Document[] = points.map((p) => ({
      pageContent: p.text,
      metadata: p.metadata,
    }));
    const ids = points.map((p) => p.id);

    await store.addVectors(vectors, docs, { keys: ids });
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
}
