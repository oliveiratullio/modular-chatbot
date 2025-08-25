import {
  type AgentResponse,
  type AgentContext,
  type AgentStep,
  type IAgent,
} from './contracts.js';
import { logger } from '../common/logging/logger.service.js';
import { Injectable } from '@nestjs/common';

const MATH_CHARS = /^[0-9.+*/()xX^ -]+$/;

@Injectable()
export class MathAgent implements IAgent {
  name = 'MathAgent' as const;

  // assíncrono para compat com interface
  async canHandle(message: string, _ctx: AgentContext): Promise<boolean> {
    const expr = message.replace(/x/gi, '*').replace(/\^/g, '**');
    return MATH_CHARS.test(expr);
  }

  async handle(
    message: string,
    _ctx: AgentContext,
    trail: AgentStep[],
  ): Promise<AgentResponse> {
    const expr = message.replace(/x/gi, '*').replace(/\^/g, '**');
    const start = performance.now();
    let result = NaN;

    try {
      if (!MATH_CHARS.test(expr)) {
        throw new Error('Invalid math expression');
      }
      // Avaliação controlada (sem acesso a escopo)

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

    const workflow = [...trail, { agent: 'MathAgent' as const }];
    return {
      response: `Result: ${result}`,
      source_agent_response: `expression=${expr}`,
      agent_workflow: workflow,
    };
  }
}
