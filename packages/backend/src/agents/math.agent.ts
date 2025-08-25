// packages/backend/src/agents/math.agent.ts
import type {
  AgentContext,
  AgentResponse,
  AgentStep,
  IAgent,
} from './contracts.js';
import { logger } from '../common/logging/logger.service.js';

export class MathAgent implements IAgent {
  public readonly name = 'MathAgent' as const;

  canHandle(message: string): boolean {
    // heurística simples: contém dígitos e algum operador comum
    return /\d/.test(message) && /[+\-*/x^()]/i.test(message);
  }

  async handle(
    message: string,
    _ctx: AgentContext,
    trail: AgentStep[],
  ): Promise<AgentResponse> {
    // normalizações: x -> *, ^ -> **, vírgula -> ponto
    const normalized = message
      .replace(/x/gi, '*')
      .replace(/\^/g, '**')
      .replace(/,/g, '.');

    // validação bem restritiva (apenas números, espaços, ., + - * / ( ) e *)
    // Observação: ** é permitido implicitamente por permitir '*'
    const leftover = normalized.replace(/[0-9+\-*/().\s]/g, '');
    if (leftover !== '') {
      logger.error({
        level: 'ERROR',
        agent: this.name,
        error: `Invalid characters in expression: ${JSON.stringify(leftover)}`,
      });
      throw new Error('Invalid math expression');
    }

    const start = performance.now();
    let result: unknown;

    try {
      result = Function(`"use strict"; return (${normalized});`)();
      if (typeof result !== 'number' || !Number.isFinite(result)) {
        throw new Error('Computation did not return a finite number');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error({ level: 'ERROR', agent: this.name, error: msg });
      throw new Error('MATH_EVAL_FAILED');
    } finally {
      const ms = performance.now() - start;
      logger.info({
        level: 'INFO',
        agent: this.name,
        execution_time_ms: ms,
        expression: normalized,
      });
    }

    // mantenha o rastro dos agentes
    trail.push({ agent: this.name });

    return {
      response: `Result: ${result as number}`,
      source_agent_response: `expression=${normalized}`,
      agent_workflow: trail,
    };
  }
}
