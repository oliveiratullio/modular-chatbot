import { Injectable } from '@nestjs/common';
import type {
  AgentContext,
  AgentStep,
  ChatResponseDTO,
  IAgent,
} from './contracts.js';
import { logger } from '../common/logging/logger.service.js';
import { OpenAIEmbeddingsAdapter } from './adapters/embeddings.adapter.js';
import { RedisVectorStoreAdapter } from './adapters/vectorstore.adapter.js';
import CryptoJS from 'crypto-js';

const TOP_K = Number(process.env.RAG_TOP_K ?? 5);

// contrato mínimo para o cliente de cache (evita usar `any`)
type CacheClient = {
  get(key: string): Promise<string | null>;
  setEx(key: string, ttlSeconds: number, value: string): Promise<void>;
};

@Injectable()
export class KnowledgeAgent implements IAgent {
  name = 'KnowledgeAgent' as const;

  private emb = new OpenAIEmbeddingsAdapter();

  // Lazy init do VectorStore
  private vs?: RedisVectorStoreAdapter;
  private vsReady = false;
  private vsInitPromise?: Promise<void>;

  async canHandle(_message: string, _ctx: AgentContext): Promise<boolean> {
    // Router decide; este agente sempre pode lidar
    return true;
  }

  private normalizeQuery(q: string) {
    return q.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private cacheKey(q: string) {
    const norm = this.normalizeQuery(q);
    const hash = CryptoJS.SHA1(norm).toString();
    const ns = process.env.REDIS_NAMESPACE ?? 'rag';
    return `${ns}:cache:q:${hash}`;
  }

  /** Inicializa o VectorStore apenas quando necessário; tolera ausência de REDIS_URL */
  private async ensureVectorStore(): Promise<void> {
    if (this.vsReady) return;
    if (this.vsInitPromise) return this.vsInitPromise;

    this.vsInitPromise = (async () => {
      const url = process.env.REDIS_URL;
      if (!url) {
        logger.info({
          level: 'INFO',
          agent: 'KnowledgeAgent',
          message: 'REDIS_URL not set → RAG disabled',
        });
        this.vsReady = false;
        return;
      }

      try {
        this.vs = new RedisVectorStoreAdapter(this.emb);
        await this.vs.ensureIndex();
        this.vsReady = true;
        logger.info({
          level: 'INFO',
          agent: 'KnowledgeAgent',
          message: 'RAG online (RedisVectorStore ready)',
        });
      } catch (e) {
        logger.error({
          level: 'ERROR',
          agent: 'KnowledgeAgent',
          message: 'Failed to init RedisVectorStore. Running without RAG.',
          error: (e as Error).message,
        });
        this.vsReady = false;
      }
    })();

    return this.vsInitPromise;
  }

  /** Tenta obter um cliente de cache de dentro do VectorStore, de forma segura (sem `any`). */
  private getCacheClient(): CacheClient | null {
    // Fazemos um “type narrowing” seguro a partir de `unknown`
    const maybe = this.vs as unknown as { client?: unknown } | undefined;
    const cli = maybe?.client as
      | (CacheClient & Record<string, unknown>)
      | undefined;

    if (
      cli &&
      typeof cli.get === 'function' &&
      typeof cli.setEx === 'function'
    ) {
      return cli;
    }
    return null;
  }

  private buildAnswer(answer: string, sources: string[]) {
    const tail = sources.length
      ? `\n\nFontes:\n${sources.map((u) => `- ${u}`).join('\n')}`
      : '';
    return `${answer}${tail}`;
  }

  async handle(
    message: string,
    ctx: AgentContext,
    trail: AgentStep[],
  ): Promise<ChatResponseDTO> {
    const t0 = performance.now();

    await this.ensureVectorStore();

    // Cache curto via Redis (se disponível)
    let cached: { answer: string; sources: string[] } | null = null;
    const cacheClient = this.getCacheClient();
    if (this.vsReady && cacheClient) {
      try {
        const raw = await cacheClient.get(this.cacheKey(message));
        if (raw)
          cached = JSON.parse(raw) as { answer: string; sources: string[] };
      } catch {
        // ignora cache errors
      }
    }

    if (cached) {
      const resp = this.buildAnswer(cached.answer, cached.sources);
      logger.info({
        level: 'INFO',
        agent: 'KnowledgeAgent',
        cache: 'hit',
        sources: cached.sources,
      });
      return {
        response: resp,
        source_agent_response: cached.sources.join(' | '),
        agent_workflow: [...trail, { agent: 'KnowledgeAgent' }],
      };
    }

    let chunks: Array<{
      text: string;
      metadata: Record<string, unknown>;
      score?: number;
    }> = [];
    let searchMs = 0;

    if (this.vsReady && this.vs) {
      const searchT0 = performance.now();
      try {
        chunks = await this.vs.similaritySearch(message, TOP_K);
      } catch (e) {
        logger.error({
          level: 'ERROR',
          agent: 'KnowledgeAgent',
          message: 'similaritySearch failed',
          error: (e as Error).message,
        });
        chunks = [];
      }
      searchMs = performance.now() - searchT0;
    }

    const sources = Array.from(
      new Set(
        chunks
          .map((c) => String((c.metadata?.url ?? '') as string).trim())
          .filter(Boolean),
      ),
    );

    // Heurística simples de “resumo”
    let answer: string;
    if (chunks.length === 0) {
      answer =
        'Não tenho certeza com base na base atual. ' +
        (this.vsReady
          ? ''
          : 'O módulo de conhecimento está indisponível no momento.');
    } else {
      const summary = chunks
        .map((c) =>
          (c.text || '').split('\n').slice(0, 3).join(' ').slice(0, 300),
        )
        .join('\n- ');
      answer = `- ${summary}`;
    }

    const fullMs = performance.now() - t0;
    logger.info({
      level: 'INFO',
      agent: 'KnowledgeAgent',
      execution_time_ms: fullMs,
      embedding_lookup_ms: searchMs,
      sources,
      conversation_id: ctx.conversation_id,
      user_id: ctx.user_id,
    });

    // salva cache (se possível)
    if (this.vsReady && cacheClient) {
      try {
        await cacheClient.setEx(
          this.cacheKey(message),
          60,
          JSON.stringify({ answer, sources }),
        );
      } catch {
        // ignore
      }
    }

    const response = this.buildAnswer(answer, sources);
    return {
      response,
      source_agent_response: sources.join(' | '),
      agent_workflow: [...trail, { agent: 'KnowledgeAgent' }],
    };
  }
}
