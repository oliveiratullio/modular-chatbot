import { logger } from '../common/logging/logger.service.js';
import type { AgentDecision } from '../common/types/agent.types.js';

export class RouterAgent {
  route(input: string): AgentDecision {
    const looksMathy =
      /[\d.\s+\-*/()x]+/.test(input) && /[+\-*/x]/i.test(input);

    const decision: AgentDecision = {
      agent: 'RouterAgent',
      decision: looksMathy ? 'MathAgent' : 'KnowledgeAgent',
      reason: looksMathy ? 'Detected arithmetic symbols' : 'Default to RAG',
    };
    logger.info({
      level: 'INFO',
      agent: 'RouterAgent',
      decision: decision.decision,
    });
    return decision;
  }
}
