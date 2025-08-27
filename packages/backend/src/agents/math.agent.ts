import {
  type AgentResponse,
  type AgentContext,
  type AgentStep,
  type IAgent,
} from './contracts.js';
import { logger } from '../common/logging/logger.service.js';
import { Injectable } from '@nestjs/common';

const MATH_CHARS = /^[0-9.+*/()xX^ -]+$/;
const HAS_DIGIT = /\d/;
const HAS_OP = /[+\-*/^x]/i;

function extractExpression(message: string): string | null {
  // Mantém apenas caracteres matemáticos básicos
  const filtered = message
    .replace(/[^0-9.+*/()xX^ -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!filtered) return null;
  // Verifica se há ao menos um dígito e um operador
  if (!HAS_DIGIT.test(filtered) || !HAS_OP.test(filtered)) return null;
  return filtered;
}

@Injectable()
export class MathAgent implements IAgent {
  name = 'MathAgent' as const;

  // assíncrono para compat com interface
  async canHandle(message: string, _ctx: AgentContext): Promise<boolean> {
    // Detecta presença de dígitos e operador em qualquer lugar do texto
    return HAS_DIGIT.test(message) && HAS_OP.test(message);
  }

  async handle(
    message: string,
    _ctx: AgentContext,
    trail: AgentStep[],
  ): Promise<AgentResponse> {
    const raw = extractExpression(message);
    const expr = (raw ?? message).replace(/x/gi, '*').replace(/\^/g, '**');
    const start = performance.now();
    let result = NaN;

    try {
      if (
        !MATH_CHARS.test(expr) ||
        !(HAS_DIGIT.test(expr) && HAS_OP.test(expr))
      ) {
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
