import type { IRouterAgent, AgentDecision, AgentContext } from './contracts.js';
import { logger } from '../common/logging/logger.service.js';

export class RouterAgent implements IRouterAgent {
  readonly name = 'RouterAgent' as const;

  async route(message: string, ctx: AgentContext): Promise<AgentDecision> {
    const trimmed = message.trim();

    const mathLike = /^[\d.\s+\-*/()x]+$/i.test(trimmed);
    const decision: AgentDecision = mathLike
      ? { agent: 'MathAgent', reason: 'regex_math_like' }
      : { agent: 'KnowledgeAgent', reason: 'default_knowledge' };

    logger.info({
      level: 'INFO',
      agent: 'RouterAgent',
      conversation_id: ctx.conversation_id,
      user_id: ctx.user_id,
      decision: decision.agent,
      reason: decision.reason,
    });

    return decision;
  }
}
