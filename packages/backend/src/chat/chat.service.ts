import { Injectable, Inject } from '@nestjs/common';
import { AGENT_TOKENS } from '../agents/index.js';
import type {
  AgentContext,
  AgentStep,
  ChatResponseDTO,
  IRouterAgent,
} from '../agents/contracts.js';
import { MathAgent } from '../agents/math.agent.js';
import { KnowledgeAgent } from '../agents/knowledge.agent.js';
import { ChatHistoryRepository } from '../repositories/chat-history.repo.js';
import { AgentLogsRepository } from '../repositories/agent-logs.repo.js';
import { logger } from '../common/logging/logger.service.js';

function sanitizeInput(s: string): string {
  // remove tags e colapsa espaços
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);
}

@Injectable()
export class ChatService {
  constructor(
    @Inject(AGENT_TOKENS.RouterAgent) private readonly router: IRouterAgent,
    @Inject(AGENT_TOKENS.MathAgent) private readonly math: MathAgent,
    @Inject(AGENT_TOKENS.KnowledgeAgent)
    private readonly knowledge: KnowledgeAgent,
    private readonly history: ChatHistoryRepository,
    private readonly agentLogs: AgentLogsRepository,
  ) {}

  async handle(req: {
    message: string;
    user_id: string;
    conversation_id: string;
  }): Promise<ChatResponseDTO> {
    const startedAt = performance.now();
    const ctx: AgentContext = {
      conversation_id: req.conversation_id,
      user_id: req.user_id,
    };

    // 1) sanitize
    const clean = sanitizeInput(req.message);

    // 2) persist user message
    await this.history.append(req.conversation_id, {
      role: 'user',
      content: clean,
      ts: new Date().toISOString(),
    });

    // 3) router decide
    const trail: AgentStep[] = [];
    const decision = await this.router.route(clean, ctx);
    trail.push({ agent: 'RouterAgent', decision: decision.agent });

    // 4) chama agente escolhido
    const agentT0 = performance.now();
    let response: ChatResponseDTO;
    try {
      if (decision.agent === 'MathAgent') {
        response = await this.math.handle(clean, ctx, trail);
      } else {
        response = await this.knowledge.handle(clean, ctx, trail);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);

      // loga erro
      try {
        await this.agentLogs.log({
          level: 'ERROR',
          agent: decision.agent,
          conversation_id: req.conversation_id,
          user_id: req.user_id,
          message: 'agent_failed',
          error: errMsg,
          extra: { input_len: clean.length },
        });
      } catch (logErr) {
        logger.error({
          level: 'ERROR',
          scope: 'agentLogs.log',
          error: (logErr as Error).message,
        });
      }

      // mapeia para resposta segura
      return {
        response: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.',
        source_agent_response: '',
        agent_workflow: trail,
      };
    }
    const agentMs = performance.now() - agentT0;

    // 5) agrega workflow (o agente já devolveu trail acumulado)
    const final = response;

    // 6) persiste resposta no histórico
    await this.history.append(req.conversation_id, {
      role: 'assistant',
      content: final.response,
      ts: new Date().toISOString(),
    });

    // 7) log de sucesso
    try {
      await this.agentLogs.log({
        agent: decision.agent,
        level: 'INFO',
        conversation_id: req.conversation_id,
        user_id: req.user_id,
        workflow: final.agent_workflow,
        source: final.source_agent_response,
        duration_ms: agentMs,
        created_at: Date.now(),
        message: 'agent_success',
      });
    } catch (e) {
      logger.error({
        level: 'ERROR',
        scope: 'agentLogs.log',
        error: (e as Error).message,
      });
    }

    // 8) retorno
    const totalMs = performance.now() - startedAt;
    logger.info({
      level: 'INFO',
      flow: '/chat',
      conversation_id: req.conversation_id,
      total_ms: totalMs,
    });

    return final;
  }
}
