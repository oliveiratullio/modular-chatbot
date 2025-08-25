import type {
  IRouterAgent,
  RouterDecision,
  AgentContext,
} from './contracts.js';

export class RouterAgent implements IRouterAgent {
  async route(message: string, _ctx: AgentContext): Promise<RouterDecision> {
    if (/[\d+\-*/^x]/.test(message)) {
      return { agent: 'MathAgent' };
    }
    return { agent: 'KnowledgeAgent' };
  }
}
