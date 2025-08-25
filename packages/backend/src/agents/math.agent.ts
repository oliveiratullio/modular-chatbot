import type {
  IAgent,
  AgentStep,
  ChatResponseDTO,
  AgentContext,
} from './contracts.js';
import { logger } from '../common/logging/logger.service.js';

export class MathAgent implements IAgent {
  readonly name = 'MathAgent' as const;

  canHandle(): boolean {
    return true; // Router já decidiu
  }

  async handle(
    message: string,
    ctx: AgentContext,
    trail: AgentStep[],
  ): Promise<ChatResponseDTO> {
    const expr = message.replace(/x/gi, '*');
    const start = performance.now();

    try {
      if (!/^[\d.\s+\-*/()]+$/.test(expr)) {
        throw new Error('Invalid math expression');
      }

      const result = Function(`"use strict"; return (${expr});`)();

      const ms = performance.now() - start;
      logger.info({
        level: 'INFO',
        agent: 'MathAgent',
        conversation_id: ctx.conversation_id,
        user_id: ctx.user_id,
        execution_time: ms,
        expression: expr,
      });

      return {
        response: `Result: ${result}`,
        source_agent_response: `expression=${expr}`,
        agent_workflow: [...trail, { agent: 'MathAgent' }],
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error({
        level: 'ERROR',
        agent: 'MathAgent',
        conversation_id: ctx.conversation_id,
        user_id: ctx.user_id,
        error: msg,
      });
      throw e;
    }
  }
}
