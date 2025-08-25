import type {
  IAgent,
  AgentStep,
  ChatResponseDTO,
  AgentContext,
} from './contracts.js';
import { logger } from '../common/logging/logger.service.js';

export class KnowledgeAgent implements IAgent {
  readonly name = 'KnowledgeAgent' as const;

  canHandle(): boolean {
    return true; // Router já decidiu
  }

  async handle(
    message: string,
    ctx: AgentContext,
    trail: AgentStep[],
  ): Promise<ChatResponseDTO> {
    const start = performance.now();

    // TODO: implementar RAG com fonte https://ajuda.infinitepay.io/pt-BR/
    // placeholder para não quebrar
    const answer = `Desculpe, ainda estou carregando a base de conhecimento. Pergunta: "${message}"`;

    const ms = performance.now() - start;
    logger.info({
      level: 'INFO',
      agent: 'KnowledgeAgent',
      conversation_id: ctx.conversation_id,
      user_id: ctx.user_id,
      execution_time: ms,
      source: 'ajuda.infinitepay.io',
    });

    return {
      response: answer,
      source_agent_response: 'source=ajuda.infinitepay.io',
      agent_workflow: [...trail, { agent: 'KnowledgeAgent' }],
    };
  }
}
