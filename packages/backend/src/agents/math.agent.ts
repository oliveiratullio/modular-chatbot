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
// Operadores válidos: + - * / ^ e x somente entre dígitos
const HAS_OP = /[+\-*/^]/i;
const HAS_X_BETWEEN_DIGITS = /\d\s*[xX]\s*\d/;

function extractExpression(message: string): string | null {
  // Mantém apenas caracteres matemáticos básicos
  const filtered = message
    .replace(/[^0-9.+*/()xX^ -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!filtered) return null;
  // Verifica se há ao menos um dígito e um operador válido
  if (
    !HAS_DIGIT.test(filtered) ||
    !(HAS_OP.test(filtered) || HAS_X_BETWEEN_DIGITS.test(filtered))
  )
    return null;
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
    // Normaliza: somente converte 'x' para '*' quando está entre dígitos
    const expr = (raw ?? message)
      .replace(/(\d)\s*[xX]\s*(\d)/g, '$1*$2')
      .replace(/\^/g, '**');
    const start = performance.now();
    let result = NaN;

    try {
      if (
        !MATH_CHARS.test(expr) ||
        !HAS_DIGIT.test(expr) ||
        !(HAS_OP.test(expr) || HAS_X_BETWEEN_DIGITS.test(expr))
      ) {
        throw new Error('Invalid math expression');
      }
      // checagens simples
      if (/\/\s*0(?![\d.])/.test(expr)) {
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
