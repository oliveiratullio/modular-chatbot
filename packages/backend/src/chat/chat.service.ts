import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
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
import { HistoryService } from '../services/history.service.js';
import { logger } from '../common/logging/logger.service.js';
import { basicPromptInjectionGuard } from '../utils/sanitize.js';

function sanitizeInput(s: string): string {
  // remove tags e colapsa espaços
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);
}

function enforceInjectionPolicy(message: string) {
  if (basicPromptInjectionGuard(message)) {
    throw new ForbiddenException({ error_code: 'PROMPT_INJECTION_DETECTED' });
  }
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
    private readonly historyService: HistoryService,
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

    // 1) sanitize + proteção simples de prompt-injection
    const clean = sanitizeInput(req.message);
    enforceInjectionPolicy(clean);

    // 2) persist user message (tolerante à ausência de history repo)
    if (this.history && typeof this.history.append === 'function') {
      await this.history.append(req.conversation_id, {
        role: 'user',
        content: clean,
        ts: new Date().toISOString(),
      });
    } else {
      logger.warn({
        level: 'WARN',
        scope: 'ChatService',
        message: 'ChatHistoryRepository not available (skip persist user msg)',
      });
    }

    // 2.1) salva pergunta no histórico de perguntas
    if (this.historyService) {
      logger.info({
        level: 'INFO',
        scope: 'ChatService',
        message: 'Salvando pergunta no histórico',
        user_id: req.user_id,
        conversation_id: req.conversation_id,
        question: clean,
      });
      await this.historyService.saveQuestion(
        clean,
        req.user_id,
        req.conversation_id,
      );
    } else {
      logger.warn({
        level: 'WARN',
        scope: 'ChatService',
        message: 'HistoryService not available (skip save question)',
      });
    }

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
      if (this.agentLogs && typeof this.agentLogs.log === 'function') {
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
      } else {
        logger.warn({
          level: 'WARN',
          scope: 'ChatService',
          message: 'AgentLogsRepository not available (skip error log)',
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

    // 6) persiste resposta no histórico (tolerante)
    if (this.history && typeof this.history.append === 'function') {
      await this.history.append(req.conversation_id, {
        role: 'assistant',
        content: final.response,
        ts: new Date().toISOString(),
      });
    }

    // 7) log de sucesso
    if (this.agentLogs && typeof this.agentLogs.log === 'function') {
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
