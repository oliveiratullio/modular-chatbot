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
    const hasOp = /[+\-*/^x]/i.test(message);
    if (hasDigit && hasOp) {
      return { agent: 'MathAgent' };
    }
    return { agent: 'KnowledgeAgent' };
  }
}
