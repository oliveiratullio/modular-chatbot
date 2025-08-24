import type { AgentResponse } from '../common/types/agent.types.js';
import { RouterAgent } from '../agents/router.agent.js';
import { KnowledgeAgent } from '../agents/knowledge.agent.js';
import { MathAgent } from '../agents/math.agent.js';
import { Injectable } from '@nestjs/common';
import {
  ChatHistoryRepository,
  type ChatMessage,
} from '../repositories/chat-history.repo.js';
import {
  AgentLogsRepository,
  type AgentLog,
} from '../repositories/agent-logs.repo.js';
import { UserConversationsRepository } from '../repositories/user-conversations.repo.js';

@Injectable()
export class ChatService {
  private router = new RouterAgent();
  private knowledge = new KnowledgeAgent();
  private math = new MathAgent();

  constructor(
    private readonly historyRepo: ChatHistoryRepository,
    private readonly logsRepo: AgentLogsRepository,
    private readonly userConvsRepo: UserConversationsRepository,
  ) {}

  async handle(
    message: string,
    meta?: { userId?: string; conversationId?: string },
  ): Promise<AgentResponse> {
    const now = new Date().toISOString();
    const convId = meta?.conversationId ?? 'unknown';
    const userId = meta?.userId ?? 'unknown';

    // índice de conversas do usuário
    if (meta?.userId && meta?.conversationId) {
      await this.userConvsRepo.add(userId, convId);
    }

    // salva a entrada do usuário
    const userMsg: ChatMessage = { role: 'user', content: message, ts: now };
    await this.historyRepo.append(convId, userMsg);

    // roteia
    const trail = [this.router.route(message)];

    // log do roteamento
    const routerLog: AgentLog = {
      ts: now,
      level: 'INFO',
      agent: 'RouterAgent',
      message: `decision=${trail[0]?.decision}`,
      data: { reason: trail[0]?.reason, sample: message.slice(0, 120) },
    };
    await this.logsRepo.push(convId, routerLog);

    // executa agente e salva resposta
    const result =
      trail[0]?.decision === 'MathAgent'
        ? await this.math.handle(message, trail)
        : await this.knowledge.handle(message, trail);

    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: result.response,
      ts: new Date().toISOString(),
      agent:
        trail[0]?.decision === 'MathAgent' ? 'MathAgent' : 'KnowledgeAgent',
    };
    await this.historyRepo.append(convId, assistantMsg);

    await this.logsRepo.push(convId, {
      ts: new Date().toISOString(),
      level: 'INFO',
      agent: assistantMsg.agent!,
      data: { workflow: result.agent_workflow },
    });

    return result;
  }
}
