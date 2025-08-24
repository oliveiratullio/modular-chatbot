import type {
  AgentDecision,
  AgentResponse,
} from '../common/types/agent.types.js';
import { logger } from '../common/logging/logger.service.js';

export class KnowledgeAgent {
  async handle(query: string, trail: AgentDecision[]): Promise<AgentResponse> {
    const start = performance.now();
    const answer = `Stub RAG: buscando em https://ajuda.infinitepay.io/pt-BR/ → "${query}"`;
    const ms = performance.now() - start;

    logger.info({
      level: 'INFO',
      agent: 'KnowledgeAgent',
      execution_time: ms,
      source: 'ajuda.infinitepay.io',
      processed_content: query,
    });

    return {
      response: answer,
      source_agent_response: 'RAG answer (stub)',
      agent_workflow: [...trail, { agent: 'KnowledgeAgent' }],
      meta: { source: 'ajuda.infinitepay.io' },
    };
  }
}
