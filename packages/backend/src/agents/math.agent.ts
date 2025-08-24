import type {
  AgentDecision,
  AgentResponse,
} from '../common/types/agent.types.js';
import { logger } from '../common/logging/logger.service.js';

export class MathAgent {
  async handle(
    message: string,
    trail: AgentDecision[],
  ): Promise<AgentResponse> {
    const expr = message.replace(/x/gi, '*');
    let result = NaN;
    const start = performance.now();
    try {
      if (!/^[\d.\s+\-*/()]+$/.test(expr)) {
        throw new Error('Invalid math expression');
      }

      result = Function(`"use strict"; return (${expr});`)();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error({ level: 'ERROR', agent: 'MathAgent', error: msg });
      throw e;
    } finally {
      const ms = performance.now() - start;
      logger.info({
        level: 'INFO',
        agent: 'MathAgent',
        execution_time: ms,
        expression: expr,
      });
    }

    return {
      response: `Result: ${result}`,
      source_agent_response: `expression=${expr}`,
      agent_workflow: [...trail, { agent: 'MathAgent' }],
    };
  }
}
