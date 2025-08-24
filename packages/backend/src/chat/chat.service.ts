import type { AgentResponse } from '../common/types/agent.types.js';
import { RouterAgent } from '../agents/router.agent.js';
import { KnowledgeAgent } from '../agents/knowledge.agent.js';
import { MathAgent } from '../agents/math.agent.js';

export class ChatService {
  private router = new RouterAgent();
  private knowledge = new KnowledgeAgent();
  private math = new MathAgent();

  async handle(message: string): Promise<AgentResponse> {
    const trail = [this.router.route(message)];
    if (trail[0]?.decision === 'MathAgent') {
      return this.math.handle(message, trail);
    }
    return this.knowledge.handle(message, trail);
  }
}
