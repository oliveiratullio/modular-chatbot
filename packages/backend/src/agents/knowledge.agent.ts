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
import OpenAI from 'openai';

const TOP_K = Number(process.env.RAG_TOP_K ?? 5);
const ANSWER_MODEL = process.env.RAG_ANSWER_MODEL ?? 'gpt-4o-mini';

// cliente mínimo p/ cache
type CacheClient = {
  get(key: string): Promise<string | null>;
  setEx(key: string, ttlSeconds: number, value: string): Promise<void>;
};

@Injectable()
export class KnowledgeAgent implements IAgent {
  name = 'KnowledgeAgent' as const;

  private emb = new OpenAIEmbeddingsAdapter();
  private vs?: RedisVectorStoreAdapter;
  private vsReady = false;
  private vsInitPromise?: Promise<void>;
  private llm = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async canHandle(_message: string, _ctx: AgentContext): Promise<boolean> {
    return true;
  }

  private normalizeForSearch(q: string) {
    const plain = q
      .replace(/[“”„‟]|[‘’‚‛]/g, '"')
      .replace(/[¿¡]/g, ' ')
      .replace(/[!?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plain
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenizeCore(q: string) {
    return q
      .toLowerCase()
      .replace(/[^a-z0-9áàâãéêíóôõúç\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cacheKey(q: string) {
    const norm = this.normalizeForSearch(q);
    const hash = CryptoJS.SHA1(norm).toString();
    const ns = process.env.REDIS_NAMESPACE ?? 'rag';
    return `${ns}:cache:v2:q:${hash}`; // v2 para invalidar cache antigo
  }

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

  private getCacheClient(): CacheClient | null {
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

  private stripNoiseForPrompt(text: string): string {
    // o htmlToCleanText já removeu quase tudo; aqui só uma passada final
    let t = text.replace(/\s{2,}/g, ' ').trim();
    // tira rodapés/menus que tenham escapado
    const extra: RegExp[] = [
      /Artigos relacionados.*$/gim,
      /Respondeu à sua pergunta\?.*$/gim,
    ];
    for (const re of extra) t = t.replace(re, ' ');
    return t.replace(/\s+/g, ' ').trim();
  }

  private safeTruncate(text: string, max = 9000): string {
    if (text.length <= max) return text;
    const slice = text.slice(0, max);
    const lastSpace = slice.lastIndexOf(' ');
    return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim() + '…';
  }

  private buildAnswer(answer: string, _sources: string[]) {
    // Não anexar fontes - elas já vão no campo source_agent_response separado
    return answer;
  }

  private async synthesizeAnswer(
    question: string,
    sources: Array<{ url: string; text: string }>,
  ): Promise<string> {
    const contextBlocks = sources
      .map(
        (s, i) =>
          `### FONTE ${i + 1}\n${this.safeTruncate(this.stripNoiseForPrompt(s.text), 9000)}`,
      )
      .join('\n\n');

    // prompt com orientação para respostas diretas ("Sim/Não" quando aplicável)
    const prompt = [
      'Você é um assistente de suporte da InfinitePay.',
      'Responda SOMENTE com base nas fontes fornecidas abaixo.',
      'Se a pergunta comportar resposta "sim" ou "não", COMEÇE com "Sim," ou "Não," e explique em 1–2 frases.',
      'Se não houver informação suficiente, diga "Não tenho essa informação nas fontes fornecidas."',
      'Seja conciso, direto e evite copiar texto de UI/menus. Use bullet points apenas quando necessário.',
      'IMPORTANTE: NÃO mencione URLs, links, fontes, "Fontes:" ou qualquer referência a páginas na sua resposta.',
      'Responda APENAS o conteúdo factual sem mencionar de onde veio a informação.',
      '',
      contextBlocks,
      '',
      '### PERGUNTA',
      question,
      '',
      '### RESPOSTA',
    ].join('\n');

    const completion = await this.llm.chat.completions.create({
      model: ANSWER_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Responda de forma factual, direta e concisa. Não invente.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    const txt = completion.choices[0]?.message?.content?.trim() ?? '';

    // Remove qualquer menção a fontes que possa ter escapado
    const cleanedTxt = txt
      .replace(/Fontes?:\s*-?\s*https?:\/\/[^\s\n]+/gi, '')
      .replace(/https?:\/\/[^\s\n]+/g, '')
      .replace(/Fonte[s]?\s*[:.-]\s*/gi, '')
      .replace(/\n\s*-\s*https?:\/\/[^\s\n]+/g, '')
      .trim();

    return cleanedTxt || 'Não tenho essa informação nas fontes fornecidas.';
  }

  async handle(
    message: string,
    ctx: AgentContext,
    trail: AgentStep[],
  ): Promise<ChatResponseDTO> {
    const t0 = performance.now();
    await this.ensureVectorStore();

    // cache
    let cached: { answer: string; sources: string[] } | null = null;
    const cacheClient = this.getCacheClient();
    if (this.vsReady && cacheClient) {
      try {
        const raw = await cacheClient.get(this.cacheKey(message));
        if (raw)
          cached = JSON.parse(raw) as { answer: string; sources: string[] };
      } catch {
        // Ignorar erros silenciosamente
      }
    }
    if (cached?.sources?.length) {
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

    // recall
    let chunks: Array<{
      text: string;
      metadata: Record<string, unknown>;
      score?: number;
    }> = [];
    let usedQuery = '(none)';
    let searchMs = 0;

    if (this.vsReady && this.vs) {
      const searchT0 = performance.now();
      try {
        const q1 = this.normalizeForSearch(message);
        usedQuery = q1;
        chunks = await this.vs.similaritySearch(q1, TOP_K);

        if (chunks.length === 0) {
          const q2 = this.tokenizeCore(message)
            .split(' ')
            .filter((t) => t.length > 2)
            .slice(0, 10)
            .join(' ');
          if (q2) {
            usedQuery = q2;
            chunks = await this.vs.similaritySearch(q2, TOP_K);
          }
        }
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

    // URLs únicas
    const urls = Array.from(
      new Set(
        chunks
          .map((c) => String((c.metadata?.url ?? '') as string).trim())
          .filter(Boolean),
      ),
    );

    // síntese
    let finalAnswer = '';
    let answerSources: string[] = [];

    if (this.vsReady && this.vs && urls.length > 0) {
      const topUrls = urls.slice(0, 3);
      const fullTexts: Array<{ url: string; text: string }> = [];

      for (const url of topUrls) {
        const raw = await this.vs.loadRaw(url);
        if (raw && raw.trim().length > 0) {
          fullTexts.push({ url, text: raw });
        }
      }

      if (fullTexts.length > 0) {
        try {
          finalAnswer = await this.synthesizeAnswer(message, fullTexts);
          answerSources = topUrls;
        } catch (e) {
          logger.error({
            level: 'ERROR',
            agent: 'KnowledgeAgent',
            message: 'LLM synthesis failed',
            error: (e as Error).message,
          });
        }
      }
    }

    // fallback simples se síntese falhar ou recall vazio
    if (!finalAnswer) {
      if (urls.length === 0) {
        finalAnswer =
          'Não tenho essa informação nas fontes fornecidas. ' +
          (this.vsReady
            ? ''
            : 'O módulo de conhecimento está indisponível no momento.');
      } else {
        const summary = chunks
          .map((c) => {
            const raw = String(c.text || '');
            const excerpt = raw.replace(/\s+/g, ' ').slice(0, 300).trim();
            return `- ${excerpt}`;
          })
          .join('\n');
        finalAnswer = summary;
        answerSources = urls.slice(0, 3);
      }
    }

    // logs
    try {
      const topScores = (chunks || [])
        .map((c) => {
          const n = typeof c.score === 'number' ? c.score : Number(c.score);
          return Number.isFinite(n) ? Number(n.toFixed(4)) : n;
        })
        .slice(0, 5);

      logger.info({
        level: 'INFO',
        agent: 'KnowledgeAgent',
        message: 'search_summary',
        search_results: chunks.length,
        used_query: usedQuery,
        top_scores: topScores,
      });
    } catch {
      // Ignorar erros silenciosamente
    }

    const fullMs = performance.now() - t0;
    logger.info({
      level: 'INFO',
      agent: 'KnowledgeAgent',
      execution_time_ms: fullMs,
      embedding_lookup_ms: searchMs,
      sources: answerSources,
      conversation_id: ctx.conversation_id,
      user_id: ctx.user_id,
    });

    const response = this.buildAnswer(finalAnswer, answerSources);

    // cache curto quando temos fontes
    const cache = this.getCacheClient();
    if (this.vsReady && cache && answerSources.length > 0) {
      try {
        await cache.setEx(
          this.cacheKey(message),
          60,
          JSON.stringify({ answer: finalAnswer, sources: answerSources }),
        );
      } catch {
        // Ignorar erros silenciosamente
      }
    }

    return {
      response,
      source_agent_response: answerSources.join(' | '),
      agent_workflow: [...trail, { agent: 'KnowledgeAgent' }],
    };
  }
}
