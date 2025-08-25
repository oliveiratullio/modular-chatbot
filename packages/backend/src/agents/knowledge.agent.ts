import { Injectable } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
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
const CACHE_TTL_SECONDS = 60;

@Injectable()
export class KnowledgeAgent implements IAgent {
  name = 'KnowledgeAgent' as const;

  private readonly emb = new OpenAIEmbeddingsAdapter();
  private readonly vs = new RedisVectorStoreAdapter(this.emb);

  // cache opcional via Redis (sem acessar internals do vectorstore)
  private redisClient?: RedisClientType;
  private redisReady = false;

  private async ensureRedis(): Promise<void> {
    if (this.redisReady) return;
    const url = process.env.REDIS_URL;
    if (!url) return; // sem redis
    this.redisClient = createClient({ url });
    try {
      await this.redisClient.connect();
      this.redisReady = true;
    } catch {
      this.redisReady = false; // segue sem cache
    }
  }

  async canHandle(_message: string, _ctx: AgentContext): Promise<boolean> {
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

    // garante índice do vector store (cria em primeiro uso)
    await this.vs.ensureIndex();

    // tenta cache
    await this.ensureRedis();
    if (this.redisReady && this.redisClient) {
      try {
        const cached = await this.redisClient.get(this.cacheKey(message));
        if (cached) {
          const parsed = JSON.parse(cached) as {
            answer: string;
            sources: string[];
          };
          const resp = this.buildAnswer(parsed.answer, parsed.sources);
          logger.info({
            level: 'INFO',
            agent: 'KnowledgeAgent',
            cache: 'hit',
            sources: parsed.sources,
          });
          return {
            response: resp,
            source_agent_response: parsed.sources.join(' | '),
            agent_workflow: [...trail, { agent: 'KnowledgeAgent' }],
          };
        }
      } catch {
        // noop – se falhar cache, segue normal
      }
    }

    const lookupStart = performance.now();
    const chunks = await this.vs.similaritySearch(message, TOP_K);
    const lookupMs = performance.now() - lookupStart;

    const sources = Array.from(
      new Set(
        chunks
          .map((c) => String((c.metadata?.url ?? '') as string).trim())
          .filter(Boolean),
      ),
    );

    // geração simplificada (sem LLM): sumariza os trechos recuperados
    let answer: string;
    if (chunks.length === 0) {
      answer = 'Não tenho certeza com base na base atual.';
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
      embedding_lookup_ms: lookupMs,
      sources,
      user_id: ctx.user_id,
      conversation_id: ctx.conversation_id,
    });

    // escreve no cache (best-effort)
    if (this.redisReady && this.redisClient) {
      try {
        await this.redisClient.setEx(
          this.cacheKey(message),
          CACHE_TTL_SECONDS,
          JSON.stringify({ answer, sources }),
        );
      } catch {
        // noop
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
