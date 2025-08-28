import { Injectable } from '@nestjs/common';
import type {
  AgentContext,
  IRouterAgent,
  IRouterDecision,
} from './contracts.js';

@Injectable()
export class RouterAgent implements IRouterAgent {
  async route(message: string, _ctx: AgentContext): Promise<IRouterDecision> {
    // regra simples: tem dígito e tem algum operador => MathAgent
    const hasDigit = /\d/.test(message);
    // considera 'x' como operador apenas quando entre dígitos (com espaços opcionais)
    const hasOp = /[+\-*/^]/.test(message) || /\d\s*[xX]\s*\d/.test(message);
    if (hasDigit && hasOp) {
      return { agent: 'MathAgent' };
    }
    return { agent: 'KnowledgeAgent' };
  }
}
